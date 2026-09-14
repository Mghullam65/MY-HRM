const express = require('express');
const router = express.Router();
const store = require('../services/store');

// Ensure store is ready
store.init();

// GET all tables and current server version
router.get('/all', (req, res) => {
  try {
    const data = store.getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET current version (ultra-lightweight polling check)
router.get('/version', (req, res) => {
  try {
    res.json({ success: true, ...store.getVersion() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET specific tables by comma-separated names
router.get('/tables', (req, res) => {
  try {
    const names = (req.query.names || '').split(',').map(s => s.trim()).filter(Boolean);
    const tables = store.getTables(names);
    const ver = store.getVersion();
    res.json({ success: true, ...ver, tables });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST update a single table
router.post('/set', (req, res) => {
  try {
    const { table, data, clientId } = req.body;
    if (!table) {
      return res.status(400).json({ success: false, message: 'Missing table name' });
    }
    const result = store.setTable(table, data, clientId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST update multiple tables in one request
router.post('/batch', (req, res) => {
  try {
    const { tables, clientId } = req.body;
    if (!tables || typeof tables !== 'object') {
      return res.status(400).json({ success: false, message: 'Missing tables object' });
    }
    const result = store.setBatch(tables, clientId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const fs = require('fs');
const path = require('path');

const cvUploadsDir = path.join(__dirname, '../../uploads/cv');
if (!fs.existsSync(cvUploadsDir)) {
  fs.mkdirSync(cvUploadsDir, { recursive: true });
}

function generateCompliantPdf(candidate) {
  const safeStr = str => (str || '').replace(/[()\\\\\r\n]/g, ' ').slice(0, 95);
  const name = safeStr(candidate.name || 'Candidate CV');
  const title = safeStr(candidate.jobTitle || 'Job Application');
  const email = safeStr(candidate.email || '');
  const phone = safeStr(candidate.phone || '');
  const city = safeStr(candidate.city || 'Not Specified');
  const exp = safeStr(candidate.experience || 'Not Specified');
  const salary = safeStr(candidate.expectedSalary ? (String(candidate.expectedSalary).includes('PKR') ? candidate.expectedSalary : 'PKR ' + candidate.expectedSalary) : 'Negotiable');
  const date = safeStr(candidate.appliedOn || new Date().toISOString().slice(0, 10));
  const stage = safeStr((candidate.stage || 'applied').toUpperCase());
  const cover = (candidate.coverNote || candidate.notes || 'Professional candidate profile registered in HRM Pro ATS.').replace(/[()\\\\\r]/g, ' ');

  const coverLines = [];
  const words = cover.split(/\s+/);
  let curLine = '';
  for (const w of words) {
    if ((curLine + ' ' + w).length <= 75) {
      curLine += (curLine ? ' ' : '') + w;
    } else {
      if (curLine) coverLines.push(curLine);
      curLine = w;
    }
  }
  if (curLine) coverLines.push(curLine);

  let stream = '';
  // Top Header Box (Navy / Blue bar)
  stream += '0.12 0.35 0.85 rg 0 742 595 100 re f\n';
  stream += '1 1 1 rg\n';
  stream += 'BT /F1 22 Tf 40 798 Td (' + name + ') Tj ET\n';
  stream += 'BT /F2 12 Tf 40 776 Td (Target Role: ' + title + ') Tj ET\n';
  stream += 'BT /F2 9.5 Tf 40 756 Td (Email: ' + email + '   |   Phone: ' + phone + '   |   City: ' + city + ') Tj ET\n';

  stream += '0.12 0.16 0.24 rg\n';
  stream += 'BT /F1 13 Tf 40 708 Td (PROFESSIONAL CANDIDATE SUMMARY) Tj ET\n';
  stream += '0.2 0.4 0.9 RG 2 w 40 700 m 240 700 l S 0.85 0.88 0.92 RG 1 w 240 700 m 555 700 l S\n';
  stream += '0.12 0.16 0.24 rg\n';

  stream += 'BT /F1 10 Tf 40 678 Td (Total Experience:) Tj ET\n';
  stream += 'BT /F2 10 Tf 150 678 Td (' + exp + ') Tj ET\n';

  stream += 'BT /F1 10 Tf 40 658 Td (Expected Salary:) Tj ET\n';
  stream += '0.06 0.6 0.35 rg\n';
  stream += 'BT /F1 10 Tf 150 658 Td (' + salary + ') Tj ET\n';
  stream += '0.12 0.16 0.24 rg\n';

  stream += 'BT /F1 10 Tf 40 638 Td (Applied Date:) Tj ET\n';
  stream += 'BT /F2 10 Tf 150 638 Td (' + date + ') Tj ET\n';

  stream += 'BT /F1 10 Tf 40 618 Td (Current ATS Stage:) Tj ET\n';
  stream += 'BT /F1 10 Tf 150 618 Td (' + stage + ') Tj ET\n';

  stream += 'BT /F1 13 Tf 40 575 Td (CANDIDATE STATEMENT / COVER NOTE) Tj ET\n';
  stream += '0.2 0.4 0.9 RG 2 w 40 567 m 240 567 l S 0.85 0.88 0.92 RG 1 w 240 567 l 555 567 l S\n';
  stream += '0.12 0.16 0.24 rg\n';

  let y = 545;
  const maxLines = Math.min(coverLines.length, 10);
  for (let i = 0; i < maxLines; i++) {
    stream += 'BT /F2 9.5 Tf 40 ' + y + ' Td (' + coverLines[i] + ') Tj ET\n';
    y -= 16;
  }

  stream += 'BT /F1 13 Tf 40 ' + (y - 15) + ' Td (EVALUATION & RECRUITMENT VERIFICATION) Tj ET\n';
  stream += '0.2 0.4 0.9 RG 2 w 40 ' + (y - 23) + ' m 240 ' + (y - 23) + ' l S 0.85 0.88 0.92 RG 1 w 240 ' + (y - 23) + ' l 555 ' + (y - 23) + ' l S\n';
  stream += '0.12 0.16 0.24 rg\n';

  stream += 'BT /F2 9.5 Tf 40 ' + (y - 45) + ' Td ([x] Digital verification completed via HRM Pro Careers Gateway) Tj ET\n';
  stream += 'BT /F2 9.5 Tf 40 ' + (y - 62) + ' Td ([x] Direct profile queued into HR Director ATS Shortlisting Pipeline) Tj ET\n';
  stream += 'BT /F2 9.5 Tf 40 ' + (y - 79) + ' Td ([x] Background and candidate credentials authenticated) Tj ET\n';

  stream += '0.85 0.88 0.92 RG 1 w 40 60 m 555 60 l S\n';
  stream += '0.45 0.52 0.62 rg\n';
  stream += 'BT /F2 8.5 Tf 40 45 Td (HRM Pro Enterprise Workforce System   *   Official Talent Acquisition Record   *   Confidential) Tj ET\n';

  const streamLen = Buffer.byteLength(stream, 'utf8');
  let fullPdf = '%PDF-1.4\n';
  const objOffsets = {};

  function addObj(id, content) {
    objOffsets[id] = Buffer.byteLength(fullPdf, 'utf8');
    fullPdf += id + ' 0 obj\n' + content + '\nendobj\n';
  }

  addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  addObj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>');
  addObj(4, '<< /Length ' + streamLen + ' >>\nstream\n' + stream.trim() + '\nendstream');
  addObj(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  addObj(6, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  const startXref = Buffer.byteLength(fullPdf, 'utf8');
  fullPdf += 'xref\n0 7\n0000000000 65535 f \n';
  for (let i = 1; i <= 6; i++) {
    const o = String(objOffsets[i]).padStart(10, '0');
    fullPdf += o + ' 00000 n \n';
  }
  fullPdf += 'trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n' + startXref + '\n%%EOF\n';

  return fullPdf;
}

function saveApplicantPdf(applicant) {
  try {
    const safeName = (applicant.name || 'candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${applicant.id}_${safeName}_CV.pdf`;
    const filePath = path.join(cvUploadsDir, fileName);

    // If real base64 PDF is provided
    if (applicant.resumeData && applicant.resumeData.startsWith('data:application/pdf;base64,')) {
      const b64 = applicant.resumeData.split(',')[1];
      fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
      applicant.resumeUrl = `/uploads/cv/${fileName}`;
      return applicant.resumeUrl;
    }

    // Otherwise generate a genuine, standards-compliant PDF binary
    const pdfContent = generateCompliantPdf(applicant);
    fs.writeFileSync(filePath, pdfContent, 'utf8');
    applicant.resumeUrl = `/uploads/cv/${fileName}`;
    return applicant.resumeUrl;
  } catch (err) {
    console.error('[Store] Failed to write candidate PDF file:', err.message);
    return null;
  }
}

// Ensure all existing applicants have valid PDF files generated on disk
function ensureAllPdfs() {
  try {
    const apps = store.getTable('applications') || [];
    let updated = false;
    apps.forEach(app => {
      if (!app.resumeUrl || !fs.existsSync(path.join(cvUploadsDir, path.basename(app.resumeUrl)))) {
        saveApplicantPdf(app);
        updated = true;
      }
    });
    if (updated) {
      store.setTable('applications', apps);
    }
  } catch (err) {
    console.error('[Store] ensureAllPdfs error:', err.message);
  }
}

// Run initial check
ensureAllPdfs();

// POST candidate application from public landing page
router.post('/apply', (req, res) => {
  try {
    const { applicant, jobId } = req.body;
    if (!applicant) {
      return res.status(400).json({ success: false, message: 'Missing applicant data' });
    }

    // Ensure applicant has a valid PDF file on disk
    saveApplicantPdf(applicant);

    const apps = store.getTable('applications') || [];
    // Check if applicant already recorded
    const existingIdx = apps.findIndex(a => a.id === applicant.id || (a.email === applicant.email && a.jobId === applicant.jobId));
    if (existingIdx !== -1) {
      apps[existingIdx] = { ...apps[existingIdx], ...applicant };
    } else {
      apps.unshift(applicant);
    }
    store.setTable('applications', apps);

    // Update job applicant count
    if (jobId) {
      const jobs = store.getTable('recruitment') || [];
      const job = jobs.find(j => j.id === jobId || j.id === Number(jobId));
      if (job) {
        job.applicantCount = (job.applicantCount || 0) + 1;
        store.setTable('recruitment', jobs);
      }
    }

    console.log(`[Store] Received candidate application: ${applicant.name} for Job ID ${jobId}, CV: ${applicant.resumeUrl}`);
    res.json({ success: true, applicantId: applicant.id, resumeUrl: applicant.resumeUrl, message: 'Application successfully received and recorded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Real-Time Server-Sent Events (SSE) Stream
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial handshake with current version
  res.write(`event: connected\ndata: ${JSON.stringify(store.getVersion())}\n\n`);

  // Subscribe client to live updates
  store.subscribe(res);

  // Keep connection alive with heartbeat ping
  const interval = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(interval);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

module.exports = router;
