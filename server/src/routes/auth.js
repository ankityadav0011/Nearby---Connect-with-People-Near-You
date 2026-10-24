import { Router } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { ah, ageFromDob, signToken, publicUser } from "../utils.js";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sign up with email + password (phone is optional)
router.post("/register", ah(async (req, res) => {
  const { name, email, password, dob, phone } = req.body;
  if (!name?.trim() || !email || !password || !dob)
    return res.status(400).json({ error: "Name, email, password and date of birth are required" });
  if (!emailRe.test(email)) return res.status(400).json({ error: "Enter a valid email address" });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
  if (!(ageFromDob(dob) >= 18)) return res.status(400).json({ error: "You must be 18 or older to join" });
  if (await User.findOne({ email: email.toLowerCase() }))
    return res.status(409).json({ error: "An account with this email already exists" });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email, passwordHash, dob, phone: phone?.trim() || undefined });
  res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
}));

router.post("/login", ah(async (req, res) => {
  const { email, password } = req.body;
  const user = email && (await User.findOne({ email: String(email).toLowerCase() }));
  if (!user) return res.status(401).json({ error: "Wrong email or password" });
  if (!user.passwordHash)
    return res.status(401).json({ error: "This account uses Google. Use 'Continue with Google'." });
  if (!(await bcrypt.compare(password || "", user.passwordHash)))
    return res.status(401).json({ error: "Wrong email or password" });
  res.json({ token: signToken(user.id), user: publicUser(user) });
}));

// Sign in with Google: the browser sends a Google ID token, we verify it here
router.post("/google", ah(async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: "Missing Google credential" });
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const p = ticket.getPayload();
  if (!p?.email || !p.email_verified) return res.status(400).json({ error: "Google email not verified" });

  let user = await User.findOne({ $or: [{ googleId: p.sub }, { email: p.email.toLowerCase() }] });
  if (!user) {
    user = await User.create({ name: p.name || p.email.split("@")[0], email: p.email, googleId: p.sub });
  } else if (!user.googleId) {
    user.googleId = p.sub;
    await user.save();
  }
  res.json({ token: signToken(user.id), user: publicUser(user) });
}));

export default router;
