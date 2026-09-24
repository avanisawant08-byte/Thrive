import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import CreateCouponModal from './CreateCouponModal';
import { getShopBannerSrc } from '../../utils/shopImageHelper';

const ShopkeeperDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalRedemptions: 0, totalRevenuePoints: 0, recentRedemptions: [] });
  const [loading, setLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [myCoupons, setMyCoupons] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ shopName: '', category: '', address: '', phone: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== 'shopkeeper') {
        navigate('/login');
        return;
      }
      setUser(parsed);
      fetchDashboardData();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const storeRes = await API.get('/store');
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setMyCoupons(storeRes.data.filter(i => i.vendorId === u._id));
      }

      const res = await API.get('/shopkeeper/stats');
      setStats(res.data);
    } catch (err) {
      console.warn('New stats API failed, falling back to old history API', err);
      try {
        const historyRes = await API.get('/shopkeeper/history');
        setStats({
          totalRedemptions: historyRes.data.length,
          totalRevenuePoints: historyRes.data.reduce((sum, h) => sum + (h.itemId?.coinCost || 0), 0),
          recentRedemptions: historyRes.data.map(h => ({
             _id: h._id,
             user: h.userId?.name,
             reward: h.itemId?.title,
             cost: h.itemId?.coinCost || 0,
             status: 'REDEEMED',
             redeemedAt: h.createdAt
          }))
        });
      } catch (e) {
        console.error('Failed to fetch fallback data:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyCode) return;
    try {
      const res = await API.get(`/shopkeeper/verify/${verifyCode}`);
      
      // Adapt old backend format to new PRD format if necessary
      if (res.data.redemption) {
        const isRedeemed = res.data.redemption.status === 'redeemed';
        const isValid = !isRedeemed && res.data.redemption.status === 'claimed';
        const normalized = {
          valid: isValid,
          coupon: {
            user: res.data.redemption.userId?.name || 'Unknown User',
            item: res.data.redemption.itemId?.title || 'Unknown Item',
            coinCost: res.data.redemption.itemId?.coinCost || 0,
            status: isRedeemed ? 'REDEEMED' : (res.data.redemption.status === 'claimed' ? 'ACTIVE' : res.data.redemption.status.toUpperCase()),
            code: verifyCode
          }
        };
        setVerifyResult(normalized);
        if (isValid) {
          showToast('Valid Coupon! Ready to redeem.');
        } else {
          showToast(res.data.message || 'Coupon already redeemed.', 'error');
        }
      } else {
        // Assume PRD format
        setVerifyResult(res.data);
        if (res.data.valid) {
          showToast('Valid Coupon! Ready to redeem.');
        } else {
          showToast('Coupon is invalid or expired.', 'error');
        }
      }
    } catch (err) {
      setVerifyResult({ error: err.response?.data?.message || err.message });
      showToast(err.response?.data?.message || 'Verification failed', 'error');
    }
  };

  const handleRedeem = async () => {
    if (!verifyCode) return;
    try {
      await API.put(`/shopkeeper/verify/${verifyCode}`);
      showToast('Coupon Redeemed Successfully!');
      setVerifyCode('');
      setVerifyResult(null);
      fetchDashboardData();
    } catch (err) {
      // Fallback to old API route
      try {
         await API.post('/shopkeeper/redeem', { code: verifyCode });
         showToast('Coupon Redeemed Successfully!');
         setVerifyCode('');
         setVerifyResult(null);
         fetchDashboardData();
      } catch (fallbackErr) {
         showToast(fallbackErr.response?.data?.message || 'Redemption failed', 'error');
      }
    }
  };

  const handleCouponCreated = (msg) => {
    showToast(msg);
    fetchDashboardData();
  };

  const startEditProfile = () => {
    setProfileForm({
      shopName: user.shopDetails?.shopName || user.name || '',
      category: user.shopDetails?.category || 'retail',
      address: user.shopDetails?.address || '',
      phone: user.shopDetails?.phone || ''
    });
    setIsEditingProfile(true);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await API.put('/shopkeeper/profile', profileForm);
      showToast('Profile Updated Successfully!');
      const updatedUser = { ...user, shopDetails: res.data.shopDetails };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditingProfile(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePhoto', file);

    setPhotoLoading(true);
    try {
      const res = await API.put('/auth/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data && res.data.profilePhoto) {
        const updatedUser = { ...user, profilePhoto: res.data.profilePhoto };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        showToast('Logo Updated Successfully!');
      }
    } catch (err) {
      console.error("Failed to upload photo", err);
      showToast('Error uploading logo', 'error');
    } finally {
      setPhotoLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-slate-50 dark:bg-surface font-body text-slate-900 dark:text-on-surface min-h-screen flex transition-colors">
      <style>{`
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .glass-card { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        html:not(.dark) .glass-card { background: rgba(255, 255, 255, 0.85); border: 1px solid #e2e8f0; }
        html.dark .glass-card { background: rgba(53, 53, 52, 0.4); }
        .glow-hover:hover { box-shadow: 0 0 30px rgba(0, 255, 135, 0.1); }
      `}</style>
      
      {/* Sidebar Navigation */}
      <aside className="w-64 fixed left-0 top-0 h-screen bg-white dark:bg-[#131313] flex-col p-4 gap-2 z-40 hidden md:flex border-r border-slate-200 dark:border-white/5 transition-colors">
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 dark:bg-primary-container rounded-lg flex items-center justify-center text-white dark:text-on-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          </div>
          <div>
            <h1 className="text-emerald-700 dark:text-[#00ff87] font-black tracking-tight leading-tight">Pulse Partner</h1>
            <p className="font-['Inter'] text-[10px] tracking-widest uppercase text-slate-500 dark:text-on-surface-variant">Retail Partner</p>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          <a className="flex items-center gap-3 px-4 py-3 text-emerald-700 dark:text-[#00ff87] bg-emerald-50 dark:bg-[#353534] rounded-lg font-['Inter'] text-sm tracking-wide uppercase transition-all" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </a>
        </nav>
        <div className="mt-auto p-4 rounded-2xl bg-slate-100 dark:bg-surface-container-low border border-slate-200 dark:border-outline-variant/10">
          <button 
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-error py-2 rounded-lg text-xs font-bold transition-all"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <main className="md:ml-64 flex flex-col min-h-screen w-full">
        {/* TopAppBar */}
        <header className="fixed top-0 right-0 left-0 md:left-64 z-30 bg-white/80 dark:bg-[#131313]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 shadow-sm dark:shadow-[0_4px_30px_rgba(0,255,135,0.05)] transition-colors">
          <div className="flex justify-between items-center px-6 py-4 w-full">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative w-full group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-on-surface-variant group-focus-within:text-emerald-600 dark:group-focus-within:text-primary-container transition-colors">search</span>
                <input className="w-full bg-slate-100 dark:bg-surface-container-low border border-slate-200 dark:border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500/30 transition-all text-slate-900 dark:text-on-surface outline-none" placeholder="Search analytics or coupons..." type="text"/>
              </div>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-surface-container-high flex items-center justify-center text-emerald-600 dark:text-primary-container font-bold text-lg ring-2 ring-transparent group-hover:ring-emerald-500 transition-all">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 dark:text-on-surface leading-none">{user.shopDetails?.shopName || user.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-on-surface-variant uppercase tracking-tighter">Manager</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="pt-24 px-6 pb-24 max-w-7xl mx-auto w-full space-y-8">
          {/* Performance Metrics Row */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-surface-container-low p-6 rounded-3xl border border-slate-200 dark:border-none shadow-sm dark:shadow-none glow-hover transition-all">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-on-surface-variant mb-4">Total Redemptions</p>
              <div className="flex items-end justify-between">
                <h3 className="text-4xl font-black text-slate-900 dark:text-on-surface tracking-tighter leading-none">{stats.totalRedemptions}</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-surface-container-low p-6 rounded-3xl border border-slate-200 dark:border-none shadow-sm dark:shadow-none glow-hover transition-all">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-on-surface-variant mb-4">Total Revenue Generated</p>
              <div className="flex items-end justify-between">
                <h3 className="text-4xl font-black text-slate-900 dark:text-on-surface tracking-tighter leading-none">
                  {stats.totalRevenuePoints} pts
                </h3>
              </div>
            </div>
          </section>

          {/* Main Content Area: Bento Style */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-8">
              {/* Verify Coupon Card */}
              <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-primary-container/5 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold tracking-tight mb-2">Verify Coupon</h2>
                  <p className="text-on-surface-variant text-sm mb-6">Enter code manually to verify and redeem rewards.</p>
                  <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input 
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                        className="w-full bg-surface-container-highest/60 border-none rounded-2xl px-5 py-4 text-lg font-mono focus:ring-2 focus:ring-primary-container transition-all outline-none" 
                        placeholder="Enter Code (e.g. 123456)" 
                        type="text"
                      />
                    </div>
                    <button type="submit" className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 scale-95 active:scale-90 transition-transform">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                      VERIFY
                    </button>
                  </form>
                  
                  {verifyResult && !verifyResult.error && verifyResult.coupon && (
                    <div className="mt-6 p-6 rounded-[1.5rem] bg-surface-container-low border border-primary-container/20">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary-container text-2xl">check_circle</span>
                        <h4 className="font-black text-xl text-primary-container">Coupon Claimed</h4>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-on-surface-variant">User</span>
                          <span className="font-bold text-white">{verifyResult.coupon.user}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-on-surface-variant">Campaign / Item</span>
                          <span className="font-bold text-white">{verifyResult.coupon.item}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-on-surface-variant">Cost</span>
                          <span className="font-bold text-primary-container">{verifyResult.coupon.coinCost} pts</span>
                        </div>
                        <div className="flex justify-between pb-2">
                          <span className="text-on-surface-variant">Status</span>
                          <span className="uppercase font-black tracking-widest text-[#00b8ff]">{verifyResult.coupon.status}</span>
                        </div>
                        
                        {verifyResult.coupon.status === 'ACTIVE' && (
                          <button 
                            onClick={handleRedeem}
                            className="mt-6 w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-black py-4 rounded-xl shadow-[0_0_20px_rgba(0,255,135,0.2)] hover:shadow-[0_0_30px_rgba(0,255,135,0.4)] transition-all active:scale-95"
                          >
                            CONFIRM REDEMPTION
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {verifyResult?.error && (
                    <div className="mt-6 p-4 rounded-xl bg-error-container/20 border border-error/20 text-error flex items-center gap-3 font-bold">
                      <span className="material-symbols-outlined">error</span>
                      {verifyResult.error}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Redemptions */}
              <div className="bg-surface-container-low rounded-[2.5rem] overflow-hidden">
                <div className="p-8 pb-4 flex justify-between items-center">
                  <h2 className="text-xl font-bold tracking-tight">Recent Redemptions</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container/50">
                      <tr>
                        <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">User</th>
                        <th className="px-4 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Reward</th>
                        <th className="px-4 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold text-center">Cost</th>
                        <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-highest/20">
                      {loading ? (
                        <tr><td colSpan="4" className="text-center py-8">Loading...</td></tr>
                      ) : stats.recentRedemptions.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-8 text-on-surface-variant">No redemptions yet</td></tr>
                      ) : (
                        stats.recentRedemptions.map((item, idx) => (
                          <tr key={item._id || idx} className="hover:bg-surface-container-highest/30 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold">
                                  {item.user?.substring(0, 2).toUpperCase() || 'U'}
                                </div>
                                <span className="text-sm font-medium">{item.user || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-5">
                              <span className="text-sm font-medium">{item.reward || 'Unknown Item'}</span>
                            </td>
                            <td className="px-4 py-5 text-center">
                              <span className="text-xs font-mono text-primary-container">{item.cost || 0} pts</span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <span className="inline-flex items-center gap-1 bg-surface-variant/50 text-on-surface-variant text-[10px] font-bold px-2 py-1 rounded-full">
                                <span className="w-1 h-1 bg-on-surface-variant rounded-full"></span>
                                {item.status || 'REDEEMED'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-5 space-y-8">
              {/* Active Campaigns Card */}
              <div className="bg-surface-container-low p-8 rounded-[2.5rem]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary-container">campaign</span>
                    <h2 className="text-xl font-bold tracking-tight">Active Campaigns</h2>
                  </div>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary-container text-on-primary-container px-4 py-2 rounded-xl text-xs font-bold hover:shadow-[0_0_15px_rgba(0,255,135,0.3)] transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    New
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {myCoupons.length === 0 ? (
                    <div className="text-center py-8 text-on-surface-variant text-sm">
                      No active campaigns. Create one to attract users!
                    </div>
                  ) : (
                    myCoupons.map(coupon => (
                      <div key={coupon._id} className="p-4 bg-surface-container-highest/50 rounded-2xl flex justify-between items-center border border-white/5">
                        <div>
                          <h4 className="font-bold text-sm text-on-surface">{coupon.title}</h4>
                          <p className="text-xs text-on-surface-variant truncate max-w-[200px]">{coupon.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-primary-container font-black text-sm">{coupon.coinCost} pts</p>
                          <span className="text-[9px] uppercase tracking-widest text-[#00ff87] bg-[#00ff87]/10 px-2 py-0.5 rounded-full">Active</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Shop Profile Card */}
              <div className="bg-surface-container-low rounded-[2.5rem] overflow-hidden">
                <div className="h-36 bg-surface-container-high relative overflow-hidden">
                  <img 
                    src={getShopBannerSrc(user)} 
                    alt="Shop Banner" 
                    className="w-full h-full object-cover opacity-60"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getShopBannerSrc(user, true);
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-black/40" />
                </div>
                <div className="p-8 -mt-12 relative">
                  <div className="relative group w-20 h-20 mb-4 cursor-pointer">
                    <div className="w-20 h-20 bg-surface rounded-3xl overflow-hidden shadow-2xl p-1 ring-2 ring-primary-container/20 relative">
                      {user.profilePhoto ? (
                        <img 
                          src={user.profilePhoto} 
                          alt="Shop Logo" 
                          className={`w-full h-full object-cover rounded-[1.25rem] ${photoLoading ? 'opacity-50' : ''}`}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-full h-full bg-gradient-to-br from-primary-container to-[#60efff] rounded-[1.25rem] flex items-center justify-center text-[#00210c] font-black text-2xl"
                        style={{ display: user.profilePhoto ? 'none' : 'flex' }}
                      >
                        {user.shopDetails?.shopName?.charAt(0).toUpperCase() || user.name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      {photoLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[1.25rem]">
                          <div className="w-5 h-5 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    {/* Hover Upload Overlay */}
                    <label className="absolute inset-0 bg-black/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
                      <span className="material-symbols-outlined text-white">photo_camera</span>
                      <input className="hidden" type="file" accept="image/*" onChange={handlePhotoUpload} disabled={photoLoading} />
                    </label>
                  </div>
                  
                  {isEditingProfile ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant block mb-1">Shop Name</label>
                        <input value={profileForm.shopName} onChange={e => setProfileForm({...profileForm, shopName: e.target.value})} className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-container/50 outline-none" required />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant block mb-1">Category</label>
                        <select value={profileForm.category} onChange={e => setProfileForm({...profileForm, category: e.target.value})} className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-container/50 outline-none appearance-none">
                          <option value="retail">Retail</option>
                          <option value="restaurant">Restaurant</option>
                          <option value="cafe">Cafe</option>
                          <option value="hotel">Hotel</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant block mb-1">Address</label>
                        <input value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-container/50 outline-none" required />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant block mb-1">Phone</label>
                        <input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary-container/50 outline-none" required />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 py-3 rounded-xl font-bold text-sm bg-surface-variant text-on-surface-variant hover:bg-surface-container-highest transition-colors">Cancel</button>
                        <button type="submit" disabled={updatingProfile} className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary-container text-on-primary-container hover:bg-primary shadow-lg transition-colors">{updatingProfile ? 'Saving...' : 'Save Profile'}</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h2 className="text-2xl font-black tracking-tighter">{user.shopDetails?.shopName || user.name}</h2>
                          <p className="text-primary-container text-xs font-bold uppercase tracking-widest">
                            {user.shopDetails?.category || 'Retail Partner'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-on-surface-variant text-sm">location_on</span>
                          <span className="text-sm text-on-surface-variant">{user.shopDetails?.address || 'Address not provided'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-on-surface-variant text-sm">call</span>
                          <span className="text-sm text-on-surface-variant">{user.shopDetails?.phone || 'Phone not provided'}</span>
                        </div>
                      </div>
                      <button onClick={startEditProfile} className="w-full bg-primary-container/10 hover:bg-primary-container/20 text-primary-container py-4 rounded-2xl font-bold text-sm transition-all border border-primary-container/20 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Update Profile
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-xl shadow-lg border ${toast.type === 'error' ? 'bg-error-container/90 border-error/50 text-error' : 'bg-primary-container/90 border-primary-container/50 text-on-primary-container'} font-bold`}>
          {toast.msg}
        </div>
      )}

      <CreateCouponModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={handleCouponCreated} 
      />
    </div>
  );
};

export default ShopkeeperDashboard;
