import { z } from "zod";
import { IDENTITY_TYPES } from "../../config/constants.js";
import {
  email,
  idParams,
  paginationQuery,
  phone,
} from "../../utils/validators.js";

export const visitorFields = {
  fullName: z.string().trim().min(2).max(150),
  email: email.optional(),
  phone,
  organization: z.string().trim().max(150).optional(),
  address: z.string().trim().max(300).optional(),
  identityType: z.enum(IDENTITY_TYPES).optional(),
  identityNumber: z.string().trim().min(3).max(50).optional(),
  photo: z.string().trim().url().optional(),
  emergencyContact: z
    .object({
      name: z.string().trim().max(150).optional(),
      phone: phone.optional(),
      relationship: z.string().trim().max(60).optional(),
    })
    .optional(),
};

/** Inline visitor details accepted by appointment and walk-in creation. */
export const visitorDetailsSchema = z.object(visitorFields);

export const createVisitorSchema = { body: visitorDetailsSchema };

export const updateVisitorSchema = {
  params: idParams,
  body: z
    .object({
      fullName: visitorFields.fullName.optional(),
      email: visitorFields.email,
      phone: visitorFields.phone.optional(),
      organization: visitorFields.organization,
      address: visitorFields.address,
      identityType: visitorFields.identityType,
      identityNumber: visitorFields.identityNumber,
      photo: visitorFields.photo,
      emergencyContact: visitorFields.emergencyContact,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
};

export const listVisitorsSchema = {
  query: z.object({
    ...paginationQuery,
    q: z.string().trim().max(100).optional(),
    organization: z.string().trim().max(150).optional(),
  }),
};

export const searchVisitorsSchema = {
  query: z.object({
    q: z.string().trim().min(1, "Search query is required").max(100),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
};

export const visitorHistorySchema = {
  params: idParams,
  query: z.object({ ...paginationQuery }),
};

export const visitorIdSchema = { params: idParams };
