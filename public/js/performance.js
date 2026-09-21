// ============================================================
// HRM SYSTEM — Performance Module
// ============================================================

const Performance = {
  currentView: 'reviews',

  getScopedEmployees() {
    const emps = DB.get('employees') || [];
    return Auth.getScopedEmployees(emps).filter(e => e.status === 'active');
  },

  getScopedReviews() {
    const allReviews = DB.get('performance_reviews') || [];
    // Ensure all review records have required default properties
    allReviews.forEach(r => {
      if (!r.type) r.type = 'quarterly';
      if (!r.status) r.status = 'pending';
      if (!r.quarter) r.quarter = 'Q2';
      if (!r.year) r.year = 2026;
    });
    if (Auth.role === 'employee') {
      return allReviews.filter(r => r.employeeId === Auth.employee?.id);
    }
    if (Auth.role === 'dept_manager') {
      const teamIds = this.getScopedEmployees().map(e => e.id);
      return allReviews.filter(r => teamIds.includes(r.employeeId));
    }
    return allReviews;
  },

  getActiveStage() {
    if (['cycles', 'goals', 'kpi'].includes(this.currentView)) return 'cycles';
    if (['reviews', 'feedback360'].includes(this.currentView)) return 'reviews';
    if (['succession'].includes(this.currentView)) return 'succession';
    if (['lms'].includes(this.currentView)) return 'lms';
    return 'reviews';
  },

  isTabActive(tabId) {
    return this.getActiveStage() === tabId;
  },

  render() {
    const content = document.getElementById('page-content');
    const reviews = this.getScopedReviews();
    const kpis = DB.get('kpis');

    content.innerHTML = `
      <div class="animate-fade-in">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
          ${[
            { label:'Total Reviews', val:reviews.length, icon:'fa-clipboard-list', color:'var(--primary)' },
            { label:'Pending Reviews', val:reviews.filter(r=>r.status==='pending').length, icon:'fa-clock', color:'var(--warning)' },
            { label:'Completed', val:reviews.filter(r=>r.status==='completed').length, icon:'fa-circle-check', color:'var(--success)' },
            { label:'Avg. Rating', val:'★ 4.2', icon:'fa-star', color:'var(--warning)' },
          ].map(s => `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px">
              <div style="width:48px;height:48px;border-radius:12px;background:${s.color}22;display:flex;align-items:center;justify-content:center;font-size:20px;color:${s.color}"><i class="fa ${s.icon}"></i></div>
              <div><div style="font-size:22px;font-weight:800;color:${s.color}">${s.val}</div><div style="font-size:12px;color:var(--text-3)">${s.label}</div></div>
            </div>
          `).join('')}
        </div>

        <!-- View Tabs: 4 Clean Lifecycle Stages -->
        <div style="display:flex;gap:6px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;border:1px solid var(--border);flex-wrap:wrap">
          ${[
            { id:'cycles',     label:'Goals, KPIs & Appraisal Cycles', icon:'fa-bullseye' },
            { id:'reviews',    label:'Reviews & 360° Feedback', icon:'fa-clipboard-list' },
            { id:'succession', label:'9-Box Grid & Succession Planning', icon:'fa-sitemap' },
            { id:'lms',        label:'LMS & Competency Skill Matrix', icon:'fa-graduation-cap' },
          ].map(t => `
            <button class="tab-toggle-btn ${this.isTabActive(t.id)?'active':''}" data-tab="${t.id}" onclick="Performance.switchView('${t.id}')">
              <i class="fa ${t.icon}" style="margin-right:6px"></i>${t.label}
            </button>
          `).join('')}
        </div>

        <!-- Stage Sub-Navigation -->
        ${this.getActiveStage() === 'cycles' ? `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
            <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
              <button class="btn btn-sm ${this.currentView==='cycles'?'btn-primary':'btn-ghost'}" onclick="Performance.switchView('cycles')">
                <i class="fa fa-rotate"></i> Appraisal Cycles &amp; Setup
              </button>
              <button class="btn btn-sm ${this.currentView==='goals'?'btn-primary':'btn-ghost'}" onclick="Performance.switchView('goals')">
                <i class="fa fa-flag"></i> Goals &amp; OKRs
              </button>
              <button class="btn btn-sm ${this.currentView==='kpi'?'btn-primary':'btn-ghost'}" onclick="Performance.switchView('kpi')">
                <i class="fa fa-bullseye"></i> KPI Metrics Catalog
              </button>
            </div>
            ${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? `
              <button class="btn btn-primary btn-sm" onclick="Performance.showAddCycleModal()">
                <i class="fa fa-plus"></i> New Cycle
              </button>
            ` : ''}
          </div>
        ` : this.getActiveStage() === 'reviews' ? `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
            <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
              <button class="btn btn-sm ${this.currentView==='reviews'?'btn-primary':'btn-ghost'}" onclick="Performance.switchView('reviews')">
                <i class="fa fa-clipboard-list"></i> Performance Reviews
              </button>
              <button class="btn btn-sm ${this.currentView==='feedback360'?'btn-primary':'btn-ghost'}" onclick="Performance.switchView('feedback360')">
                <i class="fa fa-arrows-spin"></i> 360° Peer Feedback
              </button>
            </div>
            ${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? `
              <button class="btn btn-primary btn-sm" onclick="Performance.showAddReview()">
                <i class="fa fa-plus"></i> Initiate Review
              </button>
            ` : ''}
          </div>
        ` : ''}

        <style>
          .tab-toggle-btn { padding:8px 14px;border:none;background:transparent;color:var(--text-3);font-size:12.5px;font-weight:500;border-radius:7px;cursor:pointer;transition:all .2s; }
          .tab-toggle-btn.active { background:var(--primary);color:white; }
          .tab-toggle-btn:hover:not(.active) { background:var(--surface-2);color:var(--text); }
        </style>

        <div id="perf-content"></div>
      </div>
    `;
    this.renderView();
  },

  switchView(view) {
    this.currentView = view;
    this.render();
  },

  renderView() {
    const container = document.getElementById('perf-content');
    if (!container) return;
    switch(this.currentView) {
      case 'reviews':     this.renderReviews(container); break;
      case 'cycles':      this.renderAppraisalCycles(container); break;
      case 'feedback360': this.render360Feedback(container); break;
      case 'lms':         this.renderLMSAndSkills(container); break;
      case 'succession':  this.renderSuccessionAnd9Box(container); break;
      case 'kpi':         this.renderKPIs(container); break;
      case 'goals':       this.renderGoals(container); break;
    }
  },

  renderReviews(container) {
    const reviews = this.getScopedReviews();
    const canInitiate = Auth.role === 'superadmin' || Auth.role === 'hr_manager';
    const isDeptMgr = Auth.role === 'dept_manager';

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--text)">Employee Performance Evaluations</div>
          <div style="font-size:12px;color:var(--text-3)">Reviews are initiated by HR/Admin and submitted by direct reporting managers</div>
        </div>
        ${canInitiate ? `
          <button class="btn btn-primary btn-sm" onclick="Performance.showAddReview()">
            <i class="fa fa-plus"></i> Initiate Review (HR / Admin)
          </button>
        ` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        ${reviews.length === 0 ? `
          <div class="card"><div class="empty-state" style="padding:40px"><i class="fa fa-clipboard-check"></i><h3>No Performance Reviews</h3><p>No active reviews found for this team.</p></div></div>
        ` : reviews.map(r => {
          const emp = DB.find('employees', r.employeeId);
          const reviewer = DB.find('employees', r.reviewerId);
          const canSubmitEvaluation = (isDeptMgr && (emp?.managerId === Auth.employee?.id || emp?.reportingTo === Auth.employee?.id)) || Auth.role === 'superadmin' || Auth.role === 'hr_manager';
          const rType = (r.type || 'quarterly').toUpperCase();
          const rStatus = (r.status || 'pending').toLowerCase();
          const isCompleted = rStatus === 'completed';
          const ratingNum = Math.min(5, Math.max(0, Math.round(Number(r.overallRating || r.rating || (r.finalScore ? Math.round(r.finalScore) : 0)))));
          const kpiVal = r.kpiScore ?? (r.finalScore ? Math.round(r.finalScore * 20) : 80);
          const kraVal = r.kraScore ?? (r.reviewerScore ? Math.round(r.reviewerScore * 20) : 80);

          return `
            <div class="card">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
                <div style="display:flex;align-items:center;gap:12px">
                  <div class="avatar avatar-md" style="background:${Utils.avatarColor(r.employeeId)}">${Utils.avatarInitials(emp?.fullName||'?')}</div>
                  <div>
                    <div style="font-size:15px;font-weight:700">${emp?.fullName||'—'}</div>
                    <div style="font-size:12px;color:var(--text-3)">${Utils.getDesigName(emp?.designationId)} • ${Utils.getDeptName(emp?.departmentId)}</div>
                    <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Reporting Manager / Reviewer: <strong>${reviewer?.fullName||'Usman Baig (Deputy Manager)'}</strong></div>
                  </div>
                </div>
                <div style="text-align:right">
                  <span class="chip" style="margin-bottom:6px">${rType} ${r.quarter||''} ${r.year||2026}</span><br>
                  ${Utils.statusBadge(r.status || 'pending')}
                </div>
              </div>

              ${isCompleted ? `
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px">
                  ${[
                    { label:'KPI Score', val:kpiVal+'%', color:'var(--primary)' },
                    { label:'KRA Score', val:kraVal+'%', color:'var(--accent)' },
                    { label:'Overall Rating', val:'★'.repeat(ratingNum)+'☆'.repeat(5-ratingNum), color:'var(--warning)' },
                  ].map(m => `
                    <div style="text-align:center;padding:14px;background:var(--surface);border-radius:10px">
                      <div style="font-size:20px;font-weight:800;color:${m.color}">${m.val}</div>
                      <div style="font-size:11px;color:var(--text-3);margin-top:4px">${m.label}</div>
                    </div>
                  `).join('')}
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                  <div style="background:var(--surface);border-radius:8px;padding:12px">
                    <div style="font-size:11px;font-weight:600;color:var(--primary);margin-bottom:6px">MANAGER EVALUATION & FEEDBACK</div>
                    <div style="font-size:13px;color:var(--text-2)">${r.managerFeedback||'—'}</div>
                  </div>
                  <div style="background:var(--surface);border-radius:8px;padding:12px">
                    <div style="font-size:11px;font-weight:600;color:var(--accent);margin-bottom:6px">EMPLOYEE COMMENTS / GOALS</div>
                    <div style="font-size:13px;color:var(--text-2)">${r.selfFeedback||'—'}</div>
                  </div>
                </div>

                <div style="display:flex;gap:8px">
                  ${r.incrementRecommended ? '<span class="badge badge-success"><i class="fa fa-arrow-up"></i> Increment Recommended</span>' : ''}
                  ${r.promotionRecommended ? '<span class="badge badge-primary"><i class="fa fa-star"></i> Promotion Recommended</span>' : ''}
                </div>
              ` : `
                <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                  ${canSubmitEvaluation ? `
                    <button class="btn btn-primary btn-sm" onclick="Performance.fillReview(${r.id})">
                      <i class="fa fa-clipboard-check"></i> Submit Manager Evaluation (PSE Form)
                    </button>
                  ` : ''}
                  <span class="badge badge-warning" style="align-self:center"><i class="fa fa-clock"></i> Initiated by HR — Awaiting Manager Evaluation</span>
                </div>
              `}
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderKPIs(container) {
    const kpis = DB.get('kpis');
    const depts = DB.get('departments');
    container.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
        ${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? `<button class="btn btn-primary btn-sm" onclick="Performance.showAddKPI()"><i class="fa fa-plus"></i> Add KPI</button>` : ''}
      </div>
      <div class="grid-2">
        ${kpis.map(kpi => {
          const dept = depts.find(d => d.id === kpi.departmentId);
          const achieved = Math.round(kpi.target * (0.7 + Math.random() * 0.35));
          const pct = Math.min(100, Math.round(achieved/kpi.target*100));
          const color = pct >= 90 ? 'var(--success)' : pct >= 70 ? 'var(--warning)' : 'var(--danger)';
          return `
            <div class="card">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
                <div>
                  <div style="font-size:14px;font-weight:700">${kpi.name}</div>
                  <div style="font-size:12px;color:var(--text-3);margin-top:3px">${dept ? dept.name : 'Company-Wide'} • Weight: ${kpi.weight}%</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                  <span class="badge badge-primary">Target: ${kpi.target}${kpi.unit}</span>
                  ${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? `
                    <button class="btn btn-ghost btn-icon btn-sm" onclick="Performance.editKPI(${kpi.id})" title="Edit KPI"><i class="fa fa-pen"></i></button>
                    <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Performance.deleteKPI(${kpi.id})" title="Delete KPI"><i class="fa fa-trash"></i></button>
                  ` : ''}
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px">
                <span>Achieved: <strong style="color:${color}">${achieved}${kpi.unit}</strong></span>
                <strong style="color:${color}">${pct}%</strong>
              </div>
              <div class="progress"><div class="progress-bar" style="width:${pct}%;background:${color}"></div></div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderGoals(container) {
    let goals = DB.get('goals');
    if (!goals || goals.length === 0) {
      goals = [
        { id:1, title:'Increase team velocity by 20%', assignedTo:3, deadline:'2026-09-30', progress:65, status:'in_progress' },
        { id:2, title:'Complete AWS certification', assignedTo:4, deadline:'2026-10-31', progress:40, status:'in_progress' },
        { id:3, title:'Launch new marketing campaign', assignedTo:8, deadline:'2026-08-31', progress:100, status:'completed' },
        { id:4, title:'Reduce employee turnover to <5%', assignedTo:2, deadline:'2026-12-31', progress:30, status:'in_progress' },
        { id:5, title:'Achieve 95% customer satisfaction', assignedTo:null, deadline:'2026-12-31', progress:88, status:'in_progress' },
      ];
      DB.set('goals', goals);
    }
    container.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
        <button class="btn btn-primary btn-sm" onclick="Performance.showAddGoal()"><i class="fa fa-plus"></i> Add Goal</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${goals.map(g => {
          const color = g.progress >= 90 ? 'var(--success)' : g.progress >= 60 ? 'var(--warning)' : 'var(--primary)';
          return `
            <div class="card" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
              <div style="flex:1;min-width:200px">
                <div style="font-size:14px;font-weight:600;margin-bottom:4px">${g.title}</div>
                <div style="font-size:12px;color:var(--text-3)">Assignee: ${g.assignedTo ? Utils.getEmpName(g.assignedTo) : 'Company-Wide'} • Due: ${Utils.formatDate(g.deadline)}</div>
              </div>
              <div style="width:200px">
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
                  <span>Progress</span><span style="font-weight:700;color:${color}">${g.progress}%</span>
                </div>
                <div class="progress"><div class="progress-bar" style="width:${g.progress}%;background:${color}"></div></div>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                ${Utils.statusBadge(g.status)}
                <button class="btn btn-ghost btn-sm" onclick="Performance.showUpdateProgress(${g.id})" title="Update Progress"><i class="fa fa-sliders"></i> Progress</button>
                ${Auth.role === 'superadmin' || Auth.role === 'hr_manager' ? `
                  <button class="btn btn-ghost btn-icon btn-sm" onclick="Performance.editGoal(${g.id})" title="Edit Goal"><i class="fa fa-pen"></i></button>
                  <button class="btn btn-ghost btn-icon btn-sm" style="color:var(--danger)" onclick="Performance.deleteGoal(${g.id})" title="Delete Goal"><i class="fa fa-trash"></i></button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  showAddReview() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    Modal.show('Initiate Performance Review', `
      <div class="form-group"><label class="form-label required">Employee</label>
        <select class="form-control" id="rv-emp">${emps.map(e=>`<option value="${e.id}">${e.fullName} (${e.empNo})</option>`).join('')}</select>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Review Type</label>
          <select class="form-control" id="rv-type"><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select>
        </div>
        <div class="form-group"><label class="form-label">Quarter</label>
          <select class="form-control" id="rv-quarter"><option value="Q1">Q1</option><option value="Q2">Q2</option><option value="Q3" selected>Q3</option><option value="Q4">Q4</option></select>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Performance.saveReview()"><i class="fa fa-save"></i> Initiate</button>
      `
    });
  },

  saveReview() {
    const empId = parseInt(document.getElementById('rv-emp').value);
    const type = document.getElementById('rv-type').value;
    const quarter = document.getElementById('rv-quarter').value;
    const emp = DB.find('employees', empId);
    const reviewerId = emp?.managerId || (emp?.reportingTo || 3);
    DB.add('performance_reviews', {
      id: DB.nextId('performance_reviews'), employeeId: empId, reviewerId: reviewerId,
      type, quarter, year: new Date().getFullYear(), kpiScore: 85, kraScore: 80,
      managerFeedback: '', selfFeedback: '', overallRating: 0, status: 'pending',
      reviewDate: null, incrementRecommended: false, promotionRecommended: false
    });
    DB.log('ADD', 'Performance', `Review initiated by ${Auth.user?.username || 'HR/Admin'} for ${Utils.getEmpName(empId)} (Assigned to Manager #${reviewerId})`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Review initiated successfully!', 'success', 'Assigned to direct reporting manager for evaluation.');
    this.render();
  },

  fillReview(reviewId) {
    const rev = DB.find('performance_reviews', reviewId);
    const emp = DB.find('employees', rev?.employeeId);
    const pse = emp?.pseEvaluation || {
      jobKnowledge: 4, workQuality: 4, teamwork: 4, punctuality: 4, leadership: 4,
      managerComments: '', employeeComments: ''
    };
    const targets = emp?.nextYearTargets || [];

    Modal.show(`Manager Evaluation (PSE Form) — ${emp?.fullName || 'Employee'}`, `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(16,185,129,0.08));border:1px solid rgba(99,102,241,0.25);border-radius:10px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-weight:700;font-size:13.5px;color:var(--text)">Performance Standard Evaluation (PSE) Form</div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">Direct Reporting Manager evaluation according to observed employee performance</div>
          </div>
          <span class="badge badge-primary"><i class="fa fa-user-tie" style="margin-right:4px"></i>${Auth.role === 'dept_manager' ? 'Deputy Manager / Tech Lead' : 'Manager'}</span>
        </div>

        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px">
          <div style="font-weight:700;font-size:13px;margin-bottom:10px;color:var(--text);display:flex;align-items:center;gap:6px">
            <i class="fa fa-star" style="color:var(--warning)"></i> Core Performance Dimensions (Rating 1 to 5)
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group" style="margin:0">
              <label class="form-label required" style="font-size:12px">Job Knowledge & Technical Proficiency</label>
              <select class="form-control" id="rv-dim-knowledge">
                ${[5,4,3,2,1].map(n => `<option value="${n}" ${pse.jobKnowledge==n?'selected':''}>${n} — ${n>=5?'Outstanding':n===4?'Exceeds Expectations':n===3?'Meets Standards':n===2?'Needs Improvement':'Unsatisfactory'}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label required" style="font-size:12px">Quality & Delivery of Work</label>
              <select class="form-control" id="rv-dim-quality">
                ${[5,4,3,2,1].map(n => `<option value="${n}" ${pse.workQuality==n?'selected':''}>${n} — ${n>=5?'Outstanding':n===4?'Exceeds Expectations':n===3?'Meets Standards':n===2?'Needs Improvement':'Unsatisfactory'}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label required" style="font-size:12px">Teamwork, Collaboration & Support</label>
              <select class="form-control" id="rv-dim-teamwork">
                ${[5,4,3,2,1].map(n => `<option value="${n}" ${pse.teamwork==n?'selected':''}>${n} — ${n>=5?'Outstanding':n===4?'Exceeds Expectations':n===3?'Meets Standards':n===2?'Needs Improvement':'Unsatisfactory'}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin:0">
              <label class="form-label required" style="font-size:12px">Punctuality, Discipline & Reliability</label>
              <select class="form-control" id="rv-dim-punctuality">
                ${[5,4,3,2,1].map(n => `<option value="${n}" ${pse.punctuality==n?'selected':''}>${n} — ${n>=5?'Outstanding':n===4?'Exceeds Expectations':n===3?'Meets Standards':n===2?'Needs Improvement':'Unsatisfactory'}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="grid-column:span 2;margin:0">
              <label class="form-label required" style="font-size:12px">Initiative, Problem Solving & Leadership</label>
              <select class="form-control" id="rv-dim-leadership">
                ${[5,4,3,2,1].map(n => `<option value="${n}" ${pse.leadership==n?'selected':''}>${n} — ${n>=5?'Outstanding':n===4?'Exceeds Expectations':n===3?'Meets Standards':n===2?'Needs Improvement':'Unsatisfactory'}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group" style="margin:0">
            <label class="form-label">KPI Fulfillment (%)</label>
            <input type="number" class="form-control" id="rv-kpi" min="0" max="100" value="${rev?.kpiScore || 85}">
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label">KRA Score (%)</label>
            <input type="number" class="form-control" id="rv-kra" min="0" max="100" value="${rev?.kraScore || 80}">
          </div>
        </div>

        <div class="form-group" style="margin:0">
          <label class="form-label required"><i class="fa fa-comment-dots" style="color:var(--primary);margin-right:4px"></i> Manager Evaluation Comments</label>
          <textarea class="form-control" id="rv-mgr-fb" rows="3" placeholder="Provide specific feedback on accomplishments, performance, strengths, and areas for improvement...">${pse.managerComments || rev?.managerFeedback || 'Consistently delivers on sprint commitments with high code quality and positive collaborative energy.'}</textarea>
        </div>

        <div class="form-group" style="margin:0">
          <label class="form-label"><i class="fa fa-user-pen" style="color:var(--accent);margin-right:4px"></i> Employee Review Comments / Self Reflection</label>
          <textarea class="form-control" id="rv-self-fb" rows="2" placeholder="Employee's self feedback or career aspirations...">${pse.employeeComments || rev?.selfFeedback || 'Striving to take on higher technical ownership and mentor newer team members.'}</textarea>
        </div>

        <div class="form-group" style="margin:0">
          <label class="form-label"><i class="fa fa-bullseye" style="color:var(--warning);margin-right:4px"></i> Next Year Targets (One target per line)</label>
          <textarea class="form-control" id="rv-targets" rows="2" placeholder="e.g. Lead module refactoring in Q1&#10;Achieve 99% automated test coverage">${targets.map(t => t.target).join('\n') || 'Achieve 98% on-time sprint task delivery\nComplete advanced certification in core technology\nMentor junior team members and conduct code reviews'}</textarea>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group" style="display:flex;align-items:center;gap:10px;background:var(--surface);padding:12px;border-radius:8px;margin:0">
            <input type="checkbox" id="rv-increment" style="width:16px;height:16px" ${rev?.incrementRecommended?'checked':''}>
            <label for="rv-increment" style="font-size:13px;font-weight:600;cursor:pointer">Recommend Merit Salary Increment</label>
          </div>
          <div class="form-group" style="display:flex;align-items:center;gap:10px;background:var(--surface);padding:12px;border-radius:8px;margin:0">
            <input type="checkbox" id="rv-promotion" style="width:16px;height:16px" ${rev?.promotionRecommended?'checked':''}>
            <label for="rv-promotion" style="font-size:13px;font-weight:600;cursor:pointer">Recommend Role Promotion</label>
          </div>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Performance.submitReview(${reviewId})">
          <i class="fa fa-save"></i> Submit Manager Evaluation
        </button>
      `
    });
  },

  submitReview(reviewId) {
    const kpiScore = parseInt(document.getElementById('rv-kpi')?.value) || 85;
    const kraScore = parseInt(document.getElementById('rv-kra')?.value) || 80;
    const knowledge = parseInt(document.getElementById('rv-dim-knowledge')?.value) || 4;
    const quality = parseInt(document.getElementById('rv-dim-quality')?.value) || 4;
    const teamwork = parseInt(document.getElementById('rv-dim-teamwork')?.value) || 4;
    const punctuality = parseInt(document.getElementById('rv-dim-punctuality')?.value) || 4;
    const leadership = parseInt(document.getElementById('rv-dim-leadership')?.value) || 4;

    const avg = (knowledge + quality + teamwork + punctuality + leadership) / 5;
    const overallRating = Math.max(1, Math.min(5, Math.round(avg)));

    const managerFeedback = document.getElementById('rv-mgr-fb')?.value.trim() || '';
    const selfFeedback = document.getElementById('rv-self-fb')?.value.trim() || '';
    const targetsText = document.getElementById('rv-targets')?.value.trim() || '';
    const incrementRecommended = document.getElementById('rv-increment')?.checked || false;
    const promotionRecommended = document.getElementById('rv-promotion')?.checked || false;

    // Update performance_reviews
    DB.update('performance_reviews', reviewId, {
      kpiScore, kraScore, overallRating,
      managerFeedback, selfFeedback,
      incrementRecommended, promotionRecommended,
      status: 'completed',
      reviewDate: Utils.today()
    });

    // Synchronize to Employee Profile (Screenshots 4: PSE evaluation form & Next Year Targets)
    const rev = DB.find('performance_reviews', reviewId);
    if (rev) {
      const emp = DB.find('employees', rev.employeeId);
      if (emp) {
        emp.pseEvaluation = {
          jobKnowledge: knowledge,
          workQuality: quality,
          teamwork: teamwork,
          punctuality: punctuality,
          leadership: leadership,
          overallScore: `${avg.toFixed(1)} / 5.0`,
          managerComments: managerFeedback,
          employeeComments: selfFeedback,
          evaluatedBy: `${Auth.user?.fullName || 'Usman Baig'} (${Auth.role === 'dept_manager' ? 'Deputy Manager' : 'Manager'})`,
          evaluatedDate: Utils.today()
        };

        if (targetsText) {
          const lines = targetsText.split('\n').map(l => l.trim()).filter(Boolean);
          emp.nextYearTargets = lines.map(targetLine => ({
            target: targetLine,
            metric: 'Milestone Delivery',
            weight: `${Math.round(100 / lines.length)}%`,
            timeline: 'Q1-Q4'
          }));
        }

        DB.update('employees', emp.id, emp);
      }
    }

    DB.log('COMPLETE', 'Performance', `Reporting Manager submitted evaluation for Review #${reviewId}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Evaluation Submitted!', 'success', 'Manager review completed and synchronized to employee profile.');
    this.render();
  },

  showAddKPI() {
    const depts = DB.get('departments');
    Modal.show('Add New KPI', `
      <div class="form-group">
        <label class="form-label required">KPI Name</label>
        <input class="form-control" id="kpi-name" placeholder="e.g. Code Review Completion Rate">
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Department</label>
          <select class="form-control" id="kpi-dept">
            <option value="">Company-Wide</option>
            ${depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Weight (%)</label>
          <input type="number" class="form-control" id="kpi-weight" value="20" min="1" max="100">
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Target Value</label>
          <input type="number" class="form-control" id="kpi-target" value="100" min="1">
        </div>
        <div class="form-group">
          <label class="form-label required">Unit</label>
          <input class="form-control" id="kpi-unit" value="%" placeholder="e.g. %, PRs, hrs">
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Performance.saveKPI()"><i class="fa fa-save"></i> Save KPI</button>
      `
    });
  },

  saveKPI() {
    const name = document.getElementById('kpi-name').value.trim();
    if (!name) { Toast.show('Please enter KPI name', 'error'); return; }
    const deptVal = document.getElementById('kpi-dept').value;
    const departmentId = deptVal ? parseInt(deptVal) : null;
    const weight = parseInt(document.getElementById('kpi-weight').value) || 20;
    const target = parseFloat(document.getElementById('kpi-target').value) || 100;
    const unit = document.getElementById('kpi-unit').value.trim() || '%';

    DB.add('kpis', {
      id: DB.nextId('kpis'),
      name, departmentId, weight, target, unit
    });
    DB.log('ADD', 'Performance', `Added KPI: ${name}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('KPI added successfully!', 'success');
    this.renderView();
  },

  editKPI(id) {
    const kpi = DB.find('kpis', id);
    if (!kpi) return;
    const depts = DB.get('departments');
    Modal.show(`Edit KPI — ${kpi.name}`, `
      <div class="form-group">
        <label class="form-label required">KPI Name</label>
        <input class="form-control" id="ekpi-name" value="${kpi.name}">
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Department</label>
          <select class="form-control" id="ekpi-dept">
            <option value="" ${!kpi.departmentId ? 'selected' : ''}>Company-Wide</option>
            ${depts.map(d => `<option value="${d.id}" ${kpi.departmentId === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Weight (%)</label>
          <input type="number" class="form-control" id="ekpi-weight" value="${kpi.weight}" min="1" max="100">
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Target Value</label>
          <input type="number" class="form-control" id="ekpi-target" value="${kpi.target}" min="1">
        </div>
        <div class="form-group">
          <label class="form-label required">Unit</label>
          <input class="form-control" id="ekpi-unit" value="${kpi.unit}">
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Performance.updateKPI(${id})"><i class="fa fa-save"></i> Update KPI</button>
      `
    });
  },

  updateKPI(id) {
    const name = document.getElementById('ekpi-name').value.trim();
    if (!name) { Toast.show('Please enter KPI name', 'error'); return; }
    const deptVal = document.getElementById('ekpi-dept').value;
    DB.update('kpis', id, {
      name,
      departmentId: deptVal ? parseInt(deptVal) : null,
      weight: parseInt(document.getElementById('ekpi-weight').value) || 20,
      target: parseFloat(document.getElementById('ekpi-target').value) || 100,
      unit: document.getElementById('ekpi-unit').value.trim() || '%'
    });
    DB.log('UPDATE', 'Performance', `Updated KPI #${id} (${name})`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('KPI updated!', 'success');
    this.renderView();
  },

  deleteKPI(id) {
    const kpi = DB.find('kpis', id);
    Modal.confirm('Delete KPI', `Are you sure you want to delete KPI <strong>${kpi?.name}</strong>?`, () => {
      DB.delete('kpis', id);
      DB.log('DELETE', 'Performance', `Deleted KPI: ${kpi?.name}`, Auth.user?.id);
      Toast.show('KPI deleted!', 'warning');
      this.renderView();
    });
  },

  showAddGoal() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    Modal.show('Add New Performance Goal', `
      <div class="form-group">
        <label class="form-label required">Goal Title</label>
        <input class="form-control" id="gf-title" placeholder="e.g. Increase team sprint velocity by 20%">
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Assignee</label>
          <select class="form-control" id="gf-assigned">
            <option value="">Company-Wide / All</option>
            ${emps.map(e => `<option value="${e.id}">${e.fullName} (${e.empNo})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Target Deadline</label>
          <input type="date" class="form-control" id="gf-deadline" value="${Utils.today()}">
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Initial Progress (%)</label>
          <input type="number" class="form-control" id="gf-progress" value="0" min="0" max="100">
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="gf-status">
            <option value="in_progress">In Progress</option>
            <option value="not_started">Not Started</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Performance.saveGoal()"><i class="fa fa-save"></i> Save Goal</button>
      `
    });
  },

  saveGoal() {
    const title = document.getElementById('gf-title').value.trim();
    if (!title) { Toast.show('Please enter goal title', 'error'); return; }
    const assignedVal = document.getElementById('gf-assigned').value;
    const progress = Math.min(100, Math.max(0, parseInt(document.getElementById('gf-progress').value) || 0));
    const status = progress >= 100 ? 'completed' : document.getElementById('gf-status').value;

    DB.add('goals', {
      id: DB.nextId('goals'),
      title,
      assignedTo: assignedVal ? parseInt(assignedVal) : null,
      deadline: document.getElementById('gf-deadline').value,
      progress,
      status,
      createdOn: Utils.today()
    });
    DB.log('ADD', 'Performance', `Added goal: ${title}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Goal added successfully!', 'success');
    this.renderView();
  },

  showUpdateProgress(goalId) {
    const g = DB.find('goals', goalId);
    if (!g) return;
    Modal.show(`Update Progress — ${g.title}`, `
      <div style="font-size:13px;color:var(--text-2);margin-bottom:16px">
        Assignee: <strong>${g.assignedTo ? Utils.getEmpName(g.assignedTo) : 'Company-Wide'}</strong> • Due: <strong>${Utils.formatDate(g.deadline)}</strong>
      </div>
      <div class="form-group">
        <label class="form-label" style="display:flex;justify-content:space-between">
          <span>Progress</span>
          <span id="g-prog-val" style="font-weight:700;color:var(--primary)">${g.progress}%</span>
        </label>
        <input type="range" class="form-control" id="g-prog-range" min="0" max="100" value="${g.progress}" oninput="document.getElementById('g-prog-val').textContent=this.value+'%'">
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="g-prog-status">
          <option value="in_progress" ${g.status==='in_progress'?'selected':''}>In Progress</option>
          <option value="completed" ${g.status==='completed'?'selected':''}>Completed</option>
          <option value="not_started" ${g.status==='not_started'?'selected':''}>Not Started</option>
        </select>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Performance.saveProgress(${goalId})"><i class="fa fa-save"></i> Save Progress</button>
      `
    });
  },

  saveProgress(goalId) {
    const progress = parseInt(document.getElementById('g-prog-range').value) || 0;
    let status = document.getElementById('g-prog-status').value;
    if (progress >= 100) status = 'completed';
    DB.update('goals', goalId, { progress, status });
    DB.log('UPDATE', 'Performance', `Updated progress for Goal #${goalId} to ${progress}%`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show(`Goal progress updated to ${progress}%!`, 'success');
    this.renderView();
  },

  editGoal(goalId) {
    const g = DB.find('goals', goalId);
    if (!g) return;
    const emps = DB.get('employees').filter(e => e.status === 'active');
    Modal.show(`Edit Goal`, `
      <div class="form-group">
        <label class="form-label required">Goal Title</label>
        <input class="form-control" id="egf-title" value="${g.title}">
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Assignee</label>
          <select class="form-control" id="egf-assigned">
            <option value="" ${!g.assignedTo ? 'selected' : ''}>Company-Wide / All</option>
            ${emps.map(e => `<option value="${e.id}" ${g.assignedTo === e.id ? 'selected' : ''}>${e.fullName}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Target Deadline</label>
          <input type="date" class="form-control" id="egf-deadline" value="${g.deadline}">
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Progress (%)</label>
          <input type="number" class="form-control" id="egf-progress" value="${g.progress}" min="0" max="100">
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="egf-status">
            <option value="in_progress" ${g.status==='in_progress'?'selected':''}>In Progress</option>
            <option value="completed" ${g.status==='completed'?'selected':''}>Completed</option>
            <option value="not_started" ${g.status==='not_started'?'selected':''}>Not Started</option>
          </select>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Performance.updateGoal(${goalId})"><i class="fa fa-save"></i> Update Goal</button>
      `
    });
  },

  updateGoal(goalId) {
    const title = document.getElementById('egf-title').value.trim();
    if (!title) { Toast.show('Please enter goal title', 'error'); return; }
    const assignedVal = document.getElementById('egf-assigned').value;
    const progress = Math.min(100, Math.max(0, parseInt(document.getElementById('egf-progress').value) || 0));
    let status = document.getElementById('egf-status').value;
    if (progress >= 100) status = 'completed';

    DB.update('goals', goalId, {
      title,
      assignedTo: assignedVal ? parseInt(assignedVal) : null,
      deadline: document.getElementById('egf-deadline').value,
      progress,
      status
    });
    DB.log('UPDATE', 'Performance', `Updated Goal #${goalId} (${title})`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Goal updated!', 'success');
    this.renderView();
  },

  deleteGoal(goalId) {
    Modal.confirm('Are you sure you want to delete this goal?', () => {
      DB.delete('goals', goalId);
      DB.log('DELETE', 'Performance', `Deleted Goal #${goalId}`, Auth.user?.id);
      Toast.show('Goal deleted!', 'warning');
      this.renderView();
    });
  },

  // ============================================================
  // BATCH 4: 360-Degree Multi-Rater Feedback & Competency Matrix
  // ============================================================
  selected360EmpId: 4,

  render360Feedback(container) {
    const isEmp = Auth.role === 'employee';
    const allEmps = DB.get('employees').filter(e => e.status === 'active');
    if (isEmp && Auth.employee?.id) {
      this.selected360EmpId = Auth.employee.id;
    }
    const targetEmp = DB.find('employees', this.selected360EmpId) || allEmps[0];
    const allF360 = DB.get('feedback_360') || [];
    const empReviews = allF360.filter(f => f.employeeId === this.selected360EmpId);

    // Compute aggregated score across competencies
    const categories = [
      { key: 'technical', label: 'Technical Competence & Execution', icon: 'fa-code' },
      { key: 'leadership', label: 'Leadership, Ownership & Initiative', icon: 'fa-user-tie' },
      { key: 'teamwork', label: 'Teamwork & Collaboration', icon: 'fa-people-group' },
      { key: 'innovation', label: 'Problem Solving & Innovation', icon: 'fa-lightbulb' },
      { key: 'values', label: 'Cultural Alignment & Company Values', icon: 'fa-heart' }
    ];

    const relTypes = ['Self', 'Manager', 'Peer'];
    const avgOverall = empReviews.length > 0
      ? (empReviews.reduce((sum, r) => sum + (r.overallScore || 0), 0) / empReviews.length).toFixed(1)
      : '4.5';

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h2 style="font-size:18px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:rgba(236,72,153,0.12);color:#ec4899">
              <i class="fa fa-arrows-spin"></i>
            </span>
            360-Degree Multi-Rater Peer Review &amp; Competency Matrix
          </h2>
          <div style="font-size:12.5px;color:var(--text-3);margin-top:4px">
            Multilateral peer evaluations, leadership competency radar, and constructive feedback
          </div>
        </div>

        <div style="display:flex;gap:8px">
          ${!isEmp ? `
            <div style="display:flex;align-items:center;gap:8px">
              <label style="font-size:12px;font-weight:600;color:var(--text-2)">Evaluatee:</label>
              <select class="form-control" style="width:200px" onchange="Performance.selected360EmpId=parseInt(this.value);Performance.render360Feedback(document.getElementById('perf-content'))">
                ${allEmps.map(e => `<option value="${e.id}" ${e.id===this.selected360EmpId?'selected':''}>${e.fullName}</option>`).join('')}
              </select>
            </div>
          ` : ''}
          <button class="btn btn-primary btn-sm" onclick="Performance.showAdd360ReviewModal(${this.selected360EmpId})">
            <i class="fa fa-plus"></i> Submit 360 Review
          </button>
        </div>
      </div>

      <!-- Overview Metric Cards -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Evaluatee Subject</div>
          <div style="font-size:17px;font-weight:800;color:var(--text);margin-top:6px">${targetEmp?.fullName || '—'}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${Utils.getDesigName(targetEmp?.designationId)}</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Average 360 Rating</div>
          <div style="font-size:24px;font-weight:800;color:var(--warning);margin-top:4px">★ ${avgOverall} <span style="font-size:13px;color:var(--text-muted)">/ 5.0</span></div>
          <div style="font-size:11px;color:var(--success);margin-top:2px">Top Tier Performance Band</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Reviews Received</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:6px">${empReviews.length} Evaluators</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Self, Manager, and Peer Perspectives</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Cycle Status</div>
          <div style="font-size:18px;font-weight:800;color:var(--success);margin-top:6px">Active Q3 Review</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Cycle Closes Sep 30, 2026</div>
        </div>
      </div>

      <!-- Competency Matrix & Qualitative Feedback Cards -->
      <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:20px;margin-bottom:24px">
        <!-- Competency Spider-Style Progress Grid -->
        <div class="card" style="padding:20px">
          <div style="font-weight:700;font-size:14px;color:var(--text);margin-bottom:16px;display:flex;align-items:center;gap:8px">
            <i class="fa fa-chart-simple" style="color:var(--primary)"></i> 360 Multilateral Competency Breakdown
          </div>

          <div style="display:grid;gap:14px">
            ${categories.map(cat => {
              // Calculate average for each relation
              const selfScore = empReviews.find(r => r.relationship === 'Self')?.scores[cat.key] || 4.2;
              const mgrScore = empReviews.find(r => r.relationship === 'Manager')?.scores[cat.key] || 4.6;
              const peerScore = empReviews.find(r => r.relationship === 'Peer')?.scores[cat.key] || 4.5;
              const overall = ((selfScore + mgrScore + peerScore) / 3).toFixed(1);

              return `
                <div>
                  <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12.5px">
                    <span style="font-weight:600"><i class="fa ${cat.icon}" style="color:var(--primary);width:16px"></i> ${cat.label}</span>
                    <strong style="color:var(--primary)">${overall} / 5.0</strong>
                  </div>
                  <div class="progress" style="height:9px;background:var(--surface)">
                    <div class="progress-bar" style="width:${Math.round(overall / 5 * 100)}%;background:linear-gradient(90deg,var(--primary),#ec4899)"></div>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--text-3);margin-top:4px">
                    <span>Self: <strong>${selfScore}</strong></span>
                    <span>Manager: <strong>${mgrScore}</strong></span>
                    <span>Peers: <strong>${peerScore}</strong></span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Qualitative Strengths & Growth Areas -->
        <div class="card" style="padding:20px;background:linear-gradient(135deg,var(--card),var(--surface))">
          <div style="font-weight:700;font-size:14px;color:var(--text);margin-bottom:14px;display:flex;align-items:center;gap:8px">
            <i class="fa fa-comment-dots" style="color:var(--success)"></i> Qualitative Peer Consensus
          </div>

          <div style="background:rgba(16,185,129,0.08);border-left:4px solid var(--success);border-radius:6px;padding:12px 14px;margin-bottom:14px">
            <div style="font-size:12px;font-weight:800;color:var(--success);margin-bottom:4px">
              <i class="fa fa-thumbs-up" style="margin-right:4px"></i> Demonstrated Key Strengths:
            </div>
            <div style="font-size:12px;color:var(--text);line-height:1.5">
              ${empReviews.map(r => r.strengths).filter(Boolean).join(' ') || 'Exceptional technical competence and unwavering dedication to project delivery milestones.'}
            </div>
          </div>

          <div style="background:rgba(245,158,11,0.08);border-left:4px solid var(--warning);border-radius:6px;padding:12px 14px">
            <div style="font-size:12px;font-weight:800;color:var(--warning);margin-bottom:4px">
              <i class="fa fa-arrow-trend-up" style="margin-right:4px"></i> Recommended Development Focus:
            </div>
            <div style="font-size:12px;color:var(--text);line-height:1.5">
              ${empReviews.map(r => r.improvements).filter(Boolean).join(' ') || 'Encouraged to take on mentorship of junior staff and lead architectural technical discussions.'}
            </div>
          </div>
        </div>
      </div>

      <!-- 360 Submissions Log Table -->
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700;font-size:13.5px;color:var(--text)">
            <i class="fa fa-list-check" style="color:var(--primary);margin-right:6px"></i> Detailed Evaluation Submissions for ${targetEmp?.fullName}
          </div>
          <div style="font-size:12px;color:var(--text-3)">Showing ${empReviews.length} completed feedback forms</div>
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th>Evaluator</th>
                <th>Relationship</th>
                <th>Review Cycle</th>
                <th>Overall Score</th>
                <th>Submission Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${empReviews.map(r => {
                const rater = DB.find('employees', r.raterId);
                return `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="avatar avatar-sm" style="background:${Utils.avatarColor(r.raterId)}">${Utils.avatarInitials(rater?.fullName||'?')}</div>
                        <div>
                          <div style="font-weight:600;font-size:13px">${rater?.fullName || 'Anonymous Peer'}</div>
                          <div style="font-size:11px;color:var(--text-3)">${rater ? Utils.getDesigName(rater.designationId) : 'Colleague'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge ${r.relationship==='Manager'?'badge-primary':r.relationship==='Self'?'badge-secondary':'badge-info'}">
                        ${r.relationship}
                      </span>
                    </td>
                    <td>${r.cycle}</td>
                    <td><strong style="color:var(--warning);font-size:13.5px">★ ${r.overallScore}</strong> <span style="font-size:11px;color:var(--text-3)">/ 5.0</span></td>
                    <td>${r.submittedAt}</td>
                    <td><span class="badge badge-success"><i class="fa fa-check"></i> Completed</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showAdd360ReviewModal(empId) {
    const targetEmp = DB.find('employees', empId);
    const myId = Auth.employee?.id || 1;

    Modal.show(`Submit 360° Review for ${targetEmp?.fullName}`, `
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Evaluatee</label>
          <input class="form-control" value="${targetEmp?.fullName}" readonly>
        </div>
        <div class="form-group">
          <label class="form-label required">Relationship to Evaluatee</label>
          <select class="form-control" id="f360-rel">
            <option value="Peer">Peer / Colleague</option>
            <option value="Manager">Direct Reporting Manager</option>
            <option value="Direct Report">Direct Subordinate</option>
            <option value="Self">Self-Assessment</option>
          </select>
        </div>
      </div>

      <div style="font-weight:700;font-size:13px;color:var(--text);margin:14px 0 10px;border-bottom:1px solid var(--border);padding-bottom:4px">
        Competency Assessment Ratings (Scale 1 to 5):
      </div>

      <div style="display:grid;gap:10px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <label style="font-size:12px;margin:0">Technical Competence &amp; Execution:</label>
          <select class="form-control" id="f360-score-tech" style="width:110px">
            <option value="5">5 - Outstanding</option>
            <option value="4" selected>4 - Exceeds</option>
            <option value="3">3 - Meets</option>
            <option value="2">2 - Developing</option>
            <option value="1">1 - Unsatisfactory</option>
          </select>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <label style="font-size:12px;margin:0">Leadership &amp; Ownership:</label>
          <select class="form-control" id="f360-score-lead" style="width:110px">
            <option value="5">5 - Outstanding</option>
            <option value="4" selected>4 - Exceeds</option>
            <option value="3">3 - Meets</option>
            <option value="2">2 - Developing</option>
            <option value="1">1 - Unsatisfactory</option>
          </select>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <label style="font-size:12px;margin:0">Teamwork &amp; Collaboration:</label>
          <select class="form-control" id="f360-score-team" style="width:110px">
            <option value="5" selected>5 - Outstanding</option>
            <option value="4">4 - Exceeds</option>
            <option value="3">3 - Meets</option>
            <option value="2">2 - Developing</option>
            <option value="1">1 - Unsatisfactory</option>
          </select>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <label style="font-size:12px;margin:0">Problem Solving &amp; Innovation:</label>
          <select class="form-control" id="f360-score-innov" style="width:110px">
            <option value="5">5 - Outstanding</option>
            <option value="4" selected>4 - Exceeds</option>
            <option value="3">3 - Meets</option>
            <option value="2">2 - Developing</option>
            <option value="1">1 - Unsatisfactory</option>
          </select>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <label style="font-size:12px;margin:0">Company Values &amp; Cultural Alignment:</label>
          <select class="form-control" id="f360-score-values" style="width:110px">
            <option value="5" selected>5 - Outstanding</option>
            <option value="4">4 - Exceeds</option>
            <option value="3">3 - Meets</option>
            <option value="2">2 - Developing</option>
            <option value="1">1 - Unsatisfactory</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label required">Key Strengths &amp; Contributions</label>
        <textarea class="form-control" id="f360-strengths" rows="2" placeholder="Describe the employee's most valuable strengths and positive impacts..."></textarea>
      </div>

      <div class="form-group">
        <label class="form-label required">Constructive Areas for Growth</label>
        <textarea class="form-control" id="f360-growth" rows="2" placeholder="Specific recommendations to help the employee advance professionally..."></textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Performance.save360Review(${empId})"><i class="fa fa-save"></i> Submit Evaluation</button>
      `
    });
  },

  save360Review(empId) {
    const rel = document.getElementById('f360-rel').value;
    const tech = parseInt(document.getElementById('f360-score-tech').value) || 4;
    const lead = parseInt(document.getElementById('f360-score-lead').value) || 4;
    const team = parseInt(document.getElementById('f360-score-team').value) || 5;
    const innov = parseInt(document.getElementById('f360-score-innov').value) || 4;
    const values = parseInt(document.getElementById('f360-score-values').value) || 5;
    const strengths = document.getElementById('f360-strengths').value.trim();
    const improvements = document.getElementById('f360-growth').value.trim();

    if (!strengths || !improvements) {
      Toast.show('Please provide strengths and growth feedback', 'error');
      return;
    }

    const overall = ((tech + lead + team + innov + values) / 5).toFixed(1);
    let allF360 = DB.get('feedback_360') || [];

    allF360.unshift({
      id: DB.nextId('feedback_360'),
      cycle: 'Q3 2026 Annual Review',
      employeeId: empId,
      raterId: Auth.employee?.id || 1,
      relationship: rel,
      scores: { technical: tech, leadership: lead, teamwork: team, innovation: innov, values },
      overallScore: parseFloat(overall),
      strengths,
      improvements,
      status: 'completed',
      submittedAt: Utils.today()
    });

    DB.set('feedback_360', allF360);
    DB.log('ADD', 'Performance', `Submitted 360 review for ${Utils.getEmpName(empId)}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('360° Review submitted successfully!', 'success');
    this.render360Feedback(document.getElementById('perf-content'));
  },

  // ============================================================
  // BATCH 4: Corporate LMS, Training & Skill Gap Matrix
  // ============================================================
  lmsSubTab: 'courses',

  renderLMSAndSkills(container) {
    const courses = DB.get('courses_lms') || [];
    const enrollments = DB.get('course_enrollments') || [];
    const emps = DB.get('employees').filter(e => e.status === 'active');

    const totalCredits = enrollments.filter(en => en.status === 'completed').length * 15;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h2 style="font-size:18px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:rgba(16,185,129,0.12);color:var(--success)">
              <i class="fa fa-graduation-cap"></i>
            </span>
            Corporate LMS, Training &amp; Skill Gap Matrix
          </h2>
          <div style="font-size:12.5px;color:var(--text-3);margin-top:4px">
            Course catalog, certifications repository, and designation benchmark skill gaps
          </div>
        </div>

        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="Performance.showAddCourseModal()"><i class="fa fa-plus"></i> Add Course</button>
          <button class="btn btn-primary btn-sm" onclick="Performance.showEnrollModal()"><i class="fa fa-user-plus"></i> Enroll Employee</button>
        </div>
      </div>

      <!-- LMS Metric Cards -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Available Courses</div>
          <div style="font-size:22px;font-weight:800;color:var(--primary);margin-top:6px">${courses.length} Programs</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Engineering, Leadership, Infosec</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Active Enrollments</div>
          <div style="font-size:22px;font-weight:800;color:var(--success);margin-top:6px">${enrollments.length} Participants</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Across all departments</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Certificates Issued</div>
          <div style="font-size:22px;font-weight:800;color:var(--warning);margin-top:6px">${enrollments.filter(e=>e.status==='completed').length} Verified</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">100% Exam Pass Rate</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase">Total CPD Hours Earned</div>
          <div style="font-size:22px;font-weight:800;color:var(--info);margin-top:6px">${totalCredits} Hours</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Professional Development</div>
        </div>
      </div>

      <!-- Sub Navigation -->
      <div style="display:flex;gap:6px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px">
        <button class="tab-toggle-btn ${this.lmsSubTab==='courses'?'active':''}" onclick="Performance.lmsSubTab='courses';Performance.renderLMSAndSkills(document.getElementById('perf-content'))">
          <i class="fa fa-book-open" style="margin-right:6px"></i> Course Catalog &amp; Enrollments
        </button>
        <button class="tab-toggle-btn ${this.lmsSubTab==='skills'?'active':''}" onclick="Performance.lmsSubTab='skills';Performance.renderLMSAndSkills(document.getElementById('perf-content'))">
          <i class="fa fa-layer-group" style="margin-right:6px"></i> Designation Skill Benchmark &amp; Gap Matrix
        </button>
      </div>

      ${this.lmsSubTab === 'courses' ? this.renderLMSCoursesView(courses, enrollments, emps) : this.renderSkillGapMatrixView(emps, courses)}
    `;
  },

  renderLMSCoursesView(courses, enrollments, emps) {
    return `
      <!-- Course Catalog Cards -->
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:24px">
        ${courses.map(c => `
          <div class="card" style="padding:18px;display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                <span class="chip" style="font-size:11px;font-weight:700">${c.category}</span>
                <span class="badge badge-success">${c.level}</span>
              </div>
              <div style="font-weight:800;font-size:15px;color:var(--text);margin-bottom:4px">${c.title}</div>
              <div style="font-size:12px;color:var(--text-2);line-height:1.5;margin-bottom:12px">${c.description}</div>
            </div>

            <div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:var(--surface);border-radius:8px;padding:8px 12px;font-size:11.5px;margin-bottom:12px">
                <div><span style="color:var(--text-3)">Duration:</span> <strong>${c.duration}</strong></div>
                <div><span style="color:var(--text-3)">CPD Credits:</span> <strong>${c.cpdCredits} Pts</strong></div>
                <div><span style="color:var(--text-3)">Modules:</span> <strong>${c.modulesCount} Lessons</strong></div>
              </div>
              <button class="btn btn-primary btn-sm" style="width:100%" onclick="Performance.showEnrollModal(${c.id})">
                <i class="fa fa-user-plus"></i> Enroll Team Member
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Enrollments Register Table -->
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700;font-size:13.5px;color:var(--text)">
            <i class="fa fa-list-check" style="color:var(--primary);margin-right:6px"></i> Active Employee Learning Enrollments
          </div>
          <div style="font-size:12px;color:var(--text-3)">${enrollments.length} total enrollments recorded</div>
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Course Program</th>
                <th>Enrolled Date</th>
                <th>Progress</th>
                <th>Score</th>
                <th>Status</th>
                <th>Certificate</th>
              </tr>
            </thead>
            <tbody>
              ${enrollments.map(en => {
                const emp = DB.find('employees', en.employeeId);
                const crs = DB.find('courses_lms', en.courseId);
                return `
                  <tr>
                    <td>
                      <div style="font-weight:600;font-size:13px">${emp?.fullName || '—'}</div>
                      <div style="font-size:11px;color:var(--text-3)">${emp?.empNo}</div>
                    </td>
                    <td><strong style="font-size:12.5px">${crs?.title || 'Course'}</strong></td>
                    <td>${en.enrolledDate}</td>
                    <td style="min-width:130px">
                      <div style="display:flex;align-items:center;gap:8px">
                        <div class="progress" style="height:7px;flex:1"><div class="progress-bar" style="width:${en.progress}%;background:var(--success)"></div></div>
                        <span style="font-size:11px;font-weight:700">${en.progress}%</span>
                      </div>
                    </td>
                    <td>${en.score ? `<strong style="color:var(--success)">${en.score}%</strong>` : 'In Progress'}</td>
                    <td>
                      ${en.status === 'completed' ? '<span class="badge badge-success"><i class="fa fa-check"></i> Certified</span>' : '<span class="badge badge-warning">In Progress</span>'}
                    </td>
                    <td>
                      ${en.certificateRef ? `<span class="chip" style="font-family:monospace;font-size:10.5px;color:var(--primary)"><i class="fa fa-certificate"></i> ${en.certificateRef}</span>` : 'Pending'}
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

  renderSkillGapMatrixView(emps, courses) {
    const benchmarks = [
      { desig: 'Software Engineer', reqSkills: ['React / TypeScript (L4)', 'Node.js APIs (L3)', 'SQL Architecture (L3)', 'Git Flow (L4)'], recommendedCourseId: 1 },
      { desig: 'Deputy Manager / Tech Lead', reqSkills: ['AWS Cloud Architecture (L4)', 'DevOps CI/CD (L4)', 'Engineering Mentorship (L4)'], recommendedCourseId: 2 },
      { desig: 'HR Manager', reqSkills: ['Labor Law & FBR Tax (L5)', 'Talent Succession (L4)', 'Payroll Automation (L5)'], recommendedCourseId: 3 },
      { desig: 'All Personnel', reqSkills: ['ISO 27001 Infosec (Mandatory)', 'Data Privacy Compliance (L3)'], recommendedCourseId: 4 }
    ];

    return `
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700;font-size:13.5px;color:var(--text)">
            <i class="fa fa-layer-group" style="color:var(--primary);margin-right:6px"></i> Designation Competency Benchmark &amp; Recommended LMS Actions
          </div>
          <div style="font-size:12px;color:var(--text-3)">Benchmarked against corporate performance matrix</div>
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th>Job Designation</th>
                <th>Benchmark Skill Requirements</th>
                <th>Target Proficiency</th>
                <th>Recommended LMS Intervention</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${benchmarks.map(b => {
                const crs = courses.find(c => c.id === b.recommendedCourseId);
                return `
                  <tr>
                    <td style="font-weight:700;color:var(--text)">${b.desig}</td>
                    <td>
                      <div style="display:flex;gap:6px;flex-wrap:wrap">
                        ${b.reqSkills.map(s => `<span class="badge badge-secondary" style="font-size:11px">${s}</span>`).join('')}
                      </div>
                    </td>
                    <td><span class="badge badge-success">Level 4 / Advanced</span></td>
                    <td>
                      <strong style="color:var(--primary);font-size:12.5px">${crs?.title || 'Corporate Course'}</strong>
                      <div style="font-size:11px;color:var(--text-3)">Duration: ${crs?.duration || '20h'} &bull; ${crs?.cpdCredits || 15} CPD Credits</div>
                    </td>
                    <td>
                      <button class="btn btn-primary btn-sm" onclick="Performance.showEnrollModal(${b.recommendedCourseId})">
                        <i class="fa fa-graduation-cap"></i> Enroll Cohort
                      </button>
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

  showAddCourseModal() {
    Modal.show('Add Corporate LMS Course', `
      <div class="form-group">
        <label class="form-label required">Course Title</label>
        <input class="form-control" id="crs-title" placeholder="e.g. Docker, Kubernetes &amp; Cloud Native Architecture">
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Category</label>
          <select class="form-control" id="crs-cat">
            <option value="Technical / Engineering">Technical / Engineering</option>
            <option value="Cloud &amp; Infrastructure">Cloud &amp; Infrastructure</option>
            <option value="Management &amp; Leadership">Management &amp; Leadership</option>
            <option value="Compliance &amp; Governance">Compliance &amp; Governance</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Level</label>
          <select class="form-control" id="crs-level">
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Executive">Executive</option>
            <option value="Mandatory">Mandatory Compliance</option>
          </select>
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Duration</label>
          <input class="form-control" id="crs-duration" value="20 Hours" placeholder="e.g. 20 Hours">
        </div>
        <div class="form-group">
          <label class="form-label required">CPD Credits</label>
          <input type="number" class="form-control" id="crs-credits" value="15" min="1">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label required">Course Description &amp; Learning Outcomes</label>
        <textarea class="form-control" id="crs-desc" rows="3" placeholder="Outline core skills acquired upon completion..."></textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Performance.saveCourse()"><i class="fa fa-save"></i> Save Program</button>
      `
    });
  },

  saveCourse() {
    const title = document.getElementById('crs-title').value.trim();
    const category = document.getElementById('crs-cat').value;
    const level = document.getElementById('crs-level').value;
    const duration = document.getElementById('crs-duration').value.trim();
    const cpdCredits = parseInt(document.getElementById('crs-credits').value) || 10;
    const description = document.getElementById('crs-desc').value.trim();

    if (!title || !description) {
      Toast.show('Please fill required course details', 'error');
      return;
    }

    let courses = DB.get('courses_lms') || [];
    courses.push({
      id: DB.nextId('courses_lms'),
      title,
      category,
      provider: 'Corporate Academy',
      duration,
      cpdCredits,
      level,
      description,
      modulesCount: 6,
      enrolledCount: 0,
      status: 'active'
    });

    DB.set('courses_lms', courses);
    DB.log('ADD', 'Performance', `Added new LMS course: ${title}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Corporate course published to LMS!', 'success');
    this.renderLMSAndSkills(document.getElementById('perf-content'));
  },

  showEnrollModal(defaultCourseId = 1) {
    const courses = DB.get('courses_lms') || [];
    const emps = DB.get('employees').filter(e => e.status === 'active');

    Modal.show('Enroll Employee in LMS Course', `
      <div class="form-group">
        <label class="form-label required">Select Course Program</label>
        <select class="form-control" id="enr-course">
          ${courses.map(c => `<option value="${c.id}" ${c.id===defaultCourseId?'selected':''}>${c.title} (${c.level})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">Select Employee</label>
        <select class="form-control" id="enr-emp">
          ${emps.map(e => `<option value="${e.id}">${e.fullName} (${Utils.getDesigName(e.designationId)})</option>`).join('')}
        </select>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Performance.saveEnrollment()"><i class="fa fa-user-plus"></i> Confirm Enrollment</button>
      `
    });
  },

  saveEnrollment() {
    const courseId = parseInt(document.getElementById('enr-course').value);
    const employeeId = parseInt(document.getElementById('enr-emp').value);
    let enrollments = DB.get('course_enrollments') || [];

    // Check duplicate
    if (enrollments.some(e => e.courseId === courseId && e.employeeId === employeeId)) {
      Toast.show('Employee already enrolled in this program', 'info');
      Modal.close('dynamic-modal');
      return;
    }

    enrollments.push({
      id: DB.nextId('course_enrollments'),
      employeeId,
      courseId,
      progress: 10,
      score: 0,
      status: 'in_progress',
      enrolledDate: Utils.today(),
      completedDate: null,
      certificateRef: null
    });

    DB.set('course_enrollments', enrollments);
    DB.log('ENROLL', 'Performance', `Enrolled ${Utils.getEmpName(employeeId)} in course #${courseId}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Employee enrolled successfully in LMS!', 'success');
    this.renderLMSAndSkills(document.getElementById('perf-content'));
  },

  // ============================================================
  // BATCH 4: Executive Succession Planning & 9-Box Talent Matrix
  // ============================================================
  renderSuccessionAnd9Box(container) {
    const plans = DB.get('succession_plans') || [];
    const emps = DB.get('employees').filter(e => e.status === 'active');

    // 9-Box Grid Quadrants mapping
    const gridNine = [
      // Row 1: High Potential
      { key: 'Enigma', label: 'Enigma / High Potential', potential: 'High', performance: 'Low', color: '#8b5cf6', emps: [emps[4] || emps[0]] },
      { key: 'Emerging Leader', label: 'Emerging Leader', potential: 'High', performance: 'Med', color: '#3b82f6', emps: [emps[5] || emps[1]] },
      { key: 'Star', label: 'Star / Future Executive', potential: 'High', performance: 'High', color: '#10b981', emps: [emps[2] || emps[0], emps[3] || emps[1]] },

      // Row 2: Medium Potential
      { key: 'Dilemma', label: 'Dilemma / Needs Coaching', potential: 'Med', performance: 'Low', color: '#f59e0b', emps: [emps[6] || emps[0]] },
      { key: 'Core Professional', label: 'Core Professional', potential: 'Med', performance: 'Med', color: '#6366f1', emps: [emps[7] || emps[1], emps[8] || emps[2]] },
      { key: 'High Impact Contributor', label: 'High Impact Contributor', potential: 'Med', performance: 'High', color: '#059669', emps: [emps[1] || emps[0]] },

      // Row 3: Low Potential
      { key: 'Talent Risk', label: 'Talent Risk / Action Needed', potential: 'Low', performance: 'Low', color: '#ef4444', emps: [emps[9] || emps[3]] },
      { key: 'Effective Performer', label: 'Effective Performer', potential: 'Low', performance: 'Med', color: '#64748b', emps: [emps[10] || emps[2]] },
      { key: 'Trusted Specialist', label: 'Trusted Specialist', potential: 'Low', performance: 'High', color: '#0284c7', emps: [emps[0]] }
    ];

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:14px">
        <div>
          <h2 style="font-size:18px;font-weight:800;color:var(--text);margin:0;display:flex;align-items:center;gap:10px">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:rgba(99,102,241,0.12);color:var(--primary)">
              <i class="fa fa-sitemap"></i>
            </span>
            Executive Succession Planning &amp; 9-Box Talent Matrix
          </h2>
          <div style="font-size:12.5px;color:var(--text-3);margin-top:4px">
            Strategic bench strength assessment, leadership readiness pipelines, and 9-box performance vs potential mapping
          </div>
        </div>

        <button class="btn btn-primary btn-sm" onclick="Performance.showNominateSuccessorModal()">
          <i class="fa fa-user-plus"></i> Nominate Role Successor
        </button>
      </div>

      <!-- 9-Box Talent Matrix Visualization -->
      <div class="card" style="padding:22px;margin-bottom:24px">
        <div style="font-weight:700;font-size:14px;color:var(--text);margin-bottom:16px;display:flex;align-items:center;gap:8px">
          <i class="fa fa-table-cells-large" style="color:var(--primary)"></i> 9-Box Performance vs. Potential Talent Grid
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          ${gridNine.map(box => `
            <div style="background:var(--surface);border:1.5px solid ${box.color}44;border-top:4px solid ${box.color};border-radius:10px;padding:14px;min-height:140px;display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <div style="font-size:12px;font-weight:800;color:${box.color}">${box.label}</div>
                  <span style="font-size:10px;color:var(--text-3)">${box.potential} Pot / ${box.performance} Perf</span>
                </div>

                <div style="display:flex;flex-direction:column;gap:6px">
                  ${box.emps.filter(Boolean).map(e => `
                    <div style="background:var(--card);border:1px solid var(--border);border-radius:6px;padding:6px 10px;display:flex;align-items:center;gap:8px">
                      <div class="avatar avatar-sm" style="background:${Utils.avatarColor(e.id)};width:24px;height:24px;font-size:10px">${Utils.avatarInitials(e.fullName)}</div>
                      <div style="overflow:hidden">
                        <div style="font-size:12px;font-weight:700;white-space:nowrap;text-overflow:ellipsis">${e.fullName}</div>
                        <div style="font-size:10px;color:var(--text-3)">${Utils.getDesigName(e.designationId)}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div style="font-size:10.5px;color:var(--text-3);margin-top:10px;text-align:right">
                ${box.emps.filter(Boolean).length} Talent Candidates
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Critical Role Succession Pipelines Table -->
      <div class="card" style="padding:0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700;font-size:13.5px;color:var(--text)">
            <i class="fa fa-shield-halved" style="color:var(--primary);margin-right:6px"></i> Mission-Critical Leadership Succession Pipelines
          </div>
          <div style="font-size:12px;color:var(--text-3)">${plans.length} strategic positions tracked</div>
        </div>
        <div class="table-wrapper" style="border:none;border-radius:0">
          <table>
            <thead>
              <tr>
                <th>Critical Role Title</th>
                <th>Current Incumbent</th>
                <th>Criticality Level</th>
                <th>Identified Successor Candidates &amp; Readiness Tiers</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${plans.map(p => `
                <tr>
                  <td>
                    <strong style="font-size:13.5px;color:var(--text)">${p.roleTitle}</strong>
                    <div style="font-size:11px;color:var(--text-3)">Department: ${Utils.getDeptName(p.departmentId)}</div>
                  </td>
                  <td>
                    <div style="font-weight:600;font-size:13px">${p.currentIncumbent}</div>
                  </td>
                  <td>
                    <span class="badge ${p.criticality==='High'?'badge-danger':'badge-warning'}">${p.criticality}</span>
                  </td>
                  <td>
                    <div style="display:flex;flex-direction:column;gap:6px">
                      ${p.successors.map(s => `
                        <div style="background:var(--surface);border-radius:6px;padding:6px 10px;display:flex;justify-content:space-between;align-items:center;gap:12px">
                          <div>
                            <strong style="font-size:12px;color:var(--text)">${s.name}</strong>
                            <span style="font-size:11px;color:var(--text-3)">(${s.currentRole})</span>
                            <div style="font-size:10.5px;color:var(--primary)">Goal: ${s.developmentGoal || 'Mentorship program'}</div>
                          </div>
                          <span class="badge ${s.readiness.includes('Ready Now')?'badge-success':'badge-primary'}" style="font-size:10px">
                            ${s.readiness}
                          </span>
                        </div>
                      `).join('')}
                    </div>
                  </td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="Performance.showNominateSuccessorModal(${p.id})">
                      <i class="fa fa-plus"></i> Add
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  showNominateSuccessorModal(planId = 1) {
    const plans = DB.get('succession_plans') || [];
    const emps = DB.get('employees').filter(e => e.status === 'active');

    Modal.show('Nominate Role Successor Candidate', `
      <div class="form-group">
        <label class="form-label required">Strategic Position</label>
        <select class="form-control" id="nom-role">
          ${plans.map(p => `<option value="${p.id}" ${p.id===planId?'selected':''}>${p.roleTitle}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">Nominated Successor</label>
        <select class="form-control" id="nom-emp">
          ${emps.map(e => `<option value="${e.id}">${e.fullName} &bull; ${Utils.getDesigName(e.designationId)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Readiness Horizon</label>
          <select class="form-control" id="nom-readiness">
            <option value="Ready Now (< 3 mos)">Ready Now (< 3 months)</option>
            <option value="Ready with Mentorship (6-12 mos)" selected>Ready with Mentorship (6–12 months)</option>
            <option value="Future Pipeline (1-2 yrs)">Future Pipeline (1–2 years)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Talent 9-Box Category</label>
          <select class="form-control" id="nom-box">
            <option value="Star / Future Leader">Star / Future Leader</option>
            <option value="High Potential" selected>High Potential / Emerging Leader</option>
            <option value="Core Contributor">Core Contributor</option>
            <option value="Trusted Specialist">Trusted Specialist</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label required">Target Development Action Plan</label>
        <input class="form-control" id="nom-action" placeholder="e.g. Executive cross-functional rotation and leadership coaching" value="Executive cross-functional rotation and leadership coaching">
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Performance.saveSuccessorNomination()"><i class="fa fa-save"></i> Save Nomination</button>
      `
    });
  },

  saveSuccessorNomination() {
    const roleId = parseInt(document.getElementById('nom-role').value);
    const empId = parseInt(document.getElementById('nom-emp').value);
    const readiness = document.getElementById('nom-readiness').value;
    const gridCategory = document.getElementById('nom-box').value;
    const developmentGoal = document.getElementById('nom-action').value.trim();

    const emp = DB.find('employees', empId);
    let plans = DB.get('succession_plans') || [];
    const plan = plans.find(p => p.id === roleId);

    if (plan && emp) {
      plan.successors.push({
        employeeId: empId,
        name: emp.fullName,
        currentRole: Utils.getDesigName(emp.designationId),
        readiness,
        performance: 'High',
        potential: 'High',
        gridCategory,
        developmentGoal
      });
      DB.set('succession_plans', plans);
      DB.log('ADD', 'Performance', `Nominated ${emp.fullName} as successor for ${plan.roleTitle}`, Auth.user?.id);
      Modal.close('dynamic-modal');
      Toast.show('Successor nominated successfully!', 'success');
      this.renderSuccessionAnd9Box(document.getElementById('perf-content'));
    }
  },

  // ═══════════════════════════════════════════════
  // PHASE 4: APPRAISAL CYCLES & OKRS
  // ═══════════════════════════════════════════════

  renderAppraisalCycles(container) {
    const cycles = DB.get('performance_cycles') || [];
    const criteria = DB.get('performance_criteria') || [];
    const goals = DB.get('performance_goals') || [];
    const appraisals = DB.get('appraisals') || [];
    const activeCycle = cycles.find(c => c.status === 'active') || cycles[0];

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Top Metrics -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid var(--primary)">
            <div style="font-size:11.5px;color:var(--text-3);text-transform:uppercase;font-weight:600">Active Appraisal Cycle</div>
            <div style="font-size:18px;font-weight:800;color:var(--text);margin-top:4px">${activeCycle?.title || 'None Active'}</div>
            <div style="font-size:11.5px;color:var(--primary);margin-top:2px"><i class="fa fa-calendar-check"></i> ${activeCycle ? `${activeCycle.startDate} to ${activeCycle.endDate}` : '—'}</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid var(--info)">
            <div style="font-size:11.5px;color:var(--text-3);text-transform:uppercase;font-weight:600">Evaluation Criteria</div>
            <div style="font-size:24px;font-weight:800;color:var(--info);margin-top:4px">${criteria.length} Rubrics</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Weighted competency scorecards</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid var(--warning)">
            <div style="font-size:11.5px;color:var(--text-3);text-transform:uppercase;font-weight:600">Active Performance Goals</div>
            <div style="font-size:24px;font-weight:800;color:var(--warning);margin-top:4px">${goals.length} Goals</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${goals.filter(g => g.status==='completed').length} completed, ${goals.filter(g => g.status==='in_progress').length} in-progress</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid var(--success)">
            <div style="font-size:11.5px;color:var(--text-3);text-transform:uppercase;font-weight:600">Appraisal Submissions</div>
            <div style="font-size:24px;font-weight:800;color:var(--success);margin-top:4px">${appraisals.length} Appraisals</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${appraisals.filter(a => a.status==='completed').length} finalized with merit actions</div>
          </div>
        </div>

        <!-- Section 1: Appraisal Cycles & Criteria Master -->
        <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:20px;margin-bottom:24px">
          <!-- Cycles Card -->
          <div class="card" style="padding:0">
            <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
              <div>
                <span style="font-size:14px;font-weight:700">Appraisal Cycles</span>
                <span class="badge badge-primary" style="margin-left:8px">${cycles.length} Cycles</span>
              </div>
              <button class="btn btn-primary btn-xs" onclick="Performance.showAddCycleModal()"><i class="fa fa-plus"></i> New Cycle</button>
            </div>
            <div class="table-wrapper" style="border:none">
              <table>
                <thead>
                  <tr>
                    <th>Cycle Title</th>
                    <th>Type</th>
                    <th>Period</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${cycles.map(c => `
                    <tr>
                      <td style="font-weight:700">${c.title}</td>
                      <td><span class="chip">${c.cycleType}</span></td>
                      <td style="font-size:11.5px;color:var(--text-3)">${c.startDate} &rarr; ${c.endDate}</td>
                      <td><span class="badge ${c.status==='active'?'badge-success':'badge-secondary'}">${c.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Criteria Card -->
          <div class="card" style="padding:0">
            <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
              <div>
                <span style="font-size:14px;font-weight:700">Evaluation Rubric Criteria</span>
                <span class="badge badge-info" style="margin-left:8px">${criteria.length} Criteria</span>
              </div>
              <button class="btn btn-ghost btn-xs" onclick="Toast.show('Standard criteria configured from Enterprise blueprint','info')"><i class="fa fa-info-circle"></i> Blueprint</button>
            </div>
            <div class="table-wrapper" style="border:none">
              <table>
                <thead>
                  <tr>
                    <th>Criteria Name</th>
                    <th>Category</th>
                    <th>Weight</th>
                    <th>Max</th>
                  </tr>
                </thead>
                <tbody>
                  ${criteria.map(cr => `
                    <tr>
                      <td style="font-weight:600">${cr.name}</td>
                      <td><span class="badge badge-secondary" style="font-size:10px">${cr.category}</span></td>
                      <td><strong>${cr.weight}%</strong></td>
                      <td>${cr.maxScore} pts</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Section 2: Goals & OKRs Breakdown -->
        <div class="card" style="padding:0;margin-bottom:24px">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <div>
              <span style="font-size:14px;font-weight:700">Strategic Performance Goals &amp; OKR Milestones</span>
              <span class="badge badge-warning" style="margin-left:8px">${goals.length} Goals Registered</span>
            </div>
            <button class="btn btn-primary btn-xs" onclick="Performance.showAddOKRModal()"><i class="fa fa-plus"></i> New OKR Goal</button>
          </div>
          <div class="table-wrapper" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Goal / Milestone</th>
                  <th>Weight</th>
                  <th>Target Metric</th>
                  <th>Current Metric</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${goals.map(g => {
                  const emp = DB.find('employees', g.employeeId);
                  const pct = Math.round((g.currentMetric / (g.targetMetric || 1)) * 100);
                  const color = pct >= 90 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--primary)';
                  return `
                    <tr>
                      <td style="font-weight:600">${emp?.fullName || 'Company Wide'}</td>
                      <td><strong>${g.title}</strong></td>
                      <td>${g.weight}%</td>
                      <td>${g.targetMetric}</td>
                      <td style="font-weight:700;color:${color}">${g.currentMetric}</td>
                      <td style="width:140px">
                        <div style="display:flex;align-items:center;gap:6px">
                          <div class="progress" style="flex:1"><div class="progress-bar" style="width:${Math.min(100, pct)}%;background:${color}"></div></div>
                          <span style="font-size:11px;font-weight:700">${pct}%</span>
                        </div>
                      </td>
                      <td>${Utils.statusBadge(g.status)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section 3: Appraisals & Scorecards -->
        <div class="card" style="padding:0">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <div>
              <span style="font-size:14px;font-weight:700">Appraisal Submissions &amp; Final Merit Outcomes</span>
              <span class="badge badge-success" style="margin-left:8px">${appraisals.length} Finalized</span>
            </div>
          </div>
          <div class="table-wrapper" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Cycle</th>
                  <th>Reviewer</th>
                  <th>Final Score</th>
                  <th>Merit Increment</th>
                  <th>Promotion</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${appraisals.map(a => {
                  const emp = DB.find('employees', a.employeeId);
                  const rev = DB.find('employees', a.reviewerId);
                  const cycle = cycles.find(c => c.id === a.cycleId);
                  return `
                    <tr>
                      <td>
                        <div style="font-weight:700">${emp?.fullName || '—'}</div>
                        <div style="font-size:11px;color:var(--text-3)">${Utils.getDesigName(emp?.designationId)}</div>
                      </td>
                      <td>${cycle?.title || 'Cycle #' + a.cycleId}</td>
                      <td>${rev?.fullName || 'HR Manager'}</td>
                      <td><span style="font-size:15px;font-weight:800;color:var(--warning)">★ ${a.finalScore} / 5.0</span></td>
                      <td><span class="badge ${a.incrementRecommended?'badge-success':'badge-secondary'}">${a.incrementRecommended?'Recommended':'None'}</span></td>
                      <td><span class="badge ${a.promotionRecommended?'badge-primary':'badge-secondary'}">${a.promotionRecommended?'Recommended':'None'}</span></td>
                      <td>${Utils.statusBadge(a.status)}</td>
                      <td>
                        <button class="btn btn-ghost btn-xs" onclick="Performance.viewAppraisalDetails(${a.id})"><i class="fa fa-eye"></i> View Rubric</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  showAddCycleModal() {
    Modal.show('Initiate Performance Appraisal Cycle', `
      <div class="form-group">
        <label class="form-label required">Cycle Title</label>
        <input class="form-control" id="pcy-title" placeholder="e.g. FY2026 Annual Performance Review">
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Cycle Type</label>
          <select class="form-control" id="pcy-type">
            <option value="annual">Annual Review</option>
            <option value="semi_annual">Semi-Annual</option>
            <option value="quarterly" selected>Quarterly Review</option>
            <option value="probation">Probation Clearance</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Status</label>
          <select class="form-control" id="pcy-status">
            <option value="active" selected>Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Start Date</label>
          <input type="date" class="form-control" id="pcy-start" value="${Utils.today()}">
        </div>
        <div class="form-group">
          <label class="form-label required">End Date</label>
          <input type="date" class="form-control" id="pcy-end" value="2026-12-31">
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Performance.saveAppraisalCycle()"><i class="fa fa-save"></i> Save Cycle</button>
      `
    });
  },

  saveAppraisalCycle() {
    const title = document.getElementById('pcy-title').value.trim();
    if (!title) { Toast.show('Please enter cycle title', 'error'); return; }
    const cycleType = document.getElementById('pcy-type').value;
    const status = document.getElementById('pcy-status').value;
    const startDate = document.getElementById('pcy-start').value;
    const endDate = document.getElementById('pcy-end').value;

    const cycles = DB.get('performance_cycles') || [];
    const newCycle = {
      id: cycles.length > 0 ? Math.max(...cycles.map(c => c.id)) + 1 : 1,
      title, cycleType, startDate, endDate, status
    };
    cycles.push(newCycle);
    DB.set('performance_cycles', cycles);
    DB.log('CREATE', 'Performance', `Created Performance Cycle: ${title}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Performance Cycle created!', 'success');
    this.renderView();
  },

  showAddOKRModal() {
    const emps = DB.get('employees').filter(e => e.status === 'active');
    Modal.show('Register Performance OKR Goal', `
      <div class="form-group">
        <label class="form-label required">Employee</label>
        <select class="form-control" id="okr-emp">
          ${emps.map(e => `<option value="${e.id}">${e.fullName} (${e.empNo})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">Goal / OKR Title</label>
        <input class="form-control" id="okr-title" placeholder="e.g. Reduce backend API latency to < 100ms">
      </div>
      <div class="form-row form-row-3">
        <div class="form-group">
          <label class="form-label required">Weight (%)</label>
          <input type="number" class="form-control" id="okr-weight" value="25" min="1" max="100">
        </div>
        <div class="form-group">
          <label class="form-label required">Target Metric</label>
          <input type="number" class="form-control" id="okr-target" value="100">
        </div>
        <div class="form-group">
          <label class="form-label required">Current Metric</label>
          <input type="number" class="form-control" id="okr-current" value="0">
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Performance.saveOKRGoal()"><i class="fa fa-save"></i> Save OKR</button>
      `
    });
  },

  saveOKRGoal() {
    const employeeId = parseInt(document.getElementById('okr-emp').value);
    const title = document.getElementById('okr-title').value.trim();
    if (!title) { Toast.show('Please enter OKR title', 'error'); return; }
    const weight = parseInt(document.getElementById('okr-weight').value) || 20;
    const targetMetric = parseFloat(document.getElementById('okr-target').value) || 100;
    const currentMetric = parseFloat(document.getElementById('okr-current').value) || 0;

    const goals = DB.get('performance_goals') || [];
    const newGoal = {
      id: goals.length > 0 ? Math.max(...goals.map(g => g.id)) + 1 : 1,
      employeeId, title, weight, targetMetric, currentMetric,
      status: currentMetric >= targetMetric ? 'completed' : 'in_progress'
    };
    goals.push(newGoal);
    DB.set('performance_goals', goals);
    DB.log('CREATE', 'Performance', `Created OKR Goal: ${title}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('OKR Goal registered!', 'success');
    this.renderView();
  },

  viewAppraisalDetails(appraisalId) {
    const appraisals = DB.get('appraisals') || [];
    const a = appraisals.find(x => x.id === appraisalId);
    if (!a) return;
    const emp = DB.find('employees', a.employeeId);
    const rev = DB.find('employees', a.reviewerId);
    const scores = (DB.get('performance_scores') || []).filter(s => s.appraisalId === appraisalId);
    const criteria = DB.get('performance_criteria') || [];

    Modal.show(`Performance Scorecard — ${emp?.fullName || 'Employee'}`, `
      <div style="margin-bottom:16px;background:var(--surface);padding:12px 16px;border-radius:10px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:16px;font-weight:800">${emp?.fullName}</div>
          <div style="font-size:12px;color:var(--text-3)">Reviewer: ${rev?.fullName || 'Manager'} &bull; Status: ${a.status}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:22px;font-weight:800;color:var(--warning)">★ ${a.finalScore} / 5.0</div>
          <div style="font-size:11px;color:var(--text-3)">Weighted Composite</div>
        </div>
      </div>
      <div style="font-size:13px;font-weight:700;margin-bottom:8px">Evaluated Rubric Criteria Breakdown</div>
      <div class="table-wrapper" style="margin-bottom:16px">
        <table>
          <thead>
            <tr><th>Criteria</th><th>Category</th><th>Score</th><th>Max</th><th>Remarks</th></tr>
          </thead>
          <tbody>
            ${scores.map(s => {
              const cr = criteria.find(c => c.id === s.criteriaId);
              return `
                <tr>
                  <td style="font-weight:600">${cr?.name || 'Criterion #' + s.criteriaId}</td>
                  <td><span class="badge badge-secondary" style="font-size:10px">${cr?.category || 'General'}</span></td>
                  <td><strong style="color:var(--primary)">${s.score}</strong></td>
                  <td>${cr?.maxScore || 5}</td>
                  <td style="font-size:12px;color:var(--text-3)">${s.remarks || '—'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div class="form-row form-row-2">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px">
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase">Merit Salary Increment</div>
          <div style="font-size:14px;font-weight:700;color:${a.incrementRecommended?'var(--success)':'var(--text-3)'};margin-top:4px">
            <i class="fa ${a.incrementRecommended?'fa-circle-check':'fa-circle-xmark'}"></i> ${a.incrementRecommended?'Recommended by Reviewer':'Not Recommended'}
          </div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px">
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase">Role Promotion</div>
          <div style="font-size:14px;font-weight:700;color:${a.promotionRecommended?'var(--primary)':'var(--text-3)'};margin-top:4px">
            <i class="fa ${a.promotionRecommended?'fa-circle-check':'fa-circle-xmark'}"></i> ${a.promotionRecommended?'Recommended for Elevation':'Not Recommended'}
          </div>
        </div>
      </div>
    `, {
      footer: `<button class="btn btn-primary" onclick="Modal.close('dynamic-modal')">Close Scorecard</button>`
    });
  },
};

if (typeof window !== 'undefined') window.Performance = Performance;
if (typeof module !== 'undefined' && module.exports) module.exports = Performance;
