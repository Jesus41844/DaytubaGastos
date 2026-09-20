import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const transactionSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  concept: z.string().trim().min(1, "El concepto es obligatorio").max(200),
  category: z.enum(["personal", "agrupacion"]),
  type: z.enum(["expense", "income"]),
  date: isoDate,
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const paydaySchema = z.object({
  date: isoDate,
});

export const settingsSchema = z.object({
  personalQuincenaBudget: z.coerce.number().nonnegative("El límite no puede ser negativo"),
});

export const loginSchema = z.object({
  password: z.string().min(1, "Ingresa tu contraseña"),
});
