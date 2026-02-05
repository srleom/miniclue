package operation

import "app/internal/api/v1/dto"

// User CRUD Operations

type CreateUserInput struct {
	Body dto.UserCreateDTO `json:"body"`
}

type CreateUserOutput struct {
	Body dto.UserResponseDTO `json:"body"`
}

type GetUserInput struct {
	// No input needed - user ID comes from auth context
}

type GetUserOutput struct {
	Body dto.UserResponseDTO `json:"body"`
}

type DeleteUserInput struct {
	// No input needed - user ID comes from auth context
}

type DeleteUserOutput struct {
	// 204 No Content - no body
}

// User Courses Operations

type GetUserCoursesInput struct {
	// No input needed - user ID comes from auth context
}

type GetUserCoursesOutput struct {
	Body []dto.UserCourseResponseDTO `json:"body"`
}

// Recent Lectures Operations

type GetRecentLecturesInput struct {
	Limit  int `query:"limit" default:"10" minimum:"1" maximum:"1000" doc:"Number of lectures to return"`
	Offset int `query:"offset" default:"0" minimum:"0" doc:"Offset for pagination"`
}

type GetRecentLecturesOutput struct {
	Body dto.UserRecentLecturesResponseDTO `json:"body"`
}

// API Key Operations

type StoreAPIKeyInput struct {
	Body dto.APIKeyRequestDTO `json:"body"`
}

type StoreAPIKeyOutput struct {
	Body dto.APIKeyResponseDTO `json:"body"`
}

type DeleteAPIKeyInput struct {
	Provider string `query:"provider" required:"true" enum:"openai,gemini,anthropic,xai,deepseek" doc:"API provider"`
}

type DeleteAPIKeyOutput struct {
	Body dto.APIKeyResponseDTO `json:"body"`
}

// Model Preference Operations

type ListModelsInput struct {
	// No input needed - user ID comes from auth context
}

type ListModelsOutput struct {
	Body dto.ModelsResponseDTO `json:"body"`
}

type UpdateModelPreferenceInput struct {
	Body dto.ModelPreferenceRequestDTO `json:"body"`
}

type UpdateModelPreferenceOutput struct {
	Body dto.ModelToggleDTO `json:"body"`
}
