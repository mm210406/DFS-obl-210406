import "dotenv/config";
import mongoose from "mongoose";
import Review from "../models/review.model.js";
import { getMovieService } from "../services/movies.services.js";

// Completa el año de estreno y el póster de las reseñas creadas antes de guardar esos datos
const backfillReviews = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const reviews = await Review.find({
      $or: [{ releaseDate: { $exists: false } }, { posterUrl: { $exists: false } }],
    });
    const movies = new Map();
    let updated = 0;

    for (const review of reviews) {
      try {
        if (!movies.has(review.tmdbId)) {
          movies.set(review.tmdbId, await getMovieService(review.tmdbId, review.userId));
        }
        const movie = movies.get(review.tmdbId);
        await Review.updateOne(
          { _id: review._id },
          { $set: { releaseDate: movie.releaseDate || "", posterUrl: movie.posterUrl } },
        );
        updated++;
      } catch (error) {
        console.log(`No se pudo completar la reseña ${review._id}: ${error.message}`);
      }
    }

    console.log(`Reseñas completadas: ${updated} de ${reviews.length}`);
  } catch (error) {
    console.error("Error al completar las reseñas:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

backfillReviews();
