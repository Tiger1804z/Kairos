import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address");

const passwordField = z
  .string()
  .min(12, "Password must be at least 12 characters");

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  first_name: z.string().trim().min(2, "First name must be at least 2 characters"),
  last_name: z.string().trim().min(2, "Last name must be at least 2 characters"),
  email: emailField,
  password: passwordField,
  role: z.enum(["owner", "employee"]).optional(),
});
