// Sử dụng đường dẫn tuyệt đối để tránh vấn đề khi build
import { PrismaClient, Prisma } from '@prisma/client';
// Role là một enum trong namespace Prisma
type Role = Prisma.UserCreateInput['role'];

const prisma = new PrismaClient();

/**
 * Get a user by ID
 * @param userId - The user ID to look up
 * @returns The user object without password
 */
export const getUserById = async (userId: string) => {
  try {
    console.log('getUserById called with userId:', userId);
    
    // Add a try-catch for the BigInt conversion specifically
    let bigIntId;
    try {
      // Ensure userId is a clean numeric string (remove any non-numeric characters)
      const cleanUserId = userId.replace(/[^0-9]/g, '');
      
      if (!cleanUserId) {
        console.error('Invalid userId format for BigInt conversion');
        return null;
      }
      
      bigIntId = BigInt(cleanUserId);
      console.log('Converted to BigInt successfully:', bigIntId.toString());
    } catch (conversionError) {
      console.error('Failed to convert userId to BigInt:', conversionError);
      return null;
    }
    
    // Try to find the user with exact ID match first
    let user = await prisma.user.findUnique({
      where: {
        id: bigIntId,
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

    console.log('User lookup result:', user ? 'User found' : 'User not found');

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