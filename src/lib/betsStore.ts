import type { BetLog } from "./contracts";

export type BetEntry = BetLog;

export type BetDraft = Omit<BetEntry, "id" | "placedAt"> & {
  id?: string;
  placedAt?: string;
};

const STORAGE_KEY = "tipoff.v2.bets";
const UPDATE_EVENT = "tipoff.bets.updated";

const canUseStorage = () => typeof window !== "undefined";

const readStoredBets = () => {
  if (!canUseStorage()) {
    return [] as BetEntry[];
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [] as BetEntry[];
    }
    const parsed = JSON.parse(stored) as BetEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as BetEntry[];
  }
};

const writeStoredBets = (bets: BetEntry[]) => {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
  window.dispatchEvent(new Event(UPDATE_EVENT));
};

export const loadBets = () => readStoredBets();

export const addBet = (payload: BetDraft) => {
  const bets = readStoredBets();
  const entry: BetEntry = {
    ...payload,
    id: payload.id ?? `bet-${Date.now()}`,
    placedAt: payload.placedAt ?? new Date().toISOString()
  };
  const next = [entry, ...bets];
  writeStoredBets(next);
  return entry;
};

export const updateBet = (id: string, updates: Partial<BetEntry>) => {
  const bets = readStoredBets();
  const index = bets.findIndex((bet) => bet.id === id);
  if (index === -1) {
    throw new Error("Bet not found");
  }
  bets[index] = { ...bets[index], ...updates };
  writeStoredBets(bets);
  return bets[index];
};

export const deleteBet = (id: string) => {
  const bets = readStoredBets();
  const next = bets.filter((bet) => bet.id !== id);
  writeStoredBets(next);
  return next;
};

export const findBetBySourceAlertId = (sourceAlertId: string) => {
  if (!sourceAlertId) {
    return null;
  }
  return readStoredBets().find((bet) => bet.sourceAlertId === sourceAlertId) ?? null;
};

export const hasBetForSourceAlertId = (sourceAlertId: string) =>
  Boolean(findBetBySourceAlertId(sourceAlertId));

export const setClosingLine = (
  id: string,
  closingLine: number | undefined,
  closingOdds: number | undefined
) => updateBet(id, { closingLine, closingOdds });

export const subscribeBets = (callback: (bets: BetEntry[]) => void) => {
  if (!canUseStorage()) {
    return () => {};
  }
  const handler = () => callback(readStoredBets());
  window.addEventListener(UPDATE_EVENT, handler);
  return () => window.removeEventListener(UPDATE_EVENT, handler);
};
