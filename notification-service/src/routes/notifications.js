import { Router } from 'express';
import { Notification } from '../models/Notification.js';

export const notificationRouter = Router();

notificationRouter.get('/', async (req, res, next) => {
  try {
    const list = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(100);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

notificationRouter.put('/:id/read', async (req, res, next) => {
  try {
    const n = await Notification.findOne({ _id: req.params.id, userId: req.userId });
    if (!n) return res.status(404).json({ error: 'Not found' });
    n.read = true;
    await n.save();
    res.json(n);
  } catch (e) {
    next(e);
  }
});
