import { io } from "socket.io-client";

// One shared connection: counts you as "online" and delivers chat messages in real time.
// The token is re-read on every (re)connect, so logging in/out just needs a reconnect.
export const socket = io(import.meta.env.VITE_API_URL || undefined, {
  autoConnect: false,
  auth: (cb) => cb({ token: localStorage.getItem("token") }),
});
