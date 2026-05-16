import { Router } from 'express';
import { Notification } from '../models/Notification.js';

export const adminNotificationRouter = Router();

function requireAdmin(req, res, next) {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

adminNotificationRouter.use(requireAdmin);

/** Send an in-app notification to one user. */
adminNotificationRouter.post('/send', async (req, res, next) => {
  try {
    const { userId, title, body } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ error: 'userId, title, body required' });
    }
    const n = await Notification.create({
      userId,
      title: String(title),
      body: String(body),
      channel: 'in_app',
      read: false,
      emailSimulated: false,
    });
    res.status(201).json(n);
  } catch (e) {
    next(e);
  }
});

/** Broadcast the same message to many users (IDs supplied by admin UI). */
adminNotificationRouter.post('/broadcast', async (req, res, next) => {
  try {
    const { userIds, title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'title, body required' });
    }
    const ids = Array.isArray(userIds) ? userIds.filter(Boolean) : [];
    if (ids.length === 0) {
      return res.status(400).json({ error: 'userIds must be a non-empty array' });
    }
    const docs = await Notification.insertMany(
      ids.map((userId) => ({
        userId,
        title: String(title),
        body: String(body),
        channel: 'in_app',
        read: false,
        emailSimulated: false,
      }))
    );
    res.status(201).json({ created: docs.length });
  } catch (e) {
    next(e);
  }
});

/** Recent notifications across all users (operations visibility). */
adminNotificationRouter.get('/recent', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const list = await Notification.find().sort({ createdAt: -1 }).limit(limit);
    res.json(list);
  } catch (e) {
    next(e);
  }
});
