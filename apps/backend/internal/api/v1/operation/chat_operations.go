package operation

import "app/internal/api/v1/dto"

// Chat Operations

type GetChatsInput struct {
	LectureID string `path:"lectureId" doc:"Lecture ID"`
	Limit     int    `query:"limit" default:"50" minimum:"1" maximum:"1000" doc:"Maximum number of chats to return"`
	Offset    int    `query:"offset" default:"0" minimum:"0" doc:"Number of chats to skip"`
}

type GetChatsOutput struct {
	Body []dto.ChatResponseDTO `json:"body"`
}

type GetChatInput struct {
	LectureID string `path:"lectureId" doc:"Lecture ID"`
	ChatID    string `path:"chatId" doc:"Chat ID"`
}

type GetChatOutput struct {
	Body dto.ChatResponseDTO `json:"body"`
}

type CreateChatInput struct {
	LectureID string            `path:"lectureId" doc:"Lecture ID"`
	Body      dto.ChatCreateDTO `json:"body"`
}

type CreateChatOutput struct {
	Body dto.ChatResponseDTO `json:"body"`
}

type UpdateChatInput struct {
	LectureID string            `path:"lectureId" doc:"Lecture ID"`
	ChatID    string            `path:"chatId" doc:"Chat ID"`
	Body      dto.ChatUpdateDTO `json:"body"`
}

type UpdateChatOutput struct {
	Body dto.ChatResponseDTO `json:"body"`
}

type DeleteChatInput struct {
	LectureID string `path:"lectureId" doc:"Lecture ID"`
	ChatID    string `path:"chatId" doc:"Chat ID"`
}

type DeleteChatOutput struct {
	// 204 No Content
}

// Chat Message Operations

type ListMessagesInput struct {
	LectureID string `path:"lectureId" doc:"Lecture ID"`
	ChatID    string `path:"chatId" doc:"Chat ID"`
	Limit     int    `query:"limit" default:"100" minimum:"1" maximum:"200" doc:"Maximum number of messages to return"`
}

type ListMessagesOutput struct {
	Body []dto.MessageResponseDTO `json:"body"`
}

// Chat Streaming - handled as raw HTTP handler like SSE test
// Input parsed from request body in handler
