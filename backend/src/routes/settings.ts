import { Router } from 'express';
import { 
  getAllSettings, 
  getSettingByKey, 
  createSetting, 
  updateSetting, 
  deleteSetting,
  getSettingsByType
} from '../controllers/settingsController';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Setting:
 *       type: object
 *       required:
 *         - key
 *         - value
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the setting
 *         key:
 *           type: string
 *           description: Unique key identifier for the setting
 *         value:
 *           type: string
 *           description: Value of the setting
 *         description:
 *           type: string
 *           description: Description of what the setting is for
 *         type:
 *           type: string
 *           description: Type of the setting (text, json, image, etc.)
 *           default: text
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the setting was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the setting was last updated
 */

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: API for managing application settings
 */

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get all settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: List of all settings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Setting'
 *       500:
 *         description: Server error
 */
router.get('/', getAllSettings);

/**
 * @swagger
 * /settings/{key}:
 *   get:
 *     summary: Get setting by key
 *     tags: [Settings]
 *     parameters:
 *       - in: path
 *         name: key
 *         schema:
 *           type: string
 *         required: true
 *         description: Setting key
 *     responses:
 *       200:
 *         description: Setting details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Setting'
 *       404:
 *         description: Setting not found
 *       500:
 *         description: Server error
 */
router.get('/:key', getSettingByKey);

/**
 * @swagger
 * /settings/type/{type}:
 *   get:
 *     summary: Get settings by type
 *     tags: [Settings]
 *     parameters:
 *       - in: path
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         description: Setting type (text, json, image, etc.)
 *     responses:
 *       200:
 *         description: List of settings of specified type
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Setting'
 *       500:
 *         description: Server error
 */
router.get('/type/:type', getSettingsByType);

/**
 * @swagger
 * /settings:
 *   post:
 *     summary: Create a new setting
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *                 description: Unique key identifier for the setting
 *               value:
 *                 type: string
 *                 description: Value of the setting
 *               description:
 *                 type: string
 *                 description: Description of what the setting is for
 *               type:
 *                 type: string
 *                 description: Type of the setting (text, json, image, etc.)
 *                 default: text
 *     responses:
 *       201:
 *         description: Setting created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Setting'
 *       400:
 *         description: Invalid input or setting already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 *       500:
 *         description: Server error
 */
router.post('/', authenticateJWT, requireAdmin, createSetting);

/**
 * @swagger
 * /settings/{key}:
 *   put:
 *     summary: Update a setting
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         schema:
 *           type: string
 *         required: true
 *         description: Setting key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *                 description: New value for the setting
 *               description:
 *                 type: string
 *                 description: New description for the setting
 *               type:
 *                 type: string
 *                 description: New type for the setting
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Setting'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Setting not found
 *       500:
 *         description: Server error
 */
router.put('/:key', authenticateJWT, requireAdmin, updateSetting);

/**
 * @swagger
 * /settings/{key}:
 *   delete:
 *     summary: Delete a setting
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         schema:
 *           type: string
 *         required: true
 *         description: Setting key
 *     responses:
 *       200:
 *         description: Setting deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin access required
 *       404:
 *         description: Setting not found
 *       500:
 *         description: Server error
 */
router.delete('/:key', authenticateJWT, requireAdmin, deleteSetting);

export default router; 