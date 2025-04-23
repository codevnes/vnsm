import { Router } from 'express';
import {
    createEpsRecord,
    updateEpsRecord,
    deleteEpsRecord,
    getEpsRecordById,
    getAllEpsRecords,
    getEpsRecordsBySymbol,
    bulkImportEpsRecords
} from '../controllers/epsRecordController';
import { uploadCsvMulter } from '../config/multerConfig';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     EpsRecord:
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
 *         eps:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Earnings Per Share value
 *         epsNganh:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Industry EPS value
 *         epsRate:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: EPS percentage value
 *       example:
 *         id: 5
 *         symbol: "AAPL"
 *         reportDate: "2023-12-31"
 *         eps: 3.45
 *         epsNganh: 2.98
 *         epsRate: 15.77
 */

/**
 * @swagger
 * tags:
 *   name: EPS Records
 *   description: EPS record management endpoints
 */

/**
 * @swagger
 * /api/eps-records:
 *   get:
 *     summary: Get all EPS records
 *     tags: [EPS Records]
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
 *         description: List of EPS records
 *       500:
 *         description: Server error
 */
router.get('/', getAllEpsRecords);

/**
 * @swagger
 * /api/eps-records/{id}:
 *   get:
 *     summary: Get EPS record by ID
 *     tags: [EPS Records]
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
 *         description: EPS record details
 *       404:
 *         description: Record not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getEpsRecordById);

/**
 * @swagger
 * /api/eps-records/symbol/{symbol}:
 *   get:
 *     summary: Get EPS records by stock symbol
 *     tags: [EPS Records]
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
 *         description: List of EPS records for the symbol
 *       404:
 *         description: Stock not found
 *       500:
 *         description: Server error
 */
router.get('/symbol/:symbol', getEpsRecordsBySymbol);

/**
 * @swagger
 * /api/eps-records:
 *   post:
 *     summary: Create a new EPS record
 *     tags: [EPS Records]
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
 *               eps:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               epsNganh:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               epsRate:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *     responses:
 *       201:
 *         description: EPS record created successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Stock not found
 *       409:
 *         description: Record with this symbol and date already exists
 *       500:
 *         description: Server error
 */
router.post('/', createEpsRecord);

/**
 * @swagger
 * /api/eps-records/{id}:
 *   put:
 *     summary: Update an EPS record
 *     tags: [EPS Records]
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
 *               eps:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               epsNganh:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               epsRate:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *     responses:
 *       200:
 *         description: EPS record updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Record not found
 *       409:
 *         description: Record with this symbol and date already exists
 *       500:
 *         description: Server error
 */
router.put('/:id', updateEpsRecord);

/**
 * @swagger
 * /api/eps-records/{id}:
 *   delete:
 *     summary: Delete an EPS record
 *     tags: [EPS Records]
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
router.delete('/:id', deleteEpsRecord);

/**
 * @swagger
 * /api/eps-records/import:
 *   post:
 *     summary: Import EPS records from CSV or Excel
 *     tags: [EPS Records]
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
 *                 description: CSV or Excel file with EPS records
 *     responses:
 *       200:
 *         description: Import completed successfully
 *       400:
 *         description: Invalid file or data
 *       500:
 *         description: Server error
 */
router.post('/import', uploadCsvMulter.single('file'), bulkImportEpsRecords);

export default router; 