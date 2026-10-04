import http from "node:http";

import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { closeAuth } from "./config/auth.js";
import app from "./app.js";
import { initSocket, closeSocket } from "./socket.js";
import { startScheduler, stopScheduler } from "./jobs/scheduler.js";
import { logger } from "./utils/logger.js";

async function start() {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);
  startScheduler();

  server.listen(env.PORT, () => {
    logger.info(`Server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    logger.info(`API docs available at http://localhost:${env.PORT}/api-docs`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down`);
    stopScheduler();
    await closeSocket();
    server.close(async () => {
      await Promise.allSettled([disconnectDB(), closeAuth()]);
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled rejection: ${reason?.stack || reason}`);
});

start().catch((err) => {
  logger.error(`Failed to start server: ${err?.stack || err}`);
  process.exit(1);
});
