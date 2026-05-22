import Notification from '../models/Notification.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found', statusCode: 404 });
    }

    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true, data: { message: 'All notifications marked as read' } });
  } catch (err) {
    next(err);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found', statusCode: 404 });
    }

    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};

// Helper to create a notification — used internally by other controllers
export const createNotification = async ({ userId, type, title, message, link = '' }) => {
  try {
    await Notification.create({ user: userId, type, title, message, link });
  } catch (err) {
    // Non-fatal — don't propagate notification creation errors
    console.error('Failed to create notification:', err.message);
  }
};
