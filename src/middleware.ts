import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ENABLED } from "@/lib/config";

export async function middleware(request: NextRequest) {
  if (!AUTH_ENABLED) {
    return NextResponse.next();
  }
  const { default: authMiddleware } = await import("@/middleware.auth");
  return authMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
