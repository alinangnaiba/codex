package file

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type StorageService interface {
	ImportMarkdownFile(filePath string) (string, error)
}

type Service struct {
	storageService StorageService
}

func NewService(storageService StorageService) *Service {
	return &Service{
		storageService: storageService,
	}
}

func (s *Service) ImportMarkdownFile(filePath string) (string, error) {
	return s.storageService.ImportMarkdownFile(filePath)
}

type Handler struct {
	service *Service
	ctx     context.Context
}

func NewHandler(service *Service, ctx context.Context) *Handler {
	return &Handler{
		service: service,
		ctx:     ctx,
	}
}

func (h *Handler) ImportMarkdownFile(filePath string) (string, error) {
	return h.service.ImportMarkdownFile(filePath)
}

func (h *Handler) SelectDirectory() (string, error) {
	return runtime.OpenDirectoryDialog(h.ctx, runtime.OpenDialogOptions{
		Title: "Select Content Directory",
	})
}

func (h *Handler) SelectMarkdownFile() (string, error) {
	return runtime.OpenFileDialog(h.ctx, runtime.OpenDialogOptions{
		Title: "Import Markdown File",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Markdown Files (*.md)",
				Pattern:     "*.md;*.markdown",
			},
		},
	})
}
