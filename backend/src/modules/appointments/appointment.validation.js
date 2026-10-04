import { z } from "zod";
import { APPOINTMENT_STATUS } from "../../config/constants.js";
import { visitorDetailsSchema } from "../visitors/visitor.validation.js";
import {
  dateRangeQuery,
  idParams,
  isoDate,
  objectId,
  paginationQuery,
  refineDateRange,
} from "../../utils/validators.js";

function refineSchedule(data, ctx) {
  if (!data.scheduledStartAt || !data.scheduledEndAt) return;
  if (data.scheduledEndAt <= data.scheduledStartAt) {
    ctx.addIssue({
      code: "custom",
      path: ["scheduledEndAt"],
      message: "scheduledEndAt must be after scheduledStartAt",
    });
  }
  if (data.scheduledEndAt <= new Date()) {
    ctx.addIssue({ code: "custom", path: ["scheduledEndAt"], message: "scheduledEndAt must be in the future" });
  }
}

export const createAppointmentSchema = {
  body: z
    .object({
      visitor: objectId.optional(),
      visitorDetails: visitorDetailsSchema.optional(),
      hostEmployee: objectId.optional(),
      meeting: objectId.nullable().optional(),
      purpose: z.string().trim().min(2).max(500),
      scheduledStartAt: isoDate,
      scheduledEndAt: isoDate,
      notes: z.string().trim().max(1000).optional(),
    })
    .superRefine((data, ctx) => {
      if (Boolean(data.visitor) === Boolean(data.visitorDetails)) {
        ctx.addIssue({
          code: "custom",
          path: ["visitor"],
          message: "Provide either visitor (id) or visitorDetails, but not both",
        });
      }
      refineSchedule(data, ctx);
    }),
};

export const updateAppointmentSchema = {
  params: idParams,
  body: z
    .object({
      hostEmployee: objectId.optional(),
      meeting: objectId.nullable().optional(),
      purpose: z.string().trim().min(2).max(500).optional(),
      scheduledStartAt: isoDate.optional(),
      scheduledEndAt: isoDate.optional(),
      notes: z.string().trim().max(1000).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: "At least one field is required" }),
};

export const decisionSchema = {
  params: idParams,
  body: z.object({ reason: z.string().trim().max(500).optional() }).optional().default({}),
};

export const listAppointmentsSchema = {
  query: z
    .object({
      ...paginationQuery,
      ...dateRangeQuery,
      status: z.enum(Object.values(APPOINTMENT_STATUS)).optional(),
      hostEmployee: objectId.optional(),
      visitor: objectId.optional(),
    })
    .superRefine(refineDateRange),
};

export const appointmentIdSchema = { params: idParams };
