import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IMessage {
    id: string;
    role: 'user' | 'bot';
    text: string;
    products?: any[];
    missingIngredients?: string[];
}

export interface IChatHistory extends Document {
    user: mongoose.Types.ObjectId;
    messages: IMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'bot'], required: true },
    text: { type: String, required: true },
    products: { type: Schema.Types.Mixed, default: [] },
    missingIngredients: { type: [String], default: [] }
}, { _id: false });

const chatHistorySchema = new Schema<IChatHistory>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    messages: { type: [messageSchema], default: [] }
}, { timestamps: true });

export const ChatHistory: Model<IChatHistory> = mongoose.model<IChatHistory>('ChatHistory', chatHistorySchema);
