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
        
        // --- FIX: Serialize BigInt fields before sending response ---
        const serializedPost = {
            ...newPost,
            id: newPost.id.toString(),
            category_id: newPost.category_id.toString(),
            user_id: newPost.user_id.toString(),
            stock_id: newPost.stock_id?.toString() ?? null,
        };
        
        res.status(201).json(serializedPost); // Send serialized data
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
        
        // --- FIX: Serialize BigInt fields before sending response --- 
        const serializedPost = {
            ...updatedPost,
            id: updatedPost.id.toString(),
            category_id: updatedPost.category_id.toString(),
            user_id: updatedPost.user_id.toString(),
            stock_id: updatedPost.stock_id?.toString() ?? null,
        };

        res.status(200).json(serializedPost);
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

// Get all posts with filtering and pagination
export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
    const { page = '1', limit = '10', categoryId, userId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.PostWhereInput = {};
    if (categoryId) {
        where.category_id = BigInt(categoryId as string);
    }
    if (userId) {
        where.user_id = BigInt(userId as string);
    }
    // Add more filters like search on title/content if needed
    // if (search) { 
    //     where.OR = [
    //         { title: { contains: search as string, mode: 'insensitive' } }, // mode requires specific DB support
    //         { content: { contains: search as string, mode: 'insensitive' } }
    //     ];
    // }

    // Define allowed sort fields
    const allowedSortByFields: Array<keyof Pick<Prisma.PostOrderByWithRelationInput, 'createdAt' | 'updatedAt' | 'title'> > = ['createdAt', 'updatedAt', 'title'];
    const sortField = sortBy as string;
    const sortDir: Prisma.SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    let orderBy: Prisma.PostOrderByWithRelationInput = { createdAt: 'desc' }; // Default sort

    if (allowedSortByFields.includes(sortField as 'createdAt' | 'updatedAt' | 'title')) {
         // Create a new orderBy object with the dynamic key
         orderBy = { [sortField]: sortDir };
    }

    try {
        const [posts, totalPosts] = await prisma.$transaction([
            prisma.post.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
                include: {
                    category: { select: { id: true, title: true, slug: true } }, // Select specific fields
                    user: { select: { id: true, full_name: true } }      // Select specific fields
                }
            }),
            prisma.post.count({ where })
        ]);

        // Convert BigInt IDs to strings
        const serializedPosts = posts.map(post => ({
            ...post,
            id: post.id.toString(),
            category_id: post.category_id.toString(),
            user_id: post.user_id.toString(),
            stock_id: post.stock_id?.toString() ?? null,
            category: {
                 ...post.category,
                 id: post.category.id.toString()
            },
            user: {
                ...post.user,
                id: post.user.id.toString()
            }
        }));

        res.status(200).json({
            data: serializedPosts,
            pagination: {
                totalItems: totalPosts,
                itemCount: posts.length,
                itemsPerPage: limitNum,
                totalPages: Math.ceil(totalPosts / limitNum),
                currentPage: pageNum,
            }
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Server error fetching posts' });
    }
};

// Get a single post by ID
export const getPostById = async (req: Request, res: Response): Promise<void> => {
    const postId = BigInt(req.params.id);
    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                category: { select: { id: true, title: true, slug: true } },
                user: { select: { id: true, full_name: true, email: true } }, // Include email for owner check maybe
                stock: true // Include full stock info
            }
        });

        if (!post) {
            res.status(404).json({ message: 'Post not found' });
            return;
        }

        // Convert BigInt IDs to strings
        const serializedPost = {
            ...post,
            id: post.id.toString(),
            category_id: post.category_id.toString(),
            user_id: post.user_id.toString(),
            stock_id: post.stock_id?.toString() ?? null,
            category: {
                 ...post.category,
                 id: post.category.id.toString()
            },
            user: {
                ...post.user,
                id: post.user.id.toString()
            },
            stock: post.stock ? {
                ...post.stock,
                id: post.stock.id.toString()
            } : null
        };

        res.status(200).json(serializedPost);
    } catch (error) {
        console.error('Error fetching post by ID:', error);
        res.status(500).json({ message: 'Server error fetching post' });
    }
};

// TODO: Add getPostById, getAllPosts (with filters, pagination) 