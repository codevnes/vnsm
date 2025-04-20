export interface Category {
  id: string; // Backend sends BigInt as string
  title: string;
  slug: string;
  description?: string | null;
  thumbnail?: string | null;
  parent_id?: string | null; // Backend sends BigInt as string
  // Add any other fields your backend might return, like createdAt, updatedAt
  createdAt?: string;
  updatedAt?: string;
}

// You might also want a type for the input data when creating/updating
export type CategoryInput = {
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  parent_id?: string | null;
  // Slug might be optional on update if backend handles it
  slug?: string | null;
}; 