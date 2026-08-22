import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const Bar = ({ value, max, color = '#00ff87' }) => (
  <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-700"
      style={{ width: `${max > 0 ? Math.min((value / max) * 100, 100) : 0}%`, background: color }}
    />
  </div>
);

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TYPE_ICONS = {
  volunteer: '🙋', donation_drive: '🎁', disaster_relief: '🚨',
  medical_camp: '🏥', environment: '🌱', education: '📚',
};

const NGOAnalytics = ({ analytics: dashAnalytics, events: dashEvents }) => {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [volRes, evRes, donRes, coinsRes] = await Promise.allSettled([
          API.get('/ngo/analytics/volunteers'),
          API.get('/ngo/analytics/events'),
          API.get('/ngo/analytics/donations'),
          API.get('/ngo/analytics/coins'),
        ]);
        setApiData({
          volunteers: volRes.status === 'fulfilled' ? volRes.value.data : null,
          events: evRes.status === 'fulfilled' ? evRes.value.data : null,
          donations: donRes.status === 'fulfilled' ? donRes.value.data : null,
          coins: coinsRes.status === 'fulfilled' ? coinsRes.value.data : null,
        });
      } catch (err) {
        console.warn('Analytics API not available, using dashboard data.', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // --- Compute values: prefer API data, fall back to dashboard props ---
  const totalEvents = apiData?.events?.total ?? dashAnalytics?.totalEvents ?? (dashEvents?.length || 0);
  const totalVolunteers = apiData?.volunteers?.total ?? dashAnalytics?.activeVolunteers ?? 0;
  const totalCoins = apiData?.coins?.total ?? dashAnalytics?.totalCoinsDistributed ?? dashAnalytics?.impactCoinsDistributed ?? 0;
  const totalDonations = apiData?.donations?.total ?? dashAnalytics?.totalDonationsReceived ?? 0;

  // Build events-by-type from the real events list if API not available
  const eventsByType = apiData?.events?.byType ?? (() => {
    if (!dashEvents?.length) return [];
    const counts = {};
    dashEvents.forEach(ev => {
      counts[ev.eventType] = (counts[ev.eventType] || 0) + 1;
    });
    return Object.entries(counts).map(([_id, count]) => ({ _id, count }));
  })();

  const volMonthly = apiData?.volunteers?.monthly ?? [];
  const coinsMonthly = apiData?.coins?.monthly ?? [];
  const topVolunteers = apiData?.volunteers?.topVolunteers ?? [];

  const maxVolMonthly = Math.max(...(volMonthly.map(m => m.count) || [0]), 1);
  const maxCoinsMonthly = Math.max(...(coinsMonthly.map(m => m.total) || [0]), 1);
  const maxEventType = Math.max(...eventsByType.map(e => e.count), 1);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black tracking-tight">Analytics & Growth Reports</h2>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Volunteers', value: totalVolunteers, icon: 'group', color: '#00ff87' },
          { label: 'Events Hosted', value: totalEvents, icon: 'event', color: '#00b8ff' },
          { label: 'Coins Distributed', value: totalCoins.toLocaleString(), icon: 'token', color: '#c77dff' },
          { label: 'Donations Verified', value: totalDonations, icon: 'favorite', color: '#ff9f00' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-container-low p-5 rounded-3xl border border-white/5">
            <span className="material-symbols-outlined text-2xl mb-3 block" style={{ color: stat.color, fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">{stat.label}</p>
            <p className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events by Type (computed from real event list) */}
        <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-6">Events by Type</p>
          {eventsByType.length > 0 ? (
            <div className="space-y-4">
              {eventsByType.map((ev, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm w-5 flex-shrink-0">{TYPE_ICONS[ev._id] || '📌'}</span>
                  <span className="text-[10px] text-on-surface-variant w-24 flex-shrink-0 capitalize">
                    {ev._id?.replace('_', ' ')}
                  </span>
                  <div className="flex-1"><Bar value={ev.count} max={maxEventType} color="#00b8ff" /></div>
                  <span className="text-xs font-black text-[#00b8ff] w-6 text-right">{ev.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl opacity-20 block mb-2">bar_chart</span>
              <p className="text-sm">Create events to see type breakdown.</p>
            </div>
          )}
        </div>

        {/* All Hosted Events Quick List */}
        <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-6">Hosted Events</p>
          {dashEvents?.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {dashEvents.map((ev, i) => {
                const statusColors = {
                  upcoming: 'text-[#00b8ff]',
                  ongoing: 'text-[#00ff87]',
                  completed: 'text-on-surface-variant',
                  cancelled: 'text-red-400',
                };
                return (
                  <div key={ev._id || i} className="flex items-center gap-3 p-3 bg-surface-container-high rounded-xl">
                    <span className="text-lg flex-shrink-0">{TYPE_ICONS[ev.eventType] || '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate">{ev.title}</p>
                      <p className="text-[10px] text-on-surface-variant">
                        {ev.date ? new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-black uppercase flex-shrink-0 ${statusColors[ev.status] || 'text-on-surface-variant'}`}>
                      {ev.status || 'upcoming'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl opacity-20 block mb-2">event</span>
              <p className="text-sm">No events hosted yet.</p>
            </div>
          )}
        </div>

        {/* Volunteer Growth Chart */}
        <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-6">Volunteer Growth (Monthly)</p>
          {volMonthly.length > 0 ? (
            <div className="space-y-3">
              {volMonthly.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] text-on-surface-variant w-7 flex-shrink-0">
                    {MONTH_LABELS[(m.month || 1) - 1]}
                  </span>
                  <div className="flex-1"><Bar value={m.count} max={maxVolMonthly} color="#00ff87" /></div>
                  <span className="text-xs font-black text-primary-container w-8 text-right">{m.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl opacity-20 block mb-2">show_chart</span>
              <p className="text-sm">No monthly data yet.</p>
            </div>
          )}
        </div>

        {/* Top Volunteers */}
        <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-6">Top Volunteers</p>
          {topVolunteers.length > 0 ? (
            <div className="space-y-3">
              {topVolunteers.slice(0, 8).map((vol, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`text-sm font-black w-5 flex-shrink-0 ${
                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-400' : 'text-on-surface-variant'
                  }`}>{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-xs font-black text-primary-container flex-shrink-0 overflow-hidden">
                    {vol.profilePhoto
                      ? <img src={vol.profilePhoto} alt="" className="w-full h-full object-cover" />
                      : (vol.name?.substring(0, 2) || 'V').toUpperCase()
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate">{vol.name}</p>
                    <p className="text-[10px] text-on-surface-variant">{vol.eventsCount} events</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black text-primary-container">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>token</span>
                    {vol.coinsEarned ?? 0}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl opacity-20 block mb-2">emoji_events</span>
              <p className="text-sm">No volunteer data yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NGOAnalytics;
