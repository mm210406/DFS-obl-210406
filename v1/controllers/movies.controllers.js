import {
  getCatalogService,
  getMovieService,
  getTopMoviesService,
} from "../services/movies.services.js";
import { getMovieReviewsService } from "../services/reviews.services.js";

export const getMovies = async (req, res) => {
  const catalog = await getCatalogService(req.validatedQuery);
  res.json(catalog);
};

export const getTopMovies = async (req, res) => {
  const top = await getTopMoviesService();
  res.json(top);
};

export const getMovieById = async (req, res) => {
  const movie = await getMovieService(req.validatedParams.tmdbId, req.user.userId);
  res.json(movie);
};

export const getMovieReviews = async (req, res) => {
  const result = await getMovieReviewsService(
    req.user.userId,
    req.validatedParams.tmdbId,
    req.validatedQuery,
  );
  res.json(result);
};
