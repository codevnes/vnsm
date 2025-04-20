import { Router } from 'express';
import {
    getAllImages,
    getImageById,
    updateImage,
    deleteImage
} from '../controllers/uploadController'; // Controllers remain the same for now
// import { checkAuth, checkRole } from '../middleware/authMiddleware'; // Consider adding auth/roles

const router = Router();

// Note: Swagger tags and schema definitions are often kept central or defined here.
// For simplicity, assuming they are defined elsewhere or will be added.

/**
 * @swagger
 * /api/images:
 *   get:
 *     summary: Retrieve a list of uploaded images
 *     tags: [Images]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Maximum number of images to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of images to skip for pagination
 *     responses:
 *       200:
 *         description: A list of images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Image'
 *                 pagination:
 *                    type: object
 *                    properties:
 *                      total:
 *                        type: integer
 *                      limit:
 *                        type: integer
 *                      offset:
 *                        type: integer
 *                      hasNextPage:
 *                         type: boolean
 *       400:
 *         description: Invalid pagination parameters
 *       500:
 *         description: Server error
 */
router.get('/', getAllImages); // Path is relative to /api/images mount point

/**
 * @swagger
 * /api/images/{id}:
 *   get:
 *     summary: Retrieve a single image by ID
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: Numeric ID of the image to retrieve
 *     responses:
 *       200:
 *         description: Image details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Image'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getImageById); // Path is relative to /api/images mount point

/**
 * @swagger
 * /api/images/{id}:
 *   put:
 *     summary: Update image metadata (e.g., alt text)
 *     tags: [Images]
 *     # security:
 *     #  - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: Numeric ID of the image to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               altText:
 *                 type: string
 *                 description: The updated alt text for the image.
 *             required:
 *               - altText
 *     responses:
 *       200:
 *         description: Image metadata updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Image'
 *       400:
 *         description: Invalid ID format or missing update data
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
router.put(
    '/:id',
    // checkAuth,
    // checkRole(['admin', 'editor']),
    updateImage
);

/**
 * @swagger
 * /api/images/{id}:
 *   delete:
 *     summary: Delete an image (database record and file)
 *     tags: [Images]
 *     # security:
 *     #  - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: Numeric ID of the image to delete
 *     responses:
 *       204:
 *         description: Image deleted successfully (No Content)
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
router.delete(
    '/:id',
    // checkAuth,
    // checkRole(['admin', 'editor']),
    deleteImage
);

export default router; 