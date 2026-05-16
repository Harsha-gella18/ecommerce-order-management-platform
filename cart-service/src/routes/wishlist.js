import { Router } from 'express';
import { Wishlist } from '../models/Wishlist.js';

export const wishlistRouter = Router();

wishlistRouter.get('/', async (req, res, next) => {
  try {
    let doc = await Wishlist.findOne({ userId: req.userId });
    if (!doc) doc = await Wishlist.create({ userId: req.userId, items: [] });
    res.json({ userId: doc.userId, items: doc.items });
  } catch (e) {
    next(e);
  }
});

wishlistRouter.post('/items', async (req, res, next) => {
  try {
    const { productId: rawId, name, price, image } = req.body;
    const productId = rawId != null && rawId !== '' ? String(rawId) : '';
    if (!productId) {
      return res.status(400).json({ error: 'productId required' });
    }
    let doc = await Wishlist.findOne({ userId: req.userId });
    if (!doc) doc = new Wishlist({ userId: req.userId, items: [] });
    if (doc.items.some((i) => String(i.productId) === productId)) {
      return res.status(200).json({ userId: doc.userId, items: doc.items });
    }
    doc.items.push({
      productId,
      name: name || '',
      price: price != null ? Number(price) : 0,
      image: image || '',
    });
    await doc.save();
    res.status(201).json({ userId: doc.userId, items: doc.items });
  } catch (e) {
    next(e);
  }
});

wishlistRouter.delete('/items/:productId', async (req, res, next) => {
  try {
    const pid = String(req.params.productId);
    const doc = await Wishlist.findOne({ userId: req.userId });
    if (!doc) return res.status(404).json({ error: 'Wishlist not found' });
    doc.items = doc.items.filter((i) => String(i.productId) !== pid);
    await doc.save();
    res.json({ userId: doc.userId, items: doc.items });
  } catch (e) {
    next(e);
  }
});

wishlistRouter.delete('/clear', async (req, res, next) => {
  try {
    await Wishlist.findOneAndUpdate({ userId: req.userId }, { $set: { items: [] } }, { upsert: true });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
