import { fromNodeHeaders } from "better-auth/node";
import { getAuth } from "../../config/auth.js";

/**
 * Boundary between the Express API and Better Auth. Everything that needs the
 * Better Auth session goes through this module, which keeps it easy to replace
 * in tests.
 */
export async function getSessionFromHeaders(headers) {
  return getAuth().api.getSession({ headers: fromNodeHeaders(headers) });
}

export async function getSessionFromRequest(req) {
  return getSessionFromHeaders(req.headers);
}

/** Returns the Better Auth sign-out `Response` (including cookie-clearing headers). */
export async function signOutRequest(req) {
  return getAuth().api.signOut({
    headers: fromNodeHeaders(req.headers),
    asResponse: true,
  });
}
