import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: String,
    googleId: { type: String, index: true, sparse: true },
    phone: { type: String, trim: true }, // optional
    dob: Date,
    bio: { type: String, maxlength: 300, default: "" },
    gender: { type: String, enum: ["man", "woman", "nonbinary"] },
    // who this person wants to see; can hold one or more of: man, woman, nonbinary
    lookingFor: { type: [{ type: String, enum: ["man", "woman", "nonbinary"] }], default: undefined },
    profilePhotoUrl: String,
    // GeoJSON point: coordinates are [longitude, latitude]
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number], default: undefined },
    },
    plan: { type: String, enum: ["free", "premium"], default: "free" }, // for the future subscription
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
userSchema.index({ location: "2dsphere" });

export default mongoose.model("User", userSchema);
