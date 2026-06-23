import { Request, Response } from 'express';
import { Product } from '../models/product.model';
import { Shop } from '../models/shop.model';
import { addProductToGraph, removeProductFromGraph, getGraphCategories } from '../graph/graphService';

/**
 * GET /api/products/categories
 * Returns available Neo4j categories
 */
export const getCategories = async (_req: Request, res: Response): Promise<void> => {
    try {
        const categories = await getGraphCategories();
        res.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Failed to fetch categories' });
    }
};

/**
 * POST /api/products
 * Seller adds a new product to a specific shop.
 * Requires `shopId` in the body to specify which shop.
 */
export const addProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description, price, category, stock, keywords, similarTo, shopId } = req.body;

        if (!name || !price || !category) {
            res.status(400).json({ message: 'Name, price, and category are required' });
            return;
        }

        // Resolve the shop: use explicit shopId or fall back to first shop
        let shop;
        if (shopId) {
            shop = await Shop.findOne({ _id: shopId, owner: req.user._id });
            if (!shop) {
                res.status(404).json({ message: 'Shop not found or not yours' });
                return;
            }
        } else {
            // Backward compat: find first shop, or auto-create one
            shop = await Shop.findOne({ owner: req.user._id });
            if (!shop) {
                shop = await Shop.create({
                    name: `${req.user.name}'s Shop`,
                    owner: req.user._id,
                    location: { type: 'Point', coordinates: [0, 0] },
                    address: 'Not specified',
                });
            }
        }

        // Save to MongoDB
        const product = await Product.create({
            name,
            description: description || '',
            price: Number(price),
            category,
            shop: shop._id,
            stock: Number(stock) || 0,
            keywords: keywords || [],
        });

        // Sync to Neo4j graph
        await addProductToGraph(name, category, similarTo || []);

        res.status(201).json({
            message: 'Product added successfully',
            product,
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Failed to add product' });
    }
};

/**
 * GET /api/products/my?shopId=xxx
 * Returns products for a specific shop, or all seller's products if no shopId.
 */
export const getMyProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { shopId } = req.query;

        if (shopId) {
            // Verify shop belongs to this seller
            const shop = await Shop.findOne({ _id: shopId, owner: req.user._id });
            if (!shop) {
                res.status(404).json({ message: 'Shop not found' });
                return;
            }
            const products = await Product.find({ shop: shop._id }).sort({ createdAt: -1 });
            res.json({ products });
        } else {
            // Return products from ALL seller's shops
            const shops = await Shop.find({ owner: req.user._id });
            if (shops.length === 0) {
                res.json({ products: [] });
                return;
            }
            const shopIds = shops.map(s => s._id);
            const products = await Product.find({ shop: { $in: shopIds } }).sort({ createdAt: -1 });
            res.json({ products });
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
};

/**
 * DELETE /api/products/:id
 * Seller deletes one of their own products (across any of their shops).
 */
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        // Get all seller's shops
        const shops = await Shop.find({ owner: req.user._id });
        if (shops.length === 0) {
            res.status(404).json({ message: 'No shops found' });
            return;
        }

        const shopIds = shops.map(s => s._id);
        const product = await Product.findOne({ _id: req.params.id, shop: { $in: shopIds } });
        if (!product) {
            res.status(404).json({ message: 'Product not found or not yours' });
            return;
        }

        // Remove from Neo4j graph
        await removeProductFromGraph(product.name);

        // Remove from MongoDB
        await Product.findByIdAndDelete(product._id);

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Failed to delete product' });
    }
};

/**
 * PUT /api/products/:id
 * Seller updates their product's price and stock
 */
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { price, stock } = req.body;

        // Get all seller's shops to verify ownership
        const shops = await Shop.find({ owner: req.user._id });
        if (shops.length === 0) {
            res.status(404).json({ message: 'No shops found' });
            return;
        }

        const shopIds = shops.map(s => s._id);
        const product = await Product.findOne({ _id: req.params.id, shop: { $in: shopIds } });

        if (!product) {
            res.status(404).json({ message: 'Product not found or not yours' });
            return;
        }

        if (price !== undefined) product.price = Number(price);
        if (stock !== undefined) product.stock = Number(stock);

        await product.save();

        res.json({ message: 'Product updated successfully', product });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Failed to update product' });
    }
};

/**
 * GET /api/products/explore
 * Returns up to 10 distinct products for the buyer dashboard
 */
export const getExploreProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const products = await Product.aggregate([
            { $sample: { size: 10 } } // Randomly select up to 10 products
        ]);

        // Populate shop info manually since aggregate doesn't automatically hook up mongoose refs
        const populatedProducts = await Product.populate(products, { path: 'shop', select: 'name address' });

        res.json({ products: populatedProducts });
    } catch (error) {
        console.error('Error fetching explore products:', error);
        res.status(500).json({ message: 'Failed to fetch explore products' });
    }
};
