import { Router } from 'express';
import {
    createStockQIndex,
    updateStockQIndex,
    deleteStockQIndex,
    getStockQIndexById,
    getAllStockQIndices,
    getQIndicesByStockId,
    bulkImportStockQIndices
} from '../controllers/stockQIndexController';
// import { validateStockQIndexData } from '../middleware/validationMiddleware';
// import { checkAuth, checkRole } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     StockQIndex:
 *       type: object
 *       required:
 *         - stock_id
 *         - date
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           description: The auto-generated id of the stock Q-index record
 *         stock_id:
 *           type: integer
 *           format: int64
 *           description: The ID of the related stock
 *         date:
 *           type: string
 *           format: date
 *           description: Date of the Q-index record
 *         open:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: Opening price
 *         low:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: Lowest price
 *         high:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: Highest price
 *         trend_q:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           description: Trend Q value
 *         fq:
 *           type: string
 *           maxLength: 50
 *           nullable: true
 *           description: FQ value
 *         qv1:
 *           type: string
 *           maxLength: 50
 *           nullable: true
 *           description: QV1 value
 *         band_down:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: Lower band value
 *         band_up:
 *           type: number
 *           format: decimal
 *           nullable: true
 *           description: Upper band value
 */

/**
 * @swagger
 * tags:
 *   name: StockQIndex
 *   description: Stock Q-Index data management
 */

/**
 * @swagger
 * /api/qindices:
 *   get:
 *     summary: Get all stock Q-index records
 *     tags: [StockQIndex]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: stock_id
 *         schema:
 *           type: integer
 *         description: Filter by stock ID
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date range (start date)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date range (end date)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, open, high, low]
 *           default: date
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Successfully retrieved Q-index records
 *       500:
 *         description: Server error
 */
router.get('/', getAllStockQIndices);

/**
 * @swagger
 * /api/qindices:
 *   post:
 *     summary: Create a new Q-index record
 *     tags: [StockQIndex]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stock_id
 *               - date
 *             properties:
 *               stock_id:
 *                 type: integer
 *                 format: int64
 *               date:
 *                 type: string
 *                 format: date
 *               open:
 *                 type: number
 *               low:
 *                 type: number
 *               high:
 *                 type: number
 *               trend_q:
 *                 type: string
 *               fq:
 *                 type: string
 *               qv1:
 *                 type: string
 *               band_down:
 *                 type: number
 *               band_up:
 *                 type: number
 *     responses:
 *       201:
 *         description: Successfully created a new Q-index record
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Stock not found
 *       500:
 *         description: Server error
 */
router.post('/', createStockQIndex);

/**
 * @swagger
 * /api/qindices/stock/{stockId}:
 *   get:
 *     summary: Get all Q-index records for a specific stock
 *     tags: [StockQIndex]
 *     parameters:
 *       - in: path
 *         name: stockId
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: ID of the stock
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Successfully retrieved Q-index records
 *       404:
 *         description: Stock not found
 *       500:
 *         description: Server error
 */
router.get('/stock/:stockId', getQIndicesByStockId);

/**
 * @swagger
 * /api/qindices/stock/{stockId}/bulk:
 *   post:
 *     summary: Bulk import Q-index records for a specific stock
 *     tags: [StockQIndex]
 *     parameters:
 *       - in: path
 *         name: stockId
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: ID of the stock
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qIndices
 *             properties:
 *               qIndices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - date
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     open:
 *                       type: number
 *                     low:
 *                       type: number
 *                     high:
 *                       type: number
 *                     trend_q:
 *                       type: string
 *                     fq:
 *                       type: string
 *                     qv1:
 *                       type: string
 *                     band_down:
 *                       type: number
 *                     band_up:
 *                       type: number
 *     responses:
 *       201:
 *         description: Successfully imported Q-index records
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Stock not found
 *       500:
 *         description: Server error
 */
router.post('/stock/:stockId/bulk', bulkImportStockQIndices);

/**
 * @swagger
 * /api/qindices/{id}:
 *   get:
 *     summary: Get a specific Q-index record by ID
 *     tags: [StockQIndex]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: ID of the Q-index record
 *     responses:
 *       200:
 *         description: Successfully retrieved the Q-index record
 *       404:
 *         description: Q-index record not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getStockQIndexById);

/**
 * @swagger
 * /api/qindices/{id}:
 *   put:
 *     summary: Update a Q-index record
 *     tags: [StockQIndex]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: ID of the Q-index record to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stock_id:
 *                 type: integer
 *                 format: int64
 *               date:
 *                 type: string
 *                 format: date
 *               open:
 *                 type: number
 *               low:
 *                 type: number
 *               high:
 *                 type: number
 *               trend_q:
 *                 type: string
 *               fq:
 *                 type: string
 *               qv1:
 *                 type: string
 *               band_down:
 *                 type: number
 *               band_up:
 *                 type: number
 *     responses:
 *       200:
 *         description: Successfully updated Q-index record
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Q-index record not found
 *       500:
 *         description: Server error
 */
router.put('/:id', updateStockQIndex);

/**
 * @swagger
 * /api/qindices/{id}:
 *   delete:
 *     summary: Delete a Q-index record
 *     tags: [StockQIndex]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: ID of the Q-index record to delete
 *     responses:
 *       200:
 *         description: Successfully deleted Q-index record
 *       404:
 *         description: Q-index record not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', deleteStockQIndex);

export default router; 