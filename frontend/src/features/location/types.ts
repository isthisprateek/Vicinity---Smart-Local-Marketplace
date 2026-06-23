export interface UserLocation {
    lat: number;
    lng: number;
}

export interface NearbyShop {
    _id: string;
    name: string;
    address: string;
    distance: number; // km
    location: {
        type: string;
        coordinates: [number, number];
    };
    isOpen: boolean;
}
