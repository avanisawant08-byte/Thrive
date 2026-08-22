import React, { useState, useRef, useEffect } from 'react';

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
];

const format12h = (time24) => {
  if (!time24) return '--:--';
  const [h, m] = time24.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
};

const CustomTimePicker = ({
  value = '',
  onChange,
  label = 'Time',
  placeholder = 'Select Time',
  icon = 'schedule',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTime = (t) => {
    onChange(t);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full select-none ${className}`}>
      {label && <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-button px-4 py-3.5 rounded-2xl flex items-center justify-between text-sm font-bold text-on-surface hover:text-[#00ff87] transition-all cursor-pointer shadow-lg active:scale-[0.99] border-none outline-none"
      >
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
          <span className={value ? 'text-on-surface font-bold' : 'text-on-surface-variant/60'}>
            {value ? format12h(value) : placeholder}
          </span>
        </div>
        <span className={`material-symbols-outlined text-xs text-on-surface-variant transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#00ff87]' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Custom Glassmorphic Time List Popup */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-full max-h-60 overflow-y-auto rounded-3xl bg-[#0e1116]/95 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(0,255,135,0.15)] z-50 p-2 space-y-1 scrollbar-thin">
          {TIME_SLOTS.map((t) => {
            const isSelected = t === value;
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleSelectTime(t)}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer border-none outline-none ${
                  isSelected
                    ? 'bg-[#00ff87] text-[#00210c] font-black shadow-[0_0_15px_rgba(0,255,135,0.5)]'
                    : 'text-zinc-200 hover:bg-[#00ff87]/15 hover:text-[#00ff87]'
                }`}
              >
                <span>{format12h(t)}</span>
                <span className="text-[10px] opacity-60 font-mono">({t})</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomTimePicker;
