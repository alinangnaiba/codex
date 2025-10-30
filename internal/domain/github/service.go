package github

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"

	"codex-wails/internal/database"
	"codex-wails/internal/dto"
	"codex-wails/internal/models"
)

// Service handles GitHub integration business logic
type Service struct {
	codexRepo    *database.CodexRepository
	sectionRepo  *database.SectionRepository
	settingsRepo *database.SettingsRepository
	contentPath  string
	gitRepo      *Repository
}

// NewService creates a new GitHub service instance
func NewService(
	codexRepo *database.CodexRepository,
	sectionRepo *database.SectionRepository,
	settingsRepo *database.SettingsRepository,
	contentPath string,
) *Service {
	return &Service{
		codexRepo:    codexRepo,
		sectionRepo:  sectionRepo,
		settingsRepo: settingsRepo,
		contentPath:  contentPath,
		gitRepo:      NewRepository(contentPath),
	}
}

// TestConnection validates GitHub credentials and repository access
func (s *Service) TestConnection(ctx context.Context, pat, repoURL string) error {
	return s.gitRepo.TestGitHubConnection(ctx, pat, repoURL)
}

// Initialize sets up GitHub integration by initializing Git and creating the repository
func (s *Service) Initialize(ctx context.Context, pat, repoURL, branch string) error {
	// Create or verify GitHub repository exists
	if err := s.gitRepo.CreateGitHubRepository(ctx, pat, repoURL); err != nil {
		return fmt.Errorf("failed to create GitHub repository: %w", err)
	}

	// Initialize Git repository if not already initialized
	if !s.gitRepo.IsGitRepository() {
		if err := s.gitRepo.InitializeGit(); err != nil {
			return fmt.Errorf("failed to initialize git: %w", err)
		}
	} else {
		if err := s.gitRepo.OpenRepository(); err != nil {
			return fmt.Errorf("failed to open repository: %w", err)
		}
	}

	// Add remote origin
	remoteURL := fmt.Sprintf("https://github.com/%s.git", repoURL)
	if err := s.gitRepo.AddRemote("origin", remoteURL); err != nil {
		// Ignore error if remote already exists
		if err.Error() != "failed to add remote: remote already exists" {
			return fmt.Errorf("failed to add remote: %w", err)
		}
	}

	// Generate structure files
	if err := s.GenerateStructureJSON(); err != nil {
		return fmt.Errorf("failed to generate structure.json: %w", err)
	}

	if err := s.GenerateREADME(); err != nil {
		return fmt.Errorf("failed to generate README.md: %w", err)
	}

	if err := s.GenerateGitignore(); err != nil {
		return fmt.Errorf("failed to generate .gitignore: %w", err)
	}

	// Stage all files
	if err := s.gitRepo.StageAll(); err != nil {
		return fmt.Errorf("failed to stage files: %w", err)
	}

	// Create initial commit with specified branch
	commitMsg := fmt.Sprintf("Initial backup from CodeX - %s", time.Now().Format("2006-01-02 15:04:05"))
	if err := s.gitRepo.CommitWithBranch(commitMsg, branch); err != nil {
		return fmt.Errorf("failed to create initial commit: %w", err)
	}

	// Push to remote
	fmt.Println("Pushing to remote...")
	if err := s.gitRepo.Push(pat, branch); err != nil {
		return fmt.Errorf("failed to push to remote: %w", err)
	}
	fmt.Println("Push successful")

	// Save settings
	settings := map[string]string{
		"githubEnabled":      "true",
		"githubPAT":          pat,
		"githubRepoURL":      repoURL,
		"githubBranch":       branch,
		"githubInitialized":  "true",
		"githubLastSyncTime": time.Now().Format(time.RFC3339),
	}

	fmt.Printf("About to save GitHub settings: %v\n", settings)
	if err := s.settingsRepo.SetBatch(settings); err != nil {
		fmt.Printf("ERROR saving settings: %v\n", err)
		return fmt.Errorf("failed to save GitHub settings: %w", err)
	}
	fmt.Println("GitHub settings saved successfully")

	// Verify settings were saved
	testRead, err := s.settingsRepo.Get("githubInitialized")
	fmt.Printf("Verification read: githubInitialized='%s', err=%v\n", testRead, err)

	return nil
}

// GetStatus returns the current synchronization status
func (s *Service) GetStatus() (*dto.GitHubStatusResponse, error) {
	// Check if GitHub is initialized
	initialized, err := s.settingsRepo.Get("githubInitialized")
	fmt.Printf("GetStatus: githubInitialized='%s', err=%v\n", initialized, err)
	if err != nil || initialized != "true" {
		return &dto.GitHubStatusResponse{
			Initialized: false,
		}, nil
	}

	// Get settings
	repoURL, _ := s.settingsRepo.Get("githubRepoURL")
	branch, _ := s.settingsRepo.Get("githubBranch")
	lastSyncTime, _ := s.settingsRepo.Get("githubLastSyncTime")

	// Open repository
	if err := s.gitRepo.OpenRepository(); err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	// Get changed files
	changedFiles, err := s.gitRepo.GetChangedFiles()
	if err != nil {
		return nil, fmt.Errorf("failed to get changed files: %w", err)
	}

	hasChanges := len(changedFiles) > 0

	return &dto.GitHubStatusResponse{
		Initialized:  true,
		HasChanges:   hasChanges,
		ChangedFiles: changedFiles,
		LastSyncTime: lastSyncTime,
		RemoteURL:    fmt.Sprintf("https://github.com/%s", repoURL),
		Branch:       branch,
	}, nil
}

// Sync synchronizes local content to GitHub
func (s *Service) Sync(ctx context.Context, commitMessage string) error {
	// Get GitHub settings
	pat, err := s.settingsRepo.Get("githubPAT")
	if err != nil {
		return fmt.Errorf("GitHub PAT not configured: %w", err)
	}

	branch, err := s.settingsRepo.Get("githubBranch")
	if err != nil {
		branch = "main"
	}

	// Open repository
	if err := s.gitRepo.OpenRepository(); err != nil {
		return fmt.Errorf("failed to open repository: %w", err)
	}

	// Regenerate structure files
	if err := s.GenerateStructureJSON(); err != nil {
		return fmt.Errorf("failed to generate structure.json: %w", err)
	}

	if err := s.GenerateREADME(); err != nil {
		return fmt.Errorf("failed to generate README.md: %w", err)
	}

	// Check for changes
	hasChanges, err := s.gitRepo.HasChanges()
	if err != nil {
		return fmt.Errorf("failed to check for changes: %w", err)
	}

	if !hasChanges {
		return fmt.Errorf("no changes to sync")
	}

	// Stage all changes
	if err := s.gitRepo.StageAll(); err != nil {
		return fmt.Errorf("failed to stage changes: %w", err)
	}

	// Create commit
	fullCommitMsg := fmt.Sprintf("%s - %s", commitMessage, time.Now().Format("2006-01-02 15:04:05"))
	if err := s.gitRepo.Commit(fullCommitMsg); err != nil {
		return fmt.Errorf("failed to create commit: %w", err)
	}

	// Push to remote
	if err := s.gitRepo.Push(pat, branch); err != nil {
		return fmt.Errorf("failed to push to remote: %w", err)
	}

	// Update last sync time
	if err := s.settingsRepo.Set("githubLastSyncTime", time.Now().Format(time.RFC3339)); err != nil {
		return fmt.Errorf("failed to update last sync time: %w", err)
	}

	return nil
}

// Disconnect removes GitHub integration settings
func (s *Service) Disconnect() error {
	settings := map[string]string{
		"githubEnabled":     "false",
		"githubPAT":         "",
		"githubRepoURL":     "",
		"githubBranch":      "",
		"githubInitialized": "false",
		"githubLastSyncTime": "",
	}

	if err := s.settingsRepo.SetBatch(settings); err != nil {
		return fmt.Errorf("failed to clear GitHub settings: %w", err)
	}

	return nil
}

// GenerateStructureJSON creates structure.json from database
func (s *Service) GenerateStructureJSON() error {
	codexes, err := s.codexRepo.GetAll()
	if err != nil {
		return fmt.Errorf("failed to get codexes: %w", err)
	}

	structure := models.StructureJSON{
		Version:     "1.0",
		GeneratedAt: time.Now(),
		Codexes:     []models.CodexStructure{},
	}

	for _, codex := range codexes {
		sections, err := s.sectionRepo.GetByCodexID(codex.ID)
		if err != nil {
			continue
		}

		// Convert sections to structure format
		sectionStructures := make([]models.SectionStructure, len(sections))
		for i, section := range sections {
			sectionStructures[i] = models.SectionStructure{
				ID:         section.ID,
				Title:      section.Title,
				FilePath:   section.FilePath,
				IsComplete: section.IsComplete,
				OrderIndex: section.OrderIndex,
				CreatedAt:  section.CreatedAt,
				UpdatedAt:  section.UpdatedAt,
			}
		}

		codexStruct := models.CodexStructure{
			ID:          codex.ID,
			Title:       codex.Title,
			Description: codex.Description,
			IsPinned:    codex.IsPinned,
			FolderPath:  fmt.Sprintf("codex_%d", codex.ID),
			CreatedAt:   codex.CreatedAt,
			UpdatedAt:   codex.UpdatedAt,
			Sections:    sectionStructures,
		}

		structure.Codexes = append(structure.Codexes, codexStruct)
	}

	// Sort codexes by ID for consistent output
	sort.Slice(structure.Codexes, func(i, j int) bool {
		return structure.Codexes[i].ID < structure.Codexes[j].ID
	})

	jsonData, err := json.MarshalIndent(structure, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	filePath := filepath.Join(s.contentPath, "structure.json")
	if err := os.WriteFile(filePath, jsonData, 0644); err != nil {
		return fmt.Errorf("failed to write structure.json: %w", err)
	}

	return nil
}

// GenerateREADME creates README.md with codex index
func (s *Service) GenerateREADME() error {
	codexes, err := s.codexRepo.GetAll()
	if err != nil {
		return fmt.Errorf("failed to get codexes: %w", err)
	}

	readme := `# CodeX Backup

This repository contains backups from CodeX, a local-first knowledge manager.

## Codexes

`

	if len(codexes) == 0 {
		readme += "*No codexes yet*\n\n"
	} else {
		for _, codex := range codexes {
			sections, err := s.sectionRepo.GetByCodexID(codex.ID)
			if err != nil {
				continue
			}

			pinnedIcon := ""
			if codex.IsPinned {
				pinnedIcon = " ⭐"
			}

			readme += fmt.Sprintf("### %s%s\n\n", codex.Title, pinnedIcon)

			if codex.Description != "" {
				readme += fmt.Sprintf("%s\n\n", codex.Description)
			}

			readme += fmt.Sprintf("📁 Location: `codex_%d/`\n\n", codex.ID)

			if len(sections) > 0 {
				readme += "**Sections:**\n\n"
				for _, section := range sections {
					checkmark := ""
					if section.IsComplete {
						checkmark = " ✓"
					}
					readme += fmt.Sprintf("- [%s%s](%s)\n", section.Title, checkmark, section.FilePath)
				}
				readme += "\n"
			}
		}
	}

	readme += `---

*Last updated: ` + time.Now().Format("2006-01-02 15:04:05") + `*
*Generated by CodeX*
`

	filePath := filepath.Join(s.contentPath, "README.md")
	if err := os.WriteFile(filePath, []byte(readme), 0644); err != nil {
		return fmt.Errorf("failed to write README.md: %w", err)
	}

	return nil
}

// GenerateGitignore creates .gitignore file
func (s *Service) GenerateGitignore() error {
	gitignore := `# Temporary files
*.tmp
.DS_Store
Thumbs.db

# Database files (local only)
*.db
*.db-*
*.db-shm
*.db-wal

# Editor backup files
*~
*.swp
*.swo
`

	filePath := filepath.Join(s.contentPath, ".gitignore")
	if err := os.WriteFile(filePath, []byte(gitignore), 0644); err != nil {
		return fmt.Errorf("failed to write .gitignore: %w", err)
	}

	return nil
}
