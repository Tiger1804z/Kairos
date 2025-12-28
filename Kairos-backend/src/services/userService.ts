
import prisma from "../prisma/prisma";
import bcrypt from "bcrypt";

export const getAllUsers = async () => {
  return prisma.user.findMany();
};

export const createNewUser = async (data: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: "admin" | "owner" | "employee";
}) => {

  const { first_name, last_name, email, password, role } = data;

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("User already exists");

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Store in DB
  return prisma.user.create({
    data: {
      first_name,
      last_name,
      email,
      password_hash,
      role,
    },
  });
};

export const getUserById = async (id: number) => {
  const user = await prisma.user.findUnique({ where: { id_user: id },include: {businesses: true } });
  return user;
};



export const updateUserService = async (
  id: number,
  data: Partial<{
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: string;
  }>
) => {
  const updateData: any = { ...data };

  if (data.password) {
    updateData.password_hash = await bcrypt.hash(data.password, 10);
    delete updateData.password; // important pour ne pas stocker en clair
  }

  return prisma.user.update({
    where: { id_user: id },
    data: updateData,
  });
};

export const deleteUserService = async (id: number) => {
  const user = await prisma.user.findUnique({ where: { id_user: id } });
  if (!user) {
    throw new Error("User not found");
  }
  await prisma.user.delete({ where: { id_user: id } });
  return {message : "User deleted successfully"};
}