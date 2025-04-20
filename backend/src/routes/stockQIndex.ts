import { Router } from 'express';
import multer from 'multer';
import {
    createStockQIndex,
    updateStockQIndex,
    deleteStockQIndex,
    getStockQIndexById,
    getAllStockQIndices,
    getQIndicesByStockId,
    bulkImportStockQIndices,
    bulkImportQIndicesBySymbol
} from '../controllers/stockQIndexController';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Base routes without parameters
router.get('/', getAllStockQIndices);
router.post('/', createStockQIndex);

// Stock specific routes with prefixes
router.get('/stock/:stockId', getQIndicesByStockId);
router.post('/stock/:stockId/bulk', bulkImportStockQIndices);

// Bulk import by symbol route
router.post('/bulk-import-by-symbol', upload.single('file'), bulkImportQIndicesBySymbol);

// ID parameter routes
router.get('/:id', getStockQIndexById);
router.put('/:id', updateStockQIndex);
router.delete('/:id', deleteStockQIndex);

export default router;