package dto

// LectureSummaryResponseDTO is returned for a lecture's summary
// @Summary Lecture summary
// @Tags lectures
// @Produce json
// @Success 200 {object} dto.LectureSummaryResponseDTO
// @Router /lectures/{lectureId}/summary [get]
type LectureSummaryResponseDTO struct {
    LectureID string `json:"lecture_id"`
    Content   string `json:"content"`
}
