import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import Review from "../models/review.model.js";
import { deleteImageService } from "../services/images.services.js";

// Borra los usuarios que crea el runner de Postman (test_<número>@mail.com), sus reseñas y sus fotos.
// Sin --confirm solo muestra qué se borraría
const TEST_EMAIL = /^test_\d+@mail\.com$/;

const cleanupTestUsers = async () => {
  const confirm = process.argv.includes("--confirm");

  try {
    await mongoose.connect(process.env.MONGO_URI);

    const users = await User.find({ email: TEST_EMAIL });
    const userIds = users.map((user) => user._id);
    const reviews = await Review.find({ userId: { $in: userIds } });

    console.log(`Usuarios de prueba: ${users.length}`);
    console.log(`Reseñas de esos usuarios: ${reviews.length}`);

    if (!confirm) {
      console.log("No se borró nada. Para borrar, corré: npm run cleanup -- --confirm");
      return;
    }

    for (const review of reviews) await deleteImageService(review.imagePublicId);
    for (const user of users) await deleteImageService(user.avatarPublicId);

    const deletedReviews = await Review.deleteMany({ userId: { $in: userIds } });
    const deletedUsers = await User.deleteMany({ _id: { $in: userIds } });

    console.log(`Borradas ${deletedReviews.deletedCount} reseñas y ${deletedUsers.deletedCount} usuarios`);
  } catch (error) {
    console.error("Error al limpiar los datos de prueba:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

cleanupTestUsers();
