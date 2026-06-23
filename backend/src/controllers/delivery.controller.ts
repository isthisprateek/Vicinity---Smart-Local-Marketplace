import { Request, Response } from 'express';
import { Product } from '../models/product.model';
import { Shop } from '../models/shop.model';
import User from '../models/user.model';

export const getDeliveryRoute = async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Get product and populate shop
        const product = await Product.findById(productId).populate('shop');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const shop = await Shop.findById(product.shop);
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        // Get user with saved addresses
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get buyer location (first saved address, or null — let frontend handle fallback)
        let buyerLocation: { lat: number; lng: number; address: string } | null = null;

        if (user.savedAddresses && user.savedAddresses.length > 0) {
            const primaryAddress = user.savedAddresses[0];
            buyerLocation = {
                lat: primaryAddress.lat,
                lng: primaryAddress.lng,
                address: primaryAddress.address,
            };
        }

        // Get seller location from shop
        const sellerLocation = {
            lat: shop.location.coordinates[1], // latitude
            lng: shop.location.coordinates[0], // longitude
            address: shop.address,
            shopName: shop.name,
        };

        // If no saved address, place buyer near seller so route still shows something meaningful
        const resolvedBuyer = buyerLocation ?? {
            lat: sellerLocation.lat + 0.05,
            lng: sellerLocation.lng + 0.07,
            address: 'Near seller location (add a saved address for accuracy)',
        };

        res.json({
            success: true,
            data: {
                product: {
                    id: product._id,
                    name: product.name,
                    price: product.price,
                },
                seller: sellerLocation,
                buyer: resolvedBuyer,
            },
        });
    } catch (error) {
        console.error('Delivery route error:', error);
        res.status(500).json({ message: 'Server error fetching delivery route' });
    }
};
