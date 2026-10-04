import { env } from "../config/env.js";
import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../modules/users/user.model.js";
import { Department } from "../modules/departments/department.model.js";
import { MeetingRoom } from "../modules/meetingRooms/meetingRoom.model.js";
import { ROLES } from "../config/constants.js";

const departments = [
  {
    name: "Administration",
    code: "ADMIN",
    description: "Office administration",
  },
  {
    name: "Human Resources",
    code: "HR",
    description: "People and recruitment",
  },
  {
    name: "Information Technology",
    code: "IT",
    description: "Technology and infrastructure",
  },
  { name: "Finance", code: "FIN", description: "Accounts and finance" },
  { name: "Front Desk", code: "FD", description: "Reception and security" },
];

const rooms = [
  {
    name: "Room 101",
    roomNumber: "101",
    location: "Ground floor",
    capacity: 6,
    facilities: ["TV", "Whiteboard"],
  },
  {
    name: "Room 102",
    roomNumber: "102",
    location: "Ground floor",
    capacity: 4,
    facilities: ["Whiteboard"],
  },
  {
    name: "Conference Hall",
    roomNumber: "201",
    location: "First floor",
    capacity: 20,
    facilities: ["Projector", "Video conferencing", "Microphone"],
  },
  {
    name: "Board Room",
    roomNumber: "301",
    location: "Second floor",
    capacity: 12,
    facilities: ["Projector", "Video conferencing"],
  },
];

async function seed() {
  if (!env.ADMIN_EMAIL) {
    console.error("ADMIN_EMAIL is required to seed the first admin user");
    process.exit(1);
  }

  await connectDB();
  await Promise.all([
    User.syncIndexes(),
    Department.syncIndexes(),
    MeetingRoom.syncIndexes(),
  ]);

  for (const department of departments) {
    await Department.updateOne(
      { code: department.code },
      { $setOnInsert: department },
      { upsert: true },
    );
  }

  for (const room of rooms) {
    await MeetingRoom.updateOne(
      { roomNumber: room.roomNumber },
      { $setOnInsert: room },
      { upsert: true },
    );
  }

  const adminDepartment = await Department.findOne({ code: "ADMIN" });
  const email = env.ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = ROLES.ADMIN;
    existing.isActive = true;
    await existing.save();
    console.log(`Existing user ${email} promoted to admin`);
  } else {
    await User.create({
      name: env.ADMIN_NAME || "System Administrator",
      email,
      role: ROLES.ADMIN,
      department: adminDepartment?._id,
      employeeId: "EMP-0001",
    });
    console.log(`Admin user ${email} created`);
  }

  console.log(
    `Seeded ${departments.length} departments and ${rooms.length} meeting rooms`,
  );
  console.log(
    `Sign up / sign in with ${email} through Better Auth to use the admin account.`,
  );
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
