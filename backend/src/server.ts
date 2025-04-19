import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
// import { testDbConnection } from './config/db'; // Remove this import
import authRoutes from './routes/auth'; // Import authentication routes
import categoryRoutes from './routes/category'; // Import category routes
import postRoutes from './routes/post'; // Import post routes
import { setupSwagger } from './config/swagger'; // Import Swagger setup function

dotenv.config(); // Load environment variables from .env file

// // Test Database Connection - Remove this call
// testDbConnection();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
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

// --- Swagger Setup ---
setupSwagger(app);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app; 