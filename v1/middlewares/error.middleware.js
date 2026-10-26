import { MAX_IMAGE_SIZE_MB, IMAGE_FIELD } from "./multer.middleware.js";

const multerMessages = {
  LIMIT_FILE_SIZE: `La imagen no puede superar los ${MAX_IMAGE_SIZE_MB} MB`,
  LIMIT_UNEXPECTED_FILE: `La imagen debe enviarse en el campo '${IMAGE_FIELD}'`,
};

export const errorMiddleware = (err, req, res, next) => {
  if (err.code === 11000) {
    return res.status(409).json({ mensaje: "Ya existe un registro con ese valor" });
  }

  if (err.name === "MulterError") {
    return res
      .status(400)
      .json({ mensaje: multerMessages[err.code] || "No se pudo leer el archivo enviado" });
  }

  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    mensaje: status === 500 ? "Error interno del servidor" : err.message,
  });
};
