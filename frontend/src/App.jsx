import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import Analyst from './Analyst.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

const G  = '#8CC63E';
const DG = '#454544';
const MG = '#777777';

function ProtectedApp() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "Calibri,'Segoe UI',sans-serif", color: MG, fontSize: 15 }}>
        Lädt…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ fontFamily: "Calibri, 'Segoe UI', sans-serif", background: '#f0f0f0', minHeight: '100vh', color: DG }}>
      <div style={{ background: '#cccccc', borderBottom: `4px solid ${G}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="be nice Logo" style={{ height: 40, width: 'auto', marginRight: 12, display: 'block' }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DG }}>Strategy &amp; External Intel Analyst</div>
            <div style={{ fontSize: 11, color: MG, marginTop: 2 }}>Clemens Gutmann | be nice Managementberatung</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 13, color: MG }}>{user.email}</span>
          <a href="https://www.nice-network.de" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: MG, textDecoration: 'none' }}>
            www.nice-network.de
          </a>
          <button
            onClick={logout}
            style={{ fontSize: 13, color: MG, background: 'none', border: '1px solid #bbb', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', fontFamily: "Calibri,'Segoe UI',sans-serif" }}>
            Abmelden
          </button>
        </div>
      </div>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '28px 20px 60px' }}>
        <Analyst />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<ProtectedApp />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}
