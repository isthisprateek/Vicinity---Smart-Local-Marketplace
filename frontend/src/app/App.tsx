import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { CartProvider } from '@/features/cart/CartContext';
import { LocationProvider } from '@/features/location/LocationContext';

export function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <LocationProvider>
                    <RouterProvider router={router} />
                </LocationProvider>
            </CartProvider>
        </AuthProvider>
    );
}
