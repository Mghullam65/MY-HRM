const fs = require('fs');
const path = require('path');

console.log('=== Updating js/helpdesk.js to 4 Clean Service Stages ===');
const helpdeskPath = path.join(__dirname, '../js/helpdesk.js');
let code = fs.readFileSync(helpdeskPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add currentStage, getActiveStage, isTabActive, switchStage to Helpdesk object
const stageHelpers = `
  currentStage: 'tickets', // 'tickets' | 'sla_queue' | 'grievance' | 'knowledge_base'

  getActiveStage() {
    if (['tickets', 'support'].includes(this.currentStage)) return 'tickets';
    if (['sla_queue', 'escalations', 'triage'].includes(this.currentStage)) return 'sla_queue';
    if (['grievance', 'whistleblower'].includes(this.currentStage)) return 'grievance';
    if (['knowledge_base', 'faq', 'kb'].includes(this.currentStage)) return 'knowledge_base';
    return 'tickets';
  },

  isTabActive(tabId) {
    return this.getActiveStage() === tabId;
  },

  switchStage(stage) {
    this.currentStage = stage;
    if (stage === 'grievance') {
      this.activeView = 'grievance';
      this.filterCategory = 'confidential_grievance';
    } else {
      this.activeView = 'tickets';
      this.filterCategory = 'all';
    }
    this.render();
  },
`;

code = code.replace(
  `const Helpdesk = {\n  activeView: 'tickets', // 'tickets' or 'grievance'`,
  `const Helpdesk = {\n  activeView: 'tickets',\n${stageHelpers}`
);

// 2. Replace the 2-button navigation in render() with 4 Clean Service Stage Tabs
const oldNavBlock = `      <!-- Navigation Views Tabs -->
      <div style="display:flex;gap:6px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;flex-wrap:wrap">
        <button class="tab-toggle-btn \${this.activeView==='tickets'?'active':''}" onclick="Helpdesk.switchView('tickets')">
          <i class="fa fa-ticket" style="margin-right:6px"></i>Support Tickets &amp; IT Service
        </button>

        <button class="tab-toggle-btn \${this.activeView==='grievance'?'active':''}" onclick="Helpdesk.switchView('grievance')">
          <i class="fa fa-shield-heart" style="margin-right:6px"></i>Ethics &amp; Workplace Grievances
          \${confidentialCount > 0 ? \`<span class="badge badge-danger" style="margin-left:6px;font-size:10px">\${confidentialCount} Confidential</span>\` : ''}
        </button>
      </div>`;

const newNavBlock = `      <!-- 4 Clean Service Stage Tabs -->
      <div style="display:flex;gap:6px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;flex-wrap:wrap;border:1px solid var(--border)">
        <button class="tab-toggle-btn \${this.isTabActive('tickets')?'active':''}" onclick="Helpdesk.switchStage('tickets')">
          <i class="fa fa-ticket" style="margin-right:6px"></i>Active Support Tickets
          <span class="badge badge-primary" style="margin-left:6px;font-size:10px;padding:2px 6px">\${openCount}</span>
        </button>

        <button class="tab-toggle-btn \${this.isTabActive('sla_queue')?'active':''}" onclick="Helpdesk.switchStage('sla_queue')">
          <i class="fa fa-stopwatch" style="margin-right:6px"></i>SLA Queue &amp; Escalations
          \${urgentCount > 0 ? \`<span class="badge badge-warning" style="margin-left:6px;font-size:10px;padding:2px 6px">\${urgentCount} Urgent</span>\` : ''}
        </button>

        <button class="tab-toggle-btn \${this.isTabActive('grievance')?'active':''}" onclick="Helpdesk.switchStage('grievance')">
          <i class="fa fa-shield-halved" style="margin-right:6px"></i>Ethics &amp; Grievance Hub
          \${confidentialCount > 0 ? \`<span class="badge badge-danger" style="margin-left:6px;font-size:10px;padding:2px 6px">\${confidentialCount}</span>\` : ''}
        </button>

        <button class="tab-toggle-btn \${this.isTabActive('knowledge_base')?'active':''}" onclick="Helpdesk.switchStage('knowledge_base')">
          <i class="fa fa-book-bookmark" style="margin-right:6px"></i>Knowledge Base &amp; FAQ
        </button>
      </div>`;

code = code.replace(oldNavBlock, newNavBlock);

// 3. In renderTable(), handle knowledge_base stage or sla_queue stage
const oldRenderTableHead = `  renderTable() {
    const wrap = document.getElementById('helpdesk-table-wrap');
    if (!wrap) return;

    const role = Auth.role;
    const isEmp = role === 'employee';
    const isAdmin = role === 'superadmin' || role === 'hr_manager';
    const myEmpId = Auth.employee?.id;
    let tickets = DB.get('helpdesk_tickets') || [];
    const allEmps = DB.get('employees') || [];`;

const newRenderTableHead = `  renderTable() {
    const wrap = document.getElementById('helpdesk-table-wrap');
    if (!wrap) return;

    const stage = this.getActiveStage();
    if (stage === 'knowledge_base') {
      this.renderKnowledgeBase(wrap);
      return;
    }

    const role = Auth.role;
    const isEmp = role === 'employee';
    const isAdmin = role === 'superadmin' || role === 'hr_manager';
    const myEmpId = Auth.employee?.id;
    let tickets = DB.get('helpdesk_tickets') || [];
    const allEmps = DB.get('employees') || [];

    // Filter by stage
    if (stage === 'sla_queue') {
      tickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
      tickets.sort((a, b) => (a.priority === 'urgent' ? -1 : 1));
    }`;

code = code.replace(oldRenderTableHead, newRenderTableHead);

// 4. Add renderKnowledgeBase method
const kbMethod = `
  renderKnowledgeBase(container) {
    const faqs = [
      {
        q: 'How do I reset my Windows Active Directory or Email password?',
        cat: 'IT & Security',
        icon: 'fa-key',
        a: 'Submit a ticket under "IT & Infrastructure" or use the self-service AD reset portal. Temporary passwords expire within 24 hours.'
      },
      {
        q: 'What is the cutoff date for submitting expense reimbursement claims?',
        cat: 'Finance & Payroll',
        icon: 'fa-receipt',
        a: 'All reimbursement claims with scanned receipts must be submitted by the 20th of each month for inclusion in that month\\'s salary disbursal.'
      },
      {
        q: 'How are annual leave carry-forward balances calculated?',
        cat: 'HR Policies',
        icon: 'fa-calendar-days',
        a: 'Up to 10 unused statutory leaves may be carried forward into the new fiscal year. Balances above 10 are processed for encashment in December.'
      },
      {
        q: 'Where do I collect my biometric access card or replace a damaged card?',
        cat: 'Facilities',
        icon: 'fa-id-card',
        a: 'Visit the Facilities Desk on Ground Floor with your Employee ID number. Replacement cards require department manager endorsement.'
      },
      {
        q: 'How do I submit an anonymous whistleblower report?',
        cat: 'Ethics & Compliance',
        icon: 'fa-shield-halved',
        a: 'Click "File Confidential Grievance" in the Ethics Hub. You will receive an encrypted tracking token; no personal user metadata is recorded.'
      },
      {
        q: 'How do I obtain an official Tax Withholding Certificate (FBR)?',
        cat: 'Taxation',
        icon: 'fa-file-invoice-dollar',
        a: 'Annual FBR income tax deduction certificates can be downloaded directly from the Reports module or requested through the Payroll desk.'
      }
    ];

    container.innerHTML = \`
      <div class="animate-fade-in">
        <div style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(6,182,212,0.06));border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">
          <div>
            <h3 style="margin:0 0 6px 0;font-size:18px;font-weight:800;color:var(--text)">Employee Knowledge Base &amp; Resolution Archives</h3>
            <p style="margin:0;font-size:13px;color:var(--text-3)">Instant answers to company policies, IT setup instructions, and payroll inquiries.</p>
          </div>
          <button class="btn btn-primary btn-sm" onclick="Helpdesk.showCreateModal()">
            <i class="fa fa-plus"></i> Can't find an answer? Open Ticket
          </button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px">
          \${faqs.map(f => \`
            <div class="card" style="padding:18px;display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                  <span class="badge badge-secondary" style="font-size:11px;font-weight:700">
                    <i class="fa \${f.icon}" style="margin-right:4px"></i>\${f.cat}
                  </span>
                  <span style="font-size:11px;color:var(--text-muted)"><i class="fa fa-circle-check text-success"></i> Verified</span>
                </div>
                <h4 style="font-size:14px;font-weight:700;color:var(--text);margin:0 0 8px 0;line-height:1.4">\${f.q}</h4>
                <p style="font-size:12.5px;color:var(--text-2);line-height:1.6;margin:0">\${f.a}</p>
              </div>
            </div>
          \`).join('')}
        </div>
      </div>
    \`;
  },
`;

code += kbMethod;

fs.writeFileSync(helpdeskPath, code, 'utf8');
console.log('✅ Successfully patched js/helpdesk.js to 4 clean stages!');
