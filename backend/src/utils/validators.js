import mongoose from "mongoose";
import { z } from "zod";

export const objectId = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value) && /^[a-f\d]{24}$/i.test(value), {
    message: "Invalid id",
  });

export const idParams = z.object({ id: objectId });

export const isoDate = z.coerce.date({ error: "Invalid date" });

export const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s\-()]{6,20}$/, "Invalid phone number");

export const email = z.string().trim().toLowerCase().email("Invalid email address");

export const booleanString = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => value === true || value === "true");

export const paginationQuery = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
};

export const dateRangeQuery = {
  from: isoDate.optional(),
  to: isoDate.optional(),
};

export const refineDateRange = (data, ctx) => {
  if (data.from && data.to && data.from > data.to) {
    ctx.addIssue({ code: "custom", path: ["to"], message: "'to' must be after 'from'" });
  }
};

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
