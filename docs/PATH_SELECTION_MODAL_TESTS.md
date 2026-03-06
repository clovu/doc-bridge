# Path Selection Modal - Test Scenarios

## Test Coverage

This document outlines comprehensive test scenarios for the Path Selection Modal feature.

## Unit Tests - PlacementModal Component

### Rendering Tests

#### ✓ Test: Renders modal with title and description
- **Given**: Modal is open with suggestions
- **When**: Component renders
- **Then**: Title "Select Translation Placement" is visible
- **And**: Description text is visible

#### ✓ Test: Displays all files with their suggested paths
- **Given**: Modal has 2 file suggestions
- **When**: Component renders
- **Then**: Both original file paths are visible
- **And**: Both suggested paths are visible in input fields

#### ✓ Test: Shows confidence badges for each suggestion
- **Given**: Modal has suggestions with confidence levels
- **When**: Component renders
- **Then**: Confidence badges are displayed for each file
- **And**: Badge variant matches confidence level (high/medium/low)

### Default Selection Tests

#### ✓ Test: Initializes with AI-recommended paths selected
- **Given**: Modal receives suggestions with targetPath
- **When**: Component initializes
- **Then**: Input fields contain AI-recommended paths
- **And**: selectedPaths state matches suggestions

#### ✓ Test: Uses root-suffix pattern by default
- **Given**: Repository has no existing pattern
- **When**: AI generates suggestions
- **Then**: Paths follow `{filename}.{locale}.md` format
- **Example**: `README.md` → `README.zh.md`

#### ✓ Test: Follows detected pattern when repository has existing structure
- **Given**: Repository has i18n-subdir pattern
- **When**: AI generates suggestions
- **Then**: Paths follow `i18n/{locale}/{filename}.md` format
- **Example**: `README.md` → `i18n/zh/README.md`

### User Interaction Tests

#### ✓ Test: Allows user to edit suggested path directly
- **Given**: Modal is open with default paths
- **When**: User types in path input field
- **Then**: Input value updates
- **And**: selectedPaths state updates

#### ✓ Test: Shows alternatives when clicking "Show alternatives"
- **Given**: Suggestion has 3 alternatives
- **When**: User clicks "Show 3 alternatives"
- **Then**: Alternative paths become visible
- **And**: Each alternative is clickable

#### ✓ Test: Allows selecting alternative path
- **Given**: Alternatives are expanded
- **When**: User clicks an alternative path
- **Then**: Input field updates to selected alternative
- **And**: selectedPaths state updates

### Validation Tests

#### ✓ Test: Validates path on change - rejects empty path
- **Given**: User clears path input
- **When**: Input becomes empty
- **Then**: Error message "Path cannot be empty" appears
- **And**: Submit button is disabled

#### ✓ Test: Validates path on change - rejects path traversal
- **Given**: User enters path with `..`
- **When**: Input value is `../../../etc/passwd`
- **Then**: Error message "Invalid path" appears
- **And**: Submit button is disabled

#### ✓ Test: Validates path on change - rejects double slashes
- **Given**: User enters path with `//`
- **When**: Input value is `docs//guide.md`
- **Then**: Error message "Invalid path" appears
- **And**: Submit button is disabled

### Multi-File Tests

#### ✓ Test: Handles multiple files independently
- **Given**: Modal has 3 file suggestions
- **When**: User edits path for file 1
- **Then**: Only file 1's path changes
- **And**: Other files' paths remain unchanged

#### ✓ Test: Preserves user edits when switching between files
- **Given**: User edits path for file 1
- **When**: User expands alternatives for file 2
- **Then**: File 1's edited path is preserved
- **And**: File 2's alternatives are shown

### Multi-Language Tests

#### ✓ Test: Generates correct paths for different locales
- **Given**: Target locale is `zh`
- **Then**: Paths use `.zh.md` suffix
- **Given**: Target locale is `ja`
- **Then**: Paths use `.ja.md` suffix
- **Given**: Target locale is `fr`
- **Then**: Paths use `.fr.md` suffix

#### ✓ Test: Handles locale codes with region
- **Given**: Target locale is `zh-CN`
- **Then**: Paths use `.zh-CN.md` suffix
- **Given**: Target locale is `pt-BR`
- **Then**: Paths use `.pt-BR.md` suffix

### Submit Tests

#### ✓ Test: Calls onSubmit with selected paths
- **Given**: User has reviewed paths
- **When**: User clicks "Create Pull Request"
- **Then**: onSubmit is called with selectedPaths object
- **And**: Object keys are original paths
- **And**: Object values are selected target paths

#### ✓ Test: Disables submit button while submitting
- **Given**: isSubmitting prop is true
- **When**: Component renders
- **Then**: Submit button shows "Creating PR..."
- **And**: Submit button is disabled

#### ✓ Test: Disables submit button when validation errors exist
- **Given**: One file has empty path
- **When**: Component renders
- **Then**: Submit button is disabled
- **And**: Error message is visible

## Integration Tests - Review Page

### Modal Trigger Tests

#### ✓ Test: Shows placement modal when clicking "Create PR"
- **Given**: User is on review page
- **When**: User clicks "Create Pull Request" button
- **Then**: Placement modal opens
- **And**: Modal displays file suggestions

#### ✓ Test: Fetches placement suggestions from API
- **Given**: User clicks "Create Pull Request"
- **When**: API call is made
- **Then**: POST request to `/api/placement` is sent
- **And**: Request includes owner, repo, files, targetLocale

#### ✓ Test: Passes translation results to modal
- **Given**: User has 2 translated files
- **When**: Modal opens
- **Then**: Modal receives 2 suggestions
- **And**: Each suggestion has originalPath and targetPath

### PR Creation Tests

#### ✓ Test: Submits PR with user-selected paths
- **Given**: User selects custom paths in modal
- **When**: User clicks "Create Pull Request" in modal
- **Then**: POST request to `/api/pr` is sent
- **And**: Request includes selected translatedPath for each file

#### ✓ Test: Navigates to PR success page after creation
- **Given**: PR creation succeeds
- **When**: API returns PR data
- **Then**: User is redirected to `/repos/{owner}/{repo}/pr`
- **And**: PR data is stored in sessionStorage

#### ✓ Test: Handles API errors gracefully
- **Given**: Placement API fails
- **When**: Error occurs
- **Then**: Error message is displayed
- **And**: Modal does not open
- **Given**: PR API fails
- **When**: Error occurs during PR creation
- **Then**: Error message is displayed in modal
- **And**: User can retry

## Edge Cases

### ✓ Test: Empty suggestions array
- **Given**: No files to translate
- **When**: Modal opens
- **Then**: Modal shows empty state
- **Or**: Modal doesn't open

### ✓ Test: Single file translation
- **Given**: Only 1 file to translate
- **When**: Modal opens
- **Then**: Single file card is displayed
- **And**: All features work correctly

### ✓ Test: Very long file paths
- **Given**: File path is > 100 characters
- **When**: Modal displays path
- **Then**: Path is displayed with proper wrapping
- **And**: Input field is scrollable

### ✓ Test: Special characters in file names
- **Given**: File name contains spaces, dashes, underscores
- **When**: Path is generated
- **Then**: Special characters are preserved
- **And**: Path is valid

### ✓ Test: Deeply nested files
- **Given**: File is at `docs/api/v2/guides/advanced/setup.md`
- **When**: Path is generated
- **Then**: Directory structure is preserved
- **And**: Locale is inserted correctly

## Pattern Detection Tests

### ✓ Test: Detects i18n-subdir pattern
- **Given**: Repository has `i18n/en/`, `i18n/zh/` directories
- **When**: Pattern detection runs
- **Then**: Pattern type is `i18n-subdir`
- **And**: Suggestions use `i18n/{locale}/` structure

### ✓ Test: Detects docs-subdir pattern
- **Given**: Repository has `docs/en/`, `docs/zh/` directories
- **When**: Pattern detection runs
- **Then**: Pattern type is `docs-subdir`
- **And**: Suggestions use `docs/{locale}/` structure

### ✓ Test: Detects lang-subdir pattern
- **Given**: Repository has `en/`, `zh/` root directories
- **When**: Pattern detection runs
- **Then**: Pattern type is `lang-subdir`
- **And**: Suggestions use `{locale}/` structure

### ✓ Test: Detects root-suffix pattern
- **Given**: Repository has `README.en.md`, `README.zh.md` files
- **When**: Pattern detection runs
- **Then**: Pattern type is `root-suffix`
- **And**: Suggestions use `.{locale}.md` suffix

### ✓ Test: Falls back to default when no pattern detected
- **Given**: Repository has no clear pattern
- **When**: Pattern detection runs
- **Then**: Pattern type is `none`
- **And**: Default strategy is used (root-suffix for root files, docs-subdir for nested)

## Accessibility Tests

### ✓ Test: Keyboard navigation works
- **Given**: Modal is open
- **When**: User presses Tab
- **Then**: Focus moves through interactive elements
- **When**: User presses Escape
- **Then**: Modal closes

### ✓ Test: Screen reader announces modal
- **Given**: Modal opens
- **When**: Screen reader is active
- **Then**: Modal title is announced
- **And**: Description is announced

### ✓ Test: Focus management
- **Given**: Modal opens
- **When**: Modal renders
- **Then**: Focus moves to first interactive element
- **When**: Modal closes
- **Then**: Focus returns to trigger button

## Performance Tests

### ✓ Test: Handles large number of files
- **Given**: 50 files to translate
- **When**: Modal opens
- **Then**: Modal renders within 1 second
- **And**: Scrolling is smooth

### ✓ Test: Path validation doesn't block UI
- **Given**: User types quickly in path input
- **When**: Validation runs
- **Then**: UI remains responsive
- **And**: No input lag

## Test Implementation Status

- **Unit Tests**: Not yet implemented (web app lacks test setup)
- **Integration Tests**: Not yet implemented
- **Manual Testing**: Required before production

## Running Tests

Once test infrastructure is set up:

```bash
# Run all tests
pnpm --filter @docbridge/web test

# Run specific test file
pnpm --filter @docbridge/web test placement-modal

# Run with coverage
pnpm --filter @docbridge/web test --coverage
```

## Test Dependencies Needed

To implement these tests, add to `apps/web/package.json`:

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@vitest/ui": "^1.0.0",
    "jsdom": "^23.0.0",
    "vitest": "^1.0.0"
  }
}
```
