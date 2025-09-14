
# CodeX

> A lightweight, local-first knowledge manager for desktop

CodeX is a modern desktop application that helps you organize and manage your knowledge through structured collections called "codexes". Built with Go and React, it provides a clean, distraction-free environment for writing and organizing your notes, documentation, and ideas.

## ✨ Features

- **📝 Rich Markdown Editor** — Built on CodeMirror with syntax highlighting and theme support
- **📚 Organized Collections** — Structure your content into codexes and sections
- **⭐ Smart Pinning** — Pin your most important codexes with a responsive carousel view
- **🎨 Modern UI** — Clean, responsive interface built with React and TypeScript
- **💾 Local Storage** — All your data stays on your machine with SQLite backend
- **🖥️ Native Desktop** — Cross-platform desktop app powered by Wails
- **🔍 Quick Navigation** — Jump between sections and headings effortlessly

## 🎯 Perfect For

- **Knowledge Workers** — Researchers, writers, and professionals who need organized note-taking
- **Developers** — Technical documentation, code snippets, and project notes
- **Students** — Course notes, research materials, and study guides
- **Anyone** who values privacy and wants their notes stored locally

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript, Vite
- **Editor:** CodeMirror 6
- **Backend:** Go with Wails framework
- **Storage:** SQLite database
- **Styling:** CSS modules with responsive design
- **Development:** ESLint + Prettier for code quality

## 🚀 Quick Start

### Prerequisites

- **Go 1.20+** with [Wails v2](https://wails.io/docs/gettingstarted/installation) installed
- **Node.js 18+** and npm

### Development Setup

**1. Clone and setup frontend:**

PowerShell:

```powershell
cd frontend
npm install
npm run dev
```

**2. Start the desktop application:**

```powershell
wails dev
```

This will launch the desktop app with hot reload. The development server will also be available at `http://localhost:34115` for browser-based debugging.

## 📦 Building for Production

**1. Build the frontend:**

```powershell
cd frontend
npm run build
```

**2. Create desktop executable:**

```powershell
wails build
```

The built application and installer will be available in the `build/bin/` directory.

> 💡 For advanced build options and platform-specific configurations, see the [Wails Build Documentation](https://wails.io/docs/reference/cli#build).

## 🧹 Code Quality

Run these commands from the `frontend/` directory:

```powershell
cd frontend

# Run ESLint
npm run lint

# Format code with Prettier
npm run format

# Type checking
npx tsc --noEmit
```

## 📁 Project Structure

```
codex/
├── frontend/              # React + TypeScript UI
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── contexts/      # React context providers
│   │   └── utils/         # Helper functions and API calls
│   └── public/            # Static assets
├── internal/              # Go backend packages
│   ├── database/          # Repository implementations
│   ├── domain/            # Business logic and handlers
│   ├── models/            # Data structures
│   └── storage/           # Storage abstractions
├── build/                 # Build artifacts and installers
└── wails.json            # Wails configuration
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository** and create a feature branch
2. **Make your changes** following the existing code style
3. **Run the linter and formatter** to ensure code quality
4. **Test your changes** thoroughly
5. **Submit a pull request** with a clear description

For bug reports and feature requests, please [open an issue](../../issues).

## 📄 License

This project is licensed under the MIT License. See the [`LICENSE`](LICENSE) file for details.

## 💡 Support

- **Documentation:** Check the code comments and this README
- **Issues:** Report bugs or request features via GitHub Issues
- **Community:** Feel free to fork and customize for your needs

---

<p align="center">
  <i>Built with ❤️ for knowledge workers who value privacy and local control</i>
</p>
