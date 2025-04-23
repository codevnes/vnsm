import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Prisma } from '../lib/prisma';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';

// Define RoaRoeRecord interface for type safety
interface RoaRoeRecord {
    id: bigint;
    symbol: string;
    reportDate: Date;
    roa: number | null;
    roe: number | null;
    roeNganh: number | null;
    roaNganh: number | null;
    createdAt: Date;
    updatedAt: Date;
}

// Helper function to parse dates from various formats
const parseDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    
    // If it's already a Date object
    if (dateValue instanceof Date) return dateValue;
    
    const dateStr = String(dateValue);
    
    // Log để debug
    console.log(`Parsing date: ${dateStr}`);
    
    // Try to parse as ISO format first
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
        console.log(`Parsed as ISO: ${isoDate.toISOString()}`);
        return isoDate;
    }
    
    // Try DD/MM/YYYY format (ưu tiên định dạng này vì dữ liệu mẫu dùng định dạng này)
    const parts = dateStr.split(/[/\-\.]/);
    if (parts.length === 3) {
        // Assume DD/MM/YYYY
        if (parts[0].length <= 2 && parts[1].length <= 2) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JS
            const year = parseInt(parts[2], 10);
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                console.log(`Parsed as DD/MM/YYYY: ${date.toISOString()}`);
                return date;
            }
        }
        
        // Try MM/DD/YYYY
        const month = parseInt(parts[0], 10) - 1;
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
            console.log(`Parsed as MM/DD/YYYY: ${date.toISOString()}`);
            return date;
        }
    }
    
    // Default to current date if parsing fails
    console.warn(`Could not parse date: ${dateStr}, using current date`);
    return new Date();
};

// Create a new ROA/ROE record
export const createRoaRoeRecord = async (req: Request, res: Response): Promise<void> => {
    const { symbol, reportDate, roa, roe, roeNganh, roaNganh } = req.body;

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

        const newRoaRoeRecord = await (prisma as any).roaRoeRecord.create({
            data: {
                symbol,
                reportDate: new Date(reportDate),
                roa,
                roe,
                roeNganh,
                roaNganh
            }
        });

        // Convert BigInt ID
        const serializedRecord = {
            ...newRoaRoeRecord,
            id: newRoaRoeRecord.id.toString(),
        };
        res.status(201).json(serializedRecord);
    } catch (error) {
        console.error('Error creating ROA/ROE record:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ message: `ROA/ROE record for symbol '${symbol}' and date already exists` });
            return;
        }
        res.status(500).json({ message: 'Server error creating ROA/ROE record' });
    }
};

// Update an existing ROA/ROE record
export const updateRoaRoeRecord = async (req: Request, res: Response): Promise<void> => {
    const recordId = BigInt(req.params.id);
    const { symbol, reportDate, roa, roe, roeNganh, roaNganh } = req.body;

    const dataToUpdate: any = {};
    if (symbol) dataToUpdate.symbol = symbol;
    if (reportDate) dataToUpdate.reportDate = new Date(reportDate);
    if (roa !== undefined) dataToUpdate.roa = roa;
    if (roe !== undefined) dataToUpdate.roe = roe;
    if (roeNganh !== undefined) dataToUpdate.roeNganh = roeNganh;
    if (roaNganh !== undefined) dataToUpdate.roaNganh = roaNganh;

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

        const updatedRoaRoeRecord = await (prisma as any).roaRoeRecord.update({
            where: { id: recordId },
            data: dataToUpdate
        });

        // Convert BigInt ID
        const serializedRecord = {
            ...updatedRoaRoeRecord,
            id: updatedRoaRoeRecord.id.toString(),
        };
        res.status(200).json(serializedRecord);
    } catch (error) {
        console.error('Error updating ROA/ROE record:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                res.status(409).json({ message: 'ROA/ROE record with this symbol and date already exists' });
                return;
            }
            if (error.code === 'P2025') {
                res.status(404).json({ message: 'ROA/ROE record not found' });
                return;
            }
        }
        res.status(500).json({ message: 'Server error updating ROA/ROE record' });
    }
};

// Delete a ROA/ROE record
export const deleteRoaRoeRecord = async (req: Request, res: Response): Promise<void> => {
    const recordId = BigInt(req.params.id);

    try {
        await (prisma as any).roaRoeRecord.delete({
            where: { id: recordId }
        });
        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting ROA/ROE record:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ message: 'ROA/ROE record not found' });
            return;
        }
        res.status(500).json({ message: 'Server error deleting ROA/ROE record' });
    }
};

// Get all ROA/ROE records with pagination and filtering
export const getAllRoaRoeRecords = async (req: Request, res: Response): Promise<void> => {
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
    const allowedSortByFields = ['symbol', 'reportDate', 'roa', 'roe', 'roeNganh', 'roeNganhRate'];
    const sortField = sortBy as string;
    const sortDir = sortOrder === 'desc' ? 'desc' : 'asc';
    let orderBy: any = { reportDate: 'desc' };
    if (allowedSortByFields.includes(sortField)) {
        orderBy = { [sortField]: sortDir };
    }

    try {
        const [records, totalRecords] = await prisma.$transaction([
            (prisma as any).roaRoeRecord.findMany({
                where,
                skip,
                take: limitNum,
                orderBy,
            }),
            (prisma as any).roaRoeRecord.count({ where })
        ]);

        // Convert BigInt IDs to strings
        const serializedRecords = records.map((record: RoaRoeRecord) => ({
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
        console.error('Error fetching ROA/ROE records:', error);
        res.status(500).json({ message: 'Server error fetching ROA/ROE records' });
    }
};

// Get ROA/ROE records by stock symbol
export const getRoaRoeRecordsBySymbol = async (req: Request, res: Response): Promise<void> => {
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
    const allowedSortByFields = ['reportDate', 'roa', 'roe', 'roeNganh', 'roeNganhRate'];
    const sortField = sortBy as string;
    const sortDir = sortOrder === 'desc' ? 'desc' : 'asc';
    let orderBy: any = { reportDate: 'desc' };
    if (allowedSortByFields.includes(sortField)) {
        orderBy = { [sortField]: sortDir };
    }

    try {
        console.log(`Checking if stock exists: ${symbol}`);
        // Check if stock exists
        const stock = await prisma.stock.findUnique({
            where: { symbol }
        });

        console.log(`Stock lookup result:`, stock);

        if (!stock) {
            console.log(`Stock not found: ${symbol}`);
            // Thay vì trả về lỗi, tạo stock mới nếu chưa tồn tại
            try {
                console.log(`Creating new stock: ${symbol}`);
                await prisma.stock.create({
                    data: {
                        symbol,
                        name: symbol // Tạm thời dùng symbol làm name
                        // Không thêm trường description vì nó không tồn tại trong model Stock
                    }
                });
                console.log(`Created new stock: ${symbol}`);
            } catch (createError) {
                console.error(`Error creating stock:`, createError);
                res.status(500).json({ 
                    message: `Failed to create stock with symbol '${symbol}'`,
                    error: (createError as Error).message
                });
                return;
            }
        }

        const [records, totalRecords] = await prisma.$transaction([
            (prisma as any).roaRoeRecord.findMany({
                where: { symbol },
                skip,
                take: limitNum,
                orderBy,
            }),
            (prisma as any).roaRoeRecord.count({ where: { symbol } })
        ]);

        // Convert BigInt IDs to strings
        const serializedRecords = records.map((record: RoaRoeRecord) => ({
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
        console.error('Error fetching ROA/ROE records by symbol:', error);
        res.status(500).json({ message: 'Server error fetching ROA/ROE records' });
    }
};

// Get a single ROA/ROE record by ID
export const getRoaRoeRecordById = async (req: Request, res: Response): Promise<void> => {
    const recordId = BigInt(req.params.id);

    try {
        const record = await (prisma as any).roaRoeRecord.findUnique({
            where: { id: recordId }
        });

        if (!record) {
            res.status(404).json({ message: 'ROA/ROE record not found' });
            return;
        }

        // Convert BigInt ID
        const serializedRecord = {
            ...record,
            id: record.id.toString(),
        };

        res.status(200).json(serializedRecord);
    } catch (error) {
        console.error('Error fetching ROA/ROE record:', error);
        res.status(500).json({ message: 'Server error fetching ROA/ROE record' });
    }
};

// Import ROA/ROE records from CSV or Excel
export const bulkImportRoaRoeRecords = async (req: Request, res: Response): Promise<void> => {
    console.log('Starting bulk import of ROA/ROE records');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer ? `Buffer of ${req.file.buffer.length} bytes` : 'No buffer'
    } : 'No file');
    
    if (!req.file) {
        console.error('No file uploaded');
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
    
    console.log(`Processing file: ${file.originalname}, type: ${file.mimetype}, size: ${file.size} bytes`);
    
    try {
        // Determine file type from MIME type or file extension
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        debugInfo.fileType = fileExtension || file.mimetype;
        
        // Handle CSV file
        if (file.mimetype === 'text/csv' || fileExtension === 'csv') {
            console.log('Processing CSV file');
            const csvData = file.buffer.toString('utf8');
            console.log('CSV data (first 200 chars):', csvData.substring(0, 200));
            const stream = Readable.from(csvData);
            
            // Parse CSV data
            await new Promise<void>((resolve, reject) => {
                console.log('Starting CSV parsing');
                let isFirstRow = true;
                
                stream
                    .pipe(csvParser())
                    .on('data', (row: any) => {
                        console.log('CSV row:', row);
                        
                        // Record the headers from the first row
                        if (isFirstRow) {
                            console.log('First row headers:', Object.keys(row));
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
                        
                        // Lưu lại các key gốc để debug
                        debugInfo.processingDetails.push({
                            type: 'csv_row_keys',
                            original_keys: Object.keys(row),
                            normalized_keys: Object.keys(normalizedRow)
                        });
                        
                        // Check for ROENganh and ROANganh columns
                        let roeNganh = null;
                        let roaNganh = null;
                        
                        // Normalize comparison for all headers, accounting for variations
                        // Hỗ trợ nhiều định dạng khác nhau của tên cột, bao gồm cả viết hoa
                        const hasRoeNganh = Object.keys(normalizedRow).some(
                            key => key.trim() === 'roenganh' || 
                                  key.trim() === 'roenganha' || 
                                  key.trim() === 'roenganh' ||
                                  key.trim() === 'roe nganh' ||
                                  key.trim() === 'roe_nganh'
                        );
                        
                        const hasRoaNganh = Object.keys(normalizedRow).some(
                            key => key.trim() === 'roanganh' || 
                                  key.trim() === 'roa nganh' ||
                                  key.trim() === 'roa_nganh'
                        );
                        
                        // Kiểm tra các key có thể viết hoa như ROENganh, ROANganh
                        if (!hasRoeNganh && Object.keys(row).some(key => 
                            key.toUpperCase().includes('ROENGANH') || 
                            key.toUpperCase() === 'ROENGANH' || 
                            key.toUpperCase() === 'ROE NGANH' ||
                            key.toUpperCase() === 'ROE_NGANH'
                        )) {
                            const roeNganhKey = Object.keys(row).find(key => 
                                key.toUpperCase().includes('ROENGANH') || 
                                key.toUpperCase() === 'ROENGANH' || 
                                key.toUpperCase() === 'ROE NGANH' ||
                                key.toUpperCase() === 'ROE_NGANH'
                            );
                            roeNganh = roeNganhKey ? parseFloat(row[roeNganhKey]) || null : null;
                            
                            debugInfo.processingDetails.push({
                                type: 'field_detection',
                                message: `Detected ROENganh column with key: ${roeNganhKey}`,
                                value: roeNganh
                            });
                        } else if (hasRoeNganh) {
                            // Find the matching key since we know it exists
                            const roeNganhKey = Object.keys(normalizedRow).find(
                                key => key.trim() === 'roenganh' || 
                                      key.trim() === 'roenganha' || 
                                      key.trim() === 'roe nganh' ||
                                      key.trim() === 'roe_nganh'
                            );
                            roeNganh = roeNganhKey ? parseFloat(normalizedRow[roeNganhKey]) || null : null;
                        }
                        
                        if (!hasRoaNganh && Object.keys(row).some(key => 
                            key.toUpperCase().includes('ROANGANH') || 
                            key.toUpperCase() === 'ROANGANH' || 
                            key.toUpperCase() === 'ROA NGANH' ||
                            key.toUpperCase() === 'ROA_NGANH'
                        )) {
                            const roaNganhKey = Object.keys(row).find(key => 
                                key.toUpperCase().includes('ROANGANH') || 
                                key.toUpperCase() === 'ROANGANH' || 
                                key.toUpperCase() === 'ROA NGANH' ||
                                key.toUpperCase() === 'ROA_NGANH'
                            );
                            roaNganh = roaNganhKey ? parseFloat(row[roaNganhKey]) || null : null;
                            
                            debugInfo.processingDetails.push({
                                type: 'field_detection',
                                message: `Detected ROANganh column with key: ${roaNganhKey}`,
                                value: roaNganh
                            });
                        } else if (hasRoaNganh) {
                            const roaNganhKey = Object.keys(normalizedRow).find(
                                key => key.trim() === 'roanganh' || 
                                      key.trim() === 'roa nganh' ||
                                      key.trim() === 'roa_nganh'
                            );
                            roaNganh = roaNganhKey ? parseFloat(normalizedRow[roaNganhKey]) || null : null;
                        }
                        
                        // Backward compatibility: check for roeNganhRate and use it as roaNganh if roaNganh is not present
                        if (roaNganh === null) {
                            const hasRoeNganhRate = Object.keys(normalizedRow).some(
                                key => key.trim() === 'roenganhrate'
                            );
                            
                            if (hasRoeNganhRate) {
                                const roeNganhRateKey = Object.keys(normalizedRow).find(
                                    key => key.trim() === 'roenganhrate'
                                );
                                roaNganh = roeNganhRateKey ? parseFloat(normalizedRow[roeNganhRateKey]) || null : null;
                                
                                // Record this conversion for debugging
                                debugInfo.processingDetails.push({
                                    type: 'field_conversion',
                                    message: 'Converted roeNganhRate to roaNganh for backward compatibility',
                                    value: roaNganh
                                });
                            }
                        }
                        
                        // Tìm Symbol và ReportDate từ các cột có thể viết hoa
                        let symbol = null;
                        let reportDate = null;
                        
                        // Kiểm tra Symbol trong normalizedRow
                        if (normalizedRow.symbol) {
                            symbol = normalizedRow.symbol.toUpperCase();
                        } else {
                            // Tìm trong các key gốc
                            const symbolKey = Object.keys(row).find(key => 
                                key.toUpperCase() === 'SYMBOL'
                            );
                            if (symbolKey) {
                                symbol = String(row[symbolKey]).toUpperCase();
                                debugInfo.processingDetails.push({
                                    type: 'field_detection',
                                    message: `Detected Symbol column with key: ${symbolKey}`,
                                    value: symbol
                                });
                            }
                        }
                        
                        // Kiểm tra ReportDate trong normalizedRow
                        if (normalizedRow.reportdate) {
                            reportDate = parseDate(normalizedRow.reportdate);
                        } else {
                            // Tìm trong các key gốc
                            const reportDateKey = Object.keys(row).find(key => 
                                key.toUpperCase() === 'REPORTDATE' || 
                                key.toUpperCase() === 'REPORT DATE' || 
                                key.toUpperCase() === 'REPORT_DATE'
                            );
                            if (reportDateKey) {
                                reportDate = parseDate(row[reportDateKey]);
                                debugInfo.processingDetails.push({
                                    type: 'field_detection',
                                    message: `Detected ReportDate column with key: ${reportDateKey}`,
                                    value: reportDate
                                });
                            }
                        }
                        
                        // Collect valid records
                        if (symbol && reportDate) {
                            // Tìm ROA và ROE từ các cột có thể viết hoa
                            let roa = null;
                            let roe = null;
                            
                            // Kiểm tra ROA trong normalizedRow
                            if (normalizedRow.roa !== undefined) {
                                roa = parseFloat(normalizedRow.roa) || null;
                            } else {
                                // Tìm trong các key gốc
                                const roaKey = Object.keys(row).find(key => 
                                    key.toUpperCase() === 'ROA'
                                );
                                if (roaKey) {
                                    roa = parseFloat(row[roaKey]) || null;
                                }
                            }
                            
                            // Kiểm tra ROE trong normalizedRow
                            if (normalizedRow.roe !== undefined) {
                                roe = parseFloat(normalizedRow.roe) || null;
                            } else {
                                // Tìm trong các key gốc
                                const roeKey = Object.keys(row).find(key => 
                                    key.toUpperCase() === 'ROE'
                                );
                                if (roeKey) {
                                    roe = parseFloat(row[roeKey]) || null;
                                }
                            }
                            
                            records.push({
                                symbol,
                                reportDate,
                                roa,
                                roe,
                                roeNganh,
                                roaNganh
                            });
                        }
                    })
                    .on('end', () => {
                        resolve();
                    })
                    .on('error', (error: any) => {
                        reject(error);
                    });
            });

            // Check for duplicate ROENganh columns
            const headers = debugInfo.headers || [];
            const normalizedHeaders = headers.map((h: string) => h.toLowerCase().trim());
            
            // Find all occurrences of "roenganh" in the headers
            const roeNganhIndices = normalizedHeaders
                .map((header: string, index: number) => header === 'roenganh' ? index : -1)
                .filter((index: number) => index !== -1);
            
            if (roeNganhIndices.length > 1) {
                // We have duplicate ROENganh columns
                // The first one will be treated as ROENganh, the second as ROENganhRate
                debugInfo.processingDetails.push(
                    `Detected duplicate ROENganh columns at positions ${roeNganhIndices.join(', ')}. ` +
                    `Using column at position ${roeNganhIndices[0]} for ROENganh and ` +
                    `column at position ${roeNganhIndices[1]} for ROENganhRate.`
                );
            }
            
            // Add debug information
            debugInfo.processingDetails.push(`CSV headers: ${headers.join(', ')}`);
            debugInfo.processingDetails.push(`Normalized headers: ${normalizedHeaders.join(', ')}`);
        } 
        // Handle Excel file
        else if (
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.mimetype === 'application/vnd.ms-excel' ||
            fileExtension === 'xlsx' || 
            fileExtension === 'xls'
        ) {
            console.log('Processing Excel file');
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            console.log('Excel workbook sheets:', workbook.SheetNames);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            
            // Convert Excel to JSON
            console.log('Converting Excel to JSON');
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
            console.log('Excel data rows:', data.length);
            
            if (data.length > 0) {
                // Get header row
                const headers = (data[0] as any[]).map(h => 
                    h ? String(h).toLowerCase().replace(/\s+/g, '') : ''
                );
                
                // Save headers for debugging
                debugInfo.headers = data.length > 0 ? 
                    (data[0] as any[]).map(h => h !== null && h !== undefined ? String(h) : '') : 
                    [];
                if (data.length > 1) {
                    debugInfo.firstRow = (data[1] as any[]).map(v => {
                        if (v === null || v === undefined) return null;
                        return typeof v === 'number' ? v : String(v);
                    });
                }
                
                // Check for duplicate ROENganh columns - case insensitive match
                const roeNganhIndexes = headers
                    .map((header, index) => {
                        // Normalize the header to handle case variations and potential whitespace
                        const normalizedHeader = header.toLowerCase().trim();
                        return (normalizedHeader === 'roenganh' || normalizedHeader === 'roenganha') ? index : -1;
                    })
                    .filter(index => index !== -1);
                
                // Record duplicate columns for debugging
                if (roeNganhIndexes.length >= 2) {
                    const headerRow = data[0] as any[];
                    debugInfo.processingDetails.push({
                        type: 'excel_duplicate_column',
                        header_indexes: roeNganhIndexes,
                        header_values: roeNganhIndexes.map(idx => {
                            const headerValue = headerRow[idx];
                            return headerValue !== null && headerValue !== undefined ? String(headerValue) : null;
                        })
                    });
                }
                
                // Process data rows
                for (let i = 1; i < data.length; i++) {
                    const row = data[i] as any[];
                    if (row.length >= 2 && row[0] && row[1]) { // At least symbol and date
                        const record: any = {
                            roa: null,
                            roe: null,
                            roeNganh: null,
                            roeNganhRate: null
                        };
                        
                        // Khởi tạo các biến để lưu trữ dữ liệu
                        let symbolFound = false;
                        let reportDateFound = false;
                        
                        // Process standard fields từ headers đã chuẩn hóa
                        headers.forEach((header, index) => {
                            if (index < row.length) {
                                if (header === 'symbol') {
                                    record.symbol = String(row[index]).toUpperCase();
                                    symbolFound = true;
                                } else if (header === 'reportdate') {
                                    record.reportDate = parseDate(row[index]);
                                    reportDateFound = true;
                                } else if (header === 'roa') {
                                    record.roa = row[index] !== null ? parseFloat(row[index]) : null;
                                } else if (header === 'roe') {
                                    record.roe = row[index] !== null ? parseFloat(row[index]) : null;
                                }
                            }
                        });
                        
                        // Kiểm tra các header viết hoa cho Symbol và ReportDate
                        if (!symbolFound || !reportDateFound) {
                            const originalHeaders = data[0] as any[];
                            originalHeaders.forEach((originalHeader, index) => {
                                if (index < row.length && originalHeader !== null) {
                                    const headerStr = String(originalHeader).trim();
                                    
                                    // Kiểm tra Symbol
                                    if (!symbolFound && headerStr.toUpperCase() === 'SYMBOL') {
                                        record.symbol = String(row[index]).toUpperCase();
                                        symbolFound = true;
                                        
                                        if (i <= 3) {
                                            debugInfo.processingDetails.push({
                                                row: i,
                                                type: 'excel_field_detection',
                                                message: `Detected Symbol column with header: ${headerStr}`,
                                                value: record.symbol
                                            });
                                        }
                                    }
                                    
                                    // Kiểm tra ReportDate
                                    if (!reportDateFound && 
                                        (headerStr.toUpperCase() === 'REPORTDATE' || 
                                         headerStr.toUpperCase() === 'REPORT DATE' || 
                                         headerStr.toUpperCase() === 'REPORT_DATE')) {
                                        record.reportDate = parseDate(row[index]);
                                        reportDateFound = true;
                                        
                                        if (i <= 3) {
                                            debugInfo.processingDetails.push({
                                                row: i,
                                                type: 'excel_field_detection',
                                                message: `Detected ReportDate column with header: ${headerStr}`,
                                                value: record.reportDate
                                            });
                                        }
                                    }
                                }
                            });
                        }
                        
                        // Lưu lại các header gốc để debug
                        if (i <= 3) {
                            debugInfo.processingDetails.push({
                                type: 'excel_row_headers',
                                row: i,
                                headers: headers,
                                original_headers: data[0]
                            });
                        }
                        
                        // Xử lý các cột với tên chuẩn hóa
                        headers.forEach((header, index) => {
                            if (index < row.length) {
                                // Kiểm tra các biến thể của ROENganh
                                if (header === 'roenganha' || 
                                    header === 'roenganh' || 
                                    header === 'roenganh' || 
                                    header === 'roe_nganh' || 
                                    header === 'roenganh') {
                                    record.roeNganh = row[index] !== null ? parseFloat(row[index]) : null;
                                } 
                                // Kiểm tra các biến thể của ROANganh
                                else if (header === 'roanganh' || 
                                         header === 'roa_nganh' || 
                                         header === 'roanganh') {
                                    record.roaNganh = row[index] !== null ? parseFloat(row[index]) : null;
                                } 
                                // Kiểm tra roeNganhRate cho tương thích ngược
                                else if (header === 'roenganhrate') {
                                    // Backward compatibility: use roeNganhRate as roaNganh if roaNganh is not present
                                    if (record.roaNganh === null) {
                                        record.roaNganh = row[index] !== null ? parseFloat(row[index]) : null;
                                        
                                        // Record this conversion for debugging
                                        if (i <= 3 && debugInfo.processingDetails.length < 10) {
                                            debugInfo.processingDetails.push({
                                                row: i,
                                                type: 'field_conversion',
                                                message: 'Converted roeNganhRate to roaNganh for backward compatibility',
                                                value: record.roaNganh
                                            });
                                        }
                                    }
                                }
                            }
                        });
                        
                        // Kiểm tra các header viết hoa (ROA, ROE, ROENganh, ROANganh)
                        const originalHeaders = data[0] as any[];
                        originalHeaders.forEach((originalHeader, index) => {
                            if (index < row.length && originalHeader !== null) {
                                const headerStr = String(originalHeader).trim();
                                
                                // Kiểm tra ROA
                                if (headerStr.toUpperCase() === 'ROA') {
                                    record.roa = row[index] !== null ? parseFloat(row[index]) : null;
                                    
                                    if (i <= 3) {
                                        debugInfo.processingDetails.push({
                                            row: i,
                                            type: 'excel_field_detection',
                                            message: `Detected ROA column with header: ${headerStr}`,
                                            value: record.roa
                                        });
                                    }
                                }
                                
                                // Kiểm tra ROE
                                if (headerStr.toUpperCase() === 'ROE') {
                                    record.roe = row[index] !== null ? parseFloat(row[index]) : null;
                                    
                                    if (i <= 3) {
                                        debugInfo.processingDetails.push({
                                            row: i,
                                            type: 'excel_field_detection',
                                            message: `Detected ROE column with header: ${headerStr}`,
                                            value: record.roe
                                        });
                                    }
                                }
                                
                                // Kiểm tra ROENganh
                                if (headerStr.toUpperCase() === 'ROENGANH' || 
                                    headerStr.toUpperCase() === 'ROE NGANH' || 
                                    headerStr.toUpperCase() === 'ROE_NGANH') {
                                    record.roeNganh = row[index] !== null ? parseFloat(row[index]) : null;
                                    
                                    if (i <= 3) {
                                        debugInfo.processingDetails.push({
                                            row: i,
                                            type: 'excel_field_detection',
                                            message: `Detected ROENganh column with header: ${headerStr}`,
                                            value: record.roeNganh
                                        });
                                    }
                                }
                                
                                // Kiểm tra ROANganh
                                if (headerStr.toUpperCase() === 'ROANGANH' || 
                                    headerStr.toUpperCase() === 'ROA NGANH' || 
                                    headerStr.toUpperCase() === 'ROA_NGANH') {
                                    record.roaNganh = row[index] !== null ? parseFloat(row[index]) : null;
                                    
                                    if (i <= 3) {
                                        debugInfo.processingDetails.push({
                                            row: i,
                                            type: 'excel_field_detection',
                                            message: `Detected ROANganh column with header: ${headerStr}`,
                                            value: record.roaNganh
                                        });
                                    }
                                }
                            }
                        });
                        
                        if (record.symbol && record.reportDate) {
                            records.push(record);
                        }
                    }
                }
            }
        } else {
            res.status(400).json({ message: 'Unsupported file format. Please upload a CSV or Excel file.' });
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
        console.log(`Starting transaction to process ${records.length} records`);
        const result = await prisma.$transaction(async (prisma) => {
            let createdCount = 0;
            let updatedCount = 0;
            const errors: any[] = [];
            
            console.log(`Records to process:`, records.map(r => ({
                symbol: r.symbol,
                reportDate: r.reportDate,
                roa: r.roa,
                roe: r.roe,
                roeNganh: r.roeNganh,
                roaNganh: r.roaNganh
            })));

            for (const record of records) {
                try {
                    // Check if stock exists
                    console.log(`Checking if stock exists for import: ${record.symbol}`);
                    let stock = await prisma.stock.findUnique({
                        where: { symbol: record.symbol }
                    });

                    if (!stock) {
                        console.log(`Stock not found for import: ${record.symbol}, creating new stock`);
                        // Tạo stock mới nếu chưa tồn tại
                        try {
                            stock = await prisma.stock.create({
                                data: {
                                    symbol: record.symbol,
                                    name: record.symbol // Tạm thời dùng symbol làm name
                                    // Không thêm trường description vì nó không tồn tại trong model Stock
                                }
                            });
                            console.log(`Created new stock for import: ${record.symbol}`);
                        } catch (createError) {
                            console.error(`Error creating stock for import:`, createError);
                            errors.push({ 
                                record, 
                                error: `Failed to create stock with symbol '${record.symbol}': ${(createError as Error).message}` 
                            });
                            continue;
                        }
                    }

                    // Check if record already exists
                    console.log(`Checking if record exists: ${record.symbol}, ${record.reportDate}`);
                    const existingRecord = await (prisma as any).roaRoeRecord.findFirst({
                        where: {
                            symbol: record.symbol,
                            reportDate: record.reportDate
                        }
                    });

                    if (existingRecord) {
                        console.log(`Updating existing record: ${record.symbol}, ${record.reportDate}`);
                        // Update existing record
                        await (prisma as any).roaRoeRecord.update({
                            where: { id: existingRecord.id },
                            data: {
                                roa: record.roa,
                                roe: record.roe,
                                roeNganh: record.roeNganh,
                                roaNganh: record.roaNganh
                            }
                        });
                        updatedCount++;
                        console.log(`Updated record: ${record.symbol}, ${record.reportDate}`);
                    } else {
                        console.log(`Creating new record: ${record.symbol}, ${record.reportDate}`);
                        // Create new record
                        try {
                            const newRecord = await (prisma as any).roaRoeRecord.create({
                                data: {
                                    symbol: record.symbol,
                                    reportDate: record.reportDate,
                                    roa: record.roa,
                                    roe: record.roe,
                                    roeNganh: record.roeNganh,
                                    roaNganh: record.roaNganh
                                }
                            });
                            createdCount++;
                            console.log(`Created new record: ${record.symbol}, ${record.reportDate}, ID: ${newRecord.id}`);
                        } catch (createError) {
                            console.error(`Error creating record:`, createError);
                            errors.push({ 
                                record, 
                                error: `Failed to create record: ${(createError as Error).message}` 
                            });
                        }
                    }
                } catch (error) {
                    errors.push({ record, error: (error as Error).message });
                }
            }

            return { createdCount, updatedCount, errors };
        }, {
            timeout: 60000 // Increase timeout to 60 seconds
        });

        // Include debug info in the response
        res.status(200).json({
            message: `Import completed with ${result.createdCount} created and ${result.updatedCount} updated`,
            imported: result.createdCount + result.updatedCount,
            total: records.length,
            errors: result.errors,
            debug: debugInfo
        });
    } catch (error) {
        console.error('Error importing ROA/ROE records:', error);
        res.status(500).json({ 
            message: 'Server error importing ROA/ROE records',
            debug: debugInfo
        });
    }
};