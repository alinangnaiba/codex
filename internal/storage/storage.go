package storage

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Service handles file storage operations
type Service struct {
	basePath string
}

// NewService creates a new storage service
func NewService(basePath string) (*Service, error) {
	// Ensure the base path exists
	if err := os.MkdirAll(basePath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create storage directory: %w", err)
	}

	return &Service{
		basePath: basePath,
	}, nil
}

// SaveContent saves content to a file and returns the relative file path
func (s *Service) SaveContent(codexID, sectionID int, content string) (string, error) {
	// Create codex directory
	codexDir := filepath.Join(s.basePath, fmt.Sprintf("codex_%d", codexID))
	if err := os.MkdirAll(codexDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create codex directory: %w", err)
	}

	// Generate file name
	fileName := fmt.Sprintf("section_%d.md", sectionID)
	filePath := filepath.Join(codexDir, fileName)

	// Write content to file
	if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	// Return relative path for storage in database
	relPath := filepath.Join(fmt.Sprintf("codex_%d", codexID), fileName)
	return relPath, nil
}

// ReadContent reads content from a file
func (s *Service) ReadContent(relativePath string) (string, error) {
	if relativePath == "" {
		return "", nil
	}

	filePath := filepath.Join(s.basePath, relativePath)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return "", nil // Return empty string if file doesn't exist
	}

	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	return string(content), nil
}

// DeleteContent deletes a content file
func (s *Service) DeleteContent(relativePath string) error {
	if relativePath == "" {
		return nil // Nothing to delete
	}

	filePath := filepath.Join(s.basePath, relativePath)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil // File doesn't exist, nothing to delete
	}

	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

// DeleteCodexContent deletes all content files for a codex
func (s *Service) DeleteCodexContent(codexID int) error {
	codexDir := filepath.Join(s.basePath, fmt.Sprintf("codex_%d", codexID))

	// Check if directory exists
	if _, err := os.Stat(codexDir); os.IsNotExist(err) {
		return nil // Directory doesn't exist, nothing to delete
	}

	if err := os.RemoveAll(codexDir); err != nil {
		return fmt.Errorf("failed to delete codex directory: %w", err)
	}

	return nil
}

// ImportMarkdownFile imports a markdown file and returns its content
func (s *Service) ImportMarkdownFile(filePath string) (string, error) {
	// Check if file exists
	if _, err := os.Stat(filePath); err != nil {
		if os.IsNotExist(err) {
			return "", fmt.Errorf("file not found: %s", filePath)
		}
		return "", fmt.Errorf("failed to access file: %w", err)
	}

	// Check if it's a markdown file
	ext := strings.ToLower(filepath.Ext(filePath))
	if ext != ".md" && ext != ".markdown" {
		return "", fmt.Errorf("file must be a markdown file (.md or .markdown)")
	}

	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	return string(content), nil
}

// ExportContent exports content to a specified file path
func (s *Service) ExportContent(content, targetPath string) error {
	// Ensure the directory exists
	dir := filepath.Dir(targetPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Write content to file
	if err := os.WriteFile(targetPath, []byte(content), 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	return nil
}

// GetBasePath returns the base storage path
func (s *Service) GetBasePath() string {
	return s.basePath
}

// ValidateStoragePath checks if a path is valid and accessible
func (s *Service) ValidateStoragePath(path string) error {
	// Check if path exists
	info, err := os.Stat(path)
	if err != nil {
		if os.IsNotExist(err) {
			// Try to create it
			if err := os.MkdirAll(path, 0755); err != nil {
				return fmt.Errorf("cannot create directory: %w", err)
			}
			return nil
		}
		return fmt.Errorf("cannot access path: %w", err)
	}

	// Check if it's a directory
	if !info.IsDir() {
		return fmt.Errorf("path is not a directory")
	}

	// Check write permissions by creating a test file
	testFile := filepath.Join(path, ".codex_test")
	if err := os.WriteFile(testFile, []byte("test"), 0644); err != nil {
		return fmt.Errorf("cannot write to directory: %w", err)
	}

	// Clean up test file
	os.Remove(testFile)

	return nil
}
