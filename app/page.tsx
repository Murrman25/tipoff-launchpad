import Link from "next/link";
import SpotlightCard from "@/components/SpotlightCard";

export default function Home() {
  return (
    <div className="landing">
      {/* Hero Section - Centered */}
      <section className="hero-centered">
        <span className="hero-kicker">TipOff — alerts-first sports intelligence</span>
        <h1>
          Line &amp; game-state alerts,{" "}
          <span className="text-gradient-accent">precision-tuned.</span>
        </h1>
        <p className="hero-subtitle">
          Monitor games and markets in real time. Define your conditions. Get notified the moment they happen.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/dashboard">
            Start free
          </Link>
          <Link className="btn btn-ghost" href="/pricing">
            View pricing
          </Link>
        </div>
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{"<"}5s</span>
            <span className="stat-label">Latency</span>
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

      {/* [01] Live Monitoring Section */}
      <section className="section">
        <div className="section-header">
          <span className="section-number">[01] Live Monitoring</span>
          <h2>Track every line movement the moment it happens.</h2>
          <p className="meta">
            Real-time updates across NFL, NBA, MLB, NHL, NCAAB, and NCAAF with ML, Spread, and Total markets.
          </p>
        </div>
        <div className="bento-grid">
          {/* Live Board - Large Card */}
          <SpotlightCard
            className="bento-card"
            style={{
              gridColumn: "span 8",
              borderRadius: 20,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))",
              boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.06), 0 20px 60px rgba(0, 0, 0, 0.45)",
              padding: 24
            }}
          >
            <div className="bento-kicker">Games Dashboard</div>
            <h3>Live board with real-time odds</h3>
            <div className="bento-preview">
              {/* Inline Event Rows */}
              <div className="bento-event-row">
                <div className="bento-event-teams">
                  <span className="bento-event-team">DAL Mavericks</span>
                  <span className="bento-event-team" style={{ color: "var(--muted)" }}>@ PHI 76ers</span>
                </div>
                <span className="badge badge-live">LIVE Q3 7:42</span>
                <div className="bento-event-odds">
                  <span className="bento-odds-cell">+115</span>
                  <span className="bento-odds-cell">-4.5</span>
                </div>
              </div>
              <div className="bento-event-row">
                <div className="bento-event-teams">
                  <span className="bento-event-team">BOS Celtics</span>
                  <span className="bento-event-team" style={{ color: "var(--muted)" }}>@ NYK Knicks</span>
                </div>
                <span className="badge badge-live">LIVE Q1 2:18</span>
                <div className="bento-event-odds">
                  <span className="bento-odds-cell">-145</span>
                  <span className="bento-odds-cell">-6.5</span>
                </div>
              </div>
              <div className="bento-event-row">
                <div className="bento-event-teams">
                  <span className="bento-event-team">SF 49ers</span>
                  <span className="bento-event-team" style={{ color: "var(--muted)" }}>@ SEA Seahawks</span>
                </div>
                <span className="badge badge-pregame">PREGAME</span>
                <div className="bento-event-odds">
                  <span className="bento-odds-cell">-130</span>
                  <span className="bento-odds-cell">-3.0</span>
                </div>
              </div>
            </div>
          </SpotlightCard>

          {/* Quick Alerts */}
          <SpotlightCard
            className="bento-card"
            style={{
              gridColumn: "span 4",
              borderRadius: 18,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "linear-gradient(160deg, rgba(94, 106, 210, 0.18), rgba(255, 255, 255, 0.03))",
              boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.06), 0 18px 50px rgba(0, 0, 0, 0.4)",
              padding: 20
            }}
          >
            <div className="bento-kicker">Quick Actions</div>
            <h3>One-click +100 alerts</h3>
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
                  color: "var(--accent)",
                  padding: "16px 32px",
                  borderRadius: 12,
                  background: "rgba(94, 106, 210, 0.2)",
                  border: "2px solid var(--accent)"
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

      {/* [02] Alert System Section */}
      <section className="section">
        <div className="section-header">
          <span className="section-number">[02] Alert System</span>
          <h2>Build precise alert conditions with multi-logic stacking.</h2>
          <p className="meta">
            Stack conditions with AND/OR logic, time windows, and cooldown periods.
          </p>
        </div>
        <div className="bento-grid">
          {/* Alert Builder */}
          <SpotlightCard
            className="bento-card"
            style={{
              gridColumn: "span 5",
              borderRadius: 22,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(94, 106, 210, 0.1))",
              boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.06), 0 20px 60px rgba(0, 0, 0, 0.45)",
              padding: 22
            }}
          >
            <div className="bento-kicker">Alert Builder</div>
            <h3>Stack conditions with logic</h3>
            <div className="bento-preview">
              <div className="bento-condition-card">
                <span className="bento-condition-type">Line</span>
                <span className="bento-condition-value">Moves 6.5+ points</span>
              </div>
              <div className="bento-condition-card">
                <span className="bento-condition-type">Time</span>
                <span className="bento-condition-value">First 8 minutes</span>
              </div>
              <div className="bento-condition-card">
                <span className="bento-condition-type">Score</span>
                <span className="bento-condition-value">Down by 10+</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div className="bento-logic-toggle">
                  <button className="bento-logic-btn active">AND</button>
                  <button className="bento-logic-btn">OR</button>
                </div>
              </div>
            </div>
          </SpotlightCard>

          {/* Notifications */}
          <SpotlightCard
            className="bento-card"
            style={{
              gridColumn: "span 4",
              borderRadius: 18,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "linear-gradient(160deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))",
              boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.06), 0 18px 48px rgba(0, 0, 0, 0.4)",
              padding: 20
            }}
          >
            <div className="bento-kicker">Notifications</div>
            <h3>Real-time delivery</h3>
            <div className="bento-preview">
              <div className="bento-notification-item">
                <span className="bento-notification-dot"></span>
                <div className="bento-notification-content">
                  <span className="bento-notification-title">LAL @ DEN</span>
                  <span className="bento-notification-meta">Down by 9 in Q2 · Triggered</span>
                </div>
              </div>
              <div className="bento-notification-item">
                <span className="bento-notification-dot"></span>
                <div className="bento-notification-content">
                  <span className="bento-notification-title">NYJ @ BUF</span>
                  <span className="bento-notification-meta">Moneyline hit +100 · 12s ago</span>
                </div>
              </div>
              <div className="bento-notification-item">
                <span className="bento-notification-dot"></span>
                <div className="bento-notification-content">
                  <span className="bento-notification-title">KC @ LV</span>
                  <span className="bento-notification-meta">Spread crossed -3 · 45s ago</span>
                </div>
              </div>
            </div>
          </SpotlightCard>

          {/* Plans */}
          <SpotlightCard
            className="bento-card"
            style={{
              gridColumn: "span 3",
              borderRadius: 20,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.02))",
              boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.06), 0 20px 60px rgba(0, 0, 0, 0.45)",
              padding: 18
            }}
          >
            <div className="bento-kicker">Plans</div>
            <h3>Transparent gating</h3>
            <div className="bento-preview">
              <div className="bento-plan-grid">
                <div className="bento-plan-col">
                  <div className="bento-plan-name">Free</div>
                  <div className="bento-plan-limit">1/day</div>
                </div>
                <div className="bento-plan-col highlighted">
                  <div className="bento-plan-name">Pro</div>
                  <div className="bento-plan-limit">15/day</div>
                </div>
                <div className="bento-plan-col">
                  <div className="bento-plan-name">Elite</div>
                  <div className="bento-plan-limit">∞</div>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* [03] Advanced Alerts Section */}
      <section className="section">
        <div className="section-header">
          <span className="section-number">[03] Advanced Signals</span>
          <h2>Detect market signals before they move.</h2>
          <p className="meta">
            Steam detection, reverse line movement, and key number proximity alerts.
          </p>
        </div>
        <div className="bento-grid">
          {/* Steam & Movement */}
          <SpotlightCard
            className="bento-card"
            style={{
              gridColumn: "span 6",
              borderRadius: 20,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "linear-gradient(160deg, rgba(94, 106, 210, 0.12), rgba(255, 255, 255, 0.03))",
              boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.06), 0 20px 60px rgba(0, 0, 0, 0.45)",
              padding: 22
            }}
          >
            <div className="bento-kicker">Steam Detection</div>
            <h3>Track sharp money movement</h3>
            <div className="bento-preview">
              <div className="bento-steam-indicator" style={{ marginBottom: 12 }}>
                <div className="bento-steam-icon">
                  <span className="bento-steam-arrow">↑</span>
                </div>
                <span className="bento-steam-text">Steam move detected: DAL -3.5 → -4.5</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div className="bento-sparkline">
                  <div className="bento-spark-bar" style={{ height: "12px" }}></div>
                  <div className="bento-spark-bar" style={{ height: "18px" }}></div>
                  <div className="bento-spark-bar" style={{ height: "14px" }}></div>
                  <div className="bento-spark-bar" style={{ height: "24px" }}></div>
                  <div className="bento-spark-bar" style={{ height: "20px" }}></div>
                  <div className="bento-spark-bar" style={{ height: "28px" }}></div>
                  <div className="bento-spark-bar" style={{ height: "32px" }}></div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>30m Movement</div>
                  <div style={{ fontSize: 14, color: "var(--text)", marginTop: 2 }}>+1.5 pts</div>
                </div>
              </div>
            </div>
          </SpotlightCard>

          {/* Key Numbers */}
          <SpotlightCard
            className="bento-card"
            style={{
              gridColumn: "span 6",
              borderRadius: 20,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))",
              boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.06), 0 20px 60px rgba(0, 0, 0, 0.45)",
              padding: 22
            }}
          >
            <div className="bento-kicker">Key Numbers</div>
            <h3>Football precision alerts</h3>
            <div className="bento-preview">
              <div className="bento-keynumber-grid">
                <div className="bento-keynumber">3</div>
                <div className="bento-keynumber">7</div>
                <div className="bento-keynumber">10</div>
                <div className="bento-keynumber">14</div>
              </div>
              <div style={{ 
                marginTop: 12, 
                padding: "10px 12px", 
                borderRadius: 8, 
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.06)"
              }}>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>Proximity Threshold</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, position: "relative" }}>
                    <div style={{ position: "absolute", left: "60%", top: "50%", transform: "translate(-50%, -50%)", width: 12, height: 12, borderRadius: "50%", background: "var(--accent)" }}></div>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text)" }}>0.5 pts</span>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* [04] Performance Section */}
      <section className="section-centered">
        <span className="section-number">[04] Built for Speed</span>
        <h2>Real-time performance you can trust.</h2>
        <p className="meta">
          Sub-5-second latency across all markets with 100% uptime SLA.
        </p>
        <div className="performance-grid" style={{ marginTop: 32 }}>
          <div className="performance-stat">
            <div className="performance-value">{"<"}5s</div>
            <div className="performance-label">Latency</div>
          </div>
          <div className="performance-stat">
            <div className="performance-value">6</div>
            <div className="performance-label">Sports</div>
          </div>
          <div className="performance-stat">
            <div className="performance-value">3</div>
            <div className="performance-label">Markets</div>
          </div>
          <div className="performance-stat">
            <div className="performance-value">100%</div>
            <div className="performance-label">Uptime</div>
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
        </div>
      </section>

      {/* Final CTA */}
      <section className="section cta">
        <div>
          <h2>Start with Free. Upgrade when you need it.</h2>
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
