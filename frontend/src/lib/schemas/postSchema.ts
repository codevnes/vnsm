import * as z from 'zod';

// Re-use slug regex from category schema or define here
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const postSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters long." }).max(255),
  slug: z.string()
          .regex(slugRegex, { message: "Slug must contain only lowercase letters, numbers, and hyphens." })
          .max(255)
          .optional()
          .nullable(),
  description: z.string().max(500, { message: "Description cannot exceed 500 characters." }).optional().nullable(),
  content: z.string().optional().nullable(), // Allow empty content, add minLength if required
  thumbnail: z.string().url({ message: "Invalid thumbnail URL format." }).optional().nullable(),
  
  // IDs are expected as strings from the form (e.g., from Select components)
  category_id: z.string().min(1, { message: "Category is required." }),
  stock_id: z.string().optional().nullable(), // Optional

  // user_id is handled separately (usually from auth context) but needs to be sent to API
  // It's not part of the user-editable form fields here.
});

// This type represents the values the *form* will manage
export type PostFormValues = z.infer<typeof postSchema>; 