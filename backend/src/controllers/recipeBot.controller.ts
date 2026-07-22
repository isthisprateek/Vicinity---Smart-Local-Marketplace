import { Request, Response } from 'express';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Product } from '../models/product.model';
import { ChatHistory, IMessage } from '../models/chatHistory.model';

const getGenAI = () => new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your_api_key_here');

interface ExtractedIngredient {
    name: string;
    quantity: number;
    unit: string;
}

interface ProductResult {
    productId: string;
    name: string;
    price: number;
    shopName: string;
    shopId: string;
    distance?: number;
    amountNeeded: number;
    unitNeeded: string;
}

export const handleRecipeChat = async (req: Request, res: Response): Promise<void> => {
    // We now extract the history from the DB instead of req.body to prevent tampering,
    // but the frontend can still send a local history if unauthenticated (not possible yet since requireAuth is active).
    const { message, lat, lng } = req.body;
    const userId = req.user._id;
    const buyerLat = lat ? Number(lat) : null;
    const buyerLng = lng ? Number(lng) : null;

    if (!message || !message.trim()) {
        res.status(400).json({ reply: 'Please provide a message.', products: [] });
        return;
    }

    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            // Use structured output capabilities
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        reply: {
                            type: SchemaType.STRING,
                            description: "Your conversational response to the user. E.g. 'Sure, I can help you with that!' or 'Here are the ingredients for pizza.'"
                        },
                        cookingProcess: {
                            type: SchemaType.STRING,
                            description: "If the user asks for a recipe, provide a SHORT, clear, numbered list of the step-by-step cooking process here using markdown. Keep it very concise. Provide an empty string if not applicable."
                        },
                        ingredientsToSearch: {
                            type: SchemaType.ARRAY,
                            description: "If the user is asking for a recipe or specific items, list the generic core ingredients here. Leave empty if just chatting.",
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    name: { type: SchemaType.STRING },
                                    quantity: { type: SchemaType.NUMBER },
                                    unit: { type: SchemaType.STRING }
                                },
                                required: ["name", "quantity", "unit"]
                            }
                        }
                    },
                    required: ["reply", "cookingProcess", "ingredientsToSearch"]
                }
            },
            systemInstruction: "You are the Smart Market AI Shopping Assistant. You help users find exactly what they need, suggest recipes, and act friendly. Always formulate a conversational `reply`. If the user asks for a recipe, output the exact step-by-step cooking process in `cookingProcess` formatted minimally and beautifully with markdown lists. Keep your recipes extremely short and readable. Do not write large blocks of unstructured text. Populate `ingredientsToSearch` with generic names. If they are just chatting generally, leave `ingredientsToSearch` and `cookingProcess` empty and just reply.",
        });

        // Fetch or create chat history
        let chatHistory = await ChatHistory.findOne({ user: userId });
        if (!chatHistory) {
            chatHistory = new ChatHistory({ user: userId, messages: [] });
        }

        // Format history for Gemini
        // Gemini expects { role: 'user'|'model', parts: [{ text: string }] }
        // and strictly requires that the history starts with a 'user' message
        // and alternates user, model, user, model.
        let rawHistory = chatHistory.messages.map(m => ({ role: m.role, text: m.text }));

        // Remove any leading bot messages
        while (rawHistory.length > 0 && rawHistory[0].role === 'bot') {
            rawHistory.shift();
        }

        // Collapse consecutive messages of the same role
        const collapsedHistory: any[] = [];
        for (const msg of rawHistory) {
            const role = msg.role === 'bot' ? 'model' : 'user';
            if (collapsedHistory.length > 0 && collapsedHistory[collapsedHistory.length - 1].role === role) {
                // Same role as previous, append text
                collapsedHistory[collapsedHistory.length - 1].parts[0].text += `\n\n${msg.text}`;
            } else {
                collapsedHistory.push({
                    role,
                    parts: [{ text: msg.text }]
                });
            }
        }

        const chat = model.startChat({
            history: collapsedHistory,
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(responseText);
        } catch (err) {
            console.error('Failed to parse Gemini JSON:', responseText);
            res.status(500).json({ reply: "Sorry, I had trouble formulating my response.", products: [] });
            return;
        }

        const replyMessage = parsedResponse.reply || "I'm not sure what to say.";
        const ingredients = parsedResponse.ingredientsToSearch || [];

        // If no ingredients needed, just return the conversation
        if (ingredients.length === 0) {
            res.status(200).json({ reply: replyMessage, products: [] });
            return;
        }

        // Search for these ingredients in our database
        const matchedProducts: ProductResult[] = [];
        const missingIngredients: string[] = [];

        for (const item of (ingredients as ExtractedIngredient[])) {
            // Find products matching the ingredient name (case-insensitive regex)
            const regex = new RegExp(item.name.split(' ')[0], 'i'); // Split by space to match terms better (e.g. 'Red Tomato' -> 'Red')
            const products = await Product.find({
                name: { $regex: regex },
                stock: { $gt: 0 }
            }).populate('shop', 'name address location isOpen');

            let bestMatch: any = null;
            let minDistance = Infinity;

            for (const p of products) {
                const shop = p.shop as any;
                if (!shop || !shop.isOpen) continue;

                let dist = Infinity;
                if (buyerLat != null && buyerLng != null && shop.location?.coordinates) {
                    const [shopLng, shopLat] = shop.location.coordinates;
                    dist = haversineKm(buyerLat, buyerLng, shopLat, shopLng);
                }

                if (dist < minDistance || !bestMatch) {
                    minDistance = dist;
                    bestMatch = { product: p, distance: dist !== Infinity ? dist : undefined };
                }
            }

            if (bestMatch) {
                matchedProducts.push({
                    productId: bestMatch.product._id.toString(),
                    name: bestMatch.product.name,
                    price: bestMatch.product.price,
                    shopName: bestMatch.product.shop.name,
                    shopId: bestMatch.product.shop._id.toString(),
                    distance: bestMatch.distance,
                    amountNeeded: item.quantity,
                    unitNeeded: item.unit
                });
            } else {
                missingIngredients.push(item.name);
            }
        }

        const cookingProcess = parsedResponse.cookingProcess || '';
        const finalReply = cookingProcess
            ? `${replyMessage}\n\n**Directions:**\n${cookingProcess}`
            : replyMessage;

        // Save User Message & Bot Message to DB
        const userMessageId = Date.now().toString();
        const botMessageId = (Date.now() + 1).toString();

        chatHistory.messages.push({
            id: userMessageId,
            role: 'user',
            text: message
        } as IMessage);

        chatHistory.messages.push({
            id: botMessageId,
            role: 'bot',
            text: finalReply,
            products: matchedProducts,
            missingIngredients: missingIngredients
        } as IMessage);

        await chatHistory.save();

        // If products were found, append a small note (or rely on the `replyMessage` Gemini generated)
        res.status(200).json({
            reply: finalReply,
            products: matchedProducts,
            missingIngredients: missingIngredients
        });

    } catch (error) {
        console.error('Recipe Bot Error:', error);
        res.status(500).json({ reply: "Sorry, I ran into an issue while processing your request.", products: [] });
    }
};

export const getChatHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        const chatHistory = await ChatHistory.findOne({ user: userId });

        if (!chatHistory) {
            res.status(200).json({ messages: [] });
            return;
        }

        res.status(200).json({ messages: chatHistory.messages });
    } catch (error) {
        console.error('Fetch Chat History Error:', error);
        res.status(500).json({ message: "Failed to load chat history." });
    }
};

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
