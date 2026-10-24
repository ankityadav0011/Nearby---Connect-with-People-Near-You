import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";

const HAS_GOOGLE = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "", dob: "", phone: "", agree: false });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function finish(path, body) {
    setBusy(true); setErr("");
    try {
      const r = await api(path, { method: "POST", body });
      login(r.token, r.user);
      nav("/");
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  function submit(e) {
    e.preventDefault();
    if (mode === "login") return finish("/auth/login", { email: f.email, password: f.password });
    if (!f.agree) return setErr("Confirm that you are 18 or older and accept the Terms and Privacy Policy.");
    finish("/auth/register", {
      name: f.name, email: f.email, password: f.password, dob: f.dob, phone: f.phone || undefined,
    });
  }

  return (
    <section className="panel narrow">
      <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="muted">See who's near you, swipe, and chat when you both say yes.</p>

      {HAS_GOOGLE && (
        <div className="google">
          <GoogleLogin
            onSuccess={(c) => finish("/auth/google", { credential: c.credential })}
            onError={() => setErr("Google sign-in failed. Try again or use email.")}
            width="320"
          />
          <p className="muted tiny">or use email</p>
        </div>
      )}

      <form onSubmit={submit} className="form">
        {mode === "register" && (
          <label>Name<input value={f.name} onChange={set("name")} required maxLength={60} /></label>
        )}
        <label>Email<input type="email" value={f.email} onChange={set("email")} required autoComplete="email" /></label>
        <label>Password<input type="password" value={f.password} onChange={set("password")} required minLength={mode === "register" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
        {mode === "register" && (
          <>
            <label>Date of birth<input type="date" value={f.dob} onChange={set("dob")} required /></label>
            <label>Phone number (optional)<input type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" /></label>
            <label className="check">
              <input type="checkbox" checked={f.agree} onChange={set("agree")} />
              <span>I'm 18 or older and I accept the Terms and Privacy Policy.</span>
            </label>
          </>
        )}
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
      </form>

      <button className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}>
        {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
      </button>
    </section>
  );
}
