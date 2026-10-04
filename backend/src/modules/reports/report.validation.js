import { z } from "zod";
import { MEETING_STATUS } from "../../config/constants.js";
import { dateRangeQuery, objectId, paginationQuery, refineDateRange } from "../../utils/validators.js";

export const dateRangeSchema = {
  query: z.object({ ...dateRangeQuery }).superRefine(refineDateRange),
};

export const visitorHistoryReportSchema = {
  query: z
    .object({
      ...paginationQuery,
      ...dateRangeQuery,
      visitor: objectId.optional(),
      hostEmployee: objectId.optional(),
      q: z.string().trim().max(100).optional(),
    })
    .superRefine(refineDateRange),
};

export const meetingHistoryReportSchema = {
  query: z
    .object({
      ...paginationQuery,
      ...dateRangeQuery,
      status: z.enum([MEETING_STATUS.COMPLETED, MEETING_STATUS.CANCELLED]).optional(),
      organizer: objectId.optional(),
      room: objectId.optional(),
    })
    .superRefine(refineDateRange),
};
