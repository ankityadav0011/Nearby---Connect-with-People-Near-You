import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { api, imgUrl, shareLocation } from "../api.js";
import { useAuth } from "../auth.jsx";
import SwipeCard from "../components/SwipeCard.jsx";

export default function Discover() {
  const { user } = useAuth();
  const [deck, setDeck] = useState([]);
  const [dir, setDir] = useState("like");
  const [filters, setFilters] = useState({ maxKm: 25, minAge: 18, maxAge: 60 });
  const [locOk, setLocOk] = useState(false);
  const [locError, setLocError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [match, setMatch] = useState(null);
  const [error, setError] = useState("");
  const deckRef = useRef([]);
  deckRef.current = deck;

  // Refresh location every time the screen opens; fall back to the last saved one
  async function startLocation() {
    setLocError("");
    try { await shareLocation(); setLocOk(true); }
    catch (e) {
      if (user.hasLocation) setLocOk(true); // use last known location
      else setLocError(e.message);
    }
  }
  useEffect(() => { startLocation(); }, []);

  const load = useCallback(async (reset) => {
    setLoading(true); setError("");
    try {
      const q = new URLSearchParams(filters).toString();
      const list = await api(`/users/deck?${q}`);
      list.forEach((c) => { const i = new Image(); i.src = imgUrl(c.photo); }); // preload photos
      if (reset) { setDeck(list); setHasMore(list.length > 0); }
      else {
        const have = new Set(deckRef.current.map((c) => c.id));
        const fresh = list.filter((c) => !have.has(c.id));
        setDeck((d) => [...d, ...fresh]);
        setHasMore(fresh.length > 0);
      }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { if (locOk) load(true); }, [locOk, load]);
  useEffect(() => {
    if (locOk && !loading && hasMore && deck.length > 0 && deck.length <= 3) load(false);
  }, [deck.length]);

  async function swipe(direction) {
    const card = deckRef.current[0];
    if (!card) return;
    setDir(direction);
    setDeck((d) => d.slice(1));
    try {
      const r = await api("/swipes", { method: "POST", body: { to: card.id, direction } });
      if (r.matched) setMatch(r);
    } catch (e) { setError(e.message); }
  }

  useEffect(() => {
    const onKey = (e) => {
      if (match || ["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "ArrowRight") swipe("like");
      if (e.key === "ArrowLeft") swipe("pass");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [match]);

  async function safety(kind) {
    const card = deck[0];
    if (!card) return;
    let body = { userId: card.id };
    if (kind === "report") {
      const reason = window.prompt(`What's wrong with ${card.name}'s profile?`);
      if (!reason) return;
      body.reason = reason;
    } else if (!window.confirm(`Block ${card.name}? You won't see each other again.`)) return;
    try {
      await api(`/safety/${kind}`, { method: "POST", body });
      setDir("pass");
      setDeck((d) => d.slice(1));
    } catch (e) { setError(e.message); }
  }

  const setF = (k) => (e) => setFilters({ ...filters, [k]: Number(e.target.value) });
  const top = deck[0];

  if (locError) {
    return (
      <section className="panel narrow center">
        <h1>Turn on location</h1>
        <p className="muted">{locError}</p>
        <button className="btn" onClick={startLocation}>Try again</button>
      </section>
    );
  }

  return (
    <section className="discover">
      <div className="filters">
        <label>Within
          <select value={filters.maxKm} onChange={setF("maxKm")}>
            {[5, 10, 25, 50, 100].map((k) => <option key={k} value={k}>{k} km</option>)}
          </select>
        </label>
        <label>Age
          <span className="age">
            <select value={filters.minAge} onChange={setF("minAge")} aria-label="Minimum age">
              {Array.from({ length: 43 }, (_, i) => 18 + i).map((a) => <option key={a}>{a}</option>)}
            </select>
            to
            <select value={filters.maxAge} onChange={setF("maxAge")} aria-label="Maximum age">
              {Array.from({ length: 82 }, (_, i) => 18 + i).map((a) => <option key={a}>{a}</option>)}
            </select>
          </span>
        </label>
      </div>

      <div className="stack">
        <AnimatePresence custom={dir} initial={false}>
          {top && <SwipeCard key={top.id} card={top} dir={dir} onSwipe={swipe} />}
        </AnimatePresence>
        {!top && (
          <div className="empty">
            {loading ? <p className="muted">Finding people near you…</p> : (
              <>
                <h2>No one new nearby</h2>
                <p className="muted">Try a bigger distance or a wider age range, or check back later.</p>
                <button className="btn ghost" onClick={() => load(true)}>Refresh</button>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="error center" role="alert">{error}</p>}

      <div className="actions">
        <button className="round pass" onClick={() => swipe("pass")} disabled={!top} aria-label="Pass">✕</button>
        <button className="round like" onClick={() => swipe("like")} disabled={!top} aria-label="Like">✓</button>
      </div>
      {top && (
        <p className="center tiny">
          <button className="link" onClick={() => safety("report")}>Report</button>
          <button className="link" onClick={() => safety("block")}>Block</button>
        </p>
      )}

      {match && (
        <div className="overlay">
          <div className="modal center">
            <img className="avatar big" src={imgUrl(match.user.photo)} alt="" />
            <h2>It's a match!</h2>
            <p className="muted">You and {match.user.name} liked each other.</p>
            <Link className="btn" to={`/chat/${match.matchId}`}>Send a message</Link>
            <button className="btn ghost" onClick={() => setMatch(null)}>Keep swiping</button>
          </div>
        </div>
      )}
    </section>
  );
}
