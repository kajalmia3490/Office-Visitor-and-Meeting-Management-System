import { Notification } from "./notification.model.js";
import { emitToUser } from "../../socket.js";
import { ApiError } from "../../utils/ApiError.js";
import { logger } from "../../utils/logger.js";
import { paginate } from "../../utils/pagination.js";

/**
 * Persists a notification and pushes it over Socket.IO when available.
 * Delivery failures never break the business operation that triggered it.
 */
export async function notify({ recipient, type, title, message, relatedVisit, relatedMeeting, relatedAppointment }) {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedVisit: relatedVisit ?? null,
      relatedMeeting: relatedMeeting ?? null,
      relatedAppointment: relatedAppointment ?? null,
    });
    emitToUser(recipient, "notification:new", notification.toJSON());
    return notification;
  } catch (err) {
    logger.error(`Failed to create notification (${type}): ${err.message}`);
    return null;
  }
}

export async function notifyMany(recipients, payload) {
  const unique = [...new Set(recipients.filter(Boolean).map(String))];
  return Promise.all(unique.map((recipient) => notify({ ...payload, recipient })));
}

export async function listNotifications(userId, query, pagination) {
  const filter = { recipient: userId };
  if (query.isRead !== undefined) filter.isRead = query.isRead;
  if (query.type) filter.type = query.type;
  return paginate(Notification, filter, pagination);
}

export async function listUnread(userId, limit = 50) {
  const filter = { recipient: userId, isRead: false };
  const [items, count] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(limit),
    Notification.countDocuments(filter),
  ]);
  return { items, count };
}

export async function markAsRead(userId, id) {
  const notification = await Notification.findOne({ _id: id, recipient: userId });
  if (!notification) throw ApiError.notFound("Notification not found", "NOTIFICATION_NOT_FOUND");

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }
  return notification;
}

export async function markAllAsRead(userId) {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } },
  );
  return { updated: result.modifiedCount };
}
