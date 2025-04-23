import express from 'express';
import multer from 'multer';
import { 
    createCurrencyPrice, 
    updateCurrencyPrice, 
    deleteCurrencyPrice, 
    getCurrencyPriceById, 
    getAllCurrencyPrices,
    getCurrencyPricesBySymbol,
    bulkImportCurrencyPrices
} from '../controllers/currencyPriceController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/currency-prices:
 *   get:
 *     summary: Get all currency prices with pagination and filtering
 *     tags: [Currency Prices]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *         description: Filter by currency symbol
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of currency prices
 */
router.get('/', getAllCurrencyPrices);

/**
 * @swagger
 * /api/currency-prices/{id}:
 *   get:
 *     summary: Get a currency price by ID
 *     tags: [Currency Prices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Currency price ID
 *     responses:
 *       200:
 *         description: Currency price details
 *       404:
 *         description: Currency price not found
 */
router.get('/:id', getCurrencyPriceById);

/**
 * @swagger
 * /api/currency-prices/symbol/{symbol}:
 *   get:
 *     summary: Get currency prices by symbol
 *     tags: [Currency Prices]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Currency symbol (e.g., XAUUSD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of currency prices for the symbol
 */
router.get('/symbol/:symbol', getCurrencyPricesBySymbol);

/**
 * @swagger
 * /api/currency-prices:
 *   post:
 *     summary: Create a new currency price entry
 *     tags: [Currency Prices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symbol
 *               - date
 *               - open
 *               - high
 *               - low
 *               - close
 *               - trend_q
 *               - fq
 *             properties:
 *               symbol:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               open:
 *                 type: number
 *               high:
 *                 type: number
 *               low:
 *                 type: number
 *               close:
 *                 type: number
 *               trend_q:
 *                 type: number
 *               fq:
 *                 type: number
 *     responses:
 *       201:
 *         description: Currency price created successfully
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Currency price already exists for this symbol and date
 */
router.post('/', authenticateJWT, createCurrencyPrice);

/**
 * @swagger
 * /api/currency-prices/{id}:
 *   put:
 *     summary: Update a currency price entry
 *     tags: [Currency Prices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Currency price ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symbol:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               open:
 *                 type: number
 *               high:
 *                 type: number
 *               low:
 *                 type: number
 *               close:
 *                 type: number
 *               trend_q:
 *                 type: number
 *               fq:
 *                 type: number
 *     responses:
 *       200:
 *         description: Currency price updated successfully
 *       404:
 *         description: Currency price not found
 *       409:
 *         description: Currency price already exists for this symbol and date
 */
router.put('/:id', authenticateJWT, updateCurrencyPrice);

/**
 * @swagger
 * /api/currency-prices/{id}:
 *   delete:
 *     summary: Delete a currency price entry
 *     tags: [Currency Prices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Currency price ID
 *     responses:
 *       200:
 *         description: Currency price deleted successfully
 *       404:
 *         description: Currency price not found
 */
router.delete('/:id', authenticateJWT, deleteCurrencyPrice);

/**
 * @swagger
 * /api/currency-prices/import:
 *   post:
 *     summary: Import currency prices from CSV or Excel file
 *     tags: [Currency Prices]
 *     security:
 *       - bearerAuth: []
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
 *                 description: CSV or Excel (.xlsx) file containing currency price data
 *     responses:
 *       201:
 *         description: Currency prices imported successfully
 *       400:
 *         description: Invalid file format or missing data
 */
router.post('/import', authenticateJWT, upload.single('file'), bulkImportCurrencyPrices);

export default router; 