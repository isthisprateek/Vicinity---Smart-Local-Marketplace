import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Shop } from '../models/shop.model';
import { Product } from '../models/product.model';

/**
 * POST /api/shops
 * Seller creates a new shop with name, address, and map coordinates.
 */
export const createShop = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, address, lat, lng } = req.body;

        if (!name || !address || lat == null || lng == null) {
            res.status(400).json({ message: 'Name, address, latitude, and longitude are required' });
            return;
        }

        const shop = await Shop.create({
            name,
            owner: req.user._id,
            address,
            location: {
                type: 'Point',
                coordinates: [Number(lng), Number(lat)], // GeoJSON: [lng, lat]
            },
        });

        res.status(201).json({ message: 'Shop created successfully', shop });
    } catch (error) {
        console.error('Error creating shop:', error);
        res.status(500).json({ message: 'Failed to create shop' });
    }
};

/**
 * GET /api/shops/my
 * Returns all shops belonging to the current seller.
 */
export const getMyShops = async (req: Request, res: Response): Promise<void> => {
    try {
        const shops = await Shop.find({ owner: req.user._id }).sort({ createdAt: -1 });
        res.json({ shops });
    } catch (error) {
        console.error('Error fetching shops:', error);
        res.status(500).json({ message: 'Failed to fetch shops' });
    }
};

/**
 * DELETE /api/shops/:id
 * Seller deletes a shop and ALL its products.
 */
export const deleteShop = async (req: Request, res: Response): Promise<void> => {
    try {
        const shop = await Shop.findOne({ _id: req.params.id, owner: req.user._id });
        if (!shop) {
            res.status(404).json({ message: 'Shop not found or not yours' });
            return;
        }

        // Delete all products belonging to this shop
        await Product.deleteMany({ shop: shop._id });

        // Delete the shop
        await Shop.findByIdAndDelete(shop._id);

        res.json({ message: 'Shop and its products deleted successfully' });
    } catch (error) {
        console.error('Error deleting shop:', error);
        res.status(500).json({ message: 'Failed to delete shop' });
    }
};

/**
 * GET /api/shops/nearby?lat=&lng=&maxDistance=
 * Public — returns shops sorted by distance from the given coordinates.
 */
export const getNearbyShops = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lat, lng, maxDistance } = req.query;

        if (!lat || !lng) {
            res.status(400).json({ message: 'lat and lng query parameters are required' });
            return;
        }

        const latitude = Number(lat);
        const longitude = Number(lng);
        const maxDist = Number(maxDistance) || 50000; // Default 50km in meters

        const shops = await Shop.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    },
                    distanceField: 'distance',
                    maxDistance: maxDist,
                    spherical: true,
                },
            },
            {
                $match: { isOpen: true },
            },
            {
                $project: {
                    name: 1,
                    address: 1,
                    distance: { $round: [{ $divide: ['$distance', 1000] }, 1] }, // km
                    location: 1,
                    isOpen: 1,
                },
            },
            { $limit: 20 },
        ]);

        res.json({ shops });
    } catch (error) {
        console.error('Error finding nearby shops:', error);
        res.status(500).json({ message: 'Failed to find nearby shops' });
    }
};

/**
 * POST /api/shops/:id/rate
 * Rate a shop from 1 to 5 stars.
 */
export const rateShop = async (req: Request, res: Response): Promise<void> => {
    try {
        const { rating } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            res.status(400).json({ message: 'Rating must be between 1 and 5' });
            return;
        }

        const shop = await Shop.findById(req.params.id);
        if (!shop) {
            res.status(404).json({ message: 'Shop not found' });
            return;
        }

        const totalRating = (shop.rating || 0) * (shop.ratingCount || 0) + rating;
        const newCount = (shop.ratingCount || 0) + 1;
        shop.rating = totalRating / newCount;
        shop.ratingCount = newCount;

        await shop.save();

        res.json({ message: 'Shop rated successfully', shop });
    } catch (error) {
        console.error('Error rating shop:', error);
        res.status(500).json({ message: 'Failed to rate shop' });
    }
};

/**
 * GET /api/shops/batch?ids=id1,id2,...
 * Public — returns name and location for a list of shop IDs.
 */
export const getShopsBatch = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ids } = req.query;
        if (!ids) {
            res.status(400).json({ message: 'ids query parameter required' });
            return;
        }
        const idList = (ids as string).split(',').filter(Boolean);
        const validIds = idList.filter(id => mongoose.Types.ObjectId.isValid(id));
        const shops = await Shop.find({ _id: { $in: validIds } }).select('name address location');
        res.json({ shops });
    } catch (error) {
        console.error('Error fetching shops batch:', error);
        res.status(500).json({ message: 'Failed to fetch shops' });
    }
};
