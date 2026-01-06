import prisma from "../prisma/prisma";
import bcrypt from "bcrypt";
import { Prisma } from "../../generated/prisma/client";

const SALT_ROUNDS = 10;

//  SELECT safe (ne jamais renvoyer password_hash)
const userSafeSelect = {
  id_user: true,
  first_name: true,
  last_name: true,
  email: true,
  role: true,
  is_active: true,
  last_login_at: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.UserSelect;

/**
 * ADMIN ONLY
 * Liste tous les users (sans password_hash)
 */
export const listUsersAdminService = async () => {
  return prisma.user.findMany({
    select: userSafeSelect,
    orderBy: { created_at: "desc" },
  });
};

/**
 * Créer un user (signup/admin-create)
 * - valide unicité email
 * - hash password
 */
export const createUserService = async (data: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role?: "admin" | "owner" | "employee"; // optionnel si signup => owner par défaut
}) => {
  const { first_name, last_name, email, password } = data;
  const role = data.role ?? "owner";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("USER_ALREADY_EXISTS");

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  return prisma.user.create({
    data: { first_name, last_name, email, password_hash, role },
    select: userSafeSelect,
  });
};

/**
 * Get user by id
 * - safe select
 * - businesses inclus (safe)
 */
export const getUserByIdService = async (id: number) => {
  return prisma.user.findUnique({
    where: { id_user: id },
    select: {
      ...userSafeSelect,
      businesses: {
        select: {
          id_business: true,
          name: true,
          business_type: true,
          city: true,
          country: true,
          currency: true,
          timezone: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        },
      },
    },
  });
};

/**
 * Update user
 * - password => hash
 * - role strict
 * - email unique check si modifié
 */
export const updateUserByIdService = async (
  id: number,
  data: Partial<{
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: "admin" | "owner" | "employee";
    is_active: boolean;
  }>
) => {
  // email unique si changé
  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id_user !== id) throw new Error("EMAIL_ALREADY_USED");
  }

  const updateData: Prisma.UserUpdateInput = {};

  if (data.first_name !== undefined) updateData.first_name = data.first_name;
  if (data.last_name !== undefined) updateData.last_name = data.last_name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  if (data.password) {
    updateData.password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  return prisma.user.update({
    where: { id_user: id },
    data: updateData,
    select: userSafeSelect,
  });
};

/**
 * Delete user (admin only en général)
 */
export const deleteUserByIdService = async (id: number) => {
  const user = await prisma.user.findUnique({ where: { id_user: id } });
  if (!user) throw new Error("USER_NOT_FOUND");

  await prisma.user.delete({ where: { id_user: id } });
  return { message: "USER_DELETED" };
};
