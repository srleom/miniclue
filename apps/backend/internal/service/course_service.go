package service

import (
	"context"
	"fmt"
	"math"

	"app/internal/model"
	"app/internal/repository"

	"github.com/rs/zerolog"
)

// CourseService defines course-related operations
type CourseService interface {
	CreateCourse(ctx context.Context, c *model.Course) (*model.Course, error)
	// GetCourseByID retrieves a course by its ID
	GetCourseByID(ctx context.Context, courseID string) (*model.Course, error)
	// UpdateCourse updates an existing course
	UpdateCourse(ctx context.Context, c *model.Course) (*model.Course, error)
	// DeleteCourse deletes a course by its ID
	DeleteCourse(ctx context.Context, courseID string) error
}

// courseService is the implementation of CourseService
type courseService struct {
	repo         repository.CourseRepository
	lectureSvc   LectureService
	courseLogger zerolog.Logger
}

// NewCourseService creates a new CourseService
func NewCourseService(repo repository.CourseRepository, lectureSvc LectureService, logger zerolog.Logger) CourseService {
	return &courseService{
		repo:         repo,
		lectureSvc:   lectureSvc,
		courseLogger: logger.With().Str("service", "CourseService").Logger(),
	}
}

// CreateCourse creates a new course record
func (s *courseService) CreateCourse(ctx context.Context, c *model.Course) (*model.Course, error) {
	if err := s.repo.CreateCourse(ctx, c); err != nil {
		s.courseLogger.Error().Err(err).Str("user_id", c.UserID).Msg("Failed to create course")
		return nil, err
	}
	return c, nil
}

// GetCourseByID retrieves a course by its ID
func (s *courseService) GetCourseByID(ctx context.Context, courseID string) (*model.Course, error) {
	course, err := s.repo.GetCourseByID(ctx, courseID)
	if err != nil {
		s.courseLogger.Error().Err(err).Str("course_id", courseID).Msg("Failed to get course by ID")
		return nil, err
	}
	if course == nil {
		return nil, fmt.Errorf("course with ID %s not found", courseID)
	}
	return course, nil
}

// UpdateCourse updates an existing course
func (s *courseService) UpdateCourse(ctx context.Context, c *model.Course) (*model.Course, error) {
	existingCourse, err := s.repo.GetCourseByID(ctx, c.CourseID)
	if err != nil {
		s.courseLogger.Error().Err(err).Str("course_id", c.CourseID).Msg("Failed to get course by ID")
		return nil, err
	}
	if existingCourse == nil {
		return nil, fmt.Errorf("course with ID %s not found", c.CourseID)
	}
	if existingCourse.IsDefault {
		return nil, fmt.Errorf("default courses cannot be updated")
	}
	if err := s.repo.UpdateCourse(ctx, c); err != nil {
		s.courseLogger.Error().Err(err).Str("course_id", c.CourseID).Msg("Failed to update course")
		return nil, err
	}
	return c, nil
}

// DeleteCourse removes a course and its associated lectures
func (s *courseService) DeleteCourse(ctx context.Context, courseID string) error {
	// Retrieve course to ensure it exists and can be deleted
	existingCourse, err := s.repo.GetCourseByID(ctx, courseID)
	if err != nil {
		s.courseLogger.Error().Err(err).Str("course_id", courseID).Msg("Failed to get course for deletion")
		return fmt.Errorf("failed to get course for deletion: %w", err)
	}
	if existingCourse == nil {
		return fmt.Errorf("course with ID %s not found", courseID)
	}
	if existingCourse.IsDefault {
		return fmt.Errorf("default courses cannot be deleted")
	}

	// Clean up all lectures associated with this course
	lectures, err := s.lectureSvc.GetLecturesByCourseID(ctx, courseID, existingCourse.UserID, math.MaxInt32, 0)
	if err != nil {
		s.courseLogger.Error().Err(err).Str("course_id", courseID).Msg("Failed to get lectures for course deletion")
		return fmt.Errorf("failed to get lectures for course deletion: %w", err)
	}
	// Delete each lecture (which also handles S3 cleanup)
	for _, lecture := range lectures {
		if err := s.lectureSvc.DeleteLecture(ctx, lecture.ID); err != nil {
			s.courseLogger.Error().Err(err).Str("lecture_id", lecture.ID).Msg("Failed to delete lecture during course deletion")
			// Continue trying to delete other lectures even if one fails
		}
	}

	// Finally, delete the course itself
	if err := s.repo.DeleteCourse(ctx, courseID); err != nil {
		s.courseLogger.Error().Err(err).Str("course_id", courseID).Msg("Failed to delete course record")
		return err
	}

	return nil
}
