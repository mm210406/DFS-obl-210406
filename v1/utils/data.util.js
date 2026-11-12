import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Genre from "../models/genre.model.js";
import Review from "../models/review.model.js";
import { getMovieService } from "../services/movies.services.js";
import { updateRecommendationsService } from "../services/recommendations.services.js";

const HORROR_TMDB_ID = 27;
const CLIENT_PASSWORD = "Cliente123";

const GENRES = [
  { tmdbId: 16, name: "Animación", icon: "🎨" },
  { tmdbId: 12, name: "Aventura", icon: "🧭" },
  { tmdbId: 35, name: "Comedia", icon: "😂" },
  { tmdbId: 10751, name: "Familia", icon: "👨‍👩‍👧" },
  { tmdbId: 14, name: "Fantasía", icon: "🧚" },
  { tmdbId: 18, name: "Drama", icon: "🎭" },
  { tmdbId: 878, name: "Ciencia ficción", icon: "🚀" },
  { tmdbId: 10402, name: "Música", icon: "🎵" },
  { tmdbId: HORROR_TMDB_ID, name: "Terror", icon: "👻" },
];

const CLIENTS = [
  {
    name: "Ana",
    email: "ana@cinereview.com",
    plan: "PREMIUM",
    target: 20,
    reviews: [
      {
        tmdbId: 354912,
        points: 10,
        description: "Una historia hermosa sobre la familia y la memoria.",
      },
      {
        tmdbId: 14160,
        points: 9,
        description: "Los primeros minutos son de las mejores escenas del cine animado.",
      },
      { tmdbId: 862, points: 8, description: "Un clásico que se disfruta a cualquier edad." },
      {
        tmdbId: 150540,
        points: 9,
        description: "Explica las emociones de una forma muy original.",
      },
      {
        tmdbId: 129,
        points: 9,
        description: "Un mundo mágico lleno de detalles: cada vez que la veo descubro algo nuevo.",
      },
      { tmdbId: 8392, points: 8, description: "Tranquila y tierna, perfecta para los más chicos." },
      {
        tmdbId: 346648,
        points: 9,
        description: "Graciosísima y con un corazón enorme. Me gustó más que la primera.",
      },
      {
        tmdbId: 568124,
        points: 8,
        description: "Las canciones se nos quedaron pegadas a todos en casa.",
      },
      {
        tmdbId: 10681,
        points: 9,
        description: "Casi sin palabras cuenta una historia preciosa sobre cuidar el planeta.",
      },
      {
        tmdbId: 2062,
        points: 8,
        description: "Una historia sobre animarse a cumplir los sueños, con mucho humor.",
      },
      {
        tmdbId: 585,
        points: 8,
        description: "Sully y Boo forman una de las parejas más tiernas del cine animado.",
      },
      {
        tmdbId: 10193,
        points: 9,
        description: "El final me hizo llorar. Cierra la historia de una forma perfecta.",
      },
      {
        tmdbId: 508442,
        points: 7,
        description: "Linda reflexión sobre disfrutar la vida; a los chicos les costó seguirla.",
      },
      {
        tmdbId: 1184918,
        points: 8,
        description: "Una robot que aprende a cuidar a un pichón: emocionante y muy bien animada.",
      },
      {
        tmdbId: 277834,
        points: 8,
        description: "Una aventura en el mar con una protagonista decidida y muy buena música.",
      },
      {
        tmdbId: 508943,
        points: 7,
        description: "Un verano lleno de amistad. Sencilla pero encantadora.",
      },
      {
        tmdbId: 12,
        points: 8,
        description: "Divertida de principio a fin; Dory se roba todas las escenas.",
      },
      {
        tmdbId: 16859,
        points: 8,
        description: "Una historia sobre crecer y confiar en una misma, con mucha ternura.",
      },
      {
        tmdbId: 920,
        points: 6,
        description: "Entretenida para los chicos, aunque a mí se me hizo un poco larga.",
      },
      {
        tmdbId: 502356,
        points: 6,
        description: "Muy colorida y rápida, pero la historia es bastante simple.",
      },
      {
        tmdbId: 1022789,
        points: 8,
        description: "Una buena continuación, con emociones nuevas muy bien pensadas.",
      },
      {
        tmdbId: 671,
        points: 8,
        description: "El comienzo de la magia. Ideal para ver con chicos de más de 8 años.",
      },
      {
        tmdbId: 335797,
        points: 7,
        description: "Muchas canciones conocidas y personajes simpáticos.",
      },
      {
        tmdbId: 301528,
        points: 7,
        description: "Tiene momentos lindos, aunque la saga ya estaba bien cerrada.",
      },
    ],
  },
  {
    name: "Carla",
    email: "carla@cinereview.com",
    plan: "PLUS",
    reviews: [
      {
        tmdbId: 109445,
        points: 7,
        description: "Buenas canciones, aunque la historia es un poco previsible.",
      },
      {
        tmdbId: 277834,
        points: 8,
        description: "Visualmente increíble y con una protagonista muy valiente.",
      },
      {
        tmdbId: 269149,
        points: 9,
        description: "Divertida y con un mensaje muy claro sobre los prejuicios.",
      },
      { tmdbId: 116149, points: 8, description: "Tierna y graciosa, ideal para ver en familia." },
    ],
  },
  {
    name: "Bruno",
    email: "bruno@cinereview.com",
    plan: "PLUS",
    reviews: [
      { tmdbId: 10681, points: 10, description: "Casi sin diálogos y aun así emociona muchísimo." },
      { tmdbId: 2062, points: 9, description: "Me dieron ganas de cocinar apenas terminó." },
      { tmdbId: 12, points: 8, description: "Una aventura en el océano muy entretenida." },
    ],
  },
];

// Familias que reseñan las mismas películas con puntajes distintos, para que el Top 10 sea variado
const FAMILY_CLIENTS = [
  {
    name: "Lucía",
    email: "lucia@cinereview.com",
    plan: "PREMIUM",
    reviews: [[354912, 10], [14160, 10], [862, 9], [2062, 8], [12, 7], [568124, 8], [10193, 8]],
  },
  {
    name: "Mateo",
    email: "mateo@cinereview.com",
    plan: "PLUS",
    reviews: [[354912, 9], [10681, 9], [862, 10], [277834, 8]],
  },
  {
    name: "Valentina",
    email: "valentina@cinereview.com",
    plan: "PREMIUM",
    reviews: [[354912, 10], [129, 10], [346648, 8], [277834, 7], [109445, 6], [8392, 7]],
  },
  {
    name: "Joaquín",
    email: "joaquin@cinereview.com",
    plan: "PLUS",
    reviews: [[14160, 10], [150540, 8], [568124, 9]],
  },
  {
    name: "Sofía",
    email: "sofia@cinereview.com",
    plan: "PREMIUM",
    reviews: [
      [354912, 10],
      [150540, 10],
      [2062, 8],
      [568124, 7],
      [508943, 8],
      [502356, 7],
      [10193, 9],
    ],
  },
  {
    name: "Martín",
    email: "martin@cinereview.com",
    plan: "PLUS",
    reviews: [[129, 9], [862, 8], [2062, 8], [269149, 7]],
  },
  {
    name: "Camila",
    email: "camila@cinereview.com",
    plan: "PREMIUM",
    reviews: [[14160, 9], [150540, 9], [2062, 9], [568124, 7], [1184918, 7], [508442, 8]],
  },
  {
    name: "Diego",
    email: "diego@cinereview.com",
    plan: "PLUS",
    reviews: [[10681, 9], [862, 9], [346648, 8], [269149, 7]],
  },
  {
    name: "Florencia",
    email: "florencia@cinereview.com",
    plan: "PREMIUM",
    reviews: [[10681, 10], [129, 9], [346648, 9], [109445, 5], [920, 6], [585, 8]],
  },
  {
    name: "Tomás",
    email: "tomas@cinereview.com",
    plan: "PLUS",
    reviews: [[10681, 9], [150540, 9], [277834, 9]],
  },
];

const FAMILY_COMMENTS = [
  {
    minPoints: 9,
    texts: [
      "Nos encantó a todos en casa. Ya la vimos dos veces.",
      "Emocionante de principio a fin, una de nuestras favoritas.",
      "Hermosa. Los chicos no despegaron los ojos de la pantalla.",
      "Divertida, tierna y con un gran mensaje. Muy recomendable.",
    ],
  },
  {
    minPoints: 7,
    texts: [
      "Muy linda para ver en familia, aunque tiene algún momento lento.",
      "Entretenida y con buenos personajes. Los chicos se rieron mucho.",
      "Buena historia y muy bien animada.",
      "La disfrutamos, aunque no está entre nuestras favoritas.",
    ],
  },
  {
    minPoints: 1,
    texts: [
      "Está bien para pasar el rato, pero no nos atrapó.",
      "Tiene momentos lindos, aunque la historia se hace larga.",
      "A los más chicos les gustó; a los grandes no tanto.",
    ],
  },
];

const getFamilyComment = (points, index) => {
  const { texts } = FAMILY_COMMENTS.find((comments) => points >= comments.minPoints);
  return texts[index % texts.length];
};

const toFamilyReviews = (reviews, offset) =>
  reviews.map(([tmdbId, points], index) => ({
    tmdbId,
    points,
    description: getFamilyComment(points, offset + index),
  }));

const HORROR_REVIEW = {
  candidates: [257445, 71689, 9297, 77174],
  points: 7,
  description: "Da un poco de miedo, pero es más divertida que terrorífica.",
};

const createAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || "admin@cinereview.com";
  const password = process.env.ADMIN_PASSWORD || "Admin123";

  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    console.log(`El admin ${email} ya existe`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS) || 10);
  await User.create({
    name: "Administrador",
    email,
    password: hashedPassword,
    role: "ADMIN",
    plan: "PREMIUM",
  });
  console.log(`Admin creado: ${email}`);
};

const createGenres = async () => {
  let createdCount = 0;

  for (const genre of GENRES) {
    const existingGenre = await Genre.findOne({ tmdbId: genre.tmdbId });
    if (!existingGenre) {
      await Genre.create(genre);
      createdCount++;
    }
  }

  console.log(`Géneros creados: ${createdCount} (ya existían ${GENRES.length - createdCount})`);
};

const createClient = async ({ name, email, plan }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log(`El cliente ${email} ya existe`);
    return existingUser;
  }

  const hashedPassword = await bcrypt.hash(CLIENT_PASSWORD, Number(process.env.SALT_ROUNDS) || 10);
  const user = await User.create({ name, email, password: hashedPassword, plan });
  console.log(`Cliente creado: ${email}`);
  return user;
};

const createReview = async (user, { tmdbId, points, description }) => {
  const alreadyReviewed = await Review.findOne({ userId: user._id, tmdbId });
  if (alreadyReviewed) {
    console.log(`${user.email} ya reseñó la película ${tmdbId}`);
    return "exists";
  }

  try {
    const movie = await getMovieService(tmdbId);
    await Review.create({
      userId: user._id,
      tmdbId: movie.tmdbId,
      movieTitle: movie.title,
      synopsis: movie.overview,
      genres: movie.genres.map((genre) => genre._id),
      releaseDate: movie.releaseDate || "",
      posterUrl: movie.posterUrl,
      description,
      points,
      imageUrl: movie.posterUrl,
    });
    console.log(`Reseña creada: ${user.email} - ${movie.title}`);
    return "created";
  } catch (error) {
    console.log(
      `No se pudo crear la reseña de ${user.email} para la película ${tmdbId}: ${error.message}`,
    );
    return "failed";
  }
};

// Crea reseñas hasta que el usuario tenga "target"; si una película falla, sigue con la próxima
const createReviews = async (user, reviews, target = reviews.length) => {
  let count = await Review.countDocuments({ userId: user._id });

  for (const review of reviews) {
    if (count >= target) break;
    if ((await createReview(user, review)) === "created") count++;
  }

  console.log(`${user.email} tiene ${count} reseñas`);
};

const createHorrorReview = async (user) => {
  await Genre.updateOne({ tmdbId: HORROR_TMDB_ID }, { allowed: true });

  for (const tmdbId of HORROR_REVIEW.candidates) {
    const result = await createReview(user, { ...HORROR_REVIEW, tmdbId });
    if (result !== "failed") {
      console.log(`Película de terror usada: ${tmdbId}`);
      break;
    }
  }

  await Genre.updateOne({ tmdbId: HORROR_TMDB_ID }, { allowed: false });
  console.log("Terror deshabilitado");
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await createAdmin();
    await createGenres();

    const users = {};
    for (const client of CLIENTS) {
      const user = await createClient(client);
      users[client.name] = user;
      await createReviews(user, client.reviews, client.target);
    }

    await createHorrorReview(users.Ana);

    let offset = 0;
    for (const client of FAMILY_CLIENTS) {
      const user = await createClient(client);
      await createReviews(user, toFamilyReviews(client.reviews, offset));
      offset += client.reviews.length;
    }

    for (const user of [users.Bruno, users.Ana]) {
      const recommendations = await updateRecommendationsService(user._id);
      if (recommendations.available) {
        console.log(`Recomendaciones generadas para ${user.email}:`);
        recommendations.items.forEach((item) => console.log(`- ${item.title}`));
      }
    }
  } catch (error) {
    console.error("Error al cargar los datos iniciales:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase();
