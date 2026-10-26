import multer from "multer";
import { createError } from "../utils/error.util.js";

const storage = multer.memoryStorage();

export const MAX_IMAGE_SIZE_MB = 4;
export const IMAGE_FIELD = "imagen";

const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(createError(400, "El archivo debe ser una imagen"));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

export const uploadImageMiddleware = upload.single(IMAGE_FIELD);
