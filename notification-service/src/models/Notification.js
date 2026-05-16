import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  channel: { type: String, default: 'in_app' },
  read: { type: Boolean, default: false },
  emailSimulated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Notification = mongoose.model('Notification', NotificationSchema);
