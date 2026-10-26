export const validateBodyMiddleware = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body ?? {}, { abortEarly: false });
  if (error) {
    const details = error.details.map(({ message, path }) => ({ message, path }));
    return res.status(400).json({ mensaje: "Error de validación", error: { details } });
  }
  req.validatedBody = value;
  next();
};
