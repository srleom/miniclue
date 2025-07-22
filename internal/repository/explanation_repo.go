package repository

import (
	"app/internal/model"
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// ExplanationRepository defines explanation-related DB operations
type ExplanationRepository interface {
	GetExplanationsByLectureID(ctx context.Context, lectureID string, limit, offset int) ([]model.Explanation, error)
}

// explanationRepository is the DB implementation of ExplanationRepository
type explanationRepository struct {
	pool *pgxpool.Pool
}

// NewExplanationRepository creates a new ExplanationRepository
func NewExplanationRepository(pool *pgxpool.Pool) ExplanationRepository {
	return &explanationRepository{pool: pool}
}

// GetExplanationsByLectureID retrieves explanation records for a given lecture with pagination
func (r *explanationRepository) GetExplanationsByLectureID(ctx context.Context, lectureID string, limit, offset int) ([]model.Explanation, error) {
	query := fmt.Sprintf(`SELECT id, lecture_id, slide_number, content, created_at, updated_at FROM explanations WHERE lecture_id = $1 ORDER BY slide_number LIMIT %d OFFSET %d`, limit, offset)

	rows, err := r.pool.Query(ctx, query, lectureID)
	if err != nil {
		return nil, fmt.Errorf("querying explanations for lecture %s: %w", lectureID, err)
	}
	defer rows.Close()

	explanations := []model.Explanation{}
	for rows.Next() {
		var e model.Explanation
		if err := rows.Scan(&e.ID, &e.LectureID, &e.SlideNumber, &e.Content, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scanning explanation row: %w", err)
		}
		explanations = append(explanations, e)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating explanation rows: %w", err)
	}
	return explanations, nil
}
