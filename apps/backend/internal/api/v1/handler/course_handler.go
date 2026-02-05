package handler

import (
	"context"
	"strings"

	"app/internal/api/v1/dto"
	"app/internal/api/v1/operation"
	"app/internal/model"
	"app/internal/service"

	"github.com/danielgtaylor/huma/v2"
	"github.com/rs/zerolog"
)

type CourseHandler struct {
	courseService service.CourseService
	logger        zerolog.Logger
}

func NewCourseHandler(courseService service.CourseService, logger zerolog.Logger) *CourseHandler {
	return &CourseHandler{
		courseService: courseService,
		logger:        logger,
	}
}

func (h *CourseHandler) CreateCourse(ctx context.Context, input *operation.CreateCourseInput) (*operation.CreateCourseOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	// Build model
	description := ""
	if input.Body.Description != nil {
		description = *input.Body.Description
	}
	isDefault := false
	if input.Body.IsDefault != nil {
		isDefault = *input.Body.IsDefault
	}

	course := &model.Course{
		UserID:      userID,
		Title:       input.Body.Title,
		Description: description,
		IsDefault:   isDefault,
	}

	created, err := h.courseService.CreateCourse(ctx, course)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to create course", err)
	}

	return &operation.CreateCourseOutput{
		Body: dto.CourseResponseDTO{
			CourseID:    created.CourseID,
			UserID:      created.UserID,
			Title:       created.Title,
			Description: created.Description,
			IsDefault:   created.IsDefault,
			CreatedAt:   created.CreatedAt,
			UpdatedAt:   created.UpdatedAt,
		},
	}, nil
}

func (h *CourseHandler) GetCourse(ctx context.Context, input *operation.GetCourseInput) (*operation.GetCourseOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	course, err := h.courseService.GetCourseByID(ctx, input.CourseID)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to retrieve course", err)
	}

	if course == nil || course.UserID != userID {
		return nil, huma.Error404NotFound("Course not found")
	}

	return &operation.GetCourseOutput{
		Body: dto.CourseResponseDTO{
			CourseID:    course.CourseID,
			UserID:      course.UserID,
			Title:       course.Title,
			Description: course.Description,
			IsDefault:   course.IsDefault,
			CreatedAt:   course.CreatedAt,
			UpdatedAt:   course.UpdatedAt,
		},
	}, nil
}

func (h *CourseHandler) UpdateCourse(ctx context.Context, input *operation.UpdateCourseInput) (*operation.UpdateCourseOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	if input.Body.Title != nil && strings.TrimSpace(*input.Body.Title) == "" {
		return nil, huma.Error400BadRequest("Title cannot be empty")
	}

	course, err := h.courseService.GetCourseByID(ctx, input.CourseID)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to retrieve course", err)
	}

	if course == nil || course.UserID != userID {
		return nil, huma.Error404NotFound("Course not found")
	}

	if input.Body.Title != nil {
		course.Title = *input.Body.Title
	}
	if input.Body.Description != nil {
		course.Description = *input.Body.Description
	}
	if input.Body.IsDefault != nil {
		course.IsDefault = *input.Body.IsDefault
	}

	updated, err := h.courseService.UpdateCourse(ctx, course)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to update course", err)
	}

	return &operation.UpdateCourseOutput{
		Body: dto.CourseResponseDTO{
			CourseID:    updated.CourseID,
			UserID:      updated.UserID,
			Title:       updated.Title,
			Description: updated.Description,
			IsDefault:   updated.IsDefault,
			CreatedAt:   updated.CreatedAt,
			UpdatedAt:   updated.UpdatedAt,
		},
	}, nil
}

func (h *CourseHandler) DeleteCourse(ctx context.Context, input *operation.DeleteCourseInput) (*operation.DeleteCourseOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	course, err := h.courseService.GetCourseByID(ctx, input.CourseID)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to retrieve course", err)
	}

	if course == nil || course.UserID != userID {
		return nil, huma.Error404NotFound("Course not found")
	}

	if err := h.courseService.DeleteCourse(ctx, input.CourseID); err != nil {
		return nil, huma.Error500InternalServerError("Failed to delete course", err)
	}

	return &operation.DeleteCourseOutput{}, nil
}
