package dto

// CodexResponse represents the data returned to the frontend
type CodexResponse struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	IsPinned    bool   `json:"isPinned"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

// CodexWithSectionsResponse represents a codex with its sections
type CodexWithSectionsResponse struct {
	CodexResponse
	Sections []SectionResponse `json:"sections"`
}

// CodexCreateRequest represents the request to create a codex
type CodexCreateRequest struct {
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
}

// CodexUpdateRequest represents the request to update a codex
type CodexUpdateRequest struct {
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
}

// CodexProgressResponse represents the reading progress of a codex
type CodexProgressResponse struct {
	CodexID           int     `json:"codexId"`
	TotalSections     int     `json:"totalSections"`
	CompletedSections int     `json:"completedSections"`
	ProgressPercent   float32 `json:"progressPercent"`
}
