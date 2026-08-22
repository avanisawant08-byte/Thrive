import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ScratchCard = ({ children, onComplete, width = 300, height = 150 }) => {
  const canvasRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Fill canvas overlay with gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#00ff87');
    gradient.addColorStop(1, '#00b8ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add text overlay
    ctx.fillStyle = '#0a0a0a';
    ctx.font = '900 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH TO REVEAL', width / 2, height / 2);
    
    // Add some noise/texture for realistic scratch card look
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3})`;
      ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }
  }, [width, height]);

  const scratch = (x, y) => {
    if (isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 70; // Adjusted brush for a balanced scratch feel
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    if (lastPointRef.current) {
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    } else {
      ctx.moveTo(x, y);
    }
    ctx.lineTo(x, y);
    ctx.stroke();
    
    lastPointRef.current = { x, y };
    
    checkReveal();
  };

  const checkReveal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    
    // Check every 4th pixel for alpha channel, jumping by 4 to optimize
    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] === 0) transparentPixels++;
    }
    
    const percentage = (transparentPixels / (pixels.length / 16)) * 100;
    if (percentage > 45) { // Increased threshold so user has to scratch more
      setIsRevealed(true);
      if (onComplete) onComplete();
    }
  };

  const handlePointerDown = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastPointRef.current = { x: clientX - rect.left, y: clientY - rect.top };
    
    // Trigger initial dot
    scratch(clientX - rect.left, clientY - rect.top);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    scratch(x, y);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  return (
    <div 
      className="relative select-none rounded-2xl overflow-hidden shadow-inner bg-black/40 border border-primary/20" 
      style={{ width, height, touchAction: 'none' }}
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center p-4">
        {children}
      </div>
      
      <AnimatePresence>
        {!isRevealed && (
          <motion.canvas
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute inset-0 z-10 cursor-crosshair touch-none"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScratchCard;
