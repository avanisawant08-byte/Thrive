import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithPopup, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

const Login = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  const [email, setEmail] = useState('');
  const [name, setName] = useState(''); // Added for registration
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    setIsLogin(location.pathname !== '/register');
  }, [location.pathname]);

  const triggerPulse = () => {
    const pulse = document.getElementById('keystroke-pulse');
    if (pulse) {
      pulse.classList.remove('pulse-anim');
      void pulse.offsetWidth; // trigger reflow
      pulse.classList.add('pulse-anim');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let idToken = null;

      // If logging in, attempt Firebase sign-in to get fresh ID token and verify reset password
      if (isLogin) {
        try {
          const firebaseRes = await signInWithEmailAndPassword(auth, email, password);
          if (firebaseRes.user) {
            idToken = await firebaseRes.user.getIdToken();
          }
        } catch (firebaseErr) {
          console.log('Firebase client auth note:', firebaseErr.message);
        }
      }

      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email, password, idToken } 
        : { name, email, password };
      
      const response = await API.post(endpoint, payload);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user || { name }));
        
        const userRole = response.data.user?.role || 'user';
        if (userRole === 'ngo') {
          navigate('/ngo-command');
        } else {
          navigate('/dashboard');
        }
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const response = await API.post('/auth/google', { idToken });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        const userRole = response.data.user?.role || 'user';
        if (userRole === 'ngo') {
          navigate('/ngo-command');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Google Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    const targetEmail = forgotEmail.trim();
    if (!targetEmail) return;

    setForgotLoading(true);
    setForgotFeedback(null);

    try {
      // Send reset email via Firebase Client Auth SDK
      await sendPasswordResetEmail(auth, targetEmail);

      // Notify backend if needed
      try {
        await API.post('/auth/forgot-password', { email: targetEmail });
      } catch (_) {}

      setForgotFeedback({
        type: 'success',
        msg: `Password reset email sent to ${targetEmail}! Please check your inbox (and spam folder).`
      });
    } catch (err) {
      console.error('Firebase password reset error:', err);
      let msg = 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') {
        msg = 'No account found with this email address in Firebase.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.message) {
        msg = err.message;
      }
      setForgotFeedback({ type: 'error', msg });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center p-6 sm:p-12 lg:p-24">
      <div className="w-full max-w-[480px] space-y-10">
        {/* Branding Anchor */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 bg-surface-container-high rounded-2xl glass-border flex items-center justify-center shadow-[0_0_30px_rgba(0,255,135,0.15)]">
            <span className="material-symbols-outlined text-primary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
          </div>
          <div className="text-center">
            <h1 className="font-headline font-black text-2xl tracking-[-0.05em] text-primary">IMPACT PULSE</h1>
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60 mt-1">Social Responsibility Ecosystem</p>
          </div>
        </div>

        {/* Glass Card Container */}
        <div className="relative group">
          <div id="keystroke-pulse" className="absolute inset-0 z-0"></div>
          <div className="glass-container rounded-[32px] p-8 lg:p-10 shadow-[0_32px_80px_rgba(0,0,0,0.6)] relative z-10">
            {/* Toggle Segmented Control */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-1 flex mb-8">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 text-sm font-bold tracking-tight rounded-[14px] transition-all ${isLogin ? 'gradient-button shadow-lg' : 'text-on-surface-variant hover:text-primary'}`}
              >
                Login
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 text-sm font-bold tracking-tight rounded-[14px] transition-all ${!isLogin ? 'gradient-button shadow-lg' : 'text-on-surface-variant hover:text-primary'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                {error && (
                  <div className="p-3 bg-error-container text-on-error-container text-[10px] uppercase font-bold tracking-widest rounded-xl text-center">
                    {error}
                  </div>
                )}
                {!isLogin && (
                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant ml-1">Full Name</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">person</span>
                      <input 
                        type="text"
                        required
                        value={name}
                        onChange={(e) => { setName(e.target.value); triggerPulse(); }}
                        className="w-full glass-input rounded-2xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant ml-1">Email Address</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">alternate_email</span>
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); triggerPulse(); }}
                      className="w-full glass-input rounded-2xl py-4 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none transition-all"
                      placeholder="name@impact.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">Password</label>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setForgotEmail(email);
                        setForgotFeedback(null);
                        setShowForgotModal(true);
                      }}
                      className="font-label text-[9px] uppercase tracking-wider text-primary-container/80 hover:text-primary transition-colors cursor-pointer bg-transparent border-none"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">lock</span>
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); triggerPulse(); }}
                      className="w-full glass-input rounded-2xl py-4 pl-12 pr-12 text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none transition-all"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="gradient-button w-full py-4 rounded-2xl text-on-primary-container font-bold text-sm tracking-tight hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,255,135,0.25)] disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (isLogin ? 'Continue' : 'Create Account')}
                </button>
                <div className="relative flex py-4 items-center">
                  <div className="flex-grow h-[1px] bg-white/10"></div>
                  <span className="flex-shrink mx-4 font-label text-[10px] text-on-surface-variant/40">OR CONTINUE WITH</span>
                  <div className="flex-grow h-[1px] bg-white/10"></div>
                </div>
                <button onClick={handleGoogleLogin} type="button" className="glass-button w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.34-1.92 4.41-1.2 1.2-3.08 2.48-5.92 2.48-4.77 0-8.62-3.86-8.62-8.62s3.85-8.62 8.62-8.62c2.58 0 4.46 1.02 5.86 2.34l2.31-2.31c-1.97-1.84-4.52-2.95-8.17-2.95-6.61 0-12 5.39-12 12s5.39 12 12 12c3.58 0 6.3-1.18 8.4-3.35 2.15-2.15 2.87-5.18 2.87-7.65 0-.54-.04-1.07-.12-1.58h-11.13z" fill="#EA4335"></path>
                  </svg>
                  <span className="text-sm font-semibold text-on-surface">Google</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Contextual Metadata */}
        <div className="text-center px-4">
          <p className="text-on-surface-variant/50 text-xs leading-relaxed">
            By continuing, you agree to our 
            <a className="text-on-surface-variant border-b border-on-surface-variant/20 hover:text-primary-container transition-colors ml-1" href="#">Service Terms</a> 
            and 
            <a className="text-on-surface-variant border-b border-on-surface-variant/20 hover:text-primary-container transition-colors ml-1" href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>

      <footer className="fixed bottom-8 left-0 w-full z-20 pointer-events-none">
        <div className="max-w-screen-2xl mx-auto px-8 flex justify-between items-center">
          <div className="font-label text-[10px] tracking-widest text-on-surface-variant/40 uppercase">
            © 2024 Impact Pulse Labs
          </div>
          <div className="flex space-x-6 pointer-events-auto">
            <a className="font-label text-[10px] tracking-widest text-on-surface-variant/40 hover:text-primary-container transition-colors uppercase" href="#">Help Center</a>
            <a className="font-label text-[10px] tracking-widest text-on-surface-variant/40 hover:text-primary-container transition-colors uppercase" href="#">Status</a>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={() => setShowForgotModal(false)}
        >
          <div 
            className="w-full max-w-md bg-surface-container-high/90 border border-white/10 rounded-[32px] p-8 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-xl">lock_reset</span>
                </div>
                <h3 className="text-xl font-black tracking-tight text-white">Reset Password</h3>
              </div>
              <button 
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-xl text-on-surface-variant hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Enter your registered email address and we'll send you instructions to reset your password.
            </p>

            {forgotFeedback && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                forgotFeedback.type === 'error' 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                  : 'bg-primary-container/20 text-primary-container border border-primary-container/30'
              }`}>
                <span className="material-symbols-outlined text-sm">{forgotFeedback.type === 'error' ? 'error' : 'check_circle'}</span>
                <span>{forgotFeedback.msg}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant ml-1">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">alternate_email</span>
                  <input 
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-surface-container-low/40 border-outline-variant/10 border rounded-2xl py-3.5 pl-12 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none transition-all"
                    placeholder="name@impact.com"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider bg-surface-container-highest/50 text-on-surface-variant hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail.trim()}
                  className="flex-1 gradient-button py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider text-on-primary-container shadow-lg disabled:opacity-50 active:scale-95 transition-all"
                >
                  {forgotLoading ? 'Sending...' : 'Send Link 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Login;
