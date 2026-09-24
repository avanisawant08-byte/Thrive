import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="glass-card max-w-lg w-full text-center p-8 sm:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-container/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#60efff]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-3xl bg-primary-container/10 border border-primary-container/20 flex items-center justify-center text-primary-container shadow-inner">
          <span className="material-symbols-outlined text-4xl sm:text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            travel_explore
          </span>
        </div>

        <span className="text-xs uppercase tracking-[0.25em] font-black text-primary-container mb-2 block">
          Error 404
        </span>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
          Page Not Found
        </h1>

        <p className="text-sm text-on-surface-variant max-w-sm mx-auto mb-8 font-medium leading-relaxed">
          The impact route you are looking for doesn't exist or has moved to a new destination.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto gradient-button text-on-primary font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all text-center flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">home</span>
            <span>Return Home</span>
          </Link>
          <Link
            to="/events"
            className="w-full sm:w-auto glass-button text-slate-900 dark:text-white font-bold px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider active:scale-95 transition-all text-center flex items-center justify-center gap-2 border border-slate-300 dark:border-white/10"
          >
            <span className="material-symbols-outlined text-sm">event</span>
            <span>Explore Events</span>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
