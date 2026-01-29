import { NextResponse } from "next/server";
import { getOddsData } from "@/src/lib/oddsApi";

export const runtime = "nodejs";

export const GET = async (
  _request: Request,
  context: { params: { id: string } }
) => {
  try {
    const data = await getOddsData();
    const event = data.events.find((item) => item.id === context.params.id);
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(event);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load event.";
    console.error("event route error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
};
