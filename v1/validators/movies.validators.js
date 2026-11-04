import Joi from "joi";

const yearRule = (name) =>
  Joi.number().integer().min(1888).max(2100).messages({
    "number.base": `${name} debe ser un número`,
    "number.integer": `${name} debe ser un año entero`,
    "number.min": `${name} debe ser mayor o igual a {#limit}`,
    "number.max": `${name} debe ser menor o igual a {#limit}`,
  });

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
  genres: Joi.string()
    .trim()
    .pattern(/^\d+(,\d+)*$/)
    .messages({
      "string.base": "genres debe ser un texto",
      "string.empty": "genres no puede estar vacío",
      "string.pattern.base": "genres debe ser una lista de ids de géneros separados por coma",
    }),
  yearFrom: yearRule("yearFrom"),
  yearTo: yearRule("yearTo"),
  minScore: Joi.number().min(1).max(10).messages({
    "number.base": "minScore debe ser un número",
    "number.min": "minScore debe ser mayor o igual a {#limit}",
    "number.max": "minScore debe ser menor o igual a {#limit}",
  }),
})
  .custom((value, helpers) => {
    if (value.yearFrom && value.yearTo && value.yearTo < value.yearFrom) {
      return helpers.message("yearTo debe ser mayor o igual a yearFrom");
    }
    return value;
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
