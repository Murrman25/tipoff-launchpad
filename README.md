# TipOff
Real-time sports line and game-state alerts - fully customizable, user-controlled.

TipOff is an informational monitoring tool for sports fans and bettors who already
understand odds. It continuously monitors games and markets so users can define
exact conditions and get notified the moment they occur. TipOff does not place bets,
does not recommend picks, and does not provide gambling advice.

## Core Value
- Monitor lines and game state in real time
- Define precise alert conditions (and ignore everything else)
- Receive low-latency in-app notifications

## Supported Sports (MVP)
- NFL, NBA, NHL, MLB, NCAAB, NCAAF

## Supported Markets (MVP)
- Moneyline (h2h)
- Spread
- Totals

Props and alternate lines are intentionally out of scope for the MVP.

## Navigation (Alerts-First)
- Games (dashboard)
- Alerts
- Notifications
- Settings
- Pricing / Upgrade

## Games Dashboard (Monitoring + Quick Alerts)
- Live and pregame game list with line snapshots (ML / spread / total)
- LIVE or Pregame badge with last-updated timestamp
- Filters: sport, date, live-only, search
- Row actions for quick alerts (e.g., one-click +100 even money alert)
- Click a game to scope alerts to that event

## Alerts
- Create, manage, and pause alerts
- Event-scoped alerts (when started from a game)
- Plan gating indicators

## Notifications
- Real-time, in-app notification feed
- No email summaries

## Settings
- Timezone
- Sports preferences
- Notification preferences
- Plan status (demo mode)
- Upgrade link (unless Legend plan)

## Alert System (MVP Highlights)
Alert types can be pregame, live, or both.

Line / odds conditions:
- Moneyline reaches a threshold (e.g., +100)
- Spread or total reaches a value
- Line moves by X points
- Moneyline moves by X cents
- Crosses key numbers (football)
- Movement within a defined time window

Score / game-state conditions (live):
- Team up/down by X points
- Team run (e.g., 6 points in 2 minutes)
- Lead changes hands
- Period/quarter/half filters
- Clock ranges (first/last X minutes)

Time windows:
- Pregame: T-24h to T-2h, T-2h to T-15m, T-15m to start, custom offsets
- Live: first/last X minutes, specific periods, clock ranges

Logic and frequency:
- Match ALL (AND) or ANY (OR) conditions
- Cooldown (default 2 minutes), deduplication
- Auto-rearm (Legend only)

Alert summaries are rendered as human-readable sentences, for example:
"Alert me when Lakers go down by 10+ in the first 10 minutes."

## Quick Alerts
Even Money (+100) alert:
- One-click from the Games page
- Choose side (home/away) and pregame vs live
- Fixed condition: moneyline reaches +100

## Plans (Demo Mode)
Plan is stored in localStorage for demo purposes.

Rookie (Free)
- 1 active alert per day
- Basic builder
- Live and pregame alerts
- In-app notifications

Pro ($20/month)
- 15 alerts per day
- Advanced builder
- Multi-condition alerts
- Runs and momentum alerts
- Templates
- Priority delivery indicator

Legend ($40/month)
- Unlimited alerts
- Priority delivery indicator
- Auto-rearm
- Unlimited templates
- Advanced configuration flags (UI only)

## Non-Goals
- Placing bets
- Pick recommendations
- ROI tracking
- Sportsbook affiliation
- Financial advice

## Compliance & Positioning
TipOff is an informational tool only. Users define their own conditions, and the
product does not encourage gambling. Clear disclaimers should be present in the UI.

## Tech Notes (High-Level)
- League-level polling every ~2-4 seconds (live)
- Pregame cadence increases near start time
- Event-level injury polling with strict RPM limits
- Real-time delivery via WebSockets, in-app notifications on diffs

## Development
Install dependencies and start the dev server:
```
npm install
npm run dev
```
Then open http://localhost:3000
