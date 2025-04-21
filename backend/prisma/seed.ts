import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const stockData = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', industry: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', exchange: 'NASDAQ', industry: 'Communication Services' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', industry: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ', industry: 'Consumer Cyclical' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', industry: 'Consumer Cyclical' },
  { symbol: 'VFS', name: 'VinFast Auto Ltd.', exchange: 'NASDAQ', industry: 'Auto Manufacturers'},
  { symbol: 'FPT', name: 'FPT Corporation', exchange: 'HOSE', industry: 'Technology'},
  { symbol: 'VIC', name: 'Vingroup JSC', exchange: 'HOSE', industry: 'Conglomerate'},
  { symbol: 'VCB', name: 'Vietcombank', exchange: 'HOSE', industry: 'Financial Services'},
  { symbol: 'HPG', name: 'Hoa Phat Group JSC', exchange: 'HOSE', industry: 'Basic Materials'},
];

async function main() {
  // Tạo người dùng admin
  console.log(`Kiểm tra người dùng admin...`);
  const adminExists = await prisma.user.findUnique({
    where: {
      email: 'admin@vsmi.vn',
    },
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@vsmi.vn',
        full_name: 'Admin',
        password: hashedPassword,
        role: 'admin',
        verified: true,
      },
    });
    console.log('Đã tạo người dùng admin');
  } else {
    console.log('Người dùng admin đã tồn tại');
  }

  // Tạo dữ liệu cổ phiếu
  console.log(`Start seeding stocks...`);
  for (const stock of stockData) {
    const upsertedStock = await prisma.stock.upsert({
      where: { symbol: stock.symbol },
      update: {}, // No update needed if exists, just ensures it's there
      create: stock,
    });
    console.log(`Created or found stock with symbol: ${upsertedStock.symbol}`);
  }
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 