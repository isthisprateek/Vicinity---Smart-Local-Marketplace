import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LocationPicker.css';

// Fix default marker icon (Leaflet + bundlers issue)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    onConfirm: (lat: number, lng: number, address: string) => void;
    onCancel: () => void;
}

function MapClickHandler({ onPositionChange }: { onPositionChange: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onPositionChange(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export function LocationPicker({ initialLat, initialLng, onConfirm, onCancel }: LocationPickerProps) {
    const defaultLat = initialLat ?? 28.6139;
    const defaultLng = initialLng ?? 77.2090;
    const [lat, setLat] = useState(defaultLat);
    const [lng, setLng] = useState(defaultLng);
    const [address, setAddress] = useState('Fetching address...');
    const [isFetchingAddress, setIsFetchingAddress] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>([defaultLat, defaultLng]);

    const fetchAddress = async (l: number, g: number) => {
        setIsFetchingAddress(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${l}&lon=${g}&zoom=18&addressdetails=1`);
            const data = await res.json();
            setAddress(data.display_name || `Location at ${l.toFixed(4)}, ${g.toFixed(4)}`);
        } catch (err) {
            console.error('Reverse geocoding failed:', err);
            setAddress(`Location at ${l.toFixed(4)}, ${g.toFixed(4)}`);
        } finally {
            setIsFetchingAddress(false);
        }
    };

    // Try browser geolocation if no initial position
    useEffect(() => {
        if (initialLat && initialLng) {
            setLat(initialLat);
            setLng(initialLng);
            setMapCenter([initialLat, initialLng]);
            fetchAddress(initialLat, initialLng);
            return;
        }
        if (!navigator.geolocation) {
            fetchAddress(defaultLat, defaultLng);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newLat = pos.coords.latitude;
                const newLng = pos.coords.longitude;
                setLat(newLat);
                setLng(newLng);
                setMapCenter([newLat, newLng]);
                fetchAddress(newLat, newLng);
            },
            () => { fetchAddress(defaultLat, defaultLng); },
            { timeout: 5000 }
        );
    }, [initialLat, initialLng]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePositionChange = (newLat: number, newLng: number) => {
        setLat(newLat);
        setLng(newLng);
        setMapCenter([newLat, newLng]);
        fetchAddress(newLat, newLng);
    };

    return (
        <div className="location-picker-overlay" onClick={onCancel}>
            <div className="location-picker-container" onClick={e => e.stopPropagation()}>
                <div className="location-picker-header">
                    <h2>📍 Select Location</h2>
                    <button className="location-picker-close" onClick={onCancel}>&times;</button>
                </div>
                <p className="location-picker-hint">Click on the map to place your marker</p>
                <div className="location-picker-map">
                    <MapContainer
                        center={mapCenter}
                        zoom={13}
                        style={{ height: '100%', width: '100%', borderRadius: '10px' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[lat, lng]} />
                        <MapClickHandler onPositionChange={handlePositionChange} />
                        <ChangeView center={mapCenter} />
                    </MapContainer>
                </div>
                <div className="location-picker-coords">
                    {isFetchingAddress ? (
                        <div className="address-loader">
                            <span className="mini-spinner"></span>
                            <span>Fetching address...</span>
                        </div>
                    ) : (
                        <div className="address-display">
                            <span className="address-label">📍 Delivery Address:</span>
                            <p className="address-text">{address}</p>
                        </div>
                    )}
                </div>
                <div className="location-picker-actions">
                    <button className="location-picker-cancel" onClick={onCancel}>Cancel</button>
                    <button
                        className="location-picker-confirm"
                        onClick={() => onConfirm(lat, lng, address)}
                        disabled={isFetchingAddress}
                    >
                        ✅ Use This Address
                    </button>
                </div>
            </div>
        </div>
    );
}
