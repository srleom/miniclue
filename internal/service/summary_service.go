package service

import (
	"context"

	"app/internal/model"
	"app/internal/repository"

	"github.com/rs/zerolog"
)

// SummaryService defines summary-related operations
// GetSummaryByLectureID retrieves a lecture's summary, returns nil,nil if none exists
type SummaryService interface {
	GetSummaryByLectureID(ctx context.Context, lectureID string) (*model.Summary, error)
}

// summaryService is the implementation of SummaryService
type summaryService struct {
	repo          repository.SummaryRepository
	summaryLogger zerolog.Logger
}

// NewSummaryService creates a new SummaryService
func NewSummaryService(repo repository.SummaryRepository, logger zerolog.Logger) SummaryService {
	return &summaryService{
		repo:          repo,
		summaryLogger: logger.With().Str("service", "SummaryService").Logger(),
	}
}

// GetSummaryByLectureID retrieves the summary for a given lecture
func (s *summaryService) GetSummaryByLectureID(ctx context.Context, lectureID string) (*model.Summary, error) {
	summary, err := s.repo.GetSummaryByLectureID(ctx, lectureID)
	if err != nil {
		s.summaryLogger.Error().Err(err).Str("lecture_id", lectureID).Msg("Failed to get summary by lecture ID")
		return nil, err
	}
	return summary, nil
}
