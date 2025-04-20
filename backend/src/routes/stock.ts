import { Router } from 'express';
import {
    createStock,
    updateStock,
    deleteStock,
    getStockById,
    getAllStocks,
    bulkImportStocks,
    getStockBySymbol,
    searchStocks
} from '../controllers/stockController';
import { validateStockData } from '../middleware/validationMiddleware';
import { uploadCsvMulter } from '../config/multerConfig';
// import { checkAuth, checkRole } from '../middleware/authMiddleware'; // TODO: Auth/roles if needed

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Stock:
 *       type: object
 *       required:
 *         - symbol
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           description: The auto-generated id of the stock
 *           readOnly: true
 *         symbol:
 *           type: string
 *           maxLength: 20
 *           description: The stock ticker symbol (e.g., AAPL, GOOG)
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: The full name of the company/stock
 *         exchange:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           description: The exchange where the stock is traded (e.g., NASDAQ, NYSE)
 *         industry:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           description: The industry the company belongs to (e.g., Technology, Finance)
 *       example:
 *         id: 5
 *         symbol: "AAPL"
 *         name: "Apple Inc."
 *         exchange: "NASDAQ"
 *         industry: "Technology"
 *     StockInput:
 *       type: object
 *       properties:
 *         symbol:
 *           type: string
 *           maxLength: 20
 *           description: Required on create, optional on update.
 *         name:
 *           type: string
 *           maxLength: 255
 *           description: Required on create, optional on update.
 *         exchange:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *         industry:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 */

/**
 * @swagger
 * tags:
 *   name: Stocks
 *   description: Stock management and import endpoints
 */

// --- Stock Routes --- 

// Note: Consider adding authentication/role checks if modifying stocks requires specific permissions

/**
 * @swagger
 * /api/stocks:
 *   post:
 *     summary: Create a new stock
 *     tags: [Stocks]
 *     # security:
 *     #   - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StockInput'
 *           example:
 *             symbol: "MSFT"
 *             name: "Microsoft Corporation"
 *             exchange: "NASDAQ"
 *             industry: "Technology"
 *     responses:
 *       201:
 *         description: Stock created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stock'
 *       400:
 *         description: Invalid input data (Symbol/Name required)
 *       409:
 *         description: Stock with this symbol already exists
 *       500:
 *         description: Server error
 */
router.post(
    '/',
    // checkAuth,
    // checkRole(['admin']), // Example: only admin creates stocks
    ...validateStockData,
    createStock
);

/**
 * @swagger
 * /api/stocks/{id}:
 *   put:
 *     summary: Update an existing stock
 *     tags: [Stocks]
 *     # security:
 *     #   - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: Numeric ID of the stock to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StockInput'
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stock'
 *       400:
 *         description: Invalid input data or no fields to update
 *       404:
 *         description: Stock not found
 *       409:
 *         description: Stock with this symbol already exists
 *       500:
 *         description: Server error
 */
router.put(
    '/:id',
    // checkAuth,
    // checkRole(['admin']), 
    ...validateStockData,
    updateStock
);

/**
 * @swagger
 * /api/stocks/{id}:
 *   delete:
 *     summary: Delete a stock
 *     tags: [Stocks]
 *     # security:
 *     #   - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: Numeric ID of the stock to delete
 *     responses:
 *       204:
 *         description: Stock deleted successfully
 *       404:
 *         description: Stock not found
 *       409:
 *         description: Cannot delete stock, it is referenced by other records
 *       500:
 *         description: Server error
 */
router.delete(
    '/:id',
    // checkAuth,
    // checkRole(['admin']), 
    deleteStock
);

// GET /api/stocks
/**
 * @swagger
 * /api/stocks:
 *   get:
 *     summary: Retrieve a list of stocks
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum number of stocks to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: "Number of stocks to skip for pagination (Note: Use page/limit instead for consistency)"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [symbol, name, exchange, industry]
 *           default: symbol
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: symbol
 *         schema:
 *           type: string
 *         description: Filter by stock symbol (exact match, case-insensitive handled by backend)
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by stock name (case-insensitive, partial match)
 *     responses:
 *       200:
 *         description: A list of stocks with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StockListResponse' # Assuming you define this schema
 *       500:
 *         description: Server error
 */
router.get('/', getAllStocks);

/**
 * @swagger
 * /api/stocks/search:
 *   get:
 *     summary: Search stocks by keyword (searches in both symbol and name)
 *     tags: [Stocks]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         required: true
 *         description: Search keyword to find in stock symbol or name (case-insensitive)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Maximum number of stocks to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [symbol, name, exchange, industry]
 *           default: symbol
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: A list of matching stocks with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StockListResponse'
 *       500:
 *         description: Server error
 */
router.get('/search', searchStocks);

// GET /api/stocks/:id
/**
 * @swagger
 * /api/stocks/{id}:
 *   get:
 *     summary: Get a specific stock by ID
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           format: int64
 *         required: true
 *         description: Numeric ID of the stock to retrieve
 *     responses:
 *       200:
 *         description: Stock details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stock'
 *       404:
 *         description: Stock not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getStockById);

// GET /api/stocks/symbol/:symbol
/**
 * @swagger
 * /api/stocks/symbol/{symbol}:
 *   get:
 *     summary: Get a specific stock by symbol
 *     tags: [Stocks]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         schema:
 *           type: string
 *         required: true
 *         description: Symbol of the stock to retrieve (case-insensitive)
 *     responses:
 *       200:
 *         description: Stock details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stock'
 *       404:
 *         description: Stock not found
 *       500:
 *         description: Server error
 */
router.get('/symbol/:symbol', getStockBySymbol);

// --- NEW Bulk Import Route ---
/**
 * @swagger
 * /api/stocks/bulk-import:
 *   post:
 *     summary: Import multiple stocks from a CSV file
 *     tags: [Stocks]
 *     description: >
 *       Uploads a CSV file to add or update multiple stocks.
 *       Expects CSV headers (case-insensitive): `symbol`, `name`, `exchange`, `industry`.
 *       `symbol` and `name` are required for each row.
 *     # security:
 *     #   - bearerAuth: [] # Requires authentication
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file: # Field name must be 'file'
 *                 type: string
 *                 format: binary
 *                 description: The CSV file containing stock data.
 *     responses:
 *       200:
 *         description: Bulk import process finished.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 summary:
 *                   type: object
 *                   properties:
 *                     successful:
 *                       type: integer
 *                       description: Number of rows successfully added or updated.
 *                     skipped:
 *                       type: integer
 *                       description: Number of rows skipped due to validation errors or DB errors.
 *                     totalCsvRows:
 *                        type: integer
 *                        description: Total number of data rows processed from the CSV.
 *                 errors:
 *                   type: array
 *                   description: List of errors encountered during processing.
 *                   items:
 *                     type: object
 *                     properties:
 *                       row:
 *                         type: integer
 *                         description: Approximate row number in the CSV where the error occurred.
 *                       message:
 *                         type: string
 *                       data:
 *                         type: object
 *       400:
 *         description: No file uploaded, invalid file type, or no valid data found in CSV.
 *       500:
 *         description: Server error during file parsing or processing.
 */
router.post(
    '/bulk-import',
    // checkAuth, // Add authentication if needed
    // checkRole(['admin']), // Add role check if needed
    uploadCsvMulter.single('file'), // Use CSV multer middleware, field name 'file'
    bulkImportStocks
);

export default router;