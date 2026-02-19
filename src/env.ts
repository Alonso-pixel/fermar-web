import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  RESEND_API_KEY: z.string().min(1).optional(),
  OWNER_EMAIL: z.string().email().optional(),
  ADMIN_USERNAME: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  OWNER_EMAIL: process.env.OWNER_EMAIL,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
});
