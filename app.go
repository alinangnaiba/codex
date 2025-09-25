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

// getInitialWindowSize loads saved window size from settings or returns defaults
func (a *App) getInitialWindowSize() (int, int) {
	// Default values
	defaultWidth, defaultHeight := 1280, 800
	minWidth, minHeight := 1024, 600

	db, err := database.New(a.config.DataPath)
	if err != nil {
		return defaultWidth, defaultHeight
	}
	defer db.Close()

	settingsRepo := database.NewSettingsRepository(db)

	if err := settingsRepo.SetDefaults(); err != nil {
		return defaultWidth, defaultHeight
	}

	widthStr, err := settingsRepo.Get("windowWidth")
	if err != nil {
		return defaultWidth, defaultHeight
	}

	heightStr, err := settingsRepo.Get("windowHeight")
	if err != nil {
		return defaultWidth, defaultHeight
	}

	width, err := strconv.Atoi(widthStr)
	if err != nil || width < minWidth {
		width = defaultWidth
	}

	height, err := strconv.Atoi(heightStr)
	if err != nil || height < minHeight {
		height = defaultHeight
	}

	return width, height
}

// SaveCurrentWindowSize gets and saves the current window size to settings
func (a *App) SaveCurrentWindowSize() error {
	if a.ctx == nil || a.settingsHandler == nil {
		return fmt.Errorf("app not properly initialized")
	}

	defer func() {
		if r := recover(); r != nil {
			if a.logger != nil {
				a.logger.Warn("Recovered from panic while getting window size:", r)
			}
		}
	}()

	width, height := runtime.WindowGetSize(a.ctx)

	minWidth, minHeight := 1024, 600
	if width <= 0 || height <= 0 || width < minWidth || height < minHeight {
		if a.logger != nil {
			a.logger.Warn("Invalid window size, not saving:", width, "x", height)
		}
		return fmt.Errorf("invalid window size: %dx%d", width, height)
	}

	widthStr := strconv.Itoa(width)
	heightStr := strconv.Itoa(height)

	if err := a.settingsHandler.Set("windowWidth", widthStr); err != nil {
		if a.logger != nil {
			a.logger.Error("Failed to save window width:", err)
		}
		return err
	}

	if err := a.settingsHandler.Set("windowHeight", heightStr); err != nil {
		if a.logger != nil {
			a.logger.Error("Failed to save window height:", err)
		}
		return err
	}

	if a.logger != nil {
		a.logger.Info("Saved window size:", width, "x", height)
	}
	return nil
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	a.logger = logger.New(a.config.DataPath, a.config.IsDevelopment)

	defer recovery.HandlePanic(a.logger)

	a.logger.Info("Application starting up...")

	runtime.LogInfo(a.ctx, "Application starting up...")

	if err := a.initializeServices(); err != nil {
		a.logger.Error("Failed to initialize services:", err)
		runtime.LogErrorf(a.ctx, "Failed to initialize services: %v", err)
	} else {
		a.logger.Info("Services initialized successfully")
		runtime.LogInfo(a.ctx, "Services initialized successfully")
	}
}

// shutdown is called when the app is closing
func (a *App) shutdown(ctx context.Context) {
	a.logger.Info("Application shutting down...")

	if a.storageService != nil {
		if err := a.storageService.Close(); err != nil {
			a.logger.Warn("Failed to close storage service:", err)
		}
	}

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
	appDataDir := a.config.DataPath
	a.logger.Info("App data directory:", appDataDir)
	runtime.LogInfof(a.ctx, "App data directory: %s", appDataDir)

	if err := os.MkdirAll(appDataDir, 0755); err != nil {
		return fmt.Errorf("failed to create app data directory: %w", err)
	}

	runtime.LogInfo(a.ctx, "Initializing database...")
	db, err := database.New(appDataDir)
	if err != nil {
		return fmt.Errorf("failed to initialize database: %w", err)
	}
	a.db = db
	runtime.LogInfo(a.ctx, "Database initialized")

	codexRepo := database.NewCodexRepository(db)
	sectionRepo := database.NewSectionRepository(db)
	settingsRepo := database.NewSettingsRepository(db)
	runtime.LogInfo(a.ctx, "Repositories initialized")

	if err := settingsRepo.SetDefaults(); err != nil {
		return fmt.Errorf("failed to set default settings: %w", err)
	}
	runtime.LogInfo(a.ctx, "Default settings applied")

	a.configureLogger(settingsRepo)

	contentPath, err := settingsRepo.Get("contentPath")
	if err != nil || contentPath == "" {
		contentPath = filepath.Join(appDataDir, "content")
		settingsRepo.Set("contentPath", contentPath)
		runtime.LogInfof(a.ctx, "Using default content path: %s", contentPath)
	} else {
		runtime.LogInfof(a.ctx, "Using existing content path: %s", contentPath)
	}

	storageService, err := storage.NewService(contentPath)
	if err != nil {
		return fmt.Errorf("failed to initialize storage: %w", err)
	}
	a.storageService = storageService
	runtime.LogInfo(a.ctx, "Storage service initialized")

	storageAdapter := adapters.NewStorageServiceAdapter(storageService)
	codexDomainRepo := codex.NewRepository(codexRepo)
	sectionDomainRepo := section.NewRepository(sectionRepo)
	settingsDomainRepo := settings.NewRepository(settingsRepo)

	codexService := codex.NewService(codexDomainRepo, storageAdapter)
	sectionService := section.NewService(sectionDomainRepo, storageAdapter)
	settingsService := settings.NewService(settingsDomainRepo, storageAdapter)
	fileService := file.NewService(storageAdapter)

	a.codexHandler = codex.NewHandler(codexService)
	a.sectionHandler = section.NewHandler(sectionService)
	a.settingsHandler = settings.NewHandler(settingsService, a.updateStorageService)
	a.fileHandler = file.NewHandler(fileService, a.ctx)
	runtime.LogInfo(a.ctx, "Domain handlers initialized")

	return nil
}

// configureLogger applies logger settings from database
func (a *App) configureLogger(settingsRepo *database.SettingsRepository) {
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

	if retentionDays, err := settingsRepo.Get("logRetentionDays"); err == nil {
		if days, err := strconv.Atoi(retentionDays); err == nil && days > 0 && days <= 30 {
			a.logger.SetRetentionDays(days)
		}
	}
}

// updateStorageService updates the storage service when content path changes
func (a *App) updateStorageService(newPath string) error {
	newStorageService, err := storage.NewService(newPath)
	if err != nil {
		return err
	}

	if a.storageService != nil {
		if err := a.storageService.Close(); err != nil {
			a.logger.Warn("Failed to close old storage service:", err)
		}
	}

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
