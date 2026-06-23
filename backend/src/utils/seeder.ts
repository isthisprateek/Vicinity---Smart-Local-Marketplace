import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/user.model';
import { Shop } from '../models/shop.model';
import { Product } from '../models/product.model';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedData = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-marketplace';
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected: ' + mongoose.connection.host);

        // Clear existing data
        await User.deleteMany({});
        await Shop.deleteMany({});
        await Product.deleteMany({});

        console.log('Cleared existing data.');

        // 1. Create dummy users
        const seller = await User.create({
            name: 'John Seller',
            email: 'john@seller.com',
            password: 'password123',
            role: 'seller'
        });

        const buyer = await User.create({
            name: 'Alice Buyer',
            email: 'alice@buyer.com',
            password: 'password123',
            role: 'buyer'
        });

        // 2. Create dummy shops
        const shop1 = await Shop.create({
            name: 'City Pharmacy',
            owner: seller._id,
            location: { type: 'Point', coordinates: [77.5946, 12.9716] }, // Bangalore
            address: 'MG Road, Bangalore',
            isOpen: true
        });

        const shop2 = await Shop.create({
            name: "Mario's Local",
            owner: seller._id,
            location: { type: 'Point', coordinates: [77.6101, 12.9352] }, // Koramangala
            address: '80 Feet Road, Koramangala',
            isOpen: true
        });

        // 3. Create dummy products
        await Product.create([
            { name: 'Vicks VapoRub', description: 'Relief from cold and cough', price: 85, category: 'Medicine', shop: shop1._id, stock: 50, keywords: ['cold', 'cough', 'relief'] },
            { name: 'Cough Drops', description: 'Honey lemon flavor', price: 40, category: 'Medicine', shop: shop1._id, stock: 100, keywords: ['cough', 'sore throat'] },
            { name: 'Fresh Pasta', description: 'Authentic handmade pasta', price: 150, category: 'Grocery', shop: shop2._id, stock: 20, keywords: ['pasta', 'italian', 'dinner'] },
            { name: 'Tomato Sauce', description: 'Rich tomato sauce with herbs', price: 89, category: 'Grocery', shop: shop2._id, stock: 30, keywords: ['pasta', 'sauce', 'italian'] },
            { name: 'Ginger Tea', description: 'Natural ginger tea bags', price: 120, category: 'Beverage', shop: shop2._id, stock: 40, keywords: ['cold', 'flu', 'tea'] }
        ]);

        console.log('Seed data inserted successfully!');
        process.exit();
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();
