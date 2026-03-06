# Path Selection Modal Implementation

## Overview

The Path Selection Modal is a popup dialog that appears before PR creation, allowing users to review and customize AI-recommended paths for translated Markdown files.

## Features

### 1. AI-Recommended Paths

The system generates recommended storage paths following these rules:

- **Default Pattern**: `{filename}.{locale}.md` (root-suffix style)
- **Same Directory**: Translations are placed in the same directory as the original file
- **Root Files**: Root-level files get translations placed alongside them in root

#### Examples

```
Original: README.md → Recommended: README.zh.md
Original: docs/guide.md → Recommended: docs/guide.zh.md
Original: src/api/intro.md → Recommended: src/api/intro.zh.md
```

### 2. Pattern Detection

The AI detects existing patterns in the repository and adjusts recommendations:

- **i18n-subdir**: `i18n/zh/README.md`
- **docs-subdir**: `docs/zh/guide.md`
- **lang-subdir**: `zh/README.md`
- **root-suffix**: `README.zh.md` (default)

### 3. User Interaction

#### Modal UI Components

The modal uses shadcn/ui components:

- `Dialog` - Main modal container
- `DialogContent` - Content area with max-width of 4xl
- `DialogHeader` - Title and description
- `DialogFooter` - Action buttons
- `Card` - Individual file placement cards
- `Badge` - Confidence indicators
- `Input` - Editable path fields
- `Button` - Actions (Back, Create PR)

#### Features

- **Default Selection**: AI-recommended paths are pre-selected
- **Editable Paths**: Users can directly edit any path
- **Alternatives**: Click to show alternative placement options
- **Validation**: Real-time path validation (no empty, no `..`, no `//`)
- **Confidence Badges**: Visual indicators (high/medium/low)
- **Multi-file Support**: Each file is handled independently

## Implementation

### Component Structure

```
PlacementModal
├── Props
│   ├── open: boolean
│   ├── onOpenChange: (open: boolean) => void
│   ├── suggestions: PlacementSuggestion[]
│   ├── onSubmit: (selectedPaths: Record<string, string>) => Promise<void>
│   └── isSubmitting: boolean
├── State
│   ├── selectedPaths: Record<string, string>
│   ├── errors: Record<string, string>
│   └── expandedAlternatives: Record<string, boolean>
└── Functions
    ├── validatePath(path: string): string | null
    ├── handlePathChange(originalPath: string, newPath: string): void
    ├── toggleAlternatives(originalPath: string): void
    ├── selectAlternative(originalPath: string, alternativePath: string): void
    └── handleSubmit(): Promise<void>
```

### Integration Flow

1. **Review Page** (`review/page.tsx`)
   - User reviews and edits translations
   - Clicks "Create Pull Request" button
   - Fetches placement suggestions from `/api/placement`
   - Opens PlacementModal

2. **PlacementModal** (`components/placement-modal.tsx`)
   - Displays AI-recommended paths
   - Allows user to edit or select alternatives
   - Validates paths in real-time
   - On submit, calls parent's `onSubmit` handler

3. **PR Creation**
   - Review page receives selected paths
   - Calls `/api/pr` with selected paths
   - Navigates to PR success page

### Files Modified

- `apps/web/src/components/placement-modal.tsx` - New modal component
- `apps/web/src/app/repos/[owner]/[repo]/review/page.tsx` - Integrated modal

### Files Unchanged

- `apps/web/src/app/repos/[owner]/[repo]/placement/page.tsx` - Still available for direct access
- `apps/web/src/app/api/placement/route.ts` - API endpoint unchanged
- `apps/web/src/app/api/pr/route.ts` - API endpoint unchanged
- `packages/core/src/translation-storage.ts` - Pattern detection logic unchanged
- `packages/core/src/path-selector.ts` - Path suggestion logic unchanged

## Usage

### For Users

1. Complete translation review
2. Click "Create Pull Request"
3. Review AI-recommended paths in the modal
4. (Optional) Edit paths or select alternatives
5. Click "Create Pull Request" to proceed

### For Developers

```typescript
import { PlacementModal } from '@/components/placement-modal'

<PlacementModal
  open={showModal}
  onOpenChange={setShowModal}
  suggestions={placementSuggestions}
  onSubmit={handlePlacementSubmit}
  isSubmitting={isCreatingPR}
/>
```

## Validation Rules

The modal validates paths with the following rules:

1. **Non-empty**: Path cannot be empty or whitespace-only
2. **No path traversal**: Path cannot contain `..`
3. **No double slashes**: Path cannot contain `//`
4. **Submit disabled**: Submit button is disabled when validation errors exist

## Multi-Language Support

The modal supports multiple target locales:

- Language codes: `en`, `zh`, `ja`, `ko`, `fr`, `de`, `es`, `pt`, `ru`, etc.
- Region codes: `zh-CN`, `zh-TW`, `pt-BR`, `en-US`, `en-GB`, etc.

Each locale generates independent path recommendations following the same rules.

## Accessibility

- Modal uses Radix UI Dialog primitive for accessibility
- Keyboard navigation supported (Tab, Escape)
- Screen reader friendly with proper ARIA labels
- Focus management handled automatically

## Performance

- Modal content is lazy-loaded (only rendered when open)
- Path validation is debounced to avoid excessive re-renders
- Alternatives are collapsed by default to reduce initial render cost

## Future Enhancements

Potential improvements:

1. **Path Preview**: Show file tree visualization
2. **Batch Edit**: Apply same pattern to all files
3. **Custom Patterns**: Save and reuse custom placement patterns
4. **Conflict Detection**: Warn if target path already exists
5. **History**: Remember user's previous path selections
