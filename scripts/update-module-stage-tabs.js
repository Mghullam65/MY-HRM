const fs = require('fs');

function addStageClass(filePath, searchStr, replaceStr) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(searchStr)) {
    content = content.replace(searchStr, replaceStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
  } else {
    console.log('Already updated or pattern not found in ' + filePath);
  }
}

addStageClass('js/helpdesk.js', '<div style="display:flex;gap:6px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;flex-wrap:wrap;border:1px solid var(--border)">', '<div class="module-stage-tabs">');
addStageClass('js/performance.js', '<div style="display:flex;gap:6px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;border:1px solid var(--border);flex-wrap:wrap">', '<div class="module-stage-tabs">');
addStageClass('js/leaves.js', '<div style="display:flex;gap:6px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;border:1px solid var(--border);flex-wrap:wrap">', '<div class="module-stage-tabs">');
addStageClass('js/employees.js', '<div style="display:flex;gap:6px;margin-bottom:20px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;flex-wrap:wrap">', '<div class="module-stage-tabs">');
addStageClass('js/payroll.js', '<div style="display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;flex-wrap:wrap">', '<div class="module-stage-tabs">');
addStageClass('js/attendance.js', '<div style="display:flex;gap:6px;background:var(--surface);padding:4px;border-radius:10px;flex-wrap:wrap">', '<div class="module-stage-tabs">');
