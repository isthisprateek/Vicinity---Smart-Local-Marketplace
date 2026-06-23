import mongoose, { Schema, Document } from 'mongoose';

export interface IShop extends Document {
    name: string;
    owner: mongoose.Types.ObjectId;
    location: {
        type: string;
        coordinates: [number, number]; // [longitude, latitude]
    };
    address: string;
    isOpen: boolean;
    rating: number;
    ratingCount: number;
}

const shopSchema = new Schema<IShop>(
    {
        name: { type: String, required: true },
        owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true },
        },
        address: { type: String, required: true },
        isOpen: { type: Boolean, default: true },
        rating: { type: Number, default: 0 },
        ratingCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

shopSchema.index({ location: '2dsphere' });

export const Shop = mongoose.model<IShop>('Shop', shopSchema);
