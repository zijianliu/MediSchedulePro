import prisma from '../src/utils/prisma';

beforeAll(async () => {
});

beforeEach(async () => {
  await prisma.statusLog.deleteMany();
  await prisma.operationLog.deleteMany();
  await prisma.refundRecord.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.slotInventory.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
