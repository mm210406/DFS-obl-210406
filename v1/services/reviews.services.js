import Review from "../models/review.model.js";
import User from "../models/user.model.js";
import { getMovieService } from "./movies.services.js";
import { updateRecommendationsService } from "./recommendations.services.js";
import { uploadImageService, deleteImageService } from "./images.services.js";
import { createError } from "../utils/error.util.js";
import { escapeRegex } from "../utils/regex.util.js";

export const PLUS_REVIEW_LIMIT = 4;

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
      releaseDate: movie.releaseDate || "",
      posterUrl: movie.posterUrl,
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

export const getReviewsService = async (
  userId,
  { page, limit, genreId, pointsFrom, pointsTo, title },
) => {
  const filter = { userId };

  if (genreId) filter.genres = genreId;
  if (pointsFrom || pointsTo) {
    filter.points = {};
    if (pointsFrom) filter.points.$gte = pointsFrom;
    if (pointsTo) filter.points.$lte = pointsTo;
  }
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
  const { removeImage, ...fields } = data;

  if (Object.keys(fields).length === 0 && !file && !removeImage) {
    throw createError(400, "Debe enviar al menos un campo para modificar");
  }
  if (removeImage && file) {
    throw createError(400, "No se puede enviar una imagen y removeImage a la vez");
  }

  const review = await Review.findOne({ _id: id, userId });
  if (!review) {
    throw createError(404, "Reseña no encontrada");
  }

  const previousPublicId = review.imagePublicId;
  const image = file ? await uploadImageService(file.buffer) : null;

  review.set(fields);
  if (image) {
    review.imageUrl = image.url;
    review.imagePublicId = image.publicId;
  } else if (removeImage) {
    // Sin foto propia, la reseña vuelve a mostrar el póster de TMDB
    review.imageUrl = review.posterUrl;
    review.imagePublicId = "";
  }

  try {
    await review.save();
  } catch (error) {
    await deleteImageService(image?.publicId);
    throw error;
  }

  if (image || removeImage) await deleteImageService(previousPublicId);

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

const PUBLIC_REVIEW_FIELDS = "points description imageUrl imagePublicId createdAt updatedAt userId";

const toPublicReview = (review, userId) => ({
  _id: review._id,
  author: {
    name: review.userId?.name || "Usuario eliminado",
    avatarUrl: review.userId?.avatarUrl || "",
  },
  isMine: String(review.userId?._id) === String(userId),
  points: review.points,
  description: review.description,
  imageUrl: review.imageUrl,
  hasImage: Boolean(review.imagePublicId),
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

export const getMovieReviewsService = async (userId, tmdbId, { page, limit }) => {
  await getMovieService(tmdbId, userId);

  const filter = { tmdbId };
  const [total, reviews, myReview] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter)
      .select(PUBLIC_REVIEW_FIELDS)
      .populate("userId", "name avatarUrl")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.findOne({ tmdbId, userId })
      .select(PUBLIC_REVIEW_FIELDS)
      .populate("userId", "name avatarUrl"),
  ]);

  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    myReview: myReview ? toPublicReview(myReview, userId) : null,
    reviews: reviews.map((review) => toPublicReview(review, userId)),
  };
};
