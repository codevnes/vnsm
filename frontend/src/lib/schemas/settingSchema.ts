import * as z from "zod";

export const settingSchema = z.object({
  key: z.string()
    .min(2, { message: "Key must be at least 2 characters" })
    .max(100, { message: "Key must be less than 100 characters" })
    .regex(/^[a-z0-9_]+$/, { 
      message: "Key must contain only lowercase letters, numbers, and underscores" 
    }),
  value: z.string()
    .min(1, { message: "Value is required" }),
  description: z.string().nullable().optional(),
  type: z.string()
    .min(1, { message: "Type is required" })
});

export type SettingFormValues = z.infer<typeof settingSchema>; 