import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const periodicidades = await db("periodicidades").select("key", "label", "dias").orderBy("dias", "asc");
  return NextResponse.json({ periodicidades });
}
