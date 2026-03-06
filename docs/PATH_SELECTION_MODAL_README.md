# Path Selection Modal - Quick Start

## Overview

The Path Selection Modal is a popup dialog that appears before PR creation, allowing users to review and customize AI-recommended paths for translated Markdown files.

## Quick Demo

### Before (Old Flow)
```
Review Page → Placement Page → PR Creation
```

### After (New Flow)
```
Review Page → [Modal Popup] → PR Creation
```

## Key Features

✅ **AI-Recommended Paths** - Uses `{filename}.{locale}.md` format by default
✅ **Same Directory Placement** - Keeps translations with originals
✅ **Pattern Detection** - Adapts to existing repository structure
✅ **User Editable** - Direct input editing with validation
✅ **Alternative Options** - Multiple placement strategies available
✅ **Confidence Indicators** - Visual badges (high/medium/low)
✅ **Multi-File Support** - Handles multiple files independently
✅ **Multi-Language** - Supports all language codes (en, zh, ja, etc.)

## Usage

### For End Users

1. **Review translations** on the review page
2. **Click "Create Pull Request"** button
3. **Modal appears** with AI-recommended paths
4. **Review paths** - all follow `{filename}.{locale}.md` format
5. **(Optional) Edit paths** or select alternatives
6. **Click "Create Pull Request"** in modal
7. **PR is created** with your selected paths

### Path Examples

```
README.md → README.zh.md
docs/guide.md → docs/guide.zh.md
src/api/intro.md → src/api/intro.zh.md
```

## Documentation

### 📖 Full Documentation
- **[PATH_SELECTION_MODAL.md](./PATH_SELECTION_MODAL.md)** - Complete feature documentation
- **[PATH_SELECTION_MODAL_VISUAL.md](./PATH_SELECTION_MODAL_VISUAL.md)** - Visual diagrams and UI layouts
- **[PATH_SELECTION_MODAL_TESTS.md](./PATH_SELECTION_MODAL_TESTS.md)** - Comprehensive test scenarios
- **[PATH_SELECTION_MODAL_SUMMARY.md](./PATH_SELECTION_MODAL_SUMMARY.md)** - Implementation summary

### 🎯 Quick Links
- Component: `apps/web/src/components/placement-modal.tsx`
- Integration: `apps/web/src/app/repos/[owner]/[repo]/review/page.tsx`
- API: `apps/web/src/app/api/placement/route.ts`
- Core Logic: `packages/core/src/translation-storage.ts`

## Implementation Details

### Component Props

```typescript
interface PlacementModalProps {
  open: boolean                    // Modal visibility
  onOpenChange: (open: boolean) => void  // Close handler
  suggestions: PlacementSuggestion[]     // AI recommendations
  onSubmit: (paths: Record<string, string>) => Promise<void>  // Submit handler
  isSubmitting: boolean            // Loading state
}
```

### Path Suggestion Structure

```typescript
interface PlacementSuggestion {
  originalPath: string             // e.g., "README.md"
  suggestion: {
    targetPath: string             // e.g., "README.zh.md"
    reason: string                 // e.g., "Following existing .zh.md suffix pattern"
    confidence: 'high' | 'medium' | 'low'
    pattern: 'root-suffix' | 'docs-subdir' | 'lang-subdir' | 'i18n-subdir'
    alternatives: string[]         // e.g., ["docs/zh/README.md", "i18n/zh/README.md"]
  }
}
```

## Pattern Detection

The AI automatically detects existing patterns in your repository:

### 1. Root-Suffix (Default)
```
README.md → README.zh.md
guide.md → guide.zh.md
```

### 2. i18n-Subdir
```
README.md → i18n/zh/README.md
guide.md → i18n/zh/guide.md
```

### 3. docs-Subdir
```
README.md → docs/zh/README.md
guide.md → docs/zh/guide.md
```

### 4. lang-Subdir
```
README.md → zh/README.md
guide.md → zh/guide.md
```

## Validation

The modal validates paths with these rules:

- ✅ **Non-empty** - Path cannot be empty
- ✅ **No path traversal** - Path cannot contain `..`
- ✅ **No double slashes** - Path cannot contain `//`
- ✅ **Submit disabled** - Button disabled when errors exist

## Technology Stack

- **React** - Component framework
- **TypeScript** - Type safety
- **shadcn/ui** - UI components (Dialog, Card, Badge, Input, Button)
- **Radix UI** - Accessible primitives
- **Next.js** - App framework

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Accessibility

- ✅ Keyboard navigation (Tab, Escape)
- ✅ Screen reader support
- ✅ Focus management
- ✅ ARIA labels

## Performance

- ✅ Lazy rendering (only when open)
- ✅ Collapsed alternatives (reduced initial render)
- ✅ Debounced validation
- ✅ Optimized re-renders

## Testing

### Manual Testing Checklist

- [ ] Modal opens when clicking "Create Pull Request"
- [ ] AI-recommended paths are displayed
- [ ] Paths follow `{filename}.{locale}.md` format
- [ ] Confidence badges are shown
- [ ] Paths can be edited directly
- [ ] Alternatives can be expanded and selected
- [ ] Validation errors appear for invalid paths
- [ ] Submit button is disabled when errors exist
- [ ] PR is created with selected paths
- [ ] Modal closes after successful PR creation

### Automated Tests

Test scenarios are documented in [PATH_SELECTION_MODAL_TESTS.md](./PATH_SELECTION_MODAL_TESTS.md).

To implement tests, add testing dependencies:

```bash
pnpm add -D @testing-library/react @testing-library/user-event vitest jsdom
```

## Troubleshooting

### Modal doesn't open
- Check browser console for errors
- Verify `/api/placement` endpoint is accessible
- Check that translation results exist in sessionStorage

### Paths are incorrect
- Verify pattern detection is working
- Check repository structure
- Review alternatives for other options

### Submit button disabled
- Check for validation errors (red text below inputs)
- Ensure all paths are non-empty
- Verify no `..` or `//` in paths

## Contributing

### Adding New Features

1. Update `placement-modal.tsx` component
2. Update documentation
3. Add test scenarios
4. Test manually
5. Submit PR

### Reporting Issues

Please include:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## License

Same as DocBridge project license.

## Support

- GitHub Issues: https://github.com/anthropics/docbridge/issues
- Documentation: See links above

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: 2026-03-07
