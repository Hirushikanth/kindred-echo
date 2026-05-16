import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ROOM_COOKIE_NAME } from "@/lib/constants/session";
import { looksLikeUuid } from "@/lib/validation/uuid";

/** Upload cannot be accessed without establishing a demo room cookie first. */
export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/setup/upload")) {
    return NextResponse.next();
  }

  const raw = req.cookies.get(ROOM_COOKIE_NAME)?.value ?? "";
  if (!raw.trim() || !looksLikeUuid(raw)) {
    const url = req.nextUrl.clone();
    url.pathname = "/setup";
    url.searchParams.set("notice", "missing-room");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/setup/upload", "/setup/upload/:path*"],
};
