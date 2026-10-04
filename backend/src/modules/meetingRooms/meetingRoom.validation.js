import { z } from "zod";
import { ROOM_STATUS } from "../../config/constants.js";
import {
  booleanString,
  idParams,
  isoDate,
  paginationQuery,
} from "../../utils/validators.js";

const fields = {
  name: z.string().trim().min(1).max(120),
  roomNumber: z.string().trim().min(1).max(30),
  location: z.string().trim().max(200).optional(),
  capacity: z.coerce.number().int().min(1).max(1000),
  facilities: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
  status: z.enum(Object.values(ROOM_STATUS)).optional(),
  description: z.string().trim().max(1000).optional(),
  isActive: z.boolean().optional(),
};

export const createRoomSchema = { body: z.object(fields) };

export const updateRoomSchema = {
  params: idParams,
  body: z
    .object({
      name: fields.name.optional(),
      roomNumber: fields.roomNumber.optional(),
      location: fields.location,
      capacity: fields.capacity.optional(),
      facilities: fields.facilities,
      status: fields.status,
      description: fields.description,
      isActive: fields.isActive,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field is required",
    }),
};

export const listRoomsSchema = {
  query: z.object({
    ...paginationQuery,
    q: z.string().trim().max(100).optional(),
    status: z.enum(Object.values(ROOM_STATUS)).optional(),
    isActive: booleanString.optional(),
    minCapacity: z.coerce.number().int().min(1).optional(),
  }),
};

export const availabilitySchema = {
  query: z
    .object({
      startAt: isoDate,
      endAt: isoDate,
      capacity: z.coerce.number().int().min(1).optional(),
    })
    .refine((data) => data.endAt > data.startAt, {
      path: ["endAt"],
      message: "endAt must be after startAt",
    }),
};

export const roomIdSchema = { params: idParams };
