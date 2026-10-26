import {
  createReviewService,
  getReviewsService,
  getReviewByIdService,
  updateReviewService,
  deleteReviewService,
} from "../services/reviews.services.js";

export const createReview = async (req, res) => {
  const { review, recommendations } = await createReviewService(
    req.user.userId,
    req.validatedBody,
    req.file,
  );

  res.status(201).json({
    mensaje: "Reseña creada",
    review,
    recommendations,
  });
};

export const getReviews = async (req, res) => {
  const reviews = await getReviewsService(req.user.userId, req.validatedQuery);

  res.json(reviews);
};

export const getReviewById = async (req, res) => {
  const review = await getReviewByIdService(req.user.userId, req.validatedParams.id);

  res.json(review);
};

export const updateReview = async (req, res) => {
  const review = await updateReviewService(
    req.user.userId,
    req.validatedParams.id,
    req.validatedBody,
    req.file,
  );

  res.json(review);
};

export const deleteReview = async (req, res) => {
  await deleteReviewService(req.user.userId, req.validatedParams.id);

  res.json({
    mensaje: "Reseña eliminada",
  });
};
