# DocBridge

> AI 驅動的文件翻譯平台，可自動為 GitHub 儲存庫建立本地化的拉取請求。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Tests](https://img.shields.io/badge/tests-316%20passing-brightgreen.svg)]()

## 概述

DocBridge 是一個開源網路平台，利用 AI 簡化 GitHub 文件翻譯流程。它會自動掃描儲存庫中的 Markdown 檔案，使用您選擇的 AI 供應商進行翻譯，並透過直觀的網頁介面建立包含本地化內容的拉取請求。

**開源是全球性的。文件卻往往不是。** DocBridge 彌補了這個差距。

## 功能特色

- **AI 驅動翻譯**：使用 Claude、OpenAI 或自訂 AI 供應商翻譯 Markdown 文件
- **智慧檔案放置**：根據儲存庫模式（i18n 子目錄、docs 子目錄、語言子目錄、根目錄後綴模式）自動偵測並建議翻譯檔案路徑
- **GitHub 整合**：無縫 OAuth 驗證與自動 PR 建立（含分支管理）
- **並排檢視**：在提交前使用內建編輯器檢視與編輯翻譯
- **多供應商支援**：採用可熱插拔的 AI 供應商架構，具可擴充的供應商註冊機制
- **多語言支援**：內建國際化功能，支援英文與中文語系
- **Markdown 保留**：智慧解析，在翻譯過程中保留程式碼區塊、連結與格式
- **測試驅動開發**：在核心、AI 與 GitHub 套件中共有 316 個通過的測試，確保可靠性
- **現代化介面**：使用 shadcn/ui 元件建構，提供精緻的使用者體驗

## 架構

DocBridge 建構為一個 **pnpm monorepo**，具有清晰的關注點分離：

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

### 設計原則

- **純函式**：業務邏輯以純粹、可測試的函式實作
- **UI 中無業務邏輯**：所有邏輯置於套件中，UI 元件僅負責呈現
- **測試先行**：先編寫測試，再進行實作
- **型別安全**：完整 TypeScript 覆蓋並啟用嚴格模式

## 安裝

### 必要條件

- Node.js 18+
- pnpm 8+
- GitHub OAuth 應用程式憑證
- AI 供應商 API 金鑰（Anthropic 或 OpenAI）

### 設定步驟

1. **複製儲存庫**

```bash
git clone https://github.com/clovu/doc-bridge.git
cd doc-bridge
```

2. **安裝相依套件**

```bash
pnpm install
```

3. **設定環境變數**

建立 `apps/web/.env.local`：

```env
# GitHub OAuth (create at https://github.com/settings/developers)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# AI Provider API Key
ANTHROPIC_API_KEY=your_anthropic_api_key
# OR
OPENAI_API_KEY=your_openai_api_key
```

4. **啟動開發伺服器**

```bash
pnpm dev
```

應用程式將於 `http://localhost:3000` 提供服務。

## 使用方式

### 基本工作流程

1. **使用 GitHub 驗證**：點擊首頁的「使用 GitHub 登入」
2. **選擇儲存庫**：瀏覽您可存取的儲存庫
3. **掃描 Markdown 檔案**：DocBridge 自動偵測所有 Markdown 檔案
4. **選擇要翻譯的檔案**：選取您要翻譯的文件檔案
5. **設定翻譯**：
   - 選擇目標語言
   - 選擇 AI 供應商（Claude、OpenAI 或自訂供應商）
   - 設定供應商參數（API 金鑰、基礎 URL、模型）
6. **檢閱翻譯**：使用並排編輯器檢閱與編輯翻譯
7. **選擇放置位置**：選擇翻譯檔案應放置的位置（AI 會建議最佳路徑）
8. **建立拉取請求**：DocBridge 會自動分支儲存庫、建立分支、提交翻譯並開啟 PR

### AI 供應商設定

DocBridge 透過靈活的供應商系統支援多種 AI 供應商：

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

#### 自訂供應商

```
Provider: Custom
Base URL: https://your-api.example.com
API Key: your-key
Model: your-model-name
```

自訂供應商必須實作與 OpenAI 相容的 API 格式。

### 翻譯檔案放置

DocBridge 智慧偵測儲存庫模式並建議適當的放置位置：

- **i18n 子目錄模式**：`docs/i18n/zh/README.md`
- **Docs 子目錄模式**：`docs/zh/README.md`
- **語言子目錄模式**：`zh/docs/README.md`
- **根目錄後綴模式**：`README.zh.md`

AI 驅動的路徑選擇器會分析現有檔案，並提供帶有信賴度評分的建議。

## 開發

### 執行測試

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

### 建置

```bash
# Build the web application
pnpm --filter @docbridge/web exec next build

# Build all packages
pnpm build
```

### 程式碼品質

```bash
# Lint
pnpm lint

# Type check
pnpm type-check
```

### 專案標準

- **不使用分號**，使用單引號，2 空格縮排（由 ESLint 強制執行）
- **TDD 方法**：先寫測試，再實作
- **優先使用純函式**而非類別
- **跨套件匯入**：使用 `@docbridge/*`（在 apps/web 之外絕不使用 `@/`）

## UI 元件

DocBridge 使用位於 https://ui.shadcn.com/ 的 [shadcn/ui](`packages/ui/`) 元件：

- `badge`, `button`, `card`, `combobox`, `dialog`
- `input`, `label`, `select`, `textarea`
- `dropdown-menu`, `popover`, `separator`

所有元件均可自訂，並遵循 Radix UI 原語。

## 多語言支援

平台本身使用 `next-intl` 進行國際化：

- **英文**（`en`）：預設語系
- **中文**（`zh`）：提供完整翻譯

語系檔案：`packages/i18n/locales/{en,zh}.json`

## 貢獻指南

我們歡迎貢獻！DocBridge 建構時特別強調程式碼品質與測試。

### 如何貢獻

1. **分支儲存庫**
2. **建立功能分支**：`git checkout -b feature/amazing-feature`
3. **先撰寫測試**：遵循 TDD 原則
4. **實作您的功能**：確保所有測試通過
5. **執行程式碼檢查**：`pnpm lint`
6. **提交變更**：`git commit -m ‘feat: add amazing feature’`
7. **推送到分支**：`git push origin feature/amazing-feature`
8. **開啟拉取請求**

### 開發指南

- 所有業務邏輯必須有對應的測試
- 維持 100% 測試通過率（目前 316/316 測試通過）
- 遵循現有程式碼風格（由 ESLint 強制執行）
- 為新功能更新文件
- 保持套件解耦與專注

### 可貢獻的領域

- 額外的 AI 供應商整合
- 增強 Markdown 解析能力
- UI/UX 改進
- 額外的語言支援
- 效能最佳化
- 文件改進

## 文件

完整的技術文件位於 `docs/` 目錄：

- `LOGGING.md`：記錄基礎設施與最佳實務
- `TRANSLATION_STORAGE.md`：翻譯檔案放置模式
- `PATH_SELECTION_IMPLEMENTATION.md`：AI 驅動路徑選擇詳細資訊
- `JSON_PARSING_FIX.md`：從 LLM 回應中穩健提取 JSON

## 授權

MIT License © 2026 [Clover You](https://github.com/clovu)

詳見 [LICENSE](LICENSE)。

---

**為開源社群用心打造**
