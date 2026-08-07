import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Next.js 16 Proxy (previously "middleware").
 * Runs before every matched request to handle Clerk authentication.
 *
 * Auth is enforced per-page/layout instead of via route matching here,
 * which avoids path-matching divergence issues (see Clerk migration guide).
 * clerkMiddleware sets auth state on every request so useUser/useAuth work.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
