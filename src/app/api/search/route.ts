import { NextResponse } from "next/server";
import { searchArchive } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const results = await searchArchive({
    q: searchParams.get("q") ?? undefined,
    episode: searchParams.get("episode") ?? undefined,
    source: searchParams.get("source") ?? "ALL",
    tag: searchParams.get("tag") ?? undefined,
    speaker: searchParams.get("speaker") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    exact: searchParams.get("exact") === "true",
  });

  return NextResponse.json(results);
}
