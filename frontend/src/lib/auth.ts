/**
 * Auth utility exports
 * 
 * This file serves as a centralized point for auth-related utilities,
 * re-exporting from the AuthContext for better organization.
 */

// Re-export useAuth hook for components to use
export { useAuth, AuthProvider } from '@/contexts/AuthContext';

// Export types if needed
export type { User } from '@/types/user'; 