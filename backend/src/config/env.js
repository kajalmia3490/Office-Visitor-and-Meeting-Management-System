import "dotenv/config";
import { z } from "zod";

const isTest = process.env.NODE_ENV === "test";

const optionalString = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() ? value.trim() : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB_NAME: optionalString,

  BETTER_AUTH_SECRET: isTest
    ? z.string().default("test-secret-test-secret-test-secret-123")
    : z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:5000"),

  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,

  CLIENT_URL: z.string().default("http://localhost:3000"),

  PASS_DEFAULT_VALIDITY_HOURS: z.coerce.number().positive().max(72).default(8),

  ADMIN_EMAIL: optionalString,
  ADMIN_NAME: optionalString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

const values = parsed.data;

export const env = Object.freeze({
  ...values,
  isProduction: values.NODE_ENV === "production",
  isTest: values.NODE_ENV === "test",
  clientOrigins: values.CLIENT_URL.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  googleEnabled: Boolean(values.GOOGLE_CLIENT_ID && values.GOOGLE_CLIENT_SECRET),
});
