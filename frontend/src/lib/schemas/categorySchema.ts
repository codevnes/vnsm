import * as z from 'zod';

// Regex to check if a string looks like a valid slug (lowercase, numbers, hyphens)
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categorySchema = z.object({
  title: z.string().min(1, { message: "Tiêu đề là bắt buộc" }).max(255),
  description: z.string().max(1000).optional().nullable(),
  thumbnail: z.string().url({ message: "Định dạng URL không hợp lệ" }).optional().nullable(),
  // Represent parent_id as string in the form, can be empty or null
  parent_id: z.string().optional().nullable(),
  // Add slug field: optional, but if provided, must match slug format
  slug: z.string()
           .regex(slugRegex, { message: "Đường dẫn chỉ được chứa chữ cái thường, số và dấu gạch ngang." })
           .max(255) // Match typical DB limits
           .optional()
           .nullable(), 
});

export type CategoryFormValues = z.infer<typeof categorySchema>; 