# Translation Storage

This module provides intelligent file placement for translated documentation by detecting existing multi-language patterns in repositories.

## Features

- **Pattern Detection**: Automatically detects how a repository organizes multi-language documentation
- **Smart Placement**: Places translated files following the detected pattern
- **Multiple Patterns**: Supports 4 common multi-language patterns plus sensible defaults
- **Edge Case Handling**: Handles nested directories, various file extensions, and language code formats

## Supported Patterns

### 1. Root Suffix Pattern
Files with language codes before the extension:
```
README.md
README.zh.md
README.fr.md
CONTRIBUTING.md
CONTRIBUTING.ja.md
```

### 2. Docs Subdirectory Pattern
Language subdirectories within a docs folder:
```
docs/en/guide.md
docs/zh/guide.md
docs/fr/getting-started/intro.md
```

### 3. Language Subdirectory Pattern
Root-level language directories:
```
en/README.md
zh/README.md
ja/docs/guide.md
```

### 4. i18n/Locales Pattern
Internationalization directories:
```
i18n/en/docs.md
i18n/zh/docs.md
locales/fr/content.md
translations/ja/guide.md
```

### 5. Default Behavior (No Pattern)
When no pattern is detected:
- Root files: Use suffix pattern (`README.md` → `README.zh.md`)
- Nested files: Create locale subdirectories (`docs/guide.md` → `docs/zh/guide.md`)

## Usage

```typescript
import {
  detectMultiLangPattern,
  getTranslationPlacement
} from '@docbridge/core'

// 1. Get all files in the repository
const repoFiles = [
  'README.md',
  'docs/en/guide.md',
  'docs/zh/guide.md',
  'src/index.ts'
]

// 2. Detect the multi-language pattern
const pattern = detectMultiLangPattern(repoFiles)
console.log(pattern)
// { type: 'docs-subdir', baseDir: 'docs' }

// 3. Get placement for a translated file
const originalFile = 'docs/en/getting-started.md'
const targetLocale = 'fr'

const placement = getTranslationPlacement(originalFile, targetLocale, pattern)
console.log(placement)
// {
//   targetPath: 'docs/fr/getting-started.md',
//   createDirectory: true
// }
```

## API Reference

### `detectMultiLangPattern(files: string[]): MultiLangPattern`

Analyzes file paths to detect the multi-language pattern used in a repository.

**Parameters:**
- `files`: Array of file paths in the repository

**Returns:**
- `MultiLangPattern` object with:
  - `type`: Pattern type ('root-suffix' | 'docs-subdir' | 'lang-subdir' | 'i18n-subdir' | 'none')
  - `baseDir`: Base directory for subdir patterns (e.g., 'docs', 'i18n')

**Priority Order:**
1. i18n-subdir (highest)
2. docs-subdir
3. lang-subdir
4. root-suffix
5. none (lowest)

### `getTranslationPlacement(originalPath: string, targetLocale: string, pattern: MultiLangPattern): TranslationPlacement`

Determines where to place a translated file based on the detected pattern.

**Parameters:**
- `originalPath`: Path of the original file being translated
- `targetLocale`: Target language code (e.g., 'zh', 'fr', 'ja', 'zh-CN')
- `pattern`: Pattern detected by `detectMultiLangPattern`

**Returns:**
- `TranslationPlacement` object with:
  - `targetPath`: Where to save the translated file
  - `createDirectory`: Whether parent directories need to be created

## Examples

### Example 1: Repository with docs/locale structure

```typescript
const files = [
  'README.md',
  'docs/en/guide.md',
  'docs/en/api/reference.md',
  'docs/zh/guide.md'
]

const pattern = detectMultiLangPattern(files)
// { type: 'docs-subdir', baseDir: 'docs' }

const placement = getTranslationPlacement('docs/en/api/reference.md', 'fr', pattern)
// {
//   targetPath: 'docs/fr/api/reference.md',
//   createDirectory: true
// }
```

### Example 2: Repository with root suffix pattern

```typescript
const files = [
  'README.md',
  'README.zh.md',
  'README.ja.md',
  'CONTRIBUTING.md',
  'CONTRIBUTING.fr.md'
]

const pattern = detectMultiLangPattern(files)
// { type: 'root-suffix' }

const placement = getTranslationPlacement('README.md', 'es', pattern)
// {
//   targetPath: 'README.es.md',
//   createDirectory: false
// }
```

### Example 3: Repository with no multi-language docs

```typescript
const files = [
  'README.md',
  'docs/guide.md',
  'src/index.ts'
]

const pattern = detectMultiLangPattern(files)
// { type: 'none' }

// Root file uses suffix
const placement1 = getTranslationPlacement('README.md', 'zh', pattern)
// {
//   targetPath: 'README.zh.md',
//   createDirectory: false
// }

// Nested file creates locale subdirectory
const placement2 = getTranslationPlacement('docs/guide.md', 'fr', pattern)
// {
//   targetPath: 'docs/fr/guide.md',
//   createDirectory: true
// }
```

## Supported Language Codes

The module recognizes common language codes including:
- Two-letter codes: `en`, `zh`, `ja`, `ko`, `fr`, `de`, `es`, `pt`, `ru`, `it`, etc.
- Regional variants: `zh-CN`, `zh-TW`, `pt-BR`, `en-US`, `en-GB`, etc.

## Edge Cases

### Files with Multiple Dots
```typescript
getTranslationPlacement('api.v2.md', 'zh', { type: 'root-suffix' })
// { targetPath: 'api.v2.zh.md', createDirectory: false }
```

### Files Without Extensions
```typescript
getTranslationPlacement('LICENSE', 'fr', { type: 'root-suffix' })
// { targetPath: 'LICENSE.fr', createDirectory: false }
```

### Deeply Nested Structures
```typescript
getTranslationPlacement(
  'docs/en/api/v2/reference.md',
  'ja',
  { type: 'docs-subdir', baseDir: 'docs' }
)
// { targetPath: 'docs/ja/api/v2/reference.md', createDirectory: true }
```

## Integration with DocBridge

This module is designed to work seamlessly with DocBridge's translation workflow:

1. **Scan Phase**: Use `scanMarkdownFiles` to get all markdown files
2. **Detection Phase**: Use `detectMultiLangPattern` to identify the pattern
3. **Translation Phase**: Translate files using `translateDocument`
4. **Placement Phase**: Use `getTranslationPlacement` to determine target paths
5. **Commit Phase**: Create files at target paths and commit to PR

## Testing

The module includes comprehensive tests covering:
- All 4 pattern types plus default behavior
- Pattern priority and detection accuracy
- Edge cases (no extension, multiple dots, nested paths)
- False positive prevention

Run tests:
```bash
pnpm --filter @docbridge/core test translation-storage
```
