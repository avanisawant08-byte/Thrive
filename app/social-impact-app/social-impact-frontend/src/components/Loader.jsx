import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LeafLoader from './LeafLoader';

const Loader = ({ 
  loading, 
  message = "Loading...", 
  fullScreen = false, 
  inline = false,
  size = "w-16 h-16" 
}) => {
  if (fullScreen) {
    return (
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <div className="bg-zinc-900/80 p-8 rounded-3xl border border-white/10 flex flex-col items-center shadow-2xl">
              <LeafLoader size="w-24 h-24" />
              {message && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-white text-sm font-medium tracking-widest uppercase"
                >
                  {message}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (inline) {
    return loading ? (
      <div className="flex items-center gap-3">
        <LeafLoader size="w-6 h-6" />
        {message && <span className="text-sm font-medium text-white/70">{message}</span>}
      </div>
    ) : null;
  }

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex flex-col items-center justify-center p-8"
        >
          <LeafLoader size={size} />
          {message && (
            <p className="mt-4 text-white/50 text-sm font-medium tracking-widest uppercase">
              {message}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loader;
