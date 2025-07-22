package dto

import "time"

// LectureNoteCreateDTO defines the request body for creating a new note.
type LectureNoteCreateDTO struct {
	Content string `json:"content" validate:"required"`
}

// LectureNoteUpdateDTO defines the request body for updating an existing note.
type LectureNoteUpdateDTO struct {
	Content string `json:"content" validate:"required"`
}

// LectureNoteResponseDTO defines the response body for a lecture note.
type LectureNoteResponseDTO struct {
	ID        string    `json:"id"`
	LectureID string    `json:"lecture_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
