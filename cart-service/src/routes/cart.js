import { Router } from 'express';
import { Cart } from '../models/Cart.js';
import { wishlistRouter } from './wishlist.js';

export const cartRouter = Router();

/** Nested so /cart/wishlist/* is never handled as an unknown path on the main cart router. */
cartRouter.use('/wishlist', wishlistRouter);

cartRouter.get('/', async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) cart = await Cart.create({ userId: req.userId, items: [] });
    res.json({ userId: cart.userId, items: cart.items });
  } catch (e) {
    next(e);
  }
});

cartRouter.post('/items', async (req, res, next) => {
  try {
    const { productId, name, price, quantity } = req.body;
    if (!productId || price == null || !quantity) {
      return res.status(400).json({ error: 'productId, price, quantity required' });
    }
    let cart = await Cart.findOne({ userId: req.userId });
    if (!cart) cart = new Cart({ userId: req.userId, items: [] });
    const existing = cart.items.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity += Number(quantity);
      existing.name = name || existing.name;
      existing.price = Number(price);
    } else {
      cart.items.push({
        productId,
        name: name || '',
        price: Number(price),
        quantity: Number(quantity),
      });
    }
    await cart.save();
    res.status(201).json({ userId: cart.userId, items: cart.items });
  } catch (e) {
    next(e);
  }
});

cartRouter.put('/items/:productId', async (req, res, next) => {
  try {
    const { quantity, name, price } = req.body;
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    const item = cart.items.find((i) => i.productId === req.params.productId);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (quantity != null) item.quantity = Math.max(1, Number(quantity));
    if (name != null) item.name = name;
    if (price != null) item.price = Number(price);
    await cart.save();
    res.json({ userId: cart.userId, items: cart.items });
  } catch (e) {
    next(e);
  }
});

cartRouter.delete('/items/:productId', async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    cart.items = cart.items.filter((i) => i.productId !== req.params.productId);
    await cart.save();
    res.json({ userId: cart.userId, items: cart.items });
  } catch (e) {
    next(e);
  }
});

cartRouter.delete('/clear', async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ userId: req.userId }, { $set: { items: [] } }, { upsert: true });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
