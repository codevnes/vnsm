import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '../lib/prisma';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';

// Define PeRecord interface for type safety
interface PeRecord {
    id: bigint;
    symbol: string;
    reportDate: Date;
    pe: number | null;
    peNganh: number | null;
    peRate: number | null;
    createdAt: Date;
    updatedAt: Date;
}

// Create a new PE record
export const createPeRecord = async (req: Request, res: Response): Promise<void> => {
    const { symbol, reportDate, pe, peNganh, peRate } = req.body;

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

        const newPeRecord = await (prisma as any).peRecord.create({
            data: {
                symbol,
                reportDate: new Date(reportDate),
                pe,
                peNganh,
                peRate
            }
        });

        // Convert BigInt ID
        const serializedRecord = {
            ...newPeRecord,
            id: newPeRecord.id.toString(),
        };
        res.status(201).json(serializedRecord);
    } catch (error) {
        console.error('Error creating PE record:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ message: `PE record for symbol '${symbol}' and date already exists` });
            return;
        }
        res.status(500).json({ message: 'Server error creating PE record' });
    }
};

// Update an existing PE record
export const updatePeRecord = async (req: Request, res: Response): Promise<void> => {
    const recordId = BigInt(req.params.id);
    const { symbol, reportDate, pe, peNganh, peRate } = req.body;

    const dataToUpdate: any = {};
    if (symbol) dataToUpdate.symbol = symbol;
    if (reportDate) dataToUpdate.reportDate = new Date(reportDate);
    if (pe !== undefined) dataToUpdate.pe = pe;
    if (peNganh !== undefined) dataToUpdate.peNganh = peNganh;
    if (peRate !== undefined) dataToUpdate.peRate = peRate;

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

        const updatedPeRecord = await (prisma as any).peRecord.update({
            where: { id: recordId },
            data: dataToUpdate
        });

        // Convert BigInt ID
        const serializedRecord = {
            ...updatedPeRecord,
            id: updatedPeRecord.id.toString(),
        };
        res.status(200).json(serializedRecord);
    } catch (error) {
        console.error('Error updating PE record:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                res.status(409).json({ message: 'PE record with this symbol and date already exists' });
                return;
            }
            if (error.code === 'P2025') {
                res.status(404).json({ message: 'PE record not found' });
                return;
            }
        }
        res.status(500).json({ message: 'Server error updating PE record' });
    }
};

// Delete a PE record
export const deletePeRecord = async (req: Request, res: Response): Promise<void> => {
    const recordId = BigInt(req.params.id);

    try {
        await (prisma as any).peRecord.delete({
            where: { id: recordId }
        });
        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting PE record:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'PE record not found' });
            return;
        }
        res.status(500).json({ message: 'Server error deleting PE record' });
    }
};

// Get all PE records with pagination and filtering
export const getAllPeRecords = async (req: Request, res: Response): Promise<void> => {
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
    const allowedSortByFields = ['symbol', 'reportDate', 'pe', 'peNganh', 'peRate'];
    const sortField = sortBy as string;
    const sortDir = sortOrder === 'desc' ? 'desc' : 'asc';
    let orderBy: any = { reportDate: 'desc' };
    if (allowedSortByFields.includes(sortField)) {
        orderBy = { [sortField]: sortDir };
    }

    try {
        const [records, totalRecords] = await prisma.$transaction([
            (prisma as any).peRecord.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
            }),
            (prisma as any).peRecord.count({ where })
        ]);

        // Convert BigInt IDs to strings
        const serializedRecords = records.map((record: PeRecord) => ({
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
        console.error('Error fetching PE records:', error);
        res.status(500).json({ message: 'Server error fetching PE records' });
    }
};

// Get PE records by stock symbol
export const getPeRecordsBySymbol = async (req: Request, res: Response): Promise<void> => {
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
    const allowedSortByFields = ['reportDate', 'pe', 'peNganh', 'peRate'];
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
            (prisma as any).peRecord.findMany({
                where: { symbol },
                skip,
                take: limitNum,
                orderBy,
            }),
            (prisma as any).peRecord.count({ where: { symbol } })
        ]);

        // Convert BigInt IDs to strings
        const serializedRecords = records.map((record: PeRecord) => ({
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
        console.error('Error fetching PE records by symbol:', error);
        res.status(500).json({ message: 'Server error fetching PE records' });
    }
};

// Get a single PE record by ID
export const getPeRecordById = async (req: Request, res: Response): Promise<void> => {
    const recordId = BigInt(req.params.id);

    try {
        const record = await (prisma as any).peRecord.findUnique({
            where: { id: recordId }
        });

        if (!record) {
            res.status(404).json({ message: 'PE record not found' });
            return;
        }

        // Convert BigInt ID
        const serializedRecord = {
            ...record,
            id: record.id.toString(),
        };

        res.status(200).json(serializedRecord);
    } catch (error) {
        console.error('Error fetching PE record:', error);
        res.status(500).json({ message: 'Server error fetching PE record' });
    }
};

// Import PE records from CSV or Excel
export const bulkImportPeRecords = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const fileBuffer = req.file.buffer;
        const records: any[] = [];

        // Check file type
        const fileName = req.file.originalname.toLowerCase();
        
        if (fileName.endsWith('.csv')) {
            // Parse CSV
            await new Promise<void>((resolve, reject) => {
                const stream = Readable.from(fileBuffer);
                stream
                    .pipe(csvParser())
                    .on('data', (data) => {
                        records.push({
                            symbol: data.symbol?.toUpperCase(),
                            reportDate: parseDate(data.reportDate),
                            pe: parseNumber(data.pe),
                            peNganh: parseNumber(data.peNganh),
                            peRate: parseNumber(data.peRate)
                        });
                    })
                    .on('end', () => resolve())
                    .on('error', (error) => reject(error));
            });
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            // Parse Excel
            const workbook = XLSX.read(fileBuffer);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: null });
            
            jsonData.forEach((row: any) => {
                records.push({
                    symbol: row.Symbol?.toUpperCase(),
                    reportDate: parseDate(row.ReportDate),
                    pe: parseNumber(row.PE),
                    peNganh: parseNumber(row.PENganh),
                    peRate: parseNumber(row.PERate)
                });
            });
        } else {
            res.status(400).json({ message: 'Unsupported file format. Please upload CSV or Excel file.' });
            return;
        }

        // Validate required fields
        const invalidRecords = records.filter(r => !r.symbol || !r.reportDate);
        if (invalidRecords.length > 0) {
            res.status(400).json({ 
                message: 'Some records are missing required fields (symbol, reportDate)',
                invalidRecords
            });
            return;
        }

        // Process records
        const result = await prisma.$transaction(async (prisma) => {
            let createdCount = 0;
            let updatedCount = 0;
            const errors: any[] = [];

            for (const record of records) {
                try {
                    // Check if stock exists
                    const stock = await prisma.stock.findUnique({
                        where: { symbol: record.symbol }
                    });

                    if (!stock) {
                        errors.push({ record, error: `Stock with symbol '${record.symbol}' not found` });
                        continue;
                    }

                    // Check if record already exists
                    const existingRecord = await (prisma as any).peRecord.findFirst({
                        where: {
                            symbol: record.symbol,
                            reportDate: record.reportDate
                        }
                    });

                    if (existingRecord) {
                        // Update existing record
                        await (prisma as any).peRecord.update({
                            where: { id: existingRecord.id },
                            data: {
                                pe: record.pe,
                                peNganh: record.peNganh,
                                peRate: record.peRate
                            }
                        });
                        updatedCount++;
                    } else {
                        // Create new record
                        await (prisma as any).peRecord.create({
                            data: record
                        });
                        createdCount++;
                    }
                } catch (error) {
                    errors.push({ record, error: (error as Error).message });
                }
            }

            return { createdCount, updatedCount, errors };
        }, {
            timeout: 60000 // Increase timeout to 60 seconds
        });

        res.status(200).json({
            message: `Import completed with ${result.createdCount} created and ${result.updatedCount} updated`,
            errors: result.errors
        });
    } catch (error) {
        console.error('Error importing PE records:', error);
        res.status(500).json({ message: 'Server error importing PE records' });
    }
};

// Helper function to parse date in DD/MM/YYYY format
function parseDate(dateStr: string | null): Date | null {
    if (!dateStr) return null;
    
    // Try to parse in DD/MM/YYYY format
    const parts = dateStr.trim().split(/[\/\-\.]/);
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
        const year = parseInt(parts[2], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            return new Date(year, month, day);
        }
    }
    
    // Fallback to standard date parsing
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

// Helper function to parse numbers with comma as decimal separator
function parseNumber(numStr: string | null): number | null {
    if (numStr === null || numStr === undefined || numStr.trim() === '') return null;
    
    // Replace comma with dot for decimal separator and remove any additional commas
    const cleanNum = numStr.toString().replace(/\./g, '').replace(/,/g, '.');
    const parsedNum = parseFloat(cleanNum);
    
    return isNaN(parsedNum) ? null : parsedNum;
} 