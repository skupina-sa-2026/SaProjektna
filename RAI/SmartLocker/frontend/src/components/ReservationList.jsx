import React, { useState, useEffect } from "react";
import { apiRequest } from "../api";

function ReservationList({ lockers, reservations, onChange, addToast, user }) {
  const [form, setForm] = useState({
    lockerId: "", guestId: "", startAt: "", endAt: ""
  });
  const [saving, setSaving] = useState(false);
  const [guests, setGuests] = useState([]);
  const [guestQuery, setGuestQuery] = useState("");
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [guestError, setGuestError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [copiedCode, setCopiedCode] = useState(null);
  const [showOrphaned, setShowOrphaned] = useState(false);

  const isHost = user?.role === "host";

  useEffect(() => {
    if (isHost) {
      setLoadingGuests(true);
      setGuestError("");
      apiRequest("/api/users").then(users => {
        setGuests(users.filter(u => u.role === "guest"));
      }).catch(error => {
        setGuestError(error.message || "Gostov ni bilo mogoče naložiti");
      }).finally(() => {
        setLoadingGuests(false);
      });
    }
  }, [isHost]);

  function updateField(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function createReservation(e) {
    e.preventDefault();
    if (!form.lockerId || !form.guestId || !form.startAt || !form.endAt) {
      addToast("Izpolni vsa polja", "error");
      return;
    }
    if (new Date(form.endAt) <= new Date(form.startAt)) {
      addToast("Konec mora biti po začetku", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await apiRequest("/api/reservations", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString()
        })
      });
      setForm({ lockerId: "", guestId: "", startAt: "", endAt: "" });
      setGuestQuery("");
      await onChange();
      addToast(`Rezervacija ustvarjena — koda: ${res.reservation?.accessCode}`, "success");
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function cancelReservation(res) {
    if (!confirm("Prekliči to rezervacijo?")) return;
    try {
      await apiRequest(`/api/reservations/${res._id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "cancelled" })
      });
      await onChange();
      addToast("Rezervacija preklicana", "info");
    } catch (error) {
      addToast(error.message, "error");
    }
  }

  async function deleteReservation(res) {
    if (!confirm("Trajno izbriši to rezervacijo?")) return;
    try {
      await apiRequest(`/api/reservations/${res._id}`, { method: "DELETE" });
      await onChange();
      addToast("Rezervacija izbrisana", "info");
    } catch (error) {
      addToast(error.message, "error");
    }
  }

  async function deleteAllOrphaned() {
    if (!confirm(`Izbriši vse rezervacije brez paketnika?`)) return;
    const orphaned = reservations.filter(r => !r.locker);
    let deleted = 0;
    for (const r of orphaned) {
      try {
        await apiRequest(`/api/reservations/${r._id}`, { method: "DELETE" });
        deleted++;
      } catch {}
    }
    await onChange();
    addToast(`Izbrisano ${deleted} osirotenih rezervacij`, "info");
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      addToast("Koda kopirana", "success");
      setTimeout(() => setCopiedCode(null), 2000);
    });
  }

  const myLockers = lockers.filter(l =>
    l.owner?._id === user.id || l.owner === user.id
  );

  // Split: orphaned (locker deleted) vs normal
  const orphaned = reservations.filter(r => !r.locker);
  const normal = reservations.filter(r => !!r.locker);

  const filtered = normal.filter(r =>
    filterStatus === "all" ? true : r.status === filterStatus
  );

  const statusLabel = { active: "aktiven", cancelled: "preklican", finished: "zaključen" };
  const normalizedGuestQuery = guestQuery.trim().toLowerCase();
  const visibleGuests = guests.filter(g => {
    if (!normalizedGuestQuery) return true;
    return `${g.name} ${g.email}`.toLowerCase().includes(normalizedGuestQuery);
  });
  const selectedGuest = guests.find(g => g._id === form.guestId);
  const selectGuests = selectedGuest && !visibleGuests.some(g => g._id === selectedGuest._id)
    ? [selectedGuest, ...visibleGuests]
    : visibleGuests;

  return (
    <div className="two-column">
      {/* Create form — hosts only */}
      {isHost && (
        <section className="panel">
          <h3>Nova rezervacija</h3>
          <p className="panel-desc" style={{marginBottom:16}}>
            Dodeli gostu dostop do paketnika za določen čas.
          </p>

          <form className="form" onSubmit={createReservation}>
            <label>Paketnik</label>
            <select name="lockerId" value={form.lockerId} onChange={updateField} required>
              <option value="">Izberi paketnik</option>
              {myLockers.map(l => (
                <option key={l._id} value={l._id}>
                  {l.name}
                  {l.unitNumber ? ` [${l.unitNumber}]` : ""}
                  {" — "}{l.location}
                  {l.floor !== null && l.floor !== undefined ? `, ${l.floor === 0 ? "pritličje" : l.floor + ". nad."}` : ""}
                </option>
              ))}
            </select>

            {/* Selected locker preview */}
            {form.lockerId && (() => {
              const sel = myLockers.find(l => l._id === form.lockerId);
              if (!sel) return null;
              return (
                <div style={{
                  background:"var(--bg)", border:"1px solid rgba(59,130,246,0.3)",
                  borderRadius:10, padding:"10px 14px", display:"grid", gap:4
                }}>
                  <span style={{fontSize:11, fontFamily:"var(--mono)", color:"var(--muted)"}}>Izbrani paketnik</span>
                  <span style={{fontWeight:700, fontSize:13}}>{sel.name}</span>
                  <span style={{fontSize:12, color:"var(--muted)"}}>
                    📍 {sel.location}
                    {sel.floor !== null && sel.floor !== undefined && ` · 🏢 ${sel.floor === 0 ? "pritličje" : sel.floor + ". nad."}`}
                    {sel.unitNumber && ` · enota ${sel.unitNumber}`}
                  </span>
                  {sel.description && (
                    <span style={{fontSize:11, color:"var(--muted)", fontStyle:"italic", marginTop:2}}>
                      💬 {sel.description}
                    </span>
                  )}
                </div>
              );
            })()}

            <label>Gost</label>
            {loadingGuests ? (
              <div className="inline-note">Nalagam goste...</div>
            ) : guestError ? (
              <div className="inline-note danger">{guestError}</div>
            ) : guests.length > 0 ? (
              <div className="guest-picker">
                <input
                  value={guestQuery}
                  onChange={e => setGuestQuery(e.target.value)}
                  placeholder="Poišči gosta po imenu ali emailu"
                  maxLength={120}
                />
                <select name="guestId" value={form.guestId} onChange={updateField} required>
                  <option value="">Izberi gosta</option>
                  {selectGuests.map(g => (
                    <option key={g._id} value={g._id}>{g.name} ({g.email})</option>
                  ))}
                </select>
                {selectedGuest && (
                  <div className="selected-pill">
                    <span>{selectedGuest.name}</span>
                    <small>{selectedGuest.email}</small>
                  </div>
                )}
                {visibleGuests.length === 0 && (
                  <div className="inline-note">Ni zadetkov za ta vnos.</div>
                )}
              </div>
            ) : (
              <div className="inline-note">Ni še registriranih gostov za izbiro.</div>
            )}

            <label>Začetek dostopa</label>
            <input name="startAt" type="datetime-local" value={form.startAt} onChange={updateField} required />

            <label>Konec dostopa</label>
            <input name="endAt" type="datetime-local" value={form.endAt} onChange={updateField} required />

            <button className="btn btn-primary" type="submit" disabled={saving} style={{marginTop:4}}>
              {saving ? "Ustvarjanje..." : "+ Ustvari rezervacijo"}
            </button>
          </form>
        </section>
      )}

      {/* List */}
      <section className="panel" style={!isHost ? {gridColumn:"1/-1"} : {}}>
        <div className="panel-header">
          <div>
            <h3>Rezervacije</h3>
            <p className="panel-desc">{filtered.length} rezervacij</p>
          </div>
          <div className="filter-bar">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Vse</option>
              <option value="active">Aktivne</option>
              <option value="cancelled">Preklicane</option>
              <option value="finished">Zaključene</option>
            </select>
          </div>
        </div>

        {/* Orphaned reservations warning */}
        {isHost && orphaned.length > 0 && (
          <div style={{
            background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)",
            borderRadius:12, padding:"12px 16px", marginBottom:16,
            display:"flex", alignItems:"flex-start", gap:10
          }}>
            <span style={{fontSize:18}}>⚠️</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:700, fontSize:13, color:"var(--warn)", marginBottom:4}}>
                {orphaned.length} rezervacij brez paketnika
              </div>
              <div style={{fontSize:12, color:"var(--muted)", marginBottom:8}}>
                Paketnik za te rezervacije je bil izbrisan. Rezervacije niso več funkcionalne.
              </div>
              <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                <button
                  className="btn btn-warn btn-sm"
                  onClick={() => setShowOrphaned(v => !v)}
                >
                  {showOrphaned ? "Skrij" : "Prikaži"} ({orphaned.length})
                </button>
                {isHost && (
                  <button className="btn btn-danger btn-sm" onClick={deleteAllOrphaned}>
                    🗑 Izbriši vse osirotene
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Orphaned list */}
        {showOrphaned && orphaned.map(res => (
          <article key={res._id} style={{
            background:"rgba(245,158,11,0.05)", border:"1px dashed rgba(245,158,11,0.3)",
            borderRadius:12, padding:"14px 16px", marginBottom:10,
            display:"grid", gap:6
          }}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <span style={{fontWeight:700, fontSize:13, color:"var(--warn)"}}>
                ⚠️ Paketnik izbrisan
              </span>
              <span className={`status-badge ${res.status === "active" ? "unlocked" : "inactive"}`}>
                {statusLabel[res.status]}
              </span>
            </div>
            <div style={{fontSize:12, color:"var(--muted)"}}>
              Gost: <strong style={{color:"var(--text)"}}>{res.guest?.name || "—"}</strong>
            </div>
            <div style={{fontSize:12, color:"var(--muted)"}}>
              {formatDate(res.startAt)} – {formatDate(res.endAt)}
            </div>
            {isHost && (
              <button className="btn btn-danger btn-sm" style={{width:"fit-content"}}
                onClick={() => deleteReservation(res)}>
                🗑 Izbriši
              </button>
            )}
          </article>
        ))}

        <div className="list">
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">◷</div>
              <p>Ni rezervacij v tej kategoriji.</p>
            </div>
          )}

          {filtered.map(res => (
            <article className="reservation-card" key={res._id}>
              <div className="reservation-header">
                <span className="reservation-name">
                  {res.locker?.name || "Paketnik"}
                  {res.locker?.unitNumber && (
                    <span style={{
                      fontFamily:"var(--mono)", fontSize:10, fontWeight:600,
                      background:"rgba(59,130,246,0.15)", color:"var(--accent)",
                      borderRadius:5, padding:"1px 6px", marginLeft:6
                    }}>
                      {res.locker.unitNumber}
                    </span>
                  )}
                </span>
                <span className={`status-badge ${
                  res.status === "active" ? "unlocked"
                  : res.status === "cancelled" ? "inactive" : "locked"
                }`}>
                  {statusLabel[res.status] || res.status}
                </span>
              </div>

              <div className="reservation-meta">
                {res.locker?.location && (
                  <div className="reservation-row">
                    <span>📍</span>
                    <span>{res.locker.location}</span>
                  </div>
                )}
                <div className="reservation-row">
                  <span>👤 Gost:</span>
                  <strong>{res.guest?.name || res.guest}</strong>
                </div>
                {isHost && res.guest?.email && (
                  <div className="reservation-row">
                    <span>✉️</span>
                    <strong>{res.guest.email}</strong>
                  </div>
                )}
                <div className="reservation-row">
                  <span>🕐 Od:</span>
                  <strong>{formatDate(res.startAt)}</strong>
                </div>
                <div className="reservation-row">
                  <span>🕐 Do:</span>
                  <strong>{formatDate(res.endAt)}</strong>
                </div>
              </div>

              {/* Access code box */}
              {res.status === "active" && (
                <div className="access-code-box">
                  <div className="code-label">
                    <span>Dostopna koda</span>
                    <span style={{fontSize:10, opacity:0.7}}>Deli z gostom</span>
                  </div>
                  <span className="code-value">{res.accessCode}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => copyCode(res.accessCode)}
                    title="Kopiraj kodo"
                  >
                    {copiedCode === res.accessCode ? "✓" : "⎘"}
                  </button>
                </div>
              )}

              {isHost && res.status === "active" && (
                <div className="button-row">
                  <button className="btn btn-danger btn-sm" onClick={() => cancelReservation(res)}>
                    Prekliči
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatDate(v) {
  if (!v) return "";
  return new Date(v).toLocaleString("sl-SI");
}

export default ReservationList;
