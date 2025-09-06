package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strconv"

	"codex-wails/internal/adapters"
	"codex-wails/internal/config"
	"codex-wails/internal/database"
	"codex-wails/internal/domain/codex"
	"codex-wails/internal/domain/file"
	"codex-wails/internal/domain/section"
	"codex-wails/internal/domain/settings"
	"codex-wails/internal/dto"
	"codex-wails/internal/logger"
	"codex-wails/internal/recovery"
	"codex-wails/internal/storage"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context

	// Configuration and logging
	config *config.Config
	logger *logger.Logger

	// Core services
	db             *database.DB
	storageService *storage.Service

	// Domain handlers
	codexHandler    *codex.Handler
	sectionHandler  *section.Handler
	settingsHandler *settings.Handler
	fileHandler     *file.Handler
}

func NewApp() *App {
	return &App{
		config: config.Load(),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize logger first
	a.logger = logger.New(a.config.DataPath, a.config.IsDevelopment)

	// Set up panic recovery with logger
	defer recovery.HandlePanic(a.logger)

	a.logger.Info("Application starting up...")

	runtime.LogInfo(a.ctx, "Application starting up...")

	// Initialize database and storage
	if err := a.initializeServices(); err != nil {
		a.logger.Error("Failed to initialize services:", err)
		runtime.LogErrorf(a.ctx, "Failed to initialize services: %v", err)
		// Don't return here - we still want the app to run so user can see the error
	} else {
		a.logger.Info("Services initialized successfully")
		runtime.LogInfo(a.ctx, "Services initialized successfully")
	}
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	a.logger.Info("Application shutting down...")

	// Close storage service
	if a.storageService != nil {
		if err := a.storageService.Close(); err != nil {
			a.logger.Warn("Failed to close storage service:", err)
		}
	}

	// Close database
	if a.db != nil {
		if err := a.db.Close(); err != nil {
			a.logger.Error("Failed to close database:", err)
		} else {
			a.logger.Info("Database closed successfully")
		}
	}

	a.logger.Info("Application shutdown complete")
}

// initializeServices initializes the database and storage services
func (a *App) initializeServices() error {
	// Use config data path
	appDataDir := a.config.DataPath
	a.logger.Info("App data directory:", appDataDir)
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
	codexRepo := database.NewCodexRepository(db)
	sectionRepo := database.NewSectionRepository(db)
	settingsRepo := database.NewSettingsRepository(db)
	runtime.LogInfo(a.ctx, "Repositories initialized")

	// Set default settings
	if err := settingsRepo.SetDefaults(); err != nil {
		return fmt.Errorf("failed to set default settings: %w", err)
	}
	runtime.LogInfo(a.ctx, "Default settings applied")

	// Configure logger from settings
	a.configureLogger(settingsRepo)

	// Get content path from settings
	contentPath, err := settingsRepo.Get("contentPath")
	if err != nil || contentPath == "" {
		// Use default content path if not set
		contentPath = filepath.Join(appDataDir, "content")
		settingsRepo.Set("contentPath", contentPath)
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

	// Initialize adapters
	storageAdapter := adapters.NewStorageServiceAdapter(storageService)

	// Initialize domain repositories
	codexDomainRepo := codex.NewRepository(codexRepo)
	sectionDomainRepo := section.NewRepository(sectionRepo)
	settingsDomainRepo := settings.NewRepository(settingsRepo)

	// Initialize domain services
	codexService := codex.NewService(codexDomainRepo, storageAdapter)
	sectionService := section.NewService(sectionDomainRepo, storageAdapter)
	settingsService := settings.NewService(settingsDomainRepo, storageAdapter)
	fileService := file.NewService(storageAdapter)

	// Initialize domain handlers
	a.codexHandler = codex.NewHandler(codexService)
	a.sectionHandler = section.NewHandler(sectionService)
	a.settingsHandler = settings.NewHandler(settingsService, a.updateStorageService)
	a.fileHandler = file.NewHandler(fileService, a.ctx)
	runtime.LogInfo(a.ctx, "Domain handlers initialized")

	return nil
}

// configureLogger applies logger settings from database
func (a *App) configureLogger(settingsRepo *database.SettingsRepository) {
	// Configure log level
	if logLevel, err := settingsRepo.Get("logLevel"); err == nil {
		switch logLevel {
		case "debug":
			a.logger.SetLogLevel(logger.DEBUG)
		case "info":
			a.logger.SetLogLevel(logger.INFO)
		case "warn":
			a.logger.SetLogLevel(logger.WARN)
		case "error":
			a.logger.SetLogLevel(logger.ERROR)
		}
	}

	// Configure log retention
	if retentionDays, err := settingsRepo.Get("logRetentionDays"); err == nil {
		if days, err := strconv.Atoi(retentionDays); err == nil && days > 0 && days <= 30 {
			a.logger.SetRetentionDays(days)
		}
	}
}

// updateStorageService updates the storage service when content path changes
func (a *App) updateStorageService(newPath string) error {
	// Create new storage service
	newStorageService, err := storage.NewService(newPath)
	if err != nil {
		return err
	}

	// Clean up old storage service if it exists
	if a.storageService != nil {
		if err := a.storageService.Close(); err != nil {
			a.logger.Warn("Failed to close old storage service:", err)
		}
	}

	// Replace with new service
	a.storageService = newStorageService
	a.logger.Info("Storage service updated to new path:", newPath)

	return nil
}

// --- Codex API Functions ---

// GetAllCodexes retrieves all codexes
func (a *App) GetAllCodexes() ([]dto.CodexResponse, error) {
	return a.codexHandler.GetAll()
}

// SearchCodexes searches for codexes by query
func (a *App) SearchCodexes(query string) ([]dto.CodexResponse, error) {
	return a.codexHandler.Search(query)
}

// CreateCodex creates a new codex
func (a *App) CreateCodex(title, description string) (*dto.CodexResponse, error) {
	return a.codexHandler.Create(title, description)
}

// UpdateCodex updates a codex
func (a *App) UpdateCodex(id int, title, description string) error {
	return a.codexHandler.Update(id, title, description)
}

// DeleteCodex deletes a codex and its content
func (a *App) DeleteCodex(id int) error {
	return a.codexHandler.Delete(id)
}

// PinCodex sets the pinned status of a codex
func (a *App) PinCodex(id int, isPinned bool) error {
	return a.codexHandler.SetPinned(id, isPinned)
}

// GetCodexWithSections retrieves a codex with all its sections
func (a *App) GetCodexWithSections(id int) (*dto.CodexWithSectionsResponse, error) {
	return a.codexHandler.GetWithSections(id)
}

// GetCodexProgress retrieves the reading progress of a codex
func (a *App) GetCodexProgress(id int) (*dto.CodexProgressResponse, error) {
	return a.codexHandler.GetProgress(id)
}

// --- Section API Functions ---

// CreateSection creates a new section in a codex
func (a *App) CreateSection(codexID int, title string) (*dto.SectionResponse, error) {
	return a.sectionHandler.Create(codexID, title)
}

// UpdateSection updates a section's title and content
func (a *App) UpdateSection(id int, title, content string) error {
	return a.sectionHandler.Update(id, title, content)
}

// GetSectionContent retrieves the content of a section
func (a *App) GetSectionContent(sectionID int) (string, error) {
	return a.sectionHandler.GetContent(sectionID)
}

// DeleteSection deletes a section
func (a *App) DeleteSection(id int) error {
	return a.sectionHandler.Delete(id)
}

// SetSectionComplete sets the completion status of a section
func (a *App) SetSectionComplete(id int, isComplete bool) error {
	return a.sectionHandler.SetComplete(id, isComplete)
}

// GetSectionsByCodex retrieves all sections for a codex
func (a *App) GetSectionsByCodex(codexID int) ([]dto.SectionResponse, error) {
	return a.sectionHandler.GetByCodexID(codexID)
}

// --- Settings API Functions ---

// GetSettings retrieves all settings as a map
func (a *App) GetSettings() (map[string]string, error) {
	return a.settingsHandler.GetAll()
}

// SaveSettings saves multiple settings at once
func (a *App) SaveSettings(settings map[string]string) error {
	return a.settingsHandler.SaveBatch(settings)
}

// GetSetting retrieves a specific setting
func (a *App) GetSetting(key string) (string, error) {
	return a.settingsHandler.Get(key)
}

// SetSetting sets a specific setting
func (a *App) SetSetting(key, value string) error {
	return a.settingsHandler.Set(key, value)
}

// --- File Operations ---

// ImportMarkdownFile imports content from a markdown file
func (a *App) ImportMarkdownFile(filePath string) (string, error) {
	return a.fileHandler.ImportMarkdownFile(filePath)
}

// SelectDirectory opens a directory picker dialog
func (a *App) SelectDirectory() (string, error) {
	return a.fileHandler.SelectDirectory()
}

// SelectMarkdownFile opens a file picker dialog for markdown files
func (a *App) SelectMarkdownFile() (string, error) {
	return a.fileHandler.SelectMarkdownFile()
}

// CheckInitialized checks if the app has been initialized
func (a *App) CheckInitialized() (bool, error) {
	initialized, err := a.settingsHandler.Get("initialized")
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
