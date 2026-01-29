import { NextResponse } from "next/server";
import { getOddsData } from "@/src/lib/oddsApi";

export const runtime = "nodejs";

export const GET = async () => {
  try {
    const data = await getOddsData();
    return NextResponse.json(data.sportsbooks);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load sportsbooks.";
    console.error("sportsbooks route error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
};
