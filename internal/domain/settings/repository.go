package settings

import (
	"codex-wails/internal/database"
)

type Repository interface {
	GetAllAsMap() (map[string]string, error)
	Get(key string) (string, error)
	Set(key, value string) error
	SetBatch(settings map[string]string) error
	SetDefaults() error
}

type StorageService interface {
	ValidateStoragePath(path string) error
}

type repositoryImpl struct {
	repo *database.SettingsRepository
}

func NewRepository(dbRepo *database.SettingsRepository) Repository {
	return &repositoryImpl{
		repo: dbRepo,
	}
}

func (r *repositoryImpl) GetAllAsMap() (map[string]string, error) {
	return r.repo.GetAllAsMap()
}

func (r *repositoryImpl) Get(key string) (string, error) {
	return r.repo.Get(key)
}

func (r *repositoryImpl) Set(key, value string) error {
	return r.repo.Set(key, value)
}

func (r *repositoryImpl) SetBatch(settings map[string]string) error {
	return r.repo.SetBatch(settings)
}

func (r *repositoryImpl) SetDefaults() error {
	return r.repo.SetDefaults()
}
