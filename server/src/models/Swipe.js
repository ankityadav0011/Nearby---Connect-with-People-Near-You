import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const swipeSchema = new mongoose.Schema(
  {
    from: { type: ObjectId, ref: "User", required: true },
    to: { type: ObjectId, ref: "User", required: true },
    direction: { type: String, enum: ["like", "pass"], required: true },
  },
  { timestamps: true }
);
swipeSchema.index({ from: 1, to: 1 }, { unique: true }); // one swipe per pair
swipeSchema.index({ to: 1, direction: 1 });

export default mongoose.model("Swipe", swipeSchema);
