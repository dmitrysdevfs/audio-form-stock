import { z } from 'zod';

export const FormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().optional(),
});

export type FormData = z.infer<typeof FormSchema>;
