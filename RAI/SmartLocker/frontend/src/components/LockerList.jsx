import React, { useState } from "react";
import { apiRequest } from "../api";

// Visual locker diagram
function LockerDiagram({ status }) {
  const colors = {
    locked:   { door: "#1e2d47", indicator: "#3b82f6", glow: "rgba(59,130,246,0.3)" },
    unlocked: { door: "#1a3320", indicator: "#10b981", glow: "rgba(16,185,129,0.4)" },
    inactive: { door: "#1c1a10", indicator: "#f59e0b", glow: "rgba(245,158,11,0.2)" }
  };
  const c = colors[status] || colors.locked;

  return (
    <div style={{
      display: "inline-flex",
      flexDirection: "column",
      gap: 3,
      padding: "10px 12px",
      background: "#0d1525",
      borderRadius: 10,
      border: "1px solid #1e2d47",
      boxShadow: `0 0 16px ${c.glow}`,
      transition: "box-shadow 0.3s"
    }}>
      {/* Top bar — steel frame */}
      <div style={{
        height: 6,
        background: "linear-gradient(90deg, #1e2d47, #2d3f5a, #1e2d47)",
        borderRadius: 3,
        marginBottom: 2
      }} />

      {/* Compartment grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 3
      }}>
        <div style={{
          width: 42,
          height: 46,
          background: c.door,
          borderRadius: 5,
          border: "1px solid #2d3f5a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 0 5px",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Door handle */}
          <div style={{
            width: 10,
            height: 2,
            background: "#3d5068",
            borderRadius: 2,
            marginTop: 3
          }} />
          {/* Status indicator LED */}
          <div style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: c.indicator,
            boxShadow: `0 0 4px ${c.indicator}`,
            marginBottom: 3
          }} />
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        height: 4,
        background: "linear-gradient(90deg, #1e2d47, #2d3f5a, #1e2d47)",
        borderRadius: 3,
        marginTop: 2
      }} />
    </div>
  );
}

function LockerList({ lockers, onChange, addToast, user }) {
  const [form, setForm] = useState({
    name: "", location: "", description: "",
    unitNumber: "", floor: ""
  });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const isHost = user?.role === "host";

  function updateField(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function createLocker(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      addToast("Naziv in lokacija sta obvezna", "error");
      return;
    }
    if (form.floor !== "") {
      const floor = Number(form.floor);
      if (!Number.isInteger(floor) || floor < -3 || floor > 60) {
        addToast("Nadstropje mora biti med -3 in 60", "error");
        return;
      }
    }
    setSaving(true);
    try {
      await apiRequest("/api/lockers", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          location: form.location,
          description: form.description,
          unitNumber: form.unitNumber || null,
          floor: form.floor !== "" ? parseInt(form.floor) : null
        })
      });
      setForm({ name: "", location: "", description: "", unitNumber: "", floor: "" });
      await onChange();
      addToast("Paketnik uspešno dodan!", "success");
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(locker, status) {
    try {
      await apiRequest(`/api/lockers/${locker._id}`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      await onChange();
      const labels = { locked: "zaklenjen", unlocked: "odklenjen", inactive: "neaktiven" };
      addToast(`Paketnik ${labels[status]}`, "success");
    } catch (error) {
      addToast(error.message, "error");
    }
  }

  async function deleteLocker(locker) {
    if (!confirm(`Izbriši paketnik "${locker.name}"?\n\nVse vezane rezervacije in dnevniki bodo tudi izbrisani.`)) return;
    try {
      await apiRequest(`/api/lockers/${locker._id}`, { method: "DELETE" });
      await onChange();
      addToast("Paketnik in vezane rezervacije izbrisani", "info");
    } catch (error) {
      addToast(error.message, "error");
    }
  }

  async function unlockLocker(locker) {
    try {
      await apiRequest(`/api/lockers/${locker._id}/unlock`, {
        method: "POST",
        body: JSON.stringify({})
      });
      await onChange();
      addToast(`${locker.name} odklenjen`, "success");
    } catch (error) {
      addToast(error.message, "error");
    }
  }

  async function lockLocker(locker) {
    try {
      await apiRequest(`/api/lockers/${locker._id}/lock`, { method: "POST", body: JSON.stringify({}) });
      await onChange();
      addToast(`${locker.name} zaklenjen`, "success");
    } catch (error) {
      addToast(error.message, "error");
    }
  }

  function copyId(id) {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      addToast("ID kopiran v odložišče", "success");
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  const myLockers = isHost
    ? lockers.filter(l => l.owner?._id === user.id || l.owner === user.id)
    : lockers;

  const floorLabel = (f) => {
    if (f === null || f === undefined) return null;
    if (f === 0) return "pritličje";
    if (f < 0) return `klet ${Math.abs(f)}`;
    return `${f}. nadstropje`;
  };

  return (
    <div className="two-column">
      {/* Add form — hosts only */}
      {isHost && (
        <section className="panel">
          <h3>Dodaj paketnik</h3>
          <p className="panel-desc" style={{marginBottom:16}}>
            Registriraj fizičen paketnik v sistem. Natančni podatki pomagajo gostu najti pravo enoto.
          </p>

          {/* Live preview diagram */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            padding: "16px 0 20px",
            borderBottom: "1px solid var(--border)",
            marginBottom: 16
          }}>
            <div style={{textAlign:"center"}}>
              <LockerDiagram
                status="locked"
              />
              <p style={{
                fontSize:11, color:"var(--muted)", fontFamily:"var(--mono)",
                marginTop:8, marginBottom:0
              }}>
                predogled — 1 predal
              </p>
            </div>
          </div>

          <form className="form" onSubmit={createLocker}>
            <label>Naziv paketnika *</label>
            <input
              name="name"
              placeholder="npr. Paketnik Blok A"
              value={form.name}
              onChange={updateField}
              required
              maxLength={80}
            />

            <label>Lokacija / naslov *</label>
            <input
              name="location"
              placeholder="npr. Ljubljana, Šiška 15 — vhod B"
              value={form.location}
              onChange={updateField}
              required
              maxLength={160}
            />

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
              <div>
                <label style={{display:"block", fontWeight:700, fontSize:12, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6}}>
                  Enota / oznaka
                </label>
                <input
                  name="unitNumber"
                  placeholder="npr. A-03"
                  value={form.unitNumber}
                  onChange={updateField}
                  maxLength={20}
                  style={{width:"100%"}}
                />
              </div>
              <div>
                <label style={{display:"block", fontWeight:700, fontSize:12, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6}}>
                  Nadstropje
                </label>
                <input
                  name="floor"
                  type="number"
                  placeholder="0 = pritličje"
                  value={form.floor}
                  onChange={updateField}
                  min="-3"
                  max="60"
                  step="1"
                  style={{width:"100%"}}
                />
              </div>
            </div>

            <label>Navodila za gosta</label>
            <textarea
              name="description"
              placeholder="npr. Paketnik je pri vhodu desno, nad poštnimi nabiralniki. Pritisnite tipko na zaslonu..."
              value={form.description}
              onChange={updateField}
              maxLength={500}
            />

            <button
              className="btn btn-primary"
              type="submit"
              disabled={saving}
              style={{marginTop:4}}
            >
              {saving ? "Dodajanje..." : "+ Dodaj paketnik"}
            </button>
          </form>
        </section>
      )}

      {/* Locker list */}
      <section className="panel" style={!isHost ? {gridColumn:"1/-1"} : {}}>
        <div className="panel-header">
          <div>
            <h3>Moji paketniki</h3>
            <p className="panel-desc">{myLockers.length} paketnik{myLockers.length !== 1 ? "ov" : ""} skupaj</p>
          </div>
        </div>

        <div className="list">
          {myLockers.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">⬡</div>
              <p>Ni dodanih paketnikov.</p>
              {isHost && <p>Dodaj prvega z obrazcem levo.</p>}
            </div>
          )}

          {myLockers.map(locker => {
            const fl = floorLabel(locker.floor);

            return (
              <article
                className="locker-card"
                key={locker._id}
                style={{
                  borderColor: locker.status === "unlocked"
                    ? "rgba(16,185,129,0.35)"
                    : locker.status === "inactive"
                      ? "rgba(245,158,11,0.25)"
                      : undefined,
                  cursor: "default"
                }}
              >
                <div className="locker-card-top">
                  {/* Visual diagram */}
                  <LockerDiagram
                    status={locker.status}
                  />

                  <div className="locker-card-info" style={{flex:1}}>
                    <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
                      <strong style={{fontSize:15}}>{locker.name}</strong>
                      {locker.unitNumber && (
                        <span style={{
                          fontFamily:"var(--mono)", fontSize:11, fontWeight:600,
                          background:"rgba(59,130,246,0.15)", color:"var(--accent)",
                          border:"1px solid rgba(59,130,246,0.3)",
                          borderRadius:6, padding:"2px 7px"
                        }}>
                          {locker.unitNumber}
                        </span>
                      )}
                    </div>

                    <div className="locker-card-meta" style={{marginTop:6}}>
                      <span className="meta-chip location">📍 {locker.location}</span>
                      {fl && <span className="meta-chip">🏢 {fl}</span>}
                      <span className="meta-chip">▦ 1 predal</span>
                      <span className={`status-badge ${locker.status}`}>
                        {locker.status === "locked" ? "zaklenjen"
                          : locker.status === "unlocked" ? "odklenjen" : "neaktiven"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {locker.description && (
                  <p className="locker-desc" style={{
                    background:"rgba(255,255,255,0.03)",
                    border:"1px solid var(--border)",
                    borderRadius:8, padding:"8px 12px", margin:0
                  }}>
                    💬 {locker.description}
                  </p>
                )}

                {/* ID row */}
                <div className="locker-id-row">
                  <span className="id-label">ID paketnika</span>
                  <span className="id-val">{locker._id}</span>
                  <button
                    className="copy-btn"
                    onClick={() => copyId(locker._id)}
                    title="Kopiraj ID — deli z gostom"
                  >
                    {copiedId === locker._id ? "✓" : "⎘"}
                  </button>
                </div>

                {/* Action buttons — hosts only */}
                {isHost && (
                  <div className="locker-actions">
                    <div className="button-row">
                      {locker.status !== "unlocked" && locker.status !== "inactive" && (
                        <button className="btn btn-success btn-sm" onClick={() => unlockLocker(locker)}>
                          🔓 Odkleni
                        </button>
                      )}
                      {locker.status === "unlocked" && (
                        <button className="btn btn-secondary btn-sm" onClick={() => lockLocker(locker)}>
                          🔒 Zakleni
                        </button>
                      )}
                      {locker.status !== "inactive" && (
                        <button className="btn btn-warn btn-sm" onClick={() => setStatus(locker, "inactive")}>
                          ⏸ Neaktiven
                        </button>
                      )}
                      {locker.status === "inactive" && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setStatus(locker, "locked")}>
                          ▶ Aktiviraj
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => deleteLocker(locker)}>
                        🗑 Izbriši
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default LockerList;
