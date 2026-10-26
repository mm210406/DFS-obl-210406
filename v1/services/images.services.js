import cloudinary from "../config/cloudinary.js";
import { uploadBufferToCloudinary } from "../utils/cloudinary.util.js";
import { createError } from "../utils/error.util.js";

const CLOUDINARY_FOLDER = "cine-review";

export const uploadImageService = async (buffer) => {
  try {
    const result = await uploadBufferToCloudinary(cloudinary, buffer, {
      resource_type: "image",
      folder: CLOUDINARY_FOLDER,
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    console.error("Error al subir imagen:", error.message);
    throw createError(503, "El servicio de imágenes no está disponible");
  }
};

export const deleteImageService = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("No se pudo borrar la imagen:", error.message);
  }
};
