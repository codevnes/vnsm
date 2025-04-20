import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware to handle validation errors
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    next();
};

// Validation rules for user registration
export const validateRegistration = [
    body('email')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('full_name')
        .notEmpty().withMessage('Full name is required')
        .trim()
        .escape(),
    body('phone')
        .optional({ checkFalsy: true })
        .isMobilePhone('any').withMessage('Must be a valid phone number') // Adjust locale if needed
        .trim()
        .escape(),
    handleValidationErrors // Apply the error handler middleware
];

// Validation rules for user login
export const validateLogin = [
    body('email')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    handleValidationErrors // Apply the error handler middleware
];

// --- TODO: Add validation for Forgot Password --- 

// Validation rules for creating/updating a category
export const validateCategoryData = [
    body('title')
        .optional() // Title might not be present on update
        .notEmpty().withMessage('Title cannot be empty')
        .trim()
        .escape(),
    body('description')
        .optional()
        .trim()
        .escape(),
    body('parent_id')
        .optional({ nullable: true })
        .isInt({ allow_leading_zeroes: false }).withMessage('parent_id must be an integer')
        .toInt(), // Convert to integer
    // Add more specific validation as needed (e.g., check if parent_id exists)
    handleValidationErrors
];

// Validation rules for creating/updating a post
export const validatePostData = [
    body('title')
        .optional() // Title might not be present on update
        .notEmpty().withMessage('Title cannot be empty')
        .trim()
        .escape(),
    body('description')
        .optional()
        .trim()
        .escape(),
    body('content')
        .optional()
        .trim(), // Avoid escaping potentially rich content like HTML
    body('category_id')
        .optional() // Might not be present on update
        .notEmpty().withMessage('category_id is required for new posts') // Required on create usually
        .isInt({ allow_leading_zeroes: false }).withMessage('category_id must be an integer')
        .toInt(),
    body('stock_id')
        .optional({ nullable: true })
        .isInt({ allow_leading_zeroes: false }).withMessage('stock_id must be an integer')
        .toInt(),
    body('user_id') // IMPORTANT: Remove this in production - use authenticated user
        .optional() // Required only on create via controller logic for now
        .isInt({ allow_leading_zeroes: false }).withMessage('user_id must be an integer')
        .toInt(),
    handleValidationErrors
];

// Validation rules for creating/updating a stock
export const validateStockData = [
    body('symbol')
        .optional() // Symbol might not be present on update
        .notEmpty().withMessage('Symbol cannot be empty')
        .isLength({ max: 20 }).withMessage('Symbol cannot exceed 20 characters') 
        .trim()
        .escape(), // Basic escaping
    body('name')
        .optional() // Name might not be present on update
        .notEmpty().withMessage('Name cannot be empty')
        .trim()
        .escape(),
    body('exchange')
        .optional()
        .isLength({ max: 100 }).withMessage('Exchange cannot exceed 100 characters')
        .trim()
        .escape(),
    body('industry')
        .optional()
        .isLength({ max: 100 }).withMessage('Industry cannot exceed 100 characters')
        .trim()
        .escape(),
    handleValidationErrors
]; 