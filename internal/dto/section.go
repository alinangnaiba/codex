package dto

// SectionResponse represents the data returned to the frontend
type SectionResponse struct {
	ID         int    `json:"id"`
	CodexID    int    `json:"codexId"`
	Title      string `json:"title"`
	FilePath   string `json:"filePath"`
	IsComplete bool   `json:"isComplete"`
	OrderIndex int    `json:"orderIndex"`
	CreatedAt  string `json:"createdAt"`
	UpdatedAt  string `json:"updatedAt"`
}

// SectionCreateRequest represents the request to create a section
type SectionCreateRequest struct {
	CodexID int    `json:"codexId"`
	Title   string `json:"title"`
}

// SectionUpdateRequest represents the request to update a section
type SectionUpdateRequest struct {
	Title   string `json:"title"`
	Content string `json:"content,omitempty"`
}
