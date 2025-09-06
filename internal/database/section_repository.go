package database

import (
	"database/sql"
	"fmt"
	"time"

	"codex-wails/internal/models"
)

// SectionRepository handles all Section-related database operations
type SectionRepository struct {
	db *DB
}

// NewSectionRepository creates a new SectionRepository
func NewSectionRepository(db *DB) *SectionRepository {
	return &SectionRepository{db: db}
}

// Create creates a new Section
func (r *SectionRepository) Create(codexID int, title string) (*models.Section, error) {
	// Get the max order index for this codex
	var maxOrder sql.NullInt32
	err := r.db.conn.QueryRow(
		"SELECT MAX(order_index) FROM sections WHERE codex_id = ?",
		codexID,
	).Scan(&maxOrder)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to get max order: %w", err)
	}

	orderIndex := 0
	if maxOrder.Valid {
		orderIndex = int(maxOrder.Int32) + 1
	}

	query := `
		INSERT INTO sections (codex_id, title, file_path, order_index, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	filePath := "" // Will be set when content is saved

	result, err := r.db.conn.Exec(
		query, codexID, title, filePath, orderIndex, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create section: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert id: %w", err)
	}

	section := &models.Section{
		ID:         int(id),
		CodexID:    codexID,
		Title:      title,
		FilePath:   filePath,
		IsComplete: false,
		OrderIndex: orderIndex,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	return section, nil
}

// GetByID retrieves a section by ID
func (r *SectionRepository) GetByID(id int) (*models.Section, error) {
	query := `
		SELECT id, codex_id, title, file_path, is_complete, order_index, created_at, updated_at
		FROM sections
		WHERE id = ?
	`

	var section models.Section
	var createdAt, updatedAt time.Time
	err := r.db.conn.QueryRow(query, id).Scan(
		&section.ID,
		&section.CodexID,
		&section.Title,
		&section.FilePath,
		&section.IsComplete,
		&section.OrderIndex,
		&createdAt,
		&updatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("section not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get section: %w", err)
	}

	section.CreatedAt = createdAt
	section.UpdatedAt = updatedAt

	return &section, nil
}

// GetByCodexID retrieves all sections for a codex
func (r *SectionRepository) GetByCodexID(codexID int) ([]models.Section, error) {
	query := `
		SELECT id, codex_id, title, file_path, is_complete, order_index, created_at, updated_at
		FROM sections
		WHERE codex_id = ?
		ORDER BY order_index ASC
	`

	rows, err := r.db.conn.Query(query, codexID)
	if err != nil {
		return nil, fmt.Errorf("failed to get sections: %w", err)
	}
	defer rows.Close()

	var sections []models.Section
	for rows.Next() {
		var section models.Section
		var createdAt, updatedAt time.Time
		err := rows.Scan(
			&section.ID,
			&section.CodexID,
			&section.Title,
			&section.FilePath,
			&section.IsComplete,
			&section.OrderIndex,
			&createdAt,
			&updatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan section: %w", err)
		}
		section.CreatedAt = createdAt
		section.UpdatedAt = updatedAt
		sections = append(sections, section)
	}

	return sections, nil
}

func (r *SectionRepository) Update(id int, title string) error {
	query := `
		UPDATE sections
		SET title = ?, updated_at = ?
		WHERE id = ?
	`

	result, err := r.db.conn.Exec(query, title, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to update section: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("section not found")
	}

	return nil
}

func (r *SectionRepository) UpdateContent(id int, filePath string) error {
	query := `
		UPDATE sections
		SET file_path = ?, updated_at = ?
		WHERE id = ?
	`

	result, err := r.db.conn.Exec(query, filePath, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to update section content: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("section not found")
	}

	return nil
}

func (r *SectionRepository) SetComplete(id int, isComplete bool) error {
	query := `
		UPDATE sections
		SET is_complete = ?, updated_at = ?
		WHERE id = ?
	`

	result, err := r.db.conn.Exec(query, isComplete, time.Now(), id)
	if err != nil {
		return fmt.Errorf("failed to update completion status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("section not found")
	}

	return nil
}

// Delete deletes a section
func (r *SectionRepository) Delete(id int) error {
	// Get the section to find its order_index and codex_id
	var codexID, orderIndex int
	err := r.db.conn.QueryRow(
		"SELECT codex_id, order_index FROM sections WHERE id = ?",
		id,
	).Scan(&codexID, &orderIndex)
	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("section not found")
		}
		return fmt.Errorf("failed to get section info: %w", err)
	}

	// Delete the section
	result, err := r.db.conn.Exec("DELETE FROM sections WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("failed to delete section: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("section not found")
	}

	// Reorder remaining sections
	_, err = r.db.conn.Exec(
		`UPDATE sections 
		 SET order_index = order_index - 1 
		 WHERE codex_id = ? AND order_index > ?`,
		codexID, orderIndex,
	)
	if err != nil {
		return fmt.Errorf("failed to reorder sections: %w", err)
	}

	return nil
}

// ReorderSections updates the order of sections
func (r *SectionRepository) ReorderSections(sectionIDs []int) error {
	tx, err := r.db.conn.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	for i, id := range sectionIDs {
		_, err := tx.Exec(
			"UPDATE sections SET order_index = ?, updated_at = ? WHERE id = ?",
			i, time.Now(), id,
		)
		if err != nil {
			return fmt.Errorf("failed to update order for section %d: %w", id, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}
