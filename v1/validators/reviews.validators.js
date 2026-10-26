import Joi from "joi";
import { objectIdRule } from "./common.validators.js";

const descriptionRule = Joi.string().trim().min(3).max(2000).messages({
  "string.base": "La reseña debe ser un texto",
  "string.empty": "La reseña no puede estar vacía",
  "string.min": "La reseña debe tener al menos {#limit} caracteres",
  "string.max": "La reseña no puede tener más de {#limit} caracteres",
  "any.required": "La reseña es obligatoria",
});

const pointsRule = Joi.number().integer().min(1).max(10).messages({
  "number.base": "El puntaje debe ser un número",
  "number.integer": "El puntaje debe ser un número entero",
  "number.min": "El puntaje debe ser como mínimo {#limit}",
  "number.max": "El puntaje debe ser como máximo {#limit}",
  "any.required": "El puntaje es obligatorio",
});

const unknownFieldMessage = { "object.unknown": "No se permite el campo {#label}" };

export const createReviewSchema = Joi.object({
  tmdbId: Joi.number().integer().min(1).required().messages({
    "number.base": "El id de la película debe ser un número",
    "number.integer": "El id de la película debe ser un número entero",
    "number.min": "El id de la película debe ser mayor a 0",
    "any.required": "El id de la película es obligatorio",
  }),
  description: descriptionRule.required(),
  points: pointsRule.required(),
}).messages(unknownFieldMessage);

export const updateReviewSchema = Joi.object({
  description: descriptionRule,
  points: pointsRule,
}).messages(unknownFieldMessage);

export const reviewsQuerySchema = Joi.object({
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
  genreId: objectIdRule.messages({
    "string.hex": "genreId debe ser un id válido",
    "string.length": "genreId debe ser un id válido",
  }),
  points: pointsRule,
  title: Joi.string().trim().max(100).messages({
    "string.max": "El título no puede tener más de {#limit} caracteres",
  }),
});
