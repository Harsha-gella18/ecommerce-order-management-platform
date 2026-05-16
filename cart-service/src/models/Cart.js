import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, default: '' },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const CartSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  items: { type: [ItemSchema], default: [] },
});

export const Cart = mongoose.model('Cart', CartSchema);
