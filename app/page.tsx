import Link from "next/link";
import SpotlightCard from "@/components/SpotlightCard";

export default function Home() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-kicker">TipOff - alerts-first sports intelligence</span>
          <h1>
            Real-time line &amp; game-state alerts,{" "}
            <span className="text-gradient-accent">precision-tuned</span> to the
            moments you care about.
          </h1>
          <p className="hero-subtitle">
            TipOff continuously monitors live games and markets so you can build
            precise, timing-aware alerts. No picks. No betting. Just instant,
            user-controlled notifications.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/dashboard">
              Open live board
            </Link>
            <Link className="btn btn-ghost" href="/pricing">
              View pricing
            </Link>
          </div>
          <div className="hero-proof">
            <div>
              <div className="label">Live latency</div>
              <div className="hero-proof-value">{"<"}5s</div>
            </div>
            <div>
              <div className="label">Sports</div>
              <div className="hero-proof-value">NFL · NBA · MLB</div>
            </div>
            <div>
              <div className="label">Markets</div>
              <div className="hero-proof-value">ML · Spread · Total</div>
            </div>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-card-header">
            <span className="label">Alert summary</span>
            <span className="pill active">Live</span>
          </div>
          <div className="hero-card-body">
            <p className="hero-card-title">
              Alert me when Lakers go down by 10+ in the first 10 minutes.
            </p>
            <div className="hero-card-meta">
              <span className="badge badge-live">LIVE Q1 8:42</span>
              <span className="meta">Runs + score differential</span>
            </div>
            <div className="hero-card-footer">
              <div>
                <div className="label">Cooldown</div>
                <div className="meta">2 minutes</div>
              </div>
              <div>
                <div className="label">Delivery</div>
                <div className="meta">In-app notification</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Sneak peek: TipOff in action</h2>
          <p className="meta">
            Bento boxes preview the live board, alert builder, notifications, and plan
            gating - all built for fast scanning and instant decisions.
          </p>
        </div>
        <div className="bento-grid">
          <SpotlightCard
            className="bento-card"
            style={{
              gridColumn: "span 5",
              borderRadius: 20,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02))",
              boxShadow:
                "0 0 0 1px rgba(255, 255, 255, 0.06), 0 20px 60px rgba(0, 0, 0, 0.45)",
              padding: 20
            }}
          >
            <div className="bento-kicker">Live board</div>
            <h3>Track every line movement the moment it happens.</h3>
            <div className="bento-mini">
              <div className="mini-row">
                <strong>DAL @ PHI</strong>
                <span className="meta">ML +115 · LIVE Q3 7:42</span>
              </div>
              <div className="mini-row">
                <strong>BOS @ NYK</strong>
                <span className="meta">Spread -4.5 · 2m ago</span>
              </div>
              <div className="mini-row">
                <strong>SF @ SEA</strong>
                <span className="meta">Total 46.5 · Pregame</span>
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard
            className="bento-card"
            style={{
              gridColumn: "span 3",
              borderRadius: 18,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background:
                "linear-gradient(160deg, rgba(94, 106, 210, 0.18), rgba(255, 255, 255, 0.03))",
              boxShadow:
                "0 0 0 1px rgba(255, 255, 255, 0.06), 0 18px 50px rgba(0, 0, 0, 0.4)",
              padding: 18
            }}
          >
            <div className="bento-kicker">Quick alerts</div>
            <h3>One-click +100 even money alerts.</h3>
            <div className="bento-chip-row">
              <span className="pill active">Home</span>
              <span className="pill">Away</span>
              <span className="pill">Pregame</span>
            </div>
            <p className="meta">
              Build fast alerts straight from the Games board with fixed thresholds.
            </p>
          </SpotlightCard>

          <SpotlightCard
            className="bento-card"
            style={{
              gridColumn: "span 4",
              borderRadius: 22,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(94, 106, 210, 0.1))",
              boxShadow:
                "0 0 0 1px rgba(255, 255, 255, 0.06), 0 20px 60px rgba(0, 0, 0, 0.45)",
              padding: 20
            }}
          >
            <div className="bento-kicker">Alert builder</div>
            <h3>Stack multi-condition logic with time windows.</h3>
            <div className="bento-list">
              <div>
                <div className="label">Condition A</div>
                <div className="meta">Line moves 6.5+ points</div>
              </div>
              <div>
                <div className="label">Condition B</div>
                <div className="meta">Only in first 8 minutes</div>
              </div>
              <div>
                <div className="label">Logic</div>
                <div className="meta">Match ALL</div>
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard
            className="bento-card"
            style={{
              gridColumn: "span 4",
              borderRadius: 18,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background:
                "linear-gradient(160deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))",
              boxShadow:
                "0 0 0 1px rgba(255, 255, 255, 0.06), 0 18px 48px rgba(0, 0, 0, 0.4)",
              padding: 18
            }}
          >
            <div className="bento-kicker">Notifications</div>
            <h3>Real-time delivery with clean inbox triage.</h3>
            <div className="bento-notes">
              <div className="note-card">
                <strong>LAL @ DEN</strong>
                <span className="meta">Down by 9 in Q2 · Triggered</span>
              </div>
              <div className="note-card">
                <strong>NYJ @ BUF</strong>
                <span className="meta">Moneyline hit +100 · 12s ago</span>
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard
            className="bento-card"
            style={{
              gridColumn: "span 4",
              borderRadius: 20,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.02))",
              boxShadow:
                "0 0 0 1px rgba(255, 255, 255, 0.06), 0 20px 60px rgba(0, 0, 0, 0.45)",
              padding: 20
            }}
          >
            <div className="bento-kicker">Plans</div>
            <h3>Plan gating that stays transparent.</h3>
            <div className="bento-grid-mini">
              <div>
                <div className="label">Rookie</div>
                <div className="meta">1 alert / day</div>
              </div>
              <div>
                <div className="label">Pro</div>
                <div className="meta">Multi-condition + live</div>
              </div>
              <div>
                <div className="label">Legend</div>
                <div className="meta">Unlimited + auto-rearm</div>
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard
            className="bento-card"
            style={{
              gridColumn: "span 4",
              borderRadius: 18,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background:
                "linear-gradient(130deg, rgba(94, 106, 210, 0.15), rgba(255, 255, 255, 0.02))",
              boxShadow:
                "0 0 0 1px rgba(255, 255, 255, 0.06), 0 18px 50px rgba(0, 0, 0, 0.4)",
              padding: 18
            }}
          >
            <div className="bento-kicker">Compliance</div>
            <h3>Informational by design.</h3>
            <p className="meta">
              TipOff never places bets or recommends picks. It only monitors
              conditions you define and alerts you when they happen.
            </p>
            <div className="bento-pill-row">
              <span className="pill">No ROI claims</span>
              <span className="pill">No sportsbook affiliation</span>
            </div>
          </SpotlightCard>
        </div>
      </section>

      <section className="section split">
        <div>
          <h2>Alerts-first navigation</h2>
          <p className="meta">
            Every screen is built around monitoring and alert creation: Games,
            Alerts, Notifications, Settings, and Pricing.
          </p>
        </div>
        <div className="split-card">
          <div className="label">Alert creation workflow</div>
          <ol className="split-list">
            <li>Select a game or market.</li>
            <li>Choose line or live condition.</li>
            <li>Define time window & frequency.</li>
            <li>Get notified instantly.</li>
          </ol>
        </div>
      </section>

      <section className="section cta">
        <div>
          <h2>Start with Rookie. Upgrade only when you need to.</h2>
          <p className="meta">
            Build alerts for free, then unlock advanced logic, faster delivery, and
            auto-rearm when you’re ready.
          </p>
        </div>
        <div className="cta-actions">
          <Link className="btn btn-primary" href="/pricing">
            Compare plans
          </Link>
          <Link className="btn btn-ghost" href="/dashboard">
            Explore live board
          </Link>
        </div>
      </section>
    </div>
  );
}
