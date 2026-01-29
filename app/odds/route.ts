import { NextResponse } from "next/server";
import { getOddsData } from "@/src/lib/oddsApi";

export const runtime = "nodejs";

export const GET = async (request: Request) => {
  try {
    const data = await getOddsData();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const snapshots = eventId
      ? data.snapshots.filter((snapshot) => snapshot.eventId === eventId)
      : data.snapshots;
    return NextResponse.json(snapshots);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load odds.";
    console.error("odds route error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
};
