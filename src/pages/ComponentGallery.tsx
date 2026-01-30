import { useState } from "react";
import EventCard from "../components/EventCard";
import OddsBlock from "../components/OddsBlock";
import StatusBadge from "../../components/StatusBadge";
import PricingCard from "../../components/PricingCard";
import { pricingTiers, type BillingInterval, type PlanId } from "../../lib/pricing";
import { FeatureLock, UpgradeCTA, PlanBadge, usePlan } from "../lib/plan";
import { mockLiveEvent, mockPregameEvent, mockFinalEvent, mockOdds } from "../sandbox/mockData";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="gallery-section">
      <h2 className="section-title">{title}</h2>
      <div className="section-content">{children}</div>
    </section>
  );
}

function PlanSwitcher() {
  const { currentPlan, setCurrentPlan } = usePlan();
  return (
    <div className="plan-switcher">
      <span className="label">Current Plan:</span>
      {(["FREE", "PRO", "ELITE"] as const).map((plan) => (
        <button
          key={plan}
          className={`pill${currentPlan === plan ? " active" : ""}`}
          onClick={() => setCurrentPlan(plan)}
        >
          {plan}
        </button>
      ))}
    </div>
  );
}

export default function ComponentGallery() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("PRO");
  const { currentPlan } = usePlan();

  return (
    <div className="component-gallery">
      <header className="gallery-header">
        <h1>Component Gallery</h1>
        <p className="meta">
          Interactive showcase of TipOff UI components. Edit any component and see live updates.
        </p>
        <PlanSwitcher />
      </header>

      <Section title="Event Cards">
        <div className="card-grid">
          <div>
            <h3 className="label">Live Game</h3>
            <EventCard event={mockLiveEvent} showLiveLines liveOdds={mockLiveEvent.liveOdds} />
          </div>
          <div>
            <h3 className="label">Pregame</h3>
            <EventCard event={mockPregameEvent} showLiveLines liveOdds={mockPregameEvent.liveOdds} />
          </div>
          <div>
            <h3 className="label">Final</h3>
            <EventCard event={mockFinalEvent} showLiveLines={false} />
          </div>
        </div>
      </Section>

      <Section title="Odds Blocks">
        <div className="odds-grid">
          <OddsBlock
            label="Spread"
            market="spread"
            awayLabel="Away"
            homeLabel="Home"
            away={mockOdds.spread.away}
            home={mockOdds.spread.home}
          />
          <OddsBlock
            label="Moneyline"
            market="moneyline"
            awayLabel="Away"
            homeLabel="Home"
            away={mockOdds.moneyline.away}
            home={mockOdds.moneyline.home}
          />
        </div>
      </Section>

      <Section title="Status Badges">
        <div className="badge-row">
          <StatusBadge isLive={false} statusText="Pregame" />
          <StatusBadge isLive inPlayState={{ period: "Q2", clock: "5:42" }} />
          <StatusBadge isLive inPlayState={{ period: "Halftime" }} />
          <StatusBadge isLive={false} statusText="Final" />
        </div>
      </Section>

      <Section title="Plan Badges">
        <div className="badge-row">
          <PlanBadge plan="FREE" />
          <PlanBadge plan="PRO" />
          <PlanBadge plan="ELITE" />
        </div>
      </Section>

      <Section title="Pricing Cards">
        <div className="billing-toggle">
          <button
            className={`pill${billingInterval === "monthly" ? " active" : ""}`}
            onClick={() => setBillingInterval("monthly")}
          >
            Monthly
          </button>
          <button
            className={`pill${billingInterval === "annual" ? " active" : ""}`}
            onClick={() => setBillingInterval("annual")}
          >
            Annual
          </button>
        </div>
        <div className="pricing-grid">
          {pricingTiers.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              interval={billingInterval}
              selected={selectedPlan === tier.id}
              currentPlan={currentPlan}
              onSelect={setSelectedPlan}
            />
          ))}
        </div>
      </Section>

      <Section title="Feature Lock">
        <FeatureLock requiredPlan="PRO" featureName="Advanced Charts">
          <div className="locked-content-demo">
            <p>This content is locked behind the PRO plan.</p>
            <p>Switch to FREE plan above to see the lock overlay.</p>
          </div>
        </FeatureLock>
      </Section>

      <Section title="Upgrade CTA">
        <UpgradeCTA requiredPlan="ELITE" featureName="Steam move alerts require Elite plan" />
      </Section>

      <Section title="Buttons">
        <div className="button-row">
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-ghost">Ghost</button>
          <button className="btn btn-danger">Danger</button>
          <button className="btn btn-primary" disabled>
            Disabled
          </button>
        </div>
      </Section>

      <Section title="Form Elements">
        <div className="form-demo">
          <input type="text" className="input" placeholder="Text input..." />
          <select className="input">
            <option>Select an option</option>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
          <div className="pill-group">
            <button className="pill active">Active</button>
            <button className="pill">Inactive</button>
            <button className="pill">Another</button>
          </div>
        </div>
      </Section>

      <style>{`
        .component-gallery {
          padding: var(--space-6);
          max-width: 1200px;
          margin: 0 auto;
        }
        .gallery-header {
          margin-bottom: var(--space-8);
        }
        .gallery-header h1 {
          font-size: var(--text-2xl);
          margin-bottom: var(--space-2);
        }
        .gallery-section {
          margin-bottom: var(--space-10);
        }
        .section-title {
          font-size: var(--text-lg);
          font-weight: 600;
          margin-bottom: var(--space-4);
          padding-bottom: var(--space-2);
          border-bottom: 1px solid hsl(var(--border));
        }
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: var(--space-4);
        }
        .card-grid h3 {
          margin-bottom: var(--space-2);
        }
        .odds-grid {
          display: flex;
          gap: var(--space-4);
          flex-wrap: wrap;
        }
        .badge-row {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
          align-items: center;
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-4);
        }
        .billing-toggle {
          display: flex;
          gap: var(--space-2);
          margin-bottom: var(--space-4);
        }
        .button-row {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
        }
        .form-demo {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          max-width: 320px;
        }
        .locked-content-demo {
          padding: var(--space-6);
          background: hsl(var(--surface-raised));
          border-radius: var(--radius-lg);
          text-align: center;
        }
        .plan-switcher {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-top: var(--space-4);
        }
      `}</style>
    </div>
  );
}
