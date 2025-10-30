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
	gitOps       *Operations
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
		gitOps:       NewOperations(contentPath),
	}
}

// TestConnection validates GitHub credentials and repository access
func (s *Service) TestConnection(ctx context.Context, pat, repoURL string) error {
	return s.gitOps.TestGitHubConnection(ctx, pat, repoURL)
}

// Initialize sets up GitHub integration by initializing Git and creating the repository
func (s *Service) Initialize(ctx context.Context, pat, repoURL, branch string) error {
	if err := s.gitOps.CreateGitHubRepository(ctx, pat, repoURL); err != nil {
		return fmt.Errorf("failed to create GitHub repository: %w", err)
	}

	if !s.gitOps.IsGitRepository() {
		if err := s.gitOps.InitializeGit(); err != nil {
			return fmt.Errorf("failed to initialize git: %w", err)
		}
	} else {
		if err := s.gitOps.OpenRepository(); err != nil {
			return fmt.Errorf("failed to open repository: %w", err)
		}
	}

	remoteURL := fmt.Sprintf("https://github.com/%s.git", repoURL)
	if err := s.gitOps.AddRemote("origin", remoteURL); err != nil {
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

	if err := s.gitOps.StageAll(); err != nil {
		return fmt.Errorf("failed to stage files: %w", err)
	}

	commitMsg := fmt.Sprintf("Initial backup from CodeX - %s", time.Now().Format("2006-01-02 15:04:05"))
	if err := s.gitOps.CommitWithBranch(commitMsg, branch); err != nil {
		return fmt.Errorf("failed to create initial commit: %w", err)
	}

	if err := s.gitOps.Push(pat, branch); err != nil {
		return fmt.Errorf("failed to push to remote: %w", err)
	}

	settings := map[string]string{
		"githubEnabled":      "true",
		"githubPAT":          pat,
		"githubRepoURL":      repoURL,
		"githubBranch":       branch,
		"githubInitialized":  "true",
		"githubLastSyncTime": time.Now().Format(time.RFC3339),
	}

	if err := s.settingsRepo.SetBatch(settings); err != nil {
		return fmt.Errorf("failed to save GitHub settings: %w", err)
	}

	return nil
}

// GetStatus returns the current synchronization status
func (s *Service) GetStatus() (*dto.GitHubStatusResponse, error) {
	initialized, err := s.settingsRepo.Get("githubInitialized")
	if err != nil || initialized != "true" {
		return &dto.GitHubStatusResponse{
			Initialized: false,
		}, nil
	}

	repoURL, _ := s.settingsRepo.Get("githubRepoURL")
	branch, _ := s.settingsRepo.Get("githubBranch")
	lastSyncTime, _ := s.settingsRepo.Get("githubLastSyncTime")

	if err := s.gitOps.OpenRepository(); err != nil {
		return nil, fmt.Errorf("failed to open repository: %w", err)
	}

	changedFiles, err := s.gitOps.GetChangedFiles()
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
	pat, err := s.settingsRepo.Get("githubPAT")
	if err != nil {
		return fmt.Errorf("GitHub PAT not configured: %w", err)
	}

	branch, err := s.settingsRepo.Get("githubBranch")
	if err != nil {
		branch = "main"
	}

	if err := s.gitOps.OpenRepository(); err != nil {
		return fmt.Errorf("failed to open repository: %w", err)
	}

	if err := s.GenerateStructureJSON(); err != nil {
		return fmt.Errorf("failed to generate structure.json: %w", err)
	}

	if err := s.GenerateREADME(); err != nil {
		return fmt.Errorf("failed to generate README.md: %w", err)
	}

	hasChanges, err := s.gitOps.HasChanges()
	if err != nil {
		return fmt.Errorf("failed to check for changes: %w", err)
	}

	if !hasChanges {
		return fmt.Errorf("no changes to sync")
	}

	if err := s.gitOps.StageAll(); err != nil {
		return fmt.Errorf("failed to stage changes: %w", err)
	}

	fullCommitMsg := fmt.Sprintf("%s - %s", commitMessage, time.Now().Format("2006-01-02 15:04:05"))
	if err := s.gitOps.Commit(fullCommitMsg); err != nil {
		return fmt.Errorf("failed to create commit: %w", err)
	}

	if err := s.gitOps.Push(pat, branch); err != nil {
		return fmt.Errorf("failed to push to remote: %w", err)
	}

	if err := s.settingsRepo.Set("githubLastSyncTime", time.Now().Format(time.RFC3339)); err != nil {
		return fmt.Errorf("failed to update last sync time: %w", err)
	}

	return nil
}

// Disconnect removes GitHub integration settings
func (s *Service) Disconnect() error {
	settings := map[string]string{
		"githubEnabled":      "false",
		"githubPAT":          "",
		"githubRepoURL":      "",
		"githubBranch":       "",
		"githubInitialized":  "false",
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
