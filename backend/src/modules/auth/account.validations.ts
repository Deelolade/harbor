import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(64, "Name must be 64 characters or less"),
  image: z.string().max(2048, "Image URL too long").optional(),
});

export const changeEmailSchema = z.object({
  newEmail: z.string().min(1, "Email is required").email("Invalid email format"),
});

export const confirmEmailChangeSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const resendVerificationSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
});

export const completeSignupSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  name: z.string().optional(),
  email: z.string().optional(),
});
