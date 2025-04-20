import { PrismaClient, Role } from '../generated/prisma';

const prisma = new PrismaClient();

/**
 * Get a user by ID
 * @param userId - The user ID to look up
 * @returns The user object without password
 */
export const getUserById = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(userId),
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        thumbnail: true,
        verified: true,
        // Exclude password for security
      },
    });

    if (!user) {
      return null;
    }

    // Convert BigInt ID to string for JSON serialization
    return {
      ...user,
      id: user.id.toString(),
    };
  } catch (error) {
    console.error('Error in getUserById:', error);
    throw error;
  }
};

/**
 * Get a user by email
 * @param email - The email to look up
 * @returns The user object including password for auth
 */
export const getUserByEmail = async (email: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return null;
    }

    // Convert BigInt ID to string for JSON serialization
    return {
      ...user,
      id: user.id.toString(),
    };
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    throw error;
  }
};

/**
 * Create a new user
 * @param userData - The user data to create
 * @returns The created user object without password
 */
export const createUser = async (userData: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: Role;
}) => {
  try {
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        thumbnail: true,
        verified: true,
        // Exclude password for security
      },
    });

    // Convert BigInt ID to string for JSON serialization
    return {
      ...user,
      id: user.id.toString(),
    };
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
}; 