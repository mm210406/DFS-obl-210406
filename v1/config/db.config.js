import mongoose from "mongoose";

let connection = null;

// En Vercel cada función arranca a demanda: si la conexión falla no se corta el proceso,
// se vuelve a intentar en el próximo pedido
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (!connection) {
    connection = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
      .then(() => console.log("Conexión a la base de datos establecida"))
      .catch((error) => {
        connection = null;
        console.log("Error al conectarse");
        throw error;
      });
  }

  await connection;
};

export default connectDB;
