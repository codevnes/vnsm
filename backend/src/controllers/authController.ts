import { Request, Response } from 'express';
import prisma from '../lib/prisma'; // Import Prisma client
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
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
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists with this email' });
            return;
        }

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user using Prisma Client
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword, // Save hashed password
                full_name,
                phone,
                // role is defaulted in schema
                // verified is defaulted in schema
            },
            select: { id: true } // Only select the id
        });

        // Convert BigInt userId to string for JSON serialization
        const userIdString = newUser.id.toString();

        res.status(201).json({ message: 'User registered successfully', userId: userIdString });
        return;

    } catch (error) {
        console.error('Registration error:', error);
        // Consider more specific error handling for Prisma errors
        res.status(500).json({ message: 'Server error during registration' });
        return;
    }
};

// Controller function for user login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
        // Find user by email using Prisma Client
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Passwords match, generate JWT token
        // Convert BigInt id to string or number if necessary for JWT payload
        const userIdString = user.id.toString(); 

        const payload = {
            user: {
                id: userIdString, // Use converted ID
                role: user.role // Role comes from Prisma model
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET!, 
            { expiresIn: 86400 }, // Use numeric value (1 day in seconds)
            (err, token) => {
                if (err) {
                    console.error('JWT sign error:', err);
                    res.status(500).json({ message: 'Server error generating token' });
                    return; 
                }
                res.json({ token });
                return;
            }
        );

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
        return;
    }
};

// --- TODO: Implement Forgot Password Controller --- 