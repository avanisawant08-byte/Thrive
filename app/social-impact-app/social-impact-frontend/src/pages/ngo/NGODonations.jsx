import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const SUBTABS = ['Overview', 'Pending', 'History'];

const TYPE_COLORS = {
  food:      { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: '🍛' },
  clothes:   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20',   icon: '👕' },
  necessities:{ bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', icon: '🧴' },
  monetary:  { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', icon: '💰' },
  online_monetary: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', icon: '💳' },
};

const StatCard = ({ icon, label, value, sub, color = 'text-primary-container' }) => (
  <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5">
    <div className="flex items-center gap-3 mb-4">
      <span className="text-2xl">{icon}</span>
      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{label}</p>
    </div>
    <h3 className={`text-4xl font-black tracking-tighter ${color}`}>{value}</h3>
    {sub && <p className="text-xs text-on-surface-variant mt-2">{sub}</p>}
  </div>
);

const NGODonations = () => {
  const [subTab, setSubTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [proofModal, setProofModal] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes] = await Promise.allSettled([
        API.get('/ngo/donations/stats'),
        API.get('/ngo/donations/pending'),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (pendingRes.status === 'fulfilled') {
        const all = pendingRes.value.data || [];
        setPending(all.filter(d => d.status === 'proof_submitted'));
        setHistory(all.filter(d => ['verified', 'rejected'].includes(d.status)));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (id, action) => {
    try {
      await API.put(`/ngo/donations/${id}/${action}`);
      showToast(action === 'confirm' ? 'Donation confirmed! Coins awarded.' : 'Donation rejected.');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const DonationRow = ({ d, showActions }) => {
    const meta = TYPE_COLORS[d.donationType] || TYPE_COLORS.food;
    return (
      <div className="bg-surface-container-low rounded-2xl p-5 border border-white/5 flex items-start gap-4">
        <span className="text-2xl flex-shrink-0">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-black text-sm">{d.userId?.name || 'Anonymous'}</p>
            {d.isBirthdayDonation && (
              <span className="text-[9px] font-black bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded-full">🎂 Birthday</span>
            )}
            {d.isReliefDonation && (
              <span className="text-[9px] font-black bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">🚨 Relief</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-wrap">
            <span className={`${meta.bg} ${meta.text} ${meta.border} border px-2 py-0.5 rounded-full font-bold capitalize`}>
              {d.donationType?.replace('_', ' ')}
            </span>
            <span>{d.quantityOrAmount}</span>
            <span>{d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN') : ''}</span>
          </div>
          {d.message && <p className="text-xs text-on-surface-variant mt-1 italic">"{d.message}"</p>}
          {d.proofMedia?.length > 0 && (
            <button
              onClick={() => setProofModal(d.proofMedia)}
              className="mt-2 text-xs text-primary-container font-bold flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-sm">photo_library</span>
              View {d.proofMedia.length} proof photo(s)
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {showActions && d.status === 'proof_submitted' && (
            <>
              <button
                onClick={() => handleAction(d._id, 'reject')}
                className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                title="Reject"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
              <button
                onClick={() => handleAction(d._id, 'confirm')}
                className="p-2.5 rounded-xl bg-primary-container/10 text-primary-container hover:bg-primary-container/20 border border-primary-container/20 transition-colors"
                title="Confirm receipt"
              >
                <span className="material-symbols-outlined text-sm">check</span>
              </button>
            </>
          )}
          {!showActions && (
            <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${
              d.status === 'verified'
                ? 'bg-[#00ff87]/10 text-[#00ff87] border-[#00ff87]/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {d.status?.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-3 ${
          toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-primary-container text-on-primary-container'
        }`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}

      {/* Proof Modal */}
      {proofModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setProofModal(null)}>
          <div className="bg-surface rounded-2xl p-4 max-w-xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <p className="font-black">Proof Photos</p>
              <button onClick={() => setProofModal(null)} className="p-1 rounded-lg hover:bg-surface-container-high">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {proofModal.map((url, i) => (
                <img key={i} src={url} alt={`Proof ${i+1}`} className="rounded-xl w-full h-40 object-cover" />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight">Donations</h2>
        {pending.length > 0 && (
          <span className="px-3 py-1 bg-[#ff9f00]/10 text-[#ff9f00] border border-[#ff9f00]/20 rounded-full text-xs font-black">
            {pending.length} awaiting confirmation
          </span>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-1 bg-surface-container-low p-1 rounded-2xl w-fit">
        {SUBTABS.map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
              subTab === t ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t}
            {t === 'Pending' && pending.length > 0 && (
              <span className="ml-2 text-[10px] bg-[#ff9f00]/20 text-[#ff9f00] px-1.5 py-0.5 rounded-full">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary-container/30 border-t-primary-container rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {subTab === 'Overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="📦" label="Total Donations Received" value={stats?.totalDonationsReceived ?? 0} />
                <StatCard icon="⏳" label="Pending Confirmation" value={pending.length} color="text-[#ff9f00]" />
                <StatCard icon="🧺" label="Items Collected" value={stats?.totalItemsCollected ?? '—'} />
                <StatCard icon="💰" label="Monetary Received" value={stats?.monetaryReceived ? `₹${stats.monetaryReceived}` : '₹0'} color="text-yellow-400" />
              </div>
              {pending.length > 0 && (
                <div>
                  <p className="text-sm font-black text-on-surface-variant uppercase tracking-widest mb-3">Recent Pending</p>
                  <div className="space-y-3">
                    {pending.slice(0, 3).map(d => <DonationRow key={d._id} d={d} showActions />)}
                  </div>
                  {pending.length > 3 && (
                    <button onClick={() => setSubTab('Pending')} className="mt-3 text-sm text-primary-container font-black hover:underline">
                      View all {pending.length} pending →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {subTab === 'Pending' && (
            <div className="space-y-3">
              {pending.length === 0 ? (
                <div className="text-center py-16 text-on-surface-variant">
                  <span className="text-5xl block mb-3">🎉</span>
                  <p className="font-black">All donations confirmed!</p>
                  <p className="text-sm mt-1">No pending confirmations.</p>
                </div>
              ) : (
                pending.map(d => <DonationRow key={d._id} d={d} showActions />)
              )}
            </div>
          )}

          {subTab === 'History' && (
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-16 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl opacity-20 block mb-3">history</span>
                  <p className="font-black">No donation history yet</p>
                </div>
              ) : (
                history.map(d => <DonationRow key={d._id} d={d} showActions={false} />)
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NGODonations;
