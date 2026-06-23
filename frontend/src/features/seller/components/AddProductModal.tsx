import { useState } from 'react';
import { authStorage } from '@/features/auth/services/auth.service';
import './AddProductModal.css';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProductAdded: () => void;
    shopId?: string | null;
}

export function AddProductModal({ isOpen, onClose, onProductAdded, shopId }: AddProductModalProps) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [similarTo, setSimilarTo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const resetForm = () => {
        setName('');
        setPrice('');
        setStock('');
        setDescription('');
        setCategory('');
        setSimilarTo('');
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!name.trim() || !price || !category.trim()) {
            setError('Product name, price, and category are required');
            return;
        }

        if (Number(price) <= 0) {
            setError('Price must be greater than 0');
            return;
        }

        // Parse "similar to" into array
        const similarCategories = similarTo
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        setIsSubmitting(true);
        try {
            const token = authStorage.getToken();
            const res = await fetch(`${baseUrl}/api/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: name.trim(),
                    price: Number(price),
                    stock: Number(stock) || 0,
                    description: description.trim(),
                    category: category.trim(),
                    similarTo: similarCategories,
                    shopId: shopId || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Failed to add product');
                return;
            }

            setSuccess(`"${name}" added successfully!`);
            onProductAdded();
            setTimeout(() => {
                resetForm();
                onClose();
            }, 1200);
        } catch (err) {
            console.error(err);
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>➕ Add New Product</h2>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    {error && <div className="form-error">{error}</div>}
                    {success && <div className="form-success">{success}</div>}

                    <div className="form-group">
                        <label htmlFor="product-name">Product Name *</label>
                        <input
                            id="product-name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Nescafe Coffee, Tricone Ice Cream"
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="product-price">Price (₹) *</label>
                            <input
                                id="product-price"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                placeholder="149"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="product-stock">Stock</label>
                            <input
                                id="product-stock"
                                type="number"
                                min="0"
                                value={stock}
                                onChange={e => setStock(e.target.value)}
                                placeholder="50"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="product-category">Category *</label>
                        <input
                            id="product-category"
                            type="text"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            placeholder="e.g. Coffee, Ice Cream, Snacks"
                            required
                        />
                        <span className="form-hint">Type any category — new ones are created automatically</span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="product-similar">Similar To (optional)</label>
                        <input
                            id="product-similar"
                            type="text"
                            value={similarTo}
                            onChange={e => setSimilarTo(e.target.value)}
                            placeholder="e.g. Tea, Beverages (comma separated)"
                        />
                        <span className="form-hint">Helps buyers find your product when searching related categories</span>
                    </div>

                    <div className="form-group">
                        <label htmlFor="product-desc">Description</label>
                        <textarea
                            id="product-desc"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Brief description of your product…"
                            rows={3}
                        />
                    </div>

                    <button className="modal-submit" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Adding…' : '🚀 Add Product'}
                    </button>
                </form>
            </div>
        </div>
    );
}
