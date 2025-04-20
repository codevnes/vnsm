import { Router } from 'express';
import { uploadImageMulter } from '../config/multerConfig';
import {
    uploadImage,
} from '../controllers/uploadController';
// import { checkAuth } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File upload endpoint
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Image:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           readOnly: true
 *         filename:
 *           type: string
 *         processedFilename:
 *           type: string
 *         path:
 *           type: string
 *         url:
 *           type: string
 *           format: url
 *           readOnly: true
 *         altText:
 *           type: string
 *           nullable: true
 *         mimetype:
 *           type: string
 *         size:
 *           type: integer
 *         width:
 *           type: integer
 *           nullable: true
 *         height:
 *           type: integer
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *       example:
 *          id: 1
 *          filename: "my-original-photo.jpg"
 *          processedFilename: "my-original-photo-1678886400000.webp"
 *          path: "/uploads/images/my-original-photo-1678886400000.webp"
 *          url: "http://localhost:3001/uploads/images/my-original-photo-1678886400000.webp"
 *          altText: "A description of the image"
 *          mimetype: "image/webp"
 *          size: 150734
 *          width: 1024
 *          height: 768
 *          createdAt: "2023-03-15T12:00:00Z"
 */

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload an image file
 *     tags: [Upload]
 *     # security:
 *     #   - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload (jpg, png, gif, webp).
 *               altText:
 *                 type: string
 *                 description: Descriptive alt text for the image (for SEO).
 *     responses:
 *       201:
 *         description: Image uploaded and processed successfully
 *         content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                  data: # Referencing the Image schema defined above
 *                    $ref: '#/components/schemas/Image'
 *       400:
 *         description: No file uploaded or invalid file type/size
 *       500:
 *         description: Server error during processing
 */
router.post(
    '/image',
    // checkAuth,
    uploadImageMulter.single('image'),
    uploadImage
);

export default router; 