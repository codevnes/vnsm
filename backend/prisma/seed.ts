import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Any existing seed data should stay here
  
  // Add default settings
  const defaultSettings = [
    {
      key: 'site_address',
      value: '123 Main Street, City, Country',
      description: 'Company address displayed in the footer',
      type: 'text'
    },
    {
      key: 'contact_email',
      value: 'contact@vsmi.vn',
      description: 'Primary contact email address',
      type: 'text'
    },
    {
      key: 'contact_phone',
      value: '+84 123 456 789',
      description: 'Primary contact phone number',
      type: 'text'
    },
    {
      key: 'logo_url',
      value: '/images/logo.png',
      description: 'Main website logo URL',
      type: 'image'
    },
    {
      key: 'site_name',
      value: 'VSMI',
      description: 'Website name',
      type: 'text'
    },
    {
      key: 'social_media',
      value: JSON.stringify({
        facebook: 'https://facebook.com/vsmi',
        twitter: 'https://twitter.com/vsmi',
        linkedin: 'https://linkedin.com/company/vsmi'
      }),
      description: 'Social media links',
      type: 'json'
    },
    {
      key: 'featured_posts',
      value: JSON.stringify([]),
      description: 'IDs of featured posts to display on the homepage',
      type: 'json'
    }
  ];

  console.log('Seeding default settings...');

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 