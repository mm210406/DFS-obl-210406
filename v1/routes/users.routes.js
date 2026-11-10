import express from "express";
import {
  getProfile,
  getStats,
  upgradePlan,
  updateAvatar,
  deleteAvatar,
} from "../controllers/users.controllers.js";
import { uploadImageMiddleware } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.get("/me", getProfile);
router.get("/me/stats", getStats);
router.patch("/plan", upgradePlan);
router.put("/me/avatar", uploadImageMiddleware, updateAvatar);
router.delete("/me/avatar", deleteAvatar);

export default router;
