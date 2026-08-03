import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

function conCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", origin ?? FRONTEND_URL);
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Vary", "Origin");
  return response;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return conCorsHeaders(new NextResponse(null, { status: 204 }), origin);
  }

  return conCorsHeaders(NextResponse.next(), origin);
}

export const config = {
  matcher: "/api/:path*",
};
