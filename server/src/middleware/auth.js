import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please log in" });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ error: "Account not found" });
    req.user = user;
    User.updateOne({ _id: id }, { lastActiveAt: new Date() }).catch(() => {});
    next();
  } catch {
    res.status(401).json({ error: "Session expired, please log in again" });
  }
}
