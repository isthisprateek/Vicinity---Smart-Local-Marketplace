import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface ISavedAddress {
    _id?: mongoose.Types.ObjectId;
    label: string;
    address: string;
    lat: number;
    lng: number;
}

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'buyer' | 'seller';
    faceDescriptor?: number[];
    savedAddresses: ISavedAddress[];
    createdAt: Date;
    matchPassword(enteredPassword: string): Promise<boolean>;
}

const savedAddressSchema = new Schema<ISavedAddress>({
    label: { type: String, required: true },
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
});

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, enum: ['buyer', 'seller'], required: true },
        faceDescriptor: { type: [Number], required: false },
        savedAddresses: { type: [savedAddressSchema], default: [] },
    },
    {
        timestamps: true,
    }
);

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password as string);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
