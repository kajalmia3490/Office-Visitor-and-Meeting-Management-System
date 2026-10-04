import { z } from "zod";
import { NOTIFICATION_TYPES } from "../../config/constants.js";
import { booleanString, idParams, paginationQuery } from "../../utils/validators.js";

export const listNotificationsSchema = {
  query: z.object({
    ...paginationQuery,
    isRead: booleanString.optional(),
    type: z.enum(Object.values(NOTIFICATION_TYPES)).optional(),
  }),
};

export const unreadNotificationsSchema = {
  query: z.object({ limit: z.coerce.number().int().min(1).max(100).optional() }),
};

export const notificationIdSchema = { params: idParams };
