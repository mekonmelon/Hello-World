import { NextResponse } from "next/server";
import { fetchCaptionCards } from "@/lib/caption-feed";

export async function GET() {
  try {
    const captions = await fetchCaptionCards();

    if (captions.length === 0) {
      return NextResponse.json({ caption: null }, { status: 200 });
    }

    const randomIndex = Math.floor(Math.random() * captions.length);
    return NextResponse.json({ caption: captions[randomIndex] }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch caption." },
      { status: 500 },
    );
  }
}
