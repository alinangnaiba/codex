package database

import (
	"database/sql"
	"fmt"

	"codex-wails/internal/models"
)

// SettingsRepository handles all Settings-related database operations
type SettingsRepository struct {
	db *DB
}

// NewSettingsRepository creates a new SettingsRepository
func NewSettingsRepository(db *DB) *SettingsRepository {
	return &SettingsRepository{db: db}
}

// Get retrieves a setting by key
func (r *SettingsRepository) Get(key string) (string, error) {
	query := `SELECT value FROM settings WHERE key = ?`
	
	var value string
	err := r.db.conn.QueryRow(query, key).Scan(&value)
	if err == sql.ErrNoRows {
		return "", fmt.Errorf("setting not found")
	}
	if err != nil {
		return "", fmt.Errorf("failed to get setting: %w", err)
	}
	
	return value, nil
}

// Set creates or updates a setting
func (r *SettingsRepository) Set(key, value string) error {
	// First, try to update
	updateQuery := `UPDATE settings SET value = ? WHERE key = ?`
	result, err := r.db.conn.Exec(updateQuery, value, key)
	if err != nil {
		return fmt.Errorf("failed to update setting: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	// If no rows were updated, insert a new one
	if rowsAffected == 0 {
		insertQuery := `INSERT INTO settings (key, value) VALUES (?, ?)`
		_, err = r.db.conn.Exec(insertQuery, key, value)
		if err != nil {
			return fmt.Errorf("failed to insert setting: %w", err)
		}
	}
	
	return nil
}

// GetAll retrieves all settings
func (r *SettingsRepository) GetAll() ([]models.Setting, error) {
	query := `SELECT key, value FROM settings ORDER BY key`
	
	rows, err := r.db.conn.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get settings: %w", err)
	}
	defer rows.Close()
	
	var settings []models.Setting
	for rows.Next() {
		var setting models.Setting
		err := rows.Scan(&setting.Key, &setting.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to scan setting: %w", err)
		}
		settings = append(settings, setting)
	}
	
	return settings, nil
}

// GetAllAsMap retrieves all settings as a map
func (r *SettingsRepository) GetAllAsMap() (map[string]string, error) {
	settings, err := r.GetAll()
	if err != nil {
		return nil, err
	}
	
	settingsMap := make(map[string]string)
	for _, setting := range settings {
		settingsMap[setting.Key] = setting.Value
	}
	
	return settingsMap, nil
}

// SetBatch sets multiple settings at once
func (r *SettingsRepository) SetBatch(settings map[string]string) error {
	tx, err := r.db.conn.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()
	
	for key, value := range settings {
		// First, try to update
		updateQuery := `UPDATE settings SET value = ? WHERE key = ?`
		result, err := tx.Exec(updateQuery, value, key)
		if err != nil {
			return fmt.Errorf("failed to update setting %s: %w", key, err)
		}
		
		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return fmt.Errorf("failed to get rows affected for %s: %w", key, err)
		}
		
		// If no rows were updated, insert a new one
		if rowsAffected == 0 {
			insertQuery := `INSERT INTO settings (key, value) VALUES (?, ?)`
			_, err = tx.Exec(insertQuery, key, value)
			if err != nil {
				return fmt.Errorf("failed to insert setting %s: %w", key, err)
			}
		}
	}
	
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	
	return nil
}

// Delete removes a setting
func (r *SettingsRepository) Delete(key string) error {
	query := `DELETE FROM settings WHERE key = ?`
	
	result, err := r.db.conn.Exec(query, key)
	if err != nil {
		return fmt.Errorf("failed to delete setting: %w", err)
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	
	if rowsAffected == 0 {
		return fmt.Errorf("setting not found")
	}
	
	return nil
}

// SetDefaults sets default settings if they don't exist
func (r *SettingsRepository) SetDefaults() error {
	defaults := map[string]string{
		"theme":        "light",
		"contentPath":  "",
		"autoSave":     "false",
		"initialized":  "false",
	}
	
	for key, defaultValue := range defaults {
		// Check if setting exists
		_, err := r.Get(key)
		if err != nil {
			// Setting doesn't exist, set default
			if err := r.Set(key, defaultValue); err != nil {
				return fmt.Errorf("failed to set default for %s: %w", key, err)
			}
		}
	}
	
	return nil
}
