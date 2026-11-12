import axios from "axios";
import Genre from "../models/genre.model.js";
import Review from "../models/review.model.js";
import { createError } from "../utils/error.util.js";
import { escapeRegex } from "../utils/regex.util.js";

const TMDB_URL = "https://api.themoviedb.org/3";
const POSTER_URL = "https://image.tmdb.org/t/p/w500";
const BACKDROP_URL = "https://image.tmdb.org/t/p/w1280";
const TMDB_MAX_PAGES = 500;
const TMDB_SEARCH_MAX_PAGES = 10;
const CATALOG_PAGE_SIZE = 20;
const TOP_LIMIT = 10;
const TOP_DAYS = 30;

const tmdbGet = async (path, params = {}) => {
  try {
    const response = await axios.get(`${TMDB_URL}${path}`, {
      params: { api_key: process.env.TMDB_API_KEY, language: "es-MX", ...params },
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw createError(404, "Película no encontrada");
    }
    throw createError(503, "El servicio de películas no está disponible");
  }
};

export const getTmdbGenresService = async () => {
  const data = await tmdbGet("/genre/movie/list");
  return data.genres;
};

export const isMovieAllowed = (movieGenreIds, allowedGenreIds) =>
  movieGenreIds.length > 0 && movieGenreIds.every((genreId) => allowedGenreIds.includes(genreId));

const formatMovie = (movie, movieGenreIds, dbGenres) => ({
  tmdbId: movie.id,
  title: movie.title,
  overview: movie.overview,
  releaseDate: movie.release_date,
  posterUrl: movie.poster_path ? `${POSTER_URL}${movie.poster_path}` : "",
  backdropUrl: movie.backdrop_path ? `${BACKDROP_URL}${movie.backdrop_path}` : "",
  genres: dbGenres
    .filter((genre) => movieGenreIds.includes(genre.tmdbId))
    .map((genre) => ({ _id: genre._id, name: genre.name })),
});

const getGenreLists = async () => {
  const dbGenres = await Genre.find();
  const allowedGenreIds = dbGenres.filter((genre) => genre.allowed).map((genre) => genre.tmdbId);
  return { dbGenres, allowedGenreIds };
};

const roundScore = (value) => Math.round(value * 10) / 10;

// genres llega como "16,10751": todos tienen que estar creados y permitidos
const parseGenreFilter = (genres, allowedGenreIds) => {
  if (!genres) return [];
  const genreIds = [...new Set(genres.split(",").map(Number))];
  const notAllowed = genreIds.filter((genreId) => !allowedGenreIds.includes(genreId));
  if (notAllowed.length > 0) {
    throw createError(400, `Géneros no disponibles: ${notAllowed.join(", ")}`);
  }
  return genreIds;
};

const isInYearRange = (releaseDate, yearFrom, yearTo) => {
  if (!yearFrom && !yearTo) return true;
  const year = Number(releaseDate?.slice(0, 4));
  if (!year) return false;
  return (!yearFrom || year >= yearFrom) && (!yearTo || year <= yearTo);
};

// Promedio y cantidad de reseñas de CineReview para las películas de una página
const getScoresService = async (tmdbIds) => {
  if (tmdbIds.length === 0) return new Map();
  const scores = await Review.aggregate([
    { $match: { tmdbId: { $in: tmdbIds } } },
    { $group: { _id: "$tmdbId", average: { $avg: "$points" }, count: { $sum: 1 } } },
  ]);
  return new Map(
    scores.map((score) => [score._id, { average: roundScore(score.average), count: score.count }]),
  );
};

const addScores = async (movies) => {
  const scores = await getScoresService(movies.map((movie) => movie.tmdbId));
  return movies.map((movie) => ({ ...movie, score: scores.get(movie.tmdbId) || null }));
};

// Reseñas de películas cuyos géneros siguen todos permitidos
const allowedReviewsCondition = (dbGenres) => {
  const allowedIds = dbGenres.filter((genre) => genre.allowed).map((genre) => genre._id);
  return { genres: { $ne: [], $not: { $elemMatch: { $nin: allowedIds } } } };
};

// Agrupa las reseñas por película: promedio, cantidad y los datos guardados en la reseña más nueva
const reviewedMoviesStages = (conditions) => [
  { $match: { $and: conditions } },
  { $sort: { createdAt: -1 } },
  {
    $group: {
      _id: "$tmdbId",
      average: { $avg: "$points" },
      count: { $sum: 1 },
      title: { $first: "$movieTitle" },
      overview: { $first: "$synopsis" },
      releaseDate: { $first: "$releaseDate" },
      posterUrl: { $first: "$posterUrl" },
      genres: { $first: "$genres" },
    },
  },
  { $sort: { average: -1, count: -1, _id: 1 } },
];

const formatReviewedMovie = (movie, dbGenres) => ({
  tmdbId: movie._id,
  title: movie.title,
  overview: movie.overview || "",
  releaseDate: movie.releaseDate || "",
  posterUrl: movie.posterUrl || "",
  genres: dbGenres
    .filter((genre) => movie.genres.some((genreId) => String(genreId) === String(genre._id)))
    .map((genre) => ({ _id: genre._id, name: genre.name })),
  score: { average: roundScore(movie.average), count: movie.count },
});

const filterTmdbMovies = (results, filters, dbGenres, allowedGenreIds) => {
  const { genreIds, yearFrom, yearTo } = filters;
  return results
    .filter((movie) => !movie.adult && isMovieAllowed(movie.genre_ids, allowedGenreIds))
    .filter((movie) => genreIds.every((genreId) => movie.genre_ids.includes(genreId)))
    .filter((movie) => isInYearRange(movie.release_date, yearFrom, yearTo))
    .map((movie) => formatMovie(movie, movie.genre_ids, dbGenres));
};

export const normalizeTitle = (title = "") =>
  title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Para las recomendaciones de la IA: la película permitida cuyo título coincide con el sugerido.
// Se compara también con el título original, porque la IA sugiere títulos en inglés
export const findAllowedMovieByTitle = async (title, year, excludedIds) => {
  const { dbGenres, allowedGenreIds } = await getGenreLists();
  const data = await tmdbGet("/search/movie", { query: title, include_adult: false });
  const wanted = normalizeTitle(title);

  const match = data.results
    .filter((movie) => !excludedIds.includes(movie.id))
    .filter((movie) => !movie.adult && isMovieAllowed(movie.genre_ids, allowedGenreIds))
    .filter(
      (movie) =>
        normalizeTitle(movie.title) === wanted || normalizeTitle(movie.original_title) === wanted,
    )
    .sort(
      (a, b) =>
        Number(b.release_date?.startsWith(String(year))) -
        Number(a.release_date?.startsWith(String(year))),
    )[0];

  return match ? formatMovie(match, match.genre_ids, dbGenres) : null;
};

// La búsqueda por título de TMDB no filtra por géneros ni años: se piden varias páginas,
// se filtran y se arman páginas propias de CATALOG_PAGE_SIZE
const getSearchCatalog = async (filters, dbGenres, allowedGenreIds) => {
  const { page, title } = filters;
  const searchPage = (tmdbPage) =>
    tmdbGet("/search/movie", { query: title, page: tmdbPage, include_adult: false });

  const firstPage = await searchPage(1);
  const lastPage = Math.min(firstPage.total_pages, TMDB_SEARCH_MAX_PAGES);
  const otherPages = await Promise.all(
    Array.from({ length: Math.max(lastPage - 1, 0) }, (_, index) => searchPage(index + 2)),
  );

  const results = [firstPage, ...otherPages].flatMap((data) => data.results);
  const uniqueResults = [...new Map(results.map((movie) => [movie.id, movie])).values()];
  const movies = filterTmdbMovies(uniqueResults, filters, dbGenres, allowedGenreIds);
  const start = (page - 1) * CATALOG_PAGE_SIZE;

  return {
    page,
    totalPages: Math.ceil(movies.length / CATALOG_PAGE_SIZE),
    movies: await addScores(movies.slice(start, start + CATALOG_PAGE_SIZE)),
  };
};

// Sin título ni puntaje: las películas salen del listado de TMDB, que ya filtra géneros y años
const getDiscoverCatalog = async (filters, dbGenres, allowedGenreIds) => {
  const { page, genreIds, yearFrom, yearTo } = filters;
  const tmdbGenres = await getTmdbGenresService();
  const excludedGenreIds = tmdbGenres
    .map((genre) => genre.id)
    .filter((genreId) => !allowedGenreIds.includes(genreId));

  const data = await tmdbGet("/discover/movie", {
    page,
    include_adult: false,
    sort_by: "popularity.desc",
    without_genres: excludedGenreIds.join("|") || undefined,
    with_genres: genreIds.join(",") || undefined,
    "primary_release_date.gte": yearFrom ? `${yearFrom}-01-01` : undefined,
    "primary_release_date.lte": yearTo ? `${yearTo}-12-31` : undefined,
  });

  return {
    page: data.page,
    totalPages: Math.min(data.total_pages, TMDB_MAX_PAGES),
    movies: await addScores(filterTmdbMovies(data.results, filters, dbGenres, allowedGenreIds)),
  };
};

// Con puntaje: las películas salen de las reseñas de CineReview
const getScoredCatalog = async (filters, dbGenres) => {
  const { page, title, genreIds, yearFrom, yearTo, minScore } = filters;
  const conditions = [allowedReviewsCondition(dbGenres)];

  if (genreIds.length > 0) {
    const genreObjectIds = dbGenres
      .filter((genre) => genreIds.includes(genre.tmdbId))
      .map((genre) => genre._id);
    conditions.push({ genres: { $all: genreObjectIds } });
  }
  if (title) conditions.push({ movieTitle: { $regex: escapeRegex(title), $options: "i" } });
  if (yearFrom) conditions.push({ releaseDate: { $gte: `${yearFrom}-01-01` } });
  if (yearTo) conditions.push({ releaseDate: { $gt: "", $lte: `${yearTo}-12-31` } });

  const [result] = await Review.aggregate([
    ...reviewedMoviesStages(conditions),
    { $match: { average: { $gte: minScore } } },
    {
      $facet: {
        total: [{ $count: "value" }],
        movies: [{ $skip: (page - 1) * CATALOG_PAGE_SIZE }, { $limit: CATALOG_PAGE_SIZE }],
      },
    },
  ]);

  const total = result.total[0]?.value || 0;
  return {
    page,
    totalPages: Math.ceil(total / CATALOG_PAGE_SIZE),
    movies: result.movies.map((movie) => formatReviewedMovie(movie, dbGenres)),
  };
};

const addReviewedByMe = async (movies, userId) => {
  const myReviews = await Review.find({
    userId,
    tmdbId: { $in: movies.map((movie) => movie.tmdbId) },
  }).select("tmdbId points");
  const myPoints = new Map(myReviews.map((review) => [review.tmdbId, review.points]));

  return movies.map((movie) => ({
    ...movie,
    reviewedByMe: myPoints.has(movie.tmdbId),
    myPoints: myPoints.get(movie.tmdbId) ?? null,
  }));
};

export const getCatalogService = async (query, userId) => {
  const { dbGenres, allowedGenreIds } = await getGenreLists();
  const filters = { ...query, genreIds: parseGenreFilter(query.genres, allowedGenreIds) };

  let catalog;
  if (filters.minScore) {
    catalog = await getScoredCatalog(filters, dbGenres);
  } else if (filters.title) {
    catalog = await getSearchCatalog(filters, dbGenres, allowedGenreIds);
  } else {
    catalog = await getDiscoverCatalog(filters, dbGenres, allowedGenreIds);
  }

  return { ...catalog, movies: await addReviewedByMe(catalog.movies, userId) };
};

// Top 10 de los últimos 30 días: mejor promedio de las reseñas hechas en ese período
export const getTopMoviesService = async () => {
  const { dbGenres } = await getGenreLists();
  const to = new Date();
  const from = new Date(to.getTime() - TOP_DAYS * 24 * 60 * 60 * 1000);

  const movies = await Review.aggregate([
    ...reviewedMoviesStages([allowedReviewsCondition(dbGenres), { createdAt: { $gte: from } }]),
    { $limit: TOP_LIMIT },
  ]);

  const top = movies.map((movie, index) => ({
    position: index + 1,
    ...formatReviewedMovie(movie, dbGenres),
  }));

  // La #1 se muestra en grande: su imagen horizontal se pide a TMDB solo para ella
  if (top.length > 0) {
    try {
      const movie = await tmdbGet(`/movie/${top[0].tmdbId}`);
      top[0].backdropUrl = movie.backdrop_path ? `${BACKDROP_URL}${movie.backdrop_path}` : "";
    } catch (error) {
      top[0].backdropUrl = "";
    }
  }

  return { days: TOP_DAYS, from, to, movies: top };
};

// Detalle para el front: la película más el puntaje de CineReview
export const getMovieDetailService = async (tmdbId, userId) => {
  const movie = await getMovieService(tmdbId, userId);
  const scores = await getScoresService([movie.tmdbId]);
  return { ...movie, score: scores.get(movie.tmdbId) || null };
};

export const getMovieService = async (tmdbId, userId) => {
  const { dbGenres, allowedGenreIds } = await getGenreLists();
  const movie = await tmdbGet(`/movie/${tmdbId}`);
  const movieGenreIds = movie.genres.map((genre) => genre.id);

  if (movie.adult || !isMovieAllowed(movieGenreIds, allowedGenreIds)) {
    const hasReview = userId && (await Review.findOne({ userId, tmdbId }));
    if (!hasReview) {
      throw createError(404, "Película no encontrada");
    }
  }

  if (!movie.overview) {
    try {
      const englishMovie = await tmdbGet(`/movie/${tmdbId}`, { language: "en-US" });
      movie.overview = englishMovie.overview;
    } catch (error) {
      console.error("No se pudo obtener la sinopsis de la película.");
    }
  }

  return formatMovie(movie, movieGenreIds, dbGenres);
};
