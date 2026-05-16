import mongoose from 'mongoose';

const WishlistItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, default: '' },
    price: { type: Number, default: 0 },
    image: { type: String, default: '' },
  },
  { _id: false }
);

const WishlistSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  items: { type: [WishlistItemSchema], default: [] },
});

export const Wishlist = mongoose.model('Wishlist', WishlistSchema);
