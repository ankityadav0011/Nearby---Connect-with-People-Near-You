import { useEffect, useState } from "react";
import { socket } from "../socket.js";

// Testing version: always shows the real number of open connections.
// Later you can hide it below a threshold, e.g. `if (count < 10) return null;`
export default function OnlineCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    socket.on("online-count", setCount);
    return () => socket.off("online-count", setCount);
  }, []);

  if (count === null) return null;
  return (
    <span className="online" title="People on the site right now">
      <i className="dot" /> {count} online
    </span>
  );
}
