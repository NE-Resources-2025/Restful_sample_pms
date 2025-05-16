import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...');

    // Create admin user if not exists
    const adminEmail = 'user@admin.com';
    const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('adminEdwige123!', 10);
      await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          role: 'admin',
          isVerified: true,
        },
      });
      console.log('Admin user created');
    }

    // Seed sample parking slot
    const slotExists = await prisma.parkingSlot.findFirst();
    if (!slotExists) {
      await prisma.parkingSlot.create({
        data: {
          slotNumber: 'A1',
          size: 'small',
          vehicleType: 'car',
          location: 'West Wing',
          status: 'available',
        },
      });
      console.log('Sample parking slot created');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase();