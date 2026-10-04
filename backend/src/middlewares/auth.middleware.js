import { getSessionFromRequest } from "../modules/auth/auth.session.js";
import { resolveAppUser } from "../modules/auth/auth.service.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Requires a valid Better Auth session and attaches the application user
 * (with its server-side role) to `req.user`.
 */
export async function authenticate(req, res, next) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session?.user) throw ApiError.unauthenticated();

    const user = await resolveAppUser(session);
    if (!user) throw ApiError.unauthenticated();
    if (!user.isActive)
      throw ApiError.forbidden("Your account is inactive", "ACCOUNT_INACTIVE");

    req.user = user;
    req.authSession = session;
    return next();
  } catch (err) {
    return next(err);
  }
}
