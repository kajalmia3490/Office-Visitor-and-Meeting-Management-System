import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { toNodeHandler } from "better-auth/node";
import { MongoClient } from "mongodb";

import { env } from "./env.js";

let client;
let auth;
let nodeHandler;

function createAuth() {
  client = new MongoClient(env.MONGODB_URI);
  const db = env.MONGODB_DB_NAME ? client.db(env.MONGODB_DB_NAME) : client.db();

  const socialProviders = {};
  if (env.googleEnabled) {
    socialProviders.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }

  return betterAuth({
    appName: "Office Visitor & Meeting Management",
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    database: mongodbAdapter(db),
    trustedOrigins: env.clientOrigins,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    socialProviders,
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      useSecureCookies: env.isProduction,
    },
  });
}

/**
 * Lazily creates the Better Auth instance so that importing the app does not
 * open an extra database connection until authentication is actually used.
 */
export function getAuth() {
  if (!auth) auth = createAuth();
  return auth;
}

export function authHandler(req, res) {
  if (!nodeHandler) nodeHandler = toNodeHandler(getAuth());
  return nodeHandler(req, res);
}

export async function closeAuth() {
  if (client) await client.close();
}
