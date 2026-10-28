import User from "../models/user.model.js";
import Review from "../models/review.model.js";
import { buildAuthResponse } from "./auth.services.js";
import { uploadImageService, deleteImageService } from "./images.services.js";
import { IMAGE_FIELD } from "../middlewares/multer.middleware.js";
import { PLUS_REVIEW_LIMIT } from "./reviews.services.js";
import { createError } from "../utils/error.util.js";

const findUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw createError(404, "Usuario no encontrado");
  }
  return user;
};

export const getProfileService = async (userId) => {
  const user = await findUserById(userId);
  const reviewCount = await Review.countDocuments({ userId });
  const limit = user.plan === "PLUS" ? PLUS_REVIEW_LIMIT : null;

  return {
    user: buildAuthResponse(user).user,
    usage: {
      reviews: reviewCount,
      limit,
      percentage: limit ? Math.round((reviewCount / limit) * 100) : null,
    },
    recommendations: user.recommendations,
    recommendationsUpdatedAt: user.recommendationsUpdatedAt,
  };
};

export const upgradePlanService = async (userId) => {
  const user = await findUserById(userId);

  if (user.role === "ADMIN") {
    throw createError(403, "El administrador no gestiona planes");
  }
  if (user.plan === "PREMIUM") {
    throw createError(400, "El usuario ya tiene plan PREMIUM");
  }

  user.plan = "PREMIUM";
  await user.save();
  return buildAuthResponse(user);
};

const AVATAR_OPTIONS = {
  folder: "cine-review/avatars",
  transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
};

export const updateAvatarService = async (userId, file) => {
  if (!file) {
    throw createError(400, `Debe enviar una imagen en el campo '${IMAGE_FIELD}'`);
  }

  const user = await findUserById(userId);
  const previousPublicId = user.avatarPublicId;
  const image = await uploadImageService(file.buffer, AVATAR_OPTIONS);

  user.avatarUrl = image.url;
  user.avatarPublicId = image.publicId;
  try {
    await user.save();
  } catch (error) {
    await deleteImageService(image.publicId);
    throw error;
  }

  await deleteImageService(previousPublicId);
  return buildAuthResponse(user).user;
};

export const deleteAvatarService = async (userId) => {
  const user = await findUserById(userId);
  const previousPublicId = user.avatarPublicId;

  user.avatarUrl = "";
  user.avatarPublicId = "";
  await user.save();

  await deleteImageService(previousPublicId);
  return buildAuthResponse(user).user;
};
