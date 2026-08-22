import React, { useState, useRef, useEffect } from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
];

const formatTime12h = (time24) => {
  if (!time24) return '--:--';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
};

const CustomDateTimePicker = ({
  dateValue,
  startTimeValue,
  endTimeValue,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial date
  const parseDate = (val) => {
    if (!val) return new Date();
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const initialDate = parseDate(dateValue);
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const [startTime, setStartTime] = useState(startTimeValue || '10:00');
  const [endTime, setEndTime] = useState(endTimeValue || '14:00');

  useEffect(() => {
    if (dateValue) {
      const d = parseDate(dateValue);
      setSelectedDate(d);
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
    }
    if (startTimeValue) setStartTime(startTimeValue);
    if (endTimeValue) setEndTime(endTimeValue);
  }, [dateValue, startTimeValue, endTimeValue]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate duration
  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diffMs = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMs <= 0) diffMs += 24 * 60; // Next day fallback
    return (diffMs / 60).toFixed(1);
  };

  const durationHours = calculateDuration(startTime, endTime);

  // Calendar math
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

  const emitAllChanges = (d, st, et) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    onChange({ date: dateStr, startTime: st, endTime: et, duration: calculateDuration(st, et) });
  };

  const handleSelectDay = (day) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    emitAllChanges(newDate, startTime, endTime);
  };

  const handleStartTimeSelect = (st) => {
    setStartTime(st);
    emitAllChanges(selectedDate, st, endTime);
  };

  const handleEndTimeSelect = (et) => {
    setEndTime(et);
    emitAllChanges(selectedDate, startTime, et);
  };

  const handleSetToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    emitAllChanges(today, startTime, endTime);
  };

  // Render days grid
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

  const formattedDateDisplay = selectedDate.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div ref={containerRef} className={`relative inline-block w-full select-none ${className}`}>
      {/* 3 Separate Visual Input Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Date Card */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Event Date</label>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full glass-button px-4 py-3.5 rounded-2xl flex items-center justify-between text-sm font-bold text-on-surface hover:text-[#00ff87] transition-all cursor-pointer shadow-lg active:scale-[0.99] border-none outline-none"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-lg">calendar_month</span>
              <span>{formattedDateDisplay}</span>
            </div>
            <span className="material-symbols-outlined text-xs text-on-surface-variant">expand_more</span>
          </button>
        </div>

        {/* 2. Start Time Card */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Start Time</label>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full glass-button px-4 py-3.5 rounded-2xl flex items-center justify-between text-sm font-bold text-on-surface hover:text-[#00ff87] transition-all cursor-pointer shadow-lg active:scale-[0.99] border-none outline-none"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-lg">schedule</span>
              <span>{formatTime12h(startTime)}</span>
            </div>
            <span className="material-symbols-outlined text-xs text-on-surface-variant">expand_more</span>
          </button>
        </div>

        {/* 3. End Time Card */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">End Time</label>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full glass-button px-4 py-3.5 rounded-2xl flex items-center justify-between text-sm font-bold text-on-surface hover:text-[#00ff87] transition-all cursor-pointer shadow-lg active:scale-[0.99] border-none outline-none"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-lg">alarm_off</span>
              <span>{formatTime12h(endTime)}</span>
            </div>
            <span className="material-symbols-outlined text-xs text-on-surface-variant">expand_more</span>
          </button>
        </div>
      </div>

      {/* Unified Custom Floating Glass Calendar & Time Picker Modal */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-3 max-w-md mx-auto rounded-3xl bg-[#0e1116]/95 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(0,255,135,0.15)] z-50 overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Navigation */}
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

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAY_NAMES.map((d) => (
              <span key={d} className="text-[11px] font-black uppercase text-zinc-400 py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center mb-5">
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

          {/* Time Picker Controls Section */}
          <div className="pt-4 border-t border-white/10 space-y-3 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#00ff87]">schedule</span>
                Start & End Time
              </span>
              <span className="text-xs font-black text-[#00ff87] bg-[#00ff87]/10 px-2.5 py-1 rounded-full border border-[#00ff87]/20">
                Duration: {durationHours} {Number(durationHours) === 1 ? 'hr' : 'hrs'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Start Time Dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1">Start Time</label>
                <select
                  value={startTime}
                  onChange={(e) => handleStartTimeSelect(e.target.value)}
                  className="w-full bg-[#161a20] text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-white/10 focus:border-[#00ff87] outline-none cursor-pointer"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t} className="bg-[#121418] text-white">
                      {formatTime12h(t)} ({t})
                    </option>
                  ))}
                </select>
              </div>

              {/* End Time Dropdown */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1">End Time</label>
                <select
                  value={endTime}
                  onChange={(e) => handleEndTimeSelect(e.target.value)}
                  className="w-full bg-[#161a20] text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-white/10 focus:border-[#00ff87] outline-none cursor-pointer"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t} className="bg-[#121418] text-white">
                      {formatTime12h(t)} ({t})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
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
              className="gradient-button text-on-primary font-black px-6 py-2 rounded-xl text-xs shadow-md cursor-pointer border-none"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDateTimePicker;
