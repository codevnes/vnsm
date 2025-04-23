import { Router } from 'express';
import { getStockProfile } from '../controllers/profileController';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     StockProfile:
 *       type: object
 *       properties:
 *         stock:
 *           $ref: '#/components/schemas/Stock'
 *         epsRecords:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EpsRecord'
 *         peRecords:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PeRecord'
 *         roaRoeRecords:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RoaRoeRecord'
 *         financialRatioRecords:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FinancialRatioRecord'
 */

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: API để lấy thông tin profile đầy đủ của cổ phiếu
 */

/**
 * @swagger
 * /api/profile/{symbol}:
 *   get:
 *     summary: Lấy thông tin profile đầy đủ của cổ phiếu dựa trên symbol
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         schema:
 *           type: string
 *         required: true
 *         description: Mã cổ phiếu (ví dụ: VNM, FPT)
 *     responses:
 *       200:
 *         description: Thông tin profile đầy đủ của cổ phiếu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StockProfile'
 *       404:
 *         description: Không tìm thấy cổ phiếu
 *       500:
 *         description: Lỗi server
 */
router.get('/:symbol', getStockProfile);

export default router;