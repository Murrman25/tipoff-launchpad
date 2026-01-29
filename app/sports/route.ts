import { NextResponse } from "next/server";
import { getOddsData } from "@/src/lib/oddsApi";

export const runtime = "nodejs";

export const GET = async () => {
  try {
    const data = await getOddsData();
    const sports = Array.from(new Set(data.events.map((event) => event.sport)));
    return NextResponse.json(sports);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load sports.";
    console.error("sports route error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
};
