package codex

import (
	"codex-wails/internal/database"
	"codex-wails/internal/models"
)

type Repository interface {
	GetAll() ([]models.Codex, error)
	GetByID(id int) (*models.Codex, error)
	GetWithSections(id int) (*models.CodexWithSections, error)
	Search(query string) ([]models.Codex, error)
	Create(title, description string) (*models.Codex, error)
	Update(id int, title, description string) error
	Delete(id int) error
	SetPinned(id int, isPinned bool) error
	GetProgress(id int) (*models.CodexProgress, error)
}

type StorageService interface {
	DeleteCodexContent(codexID int) error
}

type repositoryImpl struct {
	repo *database.CodexRepository
}

func NewRepository(dbRepo *database.CodexRepository) Repository {
	return &repositoryImpl{
		repo: dbRepo,
	}
}

func (r *repositoryImpl) GetAll() ([]models.Codex, error) {
	return r.repo.GetAll()
}

func (r *repositoryImpl) GetByID(id int) (*models.Codex, error) {
	return r.repo.GetByID(id)
}

func (r *repositoryImpl) GetWithSections(id int) (*models.CodexWithSections, error) {
	return r.repo.GetWithSections(id)
}

func (r *repositoryImpl) Search(query string) ([]models.Codex, error) {
	return r.repo.Search(query)
}

func (r *repositoryImpl) Create(title, description string) (*models.Codex, error) {
	return r.repo.Create(title, description)
}

func (r *repositoryImpl) Update(id int, title, description string) error {
	return r.repo.Update(id, title, description)
}

func (r *repositoryImpl) Delete(id int) error {
	return r.repo.Delete(id)
}

func (r *repositoryImpl) SetPinned(id int, isPinned bool) error {
	return r.repo.SetPinned(id, isPinned)
}

func (r *repositoryImpl) GetProgress(id int) (*models.CodexProgress, error) {
	return r.repo.GetProgress(id)
}
