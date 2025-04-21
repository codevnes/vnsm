import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '../lib/prisma';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

// --- Stock CRUD Operations --- 

// Create a new stock
export const createStock = async (req: Request, res: Response): Promise<void> => {
    const { symbol, name, exchange, industry } = req.body;

    // Basic validation
    if (!symbol || !name) {
        res.status(400).json({ message: 'Symbol and Name are required' });
        return;
    }

    try {
        const newStock = await prisma.stock.create({
            data: {
                symbol: symbol.toUpperCase(), // Often symbols are uppercase
                name,
                exchange,
                industry
            }
        });
        // Convert BigInt ID
        const serializedStock = {
            ...newStock,
            id: newStock.id.toString(),
        };
        res.status(201).json(serializedStock);
    } catch (error) {
        console.error('Error creating stock:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
             res.status(409).json({ message: `Stock with symbol '${symbol}' already exists` });
             return;
        }
        res.status(500).json({ message: 'Server error creating stock' });
    }
};

// Update an existing stock
export const updateStock = async (req: Request, res: Response): Promise<void> => {
    const stockId = BigInt(req.params.id);
    const { symbol, name, exchange, industry } = req.body;

    const dataToUpdate: Prisma.StockUpdateInput = {};
    if (symbol) dataToUpdate.symbol = symbol.toUpperCase();
    if (name) dataToUpdate.name = name;
    if (exchange !== undefined) dataToUpdate.exchange = exchange;
    if (industry !== undefined) dataToUpdate.industry = industry;

    // Check if there is data to update
    if (Object.keys(dataToUpdate).length === 0) {
        res.status(400).json({ message: 'No valid fields provided for update' });
        return;
    }

    try {
        const updatedStock = await prisma.stock.update({
            where: { id: stockId },
            data: dataToUpdate
        });
         // Convert BigInt ID
        const serializedStock = {
            ...updatedStock,
            id: updatedStock.id.toString(),
        };
        res.status(200).json(serializedStock);
    } catch (error) {
        console.error('Error updating stock:', error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') { // Unique constraint failed (symbol)
                 res.status(409).json({ message: `Stock with symbol '${symbol}' already exists` });
                 return;
            }
            if (error.code === 'P2025') { // Record not found
                res.status(404).json({ message: 'Stock not found' });
                return;
            }
        }
        res.status(500).json({ message: 'Server error updating stock' });
    }
};

// Delete a stock
export const deleteStock = async (req: Request, res: Response): Promise<void> => {
    const stockId = BigInt(req.params.id);

    try {
        // Check if stock is associated with any posts before deleting? (Optional)
        // const relatedPosts = await prisma.post.count({ where: { stock_id: stockId } });
        // if (relatedPosts > 0) {
        //     res.status(400).json({ message: 'Cannot delete stock associated with posts. Please reassign or delete posts first.' });
        //     return;
        // }

        await prisma.stock.delete({
            where: { id: stockId }
        });
        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting stock:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Stock not found' });
            return;
        }
         // Handle potential errors if stock is linked via foreign keys not set to cascade/nullify
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
             res.status(409).json({ message: 'Cannot delete stock because it is referenced by other records (e.g., posts).' });
            return;
        }
        res.status(500).json({ message: 'Server error deleting stock' });
    }
};

// Get all stocks with pagination and filtering
export const getAllStocks = async (req: Request, res: Response): Promise<void> => {
    const { 
        page = '1', 
        limit = '10', 
        sortBy = 'symbol', 
        sortOrder = 'asc',
        name, // Added name filter query param
        symbol // Added symbol filter query param
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build the WHERE clause for filtering
    const where: Prisma.StockWhereInput = {};
    if (name && typeof name === 'string' && name.trim() !== '') {
        where.name = {
            contains: name.trim()
        };
    }
    if (symbol && typeof symbol === 'string' && symbol.trim() !== '') {
        where.symbol = {
            equals: symbol.trim().toUpperCase(), // Exact match, ensure uppercase
        };
    }

    // Define allowed sort fields
    const allowedSortByFields: Array<keyof Pick<Prisma.StockOrderByWithRelationInput, 'symbol' | 'name' | 'exchange' | 'industry'>> = ['symbol', 'name', 'exchange', 'industry'];
    const sortField = sortBy as string;
    const sortDir: Prisma.SortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
    let orderBy: Prisma.StockOrderByWithRelationInput = { symbol: 'asc' };
    if (allowedSortByFields.includes(sortField as 'symbol' | 'name' | 'exchange' | 'industry')) {
        orderBy = { [sortField]: sortDir };
    }

    try {
        // Use the WHERE clause in both findMany and count
        const [stocks, totalStocks] = await prisma.$transaction([
            prisma.stock.findMany({
                where, // Apply filters
                skip,
                take: limitNum,
                orderBy,
            }),
            prisma.stock.count({ where }) // Apply filters to count
        ]);

        // Convert BigInt IDs to strings
        const serializedStocks = stocks.map(stock => ({
            ...stock,
            id: stock.id.toString(),
        }));

        res.status(200).json({
            data: serializedStocks,
            pagination: {
                totalItems: totalStocks,
                itemCount: stocks.length,
                itemsPerPage: limitNum,
                totalPages: Math.ceil(totalStocks / limitNum),
                currentPage: pageNum,
            }
        });
    } catch (error) {
        console.error('Error fetching stocks:', error);
        res.status(500).json({ message: 'Server error fetching stocks' });
    }
};

// Search stocks by keyword (searches both symbol and name)
export const searchStocks = async (req: Request, res: Response): Promise<void> => {
    const { 
        keyword,
        page = '1', 
        limit = '10', 
        sortBy = 'symbol', 
        sortOrder = 'asc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build the WHERE clause with OR condition to search in both fields
    const where: Prisma.StockWhereInput = {};
    
    if (keyword && typeof keyword === 'string' && keyword.trim() !== '') {
        const searchTerm = keyword.trim();
        where.OR = [
            {
                symbol: {
                    contains: searchTerm.toUpperCase(),
                }
            },
            {
                name: {
                    contains: searchTerm,
                }
            }
        ];
    }

    // Define allowed sort fields
    const allowedSortByFields: Array<keyof Pick<Prisma.StockOrderByWithRelationInput, 'symbol' | 'name' | 'exchange' | 'industry'>> = ['symbol', 'name', 'exchange', 'industry'];
    const sortField = sortBy as string;
    const sortDir: Prisma.SortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
    let orderBy: Prisma.StockOrderByWithRelationInput = { symbol: 'asc' };
    if (allowedSortByFields.includes(sortField as 'symbol' | 'name' | 'exchange' | 'industry')) {
        orderBy = { [sortField]: sortDir };
    }

    try {
        // Use the WHERE clause in both findMany and count
        const [stocks, totalStocks] = await prisma.$transaction([
            prisma.stock.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
            }),
            prisma.stock.count({ where })
        ]);

        // Convert BigInt IDs to strings
        const serializedStocks = stocks.map(stock => ({
            ...stock,
            id: stock.id.toString(),
        }));

        res.status(200).json({
            data: serializedStocks,
            pagination: {
                totalItems: totalStocks,
                itemCount: stocks.length,
                itemsPerPage: limitNum,
                totalPages: Math.ceil(totalStocks / limitNum),
                currentPage: pageNum,
            }
        });
    } catch (error) {
        console.error('Error searching stocks:', error);
        res.status(500).json({ message: 'Server error searching stocks' });
    }
};

// Get a single stock by ID
export const getStockById = async (req: Request, res: Response): Promise<void> => {
    const stockId = BigInt(req.params.id);
    try {
        const stock = await prisma.stock.findUnique({
            where: { id: stockId },
            // Optionally include related posts or other data
            // include: { posts: { select: { id: true, title: true, slug: true }, take: 5, orderBy: { createdAt: 'desc'} } }
        });

        if (!stock) {
            res.status(404).json({ message: 'Stock not found' });
            return;
        }

        // Convert BigInt IDs to strings
        const serializedStock = {
            ...stock,
            id: stock.id.toString(),
            // Process included relations if any
            // posts: stock.posts?.map(post => ({ ...post, id: post.id.toString() }))
        };

        res.status(200).json(serializedStock);
    } catch (error) {
        console.error('Error fetching stock by ID:', error);
         if (error instanceof Error && error.message.includes('Invalid BigInt string')) {
            res.status(400).json({ message: 'Invalid stock ID format' });
            return;
         }
        res.status(500).json({ message: 'Server error fetching stock' });
    }
};

// Get a stock by symbol
export const getStockBySymbol = async (req: Request, res: Response): Promise<void> => {
    const { symbol } = req.params;
    
    if (!symbol) {
        res.status(400).json({ message: 'Symbol is required' });
        return;
    }
    
    try {
        const stock = await prisma.stock.findUnique({
            where: { symbol: symbol.toUpperCase() }
        });

        if (!stock) {
            res.status(404).json({ message: 'Stock not found' });
            return;
        }

        // Convert BigInt ID to string
        const serializedStock = {
            ...stock,
            id: stock.id.toString(),
        };

        res.status(200).json(serializedStock);
    } catch (error) {
        console.error('Error fetching stock by symbol:', error);
        res.status(500).json({ message: 'Server error fetching stock' });
    }
};

// --- NEW: Bulk Import Stocks from CSV --- 
export const bulkImportStocks = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
        res.status(400).json({ message: 'No CSV file uploaded.' });
        return;
    }

    const results: any[] = [];
    let processedRowCount = 0;
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: { row: number; message: string; data?: any }[] = [];
    const csvBuffer = req.file.buffer;

    const stream = Readable.from(csvBuffer);

    stream
        .pipe(csvParser({
            mapHeaders: ({ header }) => header.trim().toLowerCase(), // Normalize headers
            skipLines: 0 // Assuming first line is headers
        }))
        .on('data', (row) => {
            processedRowCount++;
            // Basic validation and mapping (adjust headers based on your CSV)
            const symbol = row.symbol?.trim().toUpperCase();
            const name = row.name?.trim();
            const exchange = row.exchange?.trim() || null;
            const industry = row.industry?.trim() || null;

            if (!symbol || !name) {
                // Skip row if required fields are missing
                console.warn(`Skipping row ${processedRowCount}: Missing symbol or name. Data:`, row);
                errors.push({ row: processedRowCount, message: "Missing required field(s) (symbol, name)", data: row });
                skippedCount++;
                return; // Skip processing this row
            }
            
             // Limit length if needed by schema
            const prismaData = {
                symbol: symbol.substring(0, 20), // Max 20 chars from schema
                name: name.substring(0, 255), // Max 255 chars from schema
                exchange: exchange ? exchange.substring(0, 100) : null,
                industry: industry ? industry.substring(0, 100) : null,
            };

            results.push(prismaData); // Add valid data to results array for processing
        })
        .on('end', async () => {
            console.log(`CSV parsing finished. ${processedRowCount} rows read. ${results.length} valid rows found.`);

            if (results.length === 0 && processedRowCount > 0) {
                 res.status(400).json({ 
                    message: `Processed ${processedRowCount} rows, but no valid stock data found to import. Check CSV headers (symbol, name, exchange, industry) and data.`,
                    errors
                });
                return;
            }
             if (results.length === 0) {
                 res.status(400).json({ message: 'CSV file is empty or contains no valid data.' });
                return;
            }

            // Process valid rows using Prisma upsert
            let successfulUpserts = 0; // Track successful operations
            for (const data of results) {
                try {
                    await prisma.stock.upsert({
                        where: { symbol: data.symbol },
                        update: { 
                            name: data.name,
                            exchange: data.exchange,
                            industry: data.industry
                         },
                        create: data,
                    });
                    successfulUpserts++; // Count success
                    // REMOVED inaccurate added/updated count logic

                } catch (dbError: any) {
                    console.error(`Error upserting stock symbol ${data.symbol}:`, dbError);
                    // Estimate row number for error reporting
                     const approxErrorRow = processedRowCount - results.length + errors.length + successfulUpserts + skippedCount + 1;
                    errors.push({ row: approxErrorRow, message: `Database error: ${dbError.message || 'Unknown error'}`, data: data });
                    skippedCount++;
                }
            }

            // Use successfulUpserts instead of added/updated
            console.log(`Import finished. Successful Upserts: ${successfulUpserts}, Skipped: ${skippedCount}`);

            res.status(200).json({
                message: `Bulk import finished. Processed ${processedRowCount} CSV rows.`,
                summary: {
                    successful: successfulUpserts,
                    skipped: skippedCount,
                    totalCsvRows: processedRowCount
                },
                errors: errors
            });
        })
        .on('error', (error) => {
            console.error('Error parsing CSV:', error);
            res.status(500).json({ message: 'Error parsing CSV file.', error: error.message });
        });
};

// TODO: Add getStockById, getAllStocks 