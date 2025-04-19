import { Router } from 'express';
import {
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getAllCategories
} from '../controllers/categoryController';
import { validateCategoryData } from '../middleware/validationMiddleware'; // TODO: Create validation rules
// import { checkAuth, checkRole } from '../middleware/authMiddleware'; // TODO: Implement auth middleware

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           description: The auto-generated id of the category
 *           readOnly: true
 *         title:
 *           type: string
 *           description: The title of the category
 *         slug:
 *           type: string
 *           description: The URL-friendly slug for the category
 *           readOnly: true
 *         description:
 *           type: string
 *           description: Optional description for the category
 *         thumbnail:
 *           type: string
 *           description: URL to the category thumbnail image
 *         parent_id:
 *           type: integer
 *           format: int64
 *           nullable: true
 *           description: The ID of the parent category (if any)
 *       example:
 *         id: 10
 *         title: "Technology"
 *         slug: "technology"
 *         description: "Articles about tech trends and news."
 *         thumbnail: "http://example.com/thumb.jpg"
 *         parent_id: null
 *     CategoryInput:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         thumbnail:
 *           type: string
 *         parent_id:
 *           type: integer
 *           format: int64
 *           nullable: true
 *         slug: 
 *           type: string
 *           description: Optional. If provided, overrides the auto-generated slug on update.
 */

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management endpoints
 */

// --- Category Routes --- 

// Note: Consider adding authentication and role checks (e.g., admin/editor) for these routes

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     # security: 
 *     #   - bearerAuth: [] # Uncomment when auth is implemented
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Category with this title/slug already exists
 *       500:
 *         description: Server error
 */
router.post(
    '/',
    // checkAuth, // Placeholder for authentication
    // checkRole(['admin', 'editor']),
    ...validateCategoryData, // Apply validation
    createCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update an existing category
 *     tags: [Categories]
 *     # security:
 *     #   - bearerAuth: [] # Uncomment when auth is implemented
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: Numeric ID of the category to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid input data or cannot be own parent
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category with this title/slug already exists
 *       500:
 *         description: Server error
 */
router.put(
    '/:id',
    // checkAuth,
    // checkRole(['admin', 'editor']),
    ...validateCategoryData, // Apply validation
    updateCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     # security:
 *     #   - bearerAuth: [] # Uncomment when auth is implemented
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: Numeric ID of the category to delete
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.delete(
    '/:id',
    // checkAuth,
    // checkRole(['admin', 'editor']),
    deleteCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get a single category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: Numeric ID of the category to retrieve
 *     responses:
 *       200:
 *         description: Category details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               # Note: Adjust this if you include relations in the controller
 *               $ref: '#/components/schemas/Category' 
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.get(
    '/:id',
    getCategoryById
);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get a list of all categories
 *     tags: [Categories]
 *     # parameters:
 *     #   - in: query
 *     #     name: include
 *     #     schema:
 *     #       type: string
 *     #       enum: [children, parent] # Example for including relations
 *     #     description: Optionally include related data (e.g., children, parent)
 *     responses:
 *       200:
 *         description: A list of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *       500:
 *         description: Server error
 */
router.get(
    '/',
    getAllCategories
);

export default router; 