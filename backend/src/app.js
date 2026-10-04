import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { authHandler } from "./config/auth.js";
import apiRoutes from "./routes/index.js";
import { openApiSpec } from "./docs/swagger.js";
import { apiLimiter, authLimiter } from "./middlewares/rateLimit.middleware.js";
import { notFound } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { morganStream } from "./utils/logger.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientOrigins.includes(origin))
        return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  }),
);

if (!env.isTest) {
  app.use(
    morgan(env.isProduction ? "combined" : "dev", { stream: morganStream }),
  );
}

// Better Auth must receive the raw request body, so it is mounted before express.json().
app.all("/api/auth/*splat", authLimiter, authHandler);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "OK",
    data: { uptime: process.uptime() },
  });
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, { customSiteTitle: "Office Visitor API" }),
);
app.get("/api-docs.json", (req, res) => res.json(openApiSpec));

app.use("/api/v1", apiLimiter, apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
