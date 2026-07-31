import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, LoadingScreen } from '@yatracab/ui';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Alerts from './pages/Alerts.jsx';
import Rides from './pages/Rides.jsx';
import RideDetail from './pages/RideDetail.jsx';
import Earnings from './pages/Earnings.jsx';
import Profile from './pages/Profile.jsx';
import Wallet from './pages/Wallet.jsx';
import DailyRoutes from './pages/DailyRoutes.jsx';
import Referrals from './pages/Referrals.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen label="Starting YatraCab Driver…" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={loading ? <LoadingScreen /> : user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/rides" element={<Rides />} />
        <Route path="/rides/:id" element={<RideDetail />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/daily-routes" element={<DailyRoutes />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
