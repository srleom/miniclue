package service

import (
	"context"

	"app/internal/model"
	"app/internal/repository"

	"github.com/rs/zerolog"
)

// ExplanationService defines explanation-related operations
// GetExplanationsByLectureID retrieves explanations for a given lecture with pagination, returns empty slice if none
type ExplanationService interface {
	GetExplanationsByLectureID(ctx context.Context, lectureID string, limit, offset int) ([]model.Explanation, error)
}

// explanationService is the implementation of ExplanationService
type explanationService struct {
	repo              repository.ExplanationRepository
	explanationLogger zerolog.Logger
}

// NewExplanationService creates a new ExplanationService
func NewExplanationService(repo repository.ExplanationRepository, logger zerolog.Logger) ExplanationService {
	return &explanationService{
		repo:              repo,
		explanationLogger: logger.With().Str("service", "ExplanationService").Logger(),
	}
}

// GetExplanationsByLectureID retrieves explanations for a lecture
func (s *explanationService) GetExplanationsByLectureID(ctx context.Context, lectureID string, limit, offset int) ([]model.Explanation, error) {
	explanations, err := s.repo.GetExplanationsByLectureID(ctx, lectureID, limit, offset)
	if err != nil {
		s.explanationLogger.Error().Err(err).Str("lecture_id", lectureID).Msg("Failed to get explanations by lecture ID")
		return nil, err
	}
	return explanations, nil
}
