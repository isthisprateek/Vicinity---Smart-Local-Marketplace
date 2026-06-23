import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import NewHomePage from '@/pages/NewHomePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { BuyerDashboardPage } from '@/pages/BuyerDashboardPage';
import { SellerDashboardPage } from '@/pages/SellerDashboardPage';
import { CartPage } from '@/pages/CartPage';
import { OrderHistoryPage } from '@/pages/OrderHistoryPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { UserDashboardPage } from '@/pages/UserDashboardPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import CheckoutPage from '@/pages/CheckoutPage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        errorElement: <NotFoundPage />,
        children: [
            {
                index: true,
                element: <NewHomePage />,
            },
            {
                path: 'login',
                element: <LoginPage />,
            },
            {
                path: 'signup',
                element: <SignupPage />,
            },
            {
                path: 'buyer',
                element: (
                    <ProtectedRoute requiredRole="buyer">
                        <BuyerDashboardPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'orders',
                element: (
                    <ProtectedRoute requiredRole="buyer">
                        <OrderHistoryPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'cart',
                element: (
                    <ProtectedRoute requiredRole="buyer">
                        <CartPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'checkout',
                element: (
                    <ProtectedRoute requiredRole="buyer">
                        <CheckoutPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'seller',
                element: (
                    <ProtectedRoute requiredRole="seller">
                        <SellerDashboardPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'profile',
                element: (
                    <ProtectedRoute>
                        <UserDashboardPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'admin',
                element: (
                    <ProtectedRoute>
                        <AdminDashboardPage />
                    </ProtectedRoute>
                ),
            },
        ],
    },
]);
