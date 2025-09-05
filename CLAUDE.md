# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Wails Application Commands
- `wails dev` - Run in live development mode with hot reload (includes Vite dev server on localhost:34115)
- `wails build` - Build a redistributable, production mode package
- `wails doctor` - Check development environment setup (if needed)

### Frontend Commands (from frontend/ directory)
- `npm install` - Install frontend dependencies
- `npm run dev` - Run Vite dev server only
- `npm run build` - Build frontend for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build

### Go Commands
- `go mod tidy` - Clean up Go module dependencies
- `go run .` - Run the Go backend directly (though `wails dev` is preferred)

## Architecture Overview

This is a Wails v2 application combining a Go backend with a React TypeScript frontend.

### Backend (Go)
- **Entry Point**: `main.go` - Wails app initialization with window configuration
- **App Structure**: `app.go` - Main application struct with service initialization and API methods
- **Data Models**: `internal/models/models.go` - Codex, Section, Setting, and related structs
- **Database Layer**: `internal/database/` - SQLite repositories for data persistence
  - `connection.go` - Database connection management
  - `codex_repository.go` - Codex CRUD operations and search
  - `section_repository.go` - Section management within codexes
  - `settings_repository.go` - Application settings storage
- **Storage Service**: `internal/storage/` - File system operations for markdown content

### Frontend (React + TypeScript)
- **Framework**: Vite + React 18 with TypeScript
- **Routing**: React Router v7 with nested routes
- **Styling**: Tailwind CSS with typography plugin, custom animations
- **UI Structure**:
  - `App.tsx` - Root component with initialization check and routing
  - `pages/` - Route components (Library, CodexView, SectionEditor, Settings, SetupScreen)
  - `components/` - Reusable UI components with AppLayout as main shell
  - `contexts/` - React contexts (ThemeContext for dark mode)
  - `hooks/` - Custom React hooks
  - `utils/api.ts` - Wails API integration layer

### Data Flow
The application uses a "Codex" concept where each codex contains multiple sections:
1. **Codex**: Top-level container with title, description, pinning, and progress tracking
2. **Section**: Individual content units with markdown files stored in filesystem
3. **Settings**: User preferences including content storage path
4. **Storage**: File-based content management in user's home directory (`~/.codex/`)

### Key Features
- SQLite database for metadata with file system storage for content
- Markdown content editing and rendering
- Progress tracking and section completion
- Content import from external markdown files
- Customizable storage paths via settings
- Dark mode support
- Search functionality across codexes

### Configuration Files
- `wails.json` - Wails project configuration with build commands
- `go.mod` - Go dependencies (Wails v2.10.2, SQLite)
- `frontend/package.json` - Frontend dependencies and scripts
- `frontend/vite.config.ts` - Vite configuration
- `frontend/tailwind.config.js` - Tailwind CSS configuration with typography plugin

### Development Setup
The app requires initialization on first run to set up the database and storage directories. The backend automatically creates `~/.codex/` for data storage, which can be customized via settings.