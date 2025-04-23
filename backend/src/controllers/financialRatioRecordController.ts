import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '../lib/prisma';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';

// Helper function to parse dates from various formats
const parseDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    
    // If it's already a Date object
    if (dateValue instanceof Date) return dateValue;
    
    const dateStr = String(dateValue);
    
    // Try to parse as ISO format first
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) return isoDate;
    
    // Try DD/MM/YYYY format
    const parts = dateStr.split(/[/\-\.]/);
    if (parts.length === 3) {
        // Assume DD/MM/YYYY
        if (parts[0].length <= 2 && parts[1].length <= 2) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JS
            const year = parseInt(parts[2], 10);
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) return date;
        }
        
        // Try MM/DD/YYYY
        const month = parseInt(parts[0], 10) - 1;
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) return date;
    }
    
    // Default to current date if parsing fails
    console.warn(`Could not parse date: ${dateStr}, using current date`);
    return new Date();
};

// Create a new Financial Ratio record
export const createFinancialRatioRecord = async (req: Request, res: Response): Promise<void> => {
    const { symbol, reportDate, debtEquity, assetsEquity, debtEquityPct } = req.body;

    // Basic validation
    if (!symbol || !reportDate) {
        res.status(400).json({ message: 'Symbol and Report Date are required' });
        return;
    }

    try {
        // Check if the stock exists
        const stock = await prisma.stock.findUnique({ where: { symbol } });
        if (!stock) {
            res.status(404).json({ message: `Stock with symbol '${symbol}' not found` });
            return;
        }

        const newFinancialRatioRecord = await (prisma as any).financialRatioRecord.create({
            data: {
                symbol,
                reportDate: new Date(reportDate),
                debtEquity,
                assetsEquity,
                debtEquityPct
            }
        });

        // Convert BigInt ID
        const serializedRecord = {
            ...newFinancialRatioRecord,
            id: newFinancialRatioRecord.id.toString(),
        };
        res.status(201).json(serializedRecord);
    } catch (error) {
        console.error('Error creating Financial Ratio record:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ message: `Financial Ratio record for symbol '${symbol}' and date already exists` });
            return;
        }
        res.status(500).json({ message: 'Server error creating Financial Ratio record' });
    }
};

// Update an existing Financial Ratio record
export const updateFinancialRatioRecord = async (req: Request, res: Response): Promise<void> => {
    const recordId = BigInt(req.params.id);
    const { symbol, reportDate, debtEquity, assetsEquity, debtEquityPct } = req.body;

    const dataToUpdate: any = {};
    if (symbol) dataToUpdate.symbol = symbol;
    if (reportDate) dataToUpdate.reportDate = new Date(reportDate);
    if (debtEquity !== undefined) dataToUpdate.debtEquity = debtEquity;
    if (assetsEquity !== undefined) dataToUpdate.assetsEquity = assetsEquity;
    if (debtEquityPct !== undefined) dataToUpdate.debtEquityPct = debtEquityPct;

    // Check if there is data to update
    if (Object.keys(dataToUpdate).length === 0) {
        res.status(400).json({ message: 'No valid fields provided for update' });
        return;
    }

    try {
        if (symbol) {
            // Check if the stock exists
            const stock = await prisma.stock.findUnique({ where: { symbol } });
            if (!stock) {
                res.status(404).json({ message: `Stock with symbol '${symbol}' not found` });
                return;
            }
        }

        const updatedFinancialRatioRecord = await (prisma as any).financialRatioRecord.update({
            where: { id: recordId },
            data: dataToUpdate
        });

        // Convert BigInt ID
        const serializedRecord = {
            ...updatedFinancialRatioRecord,
            id: updatedFinancialRatioRecord.id.toString(),
        };
        res.status(200).json(serializedRecord);
    } catch (error) {
        console.error('Error updating Financial Ratio record:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                res.status(409).json({ message: 'Financial Ratio record with this symbol and date already exists' });
                return;
            }
            if (error.code === 'P2025') {
                res.status(404).json({ message: 'Financial Ratio record not found' });
                return;
            }
        }
        res.status(500).json({ message: 'Server error updating Financial Ratio record' });
    }
};

// Delete a Financial Ratio record
export const deleteFinancialRatioRecord = async (req: Request, res: Response): Promise<void> => {
    const recordId = BigInt(req.params.id);

    try {
        await (prisma as any).financialRatioRecord.delete({
            where: { id: recordId }
        });
        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting Financial Ratio record:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'Financial Ratio record not found' });
            return;
        }
        res.status(500).json({ message: 'Server error deleting Financial Ratio record' });
    }
};

// Get all Financial Ratio records with pagination and filtering
export const getAllFinancialRatioRecords = async (req: Request, res: Response): Promise<void> => {
    const { 
        page = '1', 
        limit = '10', 
        sortBy = 'reportDate', 
        sortOrder = 'desc',
        symbol
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build the WHERE clause for filtering
    const where: any = {};
    if (symbol && typeof symbol === 'string' && symbol.trim() !== '') {
        where.symbol = {
            equals: symbol.trim().toUpperCase(),
        };
    }

    // Define allowed sort fields
    const allowedSortByFields = ['symbol', 'reportDate', 'debtEquity', 'assetsEquity', 'debtEquityPct'];
    const sortField = sortBy as string;
    const sortDir = sortOrder === 'desc' ? 'desc' : 'asc';
    let orderBy: any = { reportDate: 'desc' };
    if (allowedSortByFields.includes(sortField)) {
        orderBy = { [sortField]: sortDir };
    }

    try {
        const [records, totalRecords] = await prisma.$transaction([
            (prisma as any).financialRatioRecord.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
            }),
            (prisma as any).financialRatioRecord.count({ where })
        ]);

        // Convert BigInt IDs to strings
        const serializedRecords = records.map((record: any) => ({
            ...record,
            id: record.id.toString(),
        }));

        res.status(200).json({
            data: serializedRecords,
            pagination: {
                totalItems: totalRecords,
                itemCount: records.length,
                itemsPerPage: limitNum,
                totalPages: Math.ceil(totalRecords / limitNum),
                currentPage: pageNum,
            }
        });
    } catch (error) {
        console.error('Error fetching Financial Ratio records:', error);
        res.status(500).json({ message: 'Server error fetching Financial Ratio records' });
    }
};

// Get Financial Ratio records by stock symbol
export const getFinancialRatioRecordsBySymbol = async (req: Request, res: Response): Promise<void> => {
    const { symbol } = req.params;
    const { 
        page = '1', 
        limit = '10', 
        sortBy = 'reportDate', 
        sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Define allowed sort fields
    const allowedSortByFields = ['reportDate', 'debtEquity', 'assetsEquity', 'debtEquityPct'];
    const sortField = sortBy as string;
    const sortDir = sortOrder === 'desc' ? 'desc' : 'asc';
    let orderBy: any = { reportDate: 'desc' };
    if (allowedSortByFields.includes(sortField)) {
        orderBy = { [sortField]: sortDir };
    }

    try {
        // Check if stock exists
        const stock = await prisma.stock.findUnique({
            where: { symbol }
        });

        if (!stock) {
            res.status(404).json({ message: `Stock with symbol '${symbol}' not found` });
            return;
        }

        const [records, totalRecords] = await prisma.$transaction([
            (prisma as any).financialRatioRecord.findMany({
                where: { symbol },
                skip,
                take: limitNum,
                orderBy,
            }),
            (prisma as any).financialRatioRecord.count({ where: { symbol } })
        ]);

        // Convert BigInt IDs to strings
        const serializedRecords = records.map((record: any) => ({
            ...record,
            id: record.id.toString(),
        }));

        res.status(200).json({
            data: serializedRecords,
            pagination: {
                totalItems: totalRecords,
                itemCount: records.length,
                itemsPerPage: limitNum,
                totalPages: Math.ceil(totalRecords / limitNum),
                currentPage: pageNum,
            }
        });
    } catch (error) {
        console.error('Error fetching Financial Ratio records by symbol:', error);
        res.status(500).json({ message: 'Server error fetching Financial Ratio records' });
    }
};

// Get a single Financial Ratio record by ID
export const getFinancialRatioRecordById = async (req: Request, res: Response): Promise<void> => {
    const recordId = BigInt(req.params.id);

    try {
        const record = await (prisma as any).financialRatioRecord.findUnique({
            where: { id: recordId }
        });

        if (!record) {
            res.status(404).json({ message: 'Financial Ratio record not found' });
            return;
        }

        // Convert BigInt ID
        const serializedRecord = {
            ...record,
            id: record.id.toString(),
        };

        res.status(200).json(serializedRecord);
    } catch (error) {
        console.error('Error fetching Financial Ratio record:', error);
        res.status(500).json({ message: 'Server error fetching Financial Ratio record' });
    }
};

// Import Financial Ratio records from CSV or Excel
export const bulkImportFinancialRatioRecords = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const file = req.file;
        const records: any[] = [];
        const debugInfo: any = {
            fileType: '',
            headers: [],
            firstRow: null,
            processingDetails: []
        };

        // Check file type
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        debugInfo.fileType = fileExtension || file.mimetype;
        
        if (file.mimetype === 'text/csv' || fileExtension === 'csv') {
            // Parse CSV
            const csvData = file.buffer.toString('utf8');
            const stream = Readable.from(csvData);
            
            // Parse CSV data
            await new Promise<void>((resolve, reject) => {
                let isFirstRow = true;
                
                stream
                    .pipe(csvParser())
                    .on('data', (row: any) => {
                        // Record the headers from the first row
                        if (isFirstRow) {
                            debugInfo.headers = Object.keys(row);
                            debugInfo.firstRow = { ...row };
                            isFirstRow = false;
                        }
                        
                        // Make sure column names are case insensitive
                        const normalizedRow = Object.keys(row).reduce((acc: any, key) => {
                            // Use trimmed lowercase keys for better matching
                            acc[key.toLowerCase().trim()] = row[key];
                            return acc;
                        }, {});
                        
                        // Collect valid records
                        if (normalizedRow.symbol && normalizedRow.reportdate) {
                            records.push({
                                symbol: normalizedRow.symbol.toUpperCase(),
                                reportDate: parseDate(normalizedRow.reportdate),
                                debtEquity: parseFloat(normalizedRow.debtequity) || null,
                                assetsEquity: parseFloat(normalizedRow.assetsequity) || null,
                                debtEquityPct: parseFloat(normalizedRow.debtequitypct) || null
                            });
                            
                            // Record processing details for debugging
                            debugInfo.processingDetails.push({
                                type: 'processed_row',
                                original: { ...row },
                                normalized: { ...normalizedRow },
                                result: {
                                    symbol: normalizedRow.symbol.toUpperCase(),
                                    reportDate: parseDate(normalizedRow.reportdate).toISOString(),
                                    debtEquity: parseFloat(normalizedRow.debtequity) || null,
                                    assetsEquity: parseFloat(normalizedRow.assetsequity) || null,
                                    debtEquityPct: parseFloat(normalizedRow.debtequitypct) || null
                                }
                            });
                        } else {
                            debugInfo.processingDetails.push({
                                type: 'invalid_row',
                                reason: 'Missing symbol or reportDate',
                                row: { ...row },
                                normalized: { ...normalizedRow }
                            });
                        }
                    })
                    .on('end', () => resolve())
                    .on('error', (error: any) => {
                        debugInfo.processingDetails.push({
                            type: 'error',
                            message: error.message,
                            stack: error.stack
                        });
                        reject(error);
                    });
            });
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            // Parse Excel
            const workbook = XLSX.read(file.buffer);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            
            // Record headers
            if (jsonData.length > 0 && typeof jsonData[0] === 'object' && jsonData[0] !== null) {
                debugInfo.headers = Object.keys(jsonData[0] as object);
                debugInfo.firstRow = { ...(jsonData[0] as Record<string, any>) };
            }
            
            jsonData.forEach((row: any) => {
                // Normalize keys to lowercase for case-insensitive matching
                const normalizedRow = Object.keys(row).reduce((acc: any, key) => {
                    acc[key.toLowerCase().trim()] = row[key];
                    return acc;
                }, {});
                
                if (normalizedRow.symbol && (normalizedRow.reportdate || normalizedRow.reportDate)) {
                    const reportDateValue = normalizedRow.reportdate || normalizedRow.reportDate;
                    
                    records.push({
                        symbol: String(normalizedRow.symbol).toUpperCase(),
                        reportDate: parseDate(reportDateValue),
                        debtEquity: parseFloat(normalizedRow.debtequity || normalizedRow.debtEquity) || null,
                        assetsEquity: parseFloat(normalizedRow.assetsequity || normalizedRow.assetsEquity) || null,
                        debtEquityPct: parseFloat(normalizedRow.debtequitypct || normalizedRow.debtEquityPct) || null
                    });
                    
                    // Record processing details
                    debugInfo.processingDetails.push({
                        type: 'processed_excel_row',
                        original: { ...row },
                        normalized: { ...normalizedRow },
                        result: {
                            symbol: String(normalizedRow.symbol).toUpperCase(),
                            reportDate: parseDate(reportDateValue).toISOString(),
                            debtEquity: parseFloat(normalizedRow.debtequity || normalizedRow.debtEquity) || null,
                            assetsEquity: parseFloat(normalizedRow.assetsequity || normalizedRow.assetsEquity) || null,
                            debtEquityPct: parseFloat(normalizedRow.debtequitypct || normalizedRow.debtEquityPct) || null
                        }
                    });
                } else {
                    debugInfo.processingDetails.push({
                        type: 'invalid_excel_row',
                        reason: 'Missing symbol or reportDate',
                        row: { ...row },
                        normalized: { ...normalizedRow }
                    });
                }
            });
        } else {
            res.status(400).json({ message: 'Unsupported file format. Please upload CSV or Excel file.' });
            return;
        }

        // Validate required fields
        const invalidRecords = records.filter(r => !r.symbol || !r.reportDate || isNaN(r.reportDate.getTime()));
        if (invalidRecords.length > 0) {
            res.status(400).json({ 
                message: 'Some records are missing required fields (symbol, reportDate) or have invalid date format',
                invalidRecords,
                debugInfo
            });
            return;
        }

        // Process records
        const result = await prisma.$transaction(async (prisma) => {
            let createdCount = 0;
            let updatedCount = 0;
            const errors: any[] = [];
            const processedRecords: any[] = [];

            for (const record of records) {
                try {
                    // Check if stock exists
                    const stock = await prisma.stock.findUnique({
                        where: { symbol: record.symbol }
                    });

                    if (!stock) {
                        // Try to create the stock if it doesn't exist
                        try {
                            await prisma.stock.create({
                                data: {
                                    symbol: record.symbol,
                                    name: record.symbol, // Use symbol as name initially
                                }
                            });
                            console.log(`Created new stock: ${record.symbol}`);
                        } catch (stockError) {
                            errors.push({ 
                                record, 
                                error: `Stock with symbol '${record.symbol}' not found and could not be created: ${(stockError as Error).message}` 
                            });
                            continue;
                        }
                    }

                    // Check if record already exists
                    const existingRecord = await (prisma as any).financialRatioRecord.findFirst({
                        where: {
                            symbol: record.symbol,
                            reportDate: record.reportDate
                        }
                    });

                    if (existingRecord) {
                        // Update existing record
                        const updatedRecord = await (prisma as any).financialRatioRecord.update({
                            where: { id: existingRecord.id },
                            data: {
                                debtEquity: record.debtEquity,
                                assetsEquity: record.assetsEquity,
                                debtEquityPct: record.debtEquityPct
                            }
                        });
                        updatedCount++;
                        processedRecords.push({
                            action: 'updated',
                            id: updatedRecord.id.toString(),
                            symbol: record.symbol,
                            reportDate: record.reportDate.toISOString(),
                            debtEquity: record.debtEquity,
                            assetsEquity: record.assetsEquity,
                            debtEquityPct: record.debtEquityPct
                        });
                    } else {
                        // Create new record
                        const newRecord = await (prisma as any).financialRatioRecord.create({
                            data: record
                        });
                        createdCount++;
                        processedRecords.push({
                            action: 'created',
                            id: newRecord.id.toString(),
                            symbol: record.symbol,
                            reportDate: record.reportDate.toISOString(),
                            debtEquity: record.debtEquity,
                            assetsEquity: record.assetsEquity,
                            debtEquityPct: record.debtEquityPct
                        });
                    }
                } catch (error) {
                    console.error('Error processing record:', error);
                    errors.push({ 
                        record: {
                            symbol: record.symbol,
                            reportDate: record.reportDate.toISOString(),
                            debtEquity: record.debtEquity,
                            assetsEquity: record.assetsEquity,
                            debtEquityPct: record.debtEquityPct
                        }, 
                        error: (error as Error).message,
                        stack: (error as Error).stack
                    });
                }
            }

            return { 
                createdCount, 
                updatedCount, 
                errors,
                processedRecords,
                debugInfo
            };
        }, {
            timeout: 120000 // Increase timeout to 120 seconds
        });

        res.status(200).json({
            message: `Import completed with ${result.createdCount} created and ${result.updatedCount} updated`,
            created: result.createdCount,
            updated: result.updatedCount,
            total: result.createdCount + result.updatedCount,
            errors: result.errors.length > 0 ? result.errors : undefined,
            debug: process.env.NODE_ENV === 'development' ? result.debugInfo : undefined
        });
    } catch (error) {
        console.error('Error importing Financial Ratio records:', error);
        res.status(500).json({ message: 'Server error importing Financial Ratio records' });
    }
}; 