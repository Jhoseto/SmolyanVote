/**
 * Maps leftover legacy action URLs (stored in DB / old notifications) onto Next routes
 * so in-app navigation never 404s on Thymeleaf paths.
 */
export function normalizeActionUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const parsed = new URL(url, base);
    const path = parsed.pathname.replace(/\/$/, "") || "/";

    const aliases: Record<string, string> = {
      "/viewLogin": "/login",
      "/user/login": "/login",
      "/user/registration": "/register",
      "/registration": "/register",
      "/mainEvents": "/events",
      "/mainEventPage": "/events",
      "/admin/dashboard": "/admin",
      "/contact": "/contacts",
      "/aboutUs": "/about",
      "/signals/mainView": "/signals",
      "/createNewEvent": "/event/new",
      "/createEvent": "/event/new",
      "/create": "/events",
      "/multipoll/createMultiPoll": "/multipoll/new",
      "/multipoll/create": "/multipoll/new",
      "/terms-conditions": "/terms-and-conditions",
    };

    let nextPath = aliases[path] ?? path;

    // Exact legacy create form path (not /referendum/{id})
    if (path === "/referendum") {
      nextPath = "/referendum/new";
    }

    const signalIdMatch = path.match(/^\/signals\/(\d+)$/);
    if (signalIdMatch) {
      parsed.searchParams.set("openSignal", signalIdMatch[1]);
      nextPath = "/signals";
    }

    const search = parsed.searchParams.toString();
    const hash = parsed.hash;
    return nextPath + (search ? `?${search}` : "") + hash;
  } catch {
    return url;
  }
}
