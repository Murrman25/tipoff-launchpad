import { buildStatusLabel, statusTone } from "@/lib/status";
import type { InPlayState } from "@/lib/types";

type StatusBadgeProps = {
  isLive: boolean;
  inPlayState?: InPlayState;
  statusText?: string;
};

export default function StatusBadge({
  isLive,
  inPlayState,
  statusText
}: StatusBadgeProps) {
  const label = buildStatusLabel(isLive, inPlayState, statusText);
  const tone = statusTone(isLive, statusText);

  return <span className={`badge ${tone}`}>{label}</span>;
}
