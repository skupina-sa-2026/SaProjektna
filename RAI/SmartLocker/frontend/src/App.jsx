import React, { useEffect, useState, useCallback } from "react";
import { apiRequest } from "./api";
import { saveAuth, getSavedUser, clearAuth } from "./authStorage";
import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";
import LockerList from "./components/LockerList";
import ReservationList from "./components/ReservationList";
import AccessLogList from "./components/AccessLogList";
import GuestPortal from "./components/GuestPortal";
import Toast from "./components/Toast";

function App() {
  const [user, setUser] = useState(getSavedUser());
  const [activePage, setActivePage] = useState("dashboard");
  const [lockers, setLockers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [copiedId, setCopiedId] = useState(false);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [lockerData, logData] = await Promise.all([
        apiRequest("/api/lockers"),
        apiRequest("/api/logs")
      ]);
      setLockers(lockerData);
      setLogs(logData);
      try {
        const reservationData = await apiRequest("/api/reservations");
        setReservations(reservationData);
      } catch {
        setReservations([]);
      }
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => { loadData(); }, [user]);

  function handleLogin(token, loggedUser) {
    saveAuth(token, loggedUser);
    setUser(loggedUser);
    setActivePage("dashboard");
  }

  function logout() {
    clearAuth();
    setUser(null);
    setLockers([]);
    setReservations([]);
    setLogs([]);
  }

  function copyUserId() {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id).then(() => {
      setCopiedId(true);
      addToast("ID kopiran v odložišče", "success");
      setTimeout(() => setCopiedId(false), 2000);
    });
  }

  if (!user) return <AuthPage onLogin={handleLogin} />;

  const navItems = [
    { id: "dashboard", label: "Pregled", icon: "◈" },
    { id: "lockers", label: "Paketniki", icon: "⬡" },
    { id: "reservations", label: "Rezervacije", icon: "◷" },
    { id: "logs", label: "Dnevnik", icon: "◫" },
    ...(user.role === "guest" ? [{ id: "guest", label: "Moj dostop", icon: "◉" }] : [])
  ];

  const pageTitles = {
    dashboard: "Pregled sistema",
    lockers: "Upravljanje paketnikov",
    reservations: "Rezervacije",
    logs: "Dnevnik odklepov",
    guest: "Moj dostop"
  };

  return (
    <main className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <p className="eyebrow">Smart Locker</p>
          <h1>Airbnb 🔐</h1>
        </div>

        <nav className="nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="user-box">
          <div className="user-info">
            <strong>{user.name}</strong>
            <span className="user-email">{user.email}</span>
            <span className={`role-badge ${user.role}`}>
              {user.role === "host" ? "🏠 Host" : "👤 Gost"}
            </span>
          </div>

          {/* User ID display */}
          <div className="user-id-display">
            <div className="id-label">Moj ID</div>
            <div className="id-value">{user.id}</div>
          </div>
          <button className="copy-id-btn" onClick={copyUserId}>
            {copiedId ? "✓ Kopirano!" : "⎘ Kopiraj moj ID"}
          </button>

          <button className="logout-btn" onClick={logout}>Odjava</button>
        </div>
      </aside>

      {/* Main content */}
      <section className="content">
        <div className="content-header">
          <div>
            <p className="eyebrow">Portal</p>
            <h2>{pageTitles[activePage]}</h2>
          </div>
          <button className="btn btn-secondary" onClick={loadData}>
            ↺ Osveži
          </button>
        </div>

        {loading && <div className="loading-bar" />}

        {activePage === "dashboard" && (
          <Dashboard lockers={lockers} reservations={reservations} logs={logs} user={user} />
        )}
        {activePage === "lockers" && (
          <LockerList lockers={lockers} onChange={loadData} addToast={addToast} user={user} />
        )}
        {activePage === "reservations" && (
          <ReservationList lockers={lockers} reservations={reservations} onChange={loadData} addToast={addToast} user={user} />
        )}
        {activePage === "logs" && (
          <AccessLogList logs={logs} lockers={lockers} />
        )}
        {activePage === "guest" && user.role === "guest" && (
          <GuestPortal reservations={reservations} user={user} addToast={addToast} onChange={loadData} />
        )}
      </section>

      {/* Toasts */}
      <Toast toasts={toasts} />
    </main>
  );
}

export default App;
