import './ShopSelector.css';

interface Shop {
    _id: string;
    name: string;
    address: string;
}

interface ShopSelectorProps {
    shops: Shop[];
    selectedShopId: string | null;
    onSelect: (shopId: string) => void;
    onCreateNew: () => void;
}

export function ShopSelector({ shops, selectedShopId, onSelect, onCreateNew }: ShopSelectorProps) {
    return (
        <div className="shop-selector">
            <div className="shop-selector-header">
                <h2 className="shop-selector-title">🏪 Your Shops</h2>
                <button className="shop-create-btn" onClick={onCreateNew}>
                    + New Shop
                </button>
            </div>
            {shops.length === 0 ? (
                <div className="shop-selector-empty">
                    <p>No shops yet. Create your first shop to start selling!</p>
                    <button className="dash-btn dash-btn-primary" onClick={onCreateNew}>
                        🏪 Create Your First Shop
                    </button>
                </div>
            ) : (
                <div className="shop-chips">
                    {shops.map(shop => (
                        <button
                            key={shop._id}
                            className={`shop-chip ${selectedShopId === shop._id ? 'active' : ''}`}
                            onClick={() => onSelect(shop._id)}
                        >
                            <span className="shop-chip-name">{shop.name}</span>
                            <span className="shop-chip-address">{shop.address}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
