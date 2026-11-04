import express from "express";
import { validateQueryMiddleware } from "../middlewares/validateQuery.middleware.js";
import { validateParamsMiddleware } from "../middlewares/validateParams.middleware.js";
import {
  moviesQuerySchema,
  tmdbIdParamSchema,
  movieReviewsQuerySchema,
} from "../validators/movies.validators.js";
import {
  getMovies,
  getTopMovies,
  getMovieById,
  getMovieReviews,
} from "../controllers/movies.controllers.js";

const router = express.Router();

router.get("/", validateQueryMiddleware(moviesQuerySchema), getMovies);
// /top va antes de /:tmdbId para que "top" no se tome como un id
router.get("/top", getTopMovies);
router.get("/:tmdbId", validateParamsMiddleware(tmdbIdParamSchema), getMovieById);
router.get(
  "/:tmdbId/reviews",
  validateParamsMiddleware(tmdbIdParamSchema),
  validateQueryMiddleware(movieReviewsQuerySchema),
  getMovieReviews,
);

export default router;
