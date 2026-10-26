import express from "express";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import genresRoutes from "./routes/genres.routes.js";
import moviesRoutes from "./routes/movies.routes.js";
import { authenticateMiddleware } from "./middlewares/authenticate.middleware.js";

const router = express.Router({ mergeParams: true });

//rutas públicas
router.use("/auth", authRoutes);

router.use(authenticateMiddleware);

//rutas privadas
router.use("/users", usersRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/genres", genresRoutes);
router.use("/movies", moviesRoutes);

export default router;
