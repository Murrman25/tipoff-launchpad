import type { DemoEvent } from "../contracts";
import { cloneEvent, cloneEvents, demoBooks, getDemoEvent, getDemoEvents } from "./demoData";

const demoDelay = (ms = 120) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const listEvents = async () => {
  await demoDelay();
  return cloneEvents(getDemoEvents());
};

export const getEventById = async (eventId: string) => {
  await demoDelay();
  const event = getDemoEvent(eventId);
  if (!event) {
    throw new Error("Event not found");
  }
  return cloneEvent(event);
};

export const listBooks = async () => {
  await demoDelay();
  return demoBooks.map((book) => ({ ...book }));
};

export type { DemoEvent };
