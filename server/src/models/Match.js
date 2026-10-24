import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const matchSchema = new mongoose.Schema(
  {
    users: [{ type: ObjectId, ref: "User" }],
    pairKey: { type: String, unique: true }, // sorted "idA_idB" so a pair can only match once
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
matchSchema.index({ users: 1, lastMessageAt: -1 });

export default mongoose.model("Match", matchSchema);
