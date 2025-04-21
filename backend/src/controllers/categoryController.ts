import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '../lib/prisma'; // Import Prisma namespace for specific types if needed

// Helper function to generate slug (you might want a more robust library like slugify)
const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
        .replace(/\-\-+/g, '-')       // Replace multiple - with single -
        .replace(/^-+/, '')          // Trim - from start of text
        .replace(/-+$/, '');         // Trim - from end of text
};

// --- Category CRUD Operations --- 

// Create a new category
export const createCategory = async (req: Request, res: Response): Promise<void> => {
    // Destructure slug from body as well
    const { title, description, thumbnail, parent_id, slug: requestedSlug } = req.body; 

    // Basic validation
    if (!title) {
        res.status(400).json({ message: 'Title is required' });
        return;
    }

    // Determine the final slug:
    // 1. Use requestedSlug if provided and not empty, generate it otherwise.
    // 2. Consider adding validation/sanitization to requestedSlug (e.g., ensure it looks like a slug).
    let finalSlug = requestedSlug && requestedSlug.trim() !== '' 
                      ? requestedSlug.trim() // Basic trim, consider more robust sanitization
                      : generateSlug(title);

    try {
        const newCategory = await prisma.category.create({
            data: {
                title,
                slug: finalSlug, // Use the determined finalSlug
                description,
                thumbnail,
                parent_id: parent_id ? BigInt(parent_id) : null 
            }
        });
        // Convert BigInt IDs to strings for JSON safety
        const serializedCategory = {
            ...newCategory,
            id: newCategory.id.toString(),
            parent_id: newCategory.parent_id?.toString() ?? null,
        };
        res.status(201).json(serializedCategory);
        return; 
    } catch (error) {
        console.error('Error creating category:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            // Make error message slightly more generic as conflict could be title or slug
             res.status(409).json({ message: 'A category with this title or slug already exists' }); 
             return;
        }
        res.status(500).json({ message: 'Server error creating category' });
    }
};

// Update an existing category
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
    const categoryId = BigInt(req.params.id);
    const { title, description, thumbnail, parent_id, slug: newSlug } = req.body;

    // Determine the slug: use provided slug or generate from title if title is updated
    let finalSlug = newSlug;
    if (!finalSlug && title) {
        finalSlug = generateSlug(title);
    }

    const dataToUpdate: Prisma.CategoryUpdateInput = {};
    if (title) dataToUpdate.title = title;
    if (finalSlug) dataToUpdate.slug = finalSlug;
    if (description !== undefined) dataToUpdate.description = description;
    if (thumbnail !== undefined) dataToUpdate.thumbnail = thumbnail;
    
    // Update parent relation
    if (parent_id !== undefined) {
        if (parent_id === null) {
            // Disconnect from parent
            dataToUpdate.parent = { disconnect: true };
        } else {
            // Connect to new parent
            const parentIdBigInt = BigInt(parent_id);
            if (parentIdBigInt === categoryId) {
                res.status(400).json({ message: "Category cannot be its own parent." });
                return;
            }
            dataToUpdate.parent = { connect: { id: parentIdBigInt } };
        }
    }

    try {
        const updatedCategory = await prisma.category.update({
            where: { id: categoryId },
            data: dataToUpdate
        });
        
        // --- FIX: Serialize BigInt fields before sending response ---
        const serializedCategory = {
            ...updatedCategory,
            id: updatedCategory.id.toString(),
            parent_id: updatedCategory.parent_id?.toString() ?? null,
        };
        res.status(200).json(serializedCategory); // Send serialized data
    } catch (error) {
        console.error('Error updating category:', error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') { // Unique constraint failed (slug)
                 res.status(409).json({ message: 'Category with this title/slug already exists' });
                 return;
            }
            if (error.code === 'P2025') { // Record not found
                res.status(404).json({ message: 'Category not found' });
                return;
            }
        }
        res.status(500).json({ message: 'Server error updating category' });
    }
};

// Delete a category
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
    const categoryId = BigInt(req.params.id);

    try {
         // Note: Prisma automatically handles setting parent_id to NULL for children
         // due to `onDelete: SetNull` in the schema relation.
         // Need to consider if posts in this category should be handled (e.g., deleted or reassigned)
         // For now, we just delete the category itself.
        await prisma.category.delete({
            where: { id: categoryId }
        });
        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting category:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Category not found' });
            return;
        }
        // Handle other potential errors, e.g., foreign key constraints if posts are not handled
        res.status(500).json({ message: 'Server error deleting category' });
    }
};

// Get all categories (flat list for now)
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const categories = await prisma.category.findMany({
            // Add ordering if desired, e.g., orderBy: { title: 'asc' }
        });
        // Convert BigInt IDs to strings for JSON safety
        const serializedCategories = categories.map(cat => ({
            ...cat,
            id: cat.id.toString(),
            parent_id: cat.parent_id?.toString() ?? null,
        }));
        res.status(200).json(serializedCategories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error fetching categories' });
    }
};

// Get a single category by ID
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
    const categoryId = BigInt(req.params.id);
    try {
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            // Optionally include relations:
            // include: {
            //     children: true, // Include direct children
            //     parent: true    // Include direct parent
            // }
        });

        if (!category) {
            res.status(404).json({ message: 'Category not found' });
            return;
        }

        // Convert BigInt IDs to strings for JSON safety
        const serializedCategory = {
            ...category,
            id: category.id.toString(),
            parent_id: category.parent_id?.toString() ?? null,
            // Need to serialize IDs in relations if included
            // children: category.children?.map(child => ({ ...child, id: child.id.toString(), parent_id: child.parent_id?.toString() ?? null })) ?? [],
            // parent: category.parent ? { ...category.parent, id: category.parent.id.toString(), parent_id: category.parent.parent_id?.toString() ?? null } : null,
        };

        res.status(200).json(serializedCategory);
    } catch (error) {
        console.error('Error fetching category by ID:', error);
        res.status(500).json({ message: 'Server error fetching category' });
    }
};

// TODO: Function to get categories with full hierarchy (recursive or multiple queries)

// TODO: Add getCategoryById, getAllCategories (potentially with hierarchy) 