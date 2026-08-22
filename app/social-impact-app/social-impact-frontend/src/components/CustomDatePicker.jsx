import React, { useState, useRef, useEffect } from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const CustomDatePicker = ({
  value,
  onChange,
  label = 'Date',
  placeholder = 'Select Date',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const parseDate = (val) => {
    if (!val) return new Date();
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const initialDate = parseDate(value);
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState(initialDate);

  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      setSelectedDate(d);
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = String(newDate.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
  };

  const handleSetToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
  };

  const totalDays = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const prevMonthDays = getDaysInMonth(currentMonth === 0 ? 11 : currentMonth - 1, currentMonth === 0 ? currentYear - 1 : currentYear);

  const daysGrid = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    daysGrid.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }
  for (let i = 1; i <= totalDays; i++) {
    daysGrid.push({ day: i, isCurrentMonth: true });
  }

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return (
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

  const formattedDisplay = value
    ? selectedDate.toLocaleString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : '';

  return (
    <div ref={containerRef} className={`relative inline-block w-full select-none ${className}`}>
      {label && <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-button px-4 py-3.5 rounded-2xl flex items-center justify-between text-sm font-bold text-on-surface hover:text-[#00ff87] transition-all cursor-pointer shadow-lg active:scale-[0.99] border-none outline-none"
      >
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-lg">calendar_month</span>
          <span className={formattedDisplay ? 'text-on-surface' : 'text-on-surface-variant/60'}>
            {formattedDisplay || placeholder}
          </span>
        </div>
        <span className={`material-symbols-outlined text-xs text-on-surface-variant transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#00ff87]' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Floating Custom Glass Calendar Popup */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-84 rounded-3xl bg-[#0e1116]/95 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(0,255,135,0.15)] z-50 overflow-hidden p-5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <h4 className="text-base font-black text-[#00ff87] tracking-tight">
                {MONTH_NAMES[currentMonth]} <span className="text-white font-medium">{currentYear}</span>
              </h4>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#00ff87]/15 hover:text-[#00ff87] flex items-center justify-center text-zinc-300 transition-all cursor-pointer border-none"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#00ff87]/15 hover:text-[#00ff87] flex items-center justify-center text-zinc-300 transition-all cursor-pointer border-none"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAY_NAMES.map((d) => (
              <span key={d} className="text-[11px] font-black uppercase text-zinc-400 py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-4">
            {daysGrid.map((item, idx) => {
              if (!item.isCurrentMonth) {
                return (
                  <span key={idx} className="text-xs text-zinc-600 py-2 select-none">
                    {item.day}
                  </span>
                );
              }

              const selected = isSelected(item.day);
              const today = isToday(item.day);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(item.day)}
                  className={`w-9 h-9 mx-auto rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer border-none outline-none ${
                    selected
                      ? 'bg-[#00ff87] text-[#00210c] font-black shadow-[0_0_15px_rgba(0,255,135,0.5)] scale-105'
                      : today
                      ? 'border border-[#00ff87]/60 text-[#00ff87] hover:bg-[#00ff87]/15'
                      : 'text-zinc-200 hover:bg-[#00ff87]/15 hover:text-[#00ff87]'
                  }`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-xs font-bold text-[#00ff87] hover:underline cursor-pointer bg-transparent border-none"
            >
              Set Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="gradient-button text-on-primary font-black px-4 py-1.5 rounded-xl text-xs shadow-md cursor-pointer border-none"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDatePicker;
