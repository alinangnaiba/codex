package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"codex-wails/internal/database"
	"codex-wails/internal/models"
	"codex-wails/internal/storage"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx          context.Context
	db           *database.DB
	codexRepo    *database.CodexRepository
	sectionRepo  *database.SectionRepository
	settingsRepo *database.SettingsRepository
	storageService *storage.Service
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	runtime.LogInfo(a.ctx, "Application starting up...")

	// Initialize database and storage
	if err := a.initializeServices(); err != nil {
		runtime.LogErrorf(a.ctx, "Failed to initialize services: %v", err)
		// Don't return here - we still want the app to run so user can see the error
	} else {
		runtime.LogInfo(a.ctx, "Services initialized successfully")
	}
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	if a.db != nil {
		a.db.Close()
	}
}

// initializeServices initializes the database and storage services
func (a *App) initializeServices() error {
	// Get or create app data directory
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("failed to get home directory: %w", err)
	}
	runtime.LogInfof(a.ctx, "Home directory: %s", homeDir)

	appDataDir := filepath.Join(homeDir, ".codex")
	runtime.LogInfof(a.ctx, "App data directory: %s", appDataDir)
	
	if err := os.MkdirAll(appDataDir, 0755); err != nil {
		return fmt.Errorf("failed to create app data directory: %w", err)
	}

	// Initialize database
	runtime.LogInfo(a.ctx, "Initializing database...")
	db, err := database.New(appDataDir)
	if err != nil {
		return fmt.Errorf("failed to initialize database: %w", err)
	}
	a.db = db
	runtime.LogInfo(a.ctx, "Database initialized")

	// Initialize repositories
	a.codexRepo = database.NewCodexRepository(db)
	a.sectionRepo = database.NewSectionRepository(db)
	a.settingsRepo = database.NewSettingsRepository(db)
	runtime.LogInfo(a.ctx, "Repositories initialized")

	// Set default settings
	if err := a.settingsRepo.SetDefaults(); err != nil {
		return fmt.Errorf("failed to set default settings: %w", err)
	}
	runtime.LogInfo(a.ctx, "Default settings applied")

	// Get content path from settings
	contentPath, err := a.settingsRepo.Get("contentPath")
	if err != nil || contentPath == "" {
		// Use default content path if not set
		contentPath = filepath.Join(appDataDir, "content")
		a.settingsRepo.Set("contentPath", contentPath)
		runtime.LogInfof(a.ctx, "Using default content path: %s", contentPath)
	} else {
		runtime.LogInfof(a.ctx, "Using existing content path: %s", contentPath)
	}

	// Initialize storage service
	storageService, err := storage.NewService(contentPath)
	if err != nil {
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	a.storageService = storageService
	runtime.LogInfo(a.ctx, "Storage service initialized")

	return nil
}

// --- Codex API Functions ---

// GetAllCodexes retrieves all codexes
func (a *App) GetAllCodexes() ([]models.Codex, error) {
	if a.codexRepo == nil {
		return []models.Codex{}, fmt.Errorf("repository not initialized")
	}
	
	codexes, err := a.codexRepo.GetAll()
	if err != nil {
		return []models.Codex{}, err
	}
	
	// Ensure we return an empty array instead of nil
	if codexes == nil {
		return []models.Codex{}, nil
	}
	
	return codexes, nil
}

// SearchCodexes searches for codexes by query
func (a *App) SearchCodexes(query string) ([]models.Codex, error) {
	if a.codexRepo == nil {
		return []models.Codex{}, fmt.Errorf("repository not initialized")
	}
	
	var codexes []models.Codex
	var err error
	
	if query == "" {
		codexes, err = a.codexRepo.GetAll()
	} else {
		codexes, err = a.codexRepo.Search(query)
	}
	
	if err != nil {
		return []models.Codex{}, err
	}
	
	// Ensure we return an empty array instead of nil
	if codexes == nil {
		return []models.Codex{}, nil
	}
	
	return codexes, nil
}

// CreateCodex creates a new codex
func (a *App) CreateCodex(title, description string) (*models.Codex, error) {
	return a.codexRepo.Create(title, description)
}

// UpdateCodex updates a codex
func (a *App) UpdateCodex(id int, title, description string) error {
	return a.codexRepo.Update(id, title, description)
}

// DeleteCodex deletes a codex and its content
func (a *App) DeleteCodex(id int) error {
	// Delete content files
	if err := a.storageService.DeleteCodexContent(id); err != nil {
		return fmt.Errorf("failed to delete codex content: %w", err)
	}

	// Delete from database (sections will be deleted by cascade)
	return a.codexRepo.Delete(id)
}

// PinCodex sets the pinned status of a codex
func (a *App) PinCodex(id int, isPinned bool) error {
	return a.codexRepo.SetPinned(id, isPinned)
}

// GetCodexWithSections retrieves a codex with all its sections
func (a *App) GetCodexWithSections(id int) (*models.CodexWithSections, error) {
	return a.codexRepo.GetWithSections(id)
}

// GetCodexProgress retrieves the reading progress of a codex
func (a *App) GetCodexProgress(id int) (*models.CodexProgress, error) {
	return a.codexRepo.GetProgress(id)
}

// --- Section API Functions ---

// CreateSection creates a new section in a codex
func (a *App) CreateSection(codexID int, title string) (*models.Section, error) {
	return a.sectionRepo.Create(codexID, title)
}

// UpdateSection updates a section's title and content
func (a *App) UpdateSection(id int, title, content string) error {
	// Update title in database
	if err := a.sectionRepo.Update(id, title); err != nil {
		return err
	}

	// Get section to get codexID
	section, err := a.sectionRepo.GetByID(id)
	if err != nil {
		return err
	}

	// Save content to file
	filePath, err := a.storageService.SaveContent(section.CodexID, id, content)
	if err != nil {
		return fmt.Errorf("failed to save content: %w", err)
	}

	// Update file path in database
	return a.sectionRepo.UpdateContent(id, filePath)
}

// GetSectionContent retrieves the content of a section
func (a *App) GetSectionContent(sectionID int) (string, error) {
	section, err := a.sectionRepo.GetByID(sectionID)
	if err != nil {
		return "", err
	}

	return a.storageService.ReadContent(section.FilePath)
}

// DeleteSection deletes a section
func (a *App) DeleteSection(id int) error {
	// Get section to get file path
	section, err := a.sectionRepo.GetByID(id)
	if err != nil {
		return err
	}

	// Delete content file
	if err := a.storageService.DeleteContent(section.FilePath); err != nil {
		return fmt.Errorf("failed to delete content: %w", err)
	}

	// Delete from database
	return a.sectionRepo.Delete(id)
}

// SetSectionComplete sets the completion status of a section
func (a *App) SetSectionComplete(id int, isComplete bool) error {
	return a.sectionRepo.SetComplete(id, isComplete)
}

// GetSectionsByCodex retrieves all sections for a codex
func (a *App) GetSectionsByCodex(codexID int) ([]models.Section, error) {
	return a.sectionRepo.GetByCodexID(codexID)
}

// --- Settings API Functions ---

// GetSettings retrieves all settings as a map
func (a *App) GetSettings() (map[string]string, error) {
	return a.settingsRepo.GetAllAsMap()
}

// SaveSettings saves multiple settings at once
func (a *App) SaveSettings(settings map[string]string) error {
	// If content path has changed, update storage service
	if newPath, ok := settings["contentPath"]; ok {
		// Validate the new path
		if err := a.storageService.ValidateStoragePath(newPath); err != nil {
			return fmt.Errorf("invalid storage path: %w", err)
		}

		// Update storage service
		storageService, err := storage.NewService(newPath)
		if err != nil {
			return fmt.Errorf("failed to update storage service: %w", err)
		}
		a.storageService = storageService
	}

	return a.settingsRepo.SetBatch(settings)
}

// GetSetting retrieves a specific setting
func (a *App) GetSetting(key string) (string, error) {
	return a.settingsRepo.Get(key)
}

// SetSetting sets a specific setting
func (a *App) SetSetting(key, value string) error {
	return a.settingsRepo.Set(key, value)
}

// --- File Operations ---

// ImportMarkdownFile imports content from a markdown file
func (a *App) ImportMarkdownFile(filePath string) (string, error) {
	return a.storageService.ImportMarkdownFile(filePath)
}

// SelectDirectory opens a directory picker dialog
func (a *App) SelectDirectory() (string, error) {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Content Directory",
	})
	if err != nil {
		return "", err
	}
	return dir, nil
}

// SelectMarkdownFile opens a file picker dialog for markdown files
func (a *App) SelectMarkdownFile() (string, error) {
	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Import Markdown File",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Markdown Files (*.md)",
				Pattern:     "*.md;*.markdown",
			},
		},
	})
	if err != nil {
		return "", err
	}
	return file, nil
}

// CheckInitialized checks if the app has been initialized
func (a *App) CheckInitialized() (bool, error) {
	// Check if repos are initialized
	if a.settingsRepo == nil {
		runtime.LogError(a.ctx, "Settings repository is nil in CheckInitialized")
		return false, fmt.Errorf("settings repository not initialized")
	}
	
	initialized, err := a.settingsRepo.Get("initialized")
	if err != nil {
		// This is expected on first run when the setting doesn't exist
		runtime.LogInfo(a.ctx, "Initialized setting not found, assuming first run")
		return false, nil
	}
	
	result := initialized == "true"
	runtime.LogInfof(a.ctx, "CheckInitialized returning: %v", result)
	return result, nil
}

// GetDefaultContentPath returns the default content path that would be used
func (a *App) GetDefaultContentPath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home directory: %w", err)
	}
	
	defaultPath := filepath.Join(homeDir, ".codex", "content")
	return defaultPath, nil
}
