import React, { useState, useRef, useEffect } from 'react';

const CustomSelect = ({ value, onChange, options, icon = 'sort', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block text-left select-none ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="glass-button px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-sm font-bold text-on-surface hover:text-emerald-600 dark:hover:text-[#00ff87] transition-all cursor-pointer shadow-sm dark:shadow-lg active:scale-95 border-none outline-none"
      >
        {icon && <span className="material-symbols-outlined text-emerald-600 dark:text-primary text-base">{icon}</span>}
        <span>{selectedOption?.label || value}</span>
        <span className={`material-symbols-outlined text-xs text-on-surface-variant transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-600 dark:text-[#00ff87]' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#0e1116]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(0,255,135,0.15)] z-50 overflow-hidden py-1.5 transition-colors">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-between cursor-pointer border-none outline-none ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-[#00ff87]/20 text-emerald-700 dark:text-[#00ff87]'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-emerald-50/80 dark:hover:bg-[#00ff87]/15 hover:text-emerald-700 dark:hover:text-[#00ff87]'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <span className="material-symbols-outlined text-sm text-emerald-600 dark:text-[#00ff87]">check</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
