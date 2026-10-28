import express from "express";
import { register, login } from "../controllers/auth.controllers.js";
import { validateBodyMiddleware } from "../middlewares/validateBody.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validators.js";
import { loginRateLimitMiddleware } from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", validateBodyMiddleware(registerSchema), register);
router.post("/login", loginRateLimitMiddleware, validateBodyMiddleware(loginSchema), login);

export default router;
