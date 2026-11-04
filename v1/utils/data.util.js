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
    return true;
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
    return true;
  } catch (error) {
    console.log(
      `No se pudo crear la reseña de ${user.email} para la película ${tmdbId}: ${error.message}`,
    );
    return false;
  }
};

const createHorrorReview = async (user) => {
  await Genre.updateOne({ tmdbId: HORROR_TMDB_ID }, { allowed: true });

  for (const tmdbId of HORROR_REVIEW.candidates) {
    const created = await createReview(user, { ...HORROR_REVIEW, tmdbId });
    if (created) {
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
      for (const review of client.reviews) {
        await createReview(user, review);
      }
    }

    await createHorrorReview(users.Ana);

    const recommendations = await updateRecommendationsService(users.Bruno._id);
    if (recommendations.available) {
      console.log(`Recomendaciones generadas para ${users.Bruno.email}:`);
      recommendations.items.forEach((item) => console.log(`- ${item.title}`));
    }
  } catch (error) {
    console.error("Error al cargar los datos iniciales:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase();
