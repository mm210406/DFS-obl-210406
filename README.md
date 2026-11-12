# CineReview API — Obligatorio 1

API REST de reseñas de películas con enfoque family friendly. Hecha con NodeJS, Express, MongoDB (Mongoose), JWT, Joi y bcryptjs, con la arquitectura vista en clase: `routes → middlewares → controllers → services → models`, versionada en `/v1`.

## Cómo funciona

- **Catálogo (API externa TMDB):** las películas salen de TMDB. El catálogo oculta las películas de géneros bloqueados por el admin y las películas para adultos. Se puede filtrar por géneros (`genres`, tmdbIds separados por coma; la película tiene que tener todos) y por año de estreno (`yearFrom`, `yearTo`). Cada película trae `score`, con el promedio y la cantidad de reseñas de CineReview (`null` si no tiene), y además del póster (`posterUrl`) una imagen horizontal (`backdropUrl`).
- **Búsqueda por título (`title`):** la búsqueda de TMDB no filtra por géneros ni por años, así que el backend pide hasta 10 páginas de resultados, saca las películas no permitidas y arma sus propias páginas de 20. Así todas las páginas vienen completas (menos la última) y `totalPages` no cuenta páginas que quedarían vacías.
- **Puntaje CineReview (`minScore`):** TMDB no conoce las reseñas de CineReview, así que con este filtro las películas salen de las reseñas guardadas en MongoDB: se agrupan por película, se filtran por promedio, géneros, años y título, y se ordenan por promedio. Solo aparecen películas que ya tienen reseñas. Para esto cada reseña guarda el año de estreno y el póster de la película.
- **Top 10:** las 10 películas con mejor promedio entre las reseñas hechas en los últimos 30 días. Si hay empate en el promedio, gana la que tiene más reseñas. La #1 trae además su imagen horizontal (`backdropUrl`).
- **Géneros (categorías):** son los géneros de TMDB, identificados por `tmdbId`. El admin consulta la lista de TMDB y crea los que quiere ofrecer, con nombre e ícono opcionales. El catálogo solo muestra películas cuyos géneros estén todos creados y permitidos (`allowed`). No se puede borrar un género con reseñas; para dejar de permitirlo se deshabilita. Si el usuario reseñó una película que después quedó bloqueada, puede seguir viendo su detalle.
- **Reseñas (documento principal):** el usuario elige una película del catálogo por su `tmdbId`. El backend trae el título, la sinopsis y los géneros de TMDB y rechaza la reseña si la película no está permitida. Una reseña por película. Las reseñas son públicas: en el detalle de una película se ven las de todos los usuarios (solo el nombre y la foto del autor), pero cada usuario solo puede modificar o eliminar las suyas.
- **Planes:** PLUS permite 4 reseñas y PREMIUM, ilimitadas. El admin no gestiona planes.
- **IA (Groq):** al crear una reseña se generan recomendaciones a partir de las reseñas del usuario. Cada recomendación se verifica contra el catálogo permitido. Si la IA no está disponible, la reseña se guarda igual.
- **Límite de solicitudes:** cada IP puede hacer hasta 300 solicitudes a `/v1` cada 15 minutos, hasta 10 intentos de login fallidos y hasta 20 registros fallidos cada 15 minutos (los exitosos no cuentan). Al superarlo se responde 429. El límite del registro evita que se use para averiguar en masa qué emails tienen cuenta.
- **Imágenes (Cloudinary):** la imagen se sube junto con la reseña, en el mismo request (form-data, campo `imagen`, hasta 4 MB). Solo se sube a Cloudinary después de validar la reseña, y se borra de Cloudinary si se reemplaza o se elimina la reseña. Si una reseña no tiene imagen, se usa el póster de TMDB. Para quitar la foto de una reseña se manda `removeImage: true` en la modificación: se borra de Cloudinary y la reseña vuelve a mostrar el póster. Las reseñas públicas de una película traen `hasImage` para saber si la imagen es una foto del usuario o el póster.
- **Foto de perfil:** cada usuario puede subir una foto (form-data, campo `imagen`, hasta 4 MB). Se guarda en Cloudinary recortada a 400x400, centrada en la cara. Al reemplazarla o eliminarla, la anterior se borra de Cloudinary. Se devuelve como `avatarUrl` en los datos del usuario (vacío si no tiene).

## Puesta en marcha

1. `npm install` (incluye `express-rate-limit`)
2. `npm run seed` — carga los datos de prueba (ver abajo). Necesita `MONGO_URI`, `TMDB_API_KEY` y `GROQ_API_KEY`. Se puede correr más de una vez sin duplicar datos.
3. `npm run backfill` — solo si la base tiene reseñas creadas antes de que se guardaran el año de estreno y el póster. Los completa desde TMDB; se puede correr más de una vez.
4. `npm run dev`

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
| GET | `/v1/users/me/stats` | Usuario | Cantidad de reseñas, promedio, género favorito y reseñas por género |
| PATCH | `/v1/users/plan` | Usuario | Cambio de PLUS a PREMIUM |
| PUT | `/v1/users/me/avatar` | Usuario | Sube o reemplaza la foto de perfil (form-data, campo `imagen`) |
| DELETE | `/v1/users/me/avatar` | Usuario | Elimina la foto de perfil |
| GET | `/v1/movies?page=&title=&genres=&yearFrom=&yearTo=&minScore=` | Usuario | Catálogo de películas permitidas, con filtros, puntaje CineReview y si el usuario ya la reseñó (`reviewedByMe`, con su puntaje en `myPoints`) |
| GET | `/v1/movies/top` | Usuario | Top 10 de los últimos 30 días |
| GET | `/v1/movies/:tmdbId` | Usuario | Detalle de una película, con su puntaje CineReview (`score`) |
| GET | `/v1/movies/:tmdbId/reviews?page=&limit=` | Usuario | Reseñas de todos los usuarios para esa película, paginadas, y la del usuario aparte en `myReview` (`null` si no la reseñó) |
| GET | `/v1/reviews?page=&limit=&genreId=&pointsFrom=&pointsTo=&title=` | Usuario | Reseñas propias, paginadas y filtradas (puntaje entre `pointsFrom` y `pointsTo`, inclusive) |
| GET | `/v1/reviews/:id` | Usuario | Una reseña propia |
| POST | `/v1/reviews` | Usuario | Alta: `tmdbId`, `description`, `points` (JSON o form-data) y archivo `imagen` opcional |
| PATCH | `/v1/reviews/:id` | Usuario | Modifica `description`, `points` y/o reemplaza el archivo `imagen`; `removeImage: true` quita la foto |
| DELETE | `/v1/reviews/:id` | Usuario | Baja |
| GET | `/v1/genres`, `/v1/genres/:id` | Usuario | Consulta de géneros |
| GET | `/v1/genres/tmdb` | Admin | Géneros de TMDB e indica cuáles ya están creados |
| POST | `/v1/genres` | Admin | Alta: `{ tmdbId, name?, allowed?, icon? }` |
| PATCH | `/v1/genres/:id` | Admin | Modifica `name`, `allowed` o `icon` |
| DELETE | `/v1/genres/:id` | Admin | Baja (409 si tiene reseñas) |
