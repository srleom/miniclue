package operation

import "app/internal/api/v1/dto"

// Course CRUD Operations

type CreateCourseInput struct {
	Body dto.CourseCreateDTO `json:"body"`
}

type CreateCourseOutput struct {
	Body dto.CourseResponseDTO `json:"body"`
}

type GetCourseInput struct {
	CourseID string `path:"courseId" doc:"Course ID"`
}

type GetCourseOutput struct {
	Body dto.CourseResponseDTO `json:"body"`
}

type UpdateCourseInput struct {
	CourseID string              `path:"courseId" doc:"Course ID"`
	Body     dto.CourseUpdateDTO `json:"body"`
}

type UpdateCourseOutput struct {
	Body dto.CourseResponseDTO `json:"body"`
}

type DeleteCourseInput struct {
	CourseID string `path:"courseId" doc:"Course ID"`
}

type DeleteCourseOutput struct {
	// 204 No Content
}
