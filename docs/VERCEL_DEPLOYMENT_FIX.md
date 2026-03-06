# Vercel Deployment Fix

## Problem Summary

The application was failing on Vercel with the error:
```
TypeError: b is not a function
    at an (.next/server/chunks/ssr/_77fb7898._.js:3:3177)
```

This occurred because the i18n package was using dynamic filesystem operations (`globSync`, `import.meta.url`, `readFile`) at module initialization time, which failed in Vercel's serverless environment.

## Root Cause

The issue was in `packages/i18n/src/config.ts`:

```typescript
// ❌ BEFORE: Dynamic file loading
const result = globSync(join(localesPath, '*.json'))
const locales = Object.fromEntries(
  result.map(path => [basename(path, '.json'), () => loadLocaleCache(path)])
)
```

Problems:
- `globSync` runs at module load time, not runtime
- Path resolution using `import.meta.url` fails in bundled serverless functions
- Locale JSON files were not included in the Vercel deployment bundle
- When `globSync` returned empty array, `getMessageLoader()` returned `undefined`
- Calling `await loader()` threw `TypeError: b is not a function`

## Solution Implemented

Replaced dynamic file loading with static imports:

```typescript
// ✅ AFTER: Static imports
import en from '../locales/en.json'
import zh from '../locales/zh.json'

const locales = {
  en: () => Promise.resolve(en as Record<string, unknown>),
  zh: () => Promise.resolve(zh as Record<string, unknown>),
} as const
```

### Benefits

- **Reliable**: Works in all environments (local, Vercel, Docker, etc.)
- **Type-safe**: TypeScript can validate JSON imports
- **Bundler-friendly**: Next.js/Webpack can properly bundle locale files
- **No runtime dependencies**: Removed `glob` package dependency
- **Better error handling**: Added fallback logic in `getMessageLoader()`

## Changes Made

### 1. Updated `packages/i18n/src/config.ts`

- Removed: `node:path`, `node:url`, `node:fs/promises`, `glob` imports
- Added: Static JSON imports for `en.json` and `zh.json`
- Simplified: Removed `LocaleLoader` class and filesystem operations
- Improved: Added error handling with fallback to default locale

### 2. Updated `packages/i18n/package.json`

- Removed: `glob` dependency (no longer needed)

### 3. Verified Build

- ✅ Type-check passes: `pnpm type-check`
- ✅ Production build succeeds: `pnpm build`
- ✅ Production server starts: `pnpm start`
- ✅ Server responds correctly on port 3000

## Testing Checklist

Before deploying to Vercel:

- [x] Local build completes without errors
- [x] Production server runs without crashes
- [x] Type-checking passes
- [x] Dependencies updated (`pnpm install`)

After deploying to Vercel:

- [ ] Visit the deployed URL
- [ ] Check Vercel build logs for errors
- [ ] Test language switching (if applicable)
- [ ] Verify all pages load correctly

## Adding New Locales

To add a new locale (e.g., French):

1. Create `packages/i18n/locales/fr.json`
2. Add static import in `packages/i18n/src/config.ts`:
   ```typescript
   import fr from '../locales/fr.json'
   ```
3. Add to locales object:
   ```typescript
   const locales = {
     en: () => Promise.resolve(en as Record<string, unknown>),
     zh: () => Promise.resolve(zh as Record<string, unknown>),
     fr: () => Promise.resolve(fr as Record<string, unknown>),
   } as const
   ```

## Additional Recommendations

### 1. Node.js Version

Ensure Vercel uses the correct Node.js version. Add to `vercel.json`:

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "nodeVersion": "24.x"
}
```

Or set via Vercel dashboard: Settings → General → Node.js Version

### 2. Environment Variables

Verify these are set in Vercel dashboard:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`)

### 3. Build Settings

Recommended Vercel settings:

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install`
- **Output Directory**: (leave default)
- **Root Directory**: (leave default)

## Troubleshooting

### If deployment still fails:

1. **Check Vercel build logs** for specific errors
2. **Verify environment variables** are set correctly
3. **Check Node.js version** matches requirements (>=24.12.0)
4. **Test locally** with production build: `pnpm build && pnpm start`
5. **Clear Vercel cache**: Redeploy with "Clear cache and deploy"

### Common issues:

- **Missing environment variables**: Add them in Vercel dashboard
- **Node.js version mismatch**: Set `nodeVersion` in `vercel.json`
- **Monorepo detection**: Vercel should auto-detect pnpm workspace
- **Build timeout**: Increase timeout in Vercel settings if needed

## Related Documentation

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Monorepo Support](https://vercel.com/docs/monorepos)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)

## Commit Message

```
fix: replace dynamic locale loading with static imports for Vercel compatibility

- Replace globSync/readFile with static JSON imports in @docbridge/i18n
- Remove glob dependency from i18n package
- Add error handling with fallback to default locale
- Fixes "TypeError: b is not a function" on Vercel deployment

The previous implementation used filesystem operations at module load time,
which failed in Vercel's serverless environment. Static imports ensure
locale files are properly bundled and available at runtime.
```
