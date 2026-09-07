const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Branches
  const branches = [
    { id: 1, name: 'Head Office', city: 'Karachi', address: 'Plot 12, Block B, PECHS', isHeadOffice: true },
    { id: 2, name: 'Lahore Branch', city: 'Lahore', address: 'Gulberg III, Lahore', isHeadOffice: false },
    { id: 3, name: 'Islamabad Branch', city: 'Islamabad', address: 'Blue Area, F-7', isHeadOffice: false }
  ];

  for (const b of branches) {
    await prisma.branch.upsert({
      where: { id: b.id },
      update: b,
      create: b
    });
  }
  console.log('✅ Branches seeded');

  // 2. Departments
  const departments = [
    { id: 1, code: 'HR', name: 'Human Resources', head: 'Sara Malik', budget: 500000 },
    { id: 2, code: 'IT', name: 'Information Technology', head: 'Usman Baig', budget: 1500000 },
    { id: 3, code: 'FIN', name: 'Finance & Accounting', head: 'Bilal Ahmed', budget: 800000 },
    { id: 4, code: 'MKT', name: 'Sales & Marketing', head: 'Nadia Farooq', budget: 1200000 },
    { id: 5, code: 'OPS', name: 'Operations', head: 'Operations Lead', budget: 700000 },
    { id: 6, code: 'ADM', name: 'Administration', head: 'Ahmed Khan', budget: 600000 }
  ];

  for (const d of departments) {
    await prisma.department.upsert({
      where: { id: d.id },
      update: d,
      create: d
    });
  }
  console.log('✅ Departments seeded');

  // 3. Designations
  const designations = [
    { id: 1, departmentId: 6, title: 'Chief Executive Officer', level: 'C-Level', minSalary: 300000, maxSalary: 600000 },
    { id: 2, departmentId: 1, title: 'HR Manager', level: 'Manager', minSalary: 100000, maxSalary: 180000 },
    { id: 3, departmentId: 2, title: 'Software Engineer', level: 'Mid', minSalary: 80000, maxSalary: 140000 },
    { id: 4, departmentId: 2, title: 'Senior Developer', level: 'Senior', minSalary: 140000, maxSalary: 250000 },
    { id: 5, departmentId: 3, title: 'Finance Manager', level: 'Manager', minSalary: 110000, maxSalary: 190000 },
    { id: 6, departmentId: 3, title: 'Accountant', level: 'Mid', minSalary: 60000, maxSalary: 95000 },
    { id: 7, departmentId: 4, title: 'Sales Executive', level: 'Junior', minSalary: 50000, maxSalary: 85000 },
    { id: 8, departmentId: 4, title: 'Marketing Lead', level: 'Senior', minSalary: 120000, maxSalary: 200000 },
    { id: 9, departmentId: 1, title: 'HR Executive', level: 'Junior', minSalary: 50000, maxSalary: 75000 }
  ];

  for (const d of designations) {
    await prisma.designation.upsert({
      where: { id: d.id },
      update: d,
      create: d
    });
  }
  console.log('✅ Designations seeded');

  // 4. Shifts
  const shifts = [
    { id: 1, name: 'Morning Regular', startTime: '09:00', endTime: '18:00', graceMinutes: 15, workingHours: 8 },
    { id: 2, name: 'Evening Shift', startTime: '14:00', endTime: '22:00', graceMinutes: 15, workingHours: 8 },
    { id: 3, name: 'Night Shift', startTime: '22:00', endTime: '06:00', graceMinutes: 15, workingHours: 8 },
    { id: 4, name: 'Flexible Shift', startTime: '08:00', endTime: '17:00', graceMinutes: 30, workingHours: 8 }
  ];

  for (const s of shifts) {
    await prisma.shift.upsert({
      where: { id: s.id },
      update: s,
      create: s
    });
  }
  console.log('✅ Shifts seeded');

  // 5. Leave Types
  const leaveTypes = [
    { id: 1, code: 'ANNUAL', name: 'Annual / Casual Leave', daysAllowed: 14, isPaid: true, carryForward: true },
    { id: 2, code: 'SICK', name: 'Sick / Medical Leave', daysAllowed: 10, isPaid: true, carryForward: false },
    { id: 3, code: 'MATERNITY', name: 'Maternity Leave', daysAllowed: 90, isPaid: true, carryForward: false },
    { id: 4, code: 'UNPAID', name: 'Leave Without Pay', daysAllowed: 30, isPaid: false, carryForward: false }
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { id: lt.id },
      update: lt,
      create: lt
    });
  }
  console.log('✅ Leave types seeded');

  // 6. Employees & Users
  const defaultPwHash = await bcrypt.hash('admin123', 10);
  const hrPwHash = await bcrypt.hash('hr123', 10);
  const mgrPwHash = await bcrypt.hash('mgr123', 10);
  const empPwHash = await bcrypt.hash('emp123', 10);

  const initialEmployees = [
    {
      id: 1, empNo: 'EMP-001', firstName: 'Ahmed', lastName: 'Khan', fullName: 'Ahmed Khan',
      email: 'ahmed.khan@company.com', phone: '0300-1234567', departmentId: 6, designationId: 1,
      branchId: 1, shiftId: 1, joiningDate: '2015-01-01', salary: 350000, role: 'superadmin',
      username: 'admin', passwordHash: defaultPwHash
    },
    {
      id: 2, empNo: 'EMP-002', firstName: 'Sara', lastName: 'Malik', fullName: 'Sara Malik',
      email: 'sara.malik@company.com', phone: '0321-2345678', departmentId: 1, designationId: 2,
      branchId: 1, shiftId: 1, joiningDate: '2018-03-01', salary: 120000, role: 'hr_manager',
      username: 'sara.malik', passwordHash: hrPwHash
    },
    {
      id: 3, empNo: 'EMP-003', firstName: 'Usman', lastName: 'Baig', fullName: 'Usman Baig',
      email: 'usman.baig@company.com', phone: '0333-3456789', departmentId: 2, designationId: 4,
      branchId: 1, shiftId: 1, joiningDate: '2019-06-15', salary: 150000, role: 'dept_manager',
      username: 'usman.baig', passwordHash: mgrPwHash
    },
    {
      id: 4, empNo: 'EMP-004', firstName: 'Fatima', lastName: 'Raza', fullName: 'Fatima Raza',
      email: 'fatima.raza@company.com', phone: '0345-4567890', departmentId: 2, designationId: 3,
      branchId: 1, shiftId: 1, joiningDate: '2021-02-01', salary: 85000, role: 'employee',
      username: 'fatima.raza', passwordHash: empPwHash
    }
  ];

  for (const emp of initialEmployees) {
    const { username, passwordHash, ...empData } = emp;

    const createdEmp = await prisma.employee.upsert({
      where: { id: empData.id },
      update: empData,
      create: empData
    });

    await prisma.user.upsert({
      where: { username },
      update: {
        role: createdEmp.role,
        status: 'active',
        employeeId: createdEmp.id
      },
      create: {
        username,
        password: passwordHash,
        role: createdEmp.role,
        employeeId: createdEmp.id,
        status: 'active'
      }
    });

    // Leave balances
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: createdEmp.id,
            leaveTypeId: lt.id,
            year: 2026
          }
        },
        update: {},
        create: {
          employeeId: createdEmp.id,
          leaveTypeId: lt.id,
          year: 2026,
          total: lt.daysAllowed,
          used: 0,
          pending: 0,
          available: lt.daysAllowed
        }
      });
    }
  }
  console.log('✅ Demo Employees and Users seeded');

  // 7. Initial Holidays
  const holidays = [
    { title: 'Pakistan Day', date: '2026-03-23', year: 2026 },
    { title: 'Labor Day', date: '2026-05-01', year: 2026 },
    { title: 'Independence Day', date: '2026-08-14', year: 2026 },
    { title: 'Iqbal Day', date: '2026-11-09', year: 2026 },
    { title: 'Quaid-e-Azam Day', date: '2026-12-25', year: 2026 }
  ];

  for (const h of holidays) {
    await prisma.holiday.create({ data: h }).catch(() => {});
  }
  console.log('✅ Holidays seeded');

  console.log('\n🎉 Database seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
