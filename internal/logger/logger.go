package logger

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type LogLevel int

const (
	DEBUG LogLevel = iota
	INFO
	WARN
	ERROR
)

type Logger struct {
	dataPath        string
	isDev           bool
	level           LogLevel
	logPath         string
	lastCleanupDate string
	retentionDays   int
}

func New(dataPath string, isDev bool) *Logger {
	logPath := filepath.Join(dataPath, "logs")
	os.MkdirAll(logPath, 0755)

	level := WARN // Production default
	if isDev {
		level = DEBUG // Development shows all logs
	}

	return &Logger{
		dataPath:        dataPath,
		isDev:           isDev,
		level:           level,
		logPath:         logPath,
		lastCleanupDate: "",
		retentionDays:   7, // Default 7 days retention
	}
}

// SetLogLevel allows changing log level dynamically
func (l *Logger) SetLogLevel(level LogLevel) {
	l.level = level
}

// SetRetentionDays allows changing retention period dynamically
func (l *Logger) SetRetentionDays(days int) {
	if days > 0 && days <= 30 {
		l.retentionDays = days
	}
}

func (l *Logger) shouldLog(level LogLevel) bool {
	return level >= l.level
}

func (l *Logger) writeLog(level LogLevel, levelName string, v ...interface{}) {
	if !l.shouldLog(level) {
		return
	}

	message := fmt.Sprint(v...)
	timestamp := time.Now()
	
	if l.isDev {
		// Development: log to stdout with colors and file info
		log.Printf("[CODEX] %s: %s", levelName, message)
		return
	}

	// Production: log to daily file
	l.writeToFile(timestamp, levelName, message)
}

func (l *Logger) writeToFile(timestamp time.Time, level, message string) {
	// Check if we need to cleanup old logs (new day detected)
	today := timestamp.Format("2006-01-02")
	if l.lastCleanupDate != today {
		l.cleanupOldLogs(timestamp)
		l.lastCleanupDate = today
	}

	// Generate today's log file name
	fileName := fmt.Sprintf("app-%s.log", today)
	filePath := filepath.Join(l.logPath, fileName)

	// Open, write, close pattern for safety
	file, err := os.OpenFile(filePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		// Fallback to stdout if file operations fail
		log.Printf("[CODEX] %s: %s (file error: %v)", level, message, err)
		return
	}
	defer file.Close()

	// Write log entry with timestamp
	logLine := fmt.Sprintf("[%s] %s: %s\n", timestamp.Format("2006-01-02 15:04:05"), level, message)
	file.WriteString(logLine)
}

func (l *Logger) cleanupOldLogs(currentTime time.Time) {
	cutoffDate := currentTime.AddDate(0, 0, -l.retentionDays)
	
	// Read log directory
	entries, err := os.ReadDir(l.logPath)
	if err != nil {
		return // Silent fail - don't log during log cleanup
	}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasPrefix(entry.Name(), "app-") || !strings.HasSuffix(entry.Name(), ".log") {
			continue
		}

		// Extract date from filename: app-2024-01-15.log
		datePart := strings.TrimPrefix(entry.Name(), "app-")
		datePart = strings.TrimSuffix(datePart, ".log")
		
		if fileDate, err := time.Parse("2006-01-02", datePart); err == nil {
			if fileDate.Before(cutoffDate) {
				filePath := filepath.Join(l.logPath, entry.Name())
				os.Remove(filePath) // Silent removal - don't log during cleanup
			}
		}
	}
}

// GetLogFiles returns list of available log files for debugging/export
func (l *Logger) GetLogFiles() []string {
	entries, err := os.ReadDir(l.logPath)
	if err != nil {
		return nil
	}

	var logFiles []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasPrefix(entry.Name(), "app-") && strings.HasSuffix(entry.Name(), ".log") {
			logFiles = append(logFiles, entry.Name())
		}
	}
	return logFiles
}

// ReadLogFile returns contents of a specific log file
func (l *Logger) ReadLogFile(fileName string) (string, error) {
	if !strings.HasPrefix(fileName, "app-") || !strings.HasSuffix(fileName, ".log") {
		return "", fmt.Errorf("invalid log file name")
	}

	filePath := filepath.Join(l.logPath, fileName)
	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

func (l *Logger) Error(v ...interface{}) {
	l.writeLog(ERROR, "ERROR", v...)
}

func (l *Logger) Warn(v ...interface{}) {
	l.writeLog(WARN, "WARN", v...)
}

func (l *Logger) Info(v ...interface{}) {
	l.writeLog(INFO, "INFO", v...)
}

func (l *Logger) Debug(v ...interface{}) {
	l.writeLog(DEBUG, "DEBUG", v...)
}
