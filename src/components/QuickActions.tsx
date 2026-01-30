"use client";

import Link from "../adapters/Link";
import { useState } from "react";
import FeatureLock from "@/components/FeatureLock";
import TargetTrackerCreateModal from "@/src/components/TargetTrackerCreateModal";
import type { Event } from "@/src/lib/contracts";

type QuickActionsProps = {
  event: Event;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

export default function QuickActions({ event }: QuickActionsProps) {
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [trackerNotice, setTrackerNotice] = useState<Notice | null>(null);
  const [momentumPoints, setMomentumPoints] = useState(8);
  const [momentumSeconds, setMomentumSeconds] = useState(90);
  const [momentumMove, setMomentumMove] = useState(1.5);
  const [keyNumber, setKeyNumber] = useState(3);
  const [keyDistance, setKeyDistance] = useState(0.5);
  const [buybackOriginal, setBuybackOriginal] = useState(-3.5);
  const [buybackReturn, setBuybackReturn] = useState(-2.5);
  const [buybackWindow, setBuybackWindow] = useState(12);

  return (
    <div className="quick-actions">
      <div className="panel-header">
        <div>
          <h3 className="panel-title">V2 Quick Actions</h3>
          <p className="meta">One-tap controls for deeper movement workflows.</p>
        </div>
      </div>
      <div className="quick-actions-grid">
        <FeatureLock requiredPlan="PRO">
          <div className="quick-action-card">
            <div>
              <div className="quick-action-title">Track target number</div>
              <p className="meta">
                Monitor a spread or moneyline target with auto-rearm logic.
              </p>
            </div>
            <div className="quick-action-row">
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setShowTrackerModal(true)}
              >
                Create target tracker
              </button>
              <Link className="link" href="/targets">
                View tracked targets
              </Link>
            </div>
            {trackerNotice ? (
              <div
                className={`notice ${trackerNotice.type === "success" ? "success" : "error"}`}
              >
                {trackerNotice.message}
              </div>
            ) : null}
          </div>
        </FeatureLock>

        <FeatureLock requiredPlan="PRO">
          <div className="quick-action-card">
            <div>
              <div className="quick-action-title">Live momentum alert</div>
              <p className="meta">
                Trigger when a run flips the live line fast.
              </p>
            </div>
            <div className="quick-action-fields">
              <div className="filter-block">
                <label className="label">Run points</label>
                <input
                  className="input"
                  type="number"
                  value={momentumPoints}
                  onChange={(eventItem) =>
                    setMomentumPoints(Number(eventItem.target.value))
                  }
                />
              </div>
              <div className="filter-block">
                <label className="label">Run seconds</label>
                <input
                  className="input"
                  type="number"
                  value={momentumSeconds}
                  onChange={(eventItem) =>
                    setMomentumSeconds(Number(eventItem.target.value))
                  }
                />
              </div>
              <div className="filter-block">
                <label className="label">Min line move</label>
                <input
                  className="input"
                  type="number"
                  step={0.5}
                  value={momentumMove}
                  onChange={(eventItem) =>
                    setMomentumMove(Number(eventItem.target.value))
                  }
                />
              </div>
            </div>
            <button className="btn btn-ghost" type="button">
              Create momentum alert
            </button>
          </div>
        </FeatureLock>

        <FeatureLock requiredPlan="ELITE">
          <div className="quick-action-card">
            <div>
              <div className="quick-action-title">Key number proximity</div>
              <p className="meta">
                Watch for critical spreads near key numbers.
              </p>
            </div>
            <div className="quick-action-fields">
              <div className="filter-block">
                <label className="label">Key number</label>
                <input
                  className="input"
                  type="number"
                  step={0.5}
                  value={keyNumber}
                  onChange={(eventItem) =>
                    setKeyNumber(Number(eventItem.target.value))
                  }
                />
              </div>
              <div className="filter-block">
                <label className="label">Proximity</label>
                <input
                  className="input"
                  type="number"
                  step={0.5}
                  value={keyDistance}
                  onChange={(eventItem) =>
                    setKeyDistance(Number(eventItem.target.value))
                  }
                />
              </div>
            </div>
            <button className="btn btn-ghost" type="button">
              Create key number alert
            </button>
          </div>
        </FeatureLock>

        <FeatureLock requiredPlan="ELITE">
          <div className="quick-action-card">
            <div>
              <div className="quick-action-title">Buyback alert</div>
              <p className="meta">
                Flag when a line reverses toward the opener.
              </p>
            </div>
            <div className="quick-action-fields">
              <div className="filter-block">
                <label className="label">Original line</label>
                <input
                  className="input"
                  type="number"
                  step={0.5}
                  value={buybackOriginal}
                  onChange={(eventItem) =>
                    setBuybackOriginal(Number(eventItem.target.value))
                  }
                />
              </div>
              <div className="filter-block">
                <label className="label">Return line</label>
                <input
                  className="input"
                  type="number"
                  step={0.5}
                  value={buybackReturn}
                  onChange={(eventItem) =>
                    setBuybackReturn(Number(eventItem.target.value))
                  }
                />
              </div>
              <div className="filter-block">
                <label className="label">Window (min)</label>
                <input
                  className="input"
                  type="number"
                  value={buybackWindow}
                  onChange={(eventItem) =>
                    setBuybackWindow(Number(eventItem.target.value))
                  }
                />
              </div>
            </div>
            <button className="btn btn-ghost" type="button">
              Create buyback alert
            </button>
          </div>
        </FeatureLock>
      </div>
      <TargetTrackerCreateModal
        event={event}
        open={showTrackerModal}
        onClose={() => setShowTrackerModal(false)}
        onCreated={() => {
          setTrackerNotice({
            type: "success",
            message: "Target tracker created. View it in Targets."
          });
        }}
      />
    </div>
  );
}
