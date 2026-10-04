import { Server } from "socket.io";
import { env } from "./config/env.js";
import { getSessionFromHeaders } from "./modules/auth/auth.session.js";
import { resolveAppUser } from "./modules/auth/auth.service.js";
import { logger } from "./utils/logger.js";

let io = null;

export const userRoom = (userId) => `user:${userId}`;

/**
 * Optional real-time delivery. Clients connect with their Better Auth session
 * cookie and join a private room; persisted notifications remain the source of truth.
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.clientOrigins, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const session = await getSessionFromHeaders(socket.handshake.headers);
      const user = session ? await resolveAppUser(session) : null;
      if (!user || !user.isActive) return next(new Error("UNAUTHENTICATED"));
      socket.data.user = { id: String(user._id), role: user.role };
      return next();
    } catch (err) {
      return next(err);
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.data.user.id));
    logger.debug(`Socket connected for user ${socket.data.user.id}`);
  });

  return io;
}

export function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(userRoom(String(userId))).emit(event, payload);
}

export async function closeSocket() {
  if (io) {
    await io.close();
    io = null;
  }
}
