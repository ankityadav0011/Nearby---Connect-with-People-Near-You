import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Match from "./models/Match.js";

export function initSocket(server, origins) {
  const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://nearby-connect-with-people-near-you-1.onrender.com",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

  // Logged-out visitors may connect too (so they are counted as "online"); logged-in ones get a private room
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try { socket.userId = jwt.verify(token, process.env.JWT_SECRET).id; } catch { /* treat as visitor */ }
    }
    next();
  });

  let online = 0; // testing version: counts connections (one per open tab)

  io.on("connection", (socket) => {
    online++;
    if (socket.userId) socket.join(`user:${socket.userId}`);
    io.emit("online-count", online);

    socket.on("typing", async ({ matchId } = {}) => {
      if (!socket.userId) return;
      try {
        const m = await Match.findOne({ _id: matchId, users: socket.userId });
        if (!m) return;
        const other = m.users.find((u) => String(u) !== socket.userId);
        io.to(`user:${other}`).emit("typing", { matchId });
      } catch { /* ignore bad ids */ }
    });

    socket.on("disconnect", () => {
      online--;
      io.emit("online-count", online);
    });
  });

  return io;
}
