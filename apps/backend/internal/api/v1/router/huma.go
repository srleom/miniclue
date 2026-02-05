package router

import (
	"app/internal/api/v1/handler"
	"app/internal/config"
	"net/http"
	"os"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog"
)

// SetupHumaAPI creates a Huma API instance
func SetupHumaAPI(
	cfg *config.Config,
	authMiddleware func(http.Handler) http.Handler,
	pubsubAuthMiddleware func(http.Handler) http.Handler,
	chatHandler *handler.ChatHandler,
	logger zerolog.Logger,
) (*chi.Mux, huma.API) {
	// Create Chi router for Huma adapter
	chiRouter := chi.NewRouter()

	// Apply middleware based on path
	chiRouter.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Skip all auth for OpenAPI docs endpoint
			if r.URL.Path == "/openapi.json" || r.URL.Path == "/docs" || r.URL.Path == "/schemas" {
				next.ServeHTTP(w, r)
				return
			}
			// Use PubSub auth for DLQ endpoints
			if r.URL.Path == "/dlq/record" {
				pubsubAuthMiddleware(next).ServeHTTP(w, r)
				return
			}
			// Apply JWT auth middleware for all other routes
			authMiddleware(next).ServeHTTP(w, r)
		})
	})

	// Get version from environment or default to development
	version := os.Getenv("GIT_COMMIT_SHA")
	if version == "" {
		version = "development"
	}

	// Configure Huma with OpenAPI 3.1
	humaConfig := huma.DefaultConfig("MiniClue API v1", version)
	humaConfig.Info.Description = "MiniClue API - Automatic type generation with Huma"

	// Set server URL based on environment
	// For now, use dynamic URL - in production this would be the actual API URL
	serverURL := cfg.APIBaseURL
	humaConfig.Servers = []*huma.Server{{URL: serverURL}}

	// Create Huma API with Chi adapter
	api := humachi.New(chiRouter, humaConfig)

	// Mount chat streaming endpoint as raw HTTP handler (SSE streaming requires direct access)
	chiRouter.Post("/lectures/{lectureId}/chats/{chatId}/stream", chatHandler.StreamChat)

	logger.Info().Msg("Huma API initialized for /v1")
	logger.Info().Str("version", version).Msg("OpenAPI spec version")
	logger.Info().Msg("Chat streaming endpoint mounted at /lectures/{lectureId}/chats/{chatId}/stream")

	return chiRouter, api
}

// RegisterRoutes registers all Huma operations
func RegisterRoutes(
	api huma.API,
	userHandler *handler.UserHandler,
	courseHandler *handler.CourseHandler,
	lectureHandler *handler.LectureHandler,
	chatHandler *handler.ChatHandler,
	dlqHandler *handler.DLQHandler,
	logger zerolog.Logger,
) {
	logger.Info().Msg("Registering routes")

	// ========== USER OPERATIONS ==========
	huma.Register(api, huma.Operation{
		OperationID: "createUser",
		Method:      "POST",
		Path:        "/users/me",
		Summary:     "Create or update user profile",
		Description: "Creates a new user profile or updates an existing one associated with the authenticated user ID",
		Tags:        []string{"users"},
	}, userHandler.CreateUser)

	huma.Register(api, huma.Operation{
		OperationID: "getUser",
		Method:      "GET",
		Path:        "/users/me",
		Summary:     "Get user profile",
		Description: "Retrieves the profile of the authenticated user",
		Tags:        []string{"users"},
	}, userHandler.GetUser)

	huma.Register(api, huma.Operation{
		OperationID: "deleteUser",
		Method:      "DELETE",
		Path:        "/users/me",
		Summary:     "Delete user profile and resources",
		Description: "Deletes the profile of the authenticated user and cleans up all associated resources",
		Tags:        []string{"users"},
	}, userHandler.DeleteUser)

	huma.Register(api, huma.Operation{
		OperationID: "getUserCourses",
		Method:      "GET",
		Path:        "/users/me/courses",
		Summary:     "Get user's courses",
		Description: "Retrieves the list of courses associated with the authenticated user",
		Tags:        []string{"users"},
	}, userHandler.GetUserCourses)

	huma.Register(api, huma.Operation{
		OperationID: "getRecentLectures",
		Method:      "GET",
		Path:        "/users/me/recents",
		Summary:     "Get recent lectures",
		Description: "Retrieves recently viewed lectures for the authenticated user with pagination",
		Tags:        []string{"users"},
	}, userHandler.GetRecentLectures)

	huma.Register(api, huma.Operation{
		OperationID: "storeAPIKey",
		Method:      "POST",
		Path:        "/users/me/api-key",
		Summary:     "Store user's API key",
		Description: "Stores the user's API key securely in Google Cloud Secret Manager",
		Tags:        []string{"users"},
	}, userHandler.StoreAPIKey)

	huma.Register(api, huma.Operation{
		OperationID: "deleteAPIKey",
		Method:      "DELETE",
		Path:        "/users/me/api-key",
		Summary:     "Delete user's API key",
		Description: "Deletes the user's API key from Google Cloud Secret Manager",
		Tags:        []string{"users"},
	}, userHandler.DeleteAPIKey)

	huma.Register(api, huma.Operation{
		OperationID: "listModels",
		Method:      "GET",
		Path:        "/users/me/models",
		Summary:     "List available models",
		Description: "Returns curated models for providers where the user has added API keys",
		Tags:        []string{"users"},
	}, userHandler.ListModels)

	huma.Register(api, huma.Operation{
		OperationID:   "updateModelPreference",
		Method:        "PUT",
		Path:          "/users/me/models",
		Summary:       "Update model preference",
		Description:   "Toggles a curated model for a provider for the current user",
		Tags:          []string{"users"},
		DefaultStatus: 200,
	}, userHandler.UpdateModelPreference)

	// ========== COURSE OPERATIONS ==========
	huma.Register(api, huma.Operation{
		OperationID:   "createCourse",
		Method:        "POST",
		Path:          "/courses",
		Summary:       "Create a course",
		Description:   "Creates a new course for the authenticated user",
		Tags:          []string{"courses"},
		DefaultStatus: 201,
	}, courseHandler.CreateCourse)

	huma.Register(api, huma.Operation{
		OperationID: "getCourse",
		Method:      "GET",
		Path:        "/courses/{courseId}",
		Summary:     "Get a course",
		Description: "Retrieves a specific course by ID",
		Tags:        []string{"courses"},
	}, courseHandler.GetCourse)

	huma.Register(api, huma.Operation{
		OperationID: "updateCourse",
		Method:      "PUT",
		Path:        "/courses/{courseId}",
		Summary:     "Update a course",
		Description: "Updates a course's title, description, or default status",
		Tags:        []string{"courses"},
	}, courseHandler.UpdateCourse)

	huma.Register(api, huma.Operation{
		OperationID:   "deleteCourse",
		Method:        "DELETE",
		Path:          "/courses/{courseId}",
		Summary:       "Delete a course",
		Description:   "Deletes a course and all associated lectures",
		Tags:          []string{"courses"},
		DefaultStatus: 204,
	}, courseHandler.DeleteCourse)

	// ========== LECTURE OPERATIONS ==========
	huma.Register(api, huma.Operation{
		OperationID: "getLectures",
		Method:      "GET",
		Path:        "/courses/{courseId}/lectures",
		Summary:     "Get lectures for a course",
		Description: "Retrieves all lectures for a specific course",
		Tags:        []string{"lectures"},
	}, lectureHandler.GetLectures)

	huma.Register(api, huma.Operation{
		OperationID: "getLecture",
		Method:      "GET",
		Path:        "/lectures/{lectureId}",
		Summary:     "Get a lecture",
		Description: "Retrieves a specific lecture by ID",
		Tags:        []string{"lectures"},
	}, lectureHandler.GetLecture)

	huma.Register(api, huma.Operation{
		OperationID: "updateLecture",
		Method:      "PUT",
		Path:        "/lectures/{lectureId}",
		Summary:     "Update a lecture",
		Description: "Updates a lecture's title or course assignment",
		Tags:        []string{"lectures"},
	}, lectureHandler.UpdateLecture)

	huma.Register(api, huma.Operation{
		OperationID:   "deleteLecture",
		Method:        "DELETE",
		Path:          "/lectures/{lectureId}",
		Summary:       "Delete a lecture",
		Description:   "Deletes a lecture and all associated resources",
		Tags:          []string{"lectures"},
		DefaultStatus: 204,
	}, lectureHandler.DeleteLecture)

	huma.Register(api, huma.Operation{
		OperationID: "batchUploadURL",
		Method:      "POST",
		Path:        "/lectures/batch-upload-url",
		Summary:     "Get batch upload URLs",
		Description: "Generates presigned URLs for batch uploading lecture files",
		Tags:        []string{"lectures"},
	}, lectureHandler.BatchUploadURL)

	huma.Register(api, huma.Operation{
		OperationID: "uploadComplete",
		Method:      "POST",
		Path:        "/lectures/{lectureId}/upload-complete",
		Summary:     "Complete lecture upload",
		Description: "Marks a lecture upload as complete and triggers processing",
		Tags:        []string{"lectures"},
	}, lectureHandler.UploadComplete)

	// Lecture Notes
	huma.Register(api, huma.Operation{
		OperationID: "getLectureNotes",
		Method:      "GET",
		Path:        "/lectures/{lectureId}/notes",
		Summary:     "Get lecture notes",
		Description: "Retrieves notes for a specific lecture",
		Tags:        []string{"lectures", "notes"},
	}, lectureHandler.GetLectureNotes)

	huma.Register(api, huma.Operation{
		OperationID:   "createLectureNote",
		Method:        "POST",
		Path:          "/lectures/{lectureId}/notes",
		Summary:       "Create lecture note",
		Description:   "Creates a new note for a lecture",
		Tags:          []string{"lectures", "notes"},
		DefaultStatus: 201,
	}, lectureHandler.CreateLectureNote)

	huma.Register(api, huma.Operation{
		OperationID: "updateLectureNote",
		Method:      "PUT",
		Path:        "/lectures/{lectureId}/notes",
		Summary:     "Update lecture note",
		Description: "Updates the content of a lecture note",
		Tags:        []string{"lectures", "notes"},
	}, lectureHandler.UpdateLectureNote)

	huma.Register(api, huma.Operation{
		OperationID:   "deleteLectureNote",
		Method:        "DELETE",
		Path:          "/lectures/{lectureId}/notes",
		Summary:       "Delete lecture note",
		Description:   "Deletes a lecture note",
		Tags:          []string{"lectures", "notes"},
		DefaultStatus: 204,
	}, lectureHandler.DeleteLectureNote)

	huma.Register(api, huma.Operation{
		OperationID: "getSignedURL",
		Method:      "GET",
		Path:        "/lectures/{lectureId}/url",
		Summary:     "Get signed URL for lecture PDF",
		Description: "Generates a signed URL for downloading the lecture PDF",
		Tags:        []string{"lectures"},
	}, lectureHandler.GetSignedURL)

	// ========== CHAT OPERATIONS ==========
	huma.Register(api, huma.Operation{
		OperationID: "getChats",
		Method:      "GET",
		Path:        "/lectures/{lectureId}/chats",
		Summary:     "Get chats for a lecture",
		Description: "Retrieves all chats for a specific lecture",
		Tags:        []string{"chats"},
	}, chatHandler.GetChats)

	huma.Register(api, huma.Operation{
		OperationID: "getChat",
		Method:      "GET",
		Path:        "/lectures/{lectureId}/chats/{chatId}",
		Summary:     "Get a chat",
		Description: "Retrieves a specific chat by ID",
		Tags:        []string{"chats"},
	}, chatHandler.GetChat)

	huma.Register(api, huma.Operation{
		OperationID:   "createChat",
		Method:        "POST",
		Path:          "/lectures/{lectureId}/chats",
		Summary:       "Create a chat",
		Description:   "Creates a new chat for a lecture",
		Tags:          []string{"chats"},
		DefaultStatus: 201,
	}, chatHandler.CreateChat)

	huma.Register(api, huma.Operation{
		OperationID: "updateChat",
		Method:      "PATCH",
		Path:        "/lectures/{lectureId}/chats/{chatId}",
		Summary:     "Update a chat",
		Description: "Updates a chat's title",
		Tags:        []string{"chats"},
	}, chatHandler.UpdateChat)

	huma.Register(api, huma.Operation{
		OperationID:   "deleteChat",
		Method:        "DELETE",
		Path:          "/lectures/{lectureId}/chats/{chatId}",
		Summary:       "Delete a chat",
		Description:   "Deletes a chat and all its messages",
		Tags:          []string{"chats"},
		DefaultStatus: 204,
	}, chatHandler.DeleteChat)

	huma.Register(api, huma.Operation{
		OperationID: "listMessages",
		Method:      "GET",
		Path:        "/lectures/{lectureId}/chats/{chatId}/messages",
		Summary:     "List messages in a chat",
		Description: "Retrieves all messages for a specific chat in chronological order",
		Tags:        []string{"chats", "messages"},
	}, chatHandler.ListMessages)

	// Note: Chat streaming endpoint is mounted as raw HTTP handler on Chi router
	// See SetupHumaAPI for the streaming endpoint registration

	// ========== DLQ OPERATIONS ==========
	huma.Register(api, huma.Operation{
		OperationID: "recordDLQ",
		Method:      "POST",
		Path:        "/dlq/record",
		Summary:     "Record DLQ message",
		Description: "Records a dead letter queue message from Pub/Sub",
		Tags:        []string{"dlq"},
	}, dlqHandler.RecordDLQ)

	logger.Info().Msg("All operations registered successfully")
	logger.Info().Int("total_operations", 35).Msg("Total registered operations")
}
