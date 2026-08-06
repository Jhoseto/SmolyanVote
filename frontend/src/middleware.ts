import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_ORIGIN =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ??
  "http://localhost:2662";

/**
 * Light admin gate: only block when we can prove the user is NOT an admin.
 * JWT may live in localStorage/sessionStorage without the mirror cookie yet —
 * AdminPageClient + AuthProvider handle that client-side.
 */
export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("sv_access_token")?.value;
  if (!token) {
    return NextResponse.next();
  }

  try {
    const res = await fetch(`${API_ORIGIN}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.next();
    }
    const user = (await res.json()) as { role?: string };
    if (user.role !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("adminDenied", "1");
      return NextResponse.redirect(url);
    }
  } catch {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
