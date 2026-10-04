import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const handler = (req, res, next, options) => {
  res.status(options.statusCode).json({
    success: false,
    message: "Too many requests, please try again later",
    error: { code: "TOO_MANY_REQUESTS" },
  });
};

const common = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => env.isTest,
  handler,
};

export const apiLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 500,
});

export const authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60 * 1000,
  limit: 50,
});

export const sensitiveLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 30,
});
