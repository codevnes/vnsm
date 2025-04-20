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

const router = Router();

// Base routes without parameters
router.get('/', getAllStockQIndices);
router.post('/', createStockQIndex);

// Stock specific routes with prefixes
router.get('/stock/:stockId', getQIndicesByStockId);
router.post('/stock/:stockId/bulk', bulkImportStockQIndices);

// ID parameter routes
router.get('/:id', getStockQIndexById);
router.put('/:id', updateStockQIndex);
router.delete('/:id', deleteStockQIndex);

export default router; 