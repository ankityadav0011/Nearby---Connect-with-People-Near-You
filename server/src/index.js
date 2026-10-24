import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { uploadDir } from "./utils.js";
import { initSocket } from "./socket.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import swipeRoutes from "./routes/swipes.js";
import matchRoutes from "./routes/matches.js";
import safetyRoutes from "./routes/safety.js";

for (const key of ["MONGODB_URI", "JWT_SECRET"]) {
  if (!process.env[key]) { console.error(`Missing ${key} in server/.env`); process.exit(1); }
}

const app = express();
app.set("trust proxy", 1); // needed behind Render's proxy
const server = http.createServer(app);
const origins = (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((s) => s.trim());

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // allow images on the frontend origin
app.use(cors({ origin: origins }));
app.use(express.json({ limit: "100kb" }));
app.use("/uploads", express.static(uploadDir, { maxAge: "7d" }));

app.use("/api", rateLimit({ windowMs: 60_000, limit: 300 }));
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60_000, limit: 40 }), authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/swipes", swipeRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/safety", safetyRoutes);

app.use((err, req, res, next) => {
  const status = err.status || (err.name === "MulterError" ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status < 500 ? err.message : "Something went wrong, please try again" });
});

app.set("io", initSocket(server, origins));

await mongoose.connect(process.env.MONGODB_URI);
console.log("MongoDB connected");
server.listen(process.env.PORT || 4000, () => console.log(`API running on port ${process.env.PORT || 4000}`));
