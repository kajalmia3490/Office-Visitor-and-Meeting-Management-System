import * as service from "./notification.service.js";
import { getPagination } from "../../utils/pagination.js";
import { sendSuccess } from "../../utils/response.js";

export async function list(req, res) {
  const { items, meta } = await service.listNotifications(
    req.user._id,
    req.query,
    getPagination(req.query),
  );
  return sendSuccess(res, {
    message: "Notifications retrieved successfully",
    data: items,
    meta,
  });
}

export async function unread(req, res) {
  const { items, count } = await service.listUnread(
    req.user._id,
    req.query.limit,
  );
  return sendSuccess(res, {
    message: "Unread notifications retrieved successfully",
    data: items,
    meta: { unreadCount: count },
  });
}

export async function markRead(req, res) {
  const notification = await service.markAsRead(req.user._id, req.params.id);
  return sendSuccess(res, {
    message: "Notification marked as read",
    data: notification,
  });
}

export async function markAllRead(req, res) {
  const result = await service.markAllAsRead(req.user._id);
  return sendSuccess(res, {
    message: "All notifications marked as read",
    data: result,
  });
}
