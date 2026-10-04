import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

mongoose.set("strictQuery", true);

export async function connectDB(uri = env.MONGODB_URI) {
  const options = {};
  if (env.MONGODB_DB_NAME) options.dbName = env.MONGODB_DB_NAME;

  await mongoose.connect(uri, options);
  logger.info(`MongoDB connected (${mongoose.connection.name})`);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
