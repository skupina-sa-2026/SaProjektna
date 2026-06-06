import React from "react";

function Dashboard({ lockers, reservations, logs, user }) {
  const successfulLogs = logs.filter(l => l.result === "success").length;
  const deniedLogs    = logs.filter(l => l.result === "denied").length;
  const activeRes     = reservations.filter(r => r.status === "active").length;
  const myLockers     = user.role === "host"
    ? lockers.filter(l => l.owner?._id === user.id || l.owner === user.id)
    : lockers;

  // Recent 5 logs
  const recentLogs = [...logs].slice(0, 5);

  // Active reservations
  const activeReservations = reservations.filter(r => r.status === "active").slice(0, 4);

  return (
    <div>
      {/* Stat cards */}
      <div className="stat-grid">
        <article className="stat-card accent">
          <p className="stat-label">Paketniki</p>
          <strong className="stat-value">{myLockers.length}</strong>
          <p className="stat-desc">{user.role === "host" ? "Tvoji paketniki" : "Dostopnih paketnikov"}</p>
        </article>

        <article className="stat-card warn">
          <p className="stat-label">Aktivne rezervacije</p>
          <strong className="stat-value">{activeRes}</strong>
          <p className="stat-desc">Trenutno aktiven dostop</p>
        </article>

        <article className="stat-card success">
          <p className="stat-label">Uspešni dostopi</p>
          <strong className="stat-value">{successfulLogs}</strong>
          <p className="stat-desc">Skupaj vsi uspehi</p>
        </article>

        <article className="stat-card danger">
          <p className="stat-label">Zavrnjeni dostopi</p>
          <strong className="stat-value">{deniedLogs}</strong>
          <p className="stat-desc">Neuspeli poskusi</p>
        </article>
      </div>

      <div className="two-column" style={{marginTop: 0}}>
        {/* Recent activity */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Nedavna aktivnost</h3>
              <p className="panel-desc">Zadnjih 5 vnosov v dnevnik</p>
            </div>
          </div>
          <div className="list">
            {recentLogs.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">◫</div>
                <p>Dnevnik je prazen</p>
              </div>
            )}
            {recentLogs.map(log => (
              <div key={log._id} className={`log-item ${log.result}`}>
                <div className="log-main">
                  <span className={`log-action ${log.result === "denied" ? "denied" : log.action}`}>
                    {log.action.toUpperCase()}
                  </span>
                  <span className="log-message">{log.locker?.name || "Paketnik"}</span>
                  <span className="log-message">{formatDate(log.createdAt)}</span>
                </div>
                <span className={`result-badge ${log.result}`}>{log.result}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active reservations */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Aktivne rezervacije</h3>
              <p className="panel-desc">Rezervacije s trenutnim dostopom</p>
            </div>
          </div>
          <div className="list">
            {activeReservations.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">◷</div>
                <p>Ni aktivnih rezervacij</p>
              </div>
            )}
            {activeReservations.map(res => (
              <div key={res._id} className="reservation-card">
                <div className="reservation-header">
                  <span className="reservation-name">{res.locker?.name || "Paketnik"}</span>
                  <span className="status-badge unlocked">aktiven</span>
                </div>
                <div className="reservation-row">
                  <span>Gost:</span>
                  <strong>{res.guest?.name || "Gost"}</strong>
                </div>
                <div className="reservation-row">
                  <span>Koda:</span>
                  <strong style={{fontFamily:"var(--mono)", color:"var(--accent)", letterSpacing:"0.15em"}}>{res.accessCode}</strong>
                </div>
                <div className="reservation-row">
                  <span>Do:</span>
                  <strong>{formatDate(res.endAt)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(v) {
  if (!v) return "";
  return new Date(v).toLocaleString("sl-SI");
}

export default Dashboard;
