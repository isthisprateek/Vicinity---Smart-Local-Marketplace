import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserLocation } from './types';

interface LocationContextValue {
    location: UserLocation | null;
    setLocation: (loc: UserLocation) => void;
    clearLocation: () => void;
    isPickerOpen: boolean;
    openPicker: () => void;
    closePicker: () => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

const STORAGE_KEY = 'smart_marketplace_location';

// Default: New Delhi
const DEFAULT_LOCATION: UserLocation = { lat: 28.6139, lng: 77.2090 };

export function LocationProvider({ children }: { children: ReactNode }) {
    const [location, setLocationState] = useState<UserLocation | null>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try { return JSON.parse(saved); } catch { /* ignore */ }
        }
        return null;
    });
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    // Try browser geolocation on first mount if no saved location
    useEffect(() => {
        if (location) return;
        if (!navigator.geolocation) {
            setLocationState(DEFAULT_LOCATION);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setLocationState(loc);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
            },
            () => {
                // Permission denied — use default
                setLocationState(DEFAULT_LOCATION);
            },
            { timeout: 5000 }
        );
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const setLocation = (loc: UserLocation) => {
        setLocationState(loc);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    };

    const clearLocation = () => {
        setLocationState(null);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <LocationContext.Provider
            value={{
                location,
                setLocation,
                clearLocation,
                isPickerOpen,
                openPicker: () => setIsPickerOpen(true),
                closePicker: () => setIsPickerOpen(false),
            }}
        >
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const ctx = useContext(LocationContext);
    if (!ctx) throw new Error('useLocation must be used within LocationProvider');
    return ctx;
}
