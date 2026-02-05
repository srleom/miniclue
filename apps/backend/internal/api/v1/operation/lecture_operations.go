package operation

import "app/internal/api/v1/dto"

// Lecture CRUD Operations

type GetLecturesInput struct {
	CourseID string `path:"courseId" doc:"Course ID to filter lectures"`
	Limit    int    `query:"limit" default:"10" minimum:"1" maximum:"1000" doc:"Number of lectures"`
	Offset   int    `query:"offset" default:"0" minimum:"0" doc:"Offset for pagination"`
}

type GetLecturesOutput struct {
	Body []dto.LectureResponseDTO `json:"body"`
}

type GetLectureInput struct {
	LectureID string `path:"lectureId" doc:"Lecture ID"`
}

type GetLectureOutput struct {
	Body dto.LectureResponseDTO `json:"body"`
}

type UpdateLectureInput struct {
	LectureID string               `path:"lectureId" doc:"Lecture ID"`
	Body      dto.LectureUpdateDTO `json:"body"`
}

type UpdateLectureOutput struct {
	Body dto.LectureResponseDTO `json:"body"`
}

type DeleteLectureInput struct {
	LectureID string `path:"lectureId" doc:"Lecture ID"`
}

type DeleteLectureOutput struct {
	// 204 No Content
}

// Lecture Upload Operations

type BatchUploadURLInput struct {
	Body dto.LectureUploadURLRequestDTO `json:"body"`
}

type BatchUploadURLOutput struct {
	Body dto.LectureBatchUploadURLResponseDTO `json:"body"`
}

type UploadCompleteInput struct {
	LectureID string                              `path:"lectureId" doc:"Lecture ID"`
	Body      dto.LectureUploadCompleteRequestDTO `json:"body"`
}

type UploadCompleteOutput struct {
	Body dto.LectureUploadCompleteResponseDTO `json:"body"`
}

// Lecture Signed URL Operations

type GetSignedURLInput struct {
	LectureID string `path:"lectureId" doc:"Lecture ID"`
}

type GetSignedURLOutput struct {
	Body dto.SignedURLResponseDTO `json:"body"`
}
