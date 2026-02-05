package handler

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"app/internal/api/v1/dto"
	"app/internal/api/v1/operation"
	"app/internal/middleware"
	"app/internal/model"
	"app/internal/service"

	"github.com/danielgtaylor/huma/v2"
	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog"
)

type ChatHandler struct {
	chatService service.ChatService
	logger      zerolog.Logger
}

func NewChatHandler(chatService service.ChatService, logger zerolog.Logger) *ChatHandler {
	return &ChatHandler{
		chatService: chatService,
		logger:      logger,
	}
}

// GetChats retrieves all chats for a lecture
func (h *ChatHandler) GetChats(ctx context.Context, input *operation.GetChatsInput) (*operation.GetChatsOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	chats, err := h.chatService.ListChats(ctx, input.LectureID, userID, input.Limit, input.Offset)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to retrieve chats", err)
	}

	// Convert to DTOs
	dtos := make([]dto.ChatResponseDTO, 0, len(chats))
	for _, chat := range chats {
		dtos = append(dtos, dto.ChatResponseDTO{
			ID:        chat.ID,
			LectureID: chat.LectureID,
			UserID:    chat.UserID,
			Title:     chat.Title,
			CreatedAt: chat.CreatedAt,
			UpdatedAt: chat.UpdatedAt,
		})
	}

	return &operation.GetChatsOutput{Body: dtos}, nil
}

// GetChat retrieves a specific chat by ID
func (h *ChatHandler) GetChat(ctx context.Context, input *operation.GetChatInput) (*operation.GetChatOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	chat, err := h.chatService.GetChat(ctx, input.ChatID, userID)
	if err != nil {
		if err == service.ErrChatNotFound {
			return nil, huma.Error404NotFound("Chat not found")
		}
		return nil, huma.Error500InternalServerError("Failed to get chat", err)
	}

	return &operation.GetChatOutput{
		Body: dto.ChatResponseDTO{
			ID:        chat.ID,
			LectureID: chat.LectureID,
			UserID:    chat.UserID,
			Title:     chat.Title,
			CreatedAt: chat.CreatedAt,
			UpdatedAt: chat.UpdatedAt,
		},
	}, nil
}

// CreateChat creates a new chat for a lecture
func (h *ChatHandler) CreateChat(ctx context.Context, input *operation.CreateChatInput) (*operation.CreateChatOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	// Default title if not provided
	title := "New Chat"
	if input.Body.Title != nil && *input.Body.Title != "" {
		title = *input.Body.Title
	}

	chat, err := h.chatService.CreateChat(ctx, input.LectureID, userID, title)
	if err != nil {
		if err == service.ErrLectureNotFound || err == service.ErrUnauthorized {
			return nil, huma.Error404NotFound("Lecture not found")
		}
		return nil, huma.Error500InternalServerError("Failed to create chat", err)
	}

	return &operation.CreateChatOutput{
		Body: dto.ChatResponseDTO{
			ID:        chat.ID,
			LectureID: chat.LectureID,
			UserID:    chat.UserID,
			Title:     chat.Title,
			CreatedAt: chat.CreatedAt,
			UpdatedAt: chat.UpdatedAt,
		},
	}, nil
}

// UpdateChat updates a chat's title
func (h *ChatHandler) UpdateChat(ctx context.Context, input *operation.UpdateChatInput) (*operation.UpdateChatOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	if input.Body.Title == nil || *input.Body.Title == "" {
		return nil, huma.Error400BadRequest("Title is required")
	}

	chat, err := h.chatService.UpdateChat(ctx, input.ChatID, userID, *input.Body.Title)
	if err != nil {
		if err == service.ErrChatNotFound || err == service.ErrUnauthorized {
			return nil, huma.Error404NotFound("Chat not found")
		}
		return nil, huma.Error500InternalServerError("Failed to update chat", err)
	}

	return &operation.UpdateChatOutput{
		Body: dto.ChatResponseDTO{
			ID:        chat.ID,
			LectureID: chat.LectureID,
			UserID:    chat.UserID,
			Title:     chat.Title,
			CreatedAt: chat.CreatedAt,
			UpdatedAt: chat.UpdatedAt,
		},
	}, nil
}

// DeleteChat deletes a chat and all its messages
func (h *ChatHandler) DeleteChat(ctx context.Context, input *operation.DeleteChatInput) (*operation.DeleteChatOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	err = h.chatService.DeleteChat(ctx, input.ChatID, userID)
	if err != nil {
		if err == service.ErrChatNotFound || err == service.ErrUnauthorized {
			return nil, huma.Error404NotFound("Chat not found")
		}
		return nil, huma.Error500InternalServerError("Failed to delete chat", err)
	}

	return &operation.DeleteChatOutput{}, nil
}

// StreamChat handles SSE streaming for chat responses
// This is mounted as a raw HTTP handler on the Chi router
func (h *ChatHandler) StreamChat(w http.ResponseWriter, r *http.Request) {
	// Extract path parameters from Chi
	lectureID := chi.URLParam(r, "lectureId")
	chatID := chi.URLParam(r, "chatId")

	// Get user ID from context (set by auth middleware)
	userID, ok := r.Context().Value(middleware.UserContextKey).(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: User ID not found in context", http.StatusUnauthorized)
		return
	}

	// Decode request body
	var req dto.ChatStreamRequestDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Convert DTO to model
	messageParts := make(model.MessageParts, len(req.Parts))
	for i, part := range req.Parts {
		var ref *model.Reference
		if part.Reference != nil {
			ref = &model.Reference{
				Type:     part.Reference.Type,
				ID:       part.Reference.ID,
				Metadata: part.Reference.Metadata,
			}
		}
		var data *model.ReferencePart
		if part.Data != nil {
			data = &model.ReferencePart{
				Type: part.Data.Type,
				Text: part.Data.Text,
			}
			if part.Data.Reference != nil {
				data.Reference = &model.Reference{
					Type:     part.Data.Reference.Type,
					ID:       part.Data.Reference.ID,
					Metadata: part.Data.Reference.Metadata,
				}
			}
		}
		messageParts[i] = model.MessagePart{
			Type:      part.Type,
			Text:      part.Text,
			Reference: ref,
			Data:      data,
		}
	}

	// Save user message first
	userMetadata := map[string]interface{}{
		"model": req.Model,
	}
	userMessage, err := h.chatService.CreateMessage(r.Context(), chatID, userID, "user", messageParts, userMetadata)
	if err != nil {
		if err == service.ErrChatNotFound || err == service.ErrUnauthorized {
			http.Error(w, "Chat not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to create message: "+err.Error(), http.StatusInternalServerError)
		return
	}
	_ = userMessage // User message saved

	// Stream response from Python service
	stream, err := h.chatService.StreamChatResponse(r.Context(), lectureID, chatID, userID, messageParts, req.Model)
	if err != nil {
		if err == service.ErrChatNotFound || err == service.ErrUnauthorized || err == service.ErrLectureNotFound {
			http.Error(w, "Chat or lecture not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to stream chat response: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer func() {
		if err := stream.Close(); err != nil {
			h.logger.Error().Err(err).Msg("Failed to close stream")
		}
	}()

	// Set SSE headers - ALL 5 REQUIRED HEADERS
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")             // Disable nginx buffering
	w.Header().Set("x-vercel-ai-ui-message-stream", "v1") // Required for AI SDK Data Stream Protocol
	w.WriteHeader(http.StatusOK)

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}

	// Read from Python service stream and convert to AI SDK Data Stream Protocol
	reader := bufio.NewReader(stream)
	var fullContent strings.Builder
	// Generate a unique text part ID for this stream
	textPartID := fmt.Sprintf("part_%s_%d", chatID, time.Now().UnixNano())

	// Send text-start part (SDK will create the message internally)
	textStartPart := map[string]interface{}{
		"type": "text-start",
		"id":   textPartID,
	}
	textStartJSON, _ := json.Marshal(textStartPart)
	if _, err := fmt.Fprintf(w, "data: %s\n\n", textStartJSON); err != nil {
		h.logger.Error().Err(err).Msg("Failed to write text-start part")
		return
	}
	flusher.Flush()

	for {
		// Check for context cancellation (client disconnect)
		select {
		case <-r.Context().Done():
			h.logger.Debug().Msg("Stream stopped by client disconnect")
			return
		default:
			// Continue streaming
		}

		chunk, err := service.ParseSSEChunk(reader)
		if err != nil {
			if err == io.EOF {
				break
			}
			// If the context was canceled, it's likely a user-initiated stop
			if errors.Is(err, context.Canceled) || errors.Is(r.Context().Err(), context.Canceled) {
				h.logger.Debug().Err(err).Msg("Stream reading stopped by user (context canceled)")
			} else {
				h.logger.Error().Err(err).Msg("Error reading from Python service stream")
			}
			break
		}

		content, ok := chunk["content"].(string)
		if !ok {
			h.logger.Warn().Interface("chunk", chunk).Msg("Chunk missing or invalid content field, skipping")
			continue
		}

		done, _ := chunk["done"].(bool)

		// Stream text delta
		fullContent.WriteString(content)
		textDeltaPart := map[string]interface{}{
			"type":  "text-delta",
			"id":    textPartID,
			"delta": content,
		}
		textDeltaJSON, _ := json.Marshal(textDeltaPart)
		if _, err := fmt.Fprintf(w, "data: %s\n\n", textDeltaJSON); err != nil {
			h.logger.Error().Err(err).Msg("Failed to write text-delta part")
			return
		}
		flusher.Flush()

		if done {
			break
		}
	}

	// Send text-end part
	textEndPart := map[string]interface{}{
		"type": "text-end",
		"id":   textPartID,
	}
	textEndJSON, _ := json.Marshal(textEndPart)
	if _, err := fmt.Fprintf(w, "data: %s\n\n", textEndJSON); err != nil {
		if errors.Is(r.Context().Err(), context.Canceled) {
			h.logger.Debug().Err(err).Msg("Failed to write text-end part: client disconnected")
		} else {
			h.logger.Error().Err(err).Msg("Failed to write text-end part")
		}
	} else {
		flusher.Flush()
	}

	// Send finish part
	finishPart := map[string]interface{}{
		"type": "finish",
	}
	finishJSON, _ := json.Marshal(finishPart)
	if _, err := fmt.Fprintf(w, "data: %s\n\n", finishJSON); err != nil {
		if errors.Is(r.Context().Err(), context.Canceled) {
			h.logger.Debug().Err(err).Msg("Failed to write finish part: client disconnected")
		} else {
			h.logger.Error().Err(err).Msg("Failed to write finish part")
		}
	} else {
		flusher.Flush()
	}

	// Send [DONE] marker to terminate stream
	if _, err := fmt.Fprintf(w, "data: [DONE]\n\n"); err != nil {
		if errors.Is(r.Context().Err(), context.Canceled) {
			h.logger.Debug().Err(err).Msg("Failed to write [DONE] marker: client disconnected")
		} else {
			h.logger.Error().Err(err).Msg("Failed to write [DONE] marker")
		}
	} else {
		flusher.Flush()
	}

	// Save assistant message
	if fullContent.Len() > 0 {
		contentStr := fullContent.String()
		assistantParts := model.MessageParts{
			{Type: "text", Text: contentStr},
		}
		assistantMetadata := map[string]interface{}{
			"model": req.Model,
		}

		// Use background context for saving the message, as the request context might be canceled
		// if the user stopped the response halfway. We still want to save the partial response.
		saveCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		_, err := h.chatService.CreateMessage(saveCtx, chatID, userID, "assistant", assistantParts, assistantMetadata)
		if err != nil {
			h.logger.Error().Err(err).Str("chat_id", chatID).Msg("Failed to save assistant message")
		} else {
			// Check if this is the first conversation (user + assistant = 2 messages) and trigger title generation
			messageCount, err := h.chatService.GetMessageCount(saveCtx, chatID, userID)
			if err == nil && messageCount == 2 {
				// This is the first conversation - generate title from both messages
				// Title generation happens asynchronously, frontend will poll for updates
				// Use background context with timeout instead of request context (which gets canceled)
				titleCtx, titleCancel := context.WithTimeout(context.Background(), 30*time.Second)
				go func() {
					defer titleCancel()
					h.chatService.GenerateAndUpdateTitle(
						titleCtx,
						lectureID,
						chatID,
						userID,
						messageParts,   // User message
						assistantParts, // Assistant response
					)
				}()
			}
		}
	} else {
		h.logger.Warn().Str("chat_id", chatID).Msg("No content to save for assistant message")
	}
}

// ListMessages retrieves all messages for a chat
func (h *ChatHandler) ListMessages(ctx context.Context, input *operation.ListMessagesInput) (*operation.ListMessagesOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	messages, err := h.chatService.ListMessages(ctx, input.ChatID, userID, input.Limit)
	if err != nil {
		if err == service.ErrChatNotFound || err == service.ErrUnauthorized {
			return nil, huma.Error404NotFound("Chat not found")
		}
		return nil, huma.Error500InternalServerError("Failed to list messages", err)
	}

	// Convert to DTOs
	dtos := make([]dto.MessageResponseDTO, 0, len(messages))
	for _, msg := range messages {
		parts := make([]dto.MessagePartDTO, len(msg.Parts))
		for j, part := range msg.Parts {
			var ref *dto.ReferenceDTO
			if part.Reference != nil {
				ref = &dto.ReferenceDTO{
					Type:     part.Reference.Type,
					ID:       part.Reference.ID,
					Metadata: part.Reference.Metadata,
				}
			}
			var data *dto.ReferencePartDTO
			if part.Data != nil {
				data = &dto.ReferencePartDTO{
					Type: part.Data.Type,
					Text: part.Data.Text,
				}
				if part.Data.Reference != nil {
					data.Reference = &dto.ReferenceDTO{
						Type:     part.Data.Reference.Type,
						ID:       part.Data.Reference.ID,
						Metadata: part.Data.Reference.Metadata,
					}
				}
			}
			parts[j] = dto.MessagePartDTO{
				Type:      part.Type,
				Text:      part.Text,
				Reference: ref,
				Data:      data,
			}
		}
		dtos = append(dtos, dto.MessageResponseDTO{
			ID:        msg.ID,
			ChatID:    msg.ChatID,
			Role:      msg.Role,
			Parts:     parts,
			CreatedAt: msg.CreatedAt,
		})
	}

	return &operation.ListMessagesOutput{Body: dtos}, nil
}
