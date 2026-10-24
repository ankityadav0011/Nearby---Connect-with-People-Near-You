import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, imgUrl } from "../api.js";
import { useAuth } from "../auth.jsx";
import { socket } from "../socket.js";

export default function Chat() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [err, setErr] = useState("");
  const endRef = useRef(null);
  const typingTimer = useRef(null);
  const lastTypingSent = useRef(0);

  const addMessage = (m) =>
    setData((d) => (d && !d.messages.some((x) => x.id === m.id) ? { ...d, messages: [...d.messages, m] } : d));

  useEffect(() => {
    api(`/matches/${id}/messages`).then(setData).catch((e) => setErr(e.message));
  }, [id]);

  useEffect(() => {
    const onMsg = (m) => { if (m.matchId === id) addMessage(m); };
    const onTyping = ({ matchId }) => {
      if (matchId !== id) return;
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 2000);
    };
    const onRemoved = ({ matchId }) => { if (matchId === id) nav("/matches"); };
    socket.on("message:new", onMsg);
    socket.on("typing", onTyping);
    socket.on("match:removed", onRemoved);
    return () => {
      socket.off("message:new", onMsg);
      socket.off("typing", onTyping);
      socket.off("match:removed", onRemoved);
    };
  }, [id]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [data?.messages.length, typing]);

  async function send(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText("");
    try { addMessage(await api(`/matches/${id}/messages`, { method: "POST", body: { text: t } })); }
    catch (e) { setErr(e.message); setText(t); }
  }

  function onType(e) {
    setText(e.target.value);
    const now = Date.now();
    if (now - lastTypingSent.current > 1500) { // don't flood the server
      lastTypingSent.current = now;
      socket.emit("typing", { matchId: id });
    }
  }

  async function unmatch() {
    if (!window.confirm(`Unmatch ${data.user.name}? The chat will be deleted.`)) return;
    try { await api(`/matches/${id}`, { method: "DELETE" }); nav("/matches"); } catch (e) { setErr(e.message); }
  }
  async function block() {
    if (!window.confirm(`Block ${data.user.name}? You won't see each other again.`)) return;
    try { await api("/safety/block", { method: "POST", body: { userId: data.user.id } }); nav("/matches"); } catch (e) { setErr(e.message); }
  }
  async function report() {
    const reason = window.prompt(`What happened with ${data.user.name}?`);
    if (!reason) return;
    try { await api("/safety/report", { method: "POST", body: { userId: data.user.id, reason } }); setErr(""); window.alert("Thanks, we'll review your report."); }
    catch (e) { setErr(e.message); }
  }

  if (!data) return <p className="center muted">{err || "Loading…"}</p>;

  return (
    <section className="chat">
      <header className="chat-head">
        <Link to="/matches" aria-label="Back to matches">‹</Link>
        <img className="avatar" src={imgUrl(data.user.photo)} alt="" />
        <strong>{data.user.name}</strong>
        <span className="spacer" />
        <button className="link" onClick={report}>Report</button>
        <button className="link" onClick={block}>Block</button>
        <button className="link" onClick={unmatch}>Unmatch</button>
      </header>

      <div className="messages">
        {data.messages.length === 0 && <p className="center muted">You matched. Say hello to {data.user.name}.</p>}
        {data.messages.map((m) => (
          <div key={m.id} className={`bubble ${m.sender === user.id ? "mine" : "theirs"}`}>{m.text}</div>
        ))}
        {typing && <div className="bubble theirs typing">typing…</div>}
        <div ref={endRef} />
      </div>

      {err && <p className="error center" role="alert">{err}</p>}
      <form className="composer" onSubmit={send}>
        <input value={text} onChange={onType} placeholder="Write a message" maxLength={1000} aria-label="Message" />
        <button className="btn" disabled={!text.trim()}>Send</button>
      </form>
    </section>
  );
}
