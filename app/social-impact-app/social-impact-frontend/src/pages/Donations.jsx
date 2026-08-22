import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Loader from '../components/Loader';
import confetti from 'canvas-confetti';
import { getNGOBannerSrc, getNGOLogoSrc } from '../utils/ngoImageHelper';

const DONATION_TYPES = [
  { id: 'food',      label: 'Food & Nutrition',  icon: '🍛', color: 'text-orange-400', desc: 'Meals, dry rations, milk' },
  { id: 'clothes',   label: 'Clothing',          icon: '👕', color: 'text-blue-400',   desc: 'Clean clothes, blankets, shoes' },
  { id: 'necessities',label: 'Necessities',      icon: '🧴', color: 'text-purple-400', desc: 'Hygiene kits, books, tools' },
  { id: 'monetary',  label: 'Direct Support',    icon: '💰', color: 'text-yellow-400', desc: 'Financial aid for operations' },
];

const Donations = () => {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNGO, setSelectedNGO] = useState(null);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationForm, setDonationForm] = useState({
    type: 'food',
    quantity: '',
    message: '',
    proof: null,
    proofPreview: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myDonations, setMyDonations] = useState([]);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'history'
  const [selectedCategory, setSelectedCategory] = useState('All NGOs');

  useEffect(() => {
    fetchNGOs();
    fetchMyDonations();
  }, []);

  const fetchMyDonations = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await API.get('/donations/my');
      setMyDonations(res.data);
    } catch (err) {
      console.error('Failed to fetch my donations:', err);
    }
  };

  const fetchNGOs = async () => {
    try {
      // We can use a general NGO list or specific campaigns
      const res = await API.get('/ngo'); 
      setNgos(res.data.filter(n => n.isVerified));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNGO) return;
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please log in to submit a donation', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('ngoId', selectedNGO._id);
      formData.append('type', donationForm.type);
      formData.append('quantity', donationForm.quantity);
      formData.append('message', donationForm.message);
      if (donationForm.proof) {
        formData.append('proof', donationForm.proof);
      }

      await API.post('/donations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast('Donation pledge submitted successfully! Thank you for making a difference.');
      setShowDonateModal(false);
      setDonationForm({ type: 'food', quantity: '', message: '', proof: null, proofPreview: null });
      fetchMyDonations();
    } catch (err) {
      showToast(err.response?.data?.message || 'Submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredNGOs = ngos.filter(ngo => {
    if (selectedCategory === 'All NGOs') return true;
    const catLower = selectedCategory.toLowerCase();
    return (
      (ngo.causes || []).some(c => c.toLowerCase().includes(catLower)) ||
      (ngo.description || '').toLowerCase().includes(catLower) ||
      (ngo.name || '').toLowerCase().includes(catLower)
    );
  });

  return (
    <div className="min-h-screen pt-24 pb-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tight mb-4">Donation Center</h1>
          <p className="text-on-surface-variant max-w-2xl leading-relaxed">
            Support local NGOs by donating physical items or impact coins. 
            Earn <strong className="text-primary-container">100 Bonus Coins</strong> for every verified donation as a token of gratitude.
          </p>
        </header>

        {/* Search & Filter & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex gap-1 bg-surface-container-low p-1.5 rounded-2xl w-fit">
            <button 
              onClick={() => setActiveTab('explore')}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === 'explore' 
                  ? 'bg-primary-container text-on-primary-container shadow-md' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Explore NGOs
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
                activeTab === 'history' 
                  ? 'bg-primary-container text-on-primary-container shadow-md' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              My Contributions
              {myDonations.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'history' ? 'bg-white/20' : 'bg-primary-container/10 text-primary-container'}`}>
                  {myDonations.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto py-3 px-1.5 scrollbar-hide items-center">
            {['All NGOs', 'Disaster Relief', 'Education', 'Health', 'Environment'].map((tag) => {
              const isSelected = selectedCategory === tag;
              return (
                <button 
                  key={tag} 
                  onClick={() => setSelectedCategory(tag)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer hover:-translate-y-1 active:translate-y-0 ${
                    isSelected 
                      ? 'gradient-button shadow-md' 
                      : 'glass-button text-on-surface-variant hover:text-slate-900 dark:hover:text-primary'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'explore' ? (
          <>
            {loading ? (
              <div className="py-20">
                <Loader loading={true} message="Discovering impactful NGOs..." />
              </div>
            ) : filteredNGOs.length === 0 ? (
              <div className="text-center py-20 bg-surface-container-low rounded-[2.5rem]">
                <p className="text-on-surface-variant font-medium">No verified NGOs found matching "{selectedCategory}".</p>
                <button 
                  onClick={() => setSelectedCategory('All NGOs')}
                  className="mt-4 px-5 py-2 rounded-xl bg-surface-container-high text-xs font-bold hover:text-primary-container"
                >
                  View All NGOs
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {filteredNGOs.map(ngo => (
                  <div key={ngo._id} className="bg-surface-container-low rounded-[2.5rem] overflow-hidden group transition-all flex flex-col hover:shadow-2xl hover:shadow-primary-container/5 hover:-translate-y-1">
                    <div className="h-36 bg-surface-container-high relative overflow-hidden">
                      <img 
                        src={getNGOBannerSrc(ngo)} 
                        alt={ngo.name} 
                        className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-700" 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getNGOBannerSrc(ngo, true);
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-black/30" />
                      <div className="absolute -bottom-6 left-8 w-20 h-20 rounded-3xl bg-surface-container-lowest border-4 border-surface-container-low overflow-hidden shadow-xl group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                        {ngo.logo && !ngo.logo.includes('placeholder') ? (
                          <img 
                            src={ngo.logo} 
                            alt={ngo.name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-full h-full bg-gradient-to-br from-primary-container to-[#60efff] flex items-center justify-center text-[#00210c] font-black text-2xl shadow-inner"
                          style={{ display: ngo.logo && !ngo.logo.includes('placeholder') ? 'none' : 'flex' }}
                        >
                          {ngo.name?.charAt(0).toUpperCase() || 'N'}
                        </div>
                      </div>
                    </div>
                    <div className="p-8 pt-10 flex-1 flex flex-col">
                      <div className="mb-4">
                        <h3 className="text-xl font-black tracking-tight mb-1 group-hover:text-primary-container transition-colors">{ngo.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff87] animate-pulse" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#00ff87]">Verified Partner</p>
                        </div>
                      </div>
                      <p className="text-sm text-on-surface-variant line-clamp-2 mb-6 font-medium leading-relaxed">
                        {ngo.description}
                      </p>
                      <button 
                        onClick={() => {
                          const token = localStorage.getItem('token');
                          if (!token) {
                            showToast('Please log in to pledge a donation', 'error');
                            return;
                          }
                          setSelectedNGO(ngo);
                          setShowDonateModal(true);
                        }}
                        className="mt-auto w-full py-4 bg-surface-container-highest rounded-2xl font-black text-sm text-on-surface hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center justify-center gap-2 group/btn"
                      >
                        <span>Donate Now</span>
                        <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">favorite</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {myDonations.length === 0 ? (
              <div className="text-center py-24 bg-surface-container-low rounded-[3rem] border border-dashed border-outline-variant/10">
                <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-4xl opacity-20">history</span>
                </div>
                <h3 className="text-xl font-black mb-2">No donations yet</h3>
                <p className="text-on-surface-variant text-sm mb-8">Start your journey of giving and track your impact here.</p>
                <button 
                  onClick={() => setActiveTab('explore')}
                  className="px-8 py-3 bg-primary-container text-on-primary-container font-black rounded-xl"
                >
                  Explore NGOs
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myDonations.map(d => (
                  <div key={d._id} className="bg-surface-container-low p-6 rounded-3xl flex flex-wrap items-center justify-between gap-6 hover:bg-surface-container-high transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-surface-container-high overflow-hidden flex items-center justify-center flex-shrink-0">
                        {d.ngoId?.logo && !d.ngoId?.logo.includes('placeholder') ? (
                          <img 
                            src={d.ngoId?.logo} 
                            alt="ngo" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-full h-full bg-primary-container/20 text-primary-container flex items-center justify-center font-black text-lg"
                          style={{ display: d.ngoId?.logo && !d.ngoId?.logo.includes('placeholder') ? 'none' : 'flex' }}
                        >
                          {d.ngoId?.name?.charAt(0).toUpperCase() || 'N'}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-black text-lg leading-tight mb-1">{d.ngoId?.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-on-surface-variant font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                            {new Date(d.createdAt).toLocaleDateString()}
                          </span>
                          <span className="w-1 h-1 bg-white/20 rounded-full" />
                          <span>{d.donationType.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Amount / Qty</p>
                        <p className="font-black text-primary-container">{d.quantityOrAmount}</p>
                      </div>
                      <div className="px-5 py-2 rounded-2xl border bg-surface-container-lowest text-center min-w-[120px]">
                        <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-1">Status</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            d.status === 'verified' ? 'bg-green-500' : d.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                          }`} />
                          <span className={`text-[10px] font-black uppercase ${
                            d.status === 'verified' ? 'text-green-400' : d.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                          }`}>
                            {d.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Donation Modal */}
      {showDonateModal && selectedNGO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-surface rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
              {/* Left: Info */}
              <div className="md:w-1/3 bg-surface-container-low p-8">
                <div className="w-20 h-20 rounded-3xl mb-6 shadow-2xl overflow-hidden flex items-center justify-center bg-surface-container-high">
                  {selectedNGO.logo && !selectedNGO.logo.includes('placeholder') ? (
                    <img 
                      src={selectedNGO.logo} 
                      alt="logo" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-full h-full bg-gradient-to-br from-primary-container to-[#60efff] flex items-center justify-center text-[#00210c] font-black text-2xl"
                    style={{ display: selectedNGO.logo && !selectedNGO.logo.includes('placeholder') ? 'none' : 'flex' }}
                  >
                    {selectedNGO.name?.charAt(0).toUpperCase() || 'N'}
                  </div>
                </div>
                <h2 className="text-2xl font-black tracking-tighter mb-2">{selectedNGO.name}</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-8">
                  Your contribution goes directly to supporting this organization's mission.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center text-primary-container">
                      <span className="material-symbols-outlined text-sm">verified</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Safe Donation</span>
                  </div>
                </div>
              </div>

              {/* Right: Form */}
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant">Donation Details</h3>
                  <button onClick={() => setShowDonateModal(false)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Type Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    {DONATION_TYPES.map(t => (
                      <button 
                        key={t.id}
                        onClick={() => setDonationForm({...donationForm, type: t.id})}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          donationForm.type === t.id ? 'bg-primary-container/10 border-primary-container shadow-[0_0_15px_rgba(0,255,135,0.1)]' : 'bg-surface-container-low border-white/5 hover:border-white/20'
                        }`}
                      >
                        <span className="text-2xl block mb-2">{t.icon}</span>
                        <p className={`text-xs font-black ${donationForm.type === t.id ? 'text-primary-container' : 'text-on-surface'}`}>{t.label}</p>
                        <p className="text-[9px] text-on-surface-variant font-medium mt-1 leading-tight">{t.desc}</p>
                      </button>
                    ))}
                  </div>

                  {/* Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block ml-1">Quantity / Amount</label>
                      <input 
                        type="text" 
                        placeholder={donationForm.type === 'monetary' ? 'Enter amount (e.g. ₹500)' : 'Enter quantity (e.g. 5kg Food, 10 Shirts)'}
                        value={donationForm.quantity}
                        onChange={e => setDonationForm({...donationForm, quantity: e.target.value})}
                        className="w-full bg-surface-container-low border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary-container/30 transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block ml-1">Optional Message</label>
                      <textarea 
                        placeholder="Say something nice..."
                        value={donationForm.message}
                        onChange={e => setDonationForm({...donationForm, message: e.target.value})}
                        className="w-full bg-surface-container-low border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary-container/30 transition-all font-medium h-24 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 block ml-1">Proof (Photo of items/receipt)</label>
                      <div className="flex gap-4 items-center">
                        <label className="flex-1 cursor-pointer">
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={e => {
                              const file = e.target.files[0];
                              if (file) {
                                setDonationForm({
                                  ...donationForm, 
                                  proof: file, 
                                  proofPreview: URL.createObjectURL(file)
                                });
                              }
                            }} 
                          />
                          <div className="w-full bg-surface-container-low border border-dashed border-white/10 rounded-2xl p-4 text-center hover:border-primary-container/30 transition-all relative overflow-hidden group/proof">
                            {donationForm.proofPreview ? (
                              <div className="relative z-10 py-2">
                                <img src={donationForm.proofPreview} alt="preview" className="w-12 h-12 rounded-lg mx-auto object-cover mb-2 border border-white/10" />
                                <p className="text-[10px] font-bold text-primary-container uppercase tracking-widest truncate max-w-[150px] mx-auto">
                                  {donationForm.proof.name}
                                </p>
                              </div>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-primary-container mb-1">add_a_photo</span>
                                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                                  Upload Photo
                                </p>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleDonationSubmit}
                    disabled={isSubmitting}
                    className="w-full py-5 bg-primary-container text-on-primary-container rounded-2xl font-black text-sm shadow-[0_8px_30px_rgba(0,255,135,0.25)] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Processing...' : (
                      <>
                        <span>Submit Donation</span>
                        <span className="material-symbols-outlined text-sm">rocket_launch</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-3 transition-all ${
          toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-primary-container text-on-primary-container'
        }`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default Donations;
