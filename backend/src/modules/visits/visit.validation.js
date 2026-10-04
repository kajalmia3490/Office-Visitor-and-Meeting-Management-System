import { z } from "zod";
import { VISIT_STATUS, VISIT_TYPE } from "../../config/constants.js";
import { visitorDetailsSchema } from "../visitors/visitor.validation.js";
import { passOptionsSchema } from "../visitorPasses/visitorPass.validation.js";
import {
  dateRangeQuery,
  idParams,
  objectId,
  paginationQuery,
  refineDateRange,
} from "../../utils/validators.js";

const passOptions = {
  issuePass: z.boolean().optional(),
  pass: passOptionsSchema.optional(),
};

export const walkInSchema = {
  body: z
    .object({
      visitor: objectId.optional(),
      visitorDetails: visitorDetailsSchema.optional(),
      hostEmployee: objectId,
      purpose: z.string().trim().min(2).max(500),
      notes: z.string().trim().max(1000).optional(),
      ...passOptions,
    })
    .refine((data) => Boolean(data.visitor) !== Boolean(data.visitorDetails), {
      path: ["visitor"],
      message: "Provide either visitor (id) or visitorDetails, but not both",
    }),
};

export const checkInSchema = {
  params: idParams,
  body: z
    .object({
      notes: z.string().trim().max(1000).optional(),
      ...passOptions,
    })
    .optional()
    .default({}),
};

export const checkOutSchema = {
  params: idParams,
  body: z.object({ notes: z.string().trim().max(1000).optional() }).optional().default({}),
};

export const listVisitsSchema = {
  query: z
    .object({
      ...paginationQuery,
      ...dateRangeQuery,
      status: z.enum(Object.values(VISIT_STATUS)).optional(),
      visitType: z.enum(Object.values(VISIT_TYPE)).optional(),
      hostEmployee: objectId.optional(),
      visitor: objectId.optional(),
    })
    .superRefine(refineDateRange),
};

export const visitIdSchema = { params: idParams };
