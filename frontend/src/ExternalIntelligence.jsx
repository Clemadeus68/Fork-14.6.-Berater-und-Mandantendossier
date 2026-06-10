import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";

const G = "#8CC63E";
const DG = "#454544";
const T = "#33AB97";
const BT = "#13A1B6";
const MG = "#777777";
const LG = "#E9E9E9";
const AMBER = "#f59e0b";
const RED = "#ef4444";

const fmt = (n) => n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
const fmtEur = (n) => n >= 1000 ? "€" + (n / 1000).toFixed(1) + "K" : "€" + n;

const s = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 },
  statCard: (color = G) => ({ background: "white", border: `1px solid ${LG}`, borderRadius: 8, padding: "14px 16px", borderTop: `3px solid ${color}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }),
  statValue: { fontSize: 22, fontWeight: 700, color: DG, marginBottom: 2 },
  statLabel: { fontSize: 11, color: MG, textTransform: "uppercase", letterSpacing: "0.3px" },
  badge: (tier) => {
    const c = (tier === "hoch") ? G : (tier === "mittel") ? AMBER : (tier === "niedrig" || tier === "kaum sichtbar") ? RED : MG;
    return { display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + "22", color: c, border: `1px solid ${c}44` };
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: { textAlign: "left", padding: "8px 10px", background: LG, color: MG, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.3px", borderBottom: `2px solid ${LG}` },
  td: { padding: "8px 10px", borderBottom: `1px solid ${LG}`, color: DG, verticalAlign: "middle" },
  chartWrap: { background: "white", border: `1px solid ${LG}`, borderRadius: 8, padding: "16px 8px 8px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 20 },
  chartTitle: { fontSize: 12, fontWeight: 700, color: MG, textTransform: "uppercase", letterSpacing: "0.3px", paddingLeft: 12, marginBottom: 12 },
  noData: { color: MG, fontSize: 13, textAlign: "center", padding: 32, background: "#fafafa", borderRadius: 8, border: `1px dashed ${LG}` },
};

function visibilityTier(v) {
  if (v === null || v === undefined) return "unbekannt";
  if (v === 0) return "kaum sichtbar";
  if (v < 1) return "niedrig";
  if (v < 10) return "mittel";
  return "hoch";
}

function VisibilityGauge({ value }) {
  const max = Math.max(value * 2, 10);
  const pct = Math.min((value / max) * 100, 100);
  const tier = visibilityTier(value);
  const color = tier === "hoch" ? G : tier === "mittel" ? AMBER : (tier === "niedrig" || tier === "kaum sichtbar") ? RED : MG;

  return (
    <div style={s.statCard(color)}>
      <div style={{ ...s.statValue, color }}>{value === 0 ? "0.00" : value.toFixed(2)}</div>
      <div style={s.statLabel}>SISTRIX Sichtbarkeitsindex</div>
      <div style={{ marginTop: 10, height: 6, background: LG, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.6s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: MG }}>0</span>
        <span style={{ fontSize: 10, color: MG }}>Ø Branche ~5–20</span>
        <span style={{ fontSize: 10, color: MG }}>{max.toFixed(0)}</span>
      </div>
    </div>
  );
}

function TopPagesChart({ pages }) {
  if (!pages || pages.length === 0) return <div style={s.noData}>Keine Traffic-Daten verfügbar</div>;

  const data = pages.map(p => ({
    name: p.path === "/" ? "(Startseite)" : p.path.replace(/\/$/, "").split("/").pop()?.slice(0, 22) || p.path,
    clicks: p.clicks,
    keywords: p.keywords,
    full: p.path,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: "white", border: `1px solid ${LG}`, borderRadius: 6, padding: "10px 14px", fontSize: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: DG }}>{d.full}</div>
        <div style={{ color: G }}>~{d.clicks.toLocaleString("de-DE")} Klicks/Mo</div>
        <div style={{ color: MG }}>{d.keywords} Keywords</div>
      </div>
    );
  };

  return (
    <div style={s.chartWrap}>
      <div style={s.chartTitle}>Top-Seiten nach organischem Traffic</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 0, bottom: 0 }}>
          <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 10, fill: MG }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: DG }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f0f8e8" }} />
          <Bar dataKey="clicks" fill={G} radius={[0, 4, 4, 0]} barSize={18}>
            {data.map((_, i) => <Cell key={i} fill={i === 0 ? G : G + "99"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function KeywordsTable({ pages }) {
  if (!pages || pages.length === 0) return null;
  const sorted = [...pages].sort((a, b) => b.keywords - a.keywords).slice(0, 8);

  return (
    <div style={{ ...s.chartWrap, padding: 0, overflow: "hidden" }}>
      <div style={{ ...s.chartTitle, padding: "14px 16px 10px" }}>Keyword-Stärke je Seite</div>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Seite</th>
            <th style={{ ...s.th, textAlign: "right" }}>Keywords</th>
            <th style={{ ...s.th, textAlign: "right" }}>Klicks/Mo</th>
            <th style={{ ...s.th, textAlign: "right" }}>SEO-Wert</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr key={i} style={{ background: i === 0 ? "#f5fbee" : "white" }}>
              <td style={s.td}>
                <span style={{ fontSize: 11, color: MG, marginRight: 4 }}>{i + 1}.</span>
                <a href={p.fullUrl} target="_blank" rel="noopener noreferrer"
                  style={{ color: BT, textDecoration: "none", fontSize: 12 }}>
                  {p.path === "/" ? "Startseite" : p.path.slice(0, 40)}
                </a>
              </td>
              <td style={{ ...s.td, textAlign: "right", fontWeight: 700, color: G }}>{p.keywords.toLocaleString("de-DE")}</td>
              <td style={{ ...s.td, textAlign: "right", color: DG }}>{p.clicks.toLocaleString("de-DE")}</td>
              <td style={{ ...s.td, textAlign: "right", color: MG }}>{fmtEur(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompetitorList({ main, competitors }) {
  if (!competitors || competitors.length === 0) return null;

  const allEntries = [
    { domain: main.domain, visibility: main.visibility, totalClicks: main.totalClicks, totalKeywords: main.totalKeywords, isMain: true },
    ...competitors.map(c => ({ domain: c.domain, visibility: c.visibility, totalClicks: c.totalClicks, totalKeywords: c.totalKeywords, isMain: false })),
  ].sort((a, b) => (b.visibility ?? 0) - (a.visibility ?? 0));

  const maxVis = Math.max(...allEntries.map(e => e.visibility ?? 0), 0.01);

  return (
    <div style={{ ...s.chartWrap, padding: 0, overflow: "hidden", marginBottom: 0, borderBottom: "none", borderRadius: "8px 8px 0 0" }}>
      <div style={{ ...s.chartTitle, padding: "14px 16px 10px", borderBottom: `1px solid ${LG}` }}>
        Wettbewerber im Vergleich — Top {allEntries.length} nach SISTRIX Sichtbarkeitsindex
      </div>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={{ ...s.th, width: 28 }}>#</th>
            <th style={s.th}>Domain</th>
            <th style={{ ...s.th, width: 90, textAlign: "right" }}>Sichtbarkeit</th>
            <th style={{ ...s.th, width: 100, textAlign: "right" }}>Klicks/Mo</th>
            <th style={{ ...s.th, width: 90, textAlign: "right" }}>Keywords</th>
            <th style={{ ...s.th, width: 160 }}>Relative Stärke</th>
          </tr>
        </thead>
        <tbody>
          {allEntries.map((e, i) => {
            const tier = visibilityTier(e.visibility ?? 0);
            const barPct = maxVis > 0 ? Math.round(((e.visibility ?? 0) / maxVis) * 100) : 0;
            return (
              <tr key={e.domain} style={{ background: e.isMain ? "#f5fbee" : i % 2 === 0 ? "white" : "#fafafa" }}>
                <td style={{ ...s.td, color: MG, fontSize: 11, textAlign: "center" }}>{i + 1}</td>
                <td style={s.td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {e.isMain && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: "white", background: G, padding: "2px 6px", borderRadius: 10, textTransform: "uppercase", letterSpacing: "0.4px", flexShrink: 0 }}>
                        analysiert
                      </span>
                    )}
                    <a href={`https://${e.domain}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: e.isMain ? DG : BT, textDecoration: "none", fontWeight: e.isMain ? 700 : 400, fontSize: 13 }}>
                      {e.domain}
                    </a>
                  </div>
                </td>
                <td style={{ ...s.td, textAlign: "right", fontWeight: 700, color: DG, fontSize: 13 }}>
                  {(e.visibility ?? 0).toFixed(2)}
                </td>
                <td style={{ ...s.td, textAlign: "right", color: MG, fontSize: 12 }}>
                  {(e.totalClicks ?? 0).toLocaleString("de-DE")}
                </td>
                <td style={{ ...s.td, textAlign: "right", color: MG, fontSize: 12 }}>
                  {(e.totalKeywords ?? 0).toLocaleString("de-DE")}
                </td>
                <td style={s.td}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 8, background: LG, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${barPct}%`, height: "100%", background: e.isMain ? G : BT + "cc", borderRadius: 4, transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontSize: 10, color: MG, width: 32, textAlign: "right", flexShrink: 0 }}>{barPct}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function VisibilityComparisonChart({ main, competitors }) {
  if (!competitors || competitors.length === 0) return null;

  const allEntries = [
    { name: main.domain, value: main.visibility ?? 0, isMain: true },
    ...competitors.map(c => ({ name: c.domain, value: c.visibility ?? 0, isMain: false })),
  ].sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: "white", border: `1px solid ${LG}`, borderRadius: 6, padding: "10px 14px", fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <div style={{ fontWeight: 700, color: DG, marginBottom: 3 }}>{d.name}</div>
        <div style={{ color: d.isMain ? G : BT }}>Sichtbarkeitsindex: <strong>{d.value.toFixed(2)}</strong></div>
        <div style={{ color: MG, fontSize: 11, marginTop: 2 }}>{visibilityTier(d.value)}</div>
      </div>
    );
  };

  const barHeight = Math.max(allEntries.length * 42 + 20, 160);

  return (
    <div style={{ ...s.chartWrap, borderRadius: "0 0 8px 8px", borderTop: "none", marginBottom: 20 }}>
      <div style={s.chartTitle}>SISTRIX Sichtbarkeitsindex — Direktvergleich</div>
      <ResponsiveContainer width="100%" height={barHeight}>
        <BarChart data={allEntries} layout="vertical" margin={{ left: 12, right: 60, top: 4, bottom: 4 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: MG }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v.toFixed(1)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={({ x, y, payload }) => {
              const entry = allEntries.find(e => e.name === payload.value);
              return (
                <text x={x} y={y} dy={4} textAnchor="end" fontSize={12}
                  fontWeight={entry?.isMain ? 700 : 400}
                  fill={entry?.isMain ? DG : MG}>
                  {payload.value.length > 22 ? payload.value.slice(0, 20) + "…" : payload.value}
                </text>
              );
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f5" }} />
          <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={24}>
            {allEntries.map((e, i) => (
              <Cell key={i} fill={e.isMain ? G : BT + "bb"} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={v => v.toFixed(2)}
              style={{ fontSize: 11, fill: MG, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", gap: 20, padding: "4px 16px 8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: DG }}><span style={{ display: "inline-block", width: 10, height: 10, background: G, borderRadius: 2, marginRight: 5, verticalAlign: "middle" }} />{main.domain} (analysiert)</span>
        <span style={{ fontSize: 11, color: MG }}><span style={{ display: "inline-block", width: 10, height: 10, background: BT + "bb", borderRadius: 2, marginRight: 5, verticalAlign: "middle" }} />Wettbewerber</span>
      </div>
    </div>
  );
}

function NoCompetitorsBanner({ status }) {
  if (status === "found") return null;

  const msg = status === "empty"
    ? "Es konnten keine Wettbewerber automatisch identifiziert werden — vermutlich zu wenig öffentliche Website-Informationen verfügbar. Trage bekannte Wettbewerber manuell ein, um den Vergleich zu aktivieren."
    : "Die Wettbewerber-Identifikation ist fehlgeschlagen. Trage bekannte Wettbewerber manuell ein, um den Vergleich zu aktivieren.";

  const borderColor = status === "empty" ? AMBER : RED;
  const bg = status === "empty" ? `${AMBER}18` : `${RED}12`;

  return (
    <div style={{ borderLeft: `4px solid ${borderColor}`, background: bg, borderRadius: "0 6px 6px 0", padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>⚠</span>
      <div>
        <div style={{ fontWeight: 700, color: DG, fontSize: 13, marginBottom: 3 }}>Kein Wettbewerbsvergleich verfügbar</div>
        <div style={{ fontSize: 12, color: DG, lineHeight: 1.6 }}>{msg}</div>
      </div>
    </div>
  );
}

export default function ExternalIntelligence({ data, loading, competitorStatus }) {
  if (loading) {
    return (
      <div style={{ padding: "24px 0", textAlign: "center", color: MG, fontSize: 13 }}>
        <div style={{ width: 18, height: 18, border: `2px solid ${LG}`, borderTop: `2px solid ${G}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block", marginRight: 8, verticalAlign: "middle" }} />
        SISTRIX-Daten werden geladen…
      </div>
    );
  }

  if (!data) return null;

  const { domain, visibility, totalClicks, totalKeywords, totalValue, topPages, competitors } = data;
  const hasCompetitors = competitors && competitors.length > 0;

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 4, height: 28, background: G, borderRadius: 2 }} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: DG }}>Sistrix-Ergebnisse</div>
          <div style={{ fontSize: 11, color: MG }}>Quelle: SISTRIX · Domain: {domain}</div>
        </div>
      </div>

      {/* No competitors banner */}
      <NoCompetitorsBanner status={competitorStatus} />

      {/* KPI Cards */}
      <div style={s.grid}>
        <VisibilityGauge value={visibility ?? 0} />
        <div style={s.statCard(BT)}>
          <div style={{ ...s.statValue, color: BT }}>{fmt(totalClicks)}</div>
          <div style={s.statLabel}>Organische Klicks/Monat</div>
        </div>
        <div style={s.statCard(T)}>
          <div style={{ ...s.statValue, color: T }}>{fmt(totalKeywords)}</div>
          <div style={s.statLabel}>Rankende Keywords</div>
        </div>
        <div style={s.statCard(AMBER)}>
          <div style={{ ...s.statValue, color: AMBER }}>{fmtEur(totalValue)}</div>
          <div style={s.statLabel}>Geschätzter SEO-Wert/Mo</div>
        </div>
      </div>

      {/* Competitor list + chart — full width, visually connected */}
      {hasCompetitors && (
        <>
          <CompetitorList main={{ domain, visibility, totalClicks, totalKeywords }} competitors={competitors} />
          <VisibilityComparisonChart main={{ domain, visibility }} competitors={competitors} />
        </>
      )}

      {/* Own traffic charts */}
      <TopPagesChart pages={topPages} />
      <KeywordsTable pages={topPages} />
    </div>
  );
}
