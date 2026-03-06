# PR Creation Fix

## Problem
Clicking "Create PR" button failed with "Failed to create PR" error when:
1. User had already forked the repository
2. Translation branch already existed from a previous PR

## Root Cause
The GitHub integration didn't handle existing resources:
- `forkRepo()` failed with 422 status when fork already existed
- `createBranch()` failed with 422 status when branch already existed
- Errors bubbled up without descriptive messages

## Solution (TDD Approach)

### 1. Fork Handling
**Test**: `packages/github/tests/fork-existing.test.ts`
- Returns existing fork when createFork fails with 422
- Throws error for non-422 failures

**Implementation**: `packages/github/src/fork.ts`
```typescript
try {
  const { data } = await octokit.rest.repos.createFork({ owner, repo })
  return { owner: data.owner.login, repo: data.name }
} catch (error: any) {
  if (error.status === 422) {
    // Fork exists, get it
    const { data: user } = await octokit.rest.users.getAuthenticated()
    const { data: existingFork } = await octokit.rest.repos.get({
      owner: user.login,
      repo,
    })
    return { owner: existingFork.owner.login, repo: existingFork.name }
  }
  throw error
}
```

### 2. Branch Handling
**Test**: `packages/github/tests/branch-existing.test.ts`
- Updates existing branch when createRef fails with 422
- Throws error for non-422 failures

**Implementation**: `packages/github/src/branch.ts`
```typescript
try {
  await octokit.rest.git.createRef({
    owner, repo, ref: `refs/heads/${branchName}`, sha,
  })
} catch (error: any) {
  if (error.status === 422) {
    // Branch exists, update it
    await octokit.rest.git.updateRef({
      owner, repo, ref: `heads/${branchName}`, sha, force: true,
    })
    return
  }
  throw error
}
```

### 3. Error Handling
**API Route**: `apps/web/src/app/api/pr/route.ts`
- Added try-catch block
- Returns descriptive error messages
- Logs errors to console

**Client**: `apps/web/src/app/repos/[owner]/[repo]/review/page.tsx`
- Parses error response from server
- Shows actual error message to user

## Test Results
All 280 tests pass:
- packages/core: 110 tests ✓
- packages/ai: 128 tests ✓
- packages/github: 42 tests ✓

## Behavior
Now when clicking "Create PR":
1. If fork exists → reuses it
2. If branch exists → updates it with new commits
3. Creates PR successfully
4. Shows descriptive errors if something fails
