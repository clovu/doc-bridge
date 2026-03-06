# DocBridge

> AI 驱动的文档翻译平台，可自动为 GitHub 仓库创建本地化拉取请求。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Tests](https://img.shields.io/badge/tests-316%20passing-brightgreen.svg)]()

## 概览

DocBridge 是一个开源 Web 平台，可简化使用 AI 翻译 GitHub 文档的过程。它会自动扫描仓库中的 Markdown 文件，使用您选择的 AI 提供商进行翻译，并通过直观的 Web 界面创建包含本地化内容的拉取请求。

**开源是全球性的，但文档往往不是。** DocBridge 弥合了这一差距。

## 功能

- **AI 驱动的翻译**：使用 Claude、OpenAI 或自定义 AI 提供商翻译 Markdown 文档
- **智能文件放置**：自动检测并根据仓库模式（i18n 子目录、docs 子目录、语言子目录、根后缀模式）建议翻译文件路径
- **GitHub 集成**：无缝 OAuth 认证和自动 PR 创建，含 fork 管理
- **并排审阅**：使用内置编辑器编辑和审阅翻译后再提交
- **多提供商支持**：热插拔 AI 提供商架构，含可扩展的提供商注册表
- **多语言支持**：内置国际化，含英语和中文语言环境
- **Markdown 保留**：智能解析，在翻译过程中保留代码块、链接和格式
- **TDD 驱动**：核心、AI 和 GitHub 包共 316 个通过测试，确保可靠性
- **现代化 UI**：使用 shadcn/ui 组件构建，提供精致的用户体验

## 架构

DocBridge 构建为 **pnpm 单体仓库**，职责分离清晰：

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

### 设计原则

- **纯函数**：业务逻辑实现为纯函数、可测试函数
- **UI 中无业务逻辑**：所有逻辑位于包中，UI 组件为展示层
- **TDD 优先**：先编写测试，再实现功能
- **类型安全**：完整的 TypeScript 覆盖，启用严格模式

## 安装

### 先决条件

- Node.js 18+
- pnpm 8+
- GitHub OAuth 应用凭证
- AI 提供商 API 密钥（Anthropic 或 OpenAI）

### 设置

1. **克隆仓库**

```bash
git clone https://github.com/clovu/doc-bridge.git
cd doc-bridge
``` 

2. **安装依赖**

```bash
pnpm install
``` 

3. **配置环境变量**

创建 `apps/web/.env.local`:

```env
# GitHub OAuth (create at https://github.com/settings/developers)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# AI Provider API Key
ANTHROPIC_API_KEY=your_anthropic_api_key
# OR
OPENAI_API_KEY=your_openai_api_key
``` 

4. **启动开发服务器**

```bash
pnpm dev
``` 

应用程序将在 `http://localhost:3000` 可用。

## 使用

### 基本工作流程

1. **GitHub 认证**：在主页点击 "Login with GitHub"
2. **选择仓库**：浏览您可访问的仓库
3. **扫描 Markdown 文件**：DocBridge 自动检测所有 Markdown 文件
4. **选择要翻译的文件**：选择您要翻译的文档文件
5. **配置翻译**：
   - 选择目标语言
   - 选择 AI 提供商（Claude、OpenAI 或自定义）
   - 配置提供商设置（API 密钥、基础 URL、模型）
6. **审阅翻译**：使用并排编辑器审阅和编辑翻译
7. **选择放置位置**：选择翻译文件的放置位置（AI 会建议最佳路径）
8. **创建拉取请求**：DocBridge 自动 fork 仓库、创建分支、提交翻译并打开 PR

### AI 提供商配置

DocBridge 通过灵活的提供商系统支持多个 AI 提供商：

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

#### 自定义提供商

```
Provider: Custom
Base URL: https://your-api.example.com
API Key: your-key
Model: your-model-name
``` 

自定义提供商必须实现 OpenAI 兼容的 API 格式。

### 翻译文件放置

DocBridge 智能检测仓库模式并建议适当放置：

- **i18n 子目录模式**：`docs/i18n/zh/README.md` 
- **Docs 子目录模式**：`docs/zh/README.md` 
- **语言子目录模式**：`zh/docs/README.md` 
- **根后缀模式**：`README.zh.md` 

AI 驱动的路径选择器分析现有文件并提供置信度评分建议。

## 开发

### 运行测试

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

### 构建

```bash
# Build the web application
pnpm --filter @docbridge/web exec next build

# Build all packages
pnpm build
``` 

### 代码质量

```bash
# Lint
pnpm lint

# Type check
pnpm type-check
``` 

### 项目标准

- **无分号**，单引号，2 空格缩进（由 ESLint 强制）
- **TDD 方法**：先写测试，再实现功能
- **优先纯函数**而非类
- **跨包导入**：使用 `@docbridge/*`（应用/网页外从不使用 `@/`）

## UI 组件

DocBridge 使用 [shadcn/ui](https://ui.shadcn.com/) 组件，位于 `packages/ui/`:

- `badge`, `button`, `card`, `combobox`, `dialog` 
- `input`, `label`, `select`, `textarea` 
- `dropdown-menu`, `popover`, `separator` 

所有组件均可自定义，并遵循 Radix UI 原语。

## 多语言支持

平台本身使用 `next-intl`:

- **英语**（`en`)：默认语言环境
- **中文**（`zh`)：完整翻译可用

语言环境文件：`packages/i18n/locales/{en,zh}.json` 

## 贡献

欢迎贡献！DocBridge 构建时高度重视代码质量和测试。

### 如何贡献

1. **Fork 仓库**
2. **创建功能分支**：`git checkout -b feature/amazing-feature` 
3. **先写测试**：遵循 TDD 原则
4. **实现您的功能**：确保所有测试通过
5. **运行代码检查**：`pnpm lint` 
6. **提交您的更改**：`git commit -m ‘feat: add amazing feature’` 
7. **推送到分支**：`git push origin feature/amazing-feature` 
8. **打开拉取请求**

### 开发指南

- 所有业务逻辑必须有相应测试
- 保持 100% 测试通过率（当前 316/316 测试通过）
- 遵循现有代码风格（由 ESLint 强制）
- 更新新功能文档
- 保持包解耦和专注

### 贡献领域

- 额外的 AI 提供商集成
- 增强的 Markdown 解析功能
- UI/UX 改进
- 额外语言支持
- 性能优化
- 文档改进

## 文档

全面的技术文档在 `docs/` 目录中可用：

- `LOGGING.md`: 日志基础设施和最佳实践
- `TRANSLATION_STORAGE.md`: 翻译文件放置模式
- `PATH_SELECTION_IMPLEMENTATION.md`: AI 驱动的路径选择详情
- `JSON_PARSING_FIX.md`: 从 LLM 响应中提取 JSON 的健壮方法

## 许可证

MIT 许可证 © 2026 [Clover You](https://github.com/clovu)

详见 [LICENSE](LICENSE)。

---

**用 ❤️ 为开源社区打造**