import { useState, useRef } from "react";
import { PROMPTS } from "./prompts.js";
import Analyst from "./Analyst.jsx";

const G = "#8CC63E";
const DG = "#454544";
const T = "#33AB97";
const BT = "#13A1B6";
const LG = "#E9E9E9";
const MG = "#777777";

const styles = {
  wrap: { fontFamily: "Calibri, 'Segoe UI', sans-serif", background: "#f0f0f0", minHeight: "100vh", color: DG },
  header: { background: "#cccccc", borderBottom: `4px solid ${G}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logoBox: { width: 40, height: 40, background: G, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 15, marginRight: 12 },
  headerTitle: { fontSize: 16, fontWeight: 700, color: DG },
  headerSub: { fontSize: 11, color: MG, marginTop: 2 },
  headerUrl: { fontSize: 13, color: MG },
  container: { maxWidth: 780, margin: "0 auto", padding: "28px 20px 60px" },
  stepNav: { display: "flex", marginBottom: 28, borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.12)" },
  stepBtnBase: { flex: 1, padding: "13px 8px", border: "none", borderRight: "1px solid #e0e0e0", textAlign: "center", cursor: "pointer", fontFamily: "Calibri, 'Segoe UI', sans-serif", fontSize: 12, lineHeight: 1.4, transition: "background 0.15s" },
  card: { background: "white", borderRadius: 8, border: "1px solid #ddd", padding: 28, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: 17, fontWeight: 700, color: DG, paddingBottom: 10, marginBottom: 18, borderBottom: `3px solid ${G}` },
  cardSub: { fontSize: 13, color: MG, marginBottom: 18, lineHeight: 1.6 },
  label: { display: "block", fontSize: 12, fontWeight: 700, color: DG, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.3px" },
  input: { width: "100%", padding: "10px 12px", border: "1.5px solid #ccc", borderRadius: 5, fontFamily: "Calibri, 'Segoe UI', sans-serif", fontSize: 14, color: DG, boxSizing: "border-box" },
  textarea: { width: "100%", padding: "10px 12px", border: "1.5px solid #ccc", borderRadius: 5, fontFamily: "Calibri, 'Segoe UI', sans-serif", fontSize: 14, color: DG, resize: "vertical", minHeight: 80, boxSizing: "border-box" },
  btnPrimary: { padding: "11px 24px", borderRadius: 5, border: "none", background: G, color: "white", fontFamily: "Calibri, 'Segoe UI', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnSecondary: { padding: "11px 24px", borderRadius: 5, border: "1.5px solid #ccc", background: "white", color: DG, fontFamily: "Calibri, 'Segoe UI', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnTeal: { padding: "11px 24px", borderRadius: 5, border: "none", background: T, color: "white", fontFamily: "Calibri, 'Segoe UI', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnDl: { padding: "7px 16px", background: BT, color: "white", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  btnRow: { display: "flex", gap: 12, marginTop: 24, alignItems: "center", flexWrap: "wrap" },
  optLabel: (sel) => ({ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", border: `1.5px solid ${sel ? G : "#ccc"}`, borderRadius: 5, cursor: "pointer", fontSize: 13, background: sel ? "#f5fbee" : "white", fontWeight: sel ? 700 : 400, userSelect: "none" }),
  infoBox: { background: "#f0f8e8", borderLeft: `4px solid ${G}`, borderRadius: "0 5px 5px 0", padding: "12px 16px", fontSize: 13, color: DG, lineHeight: 1.6, marginBottom: 16 },
  progressWrap: { background: "#e8e8e8", borderRadius: 20, height: 9, margin: "8px 0" },
  progressBar: (pct) => ({ height: 9, borderRadius: 20, background: G, width: `${pct}%`, transition: "width 0.4s" }),
  stepRow: (status) => ({
    display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 5, fontSize: 13,
    border: `1px solid ${status === "done" ? "#c0e080" : status === "running" ? "#f0c840" : status === "error" ? "#f0a0a0" : "#eee"}`,
    background: status === "done" ? "#f0f8e8" : status === "running" ? "#fff9e8" : status === "error" ? "#fff0f0" : "#fafafa",
    marginBottom: 6
  }),
  dot: (status) => ({
    width: 11, height: 11, borderRadius: "50%", flexShrink: 0,
    background: status === "done" ? G : status === "running" ? "#f0c040" : status === "error" ? "#cc4444" : "#ccc"
  }),
  outputBox: { background: "#fafafa", border: "1px solid #e0e0e0", borderRadius: 5, padding: 16, fontSize: 12, fontFamily: "monospace", color: "#333", maxHeight: 300, overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6, marginTop: 12 },
  uploadZone: (has) => ({ border: `2px dashed ${has ? G : "#bbb"}`, borderRadius: 6, padding: 24, textAlign: "center", cursor: "pointer", background: has ? "#f5fbee" : "#fafafa" }),
  fileItem: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px", background: "#f0f8e8", borderRadius: 5, marginBottom: 4, fontSize: 12, border: "1px solid #d0e8a0" },
  downloadItem: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "white", border: "1px solid #e0e0e0", borderRadius: 6, gap: 12, marginBottom: 8 },
  errorMsg: { color: "#cc4444", fontSize: 12 },
};

async function callAPI(prompt, retries = 2) {
  const r = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!r.ok) {
    let msg = `API-Fehler ${r.status}`;
    try { const e = await r.json(); msg += ": " + (e.error?.message || ""); } catch (_) {}
    if (r.status === 529 && retries > 0) {
      await new Promise(res => setTimeout(res, 8000));
      return callAPI(prompt, retries - 1);
    }
    throw new Error(msg);
  }

  // Read SSE stream and accumulate text
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return text;
      try {
        const event = JSON.parse(data);
        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          text += event.delta.text;
        }
        if (event.type === "error") throw new Error(event.error?.message || "Stream-Fehler");
      } catch (e) {
        if (e.message !== "Stream-Fehler" && !(e instanceof SyntaxError)) throw e;
      }
    }
  }
  return text;
}

function slug(s) { return s.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").slice(0, 36); }

function dlFile(name, content) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
  a.download = name;
  a.click();
}

export default function App() {
  const [mode, setMode] = useState("mandatsstart"); // "mandatsstart" | "analyst"
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: "", branche: "", url: "", produkt: "", personen: "", notizen: "" });
  const [docMode, setDocMode] = useState("no");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [doA, setDoA] = useState({ markt: true, branch: true, web: true, kon: true });
  const [steps, setSteps] = useState([]);
  const [progress, setProgress] = useState(0);
  const [progLabel, setProgLabel] = useState("");
  const [liveText, setLiveText] = useState("");
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState("");
  const [results, setResults] = useState({});
  const [downloads, setDownloads] = useState([]);
  const [finalText, setFinalText] = useState("");
  const fileRef = useRef();

  const setField = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const goTo = (n) => setStep(n);

  const validateStep0 = () => {
    if (!form.name || !form.branche || !form.url || !form.produkt) { setErr("Bitte alle Pflichtfelder ausfüllen."); return; }
    setErr(""); goTo(1);
  };

  const handleFiles = (fl) => {
    const arr = Array.from(fl);
    setUploadedFiles(prev => {
      const existing = prev.map(f => f.name);
      return [...prev, ...arr.filter(f => !existing.includes(f.name))];
    });
  };

  const removeFile = (name) => setUploadedFiles(prev => prev.filter(f => f.name !== name));

  const readDocs = async () => {
    const out = [];
    for (const f of uploadedFiles) {
      const t = await new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsText(f); });
      out.push(`[${f.name}]\n${t}`);
    }
    return out.join("\n\n---\n\n");
  };

  const toggleA = (k) => setDoA(prev => ({ ...prev, [k]: !prev[k] }));

  const runAnalysis = async () => {
    setRunning(true); setErr(""); setResults({});
    const d = form;
    const stepsArr = [];
    if (doA.markt) stepsArr.push({ key: "markt", label: "Schritt 1 – Marktanalyse", status: "pending" });
    if (doA.branch) stepsArr.push({ key: "branch", label: "Schritt 2 – Branchenanalyse", status: "pending" });
    if (doA.web) stepsArr.push({ key: "web", label: "Schritt 3 – Webseitenanalyse", status: "pending" });
    stepsArr.push({ key: "synthese", label: "Schritt 4 – Synthese & Ergebnisdokument", status: "pending" });
    if (doA.kon) stepsArr.push({ key: "kon", label: "Kontextkern", status: "pending" });
    setSteps([...stepsArr]);

    const res = {};
    try {
      let docs = "";
      if (docMode === "yes" && uploadedFiles.length) docs = await readDocs();

      for (let i = 0; i < stepsArr.length; i++) {
        const s = stepsArr[i];
        stepsArr[i] = { ...s, status: "running" };
        setSteps([...stepsArr]);
        setProgress(Math.round(i / stepsArr.length * 100));
        setProgLabel(s.label + "…");
        setLiveText(s.label + " wird ausgeführt…");

        let prompt = "";
        if (s.key === "markt") prompt = PROMPTS.markt(d);
        else if (s.key === "branch") prompt = PROMPTS.branch(d);
        else if (s.key === "web") prompt = PROMPTS.web(d);
        else if (s.key === "synthese") prompt = PROMPTS.synthese(d, res.markt, res.branch, res.web);
        else if (s.key === "kon") prompt = PROMPTS.kontextkern(d, docs);

        const result = await callAPI(prompt);
        res[s.key] = result;
        setLiveText(result.slice(0, 800) + (result.length > 800 ? "\n…" : ""));
        stepsArr[i] = { ...stepsArr[i], status: "done" };
        setSteps([...stepsArr]);
        setProgress(Math.round((i + 1) / stepsArr.length * 100));
        setProgLabel(s.label + " abgeschlossen");
      }

      setResults(res);
      buildDownloads(d, res);
      goTo(3);
    } catch (e) {
      setErr(e.message);
      setSteps(prev => prev.map(s => s.status === "running" ? { ...s, status: "error" } : s));
    }
    setRunning(false);
  };

  const buildDownloads = (d, res) => {
    const pre = new Date().toISOString().slice(0, 10).replace(/-/g, "") + "_" + slug(d.name);
    const files = [];
    if (res.synthese) files.push({ name: pre + "_Mandatsstart_Analyse.md", content: res.synthese, desc: "Vollständiges Ergebnisdokument (alle 4 Schritte)" });
    if (res.markt) files.push({ name: pre + "_Marktanalyse.md", content: "# Marktanalyse: " + d.name + "\n\n" + res.markt, desc: "Marktanalyse (Schritt 1)" });
    if (res.branch) files.push({ name: pre + "_Branchenanalyse.md", content: "# Branchenanalyse: " + d.branche + "\n\n" + res.branch, desc: "Branchenanalyse (Schritt 2)" });
    if (res.web) files.push({ name: pre + "_Webseitenanalyse.md", content: "# Webseitenanalyse: " + d.name + "\n\n" + res.web, desc: "Webseitenanalyse (Schritt 3)" });
    if (res.kon) files.push({ name: pre + "_Kontextkern.md", content: res.kon, desc: "Kontextkern für das Claude-Projekt" });
    setDownloads(files);
    setFinalText(res.synthese || res.kon || "(leer)");
  };

  const resetTool = () => {
    setStep(0); setForm({ name: "", branche: "", url: "", produkt: "", personen: "", notizen: "" });
    setUploadedFiles([]); setSteps([]); setResults({}); setDownloads([]); setFinalText(""); setErr("");
  };

  const StepBtn = ({ idx, label }) => {
    const active = step === idx, done = step > idx;
    return (
      <button onClick={() => done || active ? goTo(idx) : null} style={{
        ...styles.stepBtnBase,
        background: active ? G : done ? "#f0f8e8" : "white",
        color: active ? "white" : done ? "#5a9a20" : MG,
        fontWeight: active || done ? 700 : 400,
        borderRight: idx < 3 ? "1px solid #e0e0e0" : "none",
        cursor: done || active ? "pointer" : "default"
      }}>
        <span style={{ fontSize: 10, display: "block", opacity: 0.75, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>Schritt {idx + 1}</span>
        {label}
      </button>
    );
  };

  const OptBtn = ({ active, onClick, children }) => (
    <label style={styles.optLabel(active)} onClick={onClick}>{children}</label>
  );

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/logo.png" alt="be nice Logo" style={{ height: 40, width: "auto", marginRight: 12, display: "block" }} />
          <div>
            <div style={styles.headerTitle}>Mandatsstart & External Intel Analyst</div>
            <div style={styles.headerSub}>Clemens Gutmann | be nice Managementberatung</div>
          </div>
        </div>
        <a href="https://www.nice-network.de" target="_blank" rel="noopener noreferrer" style={{ ...styles.headerUrl, textDecoration: "none" }}>www.nice-network.de</a>
      </div>

      <div style={styles.container}>
        {/* Mode selector */}
        <div style={{ display: "flex", marginBottom: 24, borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.12)", border: "1px solid #ddd" }}>
          {[["mandatsstart", "📋 Mandatsstart-Tool"], ["analyst", "🔍 Strategy & External Intel Analyst"]].map(([key, label]) => (
            <button key={key} onClick={() => setMode(key)} style={{
              flex: 1, padding: "13px 16px", border: "none", borderRight: key === "mandatsstart" ? "1px solid #ddd" : "none",
              background: mode === key ? DG : "white", color: mode === key ? "white" : MG,
              fontFamily: "Calibri, 'Segoe UI', sans-serif", fontSize: 13, fontWeight: mode === key ? 700 : 400, cursor: "pointer",
            }}>{label}</button>
          ))}
        </div>

        {mode === "analyst" && <Analyst />}

        {mode === "mandatsstart" && <>
        <div style={styles.stepNav}>
          {["Mandatsdaten", "Dokumente", "Analyse", "Ergebnisse"].map((l, i) => <StepBtn key={i} idx={i} label={l} />)}
        </div>

        {step === 0 && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Mandatsdaten eingeben</div>
            <p style={styles.cardSub}>Diese Felder fließen automatisch in alle vier Analyse-Prompts ein. Pflichtfelder sind mit * markiert.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={styles.label}>Unternehmensname <span style={{ color: G }}>*</span></label>
                <input style={styles.input} value={form.name} onChange={setField("name")} placeholder="Mustermann GmbH" />
              </div>
              <div>
                <label style={styles.label}>Branche <span style={{ color: G }}>*</span></label>
                <input style={styles.input} value={form.branche} onChange={setField("branche")} placeholder="Maschinenbau" />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Website-URL <span style={{ color: G }}>*</span></label>
              <input style={styles.input} value={form.url} onChange={setField("url")} placeholder="https://www.mustermann.de" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Produkt / Dienstleistung <span style={{ color: G }}>*</span></label>
              <textarea style={styles.textarea} value={form.produkt} onChange={setField("produkt")} placeholder="z.B. Sondermaschinen für die Lebensmittelindustrie" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Schlüsselpersonen (optional)</label>
              <input style={styles.input} value={form.personen} onChange={setField("personen")} placeholder="GF: Herr Mustermann, Vertrieb: Frau Schmidt" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Ersteindrücke / Notizen (optional)</label>
              <textarea style={{ ...styles.textarea, minHeight: 64 }} value={form.notizen} onChange={setField("notizen")} placeholder="Freie Notizen für den Kontextkern…" />
            </div>
            <div style={styles.btnRow}>
              <button style={styles.btnPrimary} onClick={validateStep0}>Weiter → Dokumente &amp; Modus</button>
              {err && <span style={styles.errorMsg}>{err}</span>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Dokumente &amp; Kontextkern-Modus</div>
            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Liegen bereits Mandatsdokumente vor?</label>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <OptBtn active={docMode === "no"} onClick={() => setDocMode("no")}>
                  <input type="radio" readOnly checked={docMode === "no"} style={{ accentColor: G }} /> Nein – aus Stammdaten ableiten
                </OptBtn>
                <OptBtn active={docMode === "yes"} onClick={() => setDocMode("yes")}>
                  <input type="radio" readOnly checked={docMode === "yes"} style={{ accentColor: G }} /> Ja – Dokumente hochladen
                </OptBtn>
              </div>
            </div>

            {docMode === "yes" && (
              <div style={{ marginBottom: 16 }}>
                <label style={styles.label}>Dokumente hochladen</label>
                <div style={styles.uploadZone(uploadedFiles.length > 0)} onClick={() => fileRef.current.click()}>
                  <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.txt,.md" style={{ display: "none" }}
                    onChange={e => handleFiles(e.target.files)} />
                  <div style={{ fontSize: 30, marginBottom: 8 }}>📂</div>
                  <div style={{ fontSize: 13, color: MG }}>Dateien hierher ziehen oder <strong style={{ color: BT, cursor: "pointer" }}>durchsuchen</strong></div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>PDF, DOCX, TXT, MD</div>
                </div>
                {uploadedFiles.map(f => (
                  <div key={f.name} style={styles.fileItem}>
                    <span>📄 {f.name} <span style={{ color: MG }}>({(f.size / 1024).toFixed(1)} KB)</span></span>
                    <button onClick={() => removeFile(f.name)} style={{ background: "none", border: "none", color: "#cc4444", cursor: "pointer", fontSize: 16 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.infoBox}>
              {docMode === "yes"
                ? <><strong>Modus: Dokumente hochladen</strong><br />Vorhandene Dokumente werden für den Kontextkern ausgewertet. Lücken ergänzt Claude aus dem Kontext.</>
                : <><strong>Modus: Aus Stammdaten ableiten</strong><br />Claude erstellt den Kontextkern aus den eingegebenen Daten und dem Branchenkontext.</>}
            </div>

            <div style={styles.btnRow}>
              <button style={styles.btnSecondary} onClick={() => goTo(0)}>← Zurück</button>
              <button style={styles.btnPrimary} onClick={() => goTo(2)}>Weiter → Analyse starten</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Analyse starten</div>

            <div style={styles.infoBox}>
              <strong>{form.name}</strong> · {form.branche}<br />
              {form.url}<br />
              <em>{form.produkt}</em>
              {form.personen && <><br />Personen: {form.personen}</>}
              {uploadedFiles.length > 0 && <><br />Dokumente: {uploadedFiles.map(f => f.name).join(", ")}</>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={styles.label}>Analyse-Schritte</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                {[["markt", "Marktanalyse"], ["branch", "Branchenanalyse"], ["web", "Webseitenanalyse"], ["kon", "Kontextkern"]].map(([k, l]) => (
                  <OptBtn key={k} active={doA[k]} onClick={() => toggleA(k)}>
                    <input type="checkbox" readOnly checked={doA[k]} style={{ accentColor: G }} /> {l}
                  </OptBtn>
                ))}
              </div>
            </div>

            {steps.length > 0 && (
              <>
                <div>
                  {steps.map((s, i) => (
                    <div key={i} style={styles.stepRow(s.status)}>
                      <div style={styles.dot(s.status)} />
                      <span style={{ flex: 1, color: DG }}>{s.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: s.status === "done" ? "#5a9a20" : s.status === "running" ? "#a07010" : "transparent" }}>
                        {s.status === "done" ? "✓ Fertig" : s.status === "running" ? "läuft…" : "–"}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={styles.progressWrap}><div style={styles.progressBar(progress)} /></div>
                  <div style={{ fontSize: 12, color: MG, display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span>Gesamtfortschritt</span><span>{progress} %</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: MG, marginTop: 12, marginBottom: 4 }}>Live-Ausgabe:</div>
                <div style={styles.outputBox}>{liveText}</div>
              </>
            )}

            <div style={styles.btnRow}>
              <button style={styles.btnSecondary} disabled={running} onClick={() => goTo(1)}>← Zurück</button>
              <button style={{ ...styles.btnPrimary, opacity: running ? 0.7 : 1, cursor: running ? "not-allowed" : "pointer" }}
                disabled={running} onClick={runAnalysis}>
                {running ? "⏳ Läuft…" : "🚀 Analyse starten"}
              </button>
              {err && <span style={styles.errorMsg}>{err}</span>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Ergebnisse &amp; Download</div>
            <p style={styles.cardSub}>Alle erzeugten Dateien stehen zum Download bereit. Laden Sie diese in Ihr Claude-Projekt hoch.</p>

            {downloads.map((f, i) => (
              <div key={i} style={styles.downloadItem}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: DG }}>📄 {f.name}</div>
                  <div style={{ fontSize: 11, color: MG, marginTop: 2 }}>{f.desc}</div>
                </div>
                <button style={styles.btnDl} onClick={() => dlFile(f.name, f.content)}>⬇ Download</button>
              </div>
            ))}

            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 12, color: MG, marginBottom: 6 }}>Vollständiges Ergebnisdokument (Vorschau):</div>
              <div style={{ ...styles.outputBox, maxHeight: 380 }}>{finalText}</div>
            </div>

            <div style={styles.btnRow}>
              <button style={styles.btnSecondary} onClick={resetTool}>↺ Neue Analyse</button>
              <button style={styles.btnTeal} onClick={() => downloads.forEach(f => dlFile(f.name, f.content))}>⬇ Alle herunterladen</button>
            </div>
          </div>
        )}
        </>}
      </div>
    </div>
  );
}
