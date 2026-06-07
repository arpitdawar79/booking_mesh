import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    const booking = await prisma.booking.findFirst({
      include: { payments: true, guest: true, whatsappMessages: true, emailsSent: true }
    });
    console.log('OK:', JSON.stringify(booking, null, 2));
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
