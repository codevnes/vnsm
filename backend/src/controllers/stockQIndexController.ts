import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '../generated/prisma';

// --- StockQIndex CRUD Operations ---

// Create a new stock Q-index record
export const createStockQIndex = async (req: Request, res: Response): Promise<void> => {
    const { 
        stock_id, 
        date, 
        open, 
        low, 
        high, 
        trend_q, 
        fq, 
        qv1, 
        band_down, 
        band_up 
    } = req.body;

    // Basic validation
    if (!stock_id || !date) {
        res.status(400).json({ message: 'Stock ID and date are required' });
        return;
    }

    try {
        // Verify stock exists
        const stockExists = await prisma.stock.findUnique({
            where: { id: BigInt(stock_id) }
        });

        if (!stockExists) {
            res.status(404).json({ message: `Stock with ID ${stock_id} not found` });
            return;
        }

        const newStockQIndex = await prisma.stockQIndex.create({
            data: {
                stock_id: BigInt(stock_id),
                date: new Date(date),
                open: open ? parseFloat(open) : null,
                low: low ? parseFloat(low) : null,
                high: high ? parseFloat(high) : null,
                trend_q,
                fq,
                qv1,
                band_down: band_down ? parseFloat(band_down) : null,
                band_up: band_up ? parseFloat(band_up) : null
            }
        });

        // Convert BigInt ID to string for JSON response
        const serializedData = {
            ...newStockQIndex,
            id: newStockQIndex.id.toString(),
            stock_id: newStockQIndex.stock_id.toString(),
            // Convert Decimal fields to strings to avoid precision issues
            open: newStockQIndex.open?.toString() || null,
            low: newStockQIndex.low?.toString() || null,
            high: newStockQIndex.high?.toString() || null,
            band_down: newStockQIndex.band_down?.toString() || null,
            band_up: newStockQIndex.band_up?.toString() || null,
        };

        res.status(201).json(serializedData);
    } catch (error) {
        console.error('Error creating stock Q-index:', error);
        res.status(500).json({ message: 'Server error creating stock Q-index' });
    }
};

// Update an existing stock Q-index record
export const updateStockQIndex = async (req: Request, res: Response): Promise<void> => {
    const qIndexId = BigInt(req.params.id);
    const { 
        stock_id, 
        date, 
        open, 
        low, 
        high, 
        trend_q, 
        fq, 
        qv1, 
        band_down, 
        band_up 
    } = req.body;

    const dataToUpdate: Prisma.StockQIndexUpdateInput = {};
    
    if (stock_id) dataToUpdate.stock = { connect: { id: BigInt(stock_id) } };
    if (date) dataToUpdate.date = new Date(date);
    if (open !== undefined) dataToUpdate.open = open === null ? null : parseFloat(open);
    if (low !== undefined) dataToUpdate.low = low === null ? null : parseFloat(low);
    if (high !== undefined) dataToUpdate.high = high === null ? null : parseFloat(high);
    if (trend_q !== undefined) dataToUpdate.trend_q = trend_q;
    if (fq !== undefined) dataToUpdate.fq = fq;
    if (qv1 !== undefined) dataToUpdate.qv1 = qv1;
    if (band_down !== undefined) dataToUpdate.band_down = band_down === null ? null : parseFloat(band_down);
    if (band_up !== undefined) dataToUpdate.band_up = band_up === null ? null : parseFloat(band_up);

    // Check if there is data to update
    if (Object.keys(dataToUpdate).length === 0) {
        res.status(400).json({ message: 'No valid fields provided for update' });
        return;
    }

    try {
        const updatedQIndex = await prisma.stockQIndex.update({
            where: { id: qIndexId },
            data: dataToUpdate
        });

        // Convert BigInt and Decimal to strings for JSON response
        const serializedData = {
            ...updatedQIndex,
            id: updatedQIndex.id.toString(),
            stock_id: updatedQIndex.stock_id.toString(),
            open: updatedQIndex.open?.toString() || null,
            low: updatedQIndex.low?.toString() || null,
            high: updatedQIndex.high?.toString() || null,
            band_down: updatedQIndex.band_down?.toString() || null,
            band_up: updatedQIndex.band_up?.toString() || null,
        };

        res.status(200).json(serializedData);
    } catch (error) {
        console.error('Error updating stock Q-index:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') { // Record not found
                res.status(404).json({ message: 'Stock Q-index record not found' });
                return;
            }
        }
        res.status(500).json({ message: 'Server error updating stock Q-index' });
    }
};

// Delete a stock Q-index record
export const deleteStockQIndex = async (req: Request, res: Response): Promise<void> => {
    const qIndexId = BigInt(req.params.id);

    try {
        await prisma.stockQIndex.delete({
            where: { id: qIndexId }
        });
        res.status(204).send(); // No content on successful deletion
    } catch (error) {
        console.error('Error deleting stock Q-index:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Stock Q-index record not found' });
            return;
        }
        res.status(500).json({ message: 'Server error deleting stock Q-index' });
    }
};

// Get a single stock Q-index record by ID
export const getStockQIndexById = async (req: Request, res: Response): Promise<void> => {
    const qIndexId = BigInt(req.params.id);
    
    try {
        const qIndex = await prisma.stockQIndex.findUnique({
            where: { id: qIndexId },
            include: { stock: true } // Include stock details
        });

        if (!qIndex) {
            res.status(404).json({ message: 'Stock Q-index record not found' });
            return;
        }

        // Convert BigInt and Decimal to strings
        const serializedData = {
            ...qIndex,
            id: qIndex.id.toString(),
            stock_id: qIndex.stock_id.toString(),
            stock: {
                ...qIndex.stock,
                id: qIndex.stock.id.toString()
            },
            open: qIndex.open?.toString() || null,
            low: qIndex.low?.toString() || null,
            high: qIndex.high?.toString() || null,
            band_down: qIndex.band_down?.toString() || null,
            band_up: qIndex.band_up?.toString() || null,
        };

        res.status(200).json(serializedData);
    } catch (error) {
        console.error('Error fetching stock Q-index:', error);
        res.status(500).json({ message: 'Server error fetching stock Q-index' });
    }
};

// Get all stock Q-index records with pagination and filtering
export const getAllStockQIndices = async (req: Request, res: Response): Promise<void> => {
    const {
        page = '1',
        limit = '10',
        sortBy = 'date',
        sortOrder = 'desc',
        stock_id,
        date_from,
        date_to
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build the WHERE clause for filtering
    const where: Prisma.StockQIndexWhereInput = {};

    if (stock_id && typeof stock_id === 'string') {
        where.stock_id = BigInt(stock_id);
    }

    // Date range filtering
    if (date_from || date_to) {
        where.date = {};
        if (date_from) {
            where.date.gte = new Date(date_from as string);
        }
        if (date_to) {
            where.date.lte = new Date(date_to as string);
        }
    }

    // Define allowed sort fields
    const allowedSortFields: Array<keyof Pick<Prisma.StockQIndexOrderByWithRelationInput, 'date' | 'open' | 'high' | 'low'>> = 
        ['date', 'open', 'high', 'low'];
    
    const sortField = sortBy as string;
    const sortDir: Prisma.SortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
    
    let orderBy: Prisma.StockQIndexOrderByWithRelationInput = { date: 'desc' }; // Default sort by date
    
    if (allowedSortFields.includes(sortField as 'date' | 'open' | 'high' | 'low')) {
        orderBy = { [sortField]: sortDir };
    }

    try {
        // Use the WHERE clause in both findMany and count
        const [qIndices, totalQIndices] = await prisma.$transaction([
            prisma.stockQIndex.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
                include: { stock: true } // Include stock details
            }),
            prisma.stockQIndex.count({ where })
        ]);

        // Serialize the data to handle BigInt and Decimal values
        const serializedQIndices = qIndices.map(qIndex => ({
            ...qIndex,
            id: qIndex.id.toString(),
            stock_id: qIndex.stock_id.toString(),
            stock: {
                ...qIndex.stock,
                id: qIndex.stock.id.toString()
            },
            open: qIndex.open?.toString() || null,
            low: qIndex.low?.toString() || null,
            high: qIndex.high?.toString() || null,
            band_down: qIndex.band_down?.toString() || null,
            band_up: qIndex.band_up?.toString() || null,
        }));

        res.status(200).json({
            data: serializedQIndices,
            pagination: {
                totalItems: totalQIndices,
                itemCount: qIndices.length,
                itemsPerPage: limitNum,
                totalPages: Math.ceil(totalQIndices / limitNum),
                currentPage: pageNum,
            }
        });
    } catch (error) {
        console.error('Error fetching stock Q-indices:', error);
        res.status(500).json({ message: 'Server error fetching stock Q-indices' });
    }
};

// Get stock Q-index records for a specific stock
export const getQIndicesByStockId = async (req: Request, res: Response): Promise<void> => {
    const stockId = BigInt(req.params.stockId);
    const {
        page = '1',
        limit = '10',
        sortBy = 'date',
        sortOrder = 'desc',
        date_from,
        date_to
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build the WHERE clause
    const where: Prisma.StockQIndexWhereInput = {
        stock_id: stockId
    };

    // Date range filtering
    if (date_from || date_to) {
        where.date = {};
        if (date_from) {
            where.date.gte = new Date(date_from as string);
        }
        if (date_to) {
            where.date.lte = new Date(date_to as string);
        }
    }

    // Set up sorting
    const sortField = sortBy as string;
    const sortDir: Prisma.SortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
    let orderBy: Prisma.StockQIndexOrderByWithRelationInput = { date: 'desc' };
    if (['date', 'open', 'high', 'low'].includes(sortField)) {
        orderBy = { [sortField]: sortDir };
    }

    try {
        // First check if the stock exists
        const stockExists = await prisma.stock.findUnique({
            where: { id: stockId }
        });

        if (!stockExists) {
            res.status(404).json({ message: `Stock with ID ${stockId} not found` });
            return;
        }

        // Fetch q-indices and count
        const [qIndices, totalQIndices] = await prisma.$transaction([
            prisma.stockQIndex.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
            }),
            prisma.stockQIndex.count({ where })
        ]);

        // Serialize the data
        const serializedQIndices = qIndices.map(qIndex => ({
            ...qIndex,
            id: qIndex.id.toString(),
            stock_id: qIndex.stock_id.toString(),
            open: qIndex.open?.toString() || null,
            low: qIndex.low?.toString() || null,
            high: qIndex.high?.toString() || null,
            band_down: qIndex.band_down?.toString() || null,
            band_up: qIndex.band_up?.toString() || null,
        }));

        res.status(200).json({
            data: serializedQIndices,
            stock: {
                id: stockExists.id.toString(),
                symbol: stockExists.symbol,
                name: stockExists.name
            },
            pagination: {
                totalItems: totalQIndices,
                itemCount: qIndices.length,
                itemsPerPage: limitNum,
                totalPages: Math.ceil(totalQIndices / limitNum),
                currentPage: pageNum,
            }
        });
    } catch (error) {
        console.error('Error fetching Q-indices for stock:', error);
        res.status(500).json({ message: 'Server error fetching Q-indices' });
    }
};

// Bulk import Q-index records for a stock
export const bulkImportStockQIndices = async (req: Request, res: Response): Promise<void> => {
    const stockId = BigInt(req.params.stockId);
    const qIndices = req.body.qIndices;

    if (!Array.isArray(qIndices) || qIndices.length === 0) {
        res.status(400).json({ message: 'Please provide an array of Q-index records' });
        return;
    }

    try {
        // Check if the stock exists
        const stockExists = await prisma.stock.findUnique({
            where: { id: stockId }
        });

        if (!stockExists) {
            res.status(404).json({ message: `Stock with ID ${stockId} not found` });
            return;
        }

        // Prepare data for bulk creation
        const dataToCreate = qIndices.map((item: any) => ({
            stock_id: stockId,
            date: new Date(item.date),
            open: item.open ? parseFloat(item.open) : null,
            low: item.low ? parseFloat(item.low) : null,
            high: item.high ? parseFloat(item.high) : null,
            trend_q: item.trend_q || null,
            fq: item.fq || null,
            qv1: item.qv1 || null,
            band_down: item.band_down ? parseFloat(item.band_down) : null,
            band_up: item.band_up ? parseFloat(item.band_up) : null
        }));

        // Use createMany for bulk insertion
        const result = await prisma.stockQIndex.createMany({
            data: dataToCreate,
            skipDuplicates: true // Optional: skip records that would cause unique constraint violations
        });

        res.status(201).json({
            message: `Successfully imported ${result.count} Q-index records for stock ${stockExists.symbol}`,
            count: result.count
        });
    } catch (error) {
        console.error('Error bulk importing Q-indices:', error);
        res.status(500).json({ message: 'Server error during bulk import of Q-indices' });
    }
}; 