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

// POST candidate application from public landing page
router.post('/apply', (req, res) => {
  try {
    const { applicant, jobId } = req.body;
    if (!applicant) {
      return res.status(400).json({ success: false, message: 'Missing applicant data' });
    }

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

    console.log(`[Store] Received candidate application: ${applicant.name} for Job ID ${jobId}`);
    res.json({ success: true, applicantId: applicant.id, message: 'Application successfully received and recorded' });
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
