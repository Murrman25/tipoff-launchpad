

# Component Preview Environment Setup Plan

## Overview

This plan creates a temporary Vite scaffold within the project so you can iterate on UI components using Lovable's live preview, then sync finished components back to your Next.js repository. The scaffold will be removable when you're done.

## What You'll Get

- A working live preview environment that matches your existing TipOff design system
- The ability to test and refine individual components (EventCard, HeatMap, PricingCard, etc.)
- A component gallery page to view and interact with all components
- Easy copy-paste workflow back to your Next.js repo

---

## Technical Implementation

### Phase 1: Create Core Vite Files

**1.1 Create `index.html`** (required for Vite)
```text
Location: /index.html
Purpose: Entry point for the Vite dev server
Content: Standard HTML5 template with React root div, Inter + JetBrains Mono fonts
```

**1.2 Create `vite.config.ts`**
```text
Location: /vite.config.ts
Purpose: Configure Vite build and path aliases
Key configs:
  - Path aliases: @/ -> src/, @lib/ -> lib/, @components/ -> components/
  - React plugin for JSX support
  - Port and preview settings
```

**1.3 Update `package.json`** (manual step - you'll need to do this)
```text
Add these scripts:
  "dev": "vite",
  "build:dev": "vite build --mode development",
  "preview": "vite preview"

Add these dependencies:
  "vite": "^5.4.0",
  "@vitejs/plugin-react-swc": "^3.7.0",
  "react-router-dom": "^6.26.0"
```

---

### Phase 2: Create Vite Entry Point

**2.1 Create `src/main.tsx`**
```text
Location: /src/main.tsx
Purpose: React application entry point
Content:
  - Import globals.css (your full design system)
  - Set up React Router for component gallery navigation
  - Wrap with PlanProvider for plan state
```

**2.2 Create `src/App.tsx`**
```text
Location: /src/App.tsx
Purpose: Root layout matching your Next.js layout
Content:
  - Ambient blobs background effect
  - Top navigation bar (simplified for sandbox)
  - Router outlet for pages
  - Toast provider wrapper
```

---

### Phase 3: Component Adapters

Since your Next.js components use `"use client"`, `next/link`, and `next/image`, I'll create thin adapter layers:

**3.1 Create `src/adapters/Link.tsx`**
```text
Wraps react-router-dom's Link to match next/link API
Used by: HeatMap, UpgradeCTA, FeatureLock, AppNav
```

**3.2 Create `src/adapters/Image.tsx`**
```text
Simple <img> wrapper matching next/image props subset
Used by: AppNav (logo)
```

**3.3 Copy and adapt key shared modules:**
- `lib/format.ts` - date/time formatting (no changes needed)
- `lib/status.ts` - status label helpers (no changes needed)
- `lib/types.ts` - TypeScript types (no changes needed)
- `lib/pricing.ts` - plan data (no changes needed)
- `lib/plan.tsx` - remove "use client" directive
- `src/lib/contracts.ts` - no changes needed

---

### Phase 4: Component Gallery

**4.1 Create `src/pages/ComponentGallery.tsx`**
```text
Purpose: Interactive showcase of all components
Sections:
  1. EventCard - with mock demo event data
  2. OddsBlock - spread and moneyline examples
  3. StatusBadge - pregame, live, final states
  4. PricingCard - all three tiers
  5. HeatMap - with sample metrics data
  6. FeatureLock/UpgradeCTA - locked state demos
  7. Buttons - primary, ghost, danger variants
  8. Form elements - inputs, selects, pills
```

**4.2 Create mock data helpers**
```text
Location: src/sandbox/mockData.ts
Purpose: Generate sample events, odds, and snapshots for testing
Uses existing patterns from src/lib/demo/demoData.ts
```

---

### Phase 5: Component Migration Checklist

For each component you want to work on, I'll:

| Next.js Component | Vite Adaptation |
|-------------------|-----------------|
| Remove `"use client"` | Not needed in Vite |
| `next/link` imports | Change to `@/adapters/Link` |
| `next/image` imports | Change to `@/adapters/Image` |
| `@/` path aliases | Keep as-is (vite.config handles) |
| `@/components/` | Keep as-is |
| `@/lib/` | Keep as-is |
| `@/src/` | Keep as-is |

---

### Phase 6: Folder Structure

```text
/                           <- Project root
├── index.html              <- NEW: Vite entry
├── vite.config.ts          <- NEW: Vite config
├── package.json            <- EDIT: Add scripts (manual)
├── src/
│   ├── main.tsx            <- NEW: React entry
│   ├── App.tsx             <- NEW: Root layout
│   ├── adapters/           <- NEW: Next.js shims
│   │   ├── Link.tsx
│   │   └── Image.tsx
│   ├── pages/              <- NEW: Sandbox pages
│   │   └── ComponentGallery.tsx
│   ├── sandbox/            <- NEW: Mock data
│   │   └── mockData.ts
│   └── components/         <- EXISTING: Your components
│       ├── EventCard.tsx   <- Will adapt
│       ├── HeatMap.tsx     <- Will adapt
│       └── ...
├── lib/                    <- EXISTING: Shared logic
├── components/             <- EXISTING: More components
└── app/
    └── globals.css         <- EXISTING: Full design system
```

---

## Workflow After Setup

1. **View components**: Open the preview to see the Component Gallery
2. **Edit a component**: Make changes to any component file
3. **See live updates**: Preview updates instantly
4. **Copy back**: When satisfied, the component code works in both environments (just add back `"use client"` and swap Link/Image imports)

---

## Cleanup (When Done)

Delete these files/folders to return to pure Next.js:
- `/index.html`
- `/vite.config.ts`
- `/src/main.tsx`
- `/src/App.tsx`
- `/src/adapters/`
- `/src/pages/`
- `/src/sandbox/`

And remove the Vite scripts/dependencies from `package.json`.

---

## Next Steps After Approval

1. I'll create all the scaffold files listed above
2. You'll need to manually update `package.json` with the required scripts and dependencies
3. The Component Gallery will be immediately available in the preview
4. You can tell me which specific component you want to work on first

