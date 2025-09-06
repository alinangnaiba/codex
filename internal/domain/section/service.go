package section

import (
	"codex-wails/internal/dto"
	"codex-wails/internal/mappers"
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

func (s *Service) Create(codexID int, title string) (*dto.SectionResponse, error) {
	section, err := s.repo.Create(codexID, title)
	if err != nil {
		return nil, err
	}

	return mappers.ToSectionResponse(section), nil
}

func (s *Service) Update(id int, title, content string) error {
	//TODO: We need a smarter way to handle the updates. We're hitting the database thrice
	// every time we update a section is updated even though we only update a the content
	// or the title.
	if err := s.repo.Update(id, title); err != nil {
		return err
	}

	section, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	filePath, err := s.storageService.SaveContent(section.CodexID, id, content)
	if err != nil {
		return fmt.Errorf("failed to save content: %w", err)
	}

	return s.repo.UpdateContent(id, filePath)
}

func (s *Service) GetContent(sectionID int) (string, error) {
	section, err := s.repo.GetByID(sectionID)
	if err != nil {
		return "", err
	}

	return s.storageService.ReadContent(section.FilePath)
}

func (s *Service) Delete(id int) error {
	section, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	if err := s.storageService.DeleteContent(section.FilePath); err != nil {
		return fmt.Errorf("failed to delete content: %w", err)
	}

	return s.repo.Delete(id)
}

func (s *Service) SetComplete(id int, isComplete bool) error {
	return s.repo.SetComplete(id, isComplete)
}

func (s *Service) GetByCodexID(codexID int) ([]dto.SectionResponse, error) {
	sections, err := s.repo.GetByCodexID(codexID)
	if err != nil {
		return []dto.SectionResponse{}, err
	}

	return mappers.ToSectionResponseList(sections), nil
}
