import { useState, useRef, useEffect } from "react";
import ExternalIntelligence from "./ExternalIntelligence.jsx";
import { exportToPDF, exportToWord } from "./PrintExport.js";

const G  = "#8CC63E";
const DG = "#454544";
const T  = "#33AB97";
const BT = "#13A1B6";
const MG = "#777777";
const LG = "#E9E9E9";

const s = {
  card: { background: "white", borderRadius: 8, border: "1px solid #ddd", padding: 28, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: 17, fontWeight: 700, color: DG, paddingBottom: 10, marginBottom: 18, borderBottom: `3px solid ${G}` },
  cardTitleTeal: { fontSize: 17, fontWeight: 700, color: DG, paddingBottom: 10, marginBottom: 18, borderBottom: `3px solid ${T}` },
  label: { display: "block", fontSize: 12, fontWeight: 700, color: DG, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" },
  labelOpt: { display: "block", fontSize: 12, fontWeight: 400, color: MG, marginBottom: 5 },
  input: { width: "100%", padding: "12px 14px", border: "1.5px solid #ccc", borderRadius: 5, fontFamily: "Calibri, 'Segoe UI', sans-serif", fontSize: 15, color: DG, boxSizing: "border-box" },
  textarea: { width: "100%", padding: "10px 12px", border: "1.5px solid #ccc", borderRadius: 5, fontFamily: "Calibri, 'Segoe UI', sans-serif", fontSize: 14, color: DG, resize: "vertical", minHeight: 64, boxSizing: "border-box" },
  btnPrimary: { padding: "12px 28px", borderRadius: 5, border: "none", background: G, color: "white", fontFamily: "Calibri, 'Segoe UI', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnTeal: { padding: "11px 22px", borderRadius: 5, border: "none", background: T, color: "white", fontFamily: "Calibri, 'Segoe UI', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  btnDl: { padding: "9px 18px", background: BT, color: "white", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  btnWord: { padding: "9px 18px", background: "#2B579A", color: "white", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  btnPdf: { padding: "9px 18px", background: DG, color: "white", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  btnSecondary: { padding: "10px 20px", borderRadius: 5, border: "1.5px solid #ccc", background: "white", color: DG, fontFamily: "Calibri, 'Segoe UI', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  btnSave: { padding: "9px 18px", background: T, color: "white", border: "none", borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  errorMsg: { color: "#cc4444", fontSize: 13, padding: "10px 14px", background: "#fff0f0", borderRadius: 5, border: "1px solid #f0a0a0" },
  infoBox: { background: "#f0f8e8", borderLeft: `4px solid ${G}`, borderRadius: "0 5px 5px 0", padding: "12px 16px", fontSize: 13, color: DG, lineHeight: 1.6, marginBottom: 16 },
  reportBox: { background: "#fafafa", border: "1px solid #e0e0e0", borderRadius: 6, padding: "20px 24px", fontSize: 13, fontFamily: "monospace", color: "#333", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.7, maxHeight: 600, overflowY: "auto" },
  spinner: { display: "inline-block", width: 14, height: 14, border: "2px solid #ccc", borderTop: `2px solid ${G}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", marginRight: 8, verticalAlign: "middle" },
  divider: { height: 1, background: LG, margin: "20px 0" },
  chip: { display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px 3px 12px", borderRadius: 20, fontSize: 12, color: DG, border: "1px solid", fontFamily: "Calibri, 'Segoe UI', sans-serif" },
  phaseRow: { display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", borderRadius: 5, fontSize: 12, marginBottom: 5 },
  optToggle: (open) => ({ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: open ? DG : MG, fontWeight: open ? 700 : 400, userSelect: "none", padding: "6px 0" }),
  exportRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 },
  badgeTeal: { display: "inline-block", background: "#e6f7f5", color: T, fontWeight: 700, fontSize: 11, padding: "2px 8px", borderRadius: 20, marginLeft: 8 },
};

function dlMd(name, content) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
  a.download = name; a.click();
}
function slug(str) { return (str || "Analyse").replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").slice(0, 36); }
function extractCompanyName(report) {
  const m = report.match(/^#\s+(?:Vollständige Strategieanalyse|Unternehmensanalyse|Analyse):\s*(.+)$/m);
  return m ? m[1].trim() : null;
}
async function parseStream(response, onChunk, onError) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n'); buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try {
        const event = JSON.parse(data);
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') onChunk(event.delta.text);
        if (event.type === 'error') { onError(event.error?.message || 'Stream-Fehler'); return; }
      } catch (_) {}
    }
  }
}

function CompetitorChip({ domain, auto, onRemove, disabled }) {
  return (
    <span style={{ ...s.chip, background: auto ? "#f0f8e8" : "#f0f4ff", borderColor: auto ? `${G}55` : `${BT}55` }}>
      {auto && <span style={{ fontSize: 9, color: G, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>auto</span>}
      {domain}
      {!disabled && (
        <button onClick={() => onRemove(domain)} style={{ background: "none", border: "none", color: MG, cursor: "pointer", fontSize: 15, lineHeight: 1, padding: 0, display: "flex", alignItems: "center" }}>×</button>
      )}
    </span>
  );
}

function PhaseIndicator({ phases }) {
  return (
    <div style={{ marginTop: 14 }}>
      {phases.map((p, i) => (
        <div key={i} style={{ ...s.phaseRow, background: p.status === "done" ? "#f0f8e8" : p.status === "running" ? "#fff9e8" : p.status === "error" ? "#fff0f0" : "#fafafa" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: p.status === "done" ? G : p.status === "running" ? "#f0c040" : p.status === "error" ? "#cc4444" : "#ccc" }} />
          <span style={{ flex: 1, color: DG }}>{p.label}</span>
          {p.status === "running" && <span style={s.spinner} />}
          {p.status === "done" && <span style={{ fontSize: 11, color: G, fontWeight: 700 }}>✓</span>}
        </div>
      ))}
    </div>
  );
}

export default function Analyst() {
  const [url, setUrl] = useState("");
  const [extraName, setExtraName] = useState("");
  const [extraBranche, setExtraBranche] = useState("");
  const [extraProdukt, setExtraProdukt] = useState("");
  const [showExtra, setShowExtra] = useState(false);

  const [userCompetitors, setUserCompetitors] = useState([]);
  const [compInput, setCompInput] = useState("");
  const [autoCompetitors, setAutoCompetitors] = useState([]);
  const [competitorStatus, setCompetitorStatus] = useState(null);

  const chartCardRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [phases, setPhases] = useState([]);
  const [report, setReport] = useState("");
  const [err, setErr] = useState("");
  const [sistrixData, setSistrixData] = useState(null);

  // Briefing state
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefing, setBriefing] = useState("");
  const [briefingErr, setBriefingErr] = useState("");

  // Export loading states
  const [pdfLoading, setPdfLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);
  const [briefingPdfLoading, setBriefingPdfLoading] = useState(false);
  const [briefingWordLoading, setBriefingWordLoading] = useState(false);

  // Save / history
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedLink, setSavedLink] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [savedHistory, setSavedHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('alchimedus_saved_v2') || '[]'); } catch { return []; }
  });

  // Load from URL ?r= param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('r');
    if (!id) return;
    setLoading(true);
    fetch(`/api/load-result?id=${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && !d.error) {
          setUrl(d.url || '');
          setReport(d.report || '');
          setBriefing(d.briefing || '');
          setSistrixData(d.sistrixData || null);
          setAutoCompetitors(d.competitors || []);
          setCompetitorStatus(d.competitors?.length > 0 ? 'found' : null);
          setSavedLink(window.location.href);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updatePhase = (label, status) =>
    setPhases(prev => prev.map(p => p.label === label ? { ...p, status } : p));

  const addCompetitor = () => {
    const val = compInput.trim().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "").toLowerCase();
    if (!val || userCompetitors.includes(val) || autoCompetitors.includes(val)) return;
    setUserCompetitors(prev => [...prev, val]);
    setCompInput("");
  };
  const removeCompetitor = (c) => {
    setUserCompetitors(prev => prev.filter(x => x !== c));
    setAutoCompetitors(prev => prev.filter(x => x !== c));
  };
  const handleCompKey = (e) => { if (e.key === "Enter") { e.preventDefault(); addCompetitor(); } };

  const allCompetitors = [...new Set([...autoCompetitors, ...userCompetitors])];

  // ── Main Analysis ──────────────────────────────────────────────────────────
  const run = async () => {
    if (!url.trim()) { setErr("Bitte eine URL eingeben."); return; }
    setErr(""); setReport(""); setBriefing(""); setSistrixData(null);
    setAutoCompetitors([]); setCompetitorStatus(null); setLoading(true);

    const targetUrl = url.trim().startsWith("http") ? url.trim() : "https://" + url.trim();

    const initPhases = [
      { label: "Wettbewerber werden identifiziert…", status: "running" },
      { label: "SISTRIX-Daten werden geladen…", status: "pending" },
      { label: "Website wird gecrawlt — Strategieanalyse wird erstellt…", status: "pending" },
    ];
    setPhases(initPhases);

    // Step 1: Competitors
    let identifiedCompetitors = [...userCompetitors];
    try {
      const compRes = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, userCompetitors }),
      });
      const d = compRes.ok ? await compRes.json() : null;
      if (d?.competitors !== undefined) {
        identifiedCompetitors = d.competitors;
        setAutoCompetitors(d.competitors.filter(c => !userCompetitors.includes(c)));
        setCompetitorStatus(d.competitors.length > 0 ? "found" : "empty");
      } else {
        setCompetitorStatus("error");
      }
    } catch { setCompetitorStatus("error"); }
    updatePhase("Wettbewerber werden identifiziert…", "done");

    // Step 2: SISTRIX
    updatePhase("SISTRIX-Daten werden geladen…", "running");
    let competitorSistrixData = [];
    try {
      const sistrixRes = await fetch("/api/sistrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, competitors: identifiedCompetitors }),
      });
      if (sistrixRes.ok) {
        const d = await sistrixRes.json();
        if (!d.error) { setSistrixData(d); competitorSistrixData = d.competitors || []; }
      }
      updatePhase("SISTRIX-Daten werden geladen…", "done");
    } catch { updatePhase("SISTRIX-Daten werden geladen…", "error"); }

    // Step 3: Analyst (unified 3-chapter report)
    updatePhase("Website wird gecrawlt — Strategieanalyse wird erstellt…", "running");
    try {
      const response = await fetch("/api/analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          competitorData: competitorSistrixData,
          extraMeta: { name: extraName, branche: extraBranche, produkt: extraProdukt },
        }),
      });
      if (!response.ok || response.headers.get("Content-Type")?.includes("application/json")) {
        let msg = `Fehler ${response.status}`;
        try { const d = await response.json(); msg = d.error || msg; } catch { try { msg = await response.text() || msg; } catch {} }
        setErr(msg);
        updatePhase("Website wird gecrawlt — Strategieanalyse wird erstellt…", "error");
      } else {
        let accumulated = "";
        await parseStream(response, chunk => { accumulated += chunk; setReport(accumulated); }, setErr);
        updatePhase("Website wird gecrawlt — Strategieanalyse wird erstellt…", "done");
      }
    } catch (e) {
      setErr("Verbindungsfehler: " + e.message);
      updatePhase("Website wird gecrawlt — Strategieanalyse wird erstellt…", "error");
    }

    setLoading(false);
  };

  // ── Akquise-Briefing ───────────────────────────────────────────────────────
  const runBriefing = async () => {
    if (!report) return;
    setBriefingErr(""); setBriefing(""); setBriefingLoading(true);
    try {
      const response = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategieanalyse: report,
          companyName: companyName || extraName || url,
          url,
        }),
      });
      if (!response.ok || response.headers.get("Content-Type")?.includes("application/json")) {
        const d = await response.json();
        setBriefingErr(d.error || `Fehler ${response.status}`);
      } else {
        let acc = "";
        await parseStream(response, chunk => { acc += chunk; setBriefing(acc); }, setBriefingErr);
      }
    } catch (e) {
      setBriefingErr("Verbindungsfehler: " + e.message);
    }
    setBriefingLoading(false);
  };

  // ── Save result ────────────────────────────────────────────────────────────
  const saveResult = async () => {
    setSaveLoading(true); setSavedLink("");
    try {
      const res = await fetch('/api/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, companyName, report, briefing, sistrixData, competitors: allCompetitors }),
      });
      const d = await res.json();
      if (d.id) {
        const link = `${window.location.origin}${window.location.pathname}?r=${d.id}`;
        setSavedLink(link);
        navigator.clipboard?.writeText(link);
        const entry = { link, label: companyName || url, date: new Date().toLocaleDateString('de-DE') };
        const updated = [entry, ...savedHistory].slice(0, 5);
        setSavedHistory(updated);
        localStorage.setItem('alchimedus_saved_v2', JSON.stringify(updated));
      }
    } catch (_) {}
    setSaveLoading(false);
  };

  const handleKey = (e) => { if (e.key === "Enter" && !loading) run(); };
  const companyName = report ? extractCompanyName(report) : null;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const baseName = slug(companyName || extraName || url);

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Input Card ──────────────────────────────────────────────────── */}
      <div style={s.card}>
        <div style={s.cardTitle}>Analyse konfigurieren</div>
        <p style={{ fontSize: 13, color: MG, marginBottom: 20, lineHeight: 1.6 }}>
          Das Tool crawlt die Website, identifiziert Wettbewerber automatisch, ruft SISTRIX-Daten ab und erstellt eine vollständige Strategieanalyse mit drei Kapiteln sowie ein persönliches Akquise-Briefing.
        </p>

        {/* URL */}
        <label style={s.label}>Website-URL <span style={{ color: G }}>*</span></label>
        <input style={s.input} value={url} onChange={e => setUrl(e.target.value)} onKeyDown={handleKey}
          placeholder="https://www.unternehmen.de" disabled={loading} />

        {/* Optional metadata toggle */}
        <div style={{ marginTop: 16 }}>
          <div style={s.optToggle(showExtra)} onClick={() => setShowExtra(v => !v)}>
            <span style={{ fontSize: 14 }}>{showExtra ? "▲" : "▼"}</span>
            <span>Optionale Zusatzinfos {showExtra ? "ausblenden" : "ergänzen"}</span>
            <span style={{ fontSize: 11, color: MG, fontWeight: 400 }}>(Name, Branche, Produkt — verbessert die Analyse)</span>
          </div>
          {showExtra && (
            <div style={{ marginTop: 12, padding: "16px 20px", background: "#f9f9f9", borderRadius: 6, border: "1px solid #e8e8e8" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={s.labelOpt}>Unternehmensname</label>
                  <input style={{ ...s.input, fontSize: 13 }} value={extraName} onChange={e => setExtraName(e.target.value)} placeholder="z.B. Mustermann GmbH" disabled={loading} />
                </div>
                <div>
                  <label style={s.labelOpt}>Branche</label>
                  <input style={{ ...s.input, fontSize: 13 }} value={extraBranche} onChange={e => setExtraBranche(e.target.value)} placeholder="z.B. Maschinenbau" disabled={loading} />
                </div>
              </div>
              <div>
                <label style={s.labelOpt}>Produkt / Dienstleistung</label>
                <textarea style={s.textarea} value={extraProdukt} onChange={e => setExtraProdukt(e.target.value)} placeholder="z.B. Sondermaschinen für die Lebensmittelindustrie" disabled={loading} />
              </div>
            </div>
          )}
        </div>

        <div style={s.divider} />

        {/* Manual competitors */}
        <label style={s.label}>
          Bestimmte Wettbewerber einbeziehen?
          <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: MG }}> (optional)</span>
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <input style={{ ...s.input, flex: 1 }} value={compInput} onChange={e => setCompInput(e.target.value)}
            onKeyDown={handleCompKey} placeholder="wettbewerber.de" disabled={loading} />
          <button onClick={addCompetitor} disabled={loading || !compInput.trim()}
            style={{ width: 42, height: 46, borderRadius: 5, border: "none", flexShrink: 0,
              background: !compInput.trim() ? "#e0e0e0" : G, color: "white", fontSize: 22, fontWeight: 700,
              cursor: !compInput.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            +
          </button>
        </div>
        {userCompetitors.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {userCompetitors.map(c => <CompetitorChip key={c} domain={c} auto={false} onRemove={removeCompetitor} disabled={loading} />)}
          </div>
        )}
        {autoCompetitors.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: MG, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.3px", fontWeight: 700 }}>
              Automatisch identifiziert ({autoCompetitors.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {autoCompetitors.map(c => <CompetitorChip key={c} domain={c} auto={true} onRemove={removeCompetitor} disabled={loading} />)}
            </div>
          </div>
        )}

        {phases.length > 0 && <PhaseIndicator phases={phases} />}

        <div style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button style={{ ...s.btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
            disabled={loading} onClick={run}>
            {loading ? <><span style={s.spinner} />Läuft…</> : "🔍 Analyse starten"}
          </button>
          {(report || sistrixData) && !loading && (
            <button style={s.btnSecondary} onClick={() => {
              setReport(""); setBriefing(""); setErr(""); setSistrixData(null);
              setAutoCompetitors([]); setPhases([]); setCompetitorStatus(null);
            }}>↺ Neue Analyse</button>
          )}
          {err && <span style={s.errorMsg}>{err}</span>}
        </div>
      </div>

      {/* ── SISTRIX Charts ──────────────────────────────────────────────────── */}
      {(sistrixData || (loading && phases.find(p => p.label.includes("SISTRIX") && p.status === "running"))) && (
        <div style={s.card} ref={chartCardRef}>
          <ExternalIntelligence
            data={sistrixData}
            loading={!sistrixData && loading}
            competitorStatus={competitorStatus}
          />
        </div>
      )}

      {/* ── Dokument 1: Vollständige Strategieanalyse ──────────────────────── */}
      {report && (
        <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div style={s.cardTitle}>
              {loading
                ? <><span style={s.spinner} />Strategieanalyse wird erstellt…</>
                : <>Vollständige Strategieanalyse <span style={s.badgeTeal}>Dokument 1</span></>}
            </div>
          </div>

          <div style={s.infoBox}>
            <strong>{companyName || extraName || url}</strong>
            {extraBranche && <> · {extraBranche}</>}<br />
            <span style={{ color: MG }}>URL: {url}</span>
            {allCompetitors.length > 0 && <><br /><span style={{ color: MG }}>Wettbewerber: {allCompetitors.join(", ")}</span></>}
          </div>

          <div style={s.reportBox}>{report}</div>

          {!loading && (
            <>
              <div style={s.exportRow}>
                <button style={s.btnDl} onClick={() => dlMd(`${dateStr}_${baseName}_Strategieanalyse.md`, report)}>⬇ .md</button>
                <button style={{ ...s.btnPdf, opacity: pdfLoading ? 0.7 : 1, cursor: pdfLoading ? "not-allowed" : "pointer" }}
                  disabled={pdfLoading}
                  onClick={async () => {
                    setPdfLoading(true);
                    await exportToPDF({ chartCardRef, report, url, companyName: companyName || extraName, title: "Vollständige Strategieanalyse" });
                    setPdfLoading(false);
                  }}>
                  {pdfLoading ? <><span style={s.spinner} />…</> : "📄 PDF"}
                </button>
                <button style={{ ...s.btnWord, opacity: wordLoading ? 0.7 : 1, cursor: wordLoading ? "not-allowed" : "pointer" }}
                  disabled={wordLoading}
                  onClick={async () => {
                    setWordLoading(true);
                    await exportToWord({ report, url, companyName: companyName || extraName, title: "Vollständige Strategieanalyse" });
                    setWordLoading(false);
                  }}>
                  {wordLoading ? <><span style={s.spinner} />…</> : "📝 Word"}
                </button>
                <button style={{ ...s.btnSave, opacity: saveLoading ? 0.7 : 1, cursor: saveLoading ? "not-allowed" : "pointer" }}
                  disabled={saveLoading} onClick={saveResult}>
                  {saveLoading ? <><span style={s.spinner} />Speichern…</> : "🔗 Ergebnis speichern"}
                </button>
                <button style={s.btnSecondary} onClick={() => navigator.clipboard?.writeText(report)}>📋 Kopieren</button>
                {savedHistory.length > 0 && (
                  <div style={{ position: "relative" }}>
                    <button style={s.btnSecondary} onClick={() => setShowHistory(h => !h)}>🕘 Letzte ({savedHistory.length})</button>
                    {showHistory && (
                      <div style={{ position: "absolute", top: "110%", right: 0, background: "#fff", border: "1px solid #ddd", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 100, minWidth: 300, padding: 8 }}>
                        {savedHistory.map((h, i) => (
                          <a key={i} href={h.link} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 5, textDecoration: "none", color: DG, fontSize: 13, gap: 12 }}
                            onMouseEnter={e => e.currentTarget.style.background = LG}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.label || "Ergebnis"}</span>
                            <span style={{ color: MG, fontSize: 11, flexShrink: 0 }}>{h.date}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {savedLink && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#f0f8e8", border: `1px solid ${G}44`, borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: G, fontWeight: 700 }}>✓ Link kopiert:</span>
                  <a href={savedLink} style={{ fontSize: 12, color: BT, wordBreak: "break-all" }}>{savedLink}</a>
                </div>
              )}
              <div style={{ fontSize: 11, color: MG, marginTop: 8 }}>{dateStr}_{baseName}_Strategieanalyse.md</div>
            </>
          )}
        </div>
      )}

      {/* ── Dokument 2: Akquise-Briefing ───────────────────────────────────── */}
      {report && !loading && (
        <div style={{ ...s.card, borderTop: `3px solid ${T}` }}>
          <div style={s.cardTitleTeal}>
            Akquise-Briefing
            <span style={{ ...s.badgeTeal, background: "#e6f7f5", color: T }}>Dokument 2 — für Clemens</span>
          </div>

          {!briefing && !briefingLoading && (
            <>
              <p style={{ fontSize: 13, color: MG, marginBottom: 16, lineHeight: 1.6 }}>
                Das Akquise-Briefing ist ein vertrauliches Kurzpapier für dich persönlich: priorisierte Defizite des Mandanten, INQA-Anknüpfungspunkte (Unternehmenskultur, Personal &amp; Kompetenz, Digitalisierung), konkrete Beratungsansätze und Gesprächsstrategie.
              </p>
              <button style={s.btnTeal} onClick={runBriefing}>
                ✦ Akquise-Briefing erstellen
              </button>
              {briefingErr && <div style={{ ...s.errorMsg, marginTop: 12 }}>{briefingErr}</div>}
            </>
          )}

          {briefingLoading && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", color: T, fontWeight: 700, fontSize: 13 }}>
                <span style={{ ...s.spinner, borderTopColor: T }} />
                Akquise-Briefing wird erstellt…
              </div>
              {briefing && <div style={{ ...s.reportBox, borderColor: `${T}44` }}>{briefing}</div>}
            </div>
          )}

          {briefing && !briefingLoading && (
            <>
              <div style={{ ...s.reportBox, borderColor: `${T}44` }}>{briefing}</div>
              <div style={s.exportRow}>
                <button style={s.btnDl} onClick={() => dlMd(`${dateStr}_${baseName}_Akquise-Briefing.md`, briefing)}>⬇ .md</button>
                <button style={{ ...s.btnPdf, opacity: briefingPdfLoading ? 0.7 : 1, cursor: briefingPdfLoading ? "not-allowed" : "pointer" }}
                  disabled={briefingPdfLoading}
                  onClick={async () => {
                    setBriefingPdfLoading(true);
                    await exportToPDF({ report: briefing, url, companyName: companyName || extraName, title: "Akquise-Briefing" });
                    setBriefingPdfLoading(false);
                  }}>
                  {briefingPdfLoading ? <><span style={s.spinner} />…</> : "📄 PDF"}
                </button>
                <button style={{ ...s.btnWord, opacity: briefingWordLoading ? 0.7 : 1, cursor: briefingWordLoading ? "not-allowed" : "pointer" }}
                  disabled={briefingWordLoading}
                  onClick={async () => {
                    setBriefingWordLoading(true);
                    await exportToWord({ report: briefing, url, companyName: companyName || extraName, title: "Akquise-Briefing" });
                    setBriefingWordLoading(false);
                  }}>
                  {briefingWordLoading ? <><span style={s.spinner} />…</> : "📝 Word"}
                </button>
                <button style={s.btnSecondary} onClick={() => navigator.clipboard?.writeText(briefing)}>📋 Kopieren</button>
                <button style={{ ...s.btnSecondary, color: T, borderColor: T }} onClick={runBriefing}>↺ Neu erstellen</button>
              </div>
              <div style={{ fontSize: 11, color: MG, marginTop: 8 }}>{dateStr}_{baseName}_Akquise-Briefing.md</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
