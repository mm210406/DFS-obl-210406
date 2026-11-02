import Joi from "joi";

export const moviesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).max(500).default(1).messages({
    "number.base": "page debe ser un número",
    "number.integer": "page debe ser un número entero",
    "number.min": "page debe ser mayor o igual a {#limit}",
    "number.max": "page debe ser menor o igual a {#limit}",
  }),
  title: Joi.string().trim().min(1).max(100).messages({
    "string.base": "El título debe ser un texto",
    "string.empty": "El título no puede estar vacío",
    "string.max": "El título no puede tener más de {#limit} caracteres",
  }),
});

export const tmdbIdParamSchema = Joi.object({
  tmdbId: Joi.number().integer().min(1).required().messages({
    "number.base": "El id de la película debe ser un número",
    "number.integer": "El id de la película debe ser un número entero",
    "number.min": "El id de la película debe ser mayor a 0",
    "any.required": "El id de la película es obligatorio",
  }),
});

export const movieReviewsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "page debe ser un número",
    "number.integer": "page debe ser un número entero",
    "number.min": "page debe ser mayor o igual a {#limit}",
  }),
  limit: Joi.number().integer().min(1).max(50).default(10).messages({
    "number.base": "limit debe ser un número",
    "number.integer": "limit debe ser un número entero",
    "number.min": "limit debe ser mayor o igual a {#limit}",
    "number.max": "limit debe ser menor o igual a {#limit}",
  }),
});
