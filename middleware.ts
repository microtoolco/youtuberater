import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // YouTube Rater MVP: No auth required
  // Supabase integration can be added later for user accounts
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
