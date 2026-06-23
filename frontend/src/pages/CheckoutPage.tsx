import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Package, Truck, Clock, CheckCircle, ArrowLeft, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import DeliveryMap from '../components/DeliveryMap';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface DeliveryData {
  product: {
    id: string;
    name: string;
    price: number;
  };
  seller: Location & { shopName?: string };
  buyer: Location;
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get('product');
  
  const [deliveryStatus, setDeliveryStatus] = useState<'preparing' | 'transit' | 'delivered'>('preparing');
  const [progress, setProgress] = useState(0);
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeliveryData = async () => {
      if (!productId) {
        setError('No product selected');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/delivery/${productId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch delivery data');
        }

        const data = await response.json();
        const deliveryResult = data.data;

        // Override buyer location with browser geolocation if available
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              deliveryResult.buyer = {
                ...deliveryResult.buyer,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                address: 'Your Current Location',
              };
              setDeliveryData({ ...deliveryResult });
            },
            () => {
              // Permission denied or unavailable – use server-provided buyer location
              setDeliveryData(deliveryResult);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        } else {
          setDeliveryData(deliveryResult);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching delivery data:', err);
        setError('Failed to load delivery information');
        setLoading(false);
      }
    };

    fetchDeliveryData();
  }, [productId]);

  useEffect(() => {
    if (!deliveryData) return;

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
  }, [deliveryData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-xl">Loading delivery information...</p>
        </div>
      </div>
    );
  }

  if (error || !deliveryData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error || 'No delivery data available'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-gray-900 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6 sm:mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {deliveryData.product.name}
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 flex items-center justify-center gap-2">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
            {deliveryData.product.price.toFixed(2)}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Live Tracking</h2>
                  <p className="text-sm text-gray-500">Real-time delivery updates</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-600">Live</span>
                </div>
              </div>

              <div className="h-64 sm:h-96 rounded-xl overflow-hidden border border-gray-200">
                <DeliveryMap
                  sellerLocation={{ lat: deliveryData.seller.lat, lng: deliveryData.seller.lng }}
                  buyerLocation={{ lat: deliveryData.buyer.lat, lng: deliveryData.buyer.lng }}
                  progress={progress}
                />
              </div>

              <div className="mt-4 sm:mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Delivery Progress</span>
                  <span className="text-sm font-semibold text-blue-600">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <div className="space-y-4 sm:space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xl">
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">Order Status</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <motion.div
                    animate={{ opacity: deliveryStatus === 'preparing' ? 1 : 0.5 }}
                    className="flex items-start gap-3 sm:gap-4"
                  >
                    <div className={`p-2 sm:p-3 rounded-xl ${deliveryStatus === 'preparing' ? 'bg-gradient-to-br from-yellow-400 to-orange-400' : 'bg-gray-200'}`}>
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm sm:text-base text-gray-800">Preparing Order</p>
                      <p className="text-xs sm:text-sm text-gray-500">Packing your items</p>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ opacity: deliveryStatus === 'transit' ? 1 : 0.5 }}
                    className="flex items-start gap-3 sm:gap-4"
                  >
                    <div className={`p-2 sm:p-3 rounded-xl ${deliveryStatus === 'transit' ? 'bg-gradient-to-br from-blue-500 to-indigo-500 animate-pulse' : 'bg-gray-200'}`}>
                      <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm sm:text-base text-gray-800">Out for Delivery</p>
                      <p className="text-xs sm:text-sm text-gray-500">On the way</p>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ opacity: deliveryStatus === 'delivered' ? 1 : 0.5 }}
                    className="flex items-start gap-3 sm:gap-4"
                  >
                    <div className={`p-2 sm:p-3 rounded-xl ${deliveryStatus === 'delivered' ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gray-200'}`}>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm sm:text-base text-gray-800">Delivered</p>
                      <p className="text-xs sm:text-sm text-gray-500">Order delivered</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xl">
                <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">Delivery Details</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-500">From</p>
                      <p className="font-medium text-sm sm:text-base text-gray-800 truncate">{deliveryData.seller.shopName || 'Seller'}</p>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{deliveryData.seller.address || 'Seller Location'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-500">To</p>
                      <p className="font-medium text-sm sm:text-base text-gray-800">Your Location</p>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{deliveryData.buyer.address || 'Delivery Address'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">Estimated Time</p>
                      <p className="font-medium text-sm sm:text-base text-gray-800">5-10 minutes</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {deliveryStatus === 'delivered' && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                Rate Your Experience
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
