import React, { useState } from "react";
import { apiRequest } from "../api";

function GuestPortal({ reservations, user, addToast, onChange }) {
  const [code, setCode] = useState("");
  const [lockerId, setLockerId] = useState("");
  const [unlocking, setUnlocking] = useState(null);

  // Guest sees only their reservations
  const myReservations = reservations.filter(r =>
    r.guest?._id === user.id || r.guest === user.id
  );

  const activeReservations = myReservations.filter(r => r.status === "active");

  async function unlockWithCode(e) {
    e.preventDefault();
    if (!code.trim() || !lockerId.trim()) {
      addToast("Vnesi ID paketnika in dostopno kodo", "error");
      return;
    }
    setUnlocking("code");
    try {
      await apiRequest(`/api/lockers/${lockerId}/unlock`, {
        method: "POST",
        body: JSON.stringify({
          accessCode: code
        })
      });
      addToast("🔓 Paketnik uspešno odklenjen", "success");
      setCode("");
      await onChange();
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setUnlocking(null);
    }
  }

  async function unlockReservation(reservation) {
    setUnlocking(reservation._id);
    try {
      await apiRequest(`/api/lockers/${reservation.locker._id || reservation.locker}/unlock`, {
        method: "POST",
        body: JSON.stringify({ accessCode: reservation.accessCode })
      });
      addToast(`🔓 ${reservation.locker?.name || "Paketnik"} odklenjen`, "success");
      await onChange();
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setUnlocking(null);
    }
  }

  const now = new Date();

  return (
    <div>
      {/* My ID banner */}
      <div className="guest-access-panel" style={{
        background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(6,182,212,0.06))",
        border: "1px solid rgba(59,130,246,0.3)",
        marginBottom: 24
      }}>
        <p className="eyebrow">Tvoj identifikator</p>
        <h3 style={{margin:"0 0 4px"}}>Moj gostov ID</h3>
        <p className="muted" style={{marginBottom:12}}>
          Daj ta ID hostu, da ti ustvari rezervacijo.
        </p>
        <div style={{
          background: "var(--bg)",
          border: "1px solid rgba(6,182,212,0.4)",
          borderRadius: 12,
          padding: "14px 18px",
          fontFamily: "var(--mono)",
          fontSize: 14,
          color: "var(--accent2)",
          wordBreak: "break-all",
          letterSpacing: "0.02em"
        }}>
          {user.id}
        </div>
        <button
          className="btn btn-secondary btn-sm"
          style={{marginTop:10}}
          onClick={() => {
            navigator.clipboard.writeText(user.id);
            addToast("ID kopiran!", "success");
          }}
        >
          ⎘ Kopiraj moj ID
        </button>
      </div>

      <div className="two-column">
        {/* Manual unlock */}
        <section className="panel">
          <h3>Ročno odklepanje</h3>
          <p className="panel-desc">Če imaš kodo in ID paketnika, ga lahko odklepeš ročno.</p>

          <form className="form" onSubmit={unlockWithCode} style={{marginTop:16}}>
            <label>ID paketnika</label>
            <input
              value={lockerId}
              onChange={e => setLockerId(e.target.value)}
              placeholder="Prilepi ID paketnika..."
              style={{fontFamily:"var(--mono)", fontSize:12}}
            />

            <label>Dostopna koda</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              style={{
                fontFamily: "var(--mono)",
                fontSize: 28,
                letterSpacing: "0.3em",
                textAlign: "center"
              }}
            />

            <button
              className="btn btn-primary"
              type="submit"
              disabled={unlocking === "code"}
              style={{marginTop:4, width:"100%", justifyContent:"center", padding:14}}
            >
              {unlocking === "code" ? "Odklepam..." : "🔓 Odkleni paketnik"}
            </button>
          </form>
        </section>

        {/* Active reservations quick-unlock */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Moje rezervacije</h3>
              <p className="panel-desc">{activeReservations.length} aktivnih dostopov</p>
            </div>
          </div>

          <div className="list">
            {myReservations.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">◷</div>
                <p>Nimaš rezervacij.</p>
                <p>Prosi hosta, da te doda v rezervacijo.</p>
              </div>
            )}

            {myReservations.map(res => {
              const isActive = res.status === "active";
              const isNow = isActive &&
                new Date(res.startAt) <= now && new Date(res.endAt) >= now;

              return (
                <article className="reservation-card" key={res._id} style={{
                  borderColor: isNow ? "rgba(16,185,129,0.4)" : undefined
                }}>
                  <div className="reservation-header">
                    <span className="reservation-name">
                      {res.locker?.name || "Paketnik"}
                    </span>
                    <span className={`status-badge ${
                      res.status === "active" ? (isNow ? "unlocked" : "locked") : "inactive"
                    }`}>
                      {res.status === "active"
                        ? (isNow ? "dostopen zdaj" : "aktiven")
                        : res.status === "cancelled" ? "preklican" : "zaključen"}
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
                      <span>🕐 Od:</span>
                      <strong>{formatDate(res.startAt)}</strong>
                    </div>
                    <div className="reservation-row">
                      <span>🕐 Do:</span>
                      <strong>{formatDate(res.endAt)}</strong>
                    </div>
                  </div>

                  {isActive && (
                    <div className="access-code-box">
                      <div className="code-label">
                        <span>Dostopna koda</span>
                      </div>
                      <span className="code-value">{res.accessCode}</span>
                    </div>
                  )}

                  {isNow && (
                    <button
                      className="btn btn-success"
                      onClick={() => unlockReservation(res)}
                      disabled={unlocking === res._id}
                      style={{width:"100%", justifyContent:"center", marginTop:4}}
                    >
                      {unlocking === res._id ? "Odklepam..." : "🔓 Odkleni ta paketnik"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function formatDate(v) {
  if (!v) return "";
  return new Date(v).toLocaleString("sl-SI");
}

export default GuestPortal;
