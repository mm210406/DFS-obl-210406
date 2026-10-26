import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tmdbId: { type: Number, required: true },
    movieTitle: { type: String, required: true, trim: true },
    synopsis: { type: String, trim: true, default: "" },
    genres: [{ type: mongoose.Schema.Types.ObjectId, ref: "Genre" }],
    description: { type: String, required: true, trim: true },
    points: { type: Number, required: true, min: 1, max: 10 },
    imageUrl: { type: String, trim: true, default: "" },
    imagePublicId: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("Review", reviewSchema);
