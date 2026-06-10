import prisma from '../src/utils/prisma';
import { hashPassword } from '../src/utils/password';
import { UserRole, TimeSlot } from '../src/types/enums';

async function main() {
  console.log('开始种子数据...');

  const password = await hashPassword('admin123');
  const patientPassword = await hashPassword('patient123');
  const doctorPassword = await hashPassword('doctor123');
  const financePassword = await hashPassword('finance123');

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password,
      realName: '系统管理员',
      role: UserRole.ADMIN,
    },
  });
  console.log('管理员账号: admin / admin123');

  const internalDept = await prisma.department.upsert({
    where: { name: '内科' },
    update: {},
    create: {
      name: '内科',
      description: '内科诊疗',
    },
  });

  const surgeryDept = await prisma.department.upsert({
    where: { name: '外科' },
    update: {},
    create: {
      name: '外科',
      description: '外科诊疗',
    },
  });

  const pediatricsDept = await prisma.department.upsert({
    where: { name: '儿科' },
    update: {},
    create: {
      name: '儿科',
      description: '儿科诊疗',
    },
  });

  const deptAdmin = await prisma.user.upsert({
    where: { username: 'dept_admin' },
    update: {},
    create: {
      username: 'dept_admin',
      password,
      realName: '内科管理员',
      role: UserRole.DEPT_ADMIN,
      departmentId: internalDept.id,
    },
  });
  console.log('科室管理员账号: dept_admin / admin123');

  const doctor1 = await prisma.user.upsert({
    where: { username: 'doctor1' },
    update: {},
    create: {
      username: 'doctor1',
      password: doctorPassword,
      realName: '张医生',
      role: UserRole.DOCTOR,
      departmentId: internalDept.id,
    },
  });
  console.log('医生账号: doctor1 / doctor123');

  const doctor2 = await prisma.user.upsert({
    where: { username: 'doctor2' },
    update: {},
    create: {
      username: 'doctor2',
      password: doctorPassword,
      realName: '李医生',
      role: UserRole.DOCTOR,
      departmentId: surgeryDept.id,
    },
  });
  console.log('医生账号: doctor2 / doctor123');

  const finance = await prisma.user.upsert({
    where: { username: 'finance' },
    update: {},
    create: {
      username: 'finance',
      password: financePassword,
      realName: '财务人员',
      role: UserRole.FINANCE,
    },
  });
  console.log('财务人员账号: finance / finance123');

  const patient1 = await prisma.user.upsert({
    where: { username: 'patient1' },
    update: {},
    create: {
      username: 'patient1',
      password: patientPassword,
      realName: '王小明',
      role: UserRole.PATIENT,
      phone: '13800138001',
      idCard: '110101199001010001',
    },
  });
  console.log('患者账号: patient1 / patient123');

  const patient2 = await prisma.user.upsert({
    where: { username: 'patient2' },
    update: {},
    create: {
      username: 'patient2',
      password: patientPassword,
      realName: '李小红',
      role: UserRole.PATIENT,
      phone: '13800138002',
      idCard: '110101199002020002',
    },
  });
  console.log('患者账号: patient2 / patient123');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    const timeSlots = [TimeSlot.MORNING, TimeSlot.AFTERNOON, TimeSlot.EVENING];

    for (const slot of timeSlots) {
      const existing = await prisma.schedule.findFirst({
        where: {
          doctorId: doctor1.id,
          date,
          timeSlot: slot,
        },
      });

      if (!existing && (i > 0 || slot !== TimeSlot.EVENING)) {
        const maxSlots = slot === TimeSlot.MORNING ? 20 : slot === TimeSlot.AFTERNOON ? 15 : 10;
        const fee = 100;

        const schedule = await prisma.schedule.create({
          data: {
            doctorId: doctor1.id,
            departmentId: internalDept.id,
            date,
            timeSlot: slot,
            maxSlots,
            fee,
          },
        });

        await prisma.slotInventory.create({
          data: {
            scheduleId: schedule.id,
            totalSlots: maxSlots,
            availableSlots: maxSlots,
          },
        });
      }
    }

    const existing2 = await prisma.schedule.findFirst({
      where: {
        doctorId: doctor2.id,
        date,
        timeSlot: TimeSlot.MORNING,
      },
    });

    if (!existing2) {
      const schedule = await prisma.schedule.create({
        data: {
          doctorId: doctor2.id,
          departmentId: surgeryDept.id,
          date,
          timeSlot: TimeSlot.MORNING,
          maxSlots: 15,
          fee: 150,
        },
      });

      await prisma.slotInventory.create({
        data: {
          scheduleId: schedule.id,
          totalSlots: 15,
          availableSlots: 15,
        },
      });
    }
  }

  console.log('排班数据已创建（未来7天）');
  console.log('种子数据完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
