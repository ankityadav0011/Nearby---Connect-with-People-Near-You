import { Router } from "express";
import mongoose from "mongoose";
import Block from "../models/Block.js";
import Report from "../models/Report.js";
import Match from "../models/Match.js";
import Swipe from "../models/Swipe.js";
import Message from "../models/Message.js";
import { requireAuth } from "../middleware/auth.js";
import { ah } from "../utils.js";

const router = Router();
router.use(requireAuth);

const validTarget = (req) =>
  mongoose.isValidObjectId(req.body.userId) && req.body.userId !== req.user.id;

// Block: hides both people from each other and removes any match
router.post("/block", ah(async (req, res) => {
  if (!validTarget(req)) return res.status(400).json({ error: "Invalid user" });
  const target = req.body.userId;
  try { await Block.create({ from: req.user._id, to: target }); }
  catch (e) { if (e.code !== 11000) throw e; }
  const pairKey = [req.user.id, target].sort().join("_");
  const match = await Match.findOne({ pairKey });
  if (match) {
    await Message.deleteMany({ matchId: match._id });
    await Match.deleteOne({ _id: match._id });
    req.app.get("io").to(`user:${target}`).emit("match:removed", { matchId: match.id });
  }
  res.json({ ok: true });
}));

// People you've blocked (for the "Blocked people" list in your profile)
router.get("/blocks", ah(async (req, res) => {
  const blocks = await Block.find({ from: req.user._id }).sort({ createdAt: -1 }).populate("to", "name profilePhotoUrl");
  res.json(blocks.filter((b) => b.to).map((b) => ({ id: b.to.id, name: b.to.name, photo: b.to.profilePhotoUrl })));
}));

// Unblock: they can appear in your deck again. Old chats are not restored.
router.delete("/block/:userId", ah(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) return res.status(400).json({ error: "Invalid user" });
  await Block.deleteOne({ from: req.user._id, to: req.params.userId });
  await Swipe.deleteOne({ from: req.user._id, to: req.params.userId }); // so you can see them again
  res.json({ ok: true });
}));

// Report: saved for you to review (build an admin page on top of the Report collection)
router.post("/report", ah(async (req, res) => {
  const reason = String(req.body.reason || "").trim();
  if (!validTarget(req) || !reason) return res.status(400).json({ error: "Tell us what happened" });
  await Report.create({ reporter: req.user._id, target: req.body.userId, reason: reason.slice(0, 500) });
  res.json({ ok: true });
}));

export default router;
