import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import amqp from 'amqplib';
import { notificationRouter } from './routes/notifications.js';
import { adminNotificationRouter } from './routes/adminNotifications.js';
import { authMiddleware } from './middleware/auth.js';
import { Notification } from './models/Notification.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvWalkingUp(startDir) {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 8; i++) {
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}
loadEnvWalkingUp(__dirname);

const PORT = process.env.PORT || 3002;
const MONGODB_URI =
  process.env.NOTIFICATION_MONGODB_URI ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/notification_db';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const JWT_SECRET = process.env.JWT_SECRET || 'ecommerce-jwt-secret-key-for-development-min-256-bits-long-for-hs256-algorithm-safety';

await mongoose.connect(MONGODB_URI);

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'UP' }));
app.use('/notifications/admin', authMiddleware(JWT_SECRET), adminNotificationRouter);
app.use('/notifications', authMiddleware(JWT_SECRET), notificationRouter);
app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`notification-service on ${PORT}`));

async function startConsumer() {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 10; i++) {
    try {
      const conn = await amqp.connect(RABBITMQ_URL);
      const ch = await conn.createChannel();
      const ex = 'ecom.events';
      await ch.assertExchange(ex, 'topic', { durable: true });
      const q = await ch.assertQueue('notification_queue', { durable: true });
      await ch.bindQueue(q.queue, ex, 'order.#');
      await ch.bindQueue(q.queue, ex, 'payment.#');
      ch.consume(q.queue, async (msg) => {
        if (!msg) return;
        try {
          const payload = JSON.parse(msg.content.toString());
          const userId = payload.userId;
          if (!userId) {
            ch.ack(msg);
            return;
          }
          let title = 'Update';
          let body = JSON.stringify(payload);
          let channel = 'in_app';
          if (payload.type === 'ORDER_PLACED') {
            title = 'Order placed';
            body = `Order ${payload.orderId} was placed.`;
          } else if (payload.type === 'ORDER_STATUS') {
            title = 'Order status';
            body = `Order ${payload.orderId} is now ${payload.status}.`;
          } else if (payload.type === 'ORDER_CANCELLED') {
            title = 'Order cancelled';
            body = `Order ${payload.orderId} was cancelled.`;
          } else if (payload.type === 'PAYMENT_SUCCESS') {
            title = 'Payment successful';
            body = `Payment for order ${payload.orderId} succeeded.`;
          } else if (payload.type === 'PAYMENT_FAILED') {
            title = 'Payment failed';
            body = `Payment for order ${payload.orderId} failed.`;
          } else if (payload.type === 'PAYMENT_REFUNDED') {
            title = 'Refund processed';
            body = `Payment ${payload.paymentId} refunded.`;
          }
          await Notification.create({
            userId,
            title,
            body,
            channel,
            read: false,
            emailSimulated: true,
          });
          console.log(`[email-sim] to user ${userId}: ${title} — ${body}`);
        } catch (e) {
          console.error(e);
        }
        ch.ack(msg);
      });
      console.log('RabbitMQ consumer ready');
      return;
    } catch (e) {
      console.warn('RabbitMQ connect failed, retry...', e.message);
      await sleep(3000);
    }
  }
}

if (process.env.RABBITMQ_ENABLED !== 'false') {
  startConsumer();
} else {
  console.log('RabbitMQ consumer disabled (set RABBITMQ_ENABLED=false for local without RabbitMQ)');
}
