import { Router } from 'express';
import {
    createRoaRoeRecord,
    updateRoaRoeRecord,
    deleteRoaRoeRecord,
    getRoaRoeRecordById,
    getAllRoaRoeRecords,
    getRoaRoeRecordsBySymbol,
    bulkImportRoaRoeRecords
} from '../controllers/roaRoeRecordController';
import { uploadCsvMulter } from '../config/multerConfig';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RoaRoeRecord:
 *       type: object
 *       required:
 *         - symbol
 *         - reportDate
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           description: The auto-generated id of the record
 *           readOnly: true
 *         symbol:
 *           type: string
 *           maxLength: 20
 *           description: The stock ticker symbol
 *         reportDate:
 *           type: string
 *           format: date
 *           description: The report date
 *         roa:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Return on Assets value
 *         roe:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Return on Equity value
 *         roeNganh:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Industry ROE value
 *       example:
 *         id: 5
 *         symbol: "AAPL"
 *         reportDate: "2023-12-31"
 *         roa: 15.7
 *         roe: 23.8
 *         roeNganh: 19.5
 */

/**
 * @swagger
 * tags:
 *   name: ROA/ROE Records
 *   description: ROA/ROE record management endpoints
 */

/**
 * @swagger
 * /api/roa-roe-records:
 *   get:
 *     summary: Get all ROA/ROE records
 *     tags: [ROA/ROE Records]
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: reportDate
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *         description: Filter by stock symbol
 *     responses:
 *       200:
 *         description: List of ROA/ROE records
 *       500:
 *         description: Server error
 */
router.get('/', getAllRoaRoeRecords);

/**
 * @swagger
 * /api/roa-roe-records/{id}:
 *   get:
 *     summary: Get ROA/ROE record by ID
 *     tags: [ROA/ROE Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: Record ID
 *     responses:
 *       200:
 *         description: ROA/ROE record details
 *       404:
 *         description: Record not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getRoaRoeRecordById);

/**
 * @swagger
 * /api/roa-roe-records/symbol/{symbol}:
 *   get:
 *     summary: Get ROA/ROE records by stock symbol
 *     tags: [ROA/ROE Records]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         schema:
 *           type: string
 *         required: true
 *         description: Stock symbol
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: reportDate
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of ROA/ROE records for the symbol
 *       404:
 *         description: Stock not found
 *       500:
 *         description: Server error
 */
router.get('/symbol/:symbol', getRoaRoeRecordsBySymbol);

/**
 * @swagger
 * /api/roa-roe-records:
 *   post:
 *     summary: Create a new ROA/ROE record
 *     tags: [ROA/ROE Records]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symbol
 *               - reportDate
 *             properties:
 *               symbol:
 *                 type: string
 *                 maxLength: 20
 *               reportDate:
 *                 type: string
 *                 format: date
 *               roa:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               roe:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               roeNganh:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *     responses:
 *       201:
 *         description: ROA/ROE record created successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Stock not found
 *       409:
 *         description: Record with this symbol and date already exists
 *       500:
 *         description: Server error
 */
router.post('/', createRoaRoeRecord);

/**
 * @swagger
 * /api/roa-roe-records/{id}:
 *   put:
 *     summary: Update a ROA/ROE record
 *     tags: [ROA/ROE Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: Record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symbol:
 *                 type: string
 *                 maxLength: 20
 *               reportDate:
 *                 type: string
 *                 format: date
 *               roa:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               roe:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               roeNganh:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *     responses:
 *       200:
 *         description: ROA/ROE record updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Record not found
 *       409:
 *         description: Record with this symbol and date already exists
 *       500:
 *         description: Server error
 */
router.put('/:id', updateRoaRoeRecord);

/**
 * @swagger
 * /api/roa-roe-records/{id}:
 *   delete:
 *     summary: Delete a ROA/ROE record
 *     tags: [ROA/ROE Records]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: Record ID
 *     responses:
 *       204:
 *         description: Record deleted successfully
 *       404:
 *         description: Record not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', deleteRoaRoeRecord);

/**
 * @swagger
 * /api/roa-roe-records/import:
 *   post:
 *     summary: Import ROA/ROE records from CSV or Excel
 *     tags: [ROA/ROE Records]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or Excel file with ROA/ROE records
 *     responses:
 *       200:
 *         description: Import completed successfully
 *       400:
 *         description: Invalid file or data
 *       500:
 *         description: Server error
 */
router.post('/import', uploadCsvMulter.single('file'), bulkImportRoaRoeRecords);

export default router; 