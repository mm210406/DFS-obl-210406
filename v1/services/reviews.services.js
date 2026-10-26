import Review from "../models/review.model.js";
import User from "../models/user.model.js";
import { getMovieService } from "./movies.services.js";
import { updateRecommendationsService } from "./recommendations.services.js";
import { uploadImageService, deleteImageService } from "./images.services.js";
import { createError } from "../utils/error.util.js";

export const PLUS_REVIEW_LIMIT = 4;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createReviewService = async (userId, data, file) => {
  const user = await User.findById(userId);
  if (!user) {
    throw createError(404, "Usuario no encontrado");
  }

  const reviewCount = await Review.countDocuments({ userId });
  if (user.plan === "PLUS" && reviewCount >= PLUS_REVIEW_LIMIT) {
    throw createError(403, `El plan PLUS permite un máximo de ${PLUS_REVIEW_LIMIT} reseñas`);
  }

  const alreadyReviewed = await Review.findOne({ userId, tmdbId: data.tmdbId });
  if (alreadyReviewed) {
    throw createError(409, "Ya reseñaste esta película");
  }

  const movie = await getMovieService(data.tmdbId);

  const image = file ? await uploadImageService(file.buffer) : null;

  let review;
  try {
    review = await Review.create({
      userId,
      tmdbId: movie.tmdbId,
      movieTitle: movie.title,
      synopsis: movie.overview,
      genres: movie.genres.map((genre) => genre._id),
      description: data.description,
      points: data.points,
      imageUrl: image?.url || movie.posterUrl,
      imagePublicId: image?.publicId || "",
    });
  } catch (error) {
    await deleteImageService(image?.publicId);
    throw error;
  }

  await review.populate("genres", "name");
  const recommendations = await updateRecommendationsService(userId);

  return { review, recommendations };
};

export const getReviewsService = async (userId, { page, limit, genreId, points, title }) => {
  const filter = { userId };

  if (genreId) filter.genres = genreId;
  if (points) filter.points = points;
  if (title) filter.movieTitle = { $regex: escapeRegex(title), $options: "i" };

  const total = await Review.countDocuments(filter);
  const reviews = await Review.find(filter)
    .populate("genres", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { page, limit, total, pages: Math.ceil(total / limit), reviews };
};

export const getReviewByIdService = async (userId, id) => {
  const review = await Review.findOne({ _id: id, userId }).populate("genres", "name");
  if (!review) {
    throw createError(404, "Reseña no encontrada");
  }
  return review;
};

export const updateReviewService = async (userId, id, data, file) => {
  if (Object.keys(data).length === 0 && !file) {
    throw createError(400, "Debe enviar al menos un campo para modificar");
  }

  const review = await Review.findOne({ _id: id, userId });
  if (!review) {
    throw createError(404, "Reseña no encontrada");
  }

  const previousPublicId = review.imagePublicId;
  const image = file ? await uploadImageService(file.buffer) : null;

  review.set(data);
  if (image) {
    review.imageUrl = image.url;
    review.imagePublicId = image.publicId;
  }

  try {
    await review.save();
  } catch (error) {
    await deleteImageService(image?.publicId);
    throw error;
  }

  if (image) await deleteImageService(previousPublicId);

  return await review.populate("genres", "name");
};

export const deleteReviewService = async (userId, id) => {
  const review = await Review.findOneAndDelete({ _id: id, userId });
  if (!review) {
    throw createError(404, "Reseña no encontrada");
  }
  await deleteImageService(review.imagePublicId);
  return review;
};
