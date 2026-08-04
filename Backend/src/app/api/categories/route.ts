import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const categorias = await db("categories").select("id", "name").orderBy("name", "asc");
  return NextResponse.json({ categorias });
}
