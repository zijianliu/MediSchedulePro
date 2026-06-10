import prisma from '../src/utils/prisma';
import { waitForAllNotifications } from '../src/services/notification.service';

beforeAll(async () => {
});

beforeEach(async () => {
  await waitForAllNotifications();
});

afterEach(async () => {
  await waitForAllNotifications();

  await prisma.statusLog.deleteMany();
  await prisma.operationLog.deleteMany();
  await prisma.refundRecord.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.slotInventory.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  await waitForAllNotifications();
});

afterAll(async () => {
  await waitForAllNotifications();
  await prisma.$disconnect();
});
