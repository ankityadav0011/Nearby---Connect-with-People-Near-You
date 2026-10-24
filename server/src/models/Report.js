import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: ObjectId, ref: "User", required: true },
    target: { type: ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, maxlength: 500 },
    status: { type: String, enum: ["open", "reviewed"], default: "open" },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
