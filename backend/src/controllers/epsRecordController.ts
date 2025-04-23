import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '../lib/prisma';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';

// Define EpsRecord interface for type safety
interface EpsRecord {
    id: bigint;
    symbol: string;
    reportDate: Date;
    eps: number | null;
    epsNganh: number | null;
    epsRate: number | null;
    createdAt: Date;
    updatedAt: Date;
}

// Create a new EPS record
export const createEpsRecord = async (req: Request, res: Response): Promise<void> => {
    const { symbol, reportDate, eps, epsNganh, epsRate } = req.body;

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

        const newEpsRecord = await (prisma as any).epsRecord.create({
            data: {
                symbol,
                reportDate: new Date(reportDate),
                eps,
                epsNganh,
                epsRate
            }
        });

        // Convert BigInt ID
        const serializedRecord = {
            ...newEpsRecord,
            id: newEpsRecord.id.toString(),
        };
        res.status(201).json(serializedRecord);
    } catch (error) {
        console.error('Error creating EPS record:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ message: `EPS record for symbol '${symbol}' and date already exists` });
            return;
        }
        res.status(500).json({ message: 'Server error creating EPS record' });
    }
};

// Update an existing EPS record
export const updateEpsRecord = async (req: Request, res: Response): Promise<void> => {
    const recordId = BigInt(req.params.id);
    const { symbol, reportDate, eps, epsNganh, epsRate } = req.body;

    const dataToUpdate: any = {};
    if (symbol) dataToUpdate.symbol = symbol;
    if (reportDate) dataToUpdate.reportDate = new Date(reportDate);
    if (eps !== undefined) dataToUpdate.eps = eps;
    if (epsNganh !== undefined) dataToUpdate.epsNganh = epsNganh;
    if (epsRate !== undefined) dataToUpdate.epsRate = epsRate;

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

        const updatedEpsRecord = await (prisma as any).epsRecord.update({
            where: { id: recordId },
            data: dataToUpdate
        });

        // Convert BigInt ID
        const serializedRecord = {
            ...updatedEpsRecord,
            id: updatedEpsRecord.id.toString(),
        };
        res.status(200).json(serializedRecord);
    } catch (error) {
        console.error('Error updating EPS record:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                res.status(409).json({ message: 'EPS record with this symbol and date already exists' });
                return;
            }
            if (error.code === 'P2025') {
                res.status(404).json({ message: 'EPS record not found' });
                return;
            }
        }
        res.status(500).json({ message: 'Server error updating EPS record' });
    }
};

// Delete an EPS record
export const deleteEpsRecord = async (req: Request, res: Response): Promise<void> => {
    const recordId = BigInt(req.params.id);

    try {
        await (prisma as any).epsRecord.delete({
            where: { id: recordId }
        });
        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting EPS record:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'EPS record not found' });
            return;
        }
        res.status(500).json({ message: 'Server error deleting EPS record' });
    }
};

// Get all EPS records with pagination and filtering
export const getAllEpsRecords = async (req: Request, res: Response): Promise<void> => {
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
    const allowedSortByFields = ['symbol', 'reportDate', 'eps', 'epsNganh', 'epsRate'];
    const sortField = sortBy as string;
    const sortDir = sortOrder === 'desc' ? 'desc' : 'asc';
    let orderBy: any = { reportDate: 'desc' };
    if (allowedSortByFields.includes(sortField)) {
        orderBy = { [sortField]: sortDir };
    }

    try {
        const [records, totalRecords] = await prisma.$transaction([
            (prisma as any).epsRecord.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
            }),
            (prisma as any).epsRecord.count({ where })
        ]);

        // Convert BigInt IDs to strings
        const serializedRecords = records.map((record: EpsRecord) => ({
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
        console.error('Error fetching EPS records:', error);
        res.status(500).json({ message: 'Server error fetching EPS records' });
    }
};

// Get EPS records by stock symbol
export const getEpsRecordsBySymbol = async (req: Request, res: Response): Promise<void> => {
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
    const allowedSortByFields = ['reportDate', 'eps', 'epsNganh', 'epsRate'];
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
            (prisma as any).epsRecord.findMany({
                where: { symbol },
                skip,
                take: limitNum,
                orderBy,
            }),
            (prisma as any).epsRecord.count({ where: { symbol } })
        ]);

        // Convert BigInt IDs to strings
        const serializedRecords = records.map((record: EpsRecord) => ({
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
        console.error('Error fetching EPS records by symbol:', error);
        res.status(500).json({ message: 'Server error fetching EPS records' });
    }
};

// Get a single EPS record by ID
export const getEpsRecordById = async (req: Request, res: Response): Promise<void> => {
    const recordId = BigInt(req.params.id);

    try {
        const record = await (prisma as any).epsRecord.findUnique({
            where: { id: recordId }
        });

        if (!record) {
            res.status(404).json({ message: 'EPS record not found' });
            return;
        }

        // Convert BigInt ID
        const serializedRecord = {
            ...record,
            id: record.id.toString(),
        };

        res.status(200).json(serializedRecord);
    } catch (error) {
        console.error('Error fetching EPS record:', error);
        res.status(500).json({ message: 'Server error fetching EPS record' });
    }
};

// Import EPS records from CSV or Excel
export const bulkImportEpsRecords = async (req: Request, res: Response): Promise<void> => {
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
                        // Parse reportDate correctly based on DD/MM/YYYY format
                        let reportDate;
                        try {
                            // Check if date is in DD/MM/YYYY format
                            if (data.reportDate && /^\d{2}\/\d{2}\/\d{4}$/.test(data.reportDate)) {
                                const [day, month, year] = data.reportDate.split('/');
                                reportDate = new Date(Number(year), Number(month) - 1, Number(day));
                            } else {
                                reportDate = new Date(data.reportDate);
                            }
                        } catch (e) {
                            console.error(`Error parsing date ${data.reportDate}:`, e);
                            reportDate = new Date(data.reportDate);
                        }
                        
                        records.push({
                            symbol: data.symbol?.toUpperCase(),
                            reportDate: reportDate,
                            eps: parseFloat(data.eps) || null,
                            epsNganh: parseFloat(data.epsNganh) || null,
                            epsRate: parseFloat(data.epsRate) || null
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
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            
            jsonData.forEach((row: any) => {
                // Parse reportDate correctly based on DD/MM/YYYY format
                let reportDate;
                try {
                    // Check if Excel date is a string in DD/MM/YYYY format
                    if (typeof row.reportDate === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(row.reportDate)) {
                        const [day, month, year] = row.reportDate.split('/');
                        reportDate = new Date(Number(year), Number(month) - 1, Number(day));
                    } else {
                        reportDate = new Date(row.reportDate);
                    }
                } catch (e) {
                    console.error(`Error parsing date ${row.reportDate}:`, e);
                    reportDate = new Date(row.reportDate);
                }
                
                records.push({
                    symbol: row.symbol?.toUpperCase(),
                    reportDate: reportDate,
                    eps: parseFloat(row.eps) || null,
                    epsNganh: parseFloat(row.epsNganh) || null,
                    epsRate: parseFloat(row.epsRate) || null
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

        // Process records with increased transaction timeout
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
                    const existingRecord = await (prisma as any).epsRecord.findFirst({
                        where: {
                            symbol: record.symbol,
                            reportDate: record.reportDate
                        }
                    });

                    if (existingRecord) {
                        // Update existing record
                        await (prisma as any).epsRecord.update({
                            where: { id: existingRecord.id },
                            data: {
                                eps: record.eps,
                                epsNganh: record.epsNganh,
                                epsRate: record.epsRate
                            }
                        });
                        updatedCount++;
                    } else {
                        // Create new record
                        await (prisma as any).epsRecord.create({
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
        console.error('Error importing EPS records:', error);
        res.status(500).json({ message: 'Server error importing EPS records' });
    }
}; 