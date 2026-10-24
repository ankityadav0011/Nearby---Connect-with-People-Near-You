import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, imgUrl, shareLocation } from "../api.js";
import { useAuth } from "../auth.jsx";

export default function Profile() {
  const { user, refresh, logout } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    name: user.name || "",
    dob: user.dob ? user.dob.slice(0, 10) : "",
    bio: user.bio || "",
    phone: user.phone || "",
    gender: user.gender || "",
    lookingFor: user.lookingFor || [],
  });
  const [blocked, setBlocked] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleLooking = (g) =>
    setF({ ...f, lookingFor: f.lookingFor.includes(g) ? f.lookingFor.filter((x) => x !== g) : [...f.lookingFor, g] });

  async function finishIfDone() {
    const u = await refresh();
    if (!user.onboarded && u.onboarded) nav("/");
    return u;
  }

  async function save(e) {
    e.preventDefault(); setErr(""); setMsg("");
    if (!f.lookingFor.length) return setErr("Choose who you'd like to meet");
    try {
      await api("/users/me", { method: "PUT", body: f });
      await finishIfDone();
      setMsg("Saved");
    } catch (e) { setErr(e.message); }
  }

  async function uploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setErr(""); setMsg("Uploading photo…");
    try {
      const form = new FormData();
      form.append("photo", file);
      await api("/users/me/photo", { method: "POST", form });
      await finishIfDone();
      setMsg("Photo updated");
    } catch (e) { setErr(e.message); setMsg(""); }
  }

  async function enableLocation() {
    setErr(""); setMsg("");
    try { await shareLocation(); await finishIfDone(); setMsg("Location saved"); }
    catch (e) { setErr(e.message); }
  }

  async function deleteAccount() {
    if (!window.confirm("Delete your account and all your matches and messages? This can't be undone.")) return;
    try { await api("/users/me", { method: "DELETE" }); logout(); }
    catch (e) { setErr(e.message); }
  }

  useEffect(() => { api("/safety/blocks").then(setBlocked).catch(() => {}); }, []);

  async function unblock(b) {
    try {
      await api(`/safety/block/${b.id}`, { method: "DELETE" });
      setBlocked((list) => list.filter((x) => x.id !== b.id));
      setMsg(`${b.name} is unblocked`);
    } catch (e) { setErr(e.message); }
  }

  const missing = [!user.profilePhotoUrl && "a photo", !user.dob && "your date of birth", !user.gender && "your gender", !user.lookingFor?.length && "who you'd like to meet", !user.hasLocation && "your location"].filter(Boolean);

  return (
    <section className="panel">
      <h1>{user.onboarded ? "Your profile" : "Finish your profile"}</h1>
      {!user.onboarded && missing.length > 0 && <p className="muted">Still needed: {missing.join(", ")}.</p>}

      <div className="photo-row">
        {user.profilePhotoUrl
          ? <img className="avatar big" src={imgUrl(user.profilePhotoUrl)} alt="Your profile" />
          : <div className="avatar big empty">No photo</div>}
        <label className="btn ghost">
          {user.profilePhotoUrl ? "Change photo" : "Add photo"}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} hidden />
        </label>
        <p className="tiny muted">This is the only photo people see on your card. Use a clear photo of your face.</p>
      </div>

      <div className="loc">
        <button className="btn ghost" onClick={enableLocation}>
          {user.hasLocation ? "Update my location" : "Share my location"}
        </button>
        <p className="tiny muted">Others only see roughly how many km away you are, never where you are.</p>
      </div>

      <form onSubmit={save} className="form">
        <label>Name<input value={f.name} onChange={set("name")} required maxLength={60} /></label>
        <label>Date of birth<input type="date" value={f.dob} onChange={set("dob")} required /></label>
        <label>I am
          <select value={f.gender} onChange={set("gender")} required>
            <option value="">Select</option>
            <option value="man">Man</option>
            <option value="woman">Woman</option>
            <option value="nonbinary">Non-binary</option>
          </select>
        </label>
        <fieldset className="choices">
          <legend>Show me</legend>
          {[["man", "Men"], ["woman", "Women"], ["nonbinary", "Non-binary people"]].map(([v, l]) => (
            <label key={v} className="check">
              <input type="checkbox" checked={f.lookingFor.includes(v)} onChange={() => toggleLooking(v)} />
              <span>{l}</span>
            </label>
          ))}
        </fieldset>
        <label>About you<textarea value={f.bio} onChange={set("bio")} maxLength={300} rows={3} placeholder="A line or two about you" /></label>
        <label>Phone number (optional)<input type="tel" value={f.phone} onChange={set("phone")} /></label>
        {err && <p className="error" role="alert">{err}</p>}
        {msg && <p className="ok">{msg}</p>}
        <button className="btn">Save changes</button>
      </form>

      <h2>Blocked people</h2>
      {blocked.length === 0 ? (
        <p className="muted tiny">You haven't blocked anyone.</p>
      ) : (
        <ul className="list">
          {blocked.map((b) => (
            <li key={b.id} className="row">
              <img className="avatar" src={imgUrl(b.photo)} alt="" />
              <strong>{b.name}</strong>
              <span className="spacer" />
              <button className="btn ghost" onClick={() => unblock(b)}>Unblock</button>
            </li>
          ))}
        </ul>
      )}

      <button className="link danger" onClick={deleteAccount}>Delete my account</button>
    </section>
  );
}
