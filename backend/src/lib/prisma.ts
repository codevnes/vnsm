import { PrismaClient, Prisma } from '@prisma/client';

// Instantiate Prisma Client
const prisma = new PrismaClient({
    // Optional: Log database queries during development
    // log: ['query', 'info', 'warn', 'error'],
});

// Export the instance
export default prisma;

// Export Prisma namespace for types
export { Prisma };

// Export Role type for convenience
export type Role = 'admin' | 'editor' | 'user';

// Optional: Add graceful shutdown logic
// process.on('beforeExit', async () => {
//   await prisma.$disconnect();
//   console.log('Prisma Client disconnected');
// }); 