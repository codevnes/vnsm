import * as z from 'zod';

// Regex to check if a string looks like a valid slug (lowercase, numbers, hyphens)
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categorySchema = z.object({
  title: z.string().min(1, { message: "Title is required" }).max(255),
  description: z.string().max(1000).optional().nullable(),
  thumbnail: z.string().url({ message: "Invalid URL format" }).optional().nullable(),
  // Represent parent_id as string in the form, can be empty or null
  parent_id: z.string().optional().nullable(),
  // Add slug field: optional, but if provided, must match slug format
  slug: z.string()
           .regex(slugRegex, { message: "Slug must contain only lowercase letters, numbers, and hyphens." })
           .max(255) // Match typical DB limits
           .optional()
           .nullable(), 
});

export type CategoryFormValues = z.infer<typeof categorySchema>; 