import Link from "next/link";
import SpotlightCard from "@/components/SpotlightCard";

const sports = [
  { code: "NFL", name: "NFL Football" },
  { code: "NBA", name: "NBA Basketball" },
  { code: "NHL", name: "NHL Hockey" },
  { code: "MLB", name: "MLB Baseball" },
  { code: "NCAAB", name: "College Basketball" },
  { code: "NCAAF", name: "College Football" },
];

const markets = [
  { name: "Moneyline", description: "Win/lose odds (h2h)" },
  { name: "Spread", description: "Point differential bets" },
  { name: "Totals", description: "Over/under combined score" },
];

const alertTypes = [
  {
    category: "Line / Odds Conditions",
    examples: [
      "Moneyline reaches a threshold (e.g., +100)",
      "Spread or total reaches a value (e.g., +10.5)",
      "Line moves by X points in either direction",
      "Crosses key numbers (3, 7, 10, 14 in football)",
      "Movement within a defined time window",
    ],
  },
  {
    category: "Score / Game-State (Live)",
    examples: [
      "Team down by X points",
      "Team goes on a run (e.g., 6 pts in 2 min)",
      "Lead changes hands",
      "Only when ≤ X minutes left",
      "Period/quarter/half filters",
    ],
  },
  {
    category: "Time Windows",
    examples: [
      "Pregame: T-24h → T-2h, T-2h → T-15m, T-15m → start",
      "Live: First X minutes, Last X minutes",
      "Specific quarters/halves",
      "Custom time offsets",
    ],
  },
];

export default function Home() {
  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero-centered">
        <span className="hero-kicker">TipOff — Real-time sports alerts</span>
        <h1>
          Line &amp; game-state alerts,{" "}
          <span className="text-gradient-accent">fully customizable.</span>
        </h1>
        <p className="hero-subtitle" style={{ maxWidth: 640, margin: "0 auto" }}>
          Tell me when this exact thing happens — and don't bother me otherwise.
        </p>
        <p className="meta" style={{ maxWidth: 560, margin: "16px auto 0" }}>
          Monitor games and markets in real time. Define your exact conditions. Get notified the moment they happen.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-accent" href="/dashboard">
            Start free
          </Link>
          <Link className="btn btn-ghost" href="/pricing">
            View pricing
          </Link>
        </div>
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{"<"}5s</span>
            <span className="stat-label">Alert Latency</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">6</span>
            <span className="stat-label">Sports</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">3</span>
            <span className="stat-label">Markets</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">100%</span>
            <span className="stat-label">Uptime</span>
          </div>
        </div>
      </section>

      {/* What is TipOff */}
      <section className="section">
        <div className="section-header">
          <span className="section-number">[01] What is TipOff?</span>
          <h2>An informational monitoring tool for sports alerts.</h2>
          <p className="meta" style={{ maxWidth: 700 }}>
            TipOff is a real-time sports alerts platform that allows users to create highly customizable alerts based on betting line movement, live game state, and time-based conditions.
          </p>
        </div>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon">📊</div>
            <h3>Line Movement</h3>
            <p>Track moneyline, spread, and total changes across multiple sportsbooks in real time.</p>
          </div>
          <div className="info-card">
            <div className="info-icon">🎮</div>
            <h3>Live Game State</h3>
            <p>Monitor score differentials, runs, momentum shifts, and clock situations as games unfold.</p>
          </div>
          <div className="info-card">
            <div className="info-icon">⏰</div>
            <h3>Time-Based Conditions</h3>
            <p>Set alerts for specific pregame windows, live periods, or custom time offsets.</p>
          </div>
        </div>
        <div className="value-prop-box">
          <div className="value-prop-label">Core Value Proposition</div>
          <p>
            Most users can see odds and scores, but they can't monitor them continuously or customize alerts beyond basic thresholds.
          </p>
          <p style={{ marginTop: 12 }}>
            <strong>TipOff solves this by:</strong>
          </p>
          <ul className="value-list">
            <li>Continuously monitoring games and lines in real time</li>
            <li>Letting users define exact conditions they care about</li>
            <li>Delivering alerts instantly when those conditions occur</li>
          </ul>
        </div>
      </section>

      {/* Supported Sports & Markets */}
      <section className="section">
        <div className="section-header">
          <span className="section-number">[02] Coverage</span>
          <h2>6 major sports. 3 core markets.</h2>
          <p className="meta">
            Comprehensive coverage of North American professional and college sports.
          </p>
        </div>
        <div className="coverage-grid">
          <div className="coverage-block">
            <h3>Supported Sports</h3>
            <div className="sports-grid">
              {sports.map((sport) => (
                <div key={sport.code} className="sport-chip">
                  <span className="sport-code">{sport.code}</span>
                  <span className="sport-name">{sport.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="coverage-block">
            <h3>Markets (MVP)</h3>
            <div className="markets-list">
              {markets.map((market) => (
                <div key={market.name} className="market-item">
                  <span className="market-name">{market.name}</span>
                  <span className="market-desc">{market.description}</span>
                </div>
              ))}
            </div>
            <p className="meta" style={{ marginTop: 16, fontSize: 12 }}>
              Props and alternate lines are out of scope for MVP.
            </p>
          </div>
        </div>
      </section>

      {/* Alert System */}
      <section className="section">
        <div className="section-header">
          <span className="section-number">[03] Alert System</span>
          <h2>Build precise alert conditions with multi-logic stacking.</h2>
          <p className="meta">
            Stack conditions with AND/OR logic, time windows, and cooldown periods.
          </p>
        </div>
        <div className="bento-grid">
          {/* Alert Builder Preview */}
          <SpotlightCard
            className="bento-card"
            style={{
              gridColumn: "span 7",
              borderRadius: 22,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(94, 106, 210, 0.1))",
              boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.06), 0 20px 60px rgba(0, 0, 0, 0.45)",
              padding: 22
            }}
          >
            <div className="bento-kicker">Alert Builder</div>
            <h3>Human-readable alert summaries</h3>
            <div className="bento-preview">
              <div className="alert-summary-example">
                <span className="alert-summary-icon">🔔</span>
                <span>"Alert me when <strong>Lakers go down by 10+</strong> in the <strong>first 10 minutes</strong>."</span>
              </div>
              <div className="alert-summary-example">
                <span className="alert-summary-icon">🔔</span>
                <span>"Alert me when <strong>spread moves by 6.5+ points</strong> at <strong>any time</strong>."</span>
              </div>
              <div className="alert-summary-example">
                <span className="alert-summary-icon">🔔</span>
                <span>"Alert me when <strong>moneyline hits +100</strong> for <strong>home team</strong>."</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                <div className="bento-logic-toggle">
                  <button className="bento-logic-btn active">AND</button>
                  <button className="bento-logic-btn">OR</button>
                </div>
              </div>
            </div>
          </SpotlightCard>

          {/* Quick Alerts */}
          <SpotlightCard
            className="bento-card"
            style={{
              gridColumn: "span 5",
              borderRadius: 18,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "linear-gradient(160deg, rgba(249, 115, 22, 0.12), rgba(255, 255, 255, 0.03))",
              boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.06), 0 18px 50px rgba(0, 0, 0, 0.4)",
              padding: 20
            }}
          >
            <div className="bento-kicker">Quick Alerts</div>
            <h3>Even Money (+100) Alert</h3>
            <p className="meta" style={{ marginBottom: 16 }}>
              One-click alert from the Games page. Select side and timing.
            </p>
            <div className="bento-preview">
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                marginBottom: 16 
              }}>
                <div style={{
                  fontSize: 32,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent-orange)",
                  padding: "16px 32px",
                  borderRadius: 12,
                  background: "rgba(249, 115, 22, 0.15)",
                  border: "2px solid var(--accent-orange)"
                }}>+100</div>
              </div>
              <div className="bento-chip-row" style={{ justifyContent: "center" }}>
                <span className="pill active">Home</span>
                <span className="pill">Away</span>
              </div>
              <div className="bento-chip-row" style={{ justifyContent: "center" }}>
                <span className="pill active">Pregame</span>
                <span className="pill">Live</span>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* Alert Types Detail */}
      <section className="section">
        <div className="section-header">
          <span className="section-number">[04] Supported Conditions</span>
          <h2>Define exactly what you want to track.</h2>
          <p className="meta">
            Alerts can be pregame, live, or both. Stack multiple conditions for precision.
          </p>
        </div>
        <div className="alert-types-grid">
          {alertTypes.map((type) => (
            <div key={type.category} className="alert-type-card">
              <h3>{type.category}</h3>
              <ul>
                {type.examples.map((example, i) => (
                  <li key={i}>{example}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="frequency-box">
          <h4>Frequency Controls</h4>
          <div className="frequency-items">
            <div className="frequency-item">
              <span className="frequency-label">Cooldown</span>
              <span className="frequency-value">Default 2 minutes</span>
            </div>
            <div className="frequency-item">
              <span className="frequency-label">Deduplication</span>
              <span className="frequency-value">Automatic</span>
            </div>
            <div className="frequency-item">
              <span className="frequency-label">Auto-rearm</span>
              <span className="frequency-value">Legend only</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section">
        <div className="section-header">
          <span className="section-number">[05] Plans</span>
          <h2>Transparent pricing. Start free.</h2>
          <p className="meta">
            Upgrade when you need more alerts, advanced conditions, or priority delivery.
          </p>
        </div>
        <div className="pricing-preview-grid">
          <div className="pricing-preview-card">
            <div className="pricing-tier-name">Rookie</div>
            <div className="pricing-tier-price">Free</div>
            <ul>
              <li>1 active alert per day</li>
              <li>Basic alert builder</li>
              <li>Live & pregame alerts</li>
              <li>In-app notifications</li>
            </ul>
          </div>
          <div className="pricing-preview-card featured">
            <div className="pricing-badge">Most Popular</div>
            <div className="pricing-tier-name">Pro</div>
            <div className="pricing-tier-price">$20<span>/mo</span></div>
            <ul>
              <li>15 alerts per day</li>
              <li>Advanced alert builder</li>
              <li>Multi-condition alerts</li>
              <li>Runs & momentum alerts</li>
              <li>Alert templates</li>
              <li>Faster delivery priority</li>
            </ul>
          </div>
          <div className="pricing-preview-card">
            <div className="pricing-tier-name">Legend</div>
            <div className="pricing-tier-price">$40<span>/mo</span></div>
            <ul>
              <li>Unlimited alerts</li>
              <li>Priority delivery</li>
              <li>Auto-rearm</li>
              <li>Unlimited templates</li>
              <li>Advanced configurations</li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link className="btn btn-ghost" href="/pricing">
            View full comparison →
          </Link>
        </div>
      </section>

      {/* User Experience */}
      <section className="section">
        <div className="section-header">
          <span className="section-number">[06] User Experience</span>
          <h2>Alerts-first navigation.</h2>
          <p className="meta">
            No betting, picks, or ROI sections. Just the tools you need.
          </p>
        </div>
        <div className="nav-preview">
          <div className="nav-preview-item">
            <span className="nav-preview-icon">📋</span>
            <div>
              <strong>Games (Dashboard)</strong>
              <p>Monitoring + quick alert creation. Filter by sport, date, live status.</p>
            </div>
          </div>
          <div className="nav-preview-item">
            <span className="nav-preview-icon">🔔</span>
            <div>
              <strong>Alerts</strong>
              <p>Create, manage, and review alerts. See plan gating indicators.</p>
            </div>
          </div>
          <div className="nav-preview-item">
            <span className="nav-preview-icon">📬</span>
            <div>
              <strong>Notifications</strong>
              <p>In-app notification feed with real-time updates.</p>
            </div>
          </div>
          <div className="nav-preview-item">
            <span className="nav-preview-icon">⚙️</span>
            <div>
              <strong>Settings</strong>
              <p>Timezone, sports preferences, notification settings, plan status.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Performance & Compliance */}
      <section className="section-centered">
        <span className="section-number">[07] Built for Speed & Trust</span>
        <h2>Real-time performance you can rely on.</h2>
        <p className="meta">
          Sub-5-second latency across all markets. No gambling advice. No sportsbook affiliation.
        </p>
        <div className="performance-grid" style={{ marginTop: 32 }}>
          <div className="performance-stat">
            <div className="performance-value">{"<"}5s</div>
            <div className="performance-label">Alert Latency</div>
          </div>
          <div className="performance-stat">
            <div className="performance-value">2-4s</div>
            <div className="performance-label">Live Polling</div>
          </div>
          <div className="performance-stat">
            <div className="performance-value">WebSocket</div>
            <div className="performance-label">Delivery</div>
          </div>
          <div className="performance-stat">
            <div className="performance-value">100%</div>
            <div className="performance-label">Uptime SLA</div>
          </div>
        </div>
        <div className="trust-badges">
          <span className="trust-badge">
            <span className="trust-badge-icon">✓</span>
            No picks or betting advice
          </span>
          <span className="trust-badge">
            <span className="trust-badge-icon">✓</span>
            No sportsbook affiliation
          </span>
          <span className="trust-badge">
            <span className="trust-badge-icon">✓</span>
            Informational monitoring only
          </span>
          <span className="trust-badge">
            <span className="trust-badge-icon">✓</span>
            User-defined conditions
          </span>
        </div>
      </section>

      {/* Target Users */}
      <section className="section">
        <div className="section-header">
          <span className="section-number">[08] Who It's For</span>
          <h2>Built for users who want control.</h2>
        </div>
        <div className="user-grid">
          <div className="user-card primary">
            <div className="user-card-label">Primary Users</div>
            <ul>
              <li>Sports fans and bettors who already understand odds</li>
              <li>Users who want timing-based, context-aware alerts</li>
            </ul>
          </div>
          <div className="user-card">
            <div className="user-card-label">Secondary Users</div>
            <ul>
              <li>Content creators</li>
              <li>Analysts</li>
              <li>Casual users who want simple alerts (e.g., "even money")</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Compliance Disclaimer */}
      <section className="disclaimer-section">
        <div className="disclaimer-box">
          <h4>Compliance & Positioning</h4>
          <ul>
            <li><strong>Informational tool only</strong> — TipOff does not place bets, recommend picks, or provide gambling advice.</li>
            <li><strong>User-defined conditions</strong> — You control what you want to be alerted about.</li>
            <li><strong>No encouragement to gamble</strong> — We provide data, not advice.</li>
            <li><strong>No ROI tracking</strong> — We do not track or display betting performance.</li>
          </ul>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section cta">
        <div>
          <h2>Start with Rookie. Upgrade when you need it.</h2>
          <p className="meta">
            Build alerts for free, then unlock advanced logic, faster delivery, and auto-rearm when you're ready.
          </p>
        </div>
        <div className="cta-actions">
          <Link className="btn btn-primary" href="/pricing">
            Compare plans
          </Link>
          <Link className="btn btn-ghost" href="/dashboard">
            Open live board
          </Link>
        </div>
      </section>
    </div>
  );
}
