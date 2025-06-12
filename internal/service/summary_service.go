package service

import (
	"context"

	"app/internal/model"
	"app/internal/repository"
)

// SummaryService defines summary-related operations
// GetSummaryByLectureID retrieves a lecture's summary
// returns nil, nil if no summary exists
type SummaryService interface {
	GetSummaryByLectureID(ctx context.Context, lectureID string) (*model.Summary, error)
	// CreateSummaryByLectureID creates or updates a lecture summary
	CreateSummaryByLectureID(ctx context.Context, lectureID string, content string) (*model.Summary, error)
}

// summaryService is the implementation of SummaryService
type summaryService struct {
	repo repository.SummaryRepository
}

// NewSummaryService creates a new SummaryService
func NewSummaryService(repo repository.SummaryRepository) SummaryService {
	return &summaryService{repo: repo}
}

// GetSummaryByLectureID retrieves a lecture's summary
func (s *summaryService) GetSummaryByLectureID(ctx context.Context, lectureID string) (*model.Summary, error) {
	return s.repo.GetSummaryByLectureID(ctx, lectureID)
}

// CreateSummaryByLectureID creates or updates a lecture summary via repository
func (s *summaryService) CreateSummaryByLectureID(ctx context.Context, lectureID string, content string) (*model.Summary, error) {
	return s.repo.CreateSummaryByLectureID(ctx, lectureID, content)
}
