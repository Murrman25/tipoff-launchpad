import { formatInPlayDetail } from "@/lib/status";
import type { InPlayState } from "@/lib/types";

type LiveDetailHeaderProps = {
  isLive: boolean;
  inPlayState?: InPlayState;
  statusText?: string;
  score?: {
    away: number;
    home: number;
  };
  awayTeam: string;
  homeTeam: string;
  startTime: string;
};

export default function LiveDetailHeader({
  isLive,
  inPlayState,
  statusText,
  score,
  awayTeam,
  homeTeam,
  startTime
}: LiveDetailHeaderProps) {
  const detail = formatInPlayDetail(inPlayState, statusText);
  const label = isLive ? (detail === "LIVE" ? "LIVE" : `LIVE ${detail}`) : statusText || "PREGAME";

  return (
    <div className="status-header">
      <div>
        <p className="status-detail">{label}</p>
        <p className="meta">Start time: {startTime}</p>
      </div>
      {score ? (
        <div className="scoreline">
          <span>
            {awayTeam}: {score.away}
          </span>
          <span>
            {homeTeam}: {score.home}
          </span>
        </div>
      ) : null}
    </div>
  );
}
