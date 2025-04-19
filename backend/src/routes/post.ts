import { Router } from 'express';
import {
    createPost,
    updatePost,
    deletePost,
    // getPostById, // TODO
    // getAllPosts // TODO
} from '../controllers/postController';
import { validatePostData } from '../middleware/validationMiddleware'; // TODO: Create validation rules
// import { checkAuth } from '../middleware/authMiddleware'; // TODO: Implement auth middleware

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       required:
 *         - title
 *         - slug
 *         - category_id
 *         - user_id
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           description: The auto-generated id of the post
 *           readOnly: true
 *         title:
 *           type: string
 *           description: The title of the post
 *         slug:
 *           type: string
 *           description: The URL-friendly slug for the post
 *           readOnly: true
 *         description:
 *           type: string
 *           description: Short description or excerpt for the post
 *         content:
 *           type: string
 *           description: The main content of the post (potentially HTML)
 *         thumbnail:
 *           type: string
 *           description: URL to the post thumbnail image
 *         category_id:
 *           type: integer
 *           format: int64
 *           description: ID of the category this post belongs to
 *         stock_id:
 *           type: integer
 *           format: int64
 *           nullable: true
 *           description: ID of the stock this post is related to (optional)
 *         user_id:
 *           type: integer
 *           format: int64
 *           description: ID of the user who authored the post
 *           readOnly: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the post was created
 *           readOnly: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the post was last updated
 *           readOnly: true
 *       example:
 *         id: 1
 *         title: "First Blog Post"
 *         slug: "first-blog-post"
 *         description: "This is a short description."
 *         content: "<p>This is the full content.</p>"
 *         thumbnail: "http://example.com/post-thumb.jpg"
 *         category_id: 10
 *         stock_id: 5
 *         user_id: 1
 *         createdAt: "2023-01-15T10:30:00Z"
 *         updatedAt: "2023-01-16T11:00:00Z"
 *     PostInput:
 *       type: object
 *       required:
 *         - title
 *         - category_id
 *         # user_id is usually derived from auth, not passed in body
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         content:
 *           type: string
 *         thumbnail:
 *           type: string
 *         category_id:
 *           type: integer
 *           format: int64
 *         stock_id:
 *           type: integer
 *           format: int64
 *           nullable: true
 *         user_id:
 *           type: integer
 *           format: int64
 *           description: Required for now until auth implemented
 *         slug:
 *           type: string
 *           description: Optional. If provided, overrides the auto-generated slug.
 */

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management endpoints
 */

// --- Post Routes --- 

// Note: These routes should require authentication

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     # security:
 *     #   - bearerAuth: [] # Requires authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostInput'
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid input data or missing required fields (title, category_id, user_id)
 *       409:
 *         description: Post with this slug already exists
 *       500:
 *         description: Server error
 */
router.post(
    '/',
    // checkAuth, // Placeholder for authentication
    ...validatePostData, // Apply validation
    createPost
);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update an existing post
 *     tags: [Posts]
 *     # security:
 *     #   - bearerAuth: [] # Requires authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: Numeric ID of the post to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             # Use PostInput, but make fields optional implicitly for PUT
 *             $ref: '#/components/schemas/PostInput' 
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid input data or invalid category/stock ID
 *       403:
 *         description: Forbidden (if ownership check implemented and failed)
 *       404:
 *         description: Post not found
 *       409:
 *         description: Post with this slug already exists
 *       500:
 *         description: Server error
 */
router.put(
    '/:id',
    // checkAuth,
    ...validatePostData, // Apply validation
    updatePost
);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     # security:
 *     #   - bearerAuth: [] # Requires authentication
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: Numeric ID of the post to delete
 *     responses:
 *       204:
 *         description: Post deleted successfully
 *       403:
 *         description: Forbidden (if ownership check implemented and failed)
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.delete(
    '/:id',
    // checkAuth,
    deletePost
);

// TODO: GET routes for retrieving posts

export default router; 