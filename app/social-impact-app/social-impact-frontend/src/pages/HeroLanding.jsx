import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';

const HeroLanding = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalActivities: 0, totalCoins: 0, activeMembers: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/stats/platform');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load platform stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleStartImpact = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user?.role === 'ngo') {
          return navigate('/ngo-command');
        }
      } catch (_) {}
      return navigate('/dashboard');
    }
    navigate('/register');
  };

  const formatNumber = (num) => {
    if (num >= 100000) return (num / 100000).toFixed(1).replace(/\.0$/, '') + 'L+';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K+';
    return num.toLocaleString('en-IN');
  };

  return (
    <main className="relative overflow-hidden z-10 pb-28 md:pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-20 px-4 sm:px-8">
        <div className="max-w-screen-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full glass-card mb-6 sm:mb-8">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Live Impact Pulse Tracking</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-[-0.03em] text-slate-900 dark:text-[#f1ffef] leading-[1.1] mb-6 sm:mb-8 transition-colors">
            Do Good. Earn <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 dark:from-[#f1ffef] dark:to-[#00ff87]">Rewards.</span> Make Impact.
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-on-surface-variant leading-relaxed mb-8 sm:mb-12">
            The world's first social-action economy. Volunteer for causes you love, track your positive footprint, and unlock exclusive rewards from brands that care.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={handleStartImpact}
              className="gradient-button text-on-primary text-base sm:text-lg font-extrabold px-8 sm:px-10 py-4 sm:py-5 rounded-full cursor-pointer w-full sm:w-auto"
            >
              Start Making Impact
            </button>
            <Link to="/reward-store" className="glass-button text-primary text-base sm:text-lg font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-full inline-block cursor-pointer w-full sm:w-auto text-center">
              View Marketplace
            </Link>
          </div>
        </div>

        {/* Stats Section — Real Data */}
        <div className="max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8 mt-16 sm:mt-24 md:mt-32">
          <div className="glass-card p-6 sm:p-10 rounded-3xl sm:rounded-[32px] text-center">
            <div className="text-primary-container mb-3 sm:mb-4">
              <span className="material-symbols-outlined text-3xl sm:text-4xl">volunteer_activism</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-primary mb-1 sm:mb-2">
              {statsLoading ? (
                <span className="inline-block w-24 h-10 bg-surface-container-high/50 rounded-xl animate-pulse"></span>
              ) : (
                formatNumber(stats.totalActivities)
              )}
            </div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Total Activities</div>
          </div>
          <div className="glass-card p-6 sm:p-10 rounded-3xl sm:rounded-[32px] text-center">
            <div className="text-primary-container mb-3 sm:mb-4">
              <span className="material-symbols-outlined text-3xl sm:text-4xl">token</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-primary mb-1 sm:mb-2">
              {statsLoading ? (
                <span className="inline-block w-24 h-10 bg-surface-container-high/50 rounded-xl animate-pulse"></span>
              ) : (
                formatNumber(stats.totalCoins)
              )}
            </div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Coins Generated</div>
          </div>
          <div className="glass-card p-6 sm:p-10 rounded-3xl sm:rounded-[32px] text-center sm:col-span-2 md:col-span-1">
            <div className="text-primary-container mb-3 sm:mb-4">
              <span className="material-symbols-outlined text-3xl sm:text-4xl">groups</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-primary mb-1 sm:mb-2">
              {statsLoading ? (
                <span className="inline-block w-24 h-10 bg-surface-container-high/50 rounded-xl animate-pulse"></span>
              ) : (
                formatNumber(stats.activeMembers)
              )}
            </div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Active Members</div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-surface-container-low/30 backdrop-blur-sm">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 sm:mb-16 gap-6">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-container mb-3 sm:mb-4">Ecosystem Features</h2>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-primary leading-tight">Everything you need to <br className="hidden sm:inline" /> change the world.</h3>
            </div>
            <p className="max-w-sm text-sm sm:text-base text-on-surface-variant">Our platform bridges the gap between grassroots activism and premium brand experiences.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 sm:gap-6">
            <div className="md:col-span-3 glass-card rounded-3xl sm:rounded-[32px] p-6 sm:p-8 flex flex-col justify-end relative overflow-hidden group min-h-[260px] sm:min-h-[300px]">
              <div className="absolute top-0 right-0 p-6 sm:p-8">
                <span className="material-symbols-outlined text-primary-container text-4xl sm:text-5xl opacity-20 group-hover:opacity-100 transition-opacity">explore</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-primary mb-2">Local Discovery</h4>
              <p className="text-on-surface-variant text-sm sm:text-base">Find volunteering opportunities within 5 miles of your current location using real-time GPS.</p>
            </div>
            <div className="md:col-span-3 glass-card rounded-3xl sm:rounded-[32px] p-6 sm:p-8 flex flex-col justify-end relative overflow-hidden group min-h-[260px] sm:min-h-[300px]">
              <div className="absolute top-0 right-0 p-6 sm:p-8">
                <span className="material-symbols-outlined text-primary-container text-4xl sm:text-5xl opacity-20 group-hover:opacity-100 transition-opacity">security</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-primary mb-2">Verified Proof</h4>
              <p className="text-on-surface-variant text-sm sm:text-base">Blockchain-backed verification ensures every minute of your contribution is recorded fairly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 sm:py-20 px-4 sm:px-8">
        <div className="max-w-screen-xl mx-auto glass-card rounded-3xl sm:rounded-[48px] p-8 sm:p-12 md:p-24 text-center overflow-hidden relative">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-container/10 blur-[100px] rounded-full"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-container/10 blur-[100px] rounded-full"></div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 dark:text-primary mb-6 sm:mb-8 leading-tight">Ready to start <br /> your pulse?</h2>
          <p className="text-base sm:text-xl text-on-surface-variant mb-8 sm:mb-12 max-w-xl mx-auto">
            Join our growing community of individuals making a real-world difference every single day.
          </p>
          <button
            onClick={handleStartImpact}
            className="gradient-button text-on-primary text-lg sm:text-xl font-black px-8 sm:px-12 py-4 sm:py-6 rounded-full cursor-pointer w-full sm:w-auto"
          >
            Get Started Today
          </button>
        </div>
      </section>
    </main>
  );
};

export default HeroLanding;
