import { rateLimit } from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const apiRateLimitMiddleware = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { mensaje: "Demasiadas solicitudes, intentá de nuevo más tarde" },
});

export const loginRateLimitMiddleware = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { mensaje: "Demasiados intentos de inicio de sesión, intentá de nuevo en 15 minutos" },
});

// Limita los registros fallidos (por ejemplo, emails ya registrados) para que no se pueda
// usar el registro para averiguar en masa qué emails tienen cuenta (enumeración de usuarios).
export const registerRateLimitMiddleware = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { mensaje: "Demasiados intentos de registro, intentá de nuevo en 15 minutos" },
});
