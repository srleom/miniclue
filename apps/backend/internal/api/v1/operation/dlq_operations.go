package operation

import "app/internal/api/v1/dto"

// Dead Letter Queue Operations

type RecordDLQInput struct {
	Body dto.PubSubPushRequest `json:"body"`
}

type RecordDLQOutput struct {
	// 200 OK with empty body
}

type GetDLQMessagesInput struct {
	Limit  int `query:"limit" default:"50" minimum:"1" maximum:"1000" doc:"Number of messages"`
	Offset int `query:"offset" default:"0" minimum:"0" doc:"Offset for pagination"`
}

type GetDLQMessagesOutput struct {
	Body interface{} `json:"body"` // Array of DLQ messages
}
