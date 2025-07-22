package service

import (
	"context"
	"errors"

	"app/internal/model"
	"app/internal/repository"

	"github.com/jackc/pgx/v5"
	"github.com/rs/zerolog"
)

// NoteService defines note-related operations, assuming one note per lecture.
type NoteService interface {
	// GetNoteByLectureID retrieves the note for a given lecture.
	GetNoteByLectureID(ctx context.Context, lectureID string) (*model.Note, error)
	// UpdateNoteByLectureID finds a note by lecture ID and updates its content.
	UpdateNoteByLectureID(ctx context.Context, lectureID, content string) (*model.Note, error)
	// CreateNoteByLectureID creates a new note for a given lecture.
	CreateNoteByLectureID(ctx context.Context, userID, lectureID, content string) (*model.Note, error)
	// DeleteNoteByLectureID deletes the note associated with a given lecture.
	DeleteNoteByLectureID(ctx context.Context, lectureID string) error
}

// noteService is the implementation of NoteService.
type noteService struct {
	repo       repository.NoteRepository
	noteLogger zerolog.Logger
}

// NewNoteService creates a new NoteService.
func NewNoteService(repo repository.NoteRepository, logger zerolog.Logger) NoteService {
	return &noteService{
		repo:       repo,
		noteLogger: logger.With().Str("service", "NoteService").Logger(),
	}
}

// GetNoteByLectureID retrieves the note for a given lecture.
func (s *noteService) GetNoteByLectureID(ctx context.Context, lectureID string) (*model.Note, error) {
	note, err := s.repo.GetNoteByLectureID(ctx, lectureID)
	if err != nil {
		s.noteLogger.Error().Err(err).Str("lecture_id", lectureID).Msg("Failed to get note by lecture ID")
		return nil, err
	}
	return note, nil
}

// UpdateNoteByLectureID updates an existing note's content.
func (s *noteService) UpdateNoteByLectureID(ctx context.Context, lectureID, content string) (*model.Note, error) {
	updatedNote, err := s.repo.UpdateNoteByLectureID(ctx, lectureID, content)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			s.noteLogger.Warn().Str("lecture_id", lectureID).Msg("Attempted to update a non-existent note")
			return nil, err // Let the handler decide if this is a 404
		}
		s.noteLogger.Error().Err(err).Str("lecture_id", lectureID).Msg("Failed to update note by lecture ID")
		return nil, err
	}
	return updatedNote, nil
}

// CreateNoteByLectureID creates a new note for a lecture.
// It assumes the database has a UNIQUE constraint on lecture_id to prevent duplicates.
func (s *noteService) CreateNoteByLectureID(ctx context.Context, userID, lectureID, content string) (*model.Note, error) {
	createdNote, err := s.repo.CreateNoteByLectureID(ctx, userID, lectureID, content)
	if err != nil {
		s.noteLogger.Error().Err(err).Str("lecture_id", lectureID).Str("user_id", userID).Msg("Failed to create note")
		return nil, err
	}
	return createdNote, nil
}

// DeleteNoteByLectureID deletes a note for a given lecture.
func (s *noteService) DeleteNoteByLectureID(ctx context.Context, lectureID string) error {
	err := s.repo.DeleteNoteByLectureID(ctx, lectureID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			s.noteLogger.Warn().Str("lecture_id", lectureID).Msg("Attempted to delete a non-existent note")
			return nil // A delete on a non-existent item is not a failure.
		}
		s.noteLogger.Error().Err(err).Str("lecture_id", lectureID).Msg("Failed to delete note by lecture ID")
		return err
	}
	return nil
}
