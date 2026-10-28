import {
  getProfileService,
  upgradePlanService,
  updateAvatarService,
  deleteAvatarService,
} from "../services/users.services.js";

export const getProfile = async (req, res) => {
  const profile = await getProfileService(req.user.userId);
  res.json(profile);
};

export const upgradePlan = async (req, res) => {
  const result = await upgradePlanService(req.user.userId);

  res.json({
    mensaje: "Plan actualizado",
    token: result.token,
    user: result.user,
  });
};

export const updateAvatar = async (req, res) => {
  const user = await updateAvatarService(req.user.userId, req.file);
  res.json({ mensaje: "Foto de perfil actualizada", user });
};

export const deleteAvatar = async (req, res) => {
  const user = await deleteAvatarService(req.user.userId);
  res.json({ mensaje: "Foto de perfil eliminada", user });
};
