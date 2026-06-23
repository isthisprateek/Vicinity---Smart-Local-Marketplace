import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
    productId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
}

export interface IOrder extends Document {
    buyerId: mongoose.Types.ObjectId;
    sellerId: mongoose.Types.ObjectId;
    shopId: mongoose.Types.ObjectId;
    shopName: string;
    items: IOrderItem[];
    totalAmount: number;
    status: 'pending' | 'paid' | 'packing' | 'shipped' | 'delivered' | 'cancelled';
    deliveryAddress: string;
    deliveryLocation: {
        type: string;
        coordinates: [number, number]; // [lng, lat]
    };
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
    shopName: { type: String, required: true },
    items: [
        {
            productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true }
        }
    ],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'paid', 'packing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    deliveryAddress: { type: String, required: true },
    deliveryLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }
    },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
}, { timestamps: true });

OrderSchema.index({ deliveryLocation: '2dsphere' });

export default mongoose.model<IOrder>('Order', OrderSchema);
