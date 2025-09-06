package mappers

import (
	"codex-wails/internal/dto"
	"codex-wails/internal/models"
	"time"
)

// ToCodexResponse converts a models.Codex to dto.CodexResponse
func ToCodexResponse(codex *models.Codex) *dto.CodexResponse {
	if codex == nil {
		return nil
	}

	return &dto.CodexResponse{
		ID:          codex.ID,
		Title:       codex.Title,
		Description: codex.Description,
		IsPinned:    codex.IsPinned,
		CreatedAt:   codex.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   codex.UpdatedAt.Format(time.RFC3339),
	}
}

// ToCodexResponseList converts a slice of models.Codex to slice of dto.CodexResponse
func ToCodexResponseList(codexes []models.Codex) []dto.CodexResponse {
	responses := make([]dto.CodexResponse, len(codexes))
	for i, codex := range codexes {
		responses[i] = *ToCodexResponse(&codex)
	}
	return responses
}

// ToCodexWithSectionsResponse converts models.CodexWithSections to dto.CodexWithSectionsResponse
func ToCodexWithSectionsResponse(codex *models.CodexWithSections) *dto.CodexWithSectionsResponse {
	if codex == nil {
		return nil
	}

	return &dto.CodexWithSectionsResponse{
		CodexResponse: *ToCodexResponse(&codex.Codex),
		Sections:      ToSectionResponseList(codex.Sections),
	}
}

// ToSectionResponse converts a models.Section to dto.SectionResponse
func ToSectionResponse(section *models.Section) *dto.SectionResponse {
	if section == nil {
		return nil
	}

	return &dto.SectionResponse{
		ID:         section.ID,
		CodexID:    section.CodexID,
		Title:      section.Title,
		FilePath:   section.FilePath,
		IsComplete: section.IsComplete,
		OrderIndex: section.OrderIndex,
		CreatedAt:  section.CreatedAt.Format(time.RFC3339),
		UpdatedAt:  section.UpdatedAt.Format(time.RFC3339),
	}
}

// ToSectionResponseList converts a slice of models.Section to slice of dto.SectionResponse
func ToSectionResponseList(sections []models.Section) []dto.SectionResponse {
	responses := make([]dto.SectionResponse, len(sections))
	for i, section := range sections {
		responses[i] = *ToSectionResponse(&section)
	}
	return responses
}

// ToCodexProgressResponse converts a models.CodexProgress to dto.CodexProgressResponse
func ToCodexProgressResponse(progress *models.CodexProgress) *dto.CodexProgressResponse {
	if progress == nil {
		return nil
	}

	return &dto.CodexProgressResponse{
		CodexID:           progress.CodexID,
		TotalSections:     progress.TotalSections,
		CompletedSections: progress.CompletedSections,
		ProgressPercent:   progress.ProgressPercent,
	}
}
