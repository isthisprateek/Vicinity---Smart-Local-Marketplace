import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    description: string;
    price: number;
    category: string;
    shop: mongoose.Types.ObjectId;
    stock: number;
    keywords: string[];
}

const productSchema = new Schema<IProduct>(
    {
        name: { type: String, required: true },
        description: { type: String },
        price: { type: Number, required: true },
        category: { type: String, required: true },
        shop: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },
        stock: { type: Number, default: 0 },
        keywords: [{ type: String }],
    },
    { timestamps: true }
);

// Search optimization
productSchema.index(
    { name: 'text', description: 'text', keywords: 'text' },
    { weights: { name: 10, keywords: 5, description: 1 } }
);

export const Product = mongoose.model<IProduct>('Product', productSchema);
