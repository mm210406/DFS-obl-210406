import mongoose from "mongoose";

const recommendationSchema = new mongoose.Schema(
  {
    tmdbId: { type: Number, required: true },
    title: { type: String, required: true },
    posterUrl: { type: String, default: "" },
    reason: { type: String, default: "" },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    plan: { type: String, enum: ["PLUS", "PREMIUM"], default: "PLUS" },
    role: { type: String, enum: ["CLIENT", "ADMIN"], default: "CLIENT" },
    avatarUrl: { type: String, default: "" },
    avatarPublicId: { type: String, default: "" },
    recommendations: { type: [recommendationSchema], default: [] },
    recommendationsUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
