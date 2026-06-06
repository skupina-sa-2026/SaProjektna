import React, { useState } from "react";

function AccessLogList({ logs, lockers }) {
  const [filterLocker, setFilterLocker] = useState("");
  const [filterResult, setFilterResult] = useState("all");
  const [filterAction, setFilterAction] = useState("all");

  const filtered = logs.filter(log => {
    const matchLocker = filterLocker ? log.locker?._id === filterLocker : true;
    const matchResult = filterResult !== "all" ? log.result === filterResult : true;
    const matchAction = filterAction !== "all" ? log.action === filterAction : true;
    return matchLocker && matchResult && matchAction;
  });

  const successCount = filtered.filter(l => l.result === "success").length;
  const deniedCount  = filtered.filter(l => l.result === "denied").length;

  const actionIcon = { unlock: "🔓", lock: "🔒", login: "👤" };

  return (
    <section>
      {/* Summary chips */}
      <div style={{display:"flex", gap:10, marginBottom:20, flexWrap:"wrap"}}>
        <span style={{
          background:"rgba(16,185,129,0.12)", color:"var(--success)",
          border:"1px solid rgba(16,185,129,0.3)", borderRadius:8,
          padding:"6px 14px", fontSize:12, fontFamily:"var(--mono)", fontWeight:600
        }}>
          ✓ {successCount} uspešnih
        </span>
        <span style={{
          background:"rgba(239,68,68,0.1)", color:"var(--danger)",
          border:"1px solid rgba(239,68,68,0.3)", borderRadius:8,
          padding:"6px 14px", fontSize:12, fontFamily:"var(--mono)", fontWeight:600
        }}>
          ✕ {deniedCount} zavrnjenih
        </span>
        <span style={{
          background:"var(--surface)", color:"var(--muted)",
          border:"1px solid var(--border)", borderRadius:8,
          padding:"6px 14px", fontSize:12, fontFamily:"var(--mono)", fontWeight:600
        }}>
          ◫ {filtered.length} skupaj
        </span>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Dnevnik odklepov</h3>
            <p className="panel-desc">Vsi poskusi dostopa, uspešni in zavrnjeni.</p>
          </div>

          {/* Filters */}
          <div className="filter-bar">
            <select value={filterLocker} onChange={e => setFilterLocker(e.target.value)}>
              <option value="">Vsi paketniki</option>
              {lockers.map(l => (
                <option key={l._id} value={l._id}>{l.name}</option>
              ))}
            </select>
            <select value={filterResult} onChange={e => setFilterResult(e.target.value)}>
              <option value="all">Vsi rezultati</option>
              <option value="success">Uspešni</option>
              <option value="denied">Zavrnjeni</option>
            </select>
            <select value={filterAction} onChange={e => setFilterAction(e.target.value)}>
              <option value="all">Vse akcije</option>
              <option value="unlock">Odklepanje</option>
              <option value="lock">Zaklepanje</option>
              <option value="login">Prijava</option>
            </select>
          </div>
        </div>

        <div className="list">
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">◫</div>
              <p>Ni zapisov za izbrane filtre.</p>
            </div>
          )}

          {filtered.map(log => (
            <article key={log._id} className={`log-item ${log.result}`}>
              <div className="log-main">
                <span className={`log-action ${log.result === "denied" ? "denied" : log.action}`}>
                  {actionIcon[log.action] || "?"} {log.action.toUpperCase()}
                </span>
                {log.message && <span className="log-message">{log.message}</span>}
                <div className="log-meta">
                  <span>📦 {log.locker?.name || "Paketnik"}</span>
                  {log.locker?.location && <span>📍 {log.locker.location}</span>}
                  <span>👤 {log.user?.name || "Brez prijave"}</span>
                  {log.reservation && <span>📋 Rezervacija</span>}
                  <span>🕐 {formatDate(log.createdAt)}</span>
                </div>
              </div>
              <div className="log-right">
                <span className={`result-badge ${log.result}`}>{log.result}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatDate(v) {
  if (!v) return "";
  return new Date(v).toLocaleString("sl-SI");
}

export default AccessLogList;
