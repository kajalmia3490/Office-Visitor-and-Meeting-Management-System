import { User } from "../users/user.model.js";
import { ROLES } from "../../config/constants.js";

/**
 * Maps a Better Auth session to the application user profile. Users signing in
 * for the first time are provisioned with the `employee` role; an admin can
 * promote them later. Pre-created profiles (e.g. seeded admin) are linked by email.
 */
export async function resolveAppUser(session) {
  const authUser = session?.user;
  if (!authUser?.id || !authUser?.email) return null;

  const email = authUser.email.toLowerCase();
  let user = await User.findOne({ authUserId: authUser.id });

  if (!user) {
    user = await User.findOne({ email });
    if (user) {
      user.authUserId = authUser.id;
      if (!user.profileImage && authUser.image)
        user.profileImage = authUser.image;
      await user.save();
    } else {
      try {
        user = await User.create({
          name: authUser.name || email.split("@")[0],
          email,
          role: ROLES.EMPLOYEE,
          profileImage: authUser.image || undefined,
          authUserId: authUser.id,
        });
      } catch (err) {
        // A concurrent request may have provisioned the same user.
        if (err?.code !== 11000) throw err;
        user = await User.findOne({
          $or: [{ authUserId: authUser.id }, { email }],
        });
      }
    }
  }

  const sessionCreatedAt = session.session?.createdAt
    ? new Date(session.session.createdAt)
    : null;
  if (
    sessionCreatedAt &&
    (!user.lastLoginAt || user.lastLoginAt < sessionCreatedAt)
  ) {
    user.lastLoginAt = sessionCreatedAt;
    await user.save();
  }

  return user;
}
