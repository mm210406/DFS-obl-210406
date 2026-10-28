import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const buildAuthResponse = (user) => {
  const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return {
    token,
    user: {
      name: user.name,
      email: user.email,
      plan: user.plan,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
  };
};

export const registerService = async (data) => {
  const email = data.email.toLowerCase();

  if (await User.findOne({ email })) {
    const e = new Error("El email ya está registrado");
    e.status = 409;
    throw e;
  }

  const password = await bcrypt.hash(data.password, Number(process.env.SALT_ROUNDS) || 10);
  const user = await User.create({ name: data.name, email, password });

  return buildAuthResponse(user);
};

export const loginService = async (data) => {
  const user = await User.findOne({ email: data.email.toLowerCase() });

  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    const e = new Error("Credenciales inválidas");
    e.status = 401;
    throw e;
  }

  return buildAuthResponse(user);
};
