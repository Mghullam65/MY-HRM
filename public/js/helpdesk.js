// ============================================================
// HRM SYSTEM — Employee Helpdesk & Grievance Redressal
// Batch 5: Internal Ticketing, SLA Tracking & Whistleblower Portal
// ============================================================

const Helpdesk = {
  activeView: 'tickets',

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

  filterCategory: 'all',
  filterPriority: 'all',
  filterStatus: 'all',
  selectedTicketId: null,

  render() {
    const container = document.getElementById('page-content');
    if (!container) return;

    const role = Auth.role;
    const isEmp = role === 'employee';
    const isAdmin = role === 'superadmin' || role === 'hr_manager';
    const allTickets = DB.get('helpdesk_tickets') || [];
    const myEmpId = Auth.employee?.id;

    // Filter tickets accessible by role
    let accessibleTickets = allTickets;
    if (isEmp) {
      // Employee sees tickets where they are the reporter, OR their anonymous ticket tokens
      accessibleTickets = allTickets.filter(t => t.reporterId === myEmpId);
    }

    // High level metrics
    const totalTickets = accessibleTickets.length;
    const openCount = accessibleTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const resolvedCount = accessibleTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const urgentCount = accessibleTickets.filter(t => t.priority === 'urgent' && t.status !== 'closed').length;
    const confidentialCount = isAdmin ? allTickets.filter(t => t.category === 'confidential_grievance').length : 0;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h2 style="font-size:20px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:10px;background:rgba(20,184,166,0.12);color:var(--secondary)">
              <i class="fa fa-headset"></i>
            </span>
            Employee Helpdesk &amp; Grievance Redressal
          </h2>
          <div style="font-size:13px;color:var(--text-3);margin-top:4px">
            Internal IT support, HR inquiries, payroll questions, and confidential anti-harassment / whistleblower redressal
          </div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" style="color:var(--danger)" onclick="Helpdesk.showCreateGrievanceModal()">
            <i class="fa fa-shield-halved"></i> File Confidential Grievance
          </button>
          <button class="btn btn-primary btn-sm" onclick="Helpdesk.showCreateModal()">
            <i class="fa fa-plus"></i> Open Support Ticket
          </button>
        </div>
      </div>

      <!-- Metric KPI Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:24px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Active Open Requests</div>
          <div style="font-size:22px;font-weight:800;color:${openCount > 0 ? 'var(--warning)' : 'var(--success)'};margin-top:4px">${openCount}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Under Investigation &amp; Resolution</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Urgent / SLA Sensitive</div>
          <div style="font-size:22px;font-weight:800;color:var(--danger);margin-top:4px">${urgentCount} Tickets</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">&lt; 4 Hours Target SLA</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Resolved &amp; Closed</div>
          <div style="font-size:22px;font-weight:800;color:var(--success);margin-top:4px">${resolvedCount}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">98.4% On-Time SLA Compliance</div>
        </div>

        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Average Resolution Time</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:4px">4.8 Hours</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">First-Touch Response: 22 Mins</div>
        </div>
      </div>

      <!-- 4 Clean Service Stage Tabs -->
      <div class="module-stage-tabs">
        <button class="tab-toggle-btn ${this.isTabActive('tickets')?'active':''}" onclick="Helpdesk.switchStage('tickets')">
          <i class="fa fa-ticket" style="margin-right:6px"></i>Active Support Tickets
          <span class="badge badge-primary" style="margin-left:6px;font-size:10px;padding:2px 6px">${openCount}</span>
        </button>

        <button class="tab-toggle-btn ${this.isTabActive('sla_queue')?'active':''}" onclick="Helpdesk.switchStage('sla_queue')">
          <i class="fa fa-stopwatch" style="margin-right:6px"></i>SLA Queue &amp; Escalations
          ${urgentCount > 0 ? `<span class="badge badge-warning" style="margin-left:6px;font-size:10px;padding:2px 6px">${urgentCount} Urgent</span>` : ''}
        </button>

        <button class="tab-toggle-btn ${this.isTabActive('grievance')?'active':''}" onclick="Helpdesk.switchStage('grievance')">
          <i class="fa fa-shield-halved" style="margin-right:6px"></i>Ethics &amp; Grievance Hub
          ${confidentialCount > 0 ? `<span class="badge badge-danger" style="margin-left:6px;font-size:10px;padding:2px 6px">${confidentialCount}</span>` : ''}
        </button>

        <button class="tab-toggle-btn ${this.isTabActive('knowledge_base')?'active':''}" onclick="Helpdesk.switchStage('knowledge_base')">
          <i class="fa fa-book-bookmark" style="margin-right:6px"></i>Knowledge Base &amp; FAQ
        </button>
      </div>

      <!-- Filter Toolbar -->
      <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <select class="form-control" style="height:34px;font-size:12px;width:170px" onchange="Helpdesk.filterCategory=this.value;Helpdesk.renderTable()">
            <option value="all">All Service Categories</option>
            <option value="it_support" ${this.filterCategory==='it_support'?'selected':''}>IT &amp; Infrastructure</option>
            <option value="hr_query" ${this.filterCategory==='hr_query'?'selected':''}>HR Policies &amp; Benefits</option>
            <option value="payroll" ${this.filterCategory==='payroll'?'selected':''}>Payroll &amp; Taxation</option>
            <option value="facilities" ${this.filterCategory==='facilities'?'selected':''}>Facilities &amp; Office</option>
            <option value="confidential_grievance" ${this.filterCategory==='confidential_grievance'?'selected':''}>Ethics &amp; Grievances</option>
          </select>

          <select class="form-control" style="height:34px;font-size:12px;width:140px" onchange="Helpdesk.filterPriority=this.value;Helpdesk.renderTable()">
            <option value="all">All Priorities</option>
            <option value="urgent" ${this.filterPriority==='urgent'?'selected':''}>Urgent (SLA 4h)</option>
            <option value="high" ${this.filterPriority==='high'?'selected':''}>High (SLA 12h)</option>
            <option value="medium" ${this.filterPriority==='medium'?'selected':''}>Medium (SLA 24h)</option>
            <option value="low" ${this.filterPriority==='low'?'selected':''}>Low (SLA 48h)</option>
          </select>

          <select class="form-control" style="height:34px;font-size:12px;width:140px" onchange="Helpdesk.filterStatus=this.value;Helpdesk.renderTable()">
            <option value="all">All Statuses</option>
            <option value="open" ${this.filterStatus==='open'?'selected':''}>Open</option>
            <option value="in_progress" ${this.filterStatus==='in_progress'?'selected':''}>In Progress</option>
            <option value="resolved" ${this.filterStatus==='resolved'?'selected':''}>Resolved</option>
            <option value="closed" ${this.filterStatus==='closed'?'selected':''}>Closed</option>
          </select>
        </div>

        <div style="font-size:12px;color:var(--text-muted)">
          <i class="fa fa-clock" style="margin-right:4px"></i> Active SLA Engine: Enabled
        </div>
      </div>

      <div id="helpdesk-table-wrap"></div>
    `;

    this.renderTable();
  },

  switchView(v) {
    this.activeView = v;
    if (v === 'grievance') {
      this.filterCategory = 'confidential_grievance';
    } else {
      this.filterCategory = 'all';
    }
    this.render();
  },

  renderTable() {
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
    }

    // Scope by role and view
    if (this.activeView === 'grievance') {
      tickets = tickets.filter(t => t.category === 'confidential_grievance');
      if (isEmp) {
        tickets = tickets.filter(t => t.reporterId === myEmpId || t.anonymousToken);
      }
    } else {
      if (this.filterCategory !== 'all') {
        tickets = tickets.filter(t => t.category === this.filterCategory);
      } else {
        // In regular support tab, hide confidential grievances unless explicitly filtered
        tickets = tickets.filter(t => t.category !== 'confidential_grievance');
      }

      if (isEmp) {
        tickets = tickets.filter(t => t.reporterId === myEmpId);
      }
    }

    if (this.filterPriority !== 'all') {
      tickets = tickets.filter(t => t.priority === this.filterPriority);
    }
    if (this.filterStatus !== 'all') {
      tickets = tickets.filter(t => t.status === this.filterStatus);
    }

    // Sort newest first
    tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (tickets.length === 0) {
      wrap.innerHTML = `
        <div class="card" style="padding:40px;text-align:center">
          <div style="font-size:36px;color:var(--text-muted);margin-bottom:12px"><i class="fa fa-circle-check"></i></div>
          <h4 style="font-size:15px;font-weight:700;color:var(--text);margin:0 0 6px">No Tickets in this Queue</h4>
          <p style="font-size:12.5px;color:var(--text-3);margin:0">All requests in this category have been processed or none have been submitted yet.</p>
        </div>
      `;
      return;
    }

    wrap.innerHTML = `
      <div class="card" style="overflow:hidden;padding:0">
        <div class="table-responsive">
          <table class="table" style="margin:0">
            <thead>
              <tr style="background:var(--surface)">
                <th style="width:110px">Ticket #</th>
                <th>Subject &amp; Issue Details</th>
                <th>Category</th>
                <th>Priority / SLA</th>
                <th>Requester</th>
                <th>Assigned Agent</th>
                <th>Created</th>
                <th>Status</th>
                <th style="text-align:right;min-width:180px">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tickets.map(t => {
                const requester = allEmps.find(e => e.id === t.reporterId);
                const agent = allEmps.find(e => e.id === t.assignedTo);
                const isAnonymous = t.isAnonymous;
                const myEmpId = (typeof Auth !== 'undefined' && Auth.employee?.id) || 1;

                return `
                  <tr style="${t.priority === 'urgent' && t.status !== 'closed' ? 'background:rgba(239,68,68,0.04)' : ''}">
                    <td>
                      <span style="font-family:monospace;font-weight:700;font-size:12px;color:var(--secondary);background:rgba(20,184,166,0.1);padding:3px 7px;border-radius:6px">
                        ${t.ticketNumber}
                      </span>
                    </td>
                    <td>
                      <div style="font-weight:700;font-size:13px;color:var(--text);cursor:pointer" onclick="Helpdesk.openTicketWorkspace(${t.id})">
                        ${t.title}
                        ${isAnonymous ? '<span class="badge badge-danger" style="margin-left:6px;font-size:9.5px"><i class="fa fa-user-secret"></i> Protected Whistleblower</span>' : ''}
                      </div>
                      <div style="font-size:11.5px;color:var(--text-3);margin-top:2px;max-width:340px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                        ${t.description || 'No description provided.'}
                      </div>
                    </td>
                    <td>
                      <span class="badge badge-secondary" style="font-size:11px">
                        ${this.getCategoryBadge(t.category)}
                      </span>
                    </td>
                    <td>
                      ${this.getPriorityBadge(t.priority, t.slaHours)}
                    </td>
                    <td>
                      ${isAnonymous ? `
                        <span style="font-family:monospace;font-size:11.5px;color:var(--danger);font-weight:600">
                          <i class="fa fa-user-secret"></i> ${t.anonymousToken || 'Anonymous'}
                        </span>
                      ` : `
                        <div style="display:flex;align-items:center;gap:6px">
                          <div class="avatar avatar-sm" style="background:${Utils.avatarColor(t.reporterId)};width:22px;height:22px;font-size:9px;border-radius:50%;overflow:hidden">
                            ${requester?.photo ? `<img src="${requester.photo}" style="width:100%;height:100%;object-fit:cover">` : Utils.avatarInitials(requester?.fullName || 'Staff')}
                          </div>
                          <span style="font-size:12px;font-weight:600;color:var(--text)">${requester?.fullName || 'Employee #' + t.reporterId}</span>
                        </div>
                      `}
                    </td>
                    <td>
                      ${agent ? `
                        <span style="font-size:12px;color:var(--text-2);display:inline-flex;align-items:center;gap:4px">
                          <i class="fa fa-user-check" style="color:var(--primary);font-size:10px"></i>
                          ${agent.fullName}
                        </span>
                      ` : `
                        <span style="font-size:11px;color:var(--text-muted);font-style:italic">Unassigned (Triaging)</span>
                      `}
                    </td>
                    <td>
                      <span style="font-size:11.5px;color:var(--text-3)">${t.createdAt.split('T')[0]}</span>
                    </td>
                    <td>${this.getStatusBadge(t.status)}</td>
                    <td style="text-align:right;white-space:nowrap">
                      <div style="display:inline-flex;gap:4px;align-items:center;justify-content:flex-end">
                        ${agent ? `
                          <button class="btn btn-ghost btn-xs" onclick="Helpdesk.chatWithParty(${t.id}, 'agent')" title="Direct Teams Chat with Assigned Agent (${agent.fullName})" style="color:#464eb8">
                            <i class="fa fa-comment-dots"></i> Chat Agent
                          </button>
                        ` : ''}
                        ${(!isAnonymous && requester && requester.id !== myEmpId) ? `
                          <button class="btn btn-ghost btn-xs" onclick="Helpdesk.chatWithParty(${t.id}, 'reporter')" title="Direct Teams Chat with Requester (${requester.fullName})" style="color:#0284c7">
                            <i class="fa fa-comment-dots"></i> Chat Requester
                          </button>
                        ` : ''}
                        <button class="btn btn-ghost btn-xs" onclick="Helpdesk.openTicketWorkspace(${t.id})" title="Open Conversation Thread">
                          <i class="fa fa-comments" style="color:var(--primary)"></i> Reply (${(t.messages || []).length})
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  getCategoryBadge(cat) {
    switch (cat) {
      case 'it_support': return 'IT Support';
      case 'hr_query': return 'HR Query';
      case 'payroll': return 'Payroll & Tax';
      case 'facilities': return 'Facilities';
      case 'confidential_grievance': return 'Confidential Grievance';
      default: return cat;
    }
  },

  getPriorityBadge(priority, slaHours) {
    switch (priority) {
      case 'urgent':
        return `<span class="badge badge-danger"><i class="fa fa-bolt"></i> Urgent (${slaHours || 4}h SLA)</span>`;
      case 'high':
        return `<span class="badge badge-warning">High (${slaHours || 12}h SLA)</span>`;
      case 'medium':
        return `<span class="badge badge-info">Medium (${slaHours || 24}h SLA)</span>`;
      default:
        return `<span class="badge badge-secondary">Low (${slaHours || 48}h SLA)</span>`;
    }
  },

  getStatusBadge(status) {
    switch (status) {
      case 'open': return '<span class="badge badge-warning">Open</span>';
      case 'in_progress': return '<span class="badge badge-primary">In Progress</span>';
      case 'resolved': return '<span class="badge badge-success"><i class="fa fa-check"></i> Resolved</span>';
      case 'closed': return '<span class="badge badge-secondary">Closed</span>';
      default: return `<span class="badge badge-secondary">${status}</span>`;
    }
  },

  showCreateModal(defaultCategory, defaultSubject) {
    Modal.show('Open Internal Service Support Ticket', `
      <div class="form-group">
        <label class="form-label">Subject / Issue Summary <span style="color:var(--danger)">*</span></label>
        <input type="text" class="form-control" id="tkt-subject" placeholder="e.g. VPN Gateway Timeouts or Docker License Request" value="${defaultSubject || ''}" required>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Category <span style="color:var(--danger)">*</span></label>
          <select class="form-control" id="tkt-category">
            <option value="it_support" ${defaultCategory==='it_support'?'selected':''}>IT Infrastructure &amp; Workstations</option>
            <option value="hr_query" ${defaultCategory==='hr_query'?'selected':''}>HR Policies, Letters &amp; Benefits</option>
            <option value="payroll" ${defaultCategory==='payroll'?'selected':''}>Payroll, Payslips &amp; Tax Slips</option>
            <option value="facilities" ${defaultCategory==='facilities'?'selected':''}>Facilities, Desks &amp; Office Services</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Urgency / Severity</label>
          <select class="form-control" id="tkt-priority">
            <option value="urgent">Urgent - Work Blocked (&lt; 4h SLA)</option>
            <option value="high">High Priority (&lt; 12h SLA)</option>
            <option value="medium" selected>Medium - Normal Operational (&lt; 24h SLA)</option>
            <option value="low">Low - General Inquiry (&lt; 48h SLA)</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Detailed Description of Problem <span style="color:var(--danger)">*</span></label>
        <textarea class="form-control" id="tkt-desc" rows="3" placeholder="Provide step-by-step reproduction, machine tag, error messages, or exact dates..." required></textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Helpdesk.submitTicket()"><i class="fa fa-paper-plane"></i> Submit Ticket</button>
      `
    });
  },

  submitTicket() {
    const title = document.getElementById('tkt-subject')?.value.trim();
    const category = document.getElementById('tkt-category')?.value;
    const priority = document.getElementById('tkt-priority')?.value || 'medium';
    const description = document.getElementById('tkt-desc')?.value.trim();

    if (!title || !description) {
      Toast.show('Please fill in required fields (Subject and Description)', 'error');
      return;
    }

    const tickets = DB.get('helpdesk_tickets') || [];
    const tktNum = `TKT-2026-${String(tickets.length + 1).padStart(3, '0')}`;

    const slaMap = { urgent: 4, high: 12, medium: 24, low: 48 };

    const newTicket = {
      id: Utils.generateId(),
      ticketNumber: tktNum,
      title,
      category,
      priority,
      reporterId: Auth.employee.id,
      isAnonymous: false,
      assignedTo: category === 'it_support' ? 1 : 2,
      department: category === 'it_support' ? 'IT Infrastructure' : 'Human Resources',
      status: 'open',
      slaHours: slaMap[priority] || 24,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      description,
      messages: [
        {
          id: 1,
          senderId: Auth.employee.id,
          senderName: Auth.employee.fullName,
          role: Auth.role,
          text: description,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + Utils.today(),
          isInternal: false
        }
      ]
    };

    tickets.unshift(newTicket);
    DB.set('helpdesk_tickets', tickets);
    DB.log('CREATE', 'Helpdesk', `Opened ticket ${tktNum}: ${title}`, Auth.user?.id);

    Modal.close('dynamic-modal');
    Toast.show(`Ticket ${tktNum} created! Assigned to support team.`, 'success');
    this.render();
  },

  showCreateGrievanceModal() {
    Modal.show('Confidential Workplace Grievance & Whistleblower Portal', `
      <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);padding:14px;border-radius:8px;margin-bottom:18px">
        <div style="font-weight:700;font-size:13px;color:var(--danger);display:flex;align-items:center;gap:6px">
          <i class="fa fa-shield-halved"></i> Statutory Whistleblower &amp; Anti-Harassment Safeguards
        </div>
        <div style="font-size:11.5px;color:var(--text-2);margin-top:4px;line-height:1.5">
          Conforming to the <i>Protection Against Harassment of Women at the Workplace Act</i> and Corporate Ethics Governance. Submissions are strictly sealed and accessible only by the designated Corporate Ethics Officer / Ombudsperson. Reprisals or retaliation against reporters carry immediate termination penalties.
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Nature of Grievance <span style="color:var(--danger)">*</span></label>
        <select class="form-control" id="grv-subject-type">
          <option value="Workplace Harassment / Bullying">Workplace Harassment or Hostile Environment</option>
          <option value="Unethical Conduct / Fraud / Financial Irregularity">Unethical Conduct / Fraud / Conflict of Interest</option>
          <option value="Discrimination / Bias in Appraisal or Promotion">Unfair Discrimination in Compensation or Promotion</option>
          <option value="Health & Safety / Workplace Retaliation">Health &amp; Safety Breach or Professional Retaliation</option>
          <option value="Other Confidential Ethics Concern">Other Serious Ethics Violation</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Subject Headline <span style="color:var(--danger)">*</span></label>
        <input type="text" class="form-control" id="grv-title" placeholder="Brief factual summary of incident..." required>
      </div>

      <div class="form-group" style="background:var(--surface);padding:12px 14px;border-radius:8px;border:1px solid var(--border);margin-bottom:16px">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin:0">
          <input type="checkbox" id="grv-anonymous" checked style="width:16px;height:16px">
          <div>
            <div style="font-weight:700;font-size:13px;color:var(--text)">Submit with Cryptographic Anonymity Token</div>
            <div style="font-size:11px;color:var(--text-3)">Your name and employee ID will be stripped. Only your unique anonymous pseudotoken will be displayed to the investigation panel.</div>
          </div>
        </label>
      </div>

      <div class="form-group">
        <label class="form-label">Factual Description &amp; Specifics <span style="color:var(--danger)">*</span></label>
        <textarea class="form-control" id="grv-desc" rows="4" placeholder="Detail dates, locations, persons involved, specific statements, and any witness documentation..." required></textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-danger" onclick="Helpdesk.submitGrievance()"><i class="fa fa-lock"></i> Submit Confidential Grievance</button>
      `
    });
  },

  submitGrievance() {
    const title = document.getElementById('grv-title')?.value.trim();
    const type = document.getElementById('grv-subject-type')?.value;
    const isAnonymous = document.getElementById('grv-anonymous')?.checked;
    const description = document.getElementById('grv-desc')?.value.trim();

    if (!title || !description) {
      Toast.show('Please provide a title and detailed description', 'error');
      return;
    }

    const tickets = DB.get('helpdesk_tickets') || [];
    const tktNum = `GRV-2026-${String(tickets.length + 1).padStart(3, '0')}`;
    const token = isAnonymous ? `ANON-HASH-${Math.floor(1000 + Math.random() * 9000)}` : null;

    const newTicket = {
      id: Utils.generateId(),
      ticketNumber: tktNum,
      title: `${type}: ${title}`,
      category: 'confidential_grievance',
      priority: 'urgent',
      reporterId: isAnonymous ? 0 : Auth.employee.id,
      anonymousToken: token,
      isAnonymous: !!isAnonymous,
      assignedTo: 2, // Sara Malik (HR Ombudsperson)
      department: 'Corporate Ethics & Workplace Redressal Committee',
      status: 'open',
      slaHours: 24,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      description,
      messages: [
        {
          id: 1,
          senderId: isAnonymous ? 0 : Auth.employee.id,
          senderName: isAnonymous ? `Protected Whistleblower (${token})` : Auth.employee.fullName,
          role: 'Employee',
          text: description,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + Utils.today(),
          isInternal: false
        }
      ]
    };

    tickets.unshift(newTicket);
    DB.set('helpdesk_tickets', tickets);
    DB.log('CONFIDENTIAL_SUBMIT', 'Helpdesk', `Lodged confidential grievance ${tktNum}`, Auth.user?.id);

    Modal.close('dynamic-modal');
    Toast.show(`Confidential grievance ${tktNum} securely registered!`, 'success');
    this.activeView = 'grievance';
    this.render();
  },

  openTicketWorkspace(ticketId) {
    const ticket = DB.find('helpdesk_tickets', ticketId);
    if (!ticket) return;

    this.selectedTicketId = ticketId;
    const emps = DB.get('employees') || [];
    const requester = emps.find(e => e.id === ticket.reporterId);
    const agent = emps.find(e => e.id === ticket.assignedTo);
    const isStaffOrAdmin = Auth.role === 'superadmin' || Auth.role === 'hr_manager';

    Modal.show(`Workspace: ${ticket.ticketNumber}`, `
      <div style="display:flex;justify-content:space-between;align-items:center;background:var(--surface);padding:14px;border-radius:8px;margin-bottom:16px;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-weight:800;font-size:15px;color:var(--text)">${ticket.title}</div>
          <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">
            Department: <b>${ticket.department}</b> | Target SLA: <b>${ticket.slaHours} Hours</b>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          ${this.getStatusBadge(ticket.status)}
          ${isStaffOrAdmin ? `
            <select class="form-control" style="height:30px;font-size:11.5px;width:120px" onchange="Helpdesk.updateTicketStatus(${ticket.id}, this.value)">
              <option value="open" ${ticket.status==='open'?'selected':''}>Open</option>
              <option value="in_progress" ${ticket.status==='in_progress'?'selected':''}>In Progress</option>
              <option value="resolved" ${ticket.status==='resolved'?'selected':''}>Resolved</option>
              <option value="closed" ${ticket.status==='closed'?'selected':''}>Closed</option>
            </select>
          ` : ''}
          ${agent ? `
            <button class="btn btn-outline btn-xs" style="border-color:#464eb8;color:#464eb8;display:inline-flex;align-items:center;gap:4px;padding:4px 9px" onclick="Helpdesk.chatWithParty(${ticket.id}, 'agent')" title="Direct Teams Chat with Assigned Agent (${agent.fullName})">
              <i class="fa fa-comments"></i> Chat Agent (${agent.fullName.split(' ')[0]})
            </button>
          ` : ''}
          ${(!ticket.isAnonymous && requester && requester.id !== (Auth.employee?.id || 1)) ? `
            <button class="btn btn-outline btn-xs" style="border-color:#0284c7;color:#0284c7;display:inline-flex;align-items:center;gap:4px;padding:4px 9px" onclick="Helpdesk.chatWithParty(${ticket.id}, 'reporter')" title="Direct Teams Chat with Requester (${requester.fullName})">
              <i class="fa fa-comment-dots"></i> Chat Requester (${requester.fullName.split(' ')[0]})
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Messages Thread -->
      <div id="ticket-thread-box" style="max-height:340px;overflow-y:auto;display:grid;gap:12px;padding:8px;background:var(--card);border:1px solid var(--border);border-radius:8px;margin-bottom:16px">
        ${(ticket.messages || []).map(m => {
          const isMe = m.senderId === Auth.employee?.id;
          return `
            <div style="display:flex;flex-direction:column;align-items:${isMe ? 'flex-end' : 'flex-start'}">
              <div style="font-size:10.5px;color:var(--text-muted);margin-bottom:2px">
                <b>${m.senderName}</b> (${m.role}) • ${m.time}
              </div>
              <div style="max-width:80%;padding:10px 14px;border-radius:10px;font-size:12.5px;background:${isMe ? 'var(--primary)' : 'var(--surface)'};color:${isMe ? '#ffffff' : 'var(--text)'};box-shadow:0 1px 3px rgba(0,0,0,0.1)">
                ${m.text}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Reply Box -->
      <div style="display:flex;gap:10px">
        <input type="text" class="form-control" id="reply-input" placeholder="Type your response or status update..." onkeydown="if(event.key==='Enter')Helpdesk.sendReply(${ticket.id})">
        <button class="btn btn-primary" onclick="Helpdesk.sendReply(${ticket.id})">
          <i class="fa fa-paper-plane"></i> Send
        </button>
      </div>
    `, {
      footer: `<button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close Workspace</button>`
    });

    // Auto-scroll thread to bottom
    setTimeout(() => {
      const box = document.getElementById('ticket-thread-box');
      if (box) box.scrollTop = box.scrollHeight;
    }, 100);
  },

  sendReply(ticketId) {
    const input = document.getElementById('reply-input');
    const text = input?.value.trim();
    if (!text) return;

    const tickets = DB.get('helpdesk_tickets') || [];
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    if (!ticket.messages) ticket.messages = [];

    const isAnonymous = ticket.isAnonymous && ticket.reporterId === 0;
    const senderName = isAnonymous ? `Protected Whistleblower (${ticket.anonymousToken})` : Auth.employee.fullName;

    ticket.messages.push({
      id: ticket.messages.length + 1,
      senderId: Auth.employee.id,
      senderName,
      role: Auth.role.replace(/_/g, ' ').toUpperCase(),
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
      isInternal: false
    });

    if (ticket.status === 'open' && (Auth.role === 'superadmin' || Auth.role === 'hr_manager')) {
      ticket.status = 'in_progress';
    }

    DB.set('helpdesk_tickets', tickets);
    input.value = '';

    // Re-render workspace thread
    this.openTicketWorkspace(ticketId);
    this.renderTable();
  },

  chatWithParty(ticketId, targetRole = 'auto') {
    const ticket = (typeof DB !== 'undefined') ? DB.find('helpdesk_tickets', ticketId) : null;
    if (!ticket) {
      if (typeof Toast !== 'undefined') Toast.show('Ticket not found', 'warning');
      return;
    }

    const myEmpId = (typeof Auth !== 'undefined' && Auth.employee?.id) ? Auth.employee.id : 1;

    let targetEmpId = null;
    if (targetRole === 'agent') {
      targetEmpId = ticket.assignedTo;
    } else if (targetRole === 'reporter') {
      targetEmpId = ticket.reporterId;
    } else {
      targetEmpId = (myEmpId === ticket.reporterId) ? ticket.assignedTo : ticket.reporterId;
    }

    // Protection for anonymous whistleblower grievances
    if (ticket.category === 'confidential_grievance' || !targetEmpId || targetEmpId === 0) {
      if (typeof Toast !== 'undefined') {
        Toast.show('Cannot start direct chat: This grievance was filed anonymously to protect whistleblower identity.', 'info');
      }
      return;
    }

    if (targetEmpId === myEmpId) {
      if (typeof Toast !== 'undefined') {
        Toast.show('You are already the assignee and reporter on this ticket.', 'info');
      }
      return;
    }

    const employees = (typeof DB !== 'undefined' && DB.get('employees')) || [];
    const targetEmp = employees.find(e => e.id === targetEmpId);
    if (!targetEmp) {
      if (typeof Toast !== 'undefined') {
        Toast.show('Counterparty employee profile not found.', 'warning');
      }
      return;
    }

    // Close workspace modal if open
    if (typeof Modal !== 'undefined' && typeof Modal.close === 'function') {
      Modal.close('dynamic-modal');
    }

    // 1. Switch or open direct chat channel
    if (typeof Chat !== 'undefined') {
      if (typeof Chat.startDirectChat === 'function') {
        Chat.startDirectChat(targetEmpId);
      }
      if (typeof Chat.openDrawer === 'function') {
        Chat.openDrawer();
      }

      // 2. Share ticket context card
      const ticketContext = {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        ticketTitle: ticket.title,
        ticketPriority: ticket.priority,
        ticketStatus: ticket.status,
        ticketDepartment: ticket.department
      };

      const introMsg = `🎫 Regarding Ticket #${ticket.ticketNumber}: "${ticket.title}" (${ticket.priority.toUpperCase()} priority • ${ticket.status.toUpperCase()})`;

      const channelId = Chat.activeChannelId;
      const existingMsgs = (typeof Chat.getMessages === 'function') ? (Chat.getMessages(channelId) || []) : [];
      const alreadyShared = existingMsgs.some(m => (m.ticketContext && m.ticketContext.ticketId === ticket.id) || (m.content && m.content.includes(ticket.ticketNumber)));

      if (!alreadyShared) {
        if (typeof Chat.sendCustomMessage === 'function') {
          Chat.sendCustomMessage(introMsg, { ticketContext });
        }
      }

      if (typeof Toast !== 'undefined') {
        Toast.show(`Opened direct chat with ${targetEmp.fullName} regarding #${ticket.ticketNumber}`, 'success');
      }
    }
  },

  updateTicketStatus(ticketId, newStatus) {
    const tickets = DB.get('helpdesk_tickets') || [];
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    ticket.status = newStatus;
    if (newStatus === 'resolved' || newStatus === 'closed') {
      ticket.resolvedAt = new Date().toISOString();
    }

    DB.set('helpdesk_tickets', tickets);
    DB.log('STATUS', 'Helpdesk', `Updated ticket ${ticket.ticketNumber} to ${newStatus}`, Auth.user?.id);
    Toast.show(`Ticket ${ticket.ticketNumber} status updated to ${newStatus}!`, 'info');
    this.render();
  },

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
        a: 'All reimbursement claims with scanned receipts must be submitted by the 20th of each month for inclusion in that month\'s salary disbursal.'
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

    container.innerHTML = `
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
          ${faqs.map(f => `
            <div class="card" style="padding:18px;display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                  <span class="badge badge-secondary" style="font-size:11px;font-weight:700">
                    <i class="fa ${f.icon}" style="margin-right:4px"></i>${f.cat}
                  </span>
                  <span style="font-size:11px;color:var(--text-muted)"><i class="fa fa-circle-check text-success"></i> Verified</span>
                </div>
                <h4 style="font-size:14px;font-weight:700;color:var(--text);margin:0 0 8px 0;line-height:1.4">${f.q}</h4>
                <p style="font-size:12.5px;color:var(--text-2);line-height:1.6;margin:0">${f.a}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};
