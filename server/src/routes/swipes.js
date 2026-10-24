import { Router } from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Swipe from "../models/Swipe.js";
import Match from "../models/Match.js";
import { requireAuth } from "../middleware/auth.js";
import { ah } from "../utils.js";

const router = Router();
router.use(requireAuth);

// Right swipe (tick) = "like", left swipe (cross) = "pass". Two likes = a match.
router.post("/", ah(async (req, res) => {
  const { to, direction } = req.body;
  if (!mongoose.isValidObjectId(to) || !["like", "pass"].includes(direction))
    return res.status(400).json({ error: "Invalid swipe" });
  if (to === req.user.id) return res.status(400).json({ error: "You can't swipe on yourself" });

  const target = await User.findById(to).select("name profilePhotoUrl");
  if (!target) return res.status(404).json({ error: "User not found" });

  try {
    await Swipe.create({ from: req.user._id, to, direction });
  } catch (e) {
    if (e.code === 11000) return res.json({ matched: false }); // already swiped
    throw e;
  }
  if (direction !== "like") return res.json({ matched: false });

  const reverse = await Swipe.findOne({ from: to, to: req.user._id, direction: "like" });
  if (!reverse) return res.json({ matched: false });

  const pairKey = [req.user.id, to].sort().join("_");
  let match;
  try {
    match = await Match.create({ users: [req.user._id, to], pairKey });
  } catch (e) {
    if (e.code !== 11000) throw e;
    match = await Match.findOne({ pairKey });
  }
  req.app.get("io").to(`user:${to}`).emit("match:new", { matchId: match.id });
  res.json({
    matched: true,
    matchId: match.id,
    user: { id: target.id, name: target.name, photo: target.profilePhotoUrl },
  });
}));

export default router;
