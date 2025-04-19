import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '../generated/prisma';

// Helper function (same as in categoryController)
const generateSlug = (title: string): string => {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
};

// --- Post CRUD Operations --- 

// Create a new post
export const createPost = async (req: Request, res: Response): Promise<void> => {
    // IMPORTANT: In a real app, user_id should come from authenticated user (req.user.id)
    // For now, we expect it in the body for simplicity.
    const { title, description, content, thumbnail, category_id, stock_id, user_id, slug: customSlug } = req.body;

    // Basic validation
    if (!title || !category_id || !user_id) {
        res.status(400).json({ message: 'Title, category_id, and user_id are required' });
        return;
    }

    const slug = customSlug || generateSlug(title);

    try {
        const newPost = await prisma.post.create({
            data: {
                title,
                slug,
                description,
                content,
                thumbnail,
                category_id: BigInt(category_id),
                stock_id: stock_id ? BigInt(stock_id) : null,
                user_id: BigInt(user_id) // Replace with req.user.id in production
            }
        });
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ message: 'Post with this slug already exists' });
            return;
        }
        // Handle foreign key constraint errors (e.g., category_id, user_id not found)
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
             res.status(400).json({ message: 'Invalid category_id, stock_id, or user_id provided.' });
            return;
        }
        res.status(500).json({ message: 'Server error creating post' });
    }
};

// Update an existing post
export const updatePost = async (req: Request, res: Response): Promise<void> => {
    const postId = BigInt(req.params.id);
    // IMPORTANT: Add check to ensure the authenticated user is the author or has permission
    // const loggedInUserId = req.user.id; // Assuming auth middleware adds user to req
    
    const { title, description, content, thumbnail, category_id, stock_id, slug: newSlug } = req.body;

    let finalSlug = newSlug;
    if (!finalSlug && title) {
        finalSlug = generateSlug(title);
    }

    const dataToUpdate: Prisma.PostUpdateInput = {};
    if (title) dataToUpdate.title = title;
    if (finalSlug) dataToUpdate.slug = finalSlug;
    if (description !== undefined) dataToUpdate.description = description;
    if (content !== undefined) dataToUpdate.content = content;
    if (thumbnail !== undefined) dataToUpdate.thumbnail = thumbnail;
    // if (category_id) dataToUpdate.category_id = BigInt(category_id);
    // if (stock_id !== undefined) dataToUpdate.stock_id = stock_id ? BigInt(stock_id) : null;
    
    // Update relations if provided
    if (category_id) {
        dataToUpdate.category = { connect: { id: BigInt(category_id) } };
    }
    if (stock_id !== undefined) {
        if (stock_id === null) {
            dataToUpdate.stock = { disconnect: true };
        } else {
            dataToUpdate.stock = { connect: { id: BigInt(stock_id) } };
        }
    }

    // user_id (author) generally should not be updatable

    try {
        // Optional: Fetch post first to check ownership
        // const post = await prisma.post.findUnique({ where: { id: postId } });
        // if (!post) {
        //     res.status(404).json({ message: 'Post not found' });
        //     return;
        // }
        // if (post.user_id.toString() !== loggedInUserId) { // Compare owner
        //     res.status(403).json({ message: 'Forbidden: You are not the author of this post' });
        //     return;
        // }

        const updatedPost = await prisma.post.update({
            where: { id: postId }, // Add ownership check here in production: where: { id: postId, user_id: BigInt(loggedInUserId) }
            data: dataToUpdate
        });
        res.status(200).json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') { // Unique constraint failed (slug)
                 res.status(409).json({ message: 'Post with this slug already exists' });
                 return;
            }
            if (error.code === 'P2003') { // Foreign key constraint failed
                 res.status(400).json({ message: 'Invalid category_id or stock_id provided.' });
                 return;
            }
            if (error.code === 'P2025') { // Record not found (or ownership check failed if added to where clause)
                res.status(404).json({ message: 'Post not found or permission denied' });
                return;
            }
        }
        res.status(500).json({ message: 'Server error updating post' });
    }
};

// Delete a post
export const deletePost = async (req: Request, res: Response): Promise<void> => {
    const postId = BigInt(req.params.id);
    // IMPORTANT: Add check to ensure the authenticated user is the author or has permission
    // const loggedInUserId = req.user.id; // Assuming auth middleware adds user to req

    try {
        await prisma.post.delete({
            where: { id: postId } // Add ownership check here in production: where: { id: postId, user_id: BigInt(loggedInUserId) }
        });
        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting post:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Post not found or permission denied' });
            return;
        }
        res.status(500).json({ message: 'Server error deleting post' });
    }
};

// TODO: Add getPostById, getAllPosts (with filters, pagination) 