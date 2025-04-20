import { Request, Response } from 'express';
import prisma from '../lib/prisma'; // Import Prisma client
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getUserByEmail, createUser, getUserById } from '../services/userService';
// import { Role } from '@prisma/client'; // Import Role enum - Removed as it's not directly needed here

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
// const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'; // Keep using numeric for now

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
    process.exit(1);
}

// Controller function for user registration
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password, full_name, phone } = req.body;

    try {
        // Check if user already exists
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            res.status(400).json({ message: 'User with this email already exists' });
            return;
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user with hashed password
        const user = await createUser({
            email,
            password: hashedPassword,
            full_name,
            phone,
            // Default role is 'user', set in the schema
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'An error occurred during registration' });
    }
};

// Controller function for user login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
        // Find the user
        const user = await getUserByEmail(email);
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        // Check password
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
            },
            JWT_SECRET!,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'An error occurred during login' });
    }
};

/**
 * Get current user information
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        // User should be attached to the request by the authenticateJWT middleware
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }

        const { userId } = req.user;
        
        // Get user details from database (excluding password)
        const user = await getUserById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Return user data
        res.status(200).json(user);
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Server error retrieving user data' });
    }
};

// --- TODO: Implement Forgot Password Controller --- 