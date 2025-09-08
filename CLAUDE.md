# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CodeX is a Wails-based desktop application for managing and organizing markdown-based documentation and notes. It features a Go backend with SQLite storage and a React TypeScript frontend.

## Development Commands

### Build and Run
- `wails dev` - Start development mode with hot reload
- `wails build` - Build production executable
- `go run .` - Run Go backend only (for debugging)

### Frontend Development
Navigate to `frontend/` directory:
- `npm install` - Install dependencies  
- `npm run dev` - Start Vite dev server
- `npm run build` - Build frontend for production
- `tsc` - Type check TypeScript

### Backend Development
- `go mod tidy` - Clean up Go modules
- `go test ./...` - Run all tests
- `go build` - Build Go binary

## Architecture

### Backend Structure (Go)
- **Domain-Driven Design** with clean architecture layers
- **`internal/domain/`** - Business logic organized by entity (codex, section, settings, file)
  - Each domain has: `handler.go` (API), `service.go` (business logic), `repository.go` (data access interface)
- **`internal/database/`** - Database layer with SQLite repositories
- **`internal/models/`** - Core data models (Codex, Section, Setting)
- **`internal/dto/`** - Data transfer objects for API responses
- **`internal/adapters/`** - Interface adapters between layers
- **`internal/storage/`** - File system operations for markdown content

### Frontend Structure (React + TypeScript)
- **`src/pages/`** - Main application pages (Library, CodexView, SectionEditor, Settings, SetupScreen)
- **`src/components/`** - Reusable UI components
- **`src/contexts/`** - React contexts (Theme, Breadcrumb)
- **`src/utils/`** - API utilities and markdown processing

### Key Concepts
- **Codex**: A collection of markdown sections (like a book or documentation set)  
- **Section**: Individual markdown documents within a codex
- **Storage Service**: Manages markdown files on filesystem, referenced by database records
- **Wails Binding**: Go methods exposed to frontend via `app.go`

## Data Storage
- **Database**: SQLite in user's home directory (`~/.codex/`)
- **Content Files**: Markdown files stored in configurable content directory
- **Settings**: Key-value configuration stored in database

## Frontend-Backend Communication
All frontend API calls go through Wails bindings defined in `app.go`. Methods follow pattern:
- Codex operations: `GetAllCodexes()`, `CreateCodex()`, `UpdateCodex()`, etc.
- Section operations: `CreateSection()`, `UpdateSection()`, `GetSectionContent()`, etc.  
- Settings: `GetSettings()`, `SaveSettings()`, `SetSetting()`, etc.
- File operations: `ImportMarkdownFile()`, `SelectDirectory()`, etc.

## Configuration
- **`wails.json`** - Wails project configuration
- **`go.mod`** - Go dependencies  
- **`frontend/package.json`** - Frontend dependencies
- App settings stored in database and managed through Settings page

## Development Notes
- Uses Tailwind CSS for styling with dark mode support
- Markdown rendering with syntax highlighting (highlight.js)
- React Router for navigation with breadcrumb context
- TypeScript strict mode enabled
- Hot reload available in development mode