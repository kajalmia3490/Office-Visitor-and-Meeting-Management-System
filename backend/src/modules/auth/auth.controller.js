import { signOutRequest } from "./auth.session.js";
import { sendSuccess } from "../../utils/response.js";

export async function me(req, res) {
  await req.user.populate({ path: "department", select: "name code" });
  const session = req.authSession?.session;

  return sendSuccess(res, {
    message: "Authenticated user",
    data: {
      user: req.user,
      session: session ? { id: session.id, expiresAt: session.expiresAt } : null,
    },
  });
}

export async function logout(req, res) {
  const response = await signOutRequest(req);
  const cookies = response?.headers?.getSetCookie?.() ?? [];
  if (cookies.length) res.setHeader("Set-Cookie", cookies);

  return sendSuccess(res, { message: "Logged out successfully" });
}
