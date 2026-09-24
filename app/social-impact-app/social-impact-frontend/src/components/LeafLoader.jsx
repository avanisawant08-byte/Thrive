import React from 'react';
import { motion } from 'framer-motion';

const LeafLoader = ({ size = "w-24 h-24", className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center ${size} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Pre-drawn Outline (The "Container") */}
        <path
          d="M50 15 C 25 25 20 65 50 90 C 80 65 75 25 50 15 Z"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="2"
          fill="rgba(255,255,255,0.03)"
          transform="rotate(-15 50 50)"
        />
        
        {/* The Vein (Always visible but faint) */}
        <path
          d="M50 18 L50 88"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          strokeLinecap="round"
          transform="rotate(-15 50 50)"
        />
        
        {/* Clipping Mask for the "Poured In" Effect */}
        <defs>
          <clipPath id="leaf-fill-clip">
            <path 
              d="M50 15 C 25 25 20 65 50 90 C 80 65 75 25 50 15 Z" 
              transform="rotate(-15 50 50)"
            />
          </clipPath>
          
          <linearGradient id="leaf-fill-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
        </defs>

        {/* Filling Color (Bottom to Top) */}
        <motion.rect
          x="0"
          y="0"
          width="100"
          height="100"
          fill="url(#leaf-fill-gradient)"
          clipPath="url(#leaf-fill-clip)"
          initial={{ y: 100 }}
          animate={{ y: [100, 0, 0, 100] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            times: [0, 0.7, 0.8, 1],
            ease: "easeInOut",
          }}
        />

        {/* The Vein highlight (Brightens as it fills) */}
        <motion.path
          d="M50 18 L50 88"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="1.5"
          strokeLinecap="round"
          transform="rotate(-15 50 50)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 1, 0],
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            times: [0, 0.7, 0.8, 1],
            ease: "easeInOut",
          }}
        />
      </svg>

      {/* Pulsing glow behind the leaf */}
      <motion.div
        className="absolute inset-0 bg-green-500/10 blur-2xl rounded-full -z-10"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export default LeafLoader;
