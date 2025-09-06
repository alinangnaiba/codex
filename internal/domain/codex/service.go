package codex

import (
	"codex-wails/internal/dto"
	"codex-wails/internal/mappers"
	"codex-wails/internal/models"
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

func (s *Service) GetAll() ([]dto.CodexResponse, error) {
	codexes, err := s.repo.GetAll()
	if err != nil {
		return []dto.CodexResponse{}, err
	}

	if codexes == nil {
		return []dto.CodexResponse{}, nil
	}

	return mappers.ToCodexResponseList(codexes), nil
}

func (s *Service) Search(query string) ([]dto.CodexResponse, error) {
	var codexes []models.Codex
	var err error

	if query == "" {
		codexes, err = s.repo.GetAll()
	} else {
		codexes, err = s.repo.Search(query)
	}

	if err != nil {
		return []dto.CodexResponse{}, err
	}

	if codexes == nil {
		return []dto.CodexResponse{}, nil
	}

	return mappers.ToCodexResponseList(codexes), nil
}

func (s *Service) Create(title, description string) (*dto.CodexResponse, error) {
	codex, err := s.repo.Create(title, description)
	if err != nil {
		return nil, err
	}

	return mappers.ToCodexResponse(codex), nil
}

func (s *Service) Update(id int, title, description string) error {
	return s.repo.Update(id, title, description)
}

func (s *Service) Delete(id int) error {
	if err := s.storageService.DeleteCodexContent(id); err != nil {
		return err
	}

	return s.repo.Delete(id)
}

func (s *Service) SetPinned(id int, isPinned bool) error {
	return s.repo.SetPinned(id, isPinned)
}

func (s *Service) GetWithSections(id int) (*dto.CodexWithSectionsResponse, error) {
	codex, err := s.repo.GetWithSections(id)
	if err != nil {
		return nil, err
	}

	return mappers.ToCodexWithSectionsResponse(codex), nil
}

func (s *Service) GetProgress(id int) (*dto.CodexProgressResponse, error) {
	progress, err := s.repo.GetProgress(id)
	if err != nil {
		return nil, err
	}

	return mappers.ToCodexProgressResponse(progress), nil
}
