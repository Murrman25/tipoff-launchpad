
# Fix Hybrid Setup: Next.js + Vite Working Side by Side

## Overview
Your project has a hybrid architecture with **Next.js** for production and **Vite** for component development. The current build is failing due to conflicting path aliases and Next.js-specific imports in files that Vite processes.

## Root Cause Analysis

### Problem 1: Path Alias Conflicts
The project has **two different path alias configurations** that conflict:

| Alias | Next.js (`tsconfig.json`) | Vite (`vite.config.ts`) |
|-------|---------------------------|-------------------------|
| `@/*` | Maps to `./` (root) | Maps to `./src/` |

When `components/DevPlanSwitcher.tsx` imports `@/lib/pricing`, Next.js resolves it to `./lib/pricing.ts` (correct), but the path configuration causes confusion during builds.

### Problem 2: Next.js Imports in Shared Files
Several files used by both environments import Next.js-specific modules that don't exist in Vite:
- `src/lib/plan.tsx` → imports `next/link`
- `src/components/QuickActions.tsx` → imports `next/link`
- `src/components/HeatMap.tsx` → imports `next/link`
- `src/components/SteamRadar.tsx` → imports `next/link`

### Problem 3: Missing Vite TypeScript Configuration
The Vite build doesn't properly reference `tsconfig.vite.json`, causing path resolution issues.

---

## Implementation Plan

### Step 1: Fix src/lib/plan.tsx to Use Adapter Pattern
Replace `next/link` import with the existing adapter shim that works in both environments.

**File:** `src/lib/plan.tsx`
- Change `import Link from "next/link"` to `import Link from "../adapters/Link"`
- This uses the existing adapter at `src/adapters/Link.tsx` which wraps `react-router-dom` for Vite

### Step 2: Fix Other Components with Next.js Imports
Apply the same adapter pattern to other affected files:

**Files to update:**
- `src/components/QuickActions.tsx` → use `../adapters/Link`
- `src/components/HeatMap.tsx` → use `../adapters/Link`
- `src/components/SteamRadar.tsx` → use `../adapters/Link`

### Step 3: Update Vite Configuration for Proper ESM Handling
Ensure the `lovable-tagger` is only loaded in development mode properly and add explicit ESM configuration.

**File:** `vite.config.ts`
- Add `optimizeDeps.include` for `lovable-tagger` to prevent ESM issues
- Ensure proper build configuration

### Step 4: Fix DevPlanSwitcher Import Paths for Next.js
The `components/DevPlanSwitcher.tsx` (used by Next.js) uses `@/lib/pricing` and `@/lib/plan` which should resolve correctly in Next.js, but we should verify the imports are consistent.

**File:** `components/DevPlanSwitcher.tsx`
- Keep using `@/lib/pricing` (resolves to `./lib/pricing.ts` in Next.js)
- Keep using `@/lib/plan` (resolves to `./lib/plan.tsx` in Next.js)

### Step 5: Update tsconfig.json for Clearer Path Resolution
Ensure the paths are explicit and don't conflict.

**File:** `tsconfig.json`
- Add explicit path for `@lib/*` and `@components/*` to match Vite aliases

---

## Technical Details

### File Changes Summary

| File | Change |
|------|--------|
| `src/lib/plan.tsx` | Replace `next/link` with adapter |
| `src/components/QuickActions.tsx` | Replace `next/link` with adapter |
| `src/components/HeatMap.tsx` | Replace `next/link` with adapter |
| `src/components/SteamRadar.tsx` | Replace `next/link` with adapter |
| `vite.config.ts` | Add ESM optimization for lovable-tagger |
| `tsconfig.json` | Add `@lib/*` and `@components/*` paths |

### Architecture After Fix

```text
┌─────────────────────────────────────────────────────────────┐
│                     Hybrid Setup                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐      ┌─────────────────────────┐  │
│  │     NEXT.JS         │      │        VITE             │  │
│  │  (Production)       │      │  (Component Sandbox)    │  │
│  │                     │      │                         │  │
│  │  app/               │      │  src/                   │  │
│  │  components/        │      │    pages/               │  │
│  │  lib/               │      │    components/          │  │
│  │                     │      │    adapters/            │  │
│  │  Uses: next/link    │      │  Uses: adapters/Link    │  │
│  │        next/image   │      │        adapters/Image   │  │
│  └─────────────────────┘      └─────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              SHARED (lib/)                          │   │
│  │  - pricing.ts    (plan tiers, features)             │   │
│  │  - plan.tsx      (PlanProvider for Next.js)         │   │
│  │  - types.ts      (shared TypeScript types)          │   │
│  │  - format.ts     (formatting utilities)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Expected Outcome
- **Vite dev server** (`npm run dev`) works for component development
- **Next.js build** (`npm run build`) works for production
- Both share the same styling (`app/globals.css`) and utility libraries
- Path aliases resolve correctly in both environments
