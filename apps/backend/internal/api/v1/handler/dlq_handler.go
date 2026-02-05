package handler

import (
	"context"

	"app/internal/api/v1/operation"
	"app/internal/service"

	"github.com/danielgtaylor/huma/v2"
	"github.com/rs/zerolog"
)

type DLQHandler struct {
	service service.DLQService
	logger  zerolog.Logger
}

func NewDLQHandler(s service.DLQService, l zerolog.Logger) *DLQHandler {
	return &DLQHandler{service: s, logger: l}
}

func (h *DLQHandler) RecordDLQ(ctx context.Context, input *operation.RecordDLQInput) (*operation.RecordDLQOutput, error) {
	// Validate message structure
	if input.Body.Message.MessageID == "" {
		return nil, huma.Error400BadRequest("Invalid Pub/Sub message format: missing message ID")
	}

	h.logger.Info().
		Str("messageId", input.Body.Message.MessageID).
		Str("subscription", input.Body.Subscription).
		Msg("Processing dead-letter queue message")

	if err := h.service.ProcessAndSave(ctx, &input.Body); err != nil {
		h.logger.Error().Err(err).Msg("Failed to save DLQ message to database")
		// Still return 204 to Pub/Sub to prevent retries of a message that is already in the DLQ.
		// The error is logged for offline analysis.
		return &operation.RecordDLQOutput{}, nil
	}

	h.logger.Info().
		Str("messageId", input.Body.Message.MessageID).
		Msg("Successfully processed and saved DLQ message")

	return &operation.RecordDLQOutput{}, nil
}
