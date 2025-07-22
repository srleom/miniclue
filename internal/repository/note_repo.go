package repository

import (
	"context"
	"errors"
	"fmt"

	"app/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// NoteRepository defines note-related DB operations.
// It assumes a one-to-one relationship between a lecture and a note.
type NoteRepository interface {
	// GetNoteByLectureID retrieves the note for a given lecture.
	GetNoteByLectureID(ctx context.Context, lectureID string) (*model.Note, error)
	// UpdateNoteByLectureID updates a note's content for the given lecture and returns the updated note.
	UpdateNoteByLectureID(ctx context.Context, lectureID string, content string) (*model.Note, error)
	// CreateNoteByLectureID creates a note for the given lecture and returns the created note.
	CreateNoteByLectureID(ctx context.Context, userID string, lectureID string, content string) (*model.Note, error)
	// DeleteNoteByLectureID deletes the note for a given lecture.
	DeleteNoteByLectureID(ctx context.Context, lectureID string) error
}

// noteRepository is the DB implementation of NoteRepository.
type noteRepository struct {
	pool *pgxpool.Pool
}

// NewNoteRepository creates a new NoteRepository.
func NewNoteRepository(pool *pgxpool.Pool) NoteRepository {
	return &noteRepository{pool: pool}
}

// GetNoteByLectureID retrieves the single note record for a given lecture.
func (r *noteRepository) GetNoteByLectureID(ctx context.Context, lectureID string) (*model.Note, error) {
	query := `SELECT id, user_id, lecture_id, content, created_at, updated_at FROM notes WHERE lecture_id = $1`
	var n model.Note
	err := r.pool.QueryRow(ctx, query, lectureID).Scan(&n.ID, &n.UserID, &n.LectureID, &n.Content, &n.CreatedAt, &n.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil // No note found is not an error in this context.
		}
		return nil, fmt.Errorf("querying note for lecture %s: %w", lectureID, err)
	}
	return &n, nil
}

// UpdateNoteByLectureID updates a note's content and returns the updated record.
func (r *noteRepository) UpdateNoteByLectureID(ctx context.Context, lectureID string, content string) (*model.Note, error) {
	query := `UPDATE notes SET content = $1, updated_at = NOW() WHERE lecture_id = $2 RETURNING id, user_id, lecture_id, content, created_at, updated_at`
	var n model.Note
	err := r.pool.QueryRow(ctx, query, content, lectureID).Scan(&n.ID, &n.UserID, &n.LectureID, &n.Content, &n.CreatedAt, &n.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("updating note for lecture %s: %w", lectureID, err)
	}
	return &n, nil
}

// CreateNoteByLectureID creates a note record for the given lecture and returns the created note.
// This assumes a UNIQUE constraint on the 'lecture_id' column to enforce one note per lecture.
func (r *noteRepository) CreateNoteByLectureID(ctx context.Context, userID string, lectureID string, content string) (*model.Note, error) {
	query := `INSERT INTO notes (user_id, lecture_id, content) VALUES ($1, $2, $3) RETURNING id, user_id, lecture_id, content, created_at, updated_at`
	var n model.Note
	err := r.pool.QueryRow(ctx, query, userID, lectureID, content).Scan(&n.ID, &n.UserID, &n.LectureID, &n.Content, &n.CreatedAt, &n.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("creating note for lecture %s by user %s: %w", lectureID, userID, err)
	}
	return &n, nil
}

// DeleteNoteByLectureID deletes a note for a given lecture.
func (r *noteRepository) DeleteNoteByLectureID(ctx context.Context, lectureID string) error {
	query := `DELETE FROM notes WHERE lecture_id = $1`
	ct, err := r.pool.Exec(ctx, query, lectureID)
	if err != nil {
		return fmt.Errorf("deleting note for lecture %s: %w", lectureID, err)
	}
	if ct.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}
