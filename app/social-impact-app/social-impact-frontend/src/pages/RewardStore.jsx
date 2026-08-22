import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import ScratchCard from '../components/ScratchCard';
import Loader from '../components/Loader';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { getRewardImageSrc } from '../utils/rewardImageHelper';

const RewardStore = () => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemedItem, setRedeemedItem] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(redeemCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await API.get('/store');
        setItems(response.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching rewards:', error);
        setItems([]);
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleScratchComplete = () => {
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 25, spread: 360, ticks: 60, zIndex: 1000 };

    // Gentle initial pop
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00ff87', '#f1ffef', '#00b8ff', '#ffffff']
    });

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 20 * (timeLeft / duration);
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults, particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleRedeem = async (item) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to redeem rewards');
        return;
      }
      
      const response = await API.post(`/store/${item._id}/redeem`);
      setRedeemCode(response.data.couponCode);
      setRedeemedItem(item);
      setShowModal(true);
      
      // Update local storage and Navbar
      const storedUser = localStorage.getItem('user');
      if (storedUser && response.data.remainingCoins !== undefined) {
        const userObj = JSON.parse(storedUser);
        userObj.coinBalance = response.data.remainingCoins;
        localStorage.setItem('user', JSON.stringify(userObj));
        window.dispatchEvent(new Event('userUpdated'));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const filteredItems = category === 'All' 
    ? items 
    : items.filter(item => item.category === category.toLowerCase().slice(0, -1) || item.category === category.toLowerCase());

  if (loading) return <Loader loading={true} message="Loading Marketplace Rewards..." />;

  return (
    <main className="px-6 pt-8 max-w-7xl mx-auto relative z-10 pb-32">
      {/* Hero Section / Title */}
      <div className="mb-10">
        <div className="flex items-end justify-between mb-2">
          <h1 className="text-5xl font-black tracking-tighter leading-none text-slate-900 dark:text-primary transition-colors">Store 🛍️</h1>
          <span className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface-variant opacity-60">Curated Impact</span>
        </div>
        <div className="h-1 w-24 bg-gradient-to-r from-primary-container to-transparent rounded-full"></div>
      </div>

      {/* Category Filter */}
      <section className="mb-12">
        <div className="flex gap-3 overflow-x-auto py-3 px-1.5 scrollbar-hide items-center">
          {['All Rewards', 'Coupons', 'Discounts', 'Products', 'Experiences'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setCategory(cat.split(' ')[0])}
              className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all duration-200 cursor-pointer hover:-translate-y-1 active:translate-y-0 ${
                category === cat.split(' ')[0]
                ? 'gradient-button shadow-md'
                : 'glass-button text-on-surface-variant hover:text-slate-900 dark:hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Rewards Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl p-12 max-w-xl mx-auto">
          <span className="material-symbols-outlined text-6xl text-slate-400 dark:text-zinc-600 mb-4 block">inventory_2</span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No Rewards Available in this Category</h3>
          <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6">Check back soon or explore other reward categories.</p>
          <button
            onClick={() => setCategory('All')}
            className="px-6 py-2.5 rounded-full bg-primary-container text-white dark:text-on-primary-container font-black text-xs uppercase tracking-wider"
          >
            Show All Rewards
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map(item => (
          <div key={item._id} className="glass-card rounded-3xl overflow-hidden group hover:border-primary-container/40 transition-all duration-500 shadow-xl flex flex-col">
            <div className="relative h-56 overflow-hidden">
              <img 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                src={getRewardImageSrc(item)}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getRewardImageSrc(item, true);
                }} 
              />
              <div className="absolute top-4 left-4 bg-primary-container/90 backdrop-blur-md text-white dark:text-on-primary-container text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                {item.category}
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">{item.title}</h3>
              <p className="text-on-surface-variant text-sm line-clamp-2 mb-6 opacity-80">{item.description}</p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-black text-emerald-600 dark:text-primary-container">{item.coinCost.toLocaleString()}</span>
                  <span className="material-symbols-outlined text-emerald-600 dark:text-primary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
                </div>
                <button 
                  onClick={() => handleRedeem(item)}
                  className="px-5 py-2 rounded-xl gradient-button font-bold text-sm transition-transform active:scale-95 duration-200">
                  Redeem
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Featured Card */}
        <div className="md:col-span-2 glass-card rounded-3xl overflow-hidden group hover:border-primary-container/30 transition-all duration-500 flex flex-col md:flex-row shadow-xl min-h-[300px]">
          <div className="relative w-full md:w-1/2 h-64 md:h-auto overflow-hidden">
            <img alt="Experience" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden"></div>
          </div>
          <div className="p-8 flex flex-col justify-center flex-1">
            <div className="text-emerald-600 dark:text-[#00ff87] text-[10px] font-black uppercase tracking-widest mb-2">Featured Experience</div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Eco-Trek Expedition</h3>
            <p className="text-on-surface-variant mb-8 text-sm md:text-base leading-relaxed">Join a guided weekend trek through the Highlands. All gear and carbon-neutral transport included.</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-4xl font-black text-emerald-600 dark:text-primary-container">15,000</span>
                <span className="material-symbols-outlined text-emerald-600 dark:text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
              </div>
                <button 
                onClick={() => toast.info('This featured experience will be available soon!')}
                className="px-8 py-3 rounded-2xl gradient-button font-black text-base shadow-lg active:scale-95 transition-all">REDEEM NOW</button>
            </div>
          </div>
        </div>
      </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="glass-card border border-emerald-500/30 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
              
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-5xl text-emerald-600 dark:text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  redeem
                </span>
              </div>
              
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Reward Unlocked!</h2>
              <p className="text-on-surface-variant mb-6">
                You've successfully redeemed <strong className="text-slate-900 dark:text-white">{redeemedItem?.title}</strong>. 
                Here is your exclusive code:
              </p>
              
              <div className="flex justify-center mb-8">
                <ScratchCard width={320} height={120} onComplete={handleScratchComplete}>
                  <div className="w-full h-full flex flex-col items-center justify-center relative group">
                    <p className="text-sm text-emerald-600 dark:text-primary mb-1 uppercase tracking-widest font-bold">Your Coupon Code</p>
                    <div className="flex items-center justify-center gap-3 mt-1">
                      <p className="text-4xl font-mono font-black text-slate-900 dark:text-white tracking-wider select-all">{redeemCode}</p>
                      <button 
                        onClick={handleCopy}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-surface-variant/50 hover:bg-emerald-100 dark:hover:bg-primary/20 text-emerald-600 dark:text-primary transition-colors flex items-center justify-center pointer-events-auto"
                        title="Copy to clipboard"
                      >
                        {isCopied ? (
                          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        ) : (
                          <span className="material-symbols-outlined text-xl">content_copy</span>
                        )}
                      </button>
                    </div>
                    {isCopied && <span className="absolute -top-3 right-4 bg-primary text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg animate-bounce">Copied!</span>}
                  </div>
                </ScratchCard>
              </div>
              
              <button 
                onClick={() => setShowModal(false)}
                className="w-full py-4 rounded-xl gradient-button font-black text-lg shadow-lg active:scale-95 transition-all"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
};

export default RewardStore;
