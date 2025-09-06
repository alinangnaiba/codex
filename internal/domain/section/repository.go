package section

import (
	"codex-wails/internal/database"
	"codex-wails/internal/models"
)

type Repository interface {
	GetByID(id int) (*models.Section, error)
	GetByCodexID(codexID int) ([]models.Section, error)
	Create(codexID int, title string) (*models.Section, error)
	Update(id int, title string) error
	UpdateContent(id int, filePath string) error
	Delete(id int) error
	SetComplete(id int, isComplete bool) error
}

type StorageService interface {
	SaveContent(codexID, sectionID int, content string) (string, error)
	ReadContent(filePath string) (string, error)
	DeleteContent(filePath string) error
}

type repositoryImpl struct {
	repo *database.SectionRepository
}

func NewRepository(dbRepo *database.SectionRepository) Repository {
	return &repositoryImpl{
		repo: dbRepo,
	}
}

func (r *repositoryImpl) GetByID(id int) (*models.Section, error) {
	return r.repo.GetByID(id)
}

func (r *repositoryImpl) GetByCodexID(codexID int) ([]models.Section, error) {
	return r.repo.GetByCodexID(codexID)
}

func (r *repositoryImpl) Create(codexID int, title string) (*models.Section, error) {
	return r.repo.Create(codexID, title)
}

func (r *repositoryImpl) Update(id int, title string) error {
	return r.repo.Update(id, title)
}

func (r *repositoryImpl) UpdateContent(id int, filePath string) error {
	return r.repo.UpdateContent(id, filePath)
}

func (r *repositoryImpl) Delete(id int) error {
	return r.repo.Delete(id)
}

func (r *repositoryImpl) SetComplete(id int, isComplete bool) error {
	return r.repo.SetComplete(id, isComplete)
}
