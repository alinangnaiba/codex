package github

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-git/go-git/v6"
	"github.com/go-git/go-git/v6/config"
	"github.com/go-git/go-git/v6/plumbing"
	"github.com/go-git/go-git/v6/plumbing/object"
	"github.com/go-git/go-git/v6/plumbing/transport/http"
	"github.com/google/go-github/v76/github"
	"golang.org/x/oauth2"
)

// Repository handles low-level Git operations
type Repository struct {
	contentPath string
	repo        *git.Repository
}

// NewRepository creates a new repository instance
func NewRepository(contentPath string) *Repository {
	return &Repository{
		contentPath: contentPath,
	}
}

// InitializeGit initializes a git repository in the content directory
func (r *Repository) InitializeGit() error {
	repo, err := git.PlainInit(r.contentPath, false)
	if err != nil {
		return fmt.Errorf("failed to initialize git repository: %w", err)
	}
	r.repo = repo
	return nil
}

// OpenRepository opens an existing git repository
func (r *Repository) OpenRepository() error {
	repo, err := git.PlainOpen(r.contentPath)
	if err != nil {
		return fmt.Errorf("failed to open git repository: %w", err)
	}
	r.repo = repo
	return nil
}

// IsGitRepository checks if the content path is already a git repository
func (r *Repository) IsGitRepository() bool {
	gitDir := filepath.Join(r.contentPath, ".git")
	info, err := os.Stat(gitDir)
	return err == nil && info.IsDir()
}

// AddRemote adds a remote to the repository
func (r *Repository) AddRemote(name, url string) error {
	if r.repo == nil {
		return fmt.Errorf("repository not initialized")
	}

	_, err := r.repo.CreateRemote(&config.RemoteConfig{
		Name: name,
		URLs: []string{url},
	})
	if err != nil {
		return fmt.Errorf("failed to add remote: %w", err)
	}
	return nil
}

// GetChangedFiles returns a list of files that have been modified, added, or deleted
func (r *Repository) GetChangedFiles() ([]string, error) {
	if r.repo == nil {
		if err := r.OpenRepository(); err != nil {
			return nil, err
		}
	}

	worktree, err := r.repo.Worktree()
	if err != nil {
		return nil, fmt.Errorf("failed to get worktree: %w", err)
	}

	status, err := worktree.Status()
	if err != nil {
		return nil, fmt.Errorf("failed to get status: %w", err)
	}

	var changedFiles []string
	for file, fileStatus := range status {
		if fileStatus.Worktree != git.Unmodified || fileStatus.Staging != git.Unmodified {
			changedFiles = append(changedFiles, file)
		}
	}

	return changedFiles, nil
}

// HasChanges checks if there are uncommitted changes
func (r *Repository) HasChanges() (bool, error) {
	files, err := r.GetChangedFiles()
	if err != nil {
		return false, err
	}
	return len(files) > 0, nil
}

// StageAll stages all changes in the repository
func (r *Repository) StageAll() error {
	if r.repo == nil {
		if err := r.OpenRepository(); err != nil {
			return err
		}
	}

	worktree, err := r.repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %w", err)
	}

	err = worktree.AddWithOptions(&git.AddOptions{
		All: true,
	})
	if err != nil {
		return fmt.Errorf("failed to stage files: %w", err)
	}

	return nil
}

// Commit creates a commit with the given message
func (r *Repository) Commit(message string) error {
	if r.repo == nil {
		if err := r.OpenRepository(); err != nil {
			return err
		}
	}

	worktree, err := r.repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %w", err)
	}

	_, err = worktree.Commit(message, &git.CommitOptions{
		Author: &object.Signature{
			Name:  "CodeX",
			Email: "codex@local",
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create commit: %w", err)
	}

	return nil
}

// CommitWithBranch creates a commit on a specific branch (useful for initial commit)
func (r *Repository) CommitWithBranch(message, branchName string) error {
	if r.repo == nil {
		if err := r.OpenRepository(); err != nil {
			return err
		}
	}

	worktree, err := r.repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %w", err)
	}

	// Create commit
	hash, err := worktree.Commit(message, &git.CommitOptions{
		Author: &object.Signature{
			Name:  "CodeX",
			Email: "codex@local",
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create commit: %w", err)
	}

	// Set the branch reference to point to this commit
	branchRef := plumbing.NewBranchReferenceName(branchName)
	ref := plumbing.NewHashReference(branchRef, hash)

	err = r.repo.Storer.SetReference(ref)
	if err != nil {
		return fmt.Errorf("failed to set branch reference: %w", err)
	}

	// Update HEAD to point to the new branch
	headRef := plumbing.NewSymbolicReference(plumbing.HEAD, branchRef)
	err = r.repo.Storer.SetReference(headRef)
	if err != nil {
		return fmt.Errorf("failed to set HEAD: %w", err)
	}

	return nil
}

// Push pushes commits to the remote repository with force
func (r *Repository) Push(pat, branch string) error {
	if r.repo == nil {
		if err := r.OpenRepository(); err != nil {
			return err
		}
	}

	err := r.repo.Push(&git.PushOptions{
		RemoteName: "origin",
		RefSpecs: []config.RefSpec{
			config.RefSpec(fmt.Sprintf("+refs/heads/%s:refs/heads/%s", branch, branch)),
		},
		Auth: &http.BasicAuth{
			Username: "git", // Can be anything for PAT
			Password: pat,
		},
		Force: true,
	})

	if err != nil && err != git.NoErrAlreadyUpToDate {
		return fmt.Errorf("failed to push: %w", err)
	}

	return nil
}


// CreateGitHubRepository creates a new repository on GitHub
func (r *Repository) CreateGitHubRepository(ctx context.Context, pat, repoURL string) error {
	// Parse owner and repo from URL (format: "owner/repo")
	parts := strings.Split(repoURL, "/")
	if len(parts) != 2 {
		return fmt.Errorf("invalid repository URL format, expected 'owner/repo'")
	}
	owner := parts[0]
	repoName := parts[1]

	// Create GitHub client
	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: pat})
	tc := oauth2.NewClient(ctx, ts)
	client := github.NewClient(tc)

	// Check if repository already exists
	_, resp, err := client.Repositories.Get(ctx, owner, repoName)
	if err == nil {
		// Repository already exists
		return nil
	}
	if resp != nil && resp.StatusCode != 404 {
		return fmt.Errorf("failed to check repository existence: %w", err)
	}

	// Create new repository
	repo := &github.Repository{
		Name:        github.String(repoName),
		Description: github.String("CodeX backup repository"),
		Private:     github.Bool(false),
		AutoInit:    github.Bool(false),
	}

	// Determine if this is a user or organization repo
	user, _, err := client.Users.Get(ctx, "")
	if err != nil {
		return fmt.Errorf("failed to get authenticated user: %w", err)
	}

	if strings.EqualFold(*user.Login, owner) {
		// Create user repository
		_, _, err = client.Repositories.Create(ctx, "", repo)
	} else {
		// Create organization repository
		_, _, err = client.Repositories.Create(ctx, owner, repo)
	}

	if err != nil {
		return fmt.Errorf("failed to create repository: %w", err)
	}

	return nil
}

// TestGitHubConnection tests if the PAT and repository URL are valid
func (r *Repository) TestGitHubConnection(ctx context.Context, pat, repoURL string) error {
	parts := strings.Split(repoURL, "/")
	if len(parts) != 2 {
		return fmt.Errorf("invalid repository URL format, expected 'owner/repo'")
	}

	// Create GitHub client
	ts := oauth2.StaticTokenSource(&oauth2.Token{AccessToken: pat})
	tc := oauth2.NewClient(ctx, ts)
	client := github.NewClient(tc)

	// Test authentication by getting user info
	_, _, err := client.Users.Get(ctx, "")
	if err != nil {
		return fmt.Errorf("authentication failed: %w", err)
	}

	return nil
}
