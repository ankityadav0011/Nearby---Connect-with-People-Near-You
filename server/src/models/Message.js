import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const messageSchema = new mongoose.Schema(
  {
    matchId: { type: ObjectId, ref: "Match", required: true },
    sender: { type: ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true }
);
messageSchema.index({ matchId: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
