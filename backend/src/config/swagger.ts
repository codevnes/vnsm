import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'VNSM API Documentation',
            version: '1.0.0',
            description: 'API documentation for the VNSM backend service',
            // You can add contact, license info here if needed
            // contact: {
            //   name: "Support Team",
            //   url: "http://www.example.com/support",
            //   email: "support@example.com",
            // },
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Development server',
            },
            // Add other servers (staging, production) if needed
        ],
        // Add components for security schemes (Bearer Auth for JWT)
        components: {
          securitySchemes: {
            bearerAuth: { // Can be any name, used in security section below
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'Enter JWT token obtained from /api/auth/login'
            }
          }
        },
        // Optional: Define global security, or apply per-tag/per-operation
        // security: [{
        //   bearerAuth: [] // Requires bearerAuth for all endpoints globally
        // }]
    },
    // Path to the API docs files (can include controllers, routes, etc.)
    apis: [
        path.join(__dirname, '../routes/auth.ts'),      // Include specific route files 
        path.join(__dirname, '../routes/category.ts'),  // Include specific route files
        path.join(__dirname, '../routes/post.ts'),      // Include specific route files
        path.join(__dirname, '../routes/stock.ts'),     // Include specific route files
        path.join(__dirname, '../routes/upload.ts'),    // Include specific route files
        path.join(__dirname, '../routes/image.ts'),     // Include specific route files
        path.join(__dirname, '../routes/stockQindexNew.ts'),  // Include stockQindexNew routes
        // path.join(__dirname, '../controllers/*.ts'), // Optionally include controllers if they have annotations
    ],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
    // Serve Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Optional: Serve the JSON specification
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log(`Swagger UI available at http://localhost:${process.env.PORT || 3000}/api-docs`);
}; 