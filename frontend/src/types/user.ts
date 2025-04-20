// Basic User type definition
export enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  USER = 'user'
}

export interface User {
    id: string; // Assuming BigInt serialized to string
    full_name: string;
    email: string;
    role: Role;
    avatarUrl?: string | null;
    createdAt?: string;
    updatedAt?: string;
    phone?: string | null;
    verified?: boolean;
    _source?: string; // For tracking data source (API or token)
} 