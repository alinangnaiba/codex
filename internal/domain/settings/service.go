package settings

import (
	"fmt"
)

type Service struct {
	repo           Repository
	storageService StorageService
}

func NewService(repo Repository, storageService StorageService) *Service {
	return &Service{
		repo:           repo,
		storageService: storageService,
	}
}

func (s *Service) GetAll() (map[string]string, error) {
	return s.repo.GetAllAsMap()
}

func (s *Service) Get(key string) (string, error) {
	return s.repo.Get(key)
}

func (s *Service) Set(key, value string) error {
	return s.repo.Set(key, value)
}

func (s *Service) SaveBatch(settings map[string]string, updateStorageCallback func(string) error) error {
	// If content path has changed, validate and update storage service
	if newPath, ok := settings["contentPath"]; ok {
		if err := s.storageService.ValidateStoragePath(newPath); err != nil {
			return fmt.Errorf("invalid storage path: %w", err)
		}

		if err := updateStorageCallback(newPath); err != nil {
			return fmt.Errorf("failed to update storage service: %w", err)
		}
	}

	return s.repo.SetBatch(settings)
}

func (s *Service) CheckInitialized() (bool, error) {
	initialized, err := s.repo.Get("initialized")
	if err != nil {
		return false, nil
	}

	return initialized == "true", nil
}
