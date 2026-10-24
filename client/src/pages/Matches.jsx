import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, imgUrl } from "../api.js";
import { socket } from "../socket.js";

export default function Matches() {
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");

  const load = () => api("/matches").then(setList).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
    socket.on("match:new", load);
    socket.on("match:removed", load);
    socket.on("message:new", load);
    return () => {
      socket.off("match:new", load);
      socket.off("match:removed", load);
      socket.off("message:new", load);
    };
  }, []);

  if (err) return <p className="error center">{err}</p>;
  if (!list) return <p className="center muted">Loading…</p>;
  if (!list.length)
    return (
      <section className="panel narrow center">
        <h1>No matches yet</h1>
        <p className="muted">When you and someone else both tick each other, they show up here.</p>
        <Link className="btn" to="/">Start swiping</Link>
      </section>
    );

  return (
    <section className="panel">
      <h1>Matches</h1>
      <ul className="list">
        {list.map((m) => (
          <li key={m.id}>
            <Link to={`/chat/${m.id}`}>
              <img className="avatar" src={imgUrl(m.user.photo)} alt="" />
              <span>
                <strong>{m.user.name}</strong>
                <small className="muted">
                  {m.lastMessage ? `${m.lastMessage.mine ? "You: " : ""}${m.lastMessage.text}` : "Say hello"}
                </small>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
