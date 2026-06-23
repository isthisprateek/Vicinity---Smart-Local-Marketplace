import { Request, Response } from 'express';

// Define the interface for a mapped item
interface ProductMatch {
    id: string;
    name: string;
    price: number;
    seller: string;
    time: string;
    stock: number;
    relevance?: number; // for ranking
}

// Intent Map rules (MVP rule-based mapping) Designed for future AI upgrade
const INTENT_RULES = [
    {
        keywords: ['cold', 'cough', 'flu', 'sore throat', 'sick'],
        intentName: 'Cold & Flu Relief',
        products: [
            { id: 'm1', name: 'Ginger Tea', price: 150, seller: 'Wellness Store', time: '10', stock: 100 },
            { id: 'm2', name: 'Raw Honey 250g', price: 299, seller: 'Nature Bounty', time: '15', stock: 100 },
            { id: 'm3', name: 'Vicks VapoRub', price: 85, seller: 'City Pharmacy', time: '8', stock: 100 },
            { id: 'm4', name: 'Cough Drops (Honey Lemon)', price: 40, seller: 'City Pharmacy', time: '8', stock: 100 }
        ]
    },
    {
        keywords: ['headache', 'migraine', 'head ache', 'pain'],
        intentName: 'Headache Relief',
        products: [
            { id: 'h1', name: 'Crocin Pain Relief (15 Tablets)', price: 35, seller: 'City Pharmacy', time: '8', stock: 100 },
            { id: 'h2', name: 'Peppermint Essential Oil', price: 250, seller: 'Wellness Store', time: '12', stock: 100 },
            { id: 'h3', name: 'Tiger Balm Red', price: 90, seller: 'City Pharmacy', time: '8', stock: 100 }
        ]
    },
    {
        keywords: ['fever', 'temperature', 'high temp', 'warm'],
        intentName: 'Fever Reduction',
        products: [
            { id: 'f1', name: 'Paracetamol 500mg (15 Tablets)', price: 20, seller: 'City Pharmacy', time: '8', stock: 100 },
            { id: 'f2', name: 'Digital Thermometer', price: 199, seller: 'City Pharmacy', time: '8', stock: 100 },
            { id: 'f3', name: 'Electrolyte Powder (Apple Flavor)', price: 45, seller: 'Wellness Store', time: '10', stock: 100 }
        ]
    },
    {
        keywords: ['pasta', 'italian', 'dinner', 'spaghetti', 'sauce'],
        intentName: 'Cooking an Italian pasta dinner',
        products: [
            { id: 'p1', name: 'Fresh Pasta', price: 49, seller: "Mario's Local", time: '10', stock: 100 },
            { id: 'p2', name: 'Tomato Sauce', price: 89, seller: "Mario's Local", time: '10', stock: 100 },
            { id: 'p3', name: 'Parmesan Cheese', price: 120, seller: 'Dairy King', time: '15', stock: 100 },
            { id: 'p4', name: 'Fresh Basil', price: 25, seller: 'Green Grocers', time: '12', stock: 100 },
        ]
    },
    {
        keywords: ['party', 'birthday', 'celebration', 'fun'],
        intentName: 'Hosting a party',
        products: [
            { id: 'b1', name: 'Party Balloons (Pack of 50)', price: 150, seller: 'Party Galaxy', time: '20', stock: 100 },
            { id: 'b2', name: 'Paper Plates (Pack of 20)', price: 60, seller: 'Party Galaxy', time: '20', stock: 100 },
            { id: 'b3', name: 'Cola 2L', price: 90, seller: 'Quick Stop', time: '5', stock: 100 },
            { id: 'b4', name: 'Potato Chips (Family Pack)', price: 50, seller: 'Quick Stop', time: '5', stock: 100 },
        ]
    },
    {
        keywords: ['clean', 'dust', 'sweep', 'mop', 'wash', 'dirt'],
        intentName: 'House cleaning',
        products: [
            { id: 'c1', name: 'All-Purpose Cleaner', price: 120, seller: 'Home Essentials', time: '15', stock: 100 },
            { id: 'c2', name: 'Microfiber Cloths (3 Pack)', price: 99, seller: 'Home Essentials', time: '15', stock: 100 },
            { id: 'c3', name: 'Floor Mop', price: 450, seller: 'Hardware Plus', time: '25', stock: 100 },
        ]
    },
    {
        keywords: ['breakfast', 'morning', 'cereal', 'eggs', 'milk'],
        intentName: 'Morning Breakfast',
        products: [
            { id: 'br1', name: 'Farm Fresh Eggs (6 Pack)', price: 60, seller: 'Dairy King', time: '10', stock: 100 },
            { id: 'br2', name: 'Whole Wheat Bread', price: 45, seller: 'Local Bakery', time: '10', stock: 100 },
            { id: 'br3', name: 'Milk 1L', price: 65, seller: 'Dairy King', time: '10', stock: 100 },
            { id: 'br4', name: 'Oats 500g', price: 150, seller: 'Green Grocers', time: '12', stock: 100 },
        ]
    },
    {
        keywords: ['snack', 'munchies', 'hungry', 'cravings'],
        intentName: 'Quick Snacks',
        products: [
            { id: 's1', name: 'Potato Chips (Classic)', price: 20, seller: 'Quick Stop', time: '5', stock: 100 },
            { id: 's2', name: 'Roasted Almonds 100g', price: 120, seller: 'Quick Stop', time: '5', stock: 100 },
            { id: 's3', name: 'Chocolate Bar', price: 40, seller: 'Quick Stop', time: '5', stock: 100 },
        ]
    }
];

export const searchIntent = async (req: Request, res: Response): Promise<void> => {
    // Edge case: Trim and lower query safely
    const query = (req.query.q as string || '').trim().toLowerCase();

    // Edge case: Empty input
    if (!query) {
        res.status(200).json({ intent: 'Start typing to search...', items: [], totalPrice: 0, fastestDelivery: 'N/A' });
        return;
    }

    try {
        // --- MVP Rule-Based Intent Resolution ---
        let bestMatch = null;
        let maxScore = 0;

        for (const rule of INTENT_RULES) {
            let score = 0;
            for (const keyword of rule.keywords) {
                if (query.includes(keyword)) {
                    score += 2; // Exact word match is high relevance
                }
                // Partial overlap handling for typos/plurals using simple heuristic
                if (query.split(' ').some(word => keyword.includes(word) && word.length > 3)) {
                    score += 1;
                }
            }

            if (score > maxScore) {
                maxScore = score;
                bestMatch = rule;
            }
        }

        let detectedIntent = '';
        let results: ProductMatch[] = [];

        if (bestMatch && maxScore > 0) {
            detectedIntent = bestMatch.intentName;

            // Rank results (default to the predefined logical order for MVP, as they are curated)
            results = bestMatch.products.map((p, index) => ({
                ...p,
                relevance: 100 - index // Simple ranking ensures top items stay at top
            }));

            // Sort by relevance descending
            results.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
        } else {
            // Edge case: No specific intent matched - fallback to generic literal search
            detectedIntent = `Searching for "${req.query.q}"`;
            results = [
                { id: 'g1', name: `Premium ${req.query.q}`, price: 199, seller: 'Local Store', time: '10', stock: 100, relevance: 50 },
                { id: 'g2', name: `Value ${req.query.q}`, price: 89, seller: 'Local Store', time: '10', stock: 100, relevance: 40 },
            ];
        }

        // Simulate network delay for AI processing feel
        setTimeout(() => {
            // Remove relevance prop before sending to frontend as it's internal
            const items = results.map(({ relevance, ...rest }) => rest);

            res.status(200).json({
                intent: detectedIntent,
                // map time to strings with min
                items: items.map(i => ({ ...i, time: `${i.time} min` })),
                totalPrice: items.reduce((sum, item) => sum + item.price, 0),
                fastestDelivery: items.length > 0 ? (Math.min(...items.map(i => parseInt(i.time))) + ' min') : '-'
            });
        }, 400);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to process intent search' });
    }
};
