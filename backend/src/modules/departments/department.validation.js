import { z } from "zod";
import {
  booleanString,
  idParams,
  objectId,
  paginationQuery,
} from "../../utils/validators.js";

const fields = {
  name: z.string().trim().min(2).max(120),
  code: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Code may only contain letters, numbers, '-' and '_'",
    ),
  description: z.string().trim().max(1000).optional(),
  head: objectId.nullable().optional(),
  isActive: z.boolean().optional(),
};

export const createDepartmentSchema = {
  body: z.object(fields),
};

export const updateDepartmentSchema = {
  params: idParams,
  body: z
    .object({
      name: fields.name.optional(),
      code: fields.code.optional(),
      description: fields.description,
      head: fields.head,
      isActive: fields.isActive,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
};

export const listDepartmentsSchema = {
  query: z.object({
    ...paginationQuery,
    q: z.string().trim().max(100).optional(),
    isActive: booleanString.optional(),
  }),
};

export const departmentIdSchema = { params: idParams };
