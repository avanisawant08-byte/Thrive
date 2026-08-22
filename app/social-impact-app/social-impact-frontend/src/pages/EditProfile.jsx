import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useToast } from '../context/ToastContext';

const EditProfile = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    instagram: '',
    linkedin: '',
    city: '',
    occupation: '',
    institute: '',
    bio: '',
    isPrivate: false
  });

  const [selectedInterests, setSelectedInterests] = useState([]);
  const interestsList = ['Blood Donation', 'Tree Plantation', 'Volunteering', 'Community Service', 'Education Support', 'Eco Cleanup'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) {
      toast.error('Please log in to edit your profile');
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setFormData({
      name: parsedUser.name || '',
      username: parsedUser.username || '',
      dateOfBirth: parsedUser.dateOfBirth ? new Date(parsedUser.dateOfBirth).toISOString().split('T')[0] : '',
      phone: parsedUser.phone || '',
      email: parsedUser.email || '',
      instagram: parsedUser.instagram || '',
      linkedin: parsedUser.linkedin || '',
      city: parsedUser.city || '',
      occupation: parsedUser.occupation || '',
      institute: parsedUser.institute || '',
      bio: parsedUser.bio || '',
      isPrivate: parsedUser.isPrivate || false
    });
    if (parsedUser.interests) {
      setSelectedInterests(parsedUser.interests);
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, interests: selectedInterests };
      const res = await API.put('/auth/profile', payload);
      
      if (res.data && res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      navigate('/profile');
    } catch (err) {
      console.error("Failed to update profile", err);
      toast.error('Error saving profile');
    } finally {
      setLoading(false);
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
      }
    } catch (err) {
      console.error("Failed to upload photo", err);
      toast.error('Error uploading photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-8 pb-24 px-6 flex justify-center items-start overflow-x-hidden relative z-10">
      {/* Background Accents */}
      <div className="fixed top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary-container/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[10%] left-[-5%] w-[300px] h-[300px] bg-secondary-container/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      {/* Form Card */}
      <div className="w-full max-w-2xl p-8 md:p-12 rounded-xl shadow-2xl relative z-10 border border-outline-variant/15" style={{background: 'rgba(53, 53, 52, 0.4)', backdropFilter: 'blur(20px)'}}>
        <header className="mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Edit Profile</h2>
          <p className="text-on-surface-variant text-sm font-medium uppercase tracking-[0.1em]">Update your impact identity</p>
        </header>

        <form className="space-y-8" onSubmit={handleSave}>
          {/* Profile Picture Section */}
          <div className="flex flex-col md:flex-row items-center gap-6 pb-8 border-b border-outline-variant/10">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-container/20 relative">
                <img 
                  alt="Current avatar" 
                  className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${photoLoading ? 'opacity-50' : ''}`} 
                  src={user?.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"}
                />
                {photoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-primary-container text-on-primary p-1.5 rounded-full cursor-pointer hover:scale-110 active:scale-90 transition-all">
                <span className="material-symbols-outlined text-sm">edit</span>
                <input className="hidden" type="file" accept="image/*" onChange={handlePhotoUpload} disabled={photoLoading} />
              </label>
            </div>
            <div>
              <h3 className="text-white font-bold">Profile Photo</h3>
              <p className="text-on-surface-variant text-sm">Recommended size: 400x400px. JPG or PNG.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Full Name</label>
              <input 
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" 
                placeholder="Your name" 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Username Handle</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">@</span>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-8 pr-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" 
                  placeholder="ravisharma" 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
            </div>
            {/* DOB */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Date of Birth</label>
              <div className="flex items-center gap-3">
                <input 
                  className="flex-1 bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" 
                  type="date" 
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>
            {/* Contact details */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Phone Number</label>
              <input 
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" 
                placeholder="Your phone number" 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Email Address</label>
              <input 
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" 
                placeholder="Your email" 
                type="email" 
                name="email"
                value={formData.email}
                disabled // usually email shouldn't be editable here without special flow
              />
            </div>
            {/* Social Handles */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Instagram</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-bold">@</span>
                <input 
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-8 pr-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" 
                  placeholder="username" 
                  type="text" 
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">LinkedIn Profile</label>
              <input 
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" 
                placeholder="https://linkedin.com/in/..." 
                type="url" 
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
              />
            </div>
            {/* Location & Work */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">City</label>
              <input 
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" 
                placeholder="Your city" 
                type="text" 
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Occupation</label>
              <input 
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" 
                placeholder="Your occupation" 
                type="text" 
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
              />
            </div>
          </div>
          {/* Bio */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Short Bio</label>
            <textarea 
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container resize-none" 
              placeholder="Tell us a bit about yourself..." 
              rows="3"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
            ></textarea>
          </div>
          {/* Education */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Institute / University</label>
            <input 
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface transition-all focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" 
              placeholder="Your institute" 
              type="text" 
              name="institute"
              value={formData.institute}
              onChange={handleChange}
            />
          </div>
          {/* Interests */}
          <div className="space-y-4">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant ml-1">Areas of Impact (Interests)</label>
            <div className="flex flex-wrap gap-2">
              {interestsList.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button 
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full border font-bold text-xs transition-all active:scale-95 ${
                      isSelected 
                      ? 'border-primary-container text-on-primary bg-primary-container' 
                      : 'border-outline-variant/40 text-on-surface-variant hover:border-primary-container hover:text-white'
                    }`} 
                    type="button"
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Account Privacy Settings */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-white/10 flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm text-white flex items-center gap-2">
                <span>🔒 Private Account</span>
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                When enabled, people must send a follow request to see your impact posts and activity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData(f => ({ ...f, isPrivate: !f.isPrivate }))}
              className={`w-12 h-6 rounded-full transition-colors duration-300 relative flex-shrink-0 ${
                formData.isPrivate ? 'bg-primary-container' : 'bg-surface-container-highest border border-white/20'
              }`}
            >
              <span className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                formData.isPrivate ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4 pt-10 mt-8 border-t border-outline-variant/10">
            <button 
              className="flex-1 bg-gradient-to-br from-primary to-primary-container text-on-primary font-black uppercase tracking-widest py-4 rounded-xl active:scale-95 transition-all duration-200 disabled:opacity-50" 
              type="submit" 
              style={{boxShadow: '0 0 20px rgba(0, 255, 135, 0.3)'}}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="flex-1 bg-surface-variant/20 border border-outline-variant/30 text-on-surface-variant hover:text-white hover:border-white/40 font-black uppercase tracking-widest py-4 rounded-xl backdrop-blur-md active:scale-95 transition-all duration-200" 
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default EditProfile;

