import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import Swipe from "../models/Swipe.js";
import Block from "../models/Block.js";
import Match from "../models/Match.js";
import Message from "../models/Message.js";
import { requireAuth } from "../middleware/auth.js";
import { ah, ageFromDob, publicUser, uploadDir } from "../utils.js";

const router = Router();
router.use(requireAuth);
const GENDERS = ["man", "woman", "nonbinary"];

const EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, `${req.user.id}-${Date.now()}${EXT[file.mimetype]}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (EXT[file.mimetype]) return cb(null, true);
    const e = new Error("Upload a JPG, PNG or WebP image");
    e.status = 400;
    cb(e);
  },
});

router.get("/me", (req, res) => res.json({ user: publicUser(req.user) }));

router.put("/me", ah(async (req, res) => {
  const { name, dob, bio, phone, gender, lookingFor } = req.body;
  const u = req.user;
  if (name !== undefined) {
    if (!name.trim()) return res.status(400).json({ error: "Name can't be empty" });
    u.name = name.trim().slice(0, 60);
  }
  if (dob) {
    if (!(ageFromDob(dob) >= 18)) return res.status(400).json({ error: "You must be 18 or older to use this app" });
    u.dob = dob;
  }
  if (gender !== undefined) {
    if (!GENDERS.includes(gender)) return res.status(400).json({ error: "Choose your gender" });
    u.gender = gender;
  }
  if (lookingFor !== undefined) {
    if (!Array.isArray(lookingFor) || !lookingFor.length || !lookingFor.every((g) => GENDERS.includes(g)))
      return res.status(400).json({ error: "Choose who you'd like to meet" });
    u.lookingFor = [...new Set(lookingFor)];
  }
  if (bio !== undefined) u.bio = String(bio).slice(0, 300);
  if (phone !== undefined) u.phone = String(phone).trim() || undefined; // optional
  await u.save();
  res.json({ user: publicUser(u) });
}));

// The one and only photo shown on the swipe card
router.post("/me/photo", upload.single("photo"), ah(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image received" });
  const old = req.user.profilePhotoUrl;
  req.user.profilePhotoUrl = `/uploads/${req.file.filename}`;
  await req.user.save();
  if (old?.startsWith("/uploads/")) fs.unlink(path.join(uploadDir, path.basename(old)), () => {});
  res.json({ user: publicUser(req.user) });
}));

router.put("/me/location", ah(async (req, res) => {
  const lat = Number(req.body.lat), lng = Number(req.body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return res.status(400).json({ error: "Invalid location" });
  req.user.location = { type: "Point", coordinates: [lng, lat] }; // [lng, lat] order!
  await req.user.save();
  res.json({ user: publicUser(req.user) });
}));

// People nearby, closest first, who you haven't swiped on and haven't blocked (either way)
router.get("/deck", ah(async (req, res) => {
  const me = req.user;
  if (me.location?.coordinates?.length !== 2)
    return res.status(400).json({ error: "Turn on location to see people nearby" });

  if (!me.gender || !me.lookingFor?.length)
    return res.status(400).json({ error: "Add your gender and who you'd like to meet in your profile" });

  const maxKm = Math.min(Math.max(Number(req.query.maxKm) || 25, 1), 200);
  const minAge = Math.max(Number(req.query.minAge) || 18, 18);
  const maxAge = Math.min(Number(req.query.maxAge) || 60, 99);
  const now = new Date();
  const dobMax = new Date(now); dobMax.setFullYear(now.getFullYear() - minAge);
  const dobMin = new Date(now); dobMin.setFullYear(now.getFullYear() - maxAge - 1);

  const [swiped, blockedByMe, blockedMe] = await Promise.all([
    Swipe.find({ from: me._id }).distinct("to"),
    Block.find({ from: me._id }).distinct("to"),
    Block.find({ to: me._id }).distinct("from"),
  ]);
  const exclude = [me._id, ...swiped, ...blockedByMe, ...blockedMe];

  const docs = await User.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: me.location.coordinates },
        distanceField: "distance", // meters
        maxDistance: maxKm * 1000,
        spherical: true,
        query: {
          _id: { $nin: exclude },
          profilePhotoUrl: { $exists: true, $ne: null },
          // both sides must fit: they are who I'm looking for, and I'm who they're looking for
          gender: { $in: me.lookingFor },
          lookingFor: me.gender,
          dob: { $gte: dobMin, $lte: dobMax },
        },
      },
    },
    { $limit: 20 },
    // never send coordinates, email or phone to other users
    { $project: { name: 1, dob: 1, bio: 1, profilePhotoUrl: 1, distance: 1 } },
  ]);

  res.json(docs.map((d) => ({
    id: String(d._id),
    name: d.name,
    age: ageFromDob(d.dob),
    bio: d.bio,
    photo: d.profilePhotoUrl,
    distanceKm: Math.max(1, Math.round(d.distance / 1000)), // approximate only
  })));
}));

// Delete account and all related data
router.delete("/me", ah(async (req, res) => {
  const id = req.user._id;
  const matches = await Match.find({ users: id }).distinct("_id");
  await Promise.all([
    Message.deleteMany({ matchId: { $in: matches } }),
    Match.deleteMany({ _id: { $in: matches } }),
    Swipe.deleteMany({ $or: [{ from: id }, { to: id }] }),
    Block.deleteMany({ $or: [{ from: id }, { to: id }] }),
  ]);
  const photo = req.user.profilePhotoUrl;
  if (photo?.startsWith("/uploads/")) fs.unlink(path.join(uploadDir, path.basename(photo)), () => {});
  await User.deleteOne({ _id: id });
  res.json({ ok: true });
}));

export default router;
