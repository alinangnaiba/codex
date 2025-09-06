package database

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"codex-wails/internal/models"
)

// CodexRepository handles all Codex-related database operations
type CodexRepository struct {
	db *DB
}

// NewCodexRepository creates a new CodexRepository
func NewCodexRepository(db *DB) *CodexRepository {
	return &CodexRepository{db: db}
}

// Create creates a new Codex
func (r *CodexRepository) Create(title, description string) (*models.Codex, error) {
	query := `
		INSERT INTO codexes (title, description, created_at, updated_at)
		VALUES (?, ?, ?, ?)
	`

	now := time.Now()

	result, err := r.db.conn.Exec(query, title, description, now, now)
	if err != nil {
		return nil, fmt.Errorf("failed to create codex: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert id: %w", err)
	}

	// Fetch the created codex
	codex := &models.Codex{
		ID:          int(id),
		Title:       title,
		Description: description,
		IsPinned:    false,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	return codex, nil
}

// GetAll retrieves all codexes
func (r *CodexRepository) GetAll() ([]models.Codex, error) {
	query := `
		SELECT id, title, description, is_pinned, created_at, updated_at
		FROM codexes
		ORDER BY is_pinned DESC, updated_at DESC
	`

	rows, err := r.db.conn.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get codexes: %w", err)
	}
	defer rows.Close()

	codexes := make([]models.Codex, 0)
	for rows.Next() {
		var codex models.Codex
		err := rows.Scan(
			&codex.ID,
			&codex.Title,
			&codex.Description,
			&codex.IsPinned,
			&codex.CreatedAt,
			&codex.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan codex: %w", err)
		}
		codexes = append(codexes, codex)
	}

	return codexes, nil
}

// GetByID retrieves a codex by ID
func (r *CodexRepository) GetByID(id int) (*models.Codex, error) {
	query := `
		SELECT id, title, description, is_pinned, created_at, updated_at
		FROM codexes
		WHERE id = ?
	`

	var codex models.Codex
	err := r.db.conn.QueryRow(query, id).Scan(
		&codex.ID,
		&codex.Title,
		&codex.Description,
		&codex.IsPinned,
		&codex.CreatedAt,
		&codex.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("codex not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get codex: %w", err)
	}

	return &codex, nil
}

// Update updates a codex
func (r *CodexRepository) Update(id int, title, description string) error {
	query := `
		UPDATE codexes
		SET title = ?, description = ?, updated_at = ?
		WHERE id = ?
	`

	result, err := r.db.conn.Exec(query, title, description, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to update codex: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("codex not found")
	}

	return nil
}

// Delete deletes a codex
func (r *CodexRepository) Delete(id int) error {
	query := `DELETE FROM codexes WHERE id = ?`

	result, err := r.db.conn.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete codex: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("codex not found")
	}

	return nil
}

// SetPinned sets the pinned status of a codex
func (r *CodexRepository) SetPinned(id int, isPinned bool) error {
	query := `
		UPDATE codexes
		SET is_pinned = ?, updated_at = ?
		WHERE id = ?
	`

	result, err := r.db.conn.Exec(query, isPinned, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to update pin status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("codex not found")
	}

	return nil
}

// Search searches for codexes by title or description
func (r *CodexRepository) Search(query string) ([]models.Codex, error) {
	searchTerm := "%" + strings.ToLower(query) + "%"
	sqlQuery := `
		SELECT id, title, description, is_pinned, created_at, updated_at
		FROM codexes
		WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ?
		ORDER BY is_pinned DESC, updated_at DESC
	`

	rows, err := r.db.conn.Query(sqlQuery, searchTerm, searchTerm)
	if err != nil {
		return nil, fmt.Errorf("failed to search codexes: %w", err)
	}
	defer rows.Close()

	codexes := make([]models.Codex, 0)
	for rows.Next() {
		var codex models.Codex
		err := rows.Scan(
			&codex.ID,
			&codex.Title,
			&codex.Description,
			&codex.IsPinned,
			&codex.CreatedAt,
			&codex.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan codex: %w", err)
		}
		codexes = append(codexes, codex)
	}

	return codexes, nil
}

// GetWithSections retrieves a codex with all its sections
func (r *CodexRepository) GetWithSections(id int) (*models.CodexWithSections, error) {
	codex, err := r.GetByID(id)
	if err != nil {
		return nil, err
	}

	sectionsQuery := `
		SELECT id, codex_id, title, file_path, is_complete, order_index, created_at, updated_at
		FROM sections
		WHERE codex_id = ?
		ORDER BY order_index ASC
	`

	rows, err := r.db.conn.Query(sectionsQuery, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get sections: %w", err)
	}
	defer rows.Close()

	var sections []models.Section
	for rows.Next() {
		var section models.Section
		err := rows.Scan(
			&section.ID,
			&section.CodexID,
			&section.Title,
			&section.FilePath,
			&section.IsComplete,
			&section.OrderIndex,
			&section.CreatedAt,
			&section.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan section: %w", err)
		}
		sections = append(sections, section)
	}

	return &models.CodexWithSections{
		Codex:    *codex,
		Sections: sections,
	}, nil
}

// GetProgress calculates the reading progress of a codex
func (r *CodexRepository) GetProgress(id int) (*models.CodexProgress, error) {
	query := `
		SELECT 
			COUNT(*) as total,
			SUM(CASE WHEN is_complete = 1 THEN 1 ELSE 0 END) as completed
		FROM sections
		WHERE codex_id = ?
	`

	var total, completed int
	err := r.db.conn.QueryRow(query, id).Scan(&total, &completed)
	if err != nil {
		return nil, fmt.Errorf("failed to get progress: %w", err)
	}

	progress := &models.CodexProgress{
		CodexID:           id,
		TotalSections:     total,
		CompletedSections: completed,
		ProgressPercent:   0,
	}

	if total > 0 {
		progress.ProgressPercent = float32(completed) / float32(total) * 100
	}

	return progress, nil
}
