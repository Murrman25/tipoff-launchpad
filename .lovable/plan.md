

# Home Page UI Redesign Plan

## Design Philosophy (Inspired by Attio)

Based on thorough analysis of attio.com, the redesign will embrace these key design principles:

### Attio Design Patterns Identified:
1. **Clean, Modern Typography** - Large, confident headlines with tight letter-spacing; serifless sans-serif fonts
2. **Numbered Section Markers** - `[01]`, `[02]`, `[03]` prefixes for major sections creating visual rhythm
3. **Interactive Product Previews** - Live UI mockups embedded within bento boxes showing actual product functionality
4. **Tabbed Feature Showcases** - Horizontal tabs (Data, Workflows, Reporting, Pipeline) that switch content
5. **Trust Signals** - Logo walls, customer testimonials, and social proof avatars
6. **Subtle Gradients & Glows** - Light backgrounds with soft shadows, not harsh contrasts
7. **Generous Whitespace** - Sections breathe with ample padding
8. **Dual CTAs** - Primary "Start for free" + secondary "Talk to sales" pattern
9. **Compact Stats Row** - Key metrics displayed in a single horizontal bar

---

## Implementation Overview

### 1. Updated Navigation Bar

**Current State:**
- Logo is oversized (260px height)
- Links: Home, Games, Alerts, Notifications, Settings, Pricing
- CTA: "Start free"

**New Design:**
- Reduce logo height to approximately 40px for a cleaner, more modern look
- Simplify navigation to match the README's core navigation:
  - **Games** (dashboard)
  - **Alerts**
  - **Notifications**
  - **Settings**
  - **Pricing**
- Remove "Home" as the logo serves this purpose
- Keep "Start free" CTA but add a subtle "Sign in" link

---

### 2. Hero Section Redesign

**New Structure:**
```text
+-----------------------------------------------------------+
|  [Kicker badge]  "Real-time sports intelligence"          |
|                                                           |
|     Line & game-state alerts,                             |
|     precision-tuned.                                      |
|                                                           |
|  [Subtitle - 1 line explaining the value proposition]     |
|                                                           |
|  [Start free] [View pricing]                              |
|                                                           |
|  +-- Stats Bar: Latency | Sports | Markets --------------+|
+-----------------------------------------------------------+
```

**Changes:**
- Centered hero text (following Attio's centered hero approach)
- Shorter, punchier headline
- Single-line subtitle
- Stats bar beneath CTAs as trust signals
- Remove the hero card (alert summary) from hero - move to bento section

---

### 3. Interactive Bento Grid (Feature Previews)

This is the core of the redesign. Each bento box will contain **inline CSS-styled mini UI mockups** that give users a "sneak peek" of the actual product.

**Bento Layout (12-column grid):**

```text
Row 1:
+------------------------ [01] Live Board (8 cols) ------------------------+-------- Quick Alerts (4 cols) --------+
| Inline mockup: 3-4 event rows with team names, scores, live badges,       | One-click +100 alert mockup          |
| spread/ML values                                                          | Home/Away pills, countdown            |
+---------------------------------------------------------------------------+---------------------------------------+

Row 2:
+-------- Alert Builder (5 cols) --------+-------------------- Notifications (4 cols) ---------------------+-- Plans (3 cols) --+
| Multi-condition builder mockup with    | Real-time feed mockup showing triggered alerts with timestamps   | Tier comparison    |
| conditions, logic selector, time       |                                                                   | Free/Pro/Elite     |
| window dropdown                        |                                                                   |                    |
+----------------------------------------+-------------------------------------------------------------------+--------------------+

Row 3:
+------------------ Steam & Movement Alerts (6 cols) ------------------+--------------- Key Number Alerts (6 cols) ---------------+
| Inline mockup showing steam detection, RLM indicator, movement       | Football key numbers visualization (3, 7, 10, 14)        |
| timeline visualization                                                | Proximity threshold UI                                   |
+----------------------------------------------------------------------+-----------------------------------------------------------+
```

**Bento Box Content Details:**

| Box | Title | Inline CSS Mockup Content |
|-----|-------|---------------------------|
| Live Board | "Track every line movement" | Event rows: teams, LIVE badge with clock, ML odds, spread values. Styled table-like layout. |
| Quick Alerts | "One-click +100 alerts" | Big +100 button, Home/Away toggle pills, Pregame/Live selector |
| Alert Builder | "Stack conditions with logic" | Condition cards (line, score), AND/OR toggle, time window selector |
| Notifications | "Real-time delivery" | Stacked notification cards with team names, alert type, timestamps |
| Plans | "Transparent gating" | Three-column comparison: Free (1/day), Pro (15/day), Elite (unlimited) |
| Steam & Movement | "Detect market signals" | Steam radar visualization, RLM indicator with arrow, sparkline |
| Key Numbers | "Football precision" | Key number grid (3, 7, 10, 14), proximity threshold slider |

---

### 4. Section Numbering & Headers

Following Attio's pattern of numbered sections:

- `[01] Live Monitoring` - Games dashboard section
- `[02] Alert System` - Alert builder and conditions
- `[03] Real-time Delivery` - Notifications and speed
- `[04] Plans & Pricing` - Plan comparison

Each section header will use the format:
```text
[01] section-kicker
// subheading descriptor

Main headline with
line breaks for impact.

Supporting paragraph text.
```

---

### 5. Trust & Speed Section

**New Section: Performance & Compliance**

```text
+-----------------------------------------------------------+
|  [04] Built for speed                                     |
|                                                           |
|  +------+  +------+  +------+  +------+                   |
|  | <5s  |  |  6   |  |  3   |  | 100% |                   |
|  |Latency| |Sports | |Markets | |Uptime|                   |
|  +------+  +------+  +------+  +------+                   |
|                                                           |
|  [ Compliance badges: No picks • No ROI claims • etc. ]   |
+-----------------------------------------------------------+
```

---

### 6. Final CTA Section

Simplified call-to-action:

```text
+-----------------------------------------------------------+
|  Start with Free. Upgrade when you need it.               |
|                                                           |
|  [Compare plans]  [Open live board]                       |
+-----------------------------------------------------------+
```

---

## Technical Implementation

### Files to Modify:

1. **`components/AppNav.tsx`**
   - Reduce logo size from 260px to 40px
   - Remove "Home" link (logo serves this purpose)
   - Add "Sign in" text link before CTA
   - Clean up nav styling for tighter spacing

2. **`app/page.tsx`** (Complete rewrite)
   - Implement centered hero with new copy
   - Create numbered section structure
   - Build bento grid with inline CSS mockups
   - Add stats bar and trust signals
   - Implement new CTA section

3. **`app/globals.css`** (Add new styles)
   - Add `.hero-centered` class for centered hero
   - Add `.section-number` for `[01]` markers
   - Add `.bento-preview` for inline mockup containers
   - Add `.stats-bar` for metrics display
   - Add `.trust-badges` for compliance pills

### New CSS Classes (to add to globals.css):

```css
/* Numbered section markers */
.section-number { ... }

/* Centered hero variant */
.hero-centered { ... }

/* Stats bar for metrics */
.stats-bar { ... }

/* Bento preview containers */
.bento-preview { ... }
.bento-event-row { ... }
.bento-condition-card { ... }
.bento-notification-item { ... }

/* Trust badges */
.trust-badges { ... }
```

---

## Content Updates (from README)

### Navigation Links:
- Games (dashboard)
- Alerts
- Notifications
- Settings
- Pricing

### Hero Copy:
- **Kicker:** "TipOff - alerts-first sports intelligence"
- **Headline:** "Line & game-state alerts, precision-tuned."
- **Subtitle:** "Monitor games and markets in real time. Define your conditions. Get notified the moment they happen."

### Stats Bar:
- Live latency: <5s
- Sports: NFL, NBA, MLB, NHL, NCAAB, NCAAF
- Markets: ML, Spread, Total

### Bento Titles (from README features):
- "Track live games and lines"
- "Build precise alert conditions"
- "Get notified instantly"
- "Quick alerts from the Games board"
- "Multi-condition logic with time windows"
- "Steam detection and movement tracking"

### Compliance Messaging:
- "No picks or betting advice"
- "No sportsbook affiliation"
- "Informational monitoring only"

---

## Visual Design Tokens

Using existing TipOff design tokens (from globals.css):

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | #5e6ad2 | Primary buttons, highlights |
| `--bg-1` | #050506 | Page background |
| `--surface` | rgba(255,255,255,0.05) | Cards, panels |
| `--border` | rgba(255,255,255,0.06) | Subtle borders |
| `--text` | #EDEDEF | Primary text |
| `--muted` | #8a8f98 | Secondary text |
| `--subtle` | rgba(255,255,255,0.6) | Tertiary text |

---

## Implementation Order

1. Update `AppNav.tsx` - logo size and link structure
2. Add new CSS classes to `globals.css`
3. Rewrite `app/page.tsx` with new structure:
   - Centered hero section
   - Numbered section headers
   - Bento grid with inline mockups
   - Stats and trust section
   - Final CTA

