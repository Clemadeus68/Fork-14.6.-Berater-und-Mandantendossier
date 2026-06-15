import { useState, useRef, useEffect, Fragment } from "react";
import ExternalIntelligence from "./ExternalIntelligence.jsx";
import { exportToPDF, exportToWord } from "./PrintExport.js";
import { exportToDossier } from "./dossierExport.js";

// Robustes Parsen des Dossier-JSON aus dem Claude-Stream.
// Der API-Call prefillt die Assistant-Antwort mit "{", daher beginnt der Stream
// erst danach. Wir versuchen mehrere Varianten, damit es auch ohne Prefill klappt.
function parseDossierJSON(raw) {
  const tryParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
  let s = (raw || "").trim()
    .replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
  let r = tryParse(s); if (r) return r;
  r = tryParse("{" + s); if (r) return r;
  const first = s.indexOf("{"), last = s.lastIndexOf("}");
  if (first >= 0 && last > first) { r = tryParse(s.slice(first, last + 1)); if (r) return r; }
  if (last >= 0) { r = tryParse("{" + s.slice(0, last + 1)); if (r) return r; }
  return null;
}

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
  const m = report.match(/^#\s+(?:Vollständige Strategieanalyse|Strategieanalyse|Unternehmensanalyse|Analyse):\s*(.+)$/m);
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

  // Mandanten-Dossier
  const [dossier, setDossier] = useState(null);
  const [dossierRaw, setDossierRaw] = useState("");
  const [dossierLoading, setDossierLoading] = useState(false);

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
          setDossier(d.dossier || null);
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

  const allCompetitors = [...new Set([...userCompetitors, ...autoCompetitors])];

  // ── Main Analysis ──────────────────────────────────────────────────────────
  const run = async () => {
    if (!url.trim()) { setErr("Bitte eine URL eingeben."); return; }
    setErr(""); setReport(""); setBriefing(""); setSistrixData(null);
    setDossier(null); setDossierRaw("");
    setAutoCompetitors([]); setCompetitorStatus(null); setLoading(true);

    const targetUrl = url.trim().startsWith("http") ? url.trim() : "https://" + url.trim();

    const initPhases = [
      { label: "Wettbewerber werden identifiziert…", status: "running" },
      { label: "SISTRIX-Daten werden geladen…", status: "pending" },
      { label: "Website wird gecrawlt — Berater- und Mandantendossier wird erstellt…", status: "pending" },
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
        const autoFound = d.competitors.filter(c => !userCompetitors.includes(c));
        identifiedCompetitors = [...new Set([...userCompetitors, ...d.competitors])];
        setAutoCompetitors(autoFound);
        setCompetitorStatus(identifiedCompetitors.length > 0 ? "found" : "empty");
      } else {
        setCompetitorStatus("error");
      }
    } catch { setCompetitorStatus("error"); }
    updatePhase("Wettbewerber werden identifiziert…", "done");

    // Step 2: SISTRIX
    updatePhase("SISTRIX-Daten werden geladen…", "running");
    let competitorSistrixData = [];
    let mainSistrix = null; // lokal halten — React-State ist im selben Lauf noch nicht aktuell
    try {
      const sistrixRes = await fetch("/api/sistrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl, competitors: identifiedCompetitors }),
      });
      if (sistrixRes.ok) {
        const d = await sistrixRes.json();
        if (!d.error) { setSistrixData(d); mainSistrix = d; competitorSistrixData = d.competitors || []; }
      }
      updatePhase("SISTRIX-Daten werden geladen…", "done");
    } catch { updatePhase("SISTRIX-Daten werden geladen…", "error"); }

    // Step 3: Mandanten-Dossier (ein Dokument, strukturiertes JSON)
    const dossierPhase = "Website wird gecrawlt — Berater- und Mandantendossier wird erstellt…";
    updatePhase(dossierPhase, "running");
    setDossierLoading(true);
    try {
      const response = await fetch("/api/dossier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          competitorData: competitorSistrixData,
          sistrixMain: mainSistrix ? {
            domain: mainSistrix.domain,
            visibility: mainSistrix.visibility,
            totalClicks: mainSistrix.totalClicks,
            totalKeywords: mainSistrix.totalKeywords,
            totalValue: mainSistrix.totalValue,
            topPages: mainSistrix.topPages,
          } : null,
          extraMeta: { name: extraName, branche: extraBranche, produkt: extraProdukt },
        }),
      });
      if (!response.ok || response.headers.get("Content-Type")?.includes("application/json")) {
        let msg = `Fehler ${response.status}`;
        try { const d = await response.json(); msg = d.error || msg; } catch { try { msg = await response.text() || msg; } catch {} }
        setErr(msg);
        updatePhase(dossierPhase, "error");
      } else {
        let accumulated = "";
        await parseStream(response, chunk => { accumulated += chunk; setDossierRaw(accumulated); }, setErr);
        const parsed = parseDossierJSON(accumulated);
        if (parsed) {
          setDossier(parsed);
          updatePhase(dossierPhase, "done");
        } else {
          setErr("Das Dossier konnte nicht gelesen werden (ungültiges JSON). Bitte erneut versuchen.");
          updatePhase(dossierPhase, "error");
        }
      }
    } catch (e) {
      setErr("Verbindungsfehler: " + e.message);
      updatePhase(dossierPhase, "error");
    }
    setDossierLoading(false);

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
        body: JSON.stringify({ url, companyName, report, briefing, dossier, sistrixData, competitors: allCompetitors }),
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
  const companyName = dossier?.firma || (report ? extractCompanyName(report) : null);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const baseName = slug(companyName || extraName || url);

  const [dossierExportLoading, setDossierExportLoading] = useState(false);
  const downloadDossier = async () => {
    if (!dossier) return;
    setDossierExportLoading(true);
    try { await exportToDossier({ dossier, sistrixData }); } catch (e) { setErr("Export fehlgeschlagen: " + e.message); }
    setDossierExportLoading(false);
  };

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Input Card ──────────────────────────────────────────────────── */}
      <div style={s.card}>
        <div style={s.cardTitle}>Analyse konfigurieren</div>
        <p style={{ fontSize: 13, color: MG, marginBottom: 20, lineHeight: 1.6 }}>
          Das Tool crawlt die Website, identifiziert Wettbewerber automatisch, ruft SISTRIX-Daten ab und erstellt ein Berater- und Mandantendossier: Teil A intern (Cockpit, Befunde, Datenblatt, Gesprächsdrehbuch) und Teil B als abtrennbarer Kundenteil, in einem Word-Dokument.
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

      {/* ── Mandanten-Dossier ──────────────────────────────────────────────── */}
      {(dossierLoading || dossier) && (
        <div style={s.card}>
          <div style={s.cardTitle}>
            {dossierLoading && !dossier
              ? <><span style={s.spinner} />Berater- und Mandantendossier wird erstellt…</>
              : <>Berater- und Mandantendossier <span style={s.badgeTeal}>ein Dokument</span></>}
          </div>

          {/* Live-Stream solange noch kein geparstes JSON vorliegt */}
          {dossierLoading && !dossier && (
            <div style={{ ...s.reportBox, maxHeight: 240 }}>{dossierRaw || "…"}</div>
          )}

          {dossier && (
            <>
              <div style={s.infoBox}>
                <strong>{dossier.firma}</strong>
                {dossier.ansprechpartner && dossier.ansprechpartner !== "(unbekannt)" && <> · {dossier.ansprechpartner}</>}<br />
                <span style={{ color: MG }}>URL: {url}</span>
                {allCompetitors.length > 0 && <><br /><span style={{ color: MG }}>Wettbewerber: {allCompetitors.join(", ")}</span></>}
              </div>

              {/* Vorschau Teil A */}
              {dossier.teilA?.kernsatz && (
                <div style={{ background: "#EEF9F7", borderRadius: 6, padding: "12px 16px", fontSize: 13, color: DG, lineHeight: 1.6, marginBottom: 16 }}>
                  {dossier.teilA.kernsatz}
                </div>
              )}
              {dossier.teilA?.cockpit && (
                <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 1, background: "#ddd", border: "1px solid #ddd", borderRadius: 6, overflow: "hidden", marginBottom: 16, fontSize: 12.5 }}>
                  {[["Unternehmen", dossier.teilA.cockpit.unternehmen],
                    ["Lage", dossier.teilA.cockpit.lage],
                    ["Score", dossier.teilA.cockpit.score],
                    ["Nächster Schritt", dossier.teilA.cockpit.naechsterSchritt]].map(([l, c], i) => c && (
                    <Fragment key={i}>
                      <div style={{ background: G, color: "white", fontWeight: 700, padding: "8px 10px" }}>{l}</div>
                      <div style={{ background: "#fafafa", color: DG, padding: "8px 10px", lineHeight: 1.5 }}>{c}</div>
                    </Fragment>
                  ))}
                </div>
              )}
              {Array.isArray(dossier.teilA?.befunde) && dossier.teilA.befunde.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: MG, textTransform: "uppercase", letterSpacing: "0.3px", fontWeight: 700, marginBottom: 6 }}>
                    Befunde ({dossier.teilA.befunde.length})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {dossier.teilA.befunde.map((b, i) => (
                      <span key={i} style={{ ...s.chip, background: "#f0f8e8", borderColor: `${G}55` }}>{b.titel}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={s.exportRow}>
                <button style={{ ...s.btnWord, opacity: dossierExportLoading ? 0.7 : 1, cursor: dossierExportLoading ? "not-allowed" : "pointer" }}
                  disabled={dossierExportLoading} onClick={downloadDossier}>
                  {dossierExportLoading ? <><span style={s.spinner} />…</> : "📝 Berater- und Mandantendossier .docx"}
                </button>
                <button style={{ ...s.btnSave, opacity: saveLoading ? 0.7 : 1, cursor: saveLoading ? "not-allowed" : "pointer" }}
                  disabled={saveLoading} onClick={saveResult}>
                  {saveLoading ? <><span style={s.spinner} />Speichern…</> : "🔗 Ergebnis speichern"}
                </button>
                <button style={s.btnDl} onClick={() => dlMd(`${dateStr}_${baseName}_Dossier.json`, JSON.stringify(dossier, null, 2))}>⬇ .json</button>
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
              <div style={{ fontSize: 11, color: MG, marginTop: 8 }}>{(() => { const d = new Date(); return `${String(d.getFullYear()).slice(2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`; })()}_Berater-und-Mandantendossier_{(dossier.firma||"").replace(/\s+/g,"_")}.docx</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
