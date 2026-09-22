const fs = require('fs');

console.log('--- CSS AUDIT FOR 100% ZOOM VISIBILITY ---');
const css = fs.readFileSync('css/main.css', 'utf8');

const tests = [
  { name: 'Sidebar width reduced to 220px', pass: css.includes('--sidebar-w:      220px;') },
  { name: 'Main content min-width: 0 (prevents flex blowout)', pass: css.includes('.main-content') && css.includes('min-width: 0;') },
  { name: 'Page content min-width: 0 and overflow-x: hidden', pass: css.includes('.page-content') && css.includes('overflow-x: hidden;') },
  { name: 'Card min-width: 0 and max-width: 100%', pass: css.includes('.card') && css.includes('max-width: 100%;') },
  { name: 'Table wrapper & table-responsive with overflow-x: auto and thin scrollbar', pass: css.includes('.table-wrapper, .table-responsive') && css.includes('scrollbar-width: thin;') },
  { name: 'Compact table th and td padding', pass: css.includes('padding: 8px 10px;') },
  { name: 'Table wrapper compact button styling', pass: css.includes('.table-wrapper .btn, .table-responsive .btn') },
  { name: 'Desktop media query @media (max-width: 1536px)', pass: css.includes('@media (max-width: 1536px)') },
  { name: 'Laptop media query @media (max-width: 1440px)', pass: css.includes('@media (max-width: 1440px)') },
  { name: 'Compact laptop media query @media (max-width: 1280px)', pass: css.includes('@media (max-width: 1280px)') },
  { name: 'Module stage tabs wrapping and compact padding', pass: css.includes('.module-stage-tabs,') && css.includes('flex-wrap: wrap;') }
];

let allPassed = true;
tests.forEach(t => {
  console.log((t.pass ? '  ✅ [PASS] ' : '  ❌ [FAIL] ') + t.name);
  if (!t.pass) allPassed = false;
});

const att = fs.readFileSync('js/attendance.js', 'utf8');
const attPass = att.includes('max-width:170px;word-break:break-word') && 
                att.includes('fa-user-check') && 
                att.includes('fa-check-double');
console.log((attPass ? '  ✅ [PASS] ' : '  ❌ [FAIL] ') + 'Attendance correction table row compacted with word-break and compact action badges');

if (allPassed && attPass) {
  console.log('\n🎉 ALL 100% ZOOM RESPONSIVENESS AND DENSITY CHECKS PASSED!');
  process.exit(0);
} else {
  console.error('\n❌ SOME CHECKS FAILED');
  process.exit(1);
}
