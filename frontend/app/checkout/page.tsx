'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MapPin, Package, Truck, Clock, CheckCircle, ArrowLeft } from 'lucide-react';

const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900/50 rounded-xl">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
});

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('product');
  
  const [deliveryStatus, setDeliveryStatus] = useState<'preparing' | 'transit' | 'delivered'>('preparing');
  const [progress, setProgress] = useState(0);

  // Simulate delivery progress
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setDeliveryStatus('delivered');
          return 100;
        }
        if (prev >= 50) setDeliveryStatus('transit');
        return prev + 2;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const sellerLocation = { lat: 28.6139, lng: 77.2090 }; // Delhi
  const buyerLocation = { lat: 28.7041, lng: 77.1025 }; // North Delhi

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Search
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-800 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Live Tracking</h2>
                    <p className="text-sm text-gray-400">Real-time delivery updates</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-400">Live</span>
                  </div>
                </div>

                {/* Map Container */}
                <div className="h-96 rounded-xl overflow-hidden border border-gray-800">
                  <DeliveryMap
                    sellerLocation={sellerLocation}
                    buyerLocation={buyerLocation}
                    progress={progress}
                  />
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Delivery Progress</span>
                    <span className="text-sm font-semibold text-purple-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-800 p-6 shadow-2xl">
                <h3 className="text-xl font-bold mb-4">Order Status</h3>
                
                <div className="space-y-4">
                  {/* Status Steps */}
                  <div className={`flex items-start gap-4 ${deliveryStatus === 'preparing' ? 'opacity-100' : 'opacity-50'}`}>
                    <div className={`p-3 rounded-xl ${deliveryStatus === 'preparing' ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gray-700'}`}>
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Preparing Order</p>
                      <p className="text-sm text-gray-400">Seller is packing your items</p>
                    </div>
                  </div>

                  <div className={`flex items-start gap-4 ${deliveryStatus === 'transit' ? 'opacity-100' : 'opacity-50'}`}>
                    <div className={`p-3 rounded-xl ${deliveryStatus === 'transit' ? 'bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse' : 'bg-gray-700'}`}>
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Out for Delivery</p>
                      <p className="text-sm text-gray-400">Your order is on the way</p>
                    </div>
                  </div>

                  <div className={`flex items-start gap-4 ${deliveryStatus === 'delivered' ? 'opacity-100' : 'opacity-50'}`}>
                    <div className={`p-3 rounded-xl ${deliveryStatus === 'delivered' ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gray-700'}`}>
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Delivered</p>
                      <p className="text-sm text-gray-400">Order has been delivered</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-800 p-6 shadow-2xl">
                <h3 className="text-xl font-bold mb-4">Delivery Details</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-purple-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">From</p>
                      <p className="font-medium">Seller Location, Delhi</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-pink-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">To</p>
                      <p className="font-medium">Your Location, North Delhi</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-400">Estimated Time</p>
                      <p className="font-medium">5-10 minutes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            {deliveryStatus === 'delivered' && (
              <button className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-purple-500/50">
                Rate Your Experience
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
