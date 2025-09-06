package adapters

import (
	"codex-wails/internal/domain/codex"
	"codex-wails/internal/domain/file"
	"codex-wails/internal/domain/section"
	"codex-wails/internal/domain/settings"
	"codex-wails/internal/storage"
)

type StorageServiceAdapter struct {
	storageService *storage.Service
}

func NewStorageServiceAdapter(storageService *storage.Service) *StorageServiceAdapter {
	return &StorageServiceAdapter{
		storageService: storageService,
	}
}

func (a *StorageServiceAdapter) DeleteCodexContent(codexID int) error {
	return a.storageService.DeleteCodexContent(codexID)
}

func (a *StorageServiceAdapter) SaveContent(codexID, sectionID int, content string) (string, error) {
	return a.storageService.SaveContent(codexID, sectionID, content)
}

func (a *StorageServiceAdapter) ReadContent(filePath string) (string, error) {
	return a.storageService.ReadContent(filePath)
}

func (a *StorageServiceAdapter) DeleteContent(filePath string) error {
	return a.storageService.DeleteContent(filePath)
}

func (a *StorageServiceAdapter) ValidateStoragePath(path string) error {
	return a.storageService.ValidateStoragePath(path)
}

func (a *StorageServiceAdapter) ImportMarkdownFile(filePath string) (string, error) {
	return a.storageService.ImportMarkdownFile(filePath)
}

// Ensure all interfaces are implemented
var _ codex.StorageService = (*StorageServiceAdapter)(nil)
var _ section.StorageService = (*StorageServiceAdapter)(nil)
var _ settings.StorageService = (*StorageServiceAdapter)(nil)
var _ file.StorageService = (*StorageServiceAdapter)(nil)
