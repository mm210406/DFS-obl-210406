import connectDB from "../config/db.config.js";
import { createError } from "../utils/error.util.js";

export const dbMiddleware = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.log(error);
    next(createError(503, "La base de datos no está disponible. Probá de nuevo en un momento"));
  }
};
