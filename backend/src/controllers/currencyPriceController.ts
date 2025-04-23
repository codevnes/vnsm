import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '../lib/prisma';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';

// Create a new currency price entry
export const createCurrencyPrice = async (req: Request, res: Response): Promise<void> => {
    const { symbol, date, open, high, low, close, trend_q, fq } = req.body;

    // Basic validation
    if (!symbol || !date) {
        res.status(400).json({ message: 'Symbol and date are required' });
        return;
    }

    try {
        const currencyPrice = await prisma.currencyPrice.create({
            data: {
                symbol,
                date: new Date(date),
                open: new Prisma.Decimal(open),
                high: new Prisma.Decimal(high),
                low: new Prisma.Decimal(low),
                close: new Prisma.Decimal(close),
                trend_q: new Prisma.Decimal(trend_q),
                fq: new Prisma.Decimal(fq),
            }
        });

        // Serialize BigInt to string for JSON
        const serializedCurrencyPrice = {
            ...currencyPrice,
            id: currencyPrice.id.toString()
        };

        res.status(201).json(serializedCurrencyPrice);
    } catch (error) {
        console.error('Error creating currency price:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                res.status(409).json({ message: 'A currency price for this symbol and date already exists' });
                return;
            }
        }
        res.status(500).json({ message: 'Server error creating currency price' });
    }
};

// Update a currency price entry
export const updateCurrencyPrice = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { symbol, date, open, high, low, close, trend_q, fq } = req.body;

    try {
        // Validate that ID exists
        const existingPrice = await prisma.currencyPrice.findUnique({
            where: { id: BigInt(id) }
        });

        if (!existingPrice) {
            res.status(404).json({ message: 'Currency price not found' });
            return;
        }

        // Build update data
        const updateData: any = {};
        
        if (symbol !== undefined) updateData.symbol = symbol;
        if (date !== undefined) updateData.date = new Date(date);
        if (open !== undefined) updateData.open = new Prisma.Decimal(open);
        if (high !== undefined) updateData.high = new Prisma.Decimal(high);
        if (low !== undefined) updateData.low = new Prisma.Decimal(low);
        if (close !== undefined) updateData.close = new Prisma.Decimal(close);
        if (trend_q !== undefined) updateData.trend_q = new Prisma.Decimal(trend_q);
        if (fq !== undefined) updateData.fq = new Prisma.Decimal(fq);

        const updatedPrice = await prisma.currencyPrice.update({
            where: { id: BigInt(id) },
            data: updateData
        });

        // Serialize BigInt for JSON response
        const serializedPrice = {
            ...updatedPrice,
            id: updatedPrice.id.toString()
        };

        res.status(200).json(serializedPrice);
    } catch (error) {
        console.error('Error updating currency price:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                res.status(409).json({ message: 'A currency price for this symbol and date already exists' });
                return;
            }
        }
        res.status(500).json({ message: 'Server error updating currency price' });
    }
};

// Delete a currency price entry
export const deleteCurrencyPrice = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;

    try {
        // Check if the currency price exists
        const price = await prisma.currencyPrice.findUnique({
            where: { id: BigInt(id) }
        });

        if (!price) {
            res.status(404).json({ message: 'Currency price not found' });
            return;
        }

        // Delete the currency price
        await prisma.currencyPrice.delete({
            where: { id: BigInt(id) }
        });

        res.status(200).json({ message: 'Currency price deleted successfully' });
    } catch (error) {
        console.error('Error deleting currency price:', error);
        res.status(500).json({ message: 'Server error deleting currency price' });
    }
};

// Get a currency price by ID
export const getCurrencyPriceById = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;

    try {
        const price = await prisma.currencyPrice.findUnique({
            where: { id: BigInt(id) }
        });

        if (!price) {
            res.status(404).json({ message: 'Currency price not found' });
            return;
        }

        // Serialize BigInt for JSON response
        const serializedPrice = {
            ...price,
            id: price.id.toString()
        };

        res.status(200).json(serializedPrice);
    } catch (error) {
        console.error('Error fetching currency price:', error);
        res.status(500).json({ message: 'Server error fetching currency price' });
    }
};

// Get all currency prices with pagination
export const getAllCurrencyPrices = async (req: Request, res: Response): Promise<void> => {
    // Query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const symbol = req.query.symbol as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    // Build where clause for filtering
    const where: any = {};
    if (symbol) where.symbol = symbol;
    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
    }

    try {
        // Get total count for pagination
        const totalCount = await prisma.currencyPrice.count({ where });
        
        // Get currency prices with pagination
        const currencyPrices = await prisma.currencyPrice.findMany({
            where,
            skip,
            take: limit,
            orderBy: { date: 'desc' }
        });

        // Serialize BigInt for JSON response
        const serializedPrices = currencyPrices.map(price => ({
            ...price,
            id: price.id.toString()
        }));

        res.status(200).json({
            data: serializedPrices,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching currency prices:', error);
        res.status(500).json({ message: 'Server error fetching currency prices' });
    }
};

// Get currency prices by symbol
export const getCurrencyPricesBySymbol = async (req: Request, res: Response): Promise<void> => {
    const symbol = req.params.symbol;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const where: any = { symbol };
    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
    }

    try {
        // Get total count
        const totalCount = await prisma.currencyPrice.count({ where });
        
        // Get currency prices for the symbol
        const currencyPrices = await prisma.currencyPrice.findMany({
            where,
            skip,
            take: limit,
            orderBy: { date: 'desc' }
        });

        // Serialize BigInt for JSON response
        const serializedPrices = currencyPrices.map(price => ({
            ...price,
            id: price.id.toString()
        }));

        res.status(200).json({
            data: serializedPrices,
            pagination: {
                total: totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching currency prices by symbol:', error);
        res.status(500).json({ message: 'Server error fetching currency prices' });
    }
};

// Import currency prices from CSV or Excel
export const bulkImportCurrencyPrices = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
        res.status(400).json({ message: 'File is required' });
        return;
    }

    const records: any[] = [];

    try {
        // Check file type
        const fileExt = req.file.originalname.split('.').pop()?.toLowerCase();
        const isExcel = fileExt === 'xlsx' || fileExt === 'xls' || 
                       req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                       req.file.mimetype === 'application/vnd.ms-excel';

        if (isExcel) {
            // Handle Excel file
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert Excel to JSON
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
                res.status(400).json({ message: 'Excel file should contain at least header row and one data row' });
                return;
            }
            
            // Extract headers (first row)
            const headers = jsonData[0].map((h: string) => String(h).toLowerCase());
            
            // Validate required headers
            if (!headers.includes('symbol') || !headers.includes('date')) {
                res.status(400).json({ message: 'Excel file should contain "symbol" and "date" columns' });
                return;
            }
            
            // Process data rows
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || row.length === 0) continue; // Skip empty rows
                
                try {
                    const rowData: any = {};
                    // Map columns to data
                    headers.forEach((header: string, index: number) => {
                        if (index < row.length) {
                            rowData[header] = row[index];
                        }
                    });
                    
                    // Process record same as CSV
                    if (!rowData.symbol || !rowData.date) {
                        console.warn('Missing required fields in Excel row:', row);
                        continue;
                    }
                    
                    // Handle date formats from Excel
                    let isoDate;
                    try {
                        let dateValue = rowData.date;
                        // Check if date is a number (Excel date)
                        if (typeof dateValue === 'number') {
                            // Convert Excel date to JS date
                            const jsDate = XLSX.SSF.parse_date_code(dateValue);
                            isoDate = `${jsDate.y}-${String(jsDate.m).padStart(2, '0')}-${String(jsDate.d).padStart(2, '0')}`;
                        } else if (typeof dateValue === 'string' && dateValue.includes('/')) {
                            // Handle DD/MM/YYYY format
                            const dateParts = dateValue.split('/');
                            if (dateParts.length !== 3) {
                                console.warn('Invalid date format:', dateValue);
                                continue;
                            }
                            isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                        } else {
                            // Try to parse as ISO date
                            const date = new Date(dateValue);
                            if (isNaN(date.getTime())) {
                                console.warn('Invalid date:', dateValue);
                                continue;
                            }
                            isoDate = date.toISOString().split('T')[0];
                        }
                    } catch (error) {
                        console.warn('Error parsing date from Excel:', rowData.date, error);
                        continue;
                    }
                    
                    // Clean numeric values
                    const cleanNumericValue = (value: any): string => {
                        if (value === null || value === undefined) return '0';
                        
                        // If already a number, convert to string
                        if (typeof value === 'number') return value.toString();
                        
                        // If string, clean it
                        if (typeof value === 'string') {
                            // Remove all dots (thousands separators)
                            let cleaned = value.replace(/\./g, '');
                            
                            // Replace comma with dot (if it exists as decimal separator)
                            cleaned = cleaned.replace(',', '.');
                            
                            // Make sure it's a valid number
                            return isNaN(Number(cleaned)) ? '0' : cleaned;
                        }
                        
                        return '0';
                    };
                    
                    // Process fields
                    const record = {
                        symbol: String(rowData.symbol),
                        date: new Date(isoDate),
                        open: new Prisma.Decimal(cleanNumericValue(rowData.open)),
                        high: new Prisma.Decimal(cleanNumericValue(rowData.high)),
                        low: new Prisma.Decimal(cleanNumericValue(rowData.low)),
                        close: new Prisma.Decimal(cleanNumericValue(rowData.close)),
                        trend_q: new Prisma.Decimal(cleanNumericValue(rowData.trend_q)),
                        fq: new Prisma.Decimal(cleanNumericValue(rowData.fq))
                    };
                    
                    records.push(record);
                } catch (error) {
                    console.warn('Error processing Excel row:', row, error);
                    continue;
                }
            }
        } else {
            // Handle CSV file (existing logic)
            const csvData = req.file.buffer.toString('utf8');
            
            // Parse CSV data
            const parser = parse(csvData, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });

            const readable = Readable.from([csvData]);
            readable.pipe(parser);

            for await (const record of parser) {
                try {
                    // Normalize record keys for case-insensitive matching
                    const normalizedRecord: any = {};
                    Object.keys(record).forEach(key => {
                        normalizedRecord[key.toLowerCase()] = record[key];
                    });
                    
                    // Check if required fields exist using lowercase keys
                    if (!normalizedRecord.symbol || !normalizedRecord.date) {
                        console.warn('Missing required fields:', record);
                        continue;
                    }
                    
                    // Convert date format from DD/MM/YYYY to YYYY-MM-DD
                    let isoDate;
                    try {
                        const dateParts = normalizedRecord.date.split('/');
                        if (dateParts.length !== 3) {
                            console.warn('Invalid date format:', normalizedRecord.date);
                            continue;
                        }
                        isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                    } catch (error) {
                        console.warn('Error parsing date:', normalizedRecord.date, error);
                        continue;
                    }
                    
                    // Clean numeric values - replace any commas with dots, and ensure only one decimal point
                    const cleanNumericValue = (value: string): string => {
                        if (!value) return '0';
                        
                        // Remove all dots (thousands separators) first
                        let cleaned = value.replace(/\./g, '');
                        
                        // Replace comma with dot (if it exists as decimal separator)
                        cleaned = cleaned.replace(',', '.');
                        
                        // Make sure it's a valid number
                        return isNaN(Number(cleaned)) ? '0' : cleaned;
                    };
                    
                    // Process each numeric field
                    const open = cleanNumericValue(normalizedRecord.open);
                    const high = cleanNumericValue(normalizedRecord.high);
                    const low = cleanNumericValue(normalizedRecord.low);
                    const close = cleanNumericValue(normalizedRecord.close);
                    const trend_q = cleanNumericValue(normalizedRecord.trend_q);
                    const fq = cleanNumericValue(normalizedRecord.fq);
                    
                    records.push({
                        symbol: normalizedRecord.symbol,
                        date: new Date(isoDate),
                        open: new Prisma.Decimal(open),
                        high: new Prisma.Decimal(high),
                        low: new Prisma.Decimal(low),
                        close: new Prisma.Decimal(close),
                        trend_q: new Prisma.Decimal(trend_q),
                        fq: new Prisma.Decimal(fq)
                    });
                } catch (error) {
                    console.warn('Error processing record:', record, error);
                    continue;
                }
            }
        }

        if (records.length === 0) {
            res.status(400).json({ message: 'No valid records found in file' });
            return;
        }

        // Process records in batches for performance (same as before)
        const batchSize = 100;
        const results = [];
        const errors: Array<{ record: any; error: string }> = [];
        
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            
            // Process batch using createMany (creates records that don't exist)
            try {
                const result = await prisma.$transaction(async (prisma) => {
                    const createdRecords = [];
                    
                    for (const record of batch) {
                        try {
                            const existingRecord = await prisma.currencyPrice.findFirst({
                                where: {
                                    symbol: record.symbol,
                                    date: record.date
                                }
                            });
                            
                            if (!existingRecord) {
                                const created = await prisma.currencyPrice.create({
                                    data: record
                                });
                                createdRecords.push(created);
                            }
                        } catch (error) {
                            console.error('Error processing record:', record, error);
                            errors.push({ record, error: error instanceof Error ? error.message : String(error) });
                        }
                    }
                    
                    return createdRecords;
                });
                
                results.push(...result);
            } catch (batchError) {
                console.error('Error processing batch:', batchError);
                // Continue with next batch rather than failing entire import
            }
        }

        res.status(201).json({
            message: `Successfully imported ${results.length} currency price records`,
            imported: results.length,
            total: records.length,
            failed: records.length - results.length,
            errors: errors.length > 0 ? errors.slice(0, 10) : [] // Limit error list for large imports
        });
    } catch (error) {
        console.error('Error importing currency prices:', error);
        res.status(500).json({ 
            message: 'Server error importing currency prices',
            error: error instanceof Error ? error.message : String(error)
        });
    }
}; 