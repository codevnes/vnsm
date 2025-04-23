import { Router } from 'express';
import {
    createFinancialRatioRecord,
    updateFinancialRatioRecord,
    deleteFinancialRatioRecord,
    getFinancialRatioRecordById,
    getAllFinancialRatioRecords,
    getFinancialRatioRecordsBySymbol,
    bulkImportFinancialRatioRecords
} from '../controllers/financialRatioRecordController';
import { uploadCsvMulter } from '../config/multerConfig';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FinancialRatioRecord:
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
 *         debtEquity:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Debt to Equity ratio
 *         assetsEquity:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Assets to Equity ratio
 *         debtEquityPct:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Debt to Equity percentage
 *       example:
 *         id: 5
 *         symbol: "AAPL"
 *         reportDate: "2023-12-31"
 *         debtEquity: 1.2
 *         assetsEquity: 3.5
 *         debtEquityPct: 120.0
 */

/**
 * @swagger
 * tags:
 *   name: Financial Ratio Records
 *   description: Financial Ratio record management endpoints
 */

/**
 * @swagger
 * /api/financial-ratio-records:
 *   get:
 *     summary: Get all Financial Ratio records
 *     tags: [Financial Ratio Records]
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
 *         description: List of Financial Ratio records
 *       500:
 *         description: Server error
 */
router.get('/', getAllFinancialRatioRecords);

/**
 * @swagger
 * /api/financial-ratio-records/{id}:
 *   get:
 *     summary: Get Financial Ratio record by ID
 *     tags: [Financial Ratio Records]
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
 *         description: Financial Ratio record details
 *       404:
 *         description: Record not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getFinancialRatioRecordById);

/**
 * @swagger
 * /api/financial-ratio-records/symbol/{symbol}:
 *   get:
 *     summary: Get Financial Ratio records by stock symbol
 *     tags: [Financial Ratio Records]
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
 *         description: List of Financial Ratio records for the symbol
 *       404:
 *         description: Stock not found
 *       500:
 *         description: Server error
 */
router.get('/symbol/:symbol', getFinancialRatioRecordsBySymbol);

/**
 * @swagger
 * /api/financial-ratio-records:
 *   post:
 *     summary: Create a new Financial Ratio record
 *     tags: [Financial Ratio Records]
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
 *               debtEquity:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               assetsEquity:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               debtEquityPct:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Financial Ratio record created successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Stock not found
 *       409:
 *         description: Record with this symbol and date already exists
 *       500:
 *         description: Server error
 */
router.post('/', createFinancialRatioRecord);

/**
 * @swagger
 * /api/financial-ratio-records/{id}:
 *   put:
 *     summary: Update a Financial Ratio record
 *     tags: [Financial Ratio Records]
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
 *               debtEquity:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               assetsEquity:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *               debtEquityPct:
 *                 type: number
 *                 format: float
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Financial Ratio record updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Record not found
 *       409:
 *         description: Record with this symbol and date already exists
 *       500:
 *         description: Server error
 */
router.put('/:id', updateFinancialRatioRecord);

/**
 * @swagger
 * /api/financial-ratio-records/{id}:
 *   delete:
 *     summary: Delete a Financial Ratio record
 *     tags: [Financial Ratio Records]
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
router.delete('/:id', deleteFinancialRatioRecord);

/**
 * @swagger
 * /api/financial-ratio-records/import:
 *   post:
 *     summary: Import Financial Ratio records from CSV or Excel
 *     tags: [Financial Ratio Records]
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
 *                 description: CSV or Excel file with Financial Ratio records
 *     responses:
 *       200:
 *         description: Import completed successfully
 *       400:
 *         description: Invalid file or data
 *       500:
 *         description: Server error
 */
router.post('/import', uploadCsvMulter.single('file'), bulkImportFinancialRatioRecords);

export default router; 