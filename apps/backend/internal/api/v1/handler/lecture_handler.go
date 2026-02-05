package handler

import (
	"context"
	"strings"

	"app/internal/api/v1/dto"
	"app/internal/api/v1/operation"
	"app/internal/service"

	"github.com/danielgtaylor/huma/v2"
	"github.com/rs/zerolog"
)

type LectureHandler struct {
	lectureService service.LectureService
	courseService  service.CourseService
	logger         zerolog.Logger
}

func NewLectureHandler(
	lectureService service.LectureService,
	courseService service.CourseService,
	logger zerolog.Logger,
) *LectureHandler {
	return &LectureHandler{
		lectureService: lectureService,
		courseService:  courseService,
		logger:         logger,
	}
}

// Lecture CRUD Operations

func (h *LectureHandler) GetLectures(ctx context.Context, input *operation.GetLecturesInput) (*operation.GetLecturesOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	// Verify course ownership
	course, err := h.courseService.GetCourseByID(ctx, input.CourseID)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to retrieve course", err)
	}
	if course == nil || course.UserID != userID {
		return nil, huma.Error404NotFound("Course not found")
	}

	lectures, err := h.lectureService.GetLecturesByCourseID(ctx, input.CourseID, userID, input.Limit, input.Offset)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to retrieve lectures", err)
	}

	// Convert to DTOs
	dtos := make([]dto.LectureResponseDTO, 0, len(lectures))
	for _, lecture := range lectures {
		dtos = append(dtos, dto.LectureResponseDTO{
			LectureID:             lecture.ID,
			CourseID:              lecture.CourseID,
			Title:                 lecture.Title,
			StoragePath:           lecture.StoragePath,
			Status:                lecture.Status,
			EmbeddingErrorDetails: map[string]interface{}(lecture.EmbeddingErrorDetails),
			TotalSlides:           lecture.TotalSlides,
			CreatedAt:             lecture.CreatedAt,
			UpdatedAt:             lecture.UpdatedAt,
			AccessedAt:            lecture.AccessedAt,
		})
	}

	return &operation.GetLecturesOutput{Body: dtos}, nil
}

func (h *LectureHandler) GetLecture(ctx context.Context, input *operation.GetLectureInput) (*operation.GetLectureOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	lecture, err := h.lectureService.GetLectureByID(ctx, input.LectureID)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to retrieve lecture", err)
	}
	if lecture == nil || lecture.UserID != userID {
		return nil, huma.Error404NotFound("Lecture not found")
	}

	return &operation.GetLectureOutput{
		Body: dto.LectureResponseDTO{
			LectureID:             lecture.ID,
			CourseID:              lecture.CourseID,
			Title:                 lecture.Title,
			StoragePath:           lecture.StoragePath,
			Status:                lecture.Status,
			EmbeddingErrorDetails: map[string]interface{}(lecture.EmbeddingErrorDetails),
			TotalSlides:           lecture.TotalSlides,
			CreatedAt:             lecture.CreatedAt,
			UpdatedAt:             lecture.UpdatedAt,
			AccessedAt:            lecture.AccessedAt,
		},
	}, nil
}

func (h *LectureHandler) UpdateLecture(ctx context.Context, input *operation.UpdateLectureInput) (*operation.UpdateLectureOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	if input.Body.Title != nil && strings.TrimSpace(*input.Body.Title) == "" {
		return nil, huma.Error400BadRequest("Title cannot be empty")
	}
	if input.Body.CourseID != nil && strings.TrimSpace(*input.Body.CourseID) == "" {
		return nil, huma.Error400BadRequest("Course ID cannot be empty")
	}

	lecture, err := h.lectureService.GetLectureByID(ctx, input.LectureID)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to retrieve lecture", err)
	}
	if lecture == nil || lecture.UserID != userID {
		return nil, huma.Error404NotFound("Lecture not found")
	}

	// Apply updates
	if input.Body.CourseID != nil {
		newCourse, err := h.courseService.GetCourseByID(ctx, *input.Body.CourseID)
		if err != nil {
			return nil, huma.Error500InternalServerError("Failed to retrieve course", err)
		}
		if newCourse == nil || newCourse.UserID != userID {
			return nil, huma.Error404NotFound("Course not found")
		}
		lecture.CourseID = *input.Body.CourseID
	}
	if input.Body.Title != nil {
		lecture.Title = *input.Body.Title
	}
	if input.Body.AccessedAt != nil {
		lecture.AccessedAt = *input.Body.AccessedAt
	}

	if err := h.lectureService.UpdateLecture(ctx, lecture); err != nil {
		return nil, huma.Error500InternalServerError("Failed to update lecture", err)
	}

	return &operation.UpdateLectureOutput{
		Body: dto.LectureResponseDTO{
			LectureID:             lecture.ID,
			CourseID:              lecture.CourseID,
			Title:                 lecture.Title,
			StoragePath:           lecture.StoragePath,
			Status:                lecture.Status,
			EmbeddingErrorDetails: map[string]interface{}(lecture.EmbeddingErrorDetails),
			TotalSlides:           lecture.TotalSlides,
			CreatedAt:             lecture.CreatedAt,
			UpdatedAt:             lecture.UpdatedAt,
			AccessedAt:            lecture.AccessedAt,
		},
	}, nil
}

func (h *LectureHandler) DeleteLecture(ctx context.Context, input *operation.DeleteLectureInput) (*operation.DeleteLectureOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	lecture, err := h.lectureService.GetLectureByID(ctx, input.LectureID)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to retrieve lecture", err)
	}
	if lecture == nil || lecture.UserID != userID {
		return nil, huma.Error404NotFound("Lecture not found")
	}

	if err := h.lectureService.DeleteLecture(ctx, input.LectureID); err != nil {
		return nil, huma.Error500InternalServerError("Failed to delete lecture", err)
	}

	return &operation.DeleteLectureOutput{}, nil
}

// Lecture Upload Operations

func (h *LectureHandler) BatchUploadURL(ctx context.Context, input *operation.BatchUploadURLInput) (*operation.BatchUploadURLOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	// Verify course ownership
	course, err := h.courseService.GetCourseByID(ctx, input.Body.CourseID)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to retrieve course", err)
	}
	if course == nil || course.UserID != userID {
		return nil, huma.Error404NotFound("Course not found")
	}

	lectures, presignedURLs, err := h.lectureService.InitiateBatchUpload(ctx, input.Body.CourseID, userID, input.Body.Filenames)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to initiate batch upload", err)
	}

	// Build response
	uploads := make([]dto.LectureUploadURLResponseDTO, len(lectures))
	for i, lecture := range lectures {
		uploads[i] = dto.LectureUploadURLResponseDTO{
			LectureID: lecture.ID,
			UploadURL: presignedURLs[i],
		}
	}

	return &operation.BatchUploadURLOutput{
		Body: dto.LectureBatchUploadURLResponseDTO{Uploads: uploads},
	}, nil
}

func (h *LectureHandler) UploadComplete(ctx context.Context, input *operation.UploadCompleteInput) (*operation.UploadCompleteOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	lecture, err := h.lectureService.CompleteUpload(ctx, input.LectureID, userID)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to complete upload", err)
	}

	if lecture == nil {
		return nil, huma.Error404NotFound("Lecture not found")
	}

	return &operation.UploadCompleteOutput{
		Body: dto.LectureUploadCompleteResponseDTO{
			LectureID: lecture.ID,
			CourseID:  lecture.CourseID,
			Status:    lecture.Status,
			Message:   "Upload completed successfully",
		},
	}, nil
}

// Lecture Signed URL Operations

func (h *LectureHandler) GetSignedURL(ctx context.Context, input *operation.GetSignedURLInput) (*operation.GetSignedURLOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	lecture, err := h.lectureService.GetLectureByID(ctx, input.LectureID)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to retrieve lecture", err)
	}
	if lecture == nil {
		return nil, huma.Error404NotFound("Lecture not found")
	}

	// Verify user owns the course
	course, err := h.courseService.GetCourseByID(ctx, lecture.CourseID)
	if err != nil || course == nil || course.UserID != userID {
		return nil, huma.Error404NotFound("Lecture not found")
	}

	url, err := h.lectureService.GetPresignedURL(ctx, lecture.StoragePath)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to generate signed URL", err)
	}

	return &operation.GetSignedURLOutput{
		Body: dto.SignedURLResponseDTO{
			URL: url,
		},
	}, nil
}
