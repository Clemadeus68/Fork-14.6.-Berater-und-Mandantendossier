import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const G = '#8CC63E';
const DG = '#454544';
const MG = '#777777';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== password2) { setError('Die Passwörter stimmen nicht überein.'); return; }
    if (password.length < 8) { setError('Passwort muss mindestens 8 Zeichen haben.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registrierung fehlgeschlagen'); return; }
      login(data.token, data.user);
      navigate('/');
    } catch {
      setError('Verbindungsfehler. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <img src="/logo.png" alt="be nice" style={{ height: 36, width: 'auto' }} />
          <div style={{ marginTop: 12, fontSize: 18, fontWeight: 700, color: DG }}>Strategietool</div>
          <div style={{ fontSize: 13, color: MG, marginTop: 4 }}>Clemens Gutmann · be nice Managementberatung</div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.title}>Konto erstellen</h2>

          {error && <div style={styles.errorBox}>{error}</div>}

          <label style={styles.label}>E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
            style={styles.input}
            placeholder="name@beispiel.de"
          />

          <label style={styles.label}>Passwort</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={styles.input}
            placeholder="Mindestens 8 Zeichen"
          />

          <label style={styles.label}>Passwort wiederholen</label>
          <input
            type="password"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            required
            style={{ ...styles.input, marginBottom: 24 }}
            placeholder="••••••••"
          />

          <button type="submit" disabled={loading} style={loading ? { ...styles.btn, opacity: 0.6 } : styles.btn}>
            {loading ? 'Konto wird erstellt…' : 'Konto erstellen'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: MG }}>
            Bereits registriert?{' '}
            <Link to="/login" style={styles.link}>Anmelden</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "Calibri, 'Segoe UI', sans-serif",
    padding: '20px',
  },
  card: {
    background: '#ffffff',
    borderRadius: 6,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
  },
  header: {
    background: '#cccccc',
    borderBottom: `4px solid ${G}`,
    padding: '24px 32px',
    textAlign: 'center',
  },
  form: {
    padding: '28px 32px 32px',
  },
  title: {
    margin: '0 0 24px',
    fontSize: 20,
    fontWeight: 700,
    color: DG,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: DG,
    marginBottom: 6,
  },
  input: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #d0d0d0',
    borderRadius: 4,
    marginBottom: 16,
    fontFamily: "Calibri, 'Segoe UI', sans-serif",
    color: DG,
    outline: 'none',
  },
  btn: {
    display: 'block',
    width: '100%',
    padding: '12px',
    background: G,
    color: '#ffffff',
    border: 'none',
    borderRadius: 4,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "Calibri, 'Segoe UI', sans-serif",
  },
  link: {
    color: '#33AB97',
    textDecoration: 'none',
    fontSize: 14,
  },
  errorBox: {
    background: '#fff3f3',
    border: '1px solid #f5c0c0',
    borderRadius: 4,
    padding: '10px 14px',
    marginBottom: 16,
    fontSize: 13,
    color: '#c0392b',
  },
};
