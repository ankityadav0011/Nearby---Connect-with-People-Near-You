import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const blockSchema = new mongoose.Schema(
  { from: { type: ObjectId, ref: "User", required: true }, to: { type: ObjectId, ref: "User", required: true } },
  { timestamps: true }
);
blockSchema.index({ from: 1, to: 1 }, { unique: true });
blockSchema.index({ to: 1 });

export default mongoose.model("Block", blockSchema);
