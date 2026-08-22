import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useToast } from '../context/ToastContext';

const ApplyNGO = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    contactPerson: '',
    email: '',
    phone: '',
    description: '',
    logo: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in first to register or apply as an NGO');
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/ngo/register', formData);
      toast.success('NGO registration submitted successfully! Waiting for admin approval.');
      navigate('/profile');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error submitting application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-8 pb-24 px-6 flex justify-center items-start overflow-x-hidden relative z-10">
      <div className="fixed top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary-container/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[10%] left-[-5%] w-[300px] h-[300px] bg-secondary-container/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="w-full max-w-2xl p-8 md:p-12 rounded-xl shadow-2xl relative z-10 border border-outline-variant/15" style={{background: 'rgba(53, 53, 52, 0.4)', backdropFilter: 'blur(20px)'}}>
        <header className="mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Apply as NGO</h2>
          <p className="text-on-surface-variant text-sm font-medium uppercase tracking-[0.1em]">Register your organization to create events</p>
        </header>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">NGO Name</label>
            <input required className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" type="text" name="name" value={formData.name} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Registration Number</label>
              <input required className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Contact Person</label>
              <input required className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email</label>
              <input required className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Phone</label>
              <input required className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" type="tel" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Logo URL</label>
            <input className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" placeholder="https://..." type="url" name="logo" value={formData.logo} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Description</label>
            <textarea required className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container resize-none" rows="4" name="description" value={formData.description} onChange={handleChange}></textarea>
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-outline-variant/10">
            <button disabled={loading} className="flex-1 bg-gradient-to-br from-primary to-primary-container text-on-primary font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-all duration-200 disabled:opacity-50" type="submit" style={{boxShadow: '0 0 20px rgba(0, 255, 135, 0.3)'}}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
            <button onClick={() => navigate('/profile')} className="flex-1 bg-surface-variant/20 border border-outline-variant/30 text-on-surface-variant hover:text-white hover:border-white/40 font-black uppercase tracking-widest py-4 rounded-xl backdrop-blur-md active:scale-95 transition-all duration-200" type="button">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default ApplyNGO;
