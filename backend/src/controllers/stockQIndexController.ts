import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '../lib/prisma';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

// Create a new stock Q-index
export const createStockQIndex = async (req: Request, res: Response): Promise<void> => {
    const { stock_id, date, open, low, high, close, trend_q, fq, qv1, band_down, band_up } = req.body;

    // Basic validation
    if (!stock_id || !date) {
        res.status(400).json({ message: 'Stock ID and date are required' });
        return;
    }

    try {
        const stockQIndex = await prisma.stockQIndex.create({
            data: {
                stock_id: BigInt(stock_id),
                date: new Date(date),
                open: open !== undefined && open !== null ? new Prisma.Decimal(open) : null,
                low: low !== undefined && low !== null ? new Prisma.Decimal(low) : null,
                high: high !== undefined && high !== null ? new Prisma.Decimal(high) : null,
                close: close !== undefined && close !== null ? new Prisma.Decimal(close) : null,
                trend_q: trend_q !== undefined && trend_q !== null ? new Prisma.Decimal(trend_q) : null,
                fq: fq !== undefined && fq !== null ? new Prisma.Decimal(fq) : null,
                qv1: qv1 !== undefined && qv1 !== null ? BigInt(qv1) : null,
                band_down: band_down !== undefined && band_down !== null ? new Prisma.Decimal(band_down) : null,
                band_up: band_up !== undefined && band_up !== null ? new Prisma.Decimal(band_up) : null,
            },
            include: {
                stock: true
            }
        });

        // Serialize BigInt to string for JSON
        const serializedStockQIndex = {
            ...stockQIndex,
            id: stockQIndex.id.toString(),
            stock_id: stockQIndex.stock_id.toString(),
            qv1: stockQIndex.qv1?.toString() || null,
            stock: stockQIndex.stock ? {
                ...stockQIndex.stock,
                id: stockQIndex.stock.id.toString()
            } : null
        };

        res.status(201).json(serializedStockQIndex);
    } catch (error) {
        console.error('Error creating stock Q-index:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                res.status(409).json({ message: 'A Q-index for this stock and date already exists' });
                return;
            } else if (error.code === 'P2003') {
                res.status(404).json({ message: 'Stock not found' });
                return;
            }
        }
        res.status(500).json({ message: 'Server error creating stock Q-index' });
    }
};

// Update a stock Q-index
export const updateStockQIndex = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { stock_id, date, open, low, high, close, trend_q, fq, qv1, band_down, band_up } = req.body;

    try {
        // Validate that ID exists
        const existingQIndex = await prisma.stockQIndex.findUnique({
            where: { id: BigInt(id) }
        });

        if (!existingQIndex) {
            res.status(404).json({ message: 'Stock Q-index not found' });
            return;
        }

        // Build update data
        const updateData: any = {};
        
        if (stock_id !== undefined) updateData.stock_id = BigInt(stock_id);
        if (date !== undefined) updateData.date = new Date(date);
        if (open !== undefined) updateData.open = open !== null ? new Prisma.Decimal(open) : null;
        if (low !== undefined) updateData.low = low !== null ? new Prisma.Decimal(low) : null;
        if (high !== undefined) updateData.high = high !== null ? new Prisma.Decimal(high) : null;
        if (close !== undefined) updateData.close = close !== null ? new Prisma.Decimal(close) : null;
        if (trend_q !== undefined) updateData.trend_q = trend_q !== null ? new Prisma.Decimal(trend_q) : null;
        if (fq !== undefined) updateData.fq = fq !== null ? new Prisma.Decimal(fq) : null;
        if (qv1 !== undefined) updateData.qv1 = qv1 !== null ? BigInt(qv1) : null;
        if (band_down !== undefined) updateData.band_down = band_down !== null ? new Prisma.Decimal(band_down) : null;
        if (band_up !== undefined) updateData.band_up = band_up !== null ? new Prisma.Decimal(band_up) : null;

        const updatedQIndex = await prisma.stockQIndex.update({
            where: { id: BigInt(id) },
            data: updateData,
            include: {
                stock: true
            }
        });

        // Serialize BigInt for JSON response
        const serializedQIndex = {
            ...updatedQIndex,
            id: updatedQIndex.id.toString(),
            stock_id: updatedQIndex.stock_id.toString(),
            qv1: updatedQIndex.qv1?.toString() || null,
            stock: updatedQIndex.stock ? {
                ...updatedQIndex.stock,
                id: updatedQIndex.stock.id.toString()
            } : null
        };

        res.status(200).json(serializedQIndex);
    } catch (error) {
        console.error('Error updating stock Q-index:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                res.status(409).json({ message: 'A Q-index for this stock and date already exists' });
                return;
            } else if (error.code === 'P2003') {
                res.status(404).json({ message: 'Stock not found' });
                return;
            }
        }
        res.status(500).json({ message: 'Server error updating stock Q-index' });
    }
};

// Delete a stock Q-index
export const deleteStockQIndex = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;

    try {
        // Check if the Q-index exists
        const qIndex = await prisma.stockQIndex.findUnique({
            where: { id: BigInt(id) }
        });

        if (!qIndex) {
            res.status(404).json({ message: 'Stock Q-index not found' });
            return;
        }

        // Delete the Q-index
        await prisma.stockQIndex.delete({
            where: { id: BigInt(id) }
        });

        res.status(200).json({ message: 'Stock Q-index deleted successfully' });
    } catch (error) {
        console.error('Error deleting stock Q-index:', error);
        res.status(500).json({ message: 'Server error deleting stock Q-index' });
    }
};

// Get a stock Q-index by ID
export const getStockQIndexById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;

    try {
        const qIndex = await prisma.stockQIndex.findUnique({
            where: { id: BigInt(id) },
            include: {
                stock: true
            }
        });

        if (!qIndex) {
            res.status(404).json({ message: 'Stock Q-index not found' });
            return;
        }

        // Serialize BigInt for JSON response
        const serializedQIndex = {
            ...qIndex,
            id: qIndex.id.toString(),
            stock_id: qIndex.stock_id.toString(),
            qv1: qIndex.qv1?.toString() || null,
            stock: qIndex.stock ? {
                ...qIndex.stock,
                id: qIndex.stock.id.toString()
            } : null
        };

        res.status(200).json(serializedQIndex);
    } catch (error) {
        console.error('Error fetching stock Q-index:', error);
        res.status(500).json({ message: 'Server error fetching stock Q-index' });
    }
};

// Get all stock Q-indices
export const getAllStockQIndices = async (req: Request, res: Response): Promise<void> => {
    // Query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Additional query parameters
    const stockId = req.query.stock_id ? BigInt(req.query.stock_id as string) : undefined;
    const sortBy = req.query.sortBy as string || 'date';
    const sortOrder = (req.query.sortOrder as string || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    try {
        // Build filter conditions
        const where: any = {};
        
        // Filter by stock_id if provided
        if (stockId) {
            where.stock_id = stockId;
        }
        
        // Add date range filters if provided
        if (startDate || endDate) {
            where.date = {};
            if (startDate) {
                where.date.gte = startDate;
            }
            if (endDate) {
                where.date.lte = endDate;
            }
        }
        
        // Build dynamic order by
        const orderBy: any = {};
        // Only allow sorting by valid fields
        const allowedSortFields = ['id', 'date', 'open', 'high', 'low', 'close', 'trend_q', 'fq', 'qv1'];
        if (allowedSortFields.includes(sortBy)) {
            orderBy[sortBy] = sortOrder;
        } else {
            orderBy.date = 'desc'; // Default sorting
        }

        // Query with filters and sorting
        const qIndices = await prisma.stockQIndex.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                stock: true
            }
        });

        // Get total count with the same filters for pagination
        const total = await prisma.stockQIndex.count({ where });

        // Serialize BigInt values for JSON response
        const serializedQIndices = qIndices.map(qIndex => ({
            ...qIndex,
            id: qIndex.id.toString(),
            stock_id: qIndex.stock_id.toString(),
            qv1: qIndex.qv1?.toString() || null,
            stock: qIndex.stock ? {
                ...qIndex.stock,
                id: qIndex.stock.id.toString()
            } : null
        }));

        res.status(200).json({
            data: serializedQIndices,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            filters: {
                stock_id: stockId ? stockId.toString() : null,
                startDate: startDate?.toISOString() || null,
                endDate: endDate?.toISOString() || null
            },
            sort: {
                field: sortBy,
                order: sortOrder
            }
        });
    } catch (error) {
        console.error('Error fetching all stock Q-indices:', error);
        res.status(500).json({ message: 'Server error fetching all stock Q-indices' });
    }
};

// Get Q-indices by stock ID
export const getQIndicesByStockId = async (req: Request, res: Response): Promise<void> => {
    const stockId = req.params.stockId;
    
    // Query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    try {
        // Check if stock exists
        const stock = await prisma.stock.findUnique({
            where: { id: BigInt(stockId) }
        });

        if (!stock) {
            res.status(404).json({ message: 'Stock not found' });
            return;
        }

        // Get Q-indices for the stock
        const qIndices = await prisma.stockQIndex.findMany({
            where: { stock_id: BigInt(stockId) },
            skip,
            take: limit,
            orderBy: { date: 'desc' }
        });

        // Get total count for pagination
        const total = await prisma.stockQIndex.count({
            where: { stock_id: BigInt(stockId) }
        });

        // Serialize BigInt values for JSON response
        const serializedQIndices = qIndices.map(qIndex => ({
            ...qIndex,
            id: qIndex.id.toString(),
            stock_id: qIndex.stock_id.toString(),
            qv1: qIndex.qv1?.toString() || null
        }));

        res.status(200).json({
            data: serializedQIndices,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching Q-indices by stock ID:', error);
        res.status(500).json({ message: 'Server error fetching Q-indices by stock ID' });
    }
};

// Bulk import Q-indices for a specific stock
export const bulkImportStockQIndices = async (req: Request, res: Response): Promise<void> => {
    const stockId = req.params.stockId;
    const qIndices = req.body;

    if (!Array.isArray(qIndices) || qIndices.length === 0) {
        res.status(400).json({ message: 'Invalid input: expected array of Q-indices' });
        return;
    }

    try {
        // Check if stock exists
        const stock = await prisma.stock.findUnique({
            where: { id: BigInt(stockId) }
        });

        if (!stock) {
            res.status(404).json({ message: 'Stock not found' });
            return;
        }

        // Process each Q-index
        const results = {
            successful: 0,
            failed: 0,
            errors: [] as Array<{ index: number; message: string }>
        };

        // Process in batches to avoid overwhelming the database
        const batchSize = 100;
        for (let i = 0; i < qIndices.length; i += batchSize) {
            const batch = qIndices.slice(i, i + batchSize);
            
            // Process each item in the current batch
            const promises = batch.map(async (item, index) => {
                const actualIndex = i + index;
                
                try {
                    // Validate required fields
                    if (!item.date) {
                        results.failed++;
                        results.errors.push({ 
                            index: actualIndex, 
                            message: 'Date is required' 
                        });
                        return;
                    }

                    // Create or update Q-index
                    await prisma.stockQIndex.upsert({
                        where: {
                            stock_id_date: {
                                stock_id: BigInt(stockId),
                                date: new Date(item.date)
                            }
                        },
                        update: {
                            open: item.open !== undefined && item.open !== null ? new Prisma.Decimal(item.open) : undefined,
                            low: item.low !== undefined && item.low !== null ? new Prisma.Decimal(item.low) : undefined,
                            high: item.high !== undefined && item.high !== null ? new Prisma.Decimal(item.high) : undefined,
                            close: item.close !== undefined && item.close !== null ? new Prisma.Decimal(item.close) : undefined,
                            trend_q: item.trend_q !== undefined && item.trend_q !== null ? new Prisma.Decimal(item.trend_q) : undefined,
                            fq: item.fq !== undefined && item.fq !== null ? new Prisma.Decimal(item.fq) : undefined,
                            qv1: item.qv1 !== undefined && item.qv1 !== null ? BigInt(item.qv1) : undefined,
                            band_down: item.band_down !== undefined && item.band_down !== null ? new Prisma.Decimal(item.band_down) : undefined,
                            band_up: item.band_up !== undefined && item.band_up !== null ? new Prisma.Decimal(item.band_up) : undefined,
                        },
                        create: {
                            stock_id: BigInt(stockId),
                            date: new Date(item.date),
                            open: item.open !== undefined && item.open !== null ? new Prisma.Decimal(item.open) : null,
                            low: item.low !== undefined && item.low !== null ? new Prisma.Decimal(item.low) : null,
                            high: item.high !== undefined && item.high !== null ? new Prisma.Decimal(item.high) : null,
                            close: item.close !== undefined && item.close !== null ? new Prisma.Decimal(item.close) : null,
                            trend_q: item.trend_q !== undefined && item.trend_q !== null ? new Prisma.Decimal(item.trend_q) : null,
                            fq: item.fq !== undefined && item.fq !== null ? new Prisma.Decimal(item.fq) : null,
                            qv1: item.qv1 !== undefined && item.qv1 !== null ? BigInt(item.qv1) : null,
                            band_down: item.band_down !== undefined && item.band_down !== null ? new Prisma.Decimal(item.band_down) : null,
                            band_up: item.band_up !== undefined && item.band_up !== null ? new Prisma.Decimal(item.band_up) : null,
                        }
                    });
                    
                    results.successful++;
                } catch (error) {
                    console.error(`Error processing Q-index at index ${actualIndex}:`, error);
                    results.failed++;
                    results.errors.push({ 
                        index: actualIndex, 
                        message: error instanceof Error ? error.message : 'Unknown error' 
                    });
                }
            });
            
            await Promise.all(promises);
        }

        res.status(200).json({
            message: 'Bulk import completed',
            results
        });
    } catch (error) {
        console.error('Error bulk importing Q-indices:', error);
        res.status(500).json({ message: 'Server error bulk importing Q-indices' });
    }
};

// Bulk import Q-indices by symbol from CSV
export const bulkImportQIndicesBySymbol = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
        res.status(400).json({ message: 'No CSV file uploaded' });
        return;
    }

    const results = {
        successful: 0,
        failed: 0,
        errors: [] as Array<{ row: number; message: string; data?: any }>,
        processedRows: 0
    };

    try {
        const csvBuffer = req.file.buffer;
        const records: any[] = [];
        
        // Parse CSV
        const parser = parse({
            columns: (header: string[]) => header.map((h: string) => h.toLowerCase().trim().replace('_', '').replace('-', '')),
            skip_empty_lines: true,
            trim: true
        });
        
        const stream = Readable.from(csvBuffer);
        
        // Wait for CSV parsing to complete
        await new Promise<void>((resolve, reject) => {
            stream.pipe(parser)
                .on('data', (record: any) => {
                    records.push(record);
                })
                .on('error', (error: Error) => {
                    reject(error);
                })
                .on('end', () => {
                    resolve();
                });
        });
        
        console.log('Parsed records:', records[0]); // Log first record for debugging
        
        // Process records by symbol
        for (let i = 0; i < records.length; i++) {
            results.processedRows++;
            const record = records[i];
            
            // Check for required fields (normalized field names)
            if (!record.symbol || !record.date) {
                results.failed++;
                results.errors.push({
                    row: i + 2, // +2 for header row and 0-indexing
                    message: 'Missing required field(s): symbol or date',
                    data: record
                });
                continue;
            }
            
            // Parse date from DD/MM/YYYY format
            let date: Date;
            try {
                // Parse date in DD/MM/YYYY format
                const [day, month, year] = record.date.split('/').map(Number);
                if (!day || !month || !year) {
                    throw new Error('Invalid date format');
                }
                date = new Date(year, month - 1, day); // month is 0-indexed in JS Date
                
                if (isNaN(date.getTime())) {
                    throw new Error('Invalid date');
                }
            } catch (error) {
                results.failed++;
                results.errors.push({
                    row: i + 2,
                    message: `Invalid date format: ${record.date}. Expected DD/MM/YYYY`,
                    data: record
                });
                continue;
            }
            
            try {
                // Find stock by symbol
                const stock = await prisma.stock.findFirst({
                    where: { symbol: record.symbol.trim().toUpperCase() }
                });
                
                if (!stock) {
                    results.failed++;
                    results.errors.push({
                        row: i + 2,
                        message: `Stock with symbol "${record.symbol}" not found`,
                        data: record
                    });
                    continue;
                }
                
                // Create or update Q-index
                await prisma.stockQIndex.upsert({
                    where: {
                        stock_id_date: {
                            stock_id: stock.id,
                            date: date
                        }
                    },
                    update: {
                        open: record.open !== undefined && record.open !== '' ? new Prisma.Decimal(record.open) : undefined,
                        low: record.low !== undefined && record.low !== '' ? new Prisma.Decimal(record.low) : undefined,
                        high: record.high !== undefined && record.high !== '' ? new Prisma.Decimal(record.high) : undefined,
                        close: (record.close !== undefined && record.close !== '') ? new Prisma.Decimal(record.close) : undefined,
                        trend_q: (record.trendq !== undefined && record.trendq !== '') ? new Prisma.Decimal(record.trendq) : undefined,
                        fq: (record.fq !== undefined && record.fq !== '') ? new Prisma.Decimal(record.fq) : undefined,
                        qv1: (record.qv1 !== undefined && record.qv1 !== '') ? BigInt(record.qv1) : undefined,
                        band_down: (record.banddown !== undefined && record.banddown !== '') ? new Prisma.Decimal(record.banddown) : undefined,
                        band_up: (record.bandup !== undefined && record.bandup !== '') ? new Prisma.Decimal(record.bandup) : undefined,
                    },
                    create: {
                        stock_id: stock.id,
                        date: date,
                        open: record.open !== undefined && record.open !== '' ? new Prisma.Decimal(record.open) : null,
                        low: record.low !== undefined && record.low !== '' ? new Prisma.Decimal(record.low) : null,
                        high: record.high !== undefined && record.high !== '' ? new Prisma.Decimal(record.high) : null,
                        close: (record.close !== undefined && record.close !== '') ? new Prisma.Decimal(record.close) : null,
                        trend_q: (record.trendq !== undefined && record.trendq !== '') ? new Prisma.Decimal(record.trendq) : null,
                        fq: (record.fq !== undefined && record.fq !== '') ? new Prisma.Decimal(record.fq) : null,
                        qv1: (record.qv1 !== undefined && record.qv1 !== '') ? BigInt(record.qv1) : null,
                        band_down: (record.banddown !== undefined && record.banddown !== '') ? new Prisma.Decimal(record.banddown) : null,
                        band_up: (record.bandup !== undefined && record.bandup !== '') ? new Prisma.Decimal(record.bandup) : null,
                    }
                });
                
                results.successful++;
            } catch (error) {
                console.error(`Error at row ${i+2}:`, error, 'Record:', record);
                results.failed++;
                results.errors.push({
                    row: i + 2,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    data: record
                });
            }
        }
        
        res.status(200).json({
            message: 'Bulk import completed',
            summary: {
                successful: results.successful,
                failed: results.failed,
                totalProcessed: results.processedRows,
                totalRecords: records.length
            },
            errors: results.errors.length > 0 ? results.errors : undefined
        });
    } catch (error) {
        console.error('Error processing CSV file:', error);
        res.status(500).json({ 
            message: 'Error processing CSV file',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
