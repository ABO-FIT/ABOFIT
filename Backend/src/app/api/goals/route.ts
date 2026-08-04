import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const goals = await db("goals").select("key", "label", "short_label", "color").orderBy("label", "asc");
  return NextResponse.json({ goals });
}
