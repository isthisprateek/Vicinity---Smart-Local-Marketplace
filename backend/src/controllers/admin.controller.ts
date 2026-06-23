import { Request, Response } from 'express';
import Order from '../models/order.model';
import { Shop } from '../models/shop.model';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        // Aggregate fastest selling items
        const topItems = await Order.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    name: { $first: "$items.name" },
                    totalSold: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        // Get Top Rated Shops
        const topShops = await Shop.find({ isOpen: true, ratingCount: { $gt: 0 } })
            .sort({ rating: -1, ratingCount: -1 })
            .limit(10)
            .select('name address rating ratingCount owner');

        res.json({
            success: true,
            fastestSellingItems: topItems,
            topRatedShops: topShops
        });
    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch overall dashboard statistics.' });
    }
};
