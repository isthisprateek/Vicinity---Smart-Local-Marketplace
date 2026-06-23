import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { CartBar } from '@/features/cart/CartBar';
import './Layout.css';

export function Layout() {
    return (
        <div className="layout">
            <Header />
            <main className="main-content" style={{ paddingBottom: '5rem' }}>
                <div className="container">
                    <Outlet />
                </div>
            </main>
            <CartBar />
        </div>
    );
}
