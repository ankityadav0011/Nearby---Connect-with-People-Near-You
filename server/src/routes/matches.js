import { Router } from "express";
import mongoose from "mongoose";
import Match from "../models/Match.js";
import Message from "../models/Message.js";
import { requireAuth } from "../middleware/auth.js";
import { ah, toMsg } from "../utils.js";

const router = Router();
router.use(requireAuth);

async function myMatch(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(404).json({ error: "Match not found" }); return null; }
  const m = await Match.findOne({ _id: req.params.id, users: req.user._id }).populate("users", "name profilePhotoUrl");
  if (!m) res.status(404).json({ error: "Match not found" });
  return m;
}
const otherOf = (m, meId) => m.users.find((u) => u.id !== meId);

router.get("/", ah(async (req, res) => {
  const matches = await Match.find({ users: req.user._id })
    .sort({ lastMessageAt: -1 })
    .populate("users", "name profilePhotoUrl");
  const list = await Promise.all(matches.map(async (m) => {
    const other = otherOf(m, req.user.id);
    const last = await Message.findOne({ matchId: m._id }).sort({ createdAt: -1 });
    return {
      id: m.id,
      user: { id: other.id, name: other.name, photo: other.profilePhotoUrl },
      lastMessage: last ? { text: last.text, at: last.createdAt, mine: last.sender.equals(req.user._id) } : null,
    };
  }));
  res.json(list);
}));

router.get("/:id/messages", ah(async (req, res) => {
  const m = await myMatch(req, res); if (!m) return;
  const other = otherOf(m, req.user.id);
  const messages = await Message.find({ matchId: m._id }).sort({ createdAt: -1 }).limit(100);
  res.json({
    user: { id: other.id, name: other.name, photo: other.profilePhotoUrl },
    messages: messages.reverse().map(toMsg),
  });
}));

router.post("/:id/messages", ah(async (req, res) => {
  const m = await myMatch(req, res); if (!m) return;
  const text = String(req.body.text || "").trim();
  if (!text || text.length > 1000) return res.status(400).json({ error: "Message must be 1 to 1000 characters" });
  const msg = await Message.create({ matchId: m._id, sender: req.user._id, text });
  await Match.updateOne({ _id: m._id }, { lastMessageAt: new Date() });
  const payload = toMsg(msg);
  const io = req.app.get("io");
  m.users.forEach((u) => io.to(`user:${u.id}`).emit("message:new", payload));
  res.status(201).json(payload);
}));

// Unmatch
router.delete("/:id", ah(async (req, res) => {
  const m = await myMatch(req, res); if (!m) return;
  await Message.deleteMany({ matchId: m._id });
  await Match.deleteOne({ _id: m._id });
  req.app.get("io").to(`user:${otherOf(m, req.user.id).id}`).emit("match:removed", { matchId: m.id });
  res.json({ ok: true });
}));

export default router;
