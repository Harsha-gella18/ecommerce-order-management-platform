import fs from 'fs';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { cartRouter } from './routes/cart.js';
import { authMiddleware } from './middleware/auth.js';

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

const PORT = process.env.PORT || 3001;
const MONGODB_URI =
  process.env.CART_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cart_db';
const JWT_SECRET = process.env.JWT_SECRET || 'ecommerce-jwt-secret-key-for-development-min-256-bits-long-for-hs256-algorithm-safety';

await mongoose.connect(MONGODB_URI);

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'UP' }));

app.use('/cart', authMiddleware(JWT_SECRET), cartRouter);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`cart-service listening on ${PORT}`));
