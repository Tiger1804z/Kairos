import prisma from "../prisma/prisma";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";

type LoginInput = {
  email: string;
  password: string;
};

type SignupInput = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role?: "admin" | "owner" | "employee";
};

/**
 * =========================
 * AUTH — JWT helpers
 * =========================
 * JWT_SECRET doit être défini dans .env
 * JWT_EXPIRES_IN optionnel (ex: "7d")
 */
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

// Crash au boot si mal configuré (c’est ce que tu veux en prod/dev)
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

const signToken = (payload: { user_id: number; role: string; email: string }) => {
  type ExpiresIn = Exclude<SignOptions["expiresIn"], undefined>;

  // ici JWT_EXPIRES_IN est toujours un string (grâce au ?? "7d")
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as ExpiresIn,
  };

  return jwt.sign(payload, JWT_SECRET, options);
};


/**
 * AUTH — Signup
 * - Crée un user
 * - Retourne token + user (sans password_hash)
 */
export const signupService = async (data: SignupInput) => {
  const { first_name, last_name, email, password } = data;
  const role = data.role ?? "owner";

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    // 409 conflict (à mapper dans controller)
    throw new Error("EMAIL_ALREADY_USED");
  }

  const password_hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      first_name,
      last_name,
      email,
      password_hash,
      role,
    },
  });

  const token = signToken({ user_id: user.id_user, role: user.role, email: user.email });

  // ne jamais retourner password_hash
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash: _pw, ...safeUser } = user;

  return { token, user: safeUser };
};

/**
 * AUTH — Login
 * - Vérifie email + password
 * - Retourne token + user (sans password_hash)
 */
export const loginService = async (data: LoginInput) => {
  const { email, password } = data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // 401
    throw new Error("INVALID_CREDENTIALS");
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    // 401
    throw new Error("INVALID_CREDENTIALS");
  }

  await prisma.user.update({
    where: { id_user: user.id_user },
    data: { last_login_at: new Date() },
  });

  const token = signToken({ user_id: user.id_user, role: user.role, email: user.email });

  const { password_hash: _pw, ...safeUser } = user;

  return { token, user: safeUser };
};

