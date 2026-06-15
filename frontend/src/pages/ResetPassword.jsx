import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const G = '#8CC63E';
const DG = '#454544';
const MG = '#777777';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.form}>
            <div style={styles.errorBox}>Ungültiger Link. Bitte fordere einen neuen an.</div>
            <Link to="/forgot-password" style={styles.link}>Neuen Link anfordern</Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== password2) { setError('Die Passwörter stimmen nicht überein.'); return; }
    if (password.length < 8) { setError('Passwort muss mindestens 8 Zeichen haben.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Fehler beim Zurücksetzen'); return; }
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
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

        <div style={styles.form}>
          <h2 style={styles.title}>Neues Passwort</h2>

          {done ? (
            <div style={styles.successBox}>
              <strong>Passwort gesetzt.</strong> Du wirst in 3 Sekunden zum Login weitergeleitet.
              <div style={{ marginTop: 16 }}>
                <Link to="/login" style={styles.link}>Jetzt anmelden</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div style={styles.errorBox}>{error}</div>}

              <label style={styles.label}>Neues Passwort</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
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
                {loading ? 'Speichern…' : 'Passwort speichern'}
              </button>
            </form>
          )}
        </div>
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
    margin: '0 0 20px',
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
  successBox: {
    background: '#f0f8ec',
    border: '1px solid #b8dfa8',
    borderRadius: 4,
    padding: '16px',
    fontSize: 14,
    color: DG,
    lineHeight: 1.5,
  },
};
