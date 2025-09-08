package config

import (
	"os"
	"path/filepath"
)

type Config struct {
	AppName       string
	Version       string
	IsDevelopment bool
	DataPath      string
	LogLevel      string
}

func Load() *Config {
	isDev := os.Getenv("WAILS_ENVIRONMENT") == "development"

	return &Config{
		AppName:       "Codex",
		Version:       "1.0.0",
		IsDevelopment: isDev,
		DataPath:      getDataPath(),
		LogLevel:      getLogLevel(isDev),
	}
}

func getDataPath() string {
	if os.Getenv("WAILS_ENVIRONMENT") == "development" {
		return "./.codex-dev"
	}

	homeDir, _ := os.UserHomeDir()
	return filepath.Join(homeDir, ".codex")
}

func getLogLevel(isDev bool) string {
	if isDev {
		return "debug"
	}
	return "info"
}
