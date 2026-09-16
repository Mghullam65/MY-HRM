const assert = require('assert');
const fs = require('fs');
const path = require('path');
const jobEngine = require('../server/src/jobs/dailyAttendanceSummary');
const emailService = require('../server/src/services/emailService');

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 MASTER TEST SUITE: DAILY ATTENDANCE SUMMARY JOB');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. Timezone evaluation test
  test('Timezone calculation handles configured timezones accurately', () => {
    const karachi = jobEngine.getTimezoneContext('Asia/Karachi');
    assert(karachi.dateStr && /^\d{4}-\d{2}-\d{2}$/.test(karachi.dateStr), 'Valid Karachi date');
    assert(karachi.timeStr && /^\d{2}:\d{2}$/.test(karachi.timeStr), 'Valid Karachi time');

    const dubai = jobEngine.getTimezoneContext('Asia/Dubai');
    assert(dubai.dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dubai.dateStr), 'Valid Dubai date');

    const london = jobEngine.getTimezoneContext('Europe/London');
    assert(london.dateStr && /^\d{4}-\d{2}-\d{2}$/.test(london.dateStr), 'Valid London date');
  });

  // 2. Settings retrieval test
  test('Settings return operational defaults and configuration parameters', () => {
    const cfg = jobEngine.getSettings();
    assert(typeof cfg.enabled === 'boolean', 'Enabled is boolean');
    assert(typeof cfg.sendTime === 'string', 'sendTime is string');
    assert(typeof cfg.timezone === 'string', 'timezone is string');
    assert(typeof cfg.recipients === 'string' && cfg.recipients.length > 0, 'recipients configured');
  });

  // 3. Read-Only data fetching test
  test('Read-only data aggregation produces correct structure without modifying DB', () => {
    const testDate = '2026-09-17';
    const summary = jobEngine.fetchSummaryData(testDate);

    assert(typeof summary.totalActive === 'number', 'totalActive is a number');
    assert(typeof summary.presentCount === 'number', 'presentCount is a number');
    assert(typeof summary.absentCount === 'number', 'absentCount is a number');
    assert(typeof summary.leaveCount === 'number', 'leaveCount is a number');
    assert(Array.isArray(summary.presentList), 'presentList is an array');
    assert(Array.isArray(summary.leaveList), 'leaveList is an array');
    assert(Array.isArray(summary.absentList), 'absentList is an array');
    assert(typeof summary.attendanceRate === 'string', 'attendanceRate is string percentage');
  });

  // 4. HTML Email rendering test
  test('HTML template renders complete executive email with inline styles', () => {
    const mockData = {
      companyName: 'ApexHRM Test Corp',
      dateStr: '2026-09-17',
      dayName: 'Thursday',
      timezone: 'Asia/Karachi',
      totalActive: 10,
      presentCount: 7,
      lateCount: 2,
      leaveCount: 1,
      absentCount: 2,
      attendanceRate: '70%',
      presentList: [
        { id: 1, empNo: 'EMP-001', fullName: 'Ahmed Khan', department: 'Executive', checkIn: '08:55', device: 'Head Office Terminal', isLate: false },
        { id: 2, empNo: 'EMP-002', fullName: 'Sara Malik', department: 'Engineering', checkIn: '09:40', device: 'Head Office Terminal', isLate: true, lateMinutes: 25 }
      ],
      leaveList: [
        { id: 3, empNo: 'EMP-003', fullName: 'Omar Farhan', department: 'Finance', leaveType: 'Annual Leave', reason: 'Vacation' }
      ],
      absentList: [
        { id: 4, empNo: 'EMP-004', fullName: 'Fatima Raza', department: 'Marketing', designation: 'Specialist' }
      ]
    };

    const html = emailService.generateDailyAttendanceHtml(mockData);
    assert(html.includes('Daily Attendance Summary'), 'Contains heading');
    assert(html.includes('ApexHRM Test Corp'), 'Contains company name');
    assert(html.includes('70%'), 'Contains attendance rate');
    assert(html.includes('Ahmed Khan'), 'Contains present employee');
    assert(html.includes('LATE (+25m)'), 'Contains late badge');
    assert(html.includes('Omar Farhan'), 'Contains leave employee');
    assert(html.includes('Fatima Raza'), 'Contains absent employee');
    assert(!html.includes('undefined'), 'Contains no undefined interpolation bugs');
  });

  // 5. Execution & Email dispatch test
  await testAsync('executeJob dispatches email and writes success record to ledger', async () => {
    const testDate = '2026-09-17';
    const result = await jobEngine.executeJob({
      force: true,
      targetDate: testDate,
      triggerSource: 'automated_test',
      testRecipient: 'test.admin@company.com'
    });

    assert(result.success === true, 'Result is success');
    assert(result.date === testDate, 'Date matches');
    assert(result.recipients.includes('test.admin@company.com'), 'Recipient included');
    assert(fs.existsSync(result.archivedFile), 'Archive HTML email file exists on disk');

    const ledger = jobEngine.getLedger();
    const entry = ledger.find(l => l.date === testDate && l.status === 'success');
    assert(entry !== undefined, 'Ledger recorded successful execution');
    assert(entry.triggerSource === 'automated_test', 'Ledger recorded correct trigger source');
  });

  // 6. Duplicate Prevention Test
  await testAsync('Duplicate execution for the same date is blocked without force flag', async () => {
    const testDate = '2026-09-17';
    const result = await jobEngine.executeJob({
      force: false,
      targetDate: testDate,
      triggerSource: 'automated_test_duplicate'
    });

    assert(result.success === true, 'Returns success response');
    assert(result.skipped === true, 'Marked as skipped');
    assert(result.reason === 'already_sent_today', 'Skipped due to duplicate check');
  });

  // 7. Retry Mechanism Test
  await testAsync('Retry re-dispatches report for specified date even when previously recorded', async () => {
    const testDate = '2026-09-17';
    const result = await jobEngine.executeJob({
      force: true,
      targetDate: testDate,
      triggerSource: 'retry_test',
      testRecipient: 'retry.recipient@company.com'
    });

    assert(result.success === true, 'Retry completed successfully');
    assert(result.recipients.includes('retry.recipient@company.com'), 'Retry dispatched to specified recipient');
  });

  console.log('\n======================================================');
  console.log(`📊 RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
  console.log('======================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Master Test Suite encountered uncaught fatal error:', err);
  process.exit(1);
});
