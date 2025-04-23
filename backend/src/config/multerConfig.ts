import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Function to sanitize filename for SEO (basic example)
const sanitizeFilename = (filename: string): string => {
    // Remove extension
    const nameWithoutExt = path.parse(filename).name;
    // Replace non-alphanumeric characters (except hyphens) with hyphen, convert to lowercase
    const sanitized = nameWithoutExt
        .toLowerCase()
        .replace(/[^a-z0-9\-]+/g, '-') // Allow alphanumeric and hyphens
        .replace(/--+/g, '-') // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
    return sanitized || 'image'; // Fallback name
};

const uploadDir = path.join(__dirname, '../../public/uploads/images');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage configuration
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const sanitizedOriginalName = sanitizeFilename(file.originalname);
        // Append timestamp and use .webp extension
        const uniqueSuffix = Date.now();
        const finalFilename = `${sanitizedOriginalName}-${uniqueSuffix}.webp`;
        cb(null, finalFilename);
    }
});

// Multer file filter (accept only common image types)
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Image uploads only support the following filetypes - ' + allowedTypes));
    }
};

// Multer upload instance
export const uploadImageMulter = multer({
    storage: imageStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size (e.g., 10MB)
    fileFilter: imageFileFilter
});

// --- NEW: CSV Upload Config ---
const csvStorage = multer.memoryStorage(); // Store CSV in memory for parsing

const csvFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept CSV and Excel files (.xlsx, .xls)
    if (
        file.mimetype === 'text/csv' || 
        file.originalname.toLowerCase().endsWith('.csv') ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.toLowerCase().endsWith('.xlsx') ||
        file.originalname.toLowerCase().endsWith('.xls')
    ) {
        cb(null, true);
    } else {
        cb(new Error('Error: Only CSV and Excel files (.csv, .xlsx, .xls) are allowed for bulk import.'));
    }
};

export const uploadCsvMulter = multer({
    storage: csvStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // Limit file size (e.g., 20MB)
    fileFilter: csvFileFilter
});

// NO default export needed if using named exports everywhere 