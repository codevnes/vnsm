import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors'; // Import cors
// import { testDbConnection } from './config/db'; // Remove this import
import authRoutes from './routes/auth'; // Import authentication routes
import categoryRoutes from './routes/category'; // Import category routes
import postRoutes from './routes/post'; // Import post routes
import stockRoutes from './routes/stock'; // Import stock routes
import uploadRoutes from './routes/upload'; // Import the new upload routes
import imageRoutes from './routes/image'; // Import the new image routes
import { setupSwagger } from './config/swagger'; // Import Swagger setup function
import stockQIndexRoutes from './routes/stockQIndex';

dotenv.config(); // Load environment variables from .env file

// // Test Database Connection - Remove this call
// testDbConnection();

const app: Express = express();
const port = process.env.PORT || 3001; // Ensure this matches your backend port

// --- Middleware ---

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Configure CORS
const corsOptions = {
  origin: ['http://localhost:3000', ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions)); // Use CORS middleware with options

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

// Auth Routes
app.use('/api/auth', authRoutes);

// --- Add other API Routes ---
app.use('/api/categories', categoryRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/upload', uploadRoutes); // Mount the upload routes
app.use('/api/images', imageRoutes);  // Mount image routes for GET/PUT/DELETE /api/images...
app.use('/api/qindices', stockQIndexRoutes);

// --- Swagger Setup ---
setupSwagger(app);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app;