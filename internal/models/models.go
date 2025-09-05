package models

import (
	"time"
)

// Codex represents a collection of notes
type Codex struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	IsPinned    bool      `json:"isPinned"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Section represents a single section within a Codex
type Section struct {
	ID         int       `json:"id"`
	CodexID    int       `json:"codexId"`
	Title      string    `json:"title"`
	FilePath   string    `json:"filePath"`
	IsComplete bool      `json:"isComplete"`
	OrderIndex int       `json:"orderIndex"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// Setting represents application settings
type Setting struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// CodexWithSections includes a Codex with all its sections
type CodexWithSections struct {
	Codex
	Sections []Section `json:"sections"`
}

// CodexProgress represents the reading progress of a Codex
type CodexProgress struct {
	CodexID           int     `json:"codexId"`
	TotalSections     int     `json:"totalSections"`
	CompletedSections int     `json:"completedSections"`
	ProgressPercent   float32 `json:"progressPercent"`
}
