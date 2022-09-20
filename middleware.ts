import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  if (url.pathname === "/") {
    // get current date in YYYY-MM-DD format
    const date = new Date().toISOString().split("T")[0];
    url.pathname = `/${date}`;
    return NextResponse.redirect(url);
  }
}
