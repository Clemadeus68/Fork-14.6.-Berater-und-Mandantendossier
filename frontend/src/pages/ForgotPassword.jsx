import { useState } from 'react';
import { Link } from 'react-router-dom';

const G = '#8CC63E';
const DG = '#454544';
const MG = '#777777';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Fehler beim Senden'); return; }
      setSent(true);
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
          <h2 style={styles.title}>Passwort vergessen</h2>

          {sent ? (
            <div style={styles.successBox}>
              <strong>E-Mail unterwegs.</strong> Falls diese Adresse registriert ist, erhältst du in wenigen Minuten einen Link zum Zurücksetzen.
              <div style={{ marginTop: 16 }}>
                <Link to="/login" style={styles.link}>Zurück zum Login</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ marginTop: 0, marginBottom: 20, fontSize: 14, color: MG, lineHeight: 1.5 }}>
                Gib deine E-Mail-Adresse ein. Du erhältst einen Link, der eine Stunde gültig ist.
              </p>

              {error && <div style={styles.errorBox}>{error}</div>}

              <label style={styles.label}>E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                style={{ ...styles.input, marginBottom: 24 }}
                placeholder="name@beispiel.de"
              />

              <button type="submit" disabled={loading} style={loading ? { ...styles.btn, opacity: 0.6 } : styles.btn}>
                {loading ? 'Senden…' : 'Link anfordern'}
              </button>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: MG }}>
                <Link to="/login" style={styles.link}>Zurück zum Login</Link>
              </p>
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
    margin: '0 0 16px',
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
