import { z } from "zod";
import { MEETING_STATUS } from "../../config/constants.js";
import {
  dateRangeQuery,
  idParams,
  isoDate,
  objectId,
  paginationQuery,
  refineDateRange,
} from "../../utils/validators.js";

export const MAX_MEETING_HOURS = 12;
const START_GRACE_MS = 5 * 60 * 1000;

const attendees = z.array(objectId).max(200);

export function refineMeetingTimes(data, ctx) {
  if (!data.startAt || !data.endAt) return;
  if (data.endAt <= data.startAt) {
    ctx.addIssue({ code: "custom", path: ["endAt"], message: "endAt must be after startAt" });
  }
  if (data.endAt - data.startAt > MAX_MEETING_HOURS * 60 * 60 * 1000) {
    ctx.addIssue({
      code: "custom",
      path: ["endAt"],
      message: `A meeting cannot be longer than ${MAX_MEETING_HOURS} hours`,
    });
  }
  if (data.startAt.getTime() < Date.now() - START_GRACE_MS) {
    ctx.addIssue({ code: "custom", path: ["startAt"], message: "startAt cannot be in the past" });
  }
}

export const createMeetingSchema = {
  body: z
    .object({
      title: z.string().trim().min(2).max(200),
      description: z.string().trim().max(2000).optional(),
      room: objectId,
      startAt: isoDate,
      endAt: isoDate,
      attendees: attendees.optional(),
      organizer: objectId.optional(),
    })
    .superRefine(refineMeetingTimes),
};

export const updateMeetingSchema = {
  params: idParams,
  body: z
    .object({
      title: z.string().trim().min(2).max(200).optional(),
      description: z.string().trim().max(2000).optional(),
      room: objectId.optional(),
      startAt: isoDate.optional(),
      endAt: isoDate.optional(),
      attendees: attendees.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" }),
};

export const cancelMeetingSchema = {
  params: idParams,
  body: z.object({ reason: z.string().trim().max(500).optional() }).optional().default({}),
};

export const listMeetingsSchema = {
  query: z
    .object({
      ...paginationQuery,
      ...dateRangeQuery,
      status: z.enum(Object.values(MEETING_STATUS)).optional(),
      room: objectId.optional(),
      organizer: objectId.optional(),
    })
    .superRefine(refineDateRange),
};

export const upcomingMeetingsSchema = {
  query: z.object({
    days: z.coerce.number().int().min(1).max(90).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
};

export const meetingIdSchema = { params: idParams };
