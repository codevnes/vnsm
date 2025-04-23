import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '../lib/prisma';

/**
 * Lấy toàn bộ thông tin profile của một cổ phiếu dựa trên symbol
 * Bao gồm thông tin từ bảng stock và các bảng liên quan như eps-records, pe-records, roa-roe-records, và financial-ratio-records
 */
export const getStockProfile = async (req: Request, res: Response): Promise<void> => {
    const { symbol } = req.params;
    
    if (!symbol) {
        res.status(400).json({ message: 'Symbol là bắt buộc' });
        return;
    }
    
    try {
        // Lấy thông tin cơ bản của cổ phiếu
        const stock = await prisma.stock.findUnique({
            where: { symbol: symbol.toUpperCase() }
        });

        if (!stock) {
            res.status(404).json({ message: `Không tìm thấy cổ phiếu với mã ${symbol}` });
            return;
        }

        // Lấy dữ liệu EPS
        const epsRecords = await prisma.epsRecord.findMany({
            where: { symbol: symbol.toUpperCase() },
            orderBy: { reportDate: 'desc' },
            take: 10 // Lấy 10 bản ghi gần nhất
        });

        // Lấy dữ liệu PE
        const peRecords = await prisma.peRecord.findMany({
            where: { symbol: symbol.toUpperCase() },
            orderBy: { reportDate: 'desc' },
            take: 10 // Lấy 10 bản ghi gần nhất
        });

        // Lấy dữ liệu ROA/ROE
        const roaRoeRecords = await prisma.roaRoeRecord.findMany({
            where: { symbol: symbol.toUpperCase() },
            orderBy: { reportDate: 'desc' },
            take: 10 // Lấy 10 bản ghi gần nhất
        });

        // Lấy dữ liệu Financial Ratio
        const financialRatioRecords = await prisma.financialRatioRecord.findMany({
            where: { symbol: symbol.toUpperCase() },
            orderBy: { reportDate: 'desc' },
            take: 10 // Lấy 10 bản ghi gần nhất
        });

        // Chuyển đổi BigInt ID thành chuỗi
        const serializedStock = {
            ...stock,
            id: stock.id.toString(),
        };

        const serializedEpsRecords = epsRecords.map(record => ({
            ...record,
            id: record.id.toString(),
        }));

        const serializedPeRecords = peRecords.map(record => ({
            ...record,
            id: record.id.toString(),
        }));

        const serializedRoaRoeRecords = roaRoeRecords.map(record => ({
            ...record,
            id: record.id.toString(),
        }));

        const serializedFinancialRatioRecords = financialRatioRecords.map(record => ({
            ...record,
            id: record.id.toString(),
        }));

        // Trả về tất cả dữ liệu
        res.status(200).json({
            stock: serializedStock,
            epsRecords: serializedEpsRecords,
            peRecords: serializedPeRecords,
            roaRoeRecords: serializedRoaRoeRecords,
            financialRatioRecords: serializedFinancialRatioRecords
        });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin profile cổ phiếu:', error);
        res.status(500).json({ message: 'Lỗi server khi lấy thông tin profile cổ phiếu' });
    }
};