import { z } from "zod";
import { idParams, isoDate, objectId } from "../../utils/validators.js";

export const passOptionsSchema = z.object({
  expiresAt: isoDate.optional(),
  validHours: z.coerce.number().positive().max(72).optional(),
});

export const issuePassSchema = {
  body: passOptionsSchema.extend({ visit: objectId }),
};

export const verifyPassSchema = {
  params: z.object({
    passNumber: z
      .string()
      .trim()
      .regex(/^VP-\d{8}-[A-Fa-f0-9]{6}$/, "Invalid pass number format"),
  }),
};

export const revokePassSchema = {
  params: idParams,
  body: z.object({ reason: z.string().trim().max(500).optional() }).optional().default({}),
};

export const passIdSchema = { params: idParams };
