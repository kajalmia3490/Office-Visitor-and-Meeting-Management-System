import { ApiError } from "../utils/ApiError.js";

/**
 * Restricts a route to the given application roles. The role always comes
 * from the database-backed `req.user`, never from client input.
 */
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(ApiError.unauthenticated());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    return next();
  };

export function hasRole(user, ...roles) {
  return Boolean(user && roles.includes(user.role));
}
