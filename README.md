# CineReview API — Obligatorio 1

API REST de reseñas de películas con enfoque family friendly. Hecha con NodeJS, Express, MongoDB (Mongoose), JWT, Joi y bcryptjs, con la arquitectura vista en clase: `routes → middlewares → controllers → services → models`, versionada en `/v1`.

## Cómo funciona

- **Catálogo (API externa TMDB):** las películas salen de TMDB. El catálogo oculta las películas de géneros bloqueados por el admin y las películas para adultos.
- **Géneros (categorías):** son los géneros de TMDB, identificados por `tmdbId`. El admin consulta la lista de TMDB y crea los que quiere ofrecer, con nombre e ícono opcionales. El catálogo solo muestra películas cuyos géneros estén todos creados y permitidos (`allowed`). No se puede borrar un género con reseñas; para dejar de permitirlo se deshabilita. Si el usuario reseñó una película que después quedó bloqueada, puede seguir viendo su detalle.
- **Reseñas (documento principal):** el usuario elige una película del catálogo por su `tmdbId`. El backend trae el título, la sinopsis y los géneros de TMDB y rechaza la reseña si la película no está permitida. Una reseña por película.
- **Planes:** PLUS permite 4 reseñas y PREMIUM, ilimitadas. El admin no gestiona planes.
- **IA (Groq):** al crear una reseña se generan recomendaciones a partir de las reseñas del usuario. Cada recomendación se verifica contra el catálogo permitido. Si la IA no está disponible, la reseña se guarda igual.
- **Imágenes (Cloudinary):** la imagen se sube junto con la reseña, en el mismo request (form-data, campo `imagen`, hasta 4 MB). Solo se sube a Cloudinary después de validar la reseña, y se borra de Cloudinary si se reemplaza o se elimina la reseña. Si una reseña no tiene imagen, se usa el póster de TMDB.

## Puesta en marcha

1. `npm install`
2. `npm run seed` — carga los datos de prueba (ver abajo). Necesita `MONGO_URI`, `TMDB_API_KEY` y `GROQ_API_KEY`. Se puede correr más de una vez sin duplicar datos.
3. `npm run dev`

## Datos de prueba (seed)

- **Géneros creados:** Animación, Aventura, Comedia, Familia, Fantasía, Drama, Ciencia ficción, Música y Terror (deshabilitado). El resto de los géneros de TMDB quedan sin crear.
- **Admin:** `admin@cinereview.com` / `Admin123` (o los valores de `ADMIN_EMAIL` / `ADMIN_PASSWORD`).
- **Clientes** (contraseña `Cliente123`):
  - `ana@cinereview.com` — PREMIUM, 4 reseñas y una de terror hecha antes de deshabilitar Terror.
  - `carla@cinereview.com` — PLUS, 4 reseñas (llegó al límite).
  - `bruno@cinereview.com` — PLUS, 3 reseñas y recomendaciones generadas por la IA.

## Rutas

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/v1/auth/register` | Pública | Registro (CLIENT, plan PLUS) con autologin |
| POST | `/v1/auth/login` | Pública | Login |
| GET | `/v1/users/me` | Usuario | Perfil, uso del plan y recomendaciones |
| PATCH | `/v1/users/plan` | Usuario | Cambio de PLUS a PREMIUM |
| GET | `/v1/movies?page=&title=` | Usuario | Catálogo de películas permitidas |
| GET | `/v1/movies/:tmdbId` | Usuario | Detalle de una película |
| GET | `/v1/reviews?page=&limit=&genreId=&points=&title=` | Usuario | Reseñas propias, paginadas y filtradas |
| GET | `/v1/reviews/:id` | Usuario | Una reseña propia |
| POST | `/v1/reviews` | Usuario | Alta: `tmdbId`, `description`, `points` (JSON o form-data) y archivo `imagen` opcional |
| PATCH | `/v1/reviews/:id` | Usuario | Modifica `description`, `points` y/o reemplaza el archivo `imagen` |
| DELETE | `/v1/reviews/:id` | Usuario | Baja |
| GET | `/v1/genres`, `/v1/genres/:id` | Usuario | Consulta de géneros |
| GET | `/v1/genres/tmdb` | Admin | Géneros de TMDB e indica cuáles ya están creados |
| POST | `/v1/genres` | Admin | Alta: `{ tmdbId, name?, allowed?, icon? }` |
| PATCH | `/v1/genres/:id` | Admin | Modifica `name`, `allowed` o `icon` |
| DELETE | `/v1/genres/:id` | Admin | Baja (409 si tiene reseñas) |
