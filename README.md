# DocBridge

> AI-powered documentation translation platform that automatically creates localized pull requests for GitHub repositories.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Tests](https://img.shields.io/badge/tests-316%20passing-brightgreen.svg)]()

## Overview

DocBridge is an open-source web platform that streamlines the process of translating GitHub documentation using AI. It automatically scans repositories for markdown files, translates them using your choice of AI provider, and creates pull requests with the localized content—all through an intuitive web interface.

**Open source is global. Documentation often isn’t.** DocBridge bridges that gap.

## Features

- **AI-Powered Translation**: Translate markdown documentation using Claude, OpenAI, or custom AI providers
- **Intelligent File Placement**: Automatically detects and suggests translation file paths based on repository patterns (i18n subdirectories, docs subdirectories, language subdirectories, root suffix patterns)
- **GitHub Integration**: Seamless OAuth authentication and automatic PR creation with fork management
- **Side-by-Side Review**: Edit and review translations before submitting with a built-in editor
- **Multi-Provider Support**: Hot-pluggable AI provider architecture with extensible provider registry
- **Multi-Language Support**: Built-in internationalization with English and Chinese locales
- **Markdown Preservation**: Intelligent parsing that preserves code blocks, links, and formatting during translation
- **TDD-Driven**: 316 passing tests across core, AI, and GitHub packages ensuring reliability
- **Modern UI**: Built with shadcn/ui components for a polished user experience

## Architecture

DocBridge is built as a **pnpm monorepo** with a clean separation of concerns:

```
doc-bridge/
├── apps/
│   └── web/                    # Next.js 16 application (port 3000)
├── packages/
│   ├── core/                   # Core translation logic (pure TypeScript)
│   │   ├── markdown-scanner    # Scans repos for markdown files
│   │   ├── markdown-preserver  # Preserves markdown structure during translation
│   │   ├── translate-document  # Orchestrates translation workflow
│   │   ├── translation-storage # Intelligent file placement detection
│   │   └── path-selector       # AI-powered path suggestions
│   ├── ai/                     # AI provider abstraction layer
│   │   ├── TranslationProvider # Provider interface
│   │   ├── ClaudeTranslationProvider
│   │   ├── OpenAITranslationProvider
│   │   ├── MockTranslationProvider
│   │   └── registry            # Provider registration and discovery
│   ├── github/                 # GitHub API wrappers (Octokit)
│   │   ├── auth, repos, tree
│   │   ├── fork, branch, files
│   │   └── pull-request
│   ├── ui/                     # Shared shadcn/ui components
│   └── i18n/                   # Internationalization (next-intl)
└── docs/                       # Technical documentation
```

### Design Principles

- **Pure Functions**: Business logic is implemented as pure, testable functions
- **No Business Logic in UI**: All logic resides in packages, UI components are presentational
- **TDD-First**: Tests are written before implementation
- **Type Safety**: Full TypeScript coverage with strict mode enabled

## Installation

### Prerequisites

- Node.js 18+
- pnpm 8+
- GitHub OAuth App credentials
- AI provider API key (Anthropic or OpenAI)

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/clovu/doc-bridge.git
cd doc-bridge
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Configure environment variables**

Create `apps/web/.env.local`:

```env
# GitHub OAuth (create at https://github.com/settings/developers)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# AI Provider API Key
ANTHROPIC_API_KEY=your_anthropic_api_key
# OR
OPENAI_API_KEY=your_openai_api_key
```

4. **Start the development server**

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Usage

### Basic Workflow

1. **Authenticate with GitHub**: Click "Login with GitHub" on the homepage
2. **Select a Repository**: Browse your accessible repositories
3. **Scan for Markdown Files**: DocBridge automatically detects all markdown files
4. **Choose Files to Translate**: Select the documentation files you want to translate
5. **Configure Translation**:
   - Select target language
   - Choose AI provider (Claude, OpenAI, or custom)
   - Configure provider settings (API key, base URL, model)
6. **Review Translation**: Use the side-by-side editor to review and edit translations
7. **Select Placement**: Choose where translated files should be placed (AI suggests optimal paths)
8. **Create Pull Request**: DocBridge automatically forks the repo, creates a branch, commits translations, and opens a PR

### AI Provider Configuration

DocBridge supports multiple AI providers through a flexible provider system:

#### Claude (Anthropic)

```
Provider: Claude
Model: claude-haiku-4-5-20251001
API Key: sk-ant-...
```

#### OpenAI

```
Provider: OpenAI
Model: gpt-4-turbo
API Key: sk-...
Base URL: https://api.openai.com/v1 (optional)
```

#### Custom Provider

```
Provider: Custom
Base URL: https://your-api.example.com
API Key: your-key
Model: your-model-name
```

Custom providers must implement the OpenAI-compatible API format.

### Translation File Placement

DocBridge intelligently detects repository patterns and suggests appropriate placement:

- **i18n Subdirectory Pattern**: `docs/i18n/zh/README.md`
- **Docs Subdirectory Pattern**: `docs/zh/README.md`
- **Language Subdirectory Pattern**: `zh/docs/README.md`
- **Root Suffix Pattern**: `README.zh.md`

The AI-powered path selector analyzes existing files and provides confidence-scored suggestions.

## Development

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @docbridge/core test
pnpm --filter @docbridge/ai test
pnpm --filter @docbridge/github test

# Run tests in watch mode
pnpm --filter @docbridge/core test --watch
```

### Building

```bash
# Build the web application
pnpm --filter @docbridge/web exec next build

# Build all packages
pnpm build
```

### Code Quality

```bash
# Lint
pnpm lint

# Type check
pnpm type-check
```

### Project Standards

- **No semicolons**, single quotes, 2-space indentation (enforced by ESLint)
- **TDD approach**: Write tests first, then implementation
- **Pure functions** preferred over classes
- **Cross-package imports**: Use `@docbridge/*` (never `@/` outside apps/web)

## UI Components

DocBridge uses [shadcn/ui](https://ui.shadcn.com/) components located in `packages/ui/`:

- `badge`, `button`, `card`, `combobox`, `dialog`
- `input`, `label`, `select`, `textarea`
- `dropdown-menu`, `popover`, `separator`

All components are customizable and follow Radix UI primitives.

## Multi-Language Support

The platform itself is internationalized using `next-intl`:

- **English** (`en`): Default locale
- **Chinese** (`zh`): Full translation available

Locale files: `packages/i18n/locales/{en,zh}.json`

## Contributing

We welcome contributions! DocBridge is built with a strong emphasis on code quality and testing.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Write tests first**: Follow TDD principles
4. **Implement your feature**: Ensure all tests pass
5. **Run linting**: `pnpm lint`
6. **Commit your changes**: `git commit -m ‘feat: add amazing feature’`
7. **Push to the branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Development Guidelines

- All business logic must have corresponding tests
- Maintain 100% test pass rate (currently 316/316 tests passing)
- Follow existing code style (enforced by ESLint)
- Update documentation for new features
- Keep packages decoupled and focused

### Areas for Contribution

- Additional AI provider integrations
- Enhanced markdown parsing capabilities
- UI/UX improvements
- Additional language support
- Performance optimizations
- Documentation improvements

## Documentation

Comprehensive technical documentation is available in the `docs/` directory:

- `LOGGING.md`: Logging infrastructure and best practices
- `TRANSLATION_STORAGE.md`: Translation file placement patterns
- `PATH_SELECTION_IMPLEMENTATION.md`: AI-powered path selection details
- `JSON_PARSING_FIX.md`: Robust JSON extraction from LLM responses

## License

MIT License © 2026 [Clover You](https://github.com/clovu)

See [LICENSE](LICENSE) for details.

---

**Made with ❤️ for the open source community**
