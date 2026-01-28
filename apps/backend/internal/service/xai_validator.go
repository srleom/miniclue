package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	xaiBaseURL                = "https://api.x.ai/v1"
	xaiChatCompletionEndpoint = "/chat/completions"
)

// XAIValidator validates X.AI API keys by making a test API call
type XAIValidator interface {
	ValidateAPIKey(ctx context.Context, apiKey string) error
}

type xaiValidator struct {
	client  *http.Client
	baseURL string
}

// NewXAIValidator creates a new X.AI API key validator
func NewXAIValidator() XAIValidator {
	return &xaiValidator{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		baseURL: xaiBaseURL,
	}
}

// ValidateAPIKey validates an X.AI API key by making a test call to the chat completions endpoint
func (v *xaiValidator) ValidateAPIKey(ctx context.Context, apiKey string) error {
	if apiKey == "" {
		return fmt.Errorf("API key cannot be empty")
	}

	// Create a minimal test request body for chat completion
	// Using max_tokens: 1 to minimize cost and response time
	requestBody := map[string]interface{}{
		"model": "grok-4-1-fast-non-reasoning",
		"messages": []map[string]string{
			{"role": "user", "content": "test"},
		},
		"max_tokens":  1,
		"temperature": 0,
	}

	bodyJSON, err := json.Marshal(requestBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request body: %w", err)
	}

	// Create request to X.AI chat completions endpoint
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, v.baseURL+xaiChatCompletionEndpoint, bytes.NewReader(bodyJSON))
	if err != nil {
		return fmt.Errorf("failed to create validation request: %w", err)
	}

	// Set authorization header
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	// Make the request
	resp, err := v.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to validate API key: %w", err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	// Read response body for error details
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read validation response: %w", err)
	}

	// Check status code
	if resp.StatusCode == http.StatusUnauthorized {
		var errorResp struct {
			Error struct {
				Message string `json:"message"`
				Type    string `json:"type"`
			} `json:"error"`
		}
		if err := json.Unmarshal(body, &errorResp); err == nil && errorResp.Error.Message != "" {
			return fmt.Errorf("invalid API key: %s", errorResp.Error.Message)
		}
		return fmt.Errorf("invalid API key: unauthorized")
	}

	if resp.StatusCode != http.StatusOK {
		var errorResp struct {
			Error struct {
				Message string `json:"message"`
				Type    string `json:"type"`
			} `json:"error"`
		}
		if err := json.Unmarshal(body, &errorResp); err == nil && errorResp.Error.Message != "" {
			return fmt.Errorf("API key validation failed: %s", errorResp.Error.Message)
		}
		return fmt.Errorf("API key validation failed: HTTP %d", resp.StatusCode)
	}

	return nil
}
