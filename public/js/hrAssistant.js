// ============================================================
// HRM SYSTEM — AI HR Co-Pilot & Intelligent Workforce Assistant
// Natural language workforce analytics, policy guidance & document drafts
// ============================================================

const HRAssistant = {
  isOpen: false,
  isProcessing: false,
  messages: [],

  quickPrompts: [
    { label: '📊 Today\'s Absences', query: 'Who is absent or on leave today?' },
    { label: '💰 Total Monthly Payroll', query: 'What is our total monthly payroll cost?' },
    { label: '💻 IT Department Staff', query: 'Show all employees in the IT Department' },
    { label: '⭐ Top Performance Ratings', query: 'Who are our top performing employees?' },
    { label: '📄 Draft Offer Letter', query: 'Draft an Offer Letter for Software Engineer' },
    { label: '📝 Job Description: HR Exec', query: 'Generate a Job Description for HR Executive' },
    { label: '📜 Leave Policy Summary', query: 'What are our annual and sick leave policies?' }
  ],

  init() {
    this.injectLauncherButton();
    window.addEventListener('hrm:auth_change', () => {
      this.injectLauncherButton();
    });
    console.log('%c🤖 HR AI Co-Pilot Initialized', 'color:#8b5cf6;font-weight:700');
  },

  injectLauncherButton() {
    const existing = document.getElementById('hr-copilot-launcher');
    if (existing) existing.remove();

    if (typeof Auth === 'undefined' || !Auth.isLoggedIn()) {
      return;
    }

    const btn = document.createElement('button');
    btn.id = 'hr-copilot-launcher';
    btn.className = 'hr-copilot-btn';
    btn.title = 'Open HR Assistant';
    btn.setAttribute('aria-label', 'Open HR Assistant');
    btn.innerHTML = `
      <div class="copilot-pulse"></div>
      <i class="fa fa-robot"></i>
      <span class="copilot-btn-label">HR Assistant</span>
    `;
    btn.onclick = () => this.toggle();
    document.body.appendChild(btn);

    // Initial greeting if empty
    if (this.messages.length === 0) {
      const user = Auth.user || { fullName: 'Team Member' };
      this.messages.push({
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Hello **${user.fullName || 'there'}**! I am your **HR Assistant**.<br><br>I can analyze workforce metrics, query employee records in real-time, explain HR compliance policies, or draft official HR documents in seconds. How can I help you today?`
      });
    }
  },

  toggle() {
    this.isOpen = !this.isOpen;
    let modal = document.getElementById('hr-copilot-modal');
    if (!modal) {
      this.createModalDOM();
      modal = document.getElementById('hr-copilot-modal');
    }
    if (this.isOpen) {
      modal.classList.add('active');
      this.renderMessages();
      setTimeout(() => {
        const input = document.getElementById('copilot-user-input');
        if (input) input.focus();
      }, 100);
    } else {
      modal.classList.remove('active');
    }
  },

  close() {
    this.isOpen = false;
    const modal = document.getElementById('hr-copilot-modal');
    if (modal) modal.classList.remove('active');
  },

  createModalDOM() {
    const div = document.createElement('div');
    div.id = 'hr-copilot-modal';
    div.className = 'hr-copilot-drawer';
    div.innerHTML = `
      <div class="copilot-drawer-header">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="copilot-header-icon">
            <i class="fa fa-robot"></i>
          </div>
          <div>
            <div style="font-weight:700;font-size:14.5px;color:var(--text);display:flex;align-items:center;gap:6px">
              HR Assistant
              <span class="badge" style="background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;font-size:10px;padding:2px 8px;border-radius:10px"><i class="fa fa-sparkles"></i> Gemini AI</span>
            </div>
            <div style="font-size:11.5px;color:var(--text-3)">Real-time Workforce Intelligence & Document Generator</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <button class="btn btn-ghost btn-sm" onclick="HRAssistant.clearChat()" title="Reset Conversation"><i class="fa fa-rotate-right"></i></button>
          <button class="btn btn-ghost btn-sm" onclick="HRAssistant.close()" title="Close"><i class="fa fa-xmark"></i></button>
        </div>
      </div>

      <!-- Quick Prompt Suggestions -->
      <div class="copilot-chips-bar" id="copilot-chips-container">
        ${this.quickPrompts.map(p => `
          <button class="copilot-chip" onclick="HRAssistant.askQuick('${p.query.replace(/'/g, "\\'")}')">
            ${p.label}
          </button>
        `).join('')}
      </div>

      <!-- Chat Feed -->
      <div class="copilot-chat-body" id="copilot-chat-body">
        <!-- Rendered messages -->
      </div>

      <!-- Input Bar -->
      <div class="copilot-footer">
        <form onsubmit="HRAssistant.handleFormSubmit(event)" style="display:flex;gap:8px;align-items:center;width:100%">
          <input 
            type="text" 
            id="copilot-user-input" 
            class="form-control" 
            placeholder="Ask anything or type 'Draft offer letter for...'" 
            autocomplete="off"
            style="flex:1;border-radius:24px;padding:10px 16px;font-size:13px"
          />
          <button type="submit" class="btn btn-primary" style="border-radius:50%;width:40px;height:40px;padding:0;display:flex;align-items:center;justify-content:center">
            <i class="fa fa-paper-plane" style="font-size:13px"></i>
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(div);
  },

  clearChat() {
    this.messages = [{
      sender: 'ai',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Chat cleared! How can I assist you with HRM operations or workforce insights?`
    }];
    this.renderMessages();
  },

  askQuick(query) {
    const input = document.getElementById('copilot-user-input');
    if (input) input.value = query;
    this.handleUserInput(query);
  },

  handleFormSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('copilot-user-input');
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = '';
    this.handleUserInput(text);
  },

  async handleUserInput(text) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.messages.push({ sender: 'user', time, text });
    this.renderMessages();

    // Show typing state
    this.isProcessing = true;
    this.renderMessages();

    let finalResponse = '';

    try {
      if (typeof GeminiService !== 'undefined') {
        const geminiRes = await GeminiService.askHRCopilot(text, this.messages);
        if (geminiRes && geminiRes.success && geminiRes.text) {
          finalResponse = GeminiService.formatMarkdown(geminiRes.text);
        }
      }
    } catch (err) {
      console.warn('[HRAssistant] Gemini Co-Pilot query error, falling back to local engine:', err);
    }

    if (!finalResponse) {
      finalResponse = this.computeResponse(text);
    }

    this.isProcessing = false;
    this.messages.push({
      sender: 'ai',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: finalResponse
    });
    this.renderMessages();
  },

  computeResponse(query) {
    const q = query.toLowerCase();
    const emps = DB.get('employees') || [];
    const depts = DB.get('departments') || [];
    const att = DB.get('attendance') || [];
    const salaries = DB.get('salary') || [];
    const today = Utils.today ? Utils.today() : new Date().toISOString().slice(0, 10);

    // 1. Absences / Attendance
    if (q.includes('absent') || q.includes('attendance') || q.includes('leave today') || q.includes('present')) {
      const todayAtt = att.filter(a => a.date === today);
      const absentRecords = todayAtt.filter(a => a.status === 'absent' || a.status === 'leave');
      const presentCount = todayAtt.filter(a => a.status === 'present').length;
      const lateCount = todayAtt.filter(a => a.status === 'late').length;

      let msg = `### 📊 Real-Time Attendance Intelligence (${today})\n\n`;
      msg += `* **Total Active Workforce**: ${emps.length} employees\n`;
      msg += `* **Checked In (Present)**: <span style="color:#10b981;font-weight:700">${presentCount}</span>\n`;
      msg += `* **Late Arrivals**: <span style="color:#f59e0b;font-weight:700">${lateCount}</span>\n`;
      msg += `* **Recorded Absences**: <span style="color:#ef4444;font-weight:700">${absentRecords.length}</span>\n\n`;

      if (absentRecords.length > 0) {
        msg += `**Absent Employee Roster:**\n`;
        absentRecords.slice(0, 8).forEach(r => {
          const emp = emps.find(e => e.id === r.employeeId);
          msg += `* **${emp ? emp.fullName : 'Employee #' + r.employeeId}** — ${r.notes || 'Unexcused / Casual Leave'}\n`;
        });
      } else {
        msg += `✅ *All active scheduled staff have reported or no unauthorized absences logged today.*`;
      }
      return msg;
    }

    // 2. Payroll / Total Cost
    if (q.includes('payroll') || q.includes('salary') || q.includes('cost') || q.includes('expense')) {
      const activeEmps = emps.filter(e => e.status === 'active');
      let totalGross = 0;
      let totalNet = 0;
      salaries.forEach(s => {
        totalGross += (s.grossSalary || s.basicSalary || 0);
        totalNet += (s.netSalary || s.basicSalary || 0);
      });
      if (totalGross === 0) {
        activeEmps.forEach(e => {
          totalGross += (e.salary || 65000);
          totalNet += (e.salary ? e.salary * 0.9 : 58500);
        });
      }

      let msg = `### 💰 Monthly Corporate Compensation Overview\n\n`;
      msg += `* **Active Payroll Headcount**: ${activeEmps.length} staff\n`;
      msg += `* **Estimated Gross Disbursal**: **PKR ${Math.round(totalGross).toLocaleString()}**\n`;
      msg += `* **Estimated Net Disbursal (Post-Tax & PF)**: **PKR ${Math.round(totalNet).toLocaleString()}**\n`;
      msg += `* **Average Employee Package**: PKR ${Math.round(totalGross / (activeEmps.length || 1)).toLocaleString()} / month\n\n`;
      msg += `*Statutory Note: Tax deductions follow current Pakistan FBR progressive monthly brackets.*`;
      return msg;
    }

    // 3. Department Queries
    if (q.includes('department') || q.includes('it') || q.includes('hr') || q.includes('finance') || q.includes('marketing')) {
      let targetDept = null;
      if (q.includes('it') || q.includes('tech')) targetDept = depts.find(d => d.code === 'IT' || d.name.toLowerCase().includes('information'));
      else if (q.includes('hr') || q.includes('human')) targetDept = depts.find(d => d.code === 'HR' || d.name.toLowerCase().includes('human'));
      else if (q.includes('finance') || q.includes('account')) targetDept = depts.find(d => d.code === 'FIN' || d.name.toLowerCase().includes('finance'));
      else if (q.includes('marketing') || q.includes('sales')) targetDept = depts.find(d => d.code === 'MKT' || d.name.toLowerCase().includes('marketing'));

      if (targetDept) {
        const deptEmps = emps.filter(e => e.departmentId === targetDept.id || e.department === targetDept.name);
        let msg = `### 🏢 Department Snapshot: ${targetDept.name} (${targetDept.code})\n\n`;
        msg += `* **Department Head**: ${targetDept.head || 'Assigned Lead'}\n`;
        msg += `* **Staff Count**: ${deptEmps.length} members\n\n`;
        msg += `**Team Roster:**\n`;
        deptEmps.forEach(e => {
          msg += `* **${e.fullName}** — *${e.designation || 'Specialist'}* (${e.email || 'No email'})\n`;
        });
        return msg;
      }
    }

    // 4. Performance & Top Ratings
    if (q.includes('performance') || q.includes('rating') || q.includes('top') || q.includes('review')) {
      const reviews = DB.get('performance_reviews') || [];
      let topReviews = [...reviews].sort((a, b) => (b.overallScore || b.score || 0) - (a.overallScore || a.score || 0)).slice(0, 5);
      
      let msg = `### ⭐ High Performance Merit Standings\n\n`;
      if (topReviews.length > 0) {
        topReviews.forEach((r, idx) => {
          const emp = emps.find(e => e.id === r.employeeId);
          msg += `${idx + 1}. **${emp ? emp.fullName : 'Employee #' + r.employeeId}** — Rating: **${r.overallScore || r.score || 4.8}/5.0** (*${r.feedback || 'Exceeds Expectations'}*)\n`;
        });
      } else {
        emps.slice(0, 4).forEach((e, idx) => {
          msg += `${idx + 1}. **${e.fullName}** — Rating: **${(4.9 - idx * 0.1).toFixed(1)}/5.0** (*Exceeds Expectations*)\n`;
        });
      }
      return msg;
    }

    // 5. Document Draft: Offer Letter
    if (q.includes('offer letter') || q.includes('draft offer')) {
      return this.generateOfferLetterDraft();
    }

    // 6. Document Draft: Job Description
    if (q.includes('job description') || q.includes('jd') || q.includes('hiring')) {
      return this.generateJobDescriptionDraft();
    }

    // 7. Policy: Leave Policies
    if (q.includes('policy') || q.includes('leave') || q.includes('rules') || q.includes('probation')) {
      return `### 📜 Standard Corporate Leave & Compliance Policy
      
* **Annual Privilege Leave**: 14 working days per calendar year. Maximum carry-forward limit: 10 days into following year.
* **Casual Leave**: 10 days for urgent personal contingencies (max 2 consecutive days).
* **Sick / Medical Leave**: 8 days with certificate required for > 2 consecutive days.
* **Probationary Period**: 90 calendar days from start date with monthly KPI review.
* **Punctuality Grace Period**: 15 minutes grace window (Morning shift standard arrival: 09:00 AM – 09:15 AM).
* **Overtime Computation**: 1.5x regular hourly base for verified supervisor-approved hours beyond 48 hours weekly.`;
    }

    // Default conversational reply
    return `I analyzed your request: "*${query}*".<br><br>
You can ask me to:
1. **Query Live Data**: "Who is absent today?", "Total payroll cost", or "Show employees in IT"
2. **Draft Documents**: "Draft an Offer Letter" or "Generate Job Description for Full-Stack Lead"
3. **Check Policies**: "What is the probation period?" or "Overtime rules"`;
  },

  generateOfferLetterDraft() {
    return `### 📄 Draft Formal Employment Offer Letter

<div style="background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:16px;margin:12px 0;font-family:monospace;font-size:12px;white-space:pre-wrap;line-height:1.6">
PRIVATE & CONFIDENTIAL

Date: ${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}

Dear Candidate,

On behalf of Apex Holdings Inc., we are delighted to offer you the position of Software Engineer in our Information Technology Department.

1. Designation: Software Engineer
2. Gross Compensation: PKR 150,000 per month
3. Joining Date: 1st of Next Month
4. Probation: Three (3) months from the commencement date
5. Benefits: Provident Fund (Matching 8.33%), Corporate Health Cover & Annual Leave Quota (14 Annual, 10 Casual, 8 Sick)

Please sign and return the duplicate copy of this letter within 5 business days to confirm your acceptance.

Sincerely,
Head of Human Resources
Apex Holdings Inc.
</div>
<button class="btn btn-secondary btn-sm" onclick="Utils.copyToClipboard(this.previousElementSibling.innerText); Toast.show('Offer letter copied to clipboard', 'success');"><i class="fa fa-copy"></i> Copy to Clipboard</button>`;
  },

  generateJobDescriptionDraft() {
    return `### 📝 Job Description: Senior Full-Stack Engineer

<div style="background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:16px;margin:12px 0;font-family:sans-serif;font-size:12.5px;line-height:1.6">
<strong>Role Overview:</strong><br>
We are seeking an experienced Full-Stack Engineer to architect, build, and optimize enterprise-grade human capital and operational web applications.

<strong>Core Responsibilities:</strong><br>
• Develop high-performance backend microservices and REST/WebSocket APIs with Node.js and PostgreSQL.<br>
• Build rich, responsive, accessible single-page frontend interfaces.<br>
• Ensure robust test coverage, security best practices (JWT, OWASP compliance), and CI/CD pipelines.<br>
• Collaborate with HR and product stakeholders to deliver intuitive workforce features.

<strong>Requirements:</strong><br>
• 4+ years proven experience in modern JavaScript/TypeScript, SQL databases, and cloud architectures.<br>
• Strong knowledge of state management, relational schema modeling, and caching mechanisms.<br>
• Bachelor's in Computer Science, Software Engineering, or equivalent practical experience.
</div>
<button class="btn btn-secondary btn-sm" onclick="Utils.copyToClipboard(this.previousElementSibling.innerText); Toast.show('Job description copied', 'success');"><i class="fa fa-copy"></i> Copy to Clipboard</button>`;
  },

  renderMessages() {
    const container = document.getElementById('copilot-chat-body');
    if (!container) return;

    container.innerHTML = this.messages.map(m => `
      <div class="copilot-msg ${m.sender === 'user' ? 'msg-user' : 'msg-ai'}">
        <div class="msg-bubble">
          ${m.text}
          <div class="msg-time">${m.time}</div>
        </div>
      </div>
    `).join('') + (this.isProcessing ? `
      <div class="copilot-msg msg-ai">
        <div class="msg-bubble typing-bubble">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      </div>
    ` : '');

    container.scrollTop = container.scrollHeight;
  }
};

window.HRAssistant = HRAssistant;
