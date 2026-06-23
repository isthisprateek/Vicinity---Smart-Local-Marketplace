import { Request, Response } from 'express';
import { searchProductsByIntent } from '../graph/graphService';
import { Product } from '../models/product.model';
import { Shop } from '../models/shop.model';

interface ProductResult {
    productId: string;
    name: string;
    price: number;
    shopName: string;
    shopId: string;
    distance?: number; // km, if buyer location provided
    stock?: number;
}

export const graphSearch = async (req: Request, res: Response): Promise<void> => {
    const query = (req.query.q as string || '').trim();
    const buyerLat = req.query.lat ? Number(req.query.lat) : null;
    const buyerLng = req.query.lng ? Number(req.query.lng) : null;

    if (!query) {
        res.status(200).json({ intent: 'Please provide a search query', products: [] });
        return;
    }

    try {
        // 1. Get product names from Neo4j graph
        const graphResult = await searchProductsByIntent(query);
        const productNames = graphResult.products;

        if (productNames.length === 0) {
            res.status(200).json({ intent: graphResult.intent, products: [] });
            return;
        }

        // 2. Fetch full product details from MongoDB (name, price, shop)
        const mongoProducts = await Product.find({
            name: { $in: productNames },
            stock: { $gt: 0 },
        }).populate('shop', 'name address location isOpen');

        // 3. Build enriched product list with shop info + distance
        const enriched: ProductResult[] = [];
        for (const p of mongoProducts) {
            const shop = p.shop as any;
            if (!shop || !shop.isOpen) continue;

            let distance: number | undefined;
            if (buyerLat != null && buyerLng != null && shop.location?.coordinates) {
                const [shopLng, shopLat] = shop.location.coordinates;
                distance = haversineKm(buyerLat, buyerLng, shopLat, shopLng);
            }

            enriched.push({
                productId: p._id.toString(),
                name: p.name,
                price: p.price,
                shopName: shop.name,
                shopId: shop._id.toString(),
                distance,
                stock: p.stock || 0,
            });
        }

        // 4. Deduplicate: if same product at same price from multiple shops,
        //    keep only the nearest shop's entry
        const deduped = deduplicateProducts(enriched);

        // 5. Sort: nearest first (if distance available), then by name
        deduped.sort((a, b) => {
            if (a.distance != null && b.distance != null) return a.distance - b.distance;
            return a.name.localeCompare(b.name);
        });

        res.status(200).json({
            intent: graphResult.intent,
            products: deduped,
        });
    } catch (error) {
        console.error('Graph search error:', error);
        res.status(500).json({ message: 'Failed to perform graph search' });
    }
};

/**
 * Deduplicate products: if same name + same price exists from multiple shops,
 * keep only the one from the nearest shop (or first found if no distance).
 * If prices differ, keep both (buyer sees both options).
 */
function deduplicateProducts(products: ProductResult[]): ProductResult[] {
    const map = new Map<string, ProductResult>(); // key: "name|price"

    for (const p of products) {
        const key = `${p.name}|${p.price}`;
        const existing = map.get(key);
        if (!existing) {
            map.set(key, p);
        } else {
            // Keep the one from the nearer shop
            if (p.distance != null && existing.distance != null) {
                if (p.distance < existing.distance) {
                    map.set(key, p);
                }
            }
        }
    }

    return Array.from(map.values());
}

/**
 * Haversine distance between two lat/lng points, in km.
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}
