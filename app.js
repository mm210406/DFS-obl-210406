import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./v1/config/db.config.js";
import v1Routes from "./v1/v1.routes.js";
import { notFoundMiddleware } from "./v1/middlewares/notFound.middleware.js";
import { errorMiddleware } from "./v1/middlewares/error.middleware.js";
import { apiRateLimitMiddleware } from "./v1/middlewares/rateLimit.middleware.js";

connectDB();
const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => res.json({ mensaje: "CineReview API" }));
app.use("/v1", apiRateLimitMiddleware, v1Routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
