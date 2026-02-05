package handler

import (
	"context"
	"errors"

	"app/internal/api/v1/dto"
	"app/internal/api/v1/operation"
	"app/internal/middleware"
	"app/internal/model"
	"app/internal/service"

	"github.com/danielgtaylor/huma/v2"
	"github.com/rs/zerolog"
)

// UserHandler implements Huma-based user operations
type UserHandler struct {
	userService service.UserService
	logger      zerolog.Logger
}

func NewUserHandler(userService service.UserService, logger zerolog.Logger) *UserHandler {
	return &UserHandler{
		userService: userService,
		logger:      logger,
	}
}

// Helper to extract user ID from context (injected by auth middleware)
func getUserIDFromContext(ctx context.Context) (string, error) {
	userID, ok := ctx.Value(middleware.UserContextKey).(string)
	if !ok || userID == "" {
		return "", huma.Error401Unauthorized("User ID not found in context")
	}
	return userID, nil
}

// CreateUser creates or updates a user profile
func (h *UserHandler) CreateUser(ctx context.Context, input *operation.CreateUserInput) (*operation.CreateUserOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	userModel := &model.User{
		UserID:    userID,
		Name:      input.Body.Name,
		Email:     input.Body.Email,
		AvatarURL: input.Body.AvatarURL,
	}

	createdUser, err := h.userService.Create(ctx, userModel)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to create user", err)
	}

	return &operation.CreateUserOutput{
		Body: dto.UserResponseDTO{
			UserID:           createdUser.UserID,
			Name:             createdUser.Name,
			Email:            createdUser.Email,
			AvatarURL:        createdUser.AvatarURL,
			APIKeysProvided:  createdUser.APIKeysProvided,
			ModelPreferences: createdUser.ModelPreferences,
			CreatedAt:        createdUser.CreatedAt,
			UpdatedAt:        createdUser.UpdatedAt,
		},
	}, nil
}

// GetUser retrieves the authenticated user's profile
func (h *UserHandler) GetUser(ctx context.Context, input *operation.GetUserInput) (*operation.GetUserOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	user, err := h.userService.Get(ctx, userID)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			return nil, huma.Error404NotFound("User not found")
		}
		return nil, huma.Error500InternalServerError("Failed to get user", err)
	}

	return &operation.GetUserOutput{
		Body: dto.UserResponseDTO{
			UserID:           user.UserID,
			Name:             user.Name,
			Email:            user.Email,
			AvatarURL:        user.AvatarURL,
			APIKeysProvided:  user.APIKeysProvided,
			ModelPreferences: user.ModelPreferences,
			CreatedAt:        user.CreatedAt,
			UpdatedAt:        user.UpdatedAt,
		},
	}, nil
}

// DeleteUser deletes the authenticated user and all associated resources
func (h *UserHandler) DeleteUser(ctx context.Context, input *operation.DeleteUserInput) (*operation.DeleteUserOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	err = h.userService.DeleteUser(ctx, userID)
	if err != nil {
		h.logger.Error().Err(err).Str("user_id", userID).Msg("Failed to delete user and resources")
		return nil, huma.Error500InternalServerError("Failed to delete user", err)
	}

	// 204 No Content - Huma handles this automatically with empty output
	return &operation.DeleteUserOutput{}, nil
}

// GetUserCourses retrieves courses associated with the authenticated user
func (h *UserHandler) GetUserCourses(ctx context.Context, input *operation.GetUserCoursesInput) (*operation.GetUserCoursesOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	courses, err := h.userService.GetCourses(ctx, userID)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to retrieve user courses", err)
	}

	var courseDTOs []dto.UserCourseResponseDTO
	for _, course := range courses {
		courseDTOs = append(courseDTOs, dto.UserCourseResponseDTO{
			CourseID:    course.CourseID,
			Title:       course.Title,
			Description: course.Description,
			IsDefault:   course.IsDefault,
			UpdatedAt:   course.UpdatedAt,
		})
	}

	return &operation.GetUserCoursesOutput{
		Body: courseDTOs,
	}, nil
}

// GetRecentLectures retrieves recently viewed lectures for the authenticated user
func (h *UserHandler) GetRecentLectures(ctx context.Context, input *operation.GetRecentLecturesInput) (*operation.GetRecentLecturesOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	lectures, totalCount, err := h.userService.GetRecentLecturesWithCount(ctx, userID, input.Limit, input.Offset)
	if err != nil {
		return nil, huma.Error500InternalServerError("Failed to retrieve recent lectures", err)
	}

	var lectureDTOs []dto.UserRecentLectureResponseDTO
	for _, lecture := range lectures {
		lectureDTOs = append(lectureDTOs, dto.UserRecentLectureResponseDTO{
			LectureID: lecture.ID,
			Title:     lecture.Title,
			CourseID:  lecture.CourseID,
		})
	}

	return &operation.GetRecentLecturesOutput{
		Body: dto.UserRecentLecturesResponseDTO{
			Lectures:   lectureDTOs,
			TotalCount: totalCount,
		},
	}, nil
}

// StoreAPIKey stores the user's API key securely
func (h *UserHandler) StoreAPIKey(ctx context.Context, input *operation.StoreAPIKeyInput) (*operation.StoreAPIKeyOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	err = h.userService.StoreAPIKey(ctx, userID, input.Body.Provider, input.Body.APIKey)
	if err != nil {
		// Check if provider is disabled (400 Bad Request)
		if err.Error() != "" && (err.Error() == "provider disabled" || err.Error() == "provider is currently disabled") {
			return nil, huma.Error400BadRequest(err.Error())
		}
		h.logger.Error().Err(err).Str("user_id", userID).Str("provider", input.Body.Provider).Msg("Failed to store API key")
		return nil, huma.Error500InternalServerError("Failed to store API key", err)
	}

	return &operation.StoreAPIKeyOutput{
		Body: dto.APIKeyResponseDTO{
			Provider:       input.Body.Provider,
			HasProvidedKey: true,
		},
	}, nil
}

// DeleteAPIKey deletes the user's API key
func (h *UserHandler) DeleteAPIKey(ctx context.Context, input *operation.DeleteAPIKeyInput) (*operation.DeleteAPIKeyOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	err = h.userService.DeleteAPIKey(ctx, userID, input.Provider)
	if err != nil {
		h.logger.Error().Err(err).Str("user_id", userID).Str("provider", input.Provider).Msg("Failed to delete API key")
		return nil, huma.Error500InternalServerError("Failed to delete API key", err)
	}

	return &operation.DeleteAPIKeyOutput{
		Body: dto.APIKeyResponseDTO{
			Provider:       input.Provider,
			HasProvidedKey: false,
		},
	}, nil
}

// ListModels lists available models for providers where the user has API keys
func (h *UserHandler) ListModels(ctx context.Context, input *operation.ListModelsInput) (*operation.ListModelsOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	models, err := h.userService.ListModels(ctx, userID)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			return nil, huma.Error404NotFound("User not found")
		}
		return nil, huma.Error500InternalServerError("Failed to list models", err)
	}

	resp := dto.ModelsResponseDTO{}
	for _, pm := range models {
		providerDTO := dto.ProviderModelsDTO{
			Provider: pm.Provider,
		}
		for _, m := range pm.Models {
			providerDTO.Models = append(providerDTO.Models, dto.ModelToggleDTO{
				ID:      m.ID,
				Name:    m.Name,
				Enabled: m.Enabled,
			})
		}
		resp.Providers = append(resp.Providers, providerDTO)
	}

	return &operation.ListModelsOutput{
		Body: resp,
	}, nil
}

// UpdateModelPreference toggles a model for a provider
func (h *UserHandler) UpdateModelPreference(ctx context.Context, input *operation.UpdateModelPreferenceInput) (*operation.UpdateModelPreferenceOutput, error) {
	userID, err := getUserIDFromContext(ctx)
	if err != nil {
		return nil, err
	}

	err = h.userService.SetModelPreference(ctx, userID, input.Body.Provider, input.Body.Model, input.Body.Enabled)
	if err != nil {
		if errors.Is(err, service.ErrUserNotFound) {
			return nil, huma.Error404NotFound("User not found")
		}
		return nil, huma.Error500InternalServerError("Failed to update model preference", err)
	}

	return &operation.UpdateModelPreferenceOutput{
		Body: dto.ModelToggleDTO{
			ID:      input.Body.Model,
			Name:    input.Body.Model,
			Enabled: input.Body.Enabled,
		},
	}, nil
}
