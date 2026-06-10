import Analyst from "./Analyst.jsx";

const G  = "#8CC63E";
const DG = "#454544";
const MG = "#777777";

export default function App() {
  return (
    <div style={{ fontFamily: "Calibri, 'Segoe UI', sans-serif", background: "#f0f0f0", minHeight: "100vh", color: DG }}>
      {/* Header */}
      <div style={{ background: "#cccccc", borderBottom: `4px solid ${G}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/logo.png" alt="be nice Logo" style={{ height: 40, width: "auto", marginRight: 12, display: "block" }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DG }}>Strategy &amp; External Intel Analyst</div>
            <div style={{ fontSize: 11, color: MG, marginTop: 2 }}>Clemens Gutmann | be nice Managementberatung</div>
          </div>
        </div>
        <a href="https://www.nice-network.de" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13, color: MG, textDecoration: "none" }}>
          www.nice-network.de
        </a>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px 60px" }}>
        <Analyst />
      </div>
    </div>
  );
}
