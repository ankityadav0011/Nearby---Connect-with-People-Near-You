import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadDir = path.join(__dirname, "../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

// Lets async route handlers throw errors into Express's error handler
export const ah = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const ageFromDob = (dob) => {
  const d = new Date(dob);
  if (isNaN(d)) return NaN;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
};

export const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// What the logged-in user may see about themselves. Never exposes coordinates or password hash.
export const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone || "",
  dob: u.dob,
  bio: u.bio || "",
  gender: u.gender || "",
  lookingFor: u.lookingFor || [],
  profilePhotoUrl: u.profilePhotoUrl || null,
  plan: u.plan,
  hasLocation: u.location?.coordinates?.length === 2,
  onboarded: !!(u.dob && u.profilePhotoUrl && u.gender && u.lookingFor?.length && u.location?.coordinates?.length === 2),
});

export const toMsg = (m) => ({
  id: m.id,
  matchId: String(m.matchId),
  sender: String(m.sender),
  text: m.text,
  createdAt: m.createdAt,
});
