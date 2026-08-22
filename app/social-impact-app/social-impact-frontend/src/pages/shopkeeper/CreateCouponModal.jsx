import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CreateCouponModal = ({ isOpen, onClose, onSuccess }) => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coinCost, setCoinCost] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post('/shopkeeper/coupons', {
        title,
        description,
        coinCost: Number(coinCost)
      });
      setLoading(false);
      onSuccess('Coupon created successfully!');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to create coupon');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-surface-container-high border border-white/10 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-on-surface-variant hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">local_offer</span>
            Create Reward Coupon
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Coupon Title</label>
              <input 
                required
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors"
                placeholder="e.g. 50% Off Coffee"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Description</label>
              <textarea 
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors h-24 resize-none"
                placeholder="Details of the offer..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface-variant mb-2">Coin Cost</label>
              <div className="relative">
                <input 
                  required
                  type="number"
                  min="1"
                  value={coinCost}
                  onChange={e => setCoinCost(e.target.value)}
                  className="w-full bg-surface-container-low border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors"
                  placeholder="e.g. 500"
                />
                <span className="material-symbols-outlined absolute right-4 top-3 text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 rounded-xl bg-primary text-on-primary font-black shadow-lg hover:shadow-[0_0_20px_rgba(0,255,135,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:scale-100"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined">add_circle</span>
                  Create Coupon
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateCouponModal;
