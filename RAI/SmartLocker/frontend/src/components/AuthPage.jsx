import React, { useState } from "react";
import { apiRequest } from "../api";

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "guest" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // {text, type}

  function updateField(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const data = await apiRequest("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: form.email, password: form.password })
        });
        onLogin(data.token, data.user);
      } else {
        await apiRequest("/api/auth/register", {
          method: "POST",
          body: JSON.stringify(form)
        });
        setMode("login");
        setMessage({ text: "Registracija uspešna! Prijaviš se lahko zdaj.", type: "success" });
      }
    } catch (error) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-center">
      <section className="auth-card">
        <p className="eyebrow">Airbnb Smart Locker</p>
        <h1>{mode === "login" ? "Prijava v portal" : "Nov račun"}</h1>
        <p className="muted" style={{marginBottom:24}}>
          {mode === "login"
            ? "Portal je namenjen lastnikom in gostom pametnih paketnikov."
            : "Ustvari račun za dostop do sistema."}
        </p>

        <form className="form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label>Ime in priimek</label>
              <input name="name" placeholder="Janez Novak" value={form.name} onChange={updateField} required maxLength={80} />
            </>
          )}

          <label>Email naslov</label>
          <input name="email" type="email" placeholder="janez@example.com" value={form.email} onChange={updateField} required maxLength={120} />

          <label>Geslo</label>
          <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={updateField} required minLength={6} maxLength={72} />

          {mode === "register" && (
            <>
              <label>Vloga v sistemu</label>
              <select name="role" value={form.role} onChange={updateField}>
                <option value="guest">👤 Gost — za odklepanje paketnikov</option>
                <option value="host">🏠 Host — za upravljanje paketnikov</option>
              </select>
            </>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{marginTop:8, width:"100%", justifyContent:"center", padding:"12px"}}
          >
            {loading
              ? "Prosim počakaj..."
              : mode === "login" ? "Prijava" : "Registracija"}
          </button>
        </form>

        {message && (
          <div className={`alert alert-${message.type}`} style={{marginTop:16}}>
            {message.text}
          </div>
        )}

        <button
          className="btn btn-ghost"
          onClick={() => { setMode(m => m === "login" ? "register" : "login"); setMessage(null); }}
          style={{marginTop:16, width:"100%", justifyContent:"center", color:"var(--muted)"}}
        >
          {mode === "login" ? "Nimaš računa? Registriraj se →" : "← Nazaj na prijavo"}
        </button>
      </section>
    </main>
  );
}

export default AuthPage;
