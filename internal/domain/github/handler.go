package github

import (
	"context"

	"codex-wails/internal/dto"
)

// Handler exposes GitHub operations to the frontend
type Handler struct {
	service *Service
	ctx     context.Context
}

// NewHandler creates a new GitHub handler
func NewHandler(service *Service, ctx context.Context) *Handler {
	return &Handler{
		service: service,
		ctx:     ctx,
	}
}

// TestConnection validates GitHub credentials and repository access
func (h *Handler) TestConnection(pat, repoURL string) error {
	return h.service.TestConnection(h.ctx, pat, repoURL)
}

// Initialize sets up GitHub integration
func (h *Handler) Initialize(pat, repoURL, branch string) error {
	if branch == "" {
		branch = "main"
	}
	return h.service.Initialize(h.ctx, pat, repoURL, branch)
}

// GetStatus returns the current synchronization status
func (h *Handler) GetStatus() (*dto.GitHubStatusResponse, error) {
	return h.service.GetStatus()
}

// Sync synchronizes local content to GitHub
func (h *Handler) Sync(commitMessage string) error {
	if commitMessage == "" {
		commitMessage = "Update from CodeX"
	}
	return h.service.Sync(h.ctx, commitMessage)
}

// Disconnect removes GitHub integration settings
func (h *Handler) Disconnect() error {
	return h.service.Disconnect()
}
