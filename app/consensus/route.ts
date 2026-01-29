import { NextResponse } from "next/server";
import { getOddsData } from "@/src/lib/oddsApi";

export const runtime = "nodejs";

export const GET = async (request: Request) => {
  try {
    const data = await getOddsData();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const lines = eventId
      ? data.consensus.filter((line) => line.eventId === eventId)
      : data.consensus;
    return NextResponse.json(lines);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load consensus lines.";
    console.error("consensus route error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
};
