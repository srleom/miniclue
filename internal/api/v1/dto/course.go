package dto

import "time"

// CourseCreateDTO is used for incoming course creation requests
type CourseCreateDTO struct {
	Title       string  `json:"title" validate:"required"`
	Description *string `json:"description,omitempty"`
	IsDefault   *bool   `json:"is_default,omitempty"`
}

// CourseResponseDTO is returned in API responses for courses
type CourseResponseDTO struct {
	CourseID    string    `json:"course_id"`
	UserID      string    `json:"user_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	IsDefault   bool      `json:"is_default"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// CourseUpdateDTO is used for incoming course update requests
type CourseUpdateDTO struct {
	Title       *string `json:"title,omitempty"`
	Description *string `json:"description,omitempty"`
	IsDefault   *bool   `json:"is_default,omitempty"`
}

// CourseLectureResponseDTO is returned for lectures under a course
type CourseLectureResponseDTO struct {
    LectureID string `json:"lecture_id"`
    Title     string `json:"title"`
}

// LectureResponseDTO is returned for a single lecture
// @Summary Lecture info
// @Tags lectures
// @Produce json
// @Success 200 {object} dto.LectureResponseDTO
// @Router /lectures/{lectureId} [get]
type LectureResponseDTO struct {
    LectureID  string    `json:"lecture_id"`
    CourseID   string    `json:"course_id"`
    Title      string    `json:"title"`
    PdfURL     string    `json:"pdf_url"`
    Status     string    `json:"status"`
    CreatedAt  time.Time `json:"created_at"`
    UpdatedAt  time.Time `json:"updated_at"`
    AccessedAt time.Time `json:"accessed_at"`
}

// LectureUpdateDTO is used for incoming lecture update requests
type LectureUpdateDTO struct {
    Title      *string    `json:"title,omitempty"`
    AccessedAt *time.Time `json:"accessed_at,omitempty"`
}
