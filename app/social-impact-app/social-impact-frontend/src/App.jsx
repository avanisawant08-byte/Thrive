import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Background from './components/Background';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import SplashScreen from './components/SplashScreen';

// Lazy-loaded Public / User Pages
const HeroLanding = lazy(() => import('./pages/HeroLanding'));
const Login = lazy(() => import('./pages/Login'));
const Events = lazy(() => import('./pages/Events'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SocialFeed = lazy(() => import('./pages/SocialFeed'));
const NGOCommandCenter = lazy(() => import('./pages/NGOCommandCenter'));
const RewardStore = lazy(() => import('./pages/RewardStore'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Donations = lazy(() => import('./pages/Donations'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const ApplyNGO = lazy(() => import('./pages/ApplyNGO'));
const MapPage = lazy(() => import('./pages/MapPage'));

// Lazy-loaded Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminNGOApprovals = lazy(() => import('./pages/admin/AdminNGOApprovals'));
const AdminEventApprovals = lazy(() => import('./pages/admin/AdminEventApprovals'));
const AdminShopVerification = lazy(() => import('./pages/admin/AdminShopVerification'));
const AdminActivityManagement = lazy(() => import('./pages/admin/AdminActivityManagement'));
const ShopkeeperDashboard = lazy(() => import('./pages/shopkeeper/ShopkeeperDashboard'));

const RouteLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <SplashScreen message="Loading Experience..." />
  </div>
);

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen relative overflow-x-hidden transition-colors duration-300">
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              {/* Admin Routes - No shared Navbar/Background */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/ngo-approvals" element={<AdminNGOApprovals />} />
              <Route path="/admin/event-approvals" element={<AdminEventApprovals />} />
              <Route path="/admin/shop-verification" element={<AdminShopVerification />} />
              <Route path="/admin/activities" element={<AdminActivityManagement />} />

              {/* Shopkeeper Routes */}
              <Route path="/shopkeeper" element={<ShopkeeperDashboard />} />

              {/* Public / User Routes */}
              <Route path="/*" element={
                <>
                  <Background />
                  <Navbar />
                  <div className="relative z-10 pt-4">
                    <Suspense fallback={<RouteLoader />}>
                      <Routes>
                        <Route path="/" element={<HeroLanding />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Login />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/map" element={<MapPage />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/social-feed" element={<SocialFeed />} />
                        <Route path="/ngo-command" element={<NGOCommandCenter />} />
                        <Route path="/reward-store" element={<RewardStore />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/donations" element={<Donations />} />
                        <Route path="/profile" element={<UserProfile />} />
                        <Route path="/profile/:userId" element={<UserProfile />} />
                        <Route path="/edit-profile" element={<EditProfile />} />
                        <Route path="/apply-ngo" element={<ApplyNGO />} />
                      </Routes>
                    </Suspense>
                  </div>
                </>
              } />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;

