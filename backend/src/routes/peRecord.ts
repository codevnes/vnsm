import { Router } from 'express';
import {
    createPeRecord,
    updatePeRecord,
    deletePeRecord,
    getPeRecordById,
    getAllPeRecords,
    getPeRecordsBySymbol,
    bulkImportPeRecords
} from '../controllers/peRecordController';
import { uploadCsvMulter } from '../config/multerConfig';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PeRecord:
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
 *         pe:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Price to Earnings ratio
 *         peNganh:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Industry PE value
 *         peRate:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: PE percentage value
 *       example:
 *         id: 5
 *         symbol: "AAPL"
 *         reportDate: "2023-12-31"
 *         pe: 25.6
 *         peNganh: 22.3
 *         peRate: 14.8
 */

/**
 * @swagger
 * tags:
 *   name: PE Records
 *   description: PE ratio record management endpoints
 */

/**
 * @swagger
 * /api/pe-records:
 *   get:
 *     summary: Get all PE records
 *     tags: [PE Records]
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
 *         description: List of PE records
 *       500:
 *         description: Server error
 */
router.get('/', getAllPeRecords);

/**
 * @swagger
 * /api/pe-records/{id}:
 *   get:
 *     summary: Get PE record by ID
 *     tags: [PE Records]
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
 *         description: PE record details
 *       404:
 *         description: Record not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getPeRecordById);

/**
 * @swagger
 * /api/pe-records/symbol/{symbol}:
 *   get:
 *     summary: Get PE records by stock symbol
 *     tags: [PE Records]
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
 *         description: List of PE records for the symbol
 *       404:
 *         description: Stock not found
 *       500:
 *         description: Server error
 */
router.get('/symbol/:symbol', getPeRecordsBySymbol);

/**
 * @swagger
 * /api/pe-records:
 *   post:
 *     summary: Create a new PE record
 *     tags: [PE Records]
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
 *               pe:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               peNganh:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               peRate:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *     responses:
 *       201:
 *         description: PE record created successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Stock not found
 *       409:
 *         description: Record with this symbol and date already exists
 *       500:
 *         description: Server error
 */
router.post('/', createPeRecord);

/**
 * @swagger
 * /api/pe-records/{id}:
 *   put:
 *     summary: Update a PE record
 *     tags: [PE Records]
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
 *               pe:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               peNganh:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               peRate:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *     responses:
 *       200:
 *         description: PE record updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Record not found
 *       409:
 *         description: Record with this symbol and date already exists
 *       500:
 *         description: Server error
 */
router.put('/:id', updatePeRecord);

/**
 * @swagger
 * /api/pe-records/{id}:
 *   delete:
 *     summary: Delete a PE record
 *     tags: [PE Records]
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
router.delete('/:id', deletePeRecord);

/**
 * @swagger
 * /api/pe-records/import:
 *   post:
 *     summary: Import PE records from CSV or Excel
 *     tags: [PE Records]
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
 *                 description: CSV or Excel file with PE records
 *     responses:
 *       200:
 *         description: Import completed successfully
 *       400:
 *         description: Invalid file or data
 *       500:
 *         description: Server error
 */
router.post('/import', uploadCsvMulter.single('file'), bulkImportPeRecords);

export default router; 