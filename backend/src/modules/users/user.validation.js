import { z } from "zod";
import { ROLE_VALUES } from "../../config/constants.js";
import {
  booleanString,
  email,
  idParams,
  objectId,
  paginationQuery,
  phone,
} from "../../utils/validators.js";

const userFields = {
  name: z.string().trim().min(2).max(120),
  email,
  phone: phone.optional(),
  role: z.enum(ROLE_VALUES),
  department: objectId.nullable().optional(),
  employeeId: z.string().trim().min(1).max(50).optional(),
  profileImage: z.string().trim().url().optional(),
};

export const createUserSchema = {
  body: z.object({
    ...userFields,
    role: userFields.role.default("employee"),
    isActive: z.boolean().optional(),
  }),
};

export const updateUserSchema = {
  params: idParams,
  body: z
    .object({
      name: userFields.name.optional(),
      email: userFields.email.optional(),
      phone: userFields.phone,
      role: userFields.role.optional(),
      department: userFields.department,
      employeeId: userFields.employeeId,
      profileImage: userFields.profileImage,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
};

export const updateUserStatusSchema = {
  params: idParams,
  body: z.object({ isActive: z.boolean() }),
};

export const listUsersSchema = {
  query: z.object({
    ...paginationQuery,
    q: z.string().trim().max(100).optional(),
    role: z.enum(ROLE_VALUES).optional(),
    department: objectId.optional(),
    isActive: booleanString.optional(),
  }),
};

export const userIdSchema = { params: idParams };
