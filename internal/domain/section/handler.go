package section

import (
	"codex-wails/internal/dto"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service: service,
	}
}

func (h *Handler) Create(codexID int, title string) (*dto.SectionResponse, error) {
	return h.service.Create(codexID, title)
}

func (h *Handler) Update(id int, title, content string) error {
	return h.service.Update(id, title, content)
}

func (h *Handler) GetContent(sectionID int) (string, error) {
	return h.service.GetContent(sectionID)
}

func (h *Handler) Delete(id int) error {
	return h.service.Delete(id)
}

func (h *Handler) SetComplete(id int, isComplete bool) error {
	return h.service.SetComplete(id, isComplete)
}

func (h *Handler) GetByCodexID(codexID int) ([]dto.SectionResponse, error) {
	return h.service.GetByCodexID(codexID)
}
