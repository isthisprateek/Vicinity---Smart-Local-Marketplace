import { Request, Response } from 'express';
import Order from '../models/order.model';
import { Shop } from '../models/shop.model';
import { Product } from '../models/product.model';

/**
 * Get orders for the logged-in buyer
 */
export const getBuyerOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const buyerId = (req as any).user.id;
        const orders = await Order.find({ buyerId }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching buyer orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
};

/**
 * Get orders for a specific shop (owned by the logged-in seller)
 */
export const getSellerOrders = async (req: Request, res: Response): Promise<void> => {
    try {
        const sellerId = (req as any).user.id;
        const { shopId } = req.query;

        let query: any = { sellerId };
        if (shopId) {
            query.shopId = shopId;
        }

        const orders = await Order.find(query).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching seller orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
};

/**
 * Internal function to create order(s) after payment verification
 */
export const finalizeOrder = async (
    buyerId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    items: any[],
    deliveryAddress: string,
    deliveryLocation: { lat: number, lng: number }
): Promise<void> => {
    // Group items by shopId to create separate orders if needed
    const shopGroups = items.reduce((groups: any, item: any) => {
        const group = groups[item.shopId] || { items: [], total: 0, shopName: item.shopName };
        group.items.push({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        });
        group.total += item.price * item.quantity;
        groups[item.shopId] = group;
        return groups;
    }, {});

    for (const shopId in shopGroups) {
        const group = shopGroups[shopId];

        // Find owner of the shop
        const shop = await Shop.findById(shopId);
        if (!shop) continue;

        await Order.create({
            buyerId,
            sellerId: shop.owner,
            shopId,
            shopName: group.shopName,
            items: group.items,
            totalAmount: group.total,
            status: 'packing',
            deliveryAddress,
            deliveryLocation: {
                type: 'Point',
                coordinates: [deliveryLocation.lng, deliveryLocation.lat]
            },
            razorpayOrderId,
            razorpayPaymentId
        });
    }
};

export const markOrderDelivered = async (req: Request, res: Response): Promise<void> => {
    try {
        const sellerId = (req as any).user.id;
        const orderId = req.params.id;

        const order = await Order.findOne({ _id: orderId, sellerId });
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }

        if (order.status === 'delivered') {
            res.status(400).json({ message: 'Order already delivered' });
            return;
        }

        order.status = 'delivered';
        await order.save();

        // Deduct stock from the database
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });
        }

        res.status(200).json({ message: 'Order marked as delivered and stock updated', order });
    } catch (error) {
        console.error('Error marking order as delivered:', error);
        res.status(500).json({ message: 'Failed to update order' });
    }
};
