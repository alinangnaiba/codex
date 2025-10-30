
# CodeX

> A lightweight, local-first knowledge manager for desktop

CodeX is a modern desktop application that helps you organize and manage your knowledge through structured collection called "codex". Built with Go and React, it provides a clean, distraction-free environment for writing and organizing your notes, documentation, and ideas.

## ✨ Features

- **📝 Rich Markdown Editor** — Built on CodeMirror with syntax highlighting and theme support
- **📚 Organized Collections** — Structure your content into codexes and sections
- **⭐ Smart Pinning** — Pin your most important codexes with a responsive carousel view
- **🎨 Modern UI** — Clean, responsive interface built with React and TypeScript
- **💾 Local Storage** — All your data stays on your machine with SQLite backend
- **🖥️ Native Desktop** — Cross-platform desktop app powered by Wails
- **🔍 Quick Navigation** — Jump between sections and headings effortlessly
- **🔄 GitHub Backup** — Optional backup to GitHub with manual sync control

## 🎯 Perfect For

- **Knowledge Workers** — Researchers, writers, and professionals who need organized note-taking
- **Developers** — Technical documentation, code snippets, and project notes
- **Students** — Course notes, research materials, and study guides
- **Anyone** who values privacy and wants their notes stored locally

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript, Vite
- **Editor:** CodeMirror 6
- **Backend:** Go with Wails framework
- **Storage:** SQLite database + file-based markdown storage
- **GitHub Integration:** go-git (Git operations), go-github (GitHub API)
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

## 🔄 GitHub Backup Integration

CodeX includes optional GitHub backup functionality, allowing you to sync your codexes to a GitHub repository for backup and version control purposes.

### Features

- **Manual Sync Control** — Back up only when you choose
- **Auto-generated Documentation** — Creates `README.md` with codex index and `structure.json` with metadata mapping
- **Repository-Specific Access** — Use fine-grained tokens scoped to just your backup repository
- **Local-First Approach** — Your local content is always the source of truth (force push)

### Setup Instructions

#### 1. Create a Fine-Grained Personal Access Token

1. Go to [GitHub Personal Access Tokens](https://github.com/settings/personal-access-tokens/new)
2. Click **"Generate new token"** → **"Generate new token (fine-grained)"**
3. Configure your token:
   - **Token name**: `CodeX Backup`
   - **Expiration**: Choose your preference (or no expiration)
   - **Repository access**: Select **"Only select repositories"**
   - Choose the repository you want to use for backups (or create a new one)
   - **Permissions** → **Repository permissions**:
     - Set **Contents** to **Read and write**
     - Set **Metadata** to **Read-only** (automatically selected)
4. Click **"Generate token"** and copy it immediately

> ⚠️ **Security Note**: Fine-grained tokens are much safer than classic tokens. They can be scoped to a specific repository with minimal permissions. Never share your token or commit it to version control.

#### 2. Configure GitHub Integration in CodeX

1. Open **Settings** from the CodeX menu
2. Scroll to the **GitHub Integration** section
3. Enter your configuration:
   - **Repository URL**: Format `username/repository-name` (e.g., `johndoe/codex-backup`)
   - **Personal Access Token**: Paste the token you created
   - **Branch Name**: `main` (or your preferred branch name)
4. Click **"Test Connection"** to verify your credentials
5. Click **"Initialize Backup"** to set up the repository

#### 3. Using GitHub Backup

Once configured, you'll see a sync status bar at the top of your Library page:

- **Up to date**: No changes to sync
- **X files changed**: Shows how many files have been modified

To back up your changes:

1. Click **"Backup to GitHub"** in the Library page
2. Enter a commit message describing your changes
3. Click **"Sync Now"** to push to GitHub

### What Gets Backed Up

Your GitHub repository will contain:

```
your-backup-repo/
├── .gitignore          # Excludes database and temp files
├── README.md           # Auto-generated index of all codexes
├── structure.json      # Metadata mapping (titles, IDs, timestamps)
├── codex_1/
│   ├── section_1.md
│   ├── section_2.md
│   └── section_3.md
├── codex_2/
│   └── section_4.md
└── ...
```

### Important Notes

- **Local is Source of Truth**: CodeX uses force push, meaning your local content will always overwrite remote changes
- **Manual Sync Only**: Backups occur only when you click the "Backup to GitHub" button
- **Metadata Regeneration**: `structure.json` and `README.md` are regenerated on every sync to stay current
- **Repository Creation**: If the specified repository doesn't exist, CodeX will create it automatically

### Disconnecting GitHub

To disconnect GitHub integration:

1. Go to **Settings** → **GitHub Integration**
2. Click **"Disconnect GitHub"**

This removes the integration but doesn't delete your local files or the GitHub repository.

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

## 🐛 Bug Reports

Found an issue? Help us improve CodeX by reporting bugs:

1. **Search existing issues** to avoid duplicates
2. **Provide clear details** about the problem and steps to reproduce
3. **Include your environment** (OS, Wails version, Node.js version)
4. **Add screenshots or logs** if helpful
5. **Use descriptive titles** for easy identification

Please [open an issue](../../issues) with the bug report template.

## 🌟 Feature Requests

Have an idea to make CodeX better? We’d love to hear it. Please open a new GitHub issue using the "feature request" template and include:

- A short summary of the idea
- Why it would be useful and who benefits
- Any mockups, examples, or links that help explain the request

This helps us prioritize work and evaluate feasibility — thank you for contributing ideas!

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
