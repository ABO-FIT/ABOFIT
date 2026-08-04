import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const planes = await db("plans").select("key", "name", "price", "includes_diet", "description");
  return NextResponse.json({ planes });
}
