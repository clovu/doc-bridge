# Path Selection Modal - Visual Guide

## Modal UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Select Translation Placement                              [×]  │
│  Review the AI-suggested placement for your translated files.  │
│  You can customize the path for each file if needed.           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  README.md                          [high confidence]     │ │
│  │                                                           │ │
│  │  Suggested path:                                          │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │ README.zh.md                                        │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  Following existing .zh.md suffix pattern                │ │
│  │                                                           │ │
│  │  [Show 3 alternatives ▼]                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  docs/guide.md                      [high confidence]     │ │
│  │                                                           │ │
│  │  Suggested path:                                          │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │ docs/guide.zh.md                                    │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  Following existing .zh.md suffix pattern                │ │
│  │                                                           │ │
│  │  [Show 2 alternatives ▼]                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  src/api/intro.md                   [high confidence]     │ │
│  │                                                           │ │
│  │  Suggested path:                                          │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │ src/api/intro.zh.md                                 │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  Following existing .zh.md suffix pattern                │ │
│  │                                                           │ │
│  │  [Show 3 alternatives ▼]                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                      [Back]  [Create Pull Request]│
└─────────────────────────────────────────────────────────────────┘
```

## Expanded Alternatives View

```
┌─────────────────────────────────────────────────────────────────┐
│  README.md                              [high confidence]       │
│                                                                 │
│  Suggested path:                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ README.zh.md                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Following existing .zh.md suffix pattern                      │
│                                                                 │
│  [Show 3 alternatives ▲]                                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ docs/zh/README.md                                       │   │ ← Alternative 1
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ i18n/zh/README.md                                       │   │ ← Alternative 2
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ zh/README.md                                            │   │ ← Alternative 3
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Validation Error State

```
┌─────────────────────────────────────────────────────────────────┐
│  README.md                              [high confidence]       │
│                                                                 │
│  Suggested path:                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │ ← Empty input
│  └─────────────────────────────────────────────────────────┘   │
│  ⚠️ Path cannot be empty                                        │ ← Error message
│  Following existing .zh.md suffix pattern                      │
└─────────────────────────────────────────────────────────────────┘

Footer:
[Back]  [Create Pull Request] ← Disabled (grayed out)
```

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Review Page                             │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │   Original      │  │   Translated    │                      │
│  │   Content       │  │   Content       │                      │
│  │                 │  │   (Editable)    │                      │
│  └─────────────────┘  └─────────────────┘                      │
│                                                                 │
│                          [Create Pull Request] ← Click          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    Fetch placement suggestions
                         from /api/placement
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PlacementModal Opens                         │
│                                                                 │
│  AI-recommended paths displayed                                 │
│  - README.md → README.zh.md                                     │
│  - docs/guide.md → docs/guide.zh.md                             │
│                                                                 │
│  User can:                                                      │
│  ✓ Review paths                                                 │
│  ✓ Edit paths directly                                          │
│  ✓ Select alternatives                                          │
│  ✓ See confidence levels                                        │
│                                                                 │
│                          [Create Pull Request] ← Click          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    Create PR with selected paths
                         via /api/pr
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PR Success Page                            │
│                                                                 │
│  ✅ Pull Request Created Successfully!                          │
│                                                                 │
│  PR #123: [DocBridge] Add zh translations                       │
│  https://github.com/owner/repo/pull/123                         │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
ReviewPage
├── State
│   ├── results: TranslationResult[]
│   ├── meta: TranslationMeta
│   ├── editedTranslations: Record<string, string>
│   ├── showPlacementModal: boolean
│   ├── placementSuggestions: PlacementSuggestion[]
│   ├── isCreatingPR: boolean
│   └── error: string | null
│
├── Functions
│   ├── handleSubmit()
│   │   ├── Save edited translations
│   │   ├── Fetch placement suggestions
│   │   └── Open modal
│   │
│   └── handlePlacementSubmit(selectedPaths)
│       ├── Create PR with selected paths
│       ├── Close modal
│       └── Navigate to success page
│
└── Components
    ├── TranslationEditor (x2)
    └── PlacementModal
        ├── Props
        │   ├── open
        │   ├── onOpenChange
        │   ├── suggestions
        │   ├── onSubmit
        │   └── isSubmitting
        │
        ├── State
        │   ├── selectedPaths
        │   ├── errors
        │   └── expandedAlternatives
        │
        └── Components
            ├── Dialog
            ├── DialogHeader
            ├── DialogContent
            │   └── For each suggestion:
            │       ├── Card
            │       ├── Badge (confidence)
            │       ├── Input (editable path)
            │       └── Alternatives (collapsible)
            └── DialogFooter
                ├── Button (Back)
                └── Button (Create PR)
```

## Data Flow

```
1. User clicks "Create Pull Request"
   ↓
2. ReviewPage.handleSubmit()
   ↓
3. POST /api/placement
   {
     owner: "owner",
     repo: "repo",
     files: [{ originalPath: "README.md" }],
     targetLocale: "zh"
   }
   ↓
4. API Response
   {
     suggestions: [
       {
         originalPath: "README.md",
         suggestion: {
           targetPath: "README.zh.md",
           reason: "Following existing .zh.md suffix pattern",
           confidence: "high",
           pattern: "root-suffix",
           alternatives: ["docs/zh/README.md", "i18n/zh/README.md"]
         }
       }
     ]
   }
   ↓
5. PlacementModal opens with suggestions
   ↓
6. User reviews/edits paths
   ↓
7. User clicks "Create Pull Request" in modal
   ↓
8. PlacementModal.handleSubmit()
   ↓
9. ReviewPage.handlePlacementSubmit(selectedPaths)
   {
     "README.md": "README.zh.md",
     "docs/guide.md": "docs/guide.zh.md"
   }
   ↓
10. POST /api/pr
    {
      owner: "owner",
      repo: "repo",
      defaultBranch: "main",
      targetLocale: "zh",
      files: [
        {
          originalPath: "README.md",
          translatedPath: "README.zh.md",
          content: "# 文档桥接\n\n..."
        }
      ]
    }
    ↓
11. PR Created → Navigate to success page
```

## Pattern Detection Examples

### Root-Suffix Pattern (Default)
```
Repository Structure:
├── README.md
├── README.zh.md ← Detected
├── docs/
│   ├── guide.md
│   └── guide.zh.md ← Detected

AI Recommendation:
CONTRIBUTING.md → CONTRIBUTING.zh.md
```

### i18n-Subdir Pattern
```
Repository Structure:
├── i18n/
│   ├── en/
│   │   └── README.md
│   └── zh/ ← Detected
│       └── README.md

AI Recommendation:
CONTRIBUTING.md → i18n/zh/CONTRIBUTING.md
```

### docs-Subdir Pattern
```
Repository Structure:
├── docs/
│   ├── en/
│   │   └── guide.md
│   └── zh/ ← Detected
│       └── guide.md

AI Recommendation:
README.md → docs/zh/README.md
```

### lang-Subdir Pattern
```
Repository Structure:
├── en/
│   └── README.md
└── zh/ ← Detected
    └── README.md

AI Recommendation:
CONTRIBUTING.md → zh/CONTRIBUTING.md
```

## Confidence Levels

```
┌─────────────────────────────────────────────────────────────┐
│  High Confidence (Green Badge)                              │
│  - Existing pattern detected in repository                  │
│  - Multiple examples of the pattern found                   │
│  - Pattern is consistent across files                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Medium Confidence (Gray Badge)                             │
│  - No clear pattern detected                                │
│  - Using default strategy                                   │
│  - Mixed patterns in repository                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Low Confidence (Outline Badge)                             │
│  - Ambiguous repository structure                           │
│  - Conflicting patterns detected                            │
│  - Manual review recommended                                │
└─────────────────────────────────────────────────────────────┘
```

## Keyboard Navigation

```
Tab Order:
1. First file's path input
2. First file's "Show alternatives" button
3. Second file's path input
4. Second file's "Show alternatives" button
5. ...
6. "Back" button
7. "Create Pull Request" button

Shortcuts:
- Escape: Close modal
- Enter (in input): Move to next input
- Enter (on button): Activate button
```

## Responsive Design

```
Desktop (> 768px):
┌─────────────────────────────────────────────────────────────┐
│  Modal: max-w-4xl (896px)                                   │
│  Height: max-h-[80vh]                                       │
│  Scrollable content area                                    │
└─────────────────────────────────────────────────────────────┘

Mobile (< 768px):
┌───────────────────────────────────┐
│  Modal: max-w-[calc(100%-2rem)]   │
│  Full height with padding         │
│  Touch-friendly buttons           │
└───────────────────────────────────┘
```
