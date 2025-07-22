package repository

import (
	"context"
	"errors"
	"fmt"

	"app/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SummaryRepository defines summary-related DB operations
type SummaryRepository interface {
	GetSummaryByLectureID(ctx context.Context, lectureID string) (*model.Summary, error)
}

// summaryRepository is the DB implementation of SummaryRepository
type summaryRepository struct {
	pool *pgxpool.Pool
}

// NewSummaryRepository creates a new SummaryRepository
func NewSummaryRepository(pool *pgxpool.Pool) SummaryRepository {
	return &summaryRepository{pool: pool}
}

// GetSummaryByLectureID retrieves the summary record for a given lecture
func (r *summaryRepository) GetSummaryByLectureID(ctx context.Context, lectureID string) (*model.Summary, error) {
	query := `SELECT lecture_id, content, created_at, updated_at FROM summaries WHERE lecture_id = $1`
	var s model.Summary
	err := r.pool.QueryRow(ctx, query, lectureID).Scan(&s.LectureID, &s.Content, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("getting summary for lecture %s: %w", lectureID, err)
	}
	return &s, nil
}
