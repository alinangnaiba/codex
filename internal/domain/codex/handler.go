package codex

import (
	"codex-wails/internal/dto"
	"fmt"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

func (h *Handler) GetAll() ([]dto.CodexResponse, error) {
	if h.service == nil {
		return []dto.CodexResponse{}, fmt.Errorf("service not initialized")
	}
	return h.service.GetAll()
}

func (h *Handler) Search(query string) ([]dto.CodexResponse, error) {
	if h.service == nil {
		return []dto.CodexResponse{}, fmt.Errorf("service not initialized")
	}
	return h.service.Search(query)
}

func (h *Handler) Create(title, description string) (*dto.CodexResponse, error) {
	return h.service.Create(title, description)
}

func (h *Handler) Update(id int, title, description string) error {
	return h.service.Update(id, title, description)
}

func (h *Handler) Delete(id int) error {
	return h.service.Delete(id)
}

func (h *Handler) SetPinned(id int, isPinned bool) error {
	return h.service.SetPinned(id, isPinned)
}

func (h *Handler) GetWithSections(id int) (*dto.CodexWithSectionsResponse, error) {
	return h.service.GetWithSections(id)
}

func (h *Handler) GetProgress(id int) (*dto.CodexProgressResponse, error) {
	return h.service.GetProgress(id)
}
