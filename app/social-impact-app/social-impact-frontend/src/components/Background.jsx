import React, { useEffect, useRef } from 'react';

const Background = () => {
  const spotlightRef = useRef(null);

  useEffect(() => {
    let animationFrameId = null;

    const handleMouseMove = (e) => {
      if (animationFrameId) return;
      animationFrameId = requestAnimationFrame(() => {
        if (spotlightRef.current) {
          spotlightRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
        }
        animationFrameId = null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 bg-[#f8fafc] dark:bg-[#08090a] overflow-hidden pointer-events-none select-none transition-colors duration-500">
      {/* Dynamic Ambient Aurora Orbs (Original Dark Neon + Crisp Light Mint) */}
      <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-br from-emerald-400/25 via-teal-300/15 to-sky-400/20 dark:from-[#00ff87]/10 dark:to-[#60efff]/5 blur-[130px] animate-aurora-slow" />
      
      <div className="absolute -bottom-[20%] -right-[10%] w-[55vw] h-[55vw] max-w-[750px] max-h-[750px] rounded-full bg-gradient-to-tl from-sky-400/20 via-emerald-300/15 to-teal-400/15 dark:from-[#60efff]/10 dark:to-[#00ff87]/5 blur-[130px] animate-aurora-reverse" />
      
      <div className="absolute top-[35%] left-[30%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-emerald-500/15 dark:bg-[#00ff87]/5 blur-[110px] animate-pulse-slow" />

      {/* Interactive Cursor Spotlight */}
      <div
        ref={spotlightRef}
        className="fixed top-0 left-0 w-[600px] h-[600px] pointer-events-none rounded-full bg-emerald-500/[0.06] dark:bg-[#00ff87]/[0.04] blur-[90px] will-change-transform"
        style={{ transform: 'translate3d(50vw, 50vh, 0) translate(-50%, -50%)' }}
      />
    </div>
  );
};

export default Background;
