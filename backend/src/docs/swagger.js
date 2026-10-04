import { env } from "../config/env.js";

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
};
const pageParams = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
  {
    name: "limit",
    in: "query",
    schema: { type: "integer", minimum: 1, maximum: 100 },
  },
];
const rangeParams = [
  {
    name: "from",
    in: "query",
    schema: { type: "string", format: "date-time" },
  },
  { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
];
const q = (name, description) => ({
  name,
  in: "query",
  description,
  schema: { type: "string" },
});

function op(
  tag,
  summary,
  { roles, params = [], body, status = 200, description } = {},
) {
  const responses = {
    [status]: {
      description: status === 204 ? "No content" : "Success",
      content:
        status === 204
          ? undefined
          : { "application/json": { schema: ref("SuccessResponse") } },
    },
    401: { $ref: "#/components/responses/Unauthenticated" },
    403: { $ref: "#/components/responses/Forbidden" },
    422: { $ref: "#/components/responses/ValidationError" },
  };
  return {
    tags: [tag],
    summary,
    description:
      [description, roles && `**Roles:** ${roles}`]
        .filter(Boolean)
        .join("\n\n") || undefined,
    parameters: params,
    ...(body && {
      requestBody: {
        required: true,
        content: { "application/json": { schema: body } },
      },
    }),
    responses,
  };
}

const ALL = "any authenticated user";

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Office Visitor & Meeting Management API",
    version: "1.0.0",
    description:
      "Backend API for visitor registration, appointments, meetings, meeting rooms, check-in/out, " +
      "notifications, visitor passes, reports and audit logs.\n\n" +
      "Authentication is handled by Better Auth at `/api/auth/*` (e.g. `POST /api/auth/sign-in/email`, " +
      "`POST /api/auth/sign-up/email`, `POST /api/auth/sign-in/social` with `provider: google`). " +
      "The session cookie it sets authenticates every `/api/v1` request.",
  },
  servers: [{ url: `${env.BETTER_AUTH_URL}/api/v1` }],
  security: [{ sessionCookie: [] }],
  tags: [
    "Auth",
    "Users",
    "Departments",
    "Visitors",
    "Appointments",
    "Meetings",
    "Meeting Rooms",
    "Visits",
    "Notifications",
    "Visitor Passes",
    "Dashboard",
    "Reports",
    "Audit Logs",
  ].map((name) => ({ name })),
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
      },
    },
    responses: {
      Unauthenticated: {
        description: "Authentication required",
        content: { "application/json": { schema: ref("ErrorResponse") } },
      },
      Forbidden: {
        description: "Not allowed for this role",
        content: { "application/json": { schema: ref("ErrorResponse") } },
      },
      ValidationError: {
        description: "Validation failed",
        content: { "application/json": { schema: ref("ErrorResponse") } },
      },
    },
    schemas: {
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: {},
          meta: { type: "object" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: {
            type: "string",
            example: "Meeting room is already booked",
          },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "ROOM_CONFLICT" },
              details: {},
            },
          },
        },
      },
      UserInput: {
        type: "object",
        required: ["name", "email"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          role: {
            type: "string",
            enum: [
              "admin",
              "receptionist",
              "security",
              "employee",
              "management",
            ],
          },
          department: { type: "string" },
          employeeId: { type: "string" },
          profileImage: { type: "string", format: "uri" },
        },
      },
      DepartmentInput: {
        type: "object",
        required: ["name", "code"],
        properties: {
          name: { type: "string" },
          code: { type: "string" },
          description: { type: "string" },
          head: { type: "string" },
          isActive: { type: "boolean" },
        },
      },
      VisitorInput: {
        type: "object",
        required: ["fullName", "phone"],
        properties: {
          fullName: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          organization: { type: "string" },
          address: { type: "string" },
          identityType: {
            type: "string",
            enum: ["national_id", "passport", "driving_license", "other"],
          },
          identityNumber: { type: "string" },
          photo: { type: "string", format: "uri" },
          emergencyContact: {
            type: "object",
            properties: {
              name: { type: "string" },
              phone: { type: "string" },
              relationship: { type: "string" },
            },
          },
        },
      },
      AppointmentInput: {
        type: "object",
        required: ["purpose", "scheduledStartAt", "scheduledEndAt"],
        properties: {
          visitor: {
            type: "string",
            description: "Existing visitor id (or use visitorDetails)",
          },
          visitorDetails: ref("VisitorInput"),
          hostEmployee: {
            type: "string",
            description:
              "Required for admin/receptionist; employees always host",
          },
          meeting: { type: "string" },
          purpose: { type: "string" },
          scheduledStartAt: { type: "string", format: "date-time" },
          scheduledEndAt: { type: "string", format: "date-time" },
          notes: { type: "string" },
        },
      },
      MeetingInput: {
        type: "object",
        required: ["title", "room", "startAt", "endAt"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          room: { type: "string" },
          startAt: { type: "string", format: "date-time" },
          endAt: { type: "string", format: "date-time" },
          attendees: { type: "array", items: { type: "string" } },
          organizer: { type: "string", description: "Admin only" },
        },
      },
      MeetingRoomInput: {
        type: "object",
        required: ["name", "roomNumber", "capacity"],
        properties: {
          name: { type: "string" },
          roomNumber: { type: "string" },
          location: { type: "string" },
          capacity: { type: "integer" },
          facilities: { type: "array", items: { type: "string" } },
          status: {
            type: "string",
            enum: ["available", "maintenance", "inactive"],
          },
          description: { type: "string" },
          isActive: { type: "boolean" },
        },
      },
      PassOptions: {
        type: "object",
        properties: {
          expiresAt: { type: "string", format: "date-time" },
          validHours: { type: "number", maximum: 72 },
        },
      },
      WalkInInput: {
        type: "object",
        required: ["hostEmployee", "purpose"],
        properties: {
          visitor: { type: "string" },
          visitorDetails: ref("VisitorInput"),
          hostEmployee: { type: "string" },
          purpose: { type: "string" },
          notes: { type: "string" },
          issuePass: { type: "boolean", default: true },
          pass: ref("PassOptions"),
        },
      },
      CheckInInput: {
        type: "object",
        properties: {
          notes: { type: "string" },
          issuePass: { type: "boolean" },
          pass: ref("PassOptions"),
        },
      },
      ReasonInput: {
        type: "object",
        properties: { reason: { type: "string" } },
      },
    },
  },
  paths: {
    "/auth/me": {
      get: op("Auth", "Current authenticated application user", { roles: ALL }),
    },
    "/auth/logout": {
      post: op("Auth", "Sign out (clears the Better Auth session)", {
        roles: ALL,
      }),
    },

    "/users": {
      get: op("Users", "List users", {
        roles:
          "admin, management (full); other roles get an active-user directory",
        params: [
          ...pageParams,
          q("q", "Search name/email/employeeId"),
          q("role"),
          q("department"),
          q("isActive"),
        ],
      }),
      post: op("Users", "Create user", {
        roles: "admin",
        body: ref("UserInput"),
        status: 201,
      }),
    },
    "/users/{id}": {
      get: op("Users", "Get user", {
        roles: "admin, management, or self",
        params: [idParam],
      }),
      patch: op("Users", "Update user", {
        roles: "admin",
        params: [idParam],
        body: ref("UserInput"),
      }),
      delete: op("Users", "Delete user (only if unreferenced)", {
        roles: "admin",
        params: [idParam],
        status: 204,
      }),
    },
    "/users/{id}/status": {
      patch: op("Users", "Activate/deactivate user", {
        roles: "admin",
        params: [idParam],
        body: {
          type: "object",
          required: ["isActive"],
          properties: { isActive: { type: "boolean" } },
        },
      }),
    },

    "/departments": {
      get: op("Departments", "List departments", {
        roles: "admin, management",
        params: [...pageParams, q("q"), q("isActive")],
      }),
      post: op("Departments", "Create department", {
        roles: "admin",
        body: ref("DepartmentInput"),
        status: 201,
      }),
    },
    "/departments/{id}": {
      get: op("Departments", "Get department", {
        roles: "admin, management",
        params: [idParam],
      }),
      patch: op("Departments", "Update department", {
        roles: "admin",
        params: [idParam],
        body: ref("DepartmentInput"),
      }),
      delete: op("Departments", "Delete department", {
        roles: "admin",
        params: [idParam],
        status: 204,
      }),
    },

    "/visitors": {
      get: op("Visitors", "List visitors", {
        roles: "admin, receptionist, security, management",
        params: [...pageParams, q("q"), q("organization")],
      }),
      post: op("Visitors", "Register visitor", {
        roles: "admin, receptionist",
        body: ref("VisitorInput"),
        status: 201,
      }),
    },
    "/visitors/search": {
      get: op(
        "Visitors",
        "Search visitors by name, phone, email, identity number or organization",
        {
          roles:
            "admin, receptionist, security, management, employee (identity masked)",
          params: [
            { ...q("q"), required: true },
            { name: "limit", in: "query", schema: { type: "integer" } },
          ],
        },
      ),
    },
    "/visitors/{id}": {
      get: op("Visitors", "Get visitor", {
        roles: "admin, receptionist, security, management",
        params: [idParam],
      }),
      patch: op("Visitors", "Update visitor", {
        roles: "admin, receptionist",
        params: [idParam],
        body: ref("VisitorInput"),
      }),
      delete: op("Visitors", "Delete visitor (only without history)", {
        roles: "admin",
        params: [idParam],
        status: 204,
      }),
    },
    "/visitors/{id}/history": {
      get: op("Visitors", "Visitor visit/appointment history", {
        roles:
          "admin, receptionist, security, management; employees see only visits they hosted",
        params: [idParam, ...pageParams],
      }),
    },

    "/appointments": {
      get: op("Appointments", "List appointments", {
        roles: "all roles; employees see appointments they host or created",
        params: [
          ...pageParams,
          ...rangeParams,
          q("status"),
          q("hostEmployee"),
          q("visitor"),
        ],
      }),
      post: op("Appointments", "Create appointment", {
        roles: "admin, receptionist, employee",
        description:
          "Auto-approved (and an expected visit created) when the creator is the host.",
        body: ref("AppointmentInput"),
        status: 201,
      }),
    },
    "/appointments/{id}": {
      get: op("Appointments", "Get appointment", {
        roles: ALL,
        params: [idParam],
      }),
      patch: op("Appointments", "Update appointment", {
        roles: "admin, receptionist, host, creator",
        params: [idParam],
        body: ref("AppointmentInput"),
      }),
    },
    "/appointments/{id}/approve": {
      patch: op(
        "Appointments",
        "Approve appointment (creates expected visit)",
        { roles: "host employee or admin", params: [idParam] },
      ),
    },
    "/appointments/{id}/reject": {
      patch: op("Appointments", "Reject appointment", {
        roles: "host employee or admin",
        params: [idParam],
        body: ref("ReasonInput"),
      }),
    },
    "/appointments/{id}/cancel": {
      patch: op("Appointments", "Cancel appointment", {
        roles: "admin, receptionist, host, creator",
        params: [idParam],
        body: ref("ReasonInput"),
      }),
    },

    "/meetings": {
      get: op("Meetings", "List meetings", {
        roles:
          "admin, management (all); others see meetings they organize or attend",
        params: [
          ...pageParams,
          ...rangeParams,
          q("status"),
          q("room"),
          q("organizer"),
        ],
      }),
      post: op(
        "Meetings",
        "Create meeting (409 ROOM_CONFLICT when the room is booked)",
        { roles: "admin, employee", body: ref("MeetingInput"), status: 201 },
      ),
    },
    "/meetings/upcoming": {
      get: op("Meetings", "Upcoming meetings", {
        roles: ALL,
        params: [
          { name: "days", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
      }),
    },
    "/meetings/my-meetings": {
      get: op("Meetings", "Meetings I organize or attend", {
        roles: ALL,
        params: [...pageParams, ...rangeParams, q("status")],
      }),
    },
    "/meetings/{id}": {
      get: op("Meetings", "Get meeting", {
        roles: "admin, management, participants",
        params: [idParam],
      }),
      patch: op("Meetings", "Update meeting (re-checks room conflicts)", {
        roles: "organizer or admin",
        params: [idParam],
        body: ref("MeetingInput"),
      }),
    },
    "/meetings/{id}/cancel": {
      patch: op("Meetings", "Cancel meeting", {
        roles: "organizer or admin",
        params: [idParam],
        body: ref("ReasonInput"),
      }),
    },

    "/meeting-rooms": {
      get: op("Meeting Rooms", "List meeting rooms", {
        roles: ALL,
        params: [
          ...pageParams,
          q("q"),
          q("status"),
          q("isActive"),
          q("minCapacity"),
        ],
      }),
      post: op("Meeting Rooms", "Create meeting room", {
        roles: "admin",
        body: ref("MeetingRoomInput"),
        status: 201,
      }),
    },
    "/meeting-rooms/availability": {
      get: op("Meeting Rooms", "Rooms free for a time window", {
        roles: ALL,
        params: [
          {
            name: "startAt",
            in: "query",
            required: true,
            schema: { type: "string", format: "date-time" },
          },
          {
            name: "endAt",
            in: "query",
            required: true,
            schema: { type: "string", format: "date-time" },
          },
          { name: "capacity", in: "query", schema: { type: "integer" } },
        ],
      }),
    },
    "/meeting-rooms/{id}": {
      get: op("Meeting Rooms", "Get meeting room", {
        roles: ALL,
        params: [idParam],
      }),
      patch: op("Meeting Rooms", "Update meeting room", {
        roles: "admin",
        params: [idParam],
        body: ref("MeetingRoomInput"),
      }),
      delete: op(
        "Meeting Rooms",
        "Delete meeting room (only without meetings)",
        { roles: "admin", params: [idParam], status: 204 },
      ),
    },

    "/visits": {
      get: op("Visits", "List visits", {
        roles:
          "admin, receptionist, security, management; employees see visits they host",
        params: [
          ...pageParams,
          ...rangeParams,
          q("status"),
          q("visitType"),
          q("hostEmployee"),
          q("visitor"),
        ],
      }),
    },
    "/visits/walk-in": {
      post: op("Visits", "Register and check in a walk-in visitor", {
        roles: "admin, receptionist",
        body: ref("WalkInInput"),
        status: 201,
      }),
    },
    "/visits/active": {
      get: op("Visits", "Currently checked-in visitors", {
        roles: "admin, receptionist, security, management",
      }),
    },
    "/visits/today": {
      get: op("Visits", "Today's visits", {
        roles: "admin, receptionist, security, management; employees (own)",
      }),
    },
    "/visits/{id}": {
      get: op("Visits", "Get visit", {
        roles: "staff; employees (own)",
        params: [idParam],
      }),
    },
    "/visits/{id}/check-in": {
      post: op(
        "Visits",
        "Check in an expected visit (409 if already checked in)",
        {
          roles: "admin, receptionist, security",
          params: [idParam],
          body: ref("CheckInInput"),
        },
      ),
    },
    "/visits/{id}/check-out": {
      post: op("Visits", "Check out a checked-in visit", {
        roles: "admin, receptionist, security",
        params: [idParam],
        body: { type: "object", properties: { notes: { type: "string" } } },
      }),
    },
    "/visits/{id}/pass": {
      get: op("Visits", "Latest pass for a visit", {
        roles: "staff; employees (own)",
        params: [idParam],
      }),
    },

    "/notifications": {
      get: op("Notifications", "My notifications", {
        roles: ALL,
        params: [...pageParams, q("isRead"), q("type")],
      }),
    },
    "/notifications/unread": {
      get: op("Notifications", "My unread notifications", { roles: ALL }),
    },
    "/notifications/read-all": {
      patch: op("Notifications", "Mark all my notifications as read", {
        roles: ALL,
      }),
    },
    "/notifications/{id}/read": {
      patch: op("Notifications", "Mark a notification as read", {
        roles: ALL,
        params: [idParam],
      }),
    },

    "/visitor-passes": {
      post: op("Visitor Passes", "Issue pass for a checked-in visit", {
        roles: "admin, receptionist",
        body: {
          allOf: [
            ref("PassOptions"),
            {
              type: "object",
              required: ["visit"],
              properties: { visit: { type: "string" } },
            },
          ],
        },
        status: 201,
      }),
    },
    "/visitor-passes/{id}": {
      get: op("Visitor Passes", "Get pass", {
        roles: "admin, receptionist, security",
        params: [idParam],
      }),
    },
    "/visitor-passes/verify/{passNumber}": {
      get: op("Visitor Passes", "Verify pass (returns valid flag and reason)", {
        roles: "admin, security",
        params: [
          {
            name: "passNumber",
            in: "path",
            required: true,
            schema: { type: "string", example: "VP-20261004-A1B2C3" },
          },
        ],
      }),
    },
    "/visitor-passes/{id}/revoke": {
      patch: op("Visitor Passes", "Revoke pass", {
        roles: "admin, receptionist, security",
        params: [idParam],
        body: ref("ReasonInput"),
      }),
    },

    "/dashboard/admin": {
      get: op("Dashboard", "Admin dashboard", { roles: "admin" }),
    },
    "/dashboard/reception": {
      get: op("Dashboard", "Reception/security dashboard", {
        roles: "admin, receptionist, security",
      }),
    },
    "/dashboard/employee": {
      get: op("Dashboard", "Personal dashboard", { roles: ALL }),
    },
    "/dashboard/management": {
      get: op("Dashboard", "Management dashboard", {
        roles: "admin, management",
      }),
    },

    "/reports/visitors": {
      get: op("Reports", "Visitor report", {
        roles: "admin, management, receptionist, security",
        params: rangeParams,
      }),
    },
    "/reports/meetings": {
      get: op("Reports", "Meeting report", {
        roles: "admin, management",
        params: rangeParams,
      }),
    },
    "/reports/rooms": {
      get: op("Reports", "Room utilization report", {
        roles: "admin, management",
        params: rangeParams,
      }),
    },
    "/reports/active-visitors": {
      get: op("Reports", "Active visitors report", {
        roles: "admin, management, receptionist, security",
      }),
    },
    "/reports/visitor-history": {
      get: op("Reports", "Visitor history report", {
        roles: "admin, management, receptionist, security",
        params: [
          ...pageParams,
          ...rangeParams,
          q("visitor"),
          q("hostEmployee"),
          q("q"),
        ],
      }),
    },
    "/reports/meeting-history": {
      get: op("Reports", "Meeting history report", {
        roles: "admin, management",
        params: [
          ...pageParams,
          ...rangeParams,
          q("status"),
          q("organizer"),
          q("room"),
        ],
      }),
    },

    "/audit-logs": {
      get: op("Audit Logs", "List audit logs", {
        roles: "admin",
        params: [
          ...pageParams,
          ...rangeParams,
          q("action"),
          q("module"),
          q("user"),
          q("targetId"),
        ],
      }),
    },
  },
};
