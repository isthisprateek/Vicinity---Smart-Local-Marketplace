'use client';

import { useState, useEffect } from 'react';
import { Search, Sparkles, Zap, ShoppingCart, TrendingUp, Package, Rocket, Star, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import { Product, ApiResponse, UserRole } from '@/types';

export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const response = await api.get<ApiResponse<Product[]>>(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(response.data.data || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white overflow-hidden relative">
      {/* Animated Cursor Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.15), transparent 80%)`,
        }}
      />

      {/* Animated Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      {/* Floating Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-20 space-y-8">
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/20 rounded-full backdrop-blur-sm animate-fade-in">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              AI-Powered • Lightning Fast • Smart Shopping
            </span>
            <Rocket className="w-5 h-5 text-yellow-400 animate-pulse" />
          </div>

          {/* Main Title with Stagger Animation */}
          <div className="space-y-4">
            <h1 className="text-7xl md:text-9xl font-black tracking-tight">
              <span className="inline-block animate-slide-up bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Smarter
              </span>
              <br />
              <span className="inline-block animate-slide-up-delay bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                BlinkIt
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto animate-fade-in-up">
              Experience the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-semibold">future</span> of quick commerce
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in-up">
            <button
              onClick={() => router.push(user ? '/dashboard' : '/auth')}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
            >
              <span className="relative z-10 flex items-center gap-2">
                {user ? 'Go to Dashboard' : 'Get Started'}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            {user?.role === UserRole.SELLER && (
              <button
                onClick={() => router.push('/seller')}
                className="px-8 py-4 bg-gray-800/50 border border-gray-700 rounded-full font-semibold text-lg backdrop-blur-sm hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                Seller Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-20">
          <div className="relative group max-w-4xl mx-auto">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000 animate-gradient"></div>
            
            {/* Search Container */}
            <div className="relative bg-gray-900/90 backdrop-blur-2xl rounded-2xl border border-gray-800 p-8 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">AI Semantic Search</h2>
                  <p className="text-sm text-gray-400">Try: &quot;I have a cold&quot; or &quot;breakfast ideas&quot;</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="What are you looking for?"
                    className="w-full px-6 py-5 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500 text-lg transition-all group-hover:border-gray-600"
                  />
                  <Sparkles className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="px-8 py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/50 disabled:hover:scale-100"
                >
                  {searchLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((product, index) => (
                    <div
                      key={product.id}
                      style={{ animationDelay: `${index * 100}ms` }}
                      className="group relative p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-2 animate-fade-in cursor-pointer"
                      onClick={() => router.push(`/checkout?product=${product.id}`)}
                    >
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ShoppingCart className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-bold text-xl mb-3 text-white group-hover:text-purple-400 transition-colors">{product.name}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span>{product.category || 'General'}</span>
                        </div>
                        {product.brand && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Package className="w-4 h-4 text-purple-400" />
                            <span>{product.brand}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                        <span className="text-xs text-gray-500">#{product.barcode}</span>
                        <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: Zap,
              title: 'Lightning Fast',
              description: 'Get your items delivered in minutes, not hours',
              color: 'from-yellow-500 to-orange-500',
            },
            {
              icon: Sparkles,
              title: 'AI-Powered',
              description: 'Smart search understands your needs perfectly',
              color: 'from-purple-500 to-pink-500',
            },
            {
              icon: TrendingUp,
              title: 'Best Prices',
              description: 'Compare sellers and get the best deals instantly',
              color: 'from-green-500 to-emerald-500',
            },
          ].map((feature, index) => (
            <div
              key={index}
              style={{ animationDelay: `${index * 200}ms` }}
              className="group relative animate-fade-in-up"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r ${feature.color} rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative p-8 bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:-translate-y-2">
                <div className={`inline-flex p-4 bg-gradient-to-br ${feature.color} rounded-xl mb-4 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-20"></div>
          <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-800 p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: '10K+', label: 'Active Users' },
                { value: '50K+', label: 'Products' },
                { value: '5min', label: 'Avg Delivery' },
                { value: '99%', label: 'Satisfaction' },
              ].map((stat, index) => (
                <div key={index} className="space-y-2">
                  <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
