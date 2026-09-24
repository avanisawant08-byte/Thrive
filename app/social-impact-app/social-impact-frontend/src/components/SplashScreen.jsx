import React from 'react';
import { motion } from 'framer-motion';
import LeafLoader from './LeafLoader';

const SplashScreen = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a]">
      <div className="relative mb-8">
        <LeafLoader size="w-32 h-32" />
      </div>

      {/* Loading Text */}
      <div className="text-center px-4">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-xl font-medium tracking-[0.2em] mb-4 uppercase"
        >
          {message}
        </motion.h2>
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
