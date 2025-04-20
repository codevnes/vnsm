import { z } from "zod";

export const stockFormSchema = z.object({
    // Note: ID is handled separately (present for edit, absent for create)
    symbol: z.string()
        .min(1, { message: "Symbol is required." })
        .max(20, { message: "Symbol cannot exceed 20 characters." })
        .trim()
        .toUpperCase(), // Match backend transformation
    name: z.string()
        .min(1, { message: "Name is required." })
        .max(255, { message: "Name cannot exceed 255 characters." })
        .trim(),
    exchange: z.string()
        .max(100, { message: "Exchange cannot exceed 100 characters." })
        .nullable()
        .optional()
        .transform(val => val?.trim() || null), // Ensure empty string becomes null
    industry: z.string()
        .max(100, { message: "Industry cannot exceed 100 characters." })
        .nullable()
        .optional()
        .transform(val => val?.trim() || null), // Ensure empty string becomes null
});

export type StockFormValues = z.infer<typeof stockFormSchema>; 