import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Sparkles,
  Zap,
  ShoppingCart,
  TrendingUp,
  Package,
  Rocket,
  Star,
  ChevronRight,
  Search,
  Clock,
  MapPin,
  Shield,
  Truck,
  Heart,
  Users,
  Award,
  ArrowRight,
} from 'lucide-react';

export default function NewHomePage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  
  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-gray-900 overflow-x-hidden">
      {/* Subtle Cursor Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.08), transparent 80%)`,
        }}
      />

      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb22_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb22_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Floating Shapes */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-40 right-20 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      {/* Hero Section */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 min-h-screen flex items-center"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 w-full">
          <div className="text-center space-y-6 sm:space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-full shadow-sm"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              <span className="text-xs sm:text-sm font-semibold text-blue-600">
                AI-Powered • Lightning Fast • Smart Shopping
              </span>
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </motion.div>

            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.5 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="space-y-4 sm:space-y-6"
            >
              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight">
                <span className="inline-block bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  Smart
                </span>
                <br />
                <span className="inline-block bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Market
                </span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-600 max-w-4xl mx-auto font-light px-4">
                Experience the{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold">
                  future
                </span>{' '}
                of hyper-local commerce
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-4 sm:pt-8 px-4"
            >
              <button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto group relative px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold text-lg sm:text-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                  Get Started Free
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform" />
                </span>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white/80 backdrop-blur-sm border-2 border-gray-300 text-gray-700 rounded-full font-bold text-lg sm:text-xl hover:bg-white hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Sign In
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-32">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Why Choose Us?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Revolutionary features that make shopping faster, smarter, and more enjoyable
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              icon: Zap,
              title: 'Lightning Fast',
              description: 'Get your items delivered in minutes with our optimized delivery network',
              color: 'from-yellow-400 to-orange-400',
              delay: 0,
            },
            {
              icon: Sparkles,
              title: 'AI-Powered Search',
              description: 'Natural language processing understands exactly what you need',
              color: 'from-blue-400 to-indigo-400',
              delay: 0.2,
            },
            {
              icon: TrendingUp,
              title: 'Best Prices',
              description: 'Compare multiple sellers instantly and get unbeatable deals',
              color: 'from-green-400 to-emerald-400',
              delay: 0.4,
            },
            {
              icon: MapPin,
              title: 'Live Tracking',
              description: 'Track your order in real-time from seller to your doorstep',
              color: 'from-cyan-400 to-blue-400',
              delay: 0.6,
            },
            {
              icon: Shield,
              title: 'Secure Payments',
              description: 'Protected transactions with industry-leading security standards',
              color: 'from-indigo-400 to-purple-400',
              delay: 0.8,
            },
            {
              icon: Heart,
              title: 'Personalized',
              description: 'AI recommendations tailored to your preferences and needs',
              color: 'from-pink-400 to-rose-400',
              delay: 1,
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: feature.delay }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -5, transition: { duration: 0.2 } }}
              className="group relative"
            >
              <div className="relative p-6 sm:p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 h-full">
                <div className={`inline-flex p-4 sm:p-5 bg-gradient-to-br ${feature.color} rounded-xl sm:rounded-2xl mb-4 sm:mb-6 shadow-md`}>
                  <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-32">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            How It Works
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-8">
          {[
            { icon: Search, title: 'Search Smart', desc: 'Use natural language' },
            { icon: ShoppingCart, title: 'Add to Cart', desc: 'Select from best sellers' },
            { icon: Truck, title: 'Fast Delivery', desc: 'Track in real-time' },
            { icon: Star, title: 'Enjoy', desc: 'Rate your experience' },
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative text-center"
            >
              {index < 3 && (
                <div className="hidden lg:block absolute top-12 sm:top-16 left-[60%] w-[80%] h-1 bg-gradient-to-r from-blue-400 to-indigo-200" />
              )}
              <div className="relative inline-flex p-6 sm:p-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 shadow-xl">
                <step.icon className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-800">{step.title}</h3>
              <p className="text-sm sm:text-base text-gray-600">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-32"
      >
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-gray-200 p-8 sm:p-12 lg:p-16 shadow-xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 text-center">
            {[
              { icon: Users, value: '50K+', label: 'Happy Users' },
              { icon: Package, value: '100K+', label: 'Products' },
              { icon: Clock, value: '5min', label: 'Avg Delivery' },
              { icon: Award, value: '4.9★', label: 'Rating' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="space-y-3 sm:space-y-4"
              >
                <stat.icon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto text-blue-500" />
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-32 text-center"
      >
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Ready to Get Started?
        </h2>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-12 px-4">
          Join thousands of happy shoppers today
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/signup')}
          className="group relative px-8 sm:px-12 py-5 sm:py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-bold text-xl sm:text-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300"
        >
          <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
            Start Shopping Now
            <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 group-hover:translate-x-2 transition-transform" />
          </span>
        </motion.button>
      </motion.div>

      {/* Custom animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 20s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
