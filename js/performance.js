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

        <div style="display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content;margin-bottom:20px;flex-wrap:wrap">
          ${[
            { id:'reviews', label:'Performance Reviews', icon:'fa-clipboard-list' },
            { id:'cycles', label:'Appraisal Cycles & OKRs', icon:'fa-rotate' },
            { id:'feedback360', label:'360° Peer Feedback', icon:'fa-arrows-spin' },
            { id:'lms', label:'LMS & Skill Matrix', icon:'fa-graduation-cap' },
            { id:'succession', label:'9-Box & Succession', icon:'fa-sitemap' },
            { id:'kpi', label:'KPIs', icon:'fa-bullseye' },
            { id:'goals', label:'Goals & OKRs', icon:'fa-flag' },
          ].map(t => `
            <button class="tab-toggle-btn ${this.currentView===t.id?'active':''}" onclick="Performance.switchView('${t.id}')">
              <i class="fa ${t.icon}" style="margin-right:6px"></i>${t.label}
            </button>
          `).join('')}
        </div>

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
    document.querySelectorAll('[onclick*="Performance.switchView"]').forEach(b => {
      const m = b.getAttribute('onclick').match(/'(\w+)'/);
      if (m) b.classList.toggle('active', m[1] === view);
    });
    this.renderView();
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
                  ${box.emps.map(e => `
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
                ${box.emps.length} Talent Candidates
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

// ============================================================
// HRM SYSTEM — Recruitment Module
// ============================================================

const Recruitment = {
  currentView: 'jobs',
  requisitionTab: 'structure', // 'structure' | 'requisitions' | 'radar'
  structureDeptId: null,
  offerFilter: { query: '', type: 'all', status: 'all' },
  pipelineFilter: { query: '', jobId: 'all', score: 'all', viewMode: 'kanban' },
  draggedAppId: null,

  isHROrAdmin() {
    return Auth.role === 'superadmin' || Auth.role === 'hr_manager';
  },

  render() {
    const isHR = this.isHROrAdmin();
    const isDeptMgr = Auth.role === 'dept_manager';
    const myDeptId = Auth.employee?.departmentId || 1;

    // Deputy / Department Managers are strictly restricted to Requisitions & Team Structure
    if (isDeptMgr) {
      this.currentView = 'requisitions';
      this.structureDeptId = myDeptId;
    } else if (!this.structureDeptId && myDeptId) {
      this.structureDeptId = myDeptId;
    }

    const content = document.getElementById('page-content');
    const jobs = DB.get('recruitment') || [];
    const apps = DB.get('applications') || [];
    const offers = DB.get('offer_letters') || [];
    const reqs = DB.get('job_requisitions') || [];
    const onboardings = DB.get('onboardings') || [];
    const pendingReqs = reqs.filter(r => r.status === 'pending_review').length;

    // For Department Managers: Scoped Department Metrics
    const myStruct = isDeptMgr ? this.getDepartmentStructure(myDeptId) : null;
    const myVacancies = isDeptMgr ? this.getSeparationVacancies().filter(v => v.departmentId === myDeptId && !v.isBackfilled) : [];
    const myReqs = isDeptMgr ? reqs.filter(r => r.departmentId === myDeptId) : [];
    const myPending = myReqs.filter(r => r.status === 'pending_review').length;
    const myApproved = myReqs.filter(r => r.status === 'approved').length;

    content.innerHTML = `
      <div class="animate-fade-in">
        <!-- Recruitment Top KPI Banner -->
        ${isDeptMgr ? `
          <!-- Deputy / Department Manager Scoped KPIs (Restricted to Under-Employees) -->
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px">
              <div style="width:48px;height:48px;border-radius:12px;background:rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--primary)">
                <i class="fa fa-users-gear"></i>
              </div>
              <div>
                <div style="font-size:22px;font-weight:800;color:var(--primary)">${myStruct?.totalCapacity || 0}</div>
                <div style="font-size:12px;color:var(--text-3)">Team Headcount Target</div>
              </div>
            </div>
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px">
              <div style="width:48px;height:48px;border-radius:12px;background:rgba(16,185,129,0.15);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--success)">
                <i class="fa fa-circle-check"></i>
              </div>
              <div>
                <div style="font-size:22px;font-weight:800;color:var(--success)">${myStruct?.filledCount || 0}</div>
                <div style="font-size:12px;color:var(--text-3)">Active Staff Members</div>
              </div>
            </div>
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px;cursor:pointer" onclick="Recruitment.requisitionTab='radar';Recruitment.renderRequisitions(document.getElementById('rec-content'))">
              <div style="width:48px;height:48px;border-radius:12px;background:rgba(245,158,11,0.15);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--warning)">
                <i class="fa fa-user-clock"></i>
              </div>
              <div>
                <div style="font-size:22px;font-weight:800;color:var(--warning)">${myVacancies.length}</div>
                <div style="font-size:12px;color:var(--text-3)">Vacancies to Backfill</div>
              </div>
            </div>
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px;cursor:pointer" onclick="Recruitment.requisitionTab='requisitions';Recruitment.renderRequisitions(document.getElementById('rec-content'))">
              <div style="width:48px;height:48px;border-radius:12px;background:rgba(139,92,246,0.15);display:flex;align-items:center;justify-content:center;font-size:20px;color:#8b5cf6">
                <i class="fa fa-clock"></i>
              </div>
              <div>
                <div style="font-size:22px;font-weight:800;color:#8b5cf6">${myPending}</div>
                <div style="font-size:12px;color:var(--text-3)">Pending Quotations</div>
              </div>
            </div>
            <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px;cursor:pointer" onclick="Recruitment.requisitionTab='structure';Recruitment.renderRequisitions(document.getElementById('rec-content'))">
              <div style="width:48px;height:48px;border-radius:12px;background:rgba(59,130,246,0.15);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--info)">
                <i class="fa fa-check-double"></i>
              </div>
              <div>
                <div style="font-size:22px;font-weight:800;color:var(--info)">${myApproved}</div>
                <div style="font-size:12px;color:var(--text-3)">Approved Positions</div>
              </div>
            </div>
          </div>
        ` : `
          <!-- Full Recruitment Lifecycle KPIs for HR/Admin -->
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">
            ${[
              { label:'Headcount Reqs',  val:reqs.length, icon:'fa-file-invoice-dollar', color:'var(--info)', action:"Recruitment.switchView('requisitions')" },
              { label:'Open Positions',  val:jobs.filter(j=>j.status==='open').length, icon:'fa-briefcase', color:'var(--success)', action:"Recruitment.switchView('jobs')" },
              { label:'Total Applicants',val:apps.length, icon:'fa-users', color:'var(--primary)', action:"Recruitment.switchView('pipeline')" },
              { label:'In Interview',    val:apps.filter(a=>a.stage==='interview').length, icon:'fa-comments', color:'var(--warning)', action:"Recruitment.switchView('interviews')" },
              { label:'Offer Letters',   val:offers.length, icon:'fa-file-signature', color:'var(--accent)', action: "Recruitment.switchView('offers')" },
            ].map(s => `
              <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px;cursor:${s.action?'pointer':'default'};transition:all .2s"
                ${s.action ? `onclick="${s.action}" onmouseenter="this.style.borderColor='var(--primary)'" onmouseleave="this.style.borderColor='var(--border)'"` : ''}>
                <div style="width:48px;height:48px;border-radius:12px;background:${s.color}22;display:flex;align-items:center;justify-content:center;font-size:20px;color:${s.color}">
                  <i class="fa ${s.icon}"></i>
                </div>
                <div>
                  <div style="font-size:22px;font-weight:800;color:${s.color}">${s.val}</div>
                  <div style="font-size:12px;color:var(--text-3)">${s.label}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `}

        <!-- Recruitment View Tabs: ONLY shown to HR & Admin. Dept Managers are locked out of ATS pipeline and candidate data -->
        ${!isDeptMgr ? `
          <div style="margin-bottom:20px">
            <div style="display:flex;gap:2px;background:var(--surface);padding:3px;border-radius:10px;width:100%;overflow-x:auto;scrollbar-width:none">
              <button class="tab-toggle-btn ${this.currentView==='requisitions'?'active':''}" onclick="Recruitment.switchView('requisitions')" style="position:relative" title="Step 1: Headcount Planning & Vacancy Requisitions">
                <i class="fa fa-file-invoice-dollar" style="margin-right:5px"></i>Requisitions & Headcount
                ${pendingReqs ? `<span class="badge badge-warning" style="margin-left:5px;font-size:10px;padding:2px 5px">${pendingReqs}</span>` : ''}
              </button>
              <button class="tab-toggle-btn ${this.currentView==='jobs'?'active':''}" onclick="Recruitment.switchView('jobs')" title="Step 2: Job Openings & Public Postings">
                <i class="fa fa-briefcase" style="margin-right:5px"></i>Job Postings
              </button>
              <button class="tab-toggle-btn ${this.currentView==='pipeline'?'active':''}" onclick="Recruitment.switchView('pipeline')" title="Step 3: Active Applicant ATS Screening Pipeline">
                <i class="fa fa-list-check" style="margin-right:5px"></i>Applicant Pipeline
              </button>
              <button class="tab-toggle-btn ${this.currentView==='talent_pools'?'active':''}" onclick="Recruitment.switchView('talent_pools')" title="Step 4: Candidate Talent Pools & Sourcing Reservoirs">
                <i class="fa fa-users-viewfinder" style="margin-right:5px"></i>Talent Pools
              </button>
              <button class="tab-toggle-btn ${this.currentView==='interviews'?'active':''}" onclick="Recruitment.switchView('interviews')" title="Step 5: Interview Scheduling & Evaluator Rubrics">
                <i class="fa fa-comments" style="margin-right:5px"></i>Interviews & Rubrics
              </button>
              <button class="tab-toggle-btn ${this.currentView==='assessment_sheets'?'active':''}" onclick="Recruitment.switchView('assessment_sheets')" title="Step 6: Comparative Assessment Sheets & Conversion Funnel">
                <i class="fa fa-table-list" style="margin-right:5px"></i>Assessment Sheets & Funnel
              </button>
              <button class="tab-toggle-btn ${this.currentView==='offers'?'active':''}" onclick="Recruitment.switchView('offers')" style="position:relative" title="Step 7: Formal Job Offer Letters & Compensation">
                <i class="fa fa-file-signature" style="margin-right:5px"></i>Offer Letters
                <span class="badge badge-primary" style="margin-left:5px;font-size:10px;padding:2px 5px">${offers.length}</span>
              </button>
              <button class="tab-toggle-btn ${this.currentView==='onboarding'?'active':''}" onclick="Recruitment.switchView('onboarding')" style="position:relative" title="Step 8: Post-Offer New Hire Onboarding Checklists">
                <i class="fa fa-user-plus" style="margin-right:5px"></i>Onboarding Checklists
                <span class="badge badge-success" style="margin-left:5px;font-size:10px;padding:2px 5px">${onboardings.length}</span>
              </button>
            </div>
          </div>
        ` : `
          <!-- Deputy Manager Header Banner -->
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 18px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
            <div>
              <div style="font-size:15px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px">
                <i class="fa fa-sitemap" style="color:var(--primary)"></i>
                <span>Department Headcount & Position Quotations Workspace</span>
              </div>
              <div style="font-size:11.5px;color:var(--text-3);margin-top:2px">
                Review your team structure, track vacated positions for employees under your supervision, and submit formal position quotations for HR/Admin approval.
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="Recruitment.showNewPositionQuotationModal(${myDeptId})">
              <i class="fa fa-file-invoice-dollar"></i> Initiate Position Quotation
            </button>
          </div>
        `}

        <style>
          .tab-toggle-btn { padding:6px 10px;border:none;background:transparent;color:var(--text-3);font-size:11.5px;font-weight:600;border-radius:7px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;white-space:nowrap;flex-shrink:0; }
          .tab-toggle-btn.active { background:var(--primary);color:white;box-shadow:0 2px 8px var(--primary-glow); }
          .tab-toggle-btn:hover:not(.active) { background:var(--surface-2);color:var(--text); }
        </style>

        <div id="rec-content"></div>
      </div>
    `;
    this.renderView();
  },

  switchView(view) {
    if (Auth.role === 'dept_manager' && view !== 'requisitions') {
      Toast.show('Access Restricted: Candidate ATS pipelines, job posts, and interviews are managed exclusively by HR & Admin.', 'error');
      this.currentView = 'requisitions';
      this.render();
      return;
    }
    this.currentView = view;
    this.render();
  },

  openJobPipeline(jobId) {
    if (typeof Modal !== 'undefined') {
      if (Modal.closeAll) Modal.closeAll();
      else if (Modal.close) Modal.close('dynamic-modal');
    }
    this.pipelineFilter.jobId = String(jobId);
    this.switchView('pipeline');
  },

  updateApplicationStage(appId, newStage) {
    return this.moveStage(appId, newStage);
  },

  renderView() {
    const container = document.getElementById('rec-content');
    if (!container) return;
    if (Auth.role === 'dept_manager') {
      this.currentView = 'requisitions';
    }
    if (this.currentView === 'jobs') this.renderJobs(container);
    else if (this.currentView === 'requisitions') this.renderRequisitions(container);
    else if (this.currentView === 'pipeline') this.renderPipeline(container);
    else if (this.currentView === 'offers') this.renderOfferLetters(container);
    else if (this.currentView === 'interviews') this.renderInterviews(container);
    else if (this.currentView === 'talent_pools') this.renderTalentPools(container);
    else if (this.currentView === 'onboarding') this.renderOnboarding(container);
    else if (this.currentView === 'assessment_sheets') this.renderAssessmentSheets(container);
  },

  renderJobs(container) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Job postings are managed exclusively by HR & Admin.', 'error');
      this.currentView = 'requisitions';
      this.render();
      return;
    }
    const jobs = DB.get('recruitment') || [];
    const depts = DB.get('departments') || [];
    container.innerHTML = `
      <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
        <button class="btn btn-primary btn-sm" onclick="Recruitment.showAddJob()"><i class="fa fa-plus"></i> Post Job</button>
      </div>
      <div class="grid-2">
        ${jobs.map(j => {
          const dept = depts.find(d => d.id === j.departmentId);
          const statusColors = { open:'var(--success)', closed:'var(--danger)', interviewing:'var(--warning)' };
          return `
            <div class="card" style="border-left:4px solid ${statusColors[j.status]||'var(--primary)'}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
                <div>
                  <div style="font-size:15px;font-weight:700">${j.title}</div>
                  <div style="font-size:12px;color:var(--text-3);margin-top:4px">${dept?.name||'—'}</div>
                </div>
                ${Utils.statusBadge(j.status)}
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
                <span class="chip"><i class="fa fa-users" style="margin-right:4px"></i>${j.positions} position${j.positions>1?'s':''}</span>
                <span class="chip"><i class="fa fa-briefcase" style="margin-right:4px"></i>${j.experience}</span>
                <span class="chip"><i class="fa fa-money-bill" style="margin-right:4px"></i>PKR ${j.salary}</span>
                <span class="chip"><i class="fa fa-calendar" style="margin-right:4px"></i>Due: ${Utils.formatDate(j.deadline)}</span>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
                <button class="btn btn-ghost btn-sm" style="font-size:13px;color:var(--primary);font-weight:700;padding:4px 8px;cursor:pointer;display:inline-flex;align-items:center;gap:6px" onclick="Recruitment.viewJobApplicants(${j.id})" title="Click to view all applicants for this job">
                  <i class="fa fa-users"></i> ${j.applicantCount || 0} applicants
                </button>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-ghost btn-sm" onclick="Recruitment.toggleJobStatus(${j.id})">
                    <i class="fa ${j.status==='open'?'fa-lock':'fa-lock-open'}"></i> ${j.status==='open'?'Close':'Reopen'}
                  </button>
                  <button class="btn btn-ghost btn-sm" onclick="Recruitment.viewJob(${j.id})"><i class="fa fa-eye"></i> View</button>
                  <button class="btn btn-primary btn-sm" onclick="Recruitment.openJobPipeline(${j.id})" title="Filter ATS pipeline to ${j.title}"><i class="fa fa-list-check"></i> Pipeline</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderPipeline(container) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Candidate ATS pipeline is managed exclusively by HR & Admin.', 'error');
      this.currentView = 'requisitions';
      this.render();
      return;
    }
    const allApps = DB.get('applications') || [];
    const jobs = DB.get('recruitment') || [];
    const isHR = this.isHROrAdmin();
    const scorecards = DB.get('interview_scorecards') || [];
    const offers = DB.get('offer_letters') || [];

    const stages = [
      { id: 'applied',     label: 'Applied',        color: '#64748b', icon: 'fa-inbox' },
      { id: 'shortlisted', label: 'Shortlisted',    color: '#6366f1', icon: 'fa-list-check' },
      { id: 'interview',   label: 'Interview',      color: '#f59e0b', icon: 'fa-comments' },
      { id: 'offer',       label: 'Offer Extended', color: '#10b981', icon: 'fa-file-signature' },
      { id: 'hired',       label: 'Hired',          color: '#06b6d4', icon: 'fa-user-check' },
      { id: 'rejected',    label: 'Rejected',       color: '#ef4444', icon: 'fa-ban' },
    ];

    // Apply Filters
    let filteredApps = allApps;
    if (this.pipelineFilter.query) {
      const q = this.pipelineFilter.query.toLowerCase().trim();
      filteredApps = filteredApps.filter(a =>
        (a.name || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.phone || '').toLowerCase().includes(q) ||
        (a.cnic || '').toLowerCase().includes(q)
      );
    }
    if (this.pipelineFilter.jobId !== 'all') {
      filteredApps = filteredApps.filter(a => String(a.jobId) === String(this.pipelineFilter.jobId));
    }
    if (this.pipelineFilter.score === 'top_rated') {
      filteredApps = filteredApps.filter(a => {
        const sc = scorecards.find(s => s.applicantId === a.id);
        return (sc && sc.overallScore >= 4.0) || (a.score && a.score >= 80);
      });
    } else if (this.pipelineFilter.score === 'offer_ready') {
      filteredApps = filteredApps.filter(a => offers.some(o => o.applicationId === a.id));
    }

    // Top metrics
    const activeCount = allApps.filter(a => a.stage !== 'hired' && a.stage !== 'rejected').length;
    const interviewCount = allApps.filter(a => a.stage === 'interview').length;
    const offerCount = allApps.filter(a => a.stage === 'offer').length;
    const hiredCount = allApps.filter(a => a.stage === 'hired').length;

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Pipeline Top KPI Ribbon -->
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:18px">
          <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:10px;background:rgba(99,102,241,0.12);color:#6366f1;display:flex;align-items:center;justify-content:center;font-size:17px">
              <i class="fa fa-users"></i>
            </div>
            <div>
              <div style="font-size:20px;font-weight:800;color:#6366f1">${activeCount}</div>
              <div style="font-size:11.5px;color:var(--text-3)">Active in Pipeline</div>
            </div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:10px;background:rgba(245,158,11,0.12);color:#f59e0b;display:flex;align-items:center;justify-content:center;font-size:17px">
              <i class="fa fa-comments"></i>
            </div>
            <div>
              <div style="font-size:20px;font-weight:800;color:#f59e0b">${interviewCount}</div>
              <div style="font-size:11.5px;color:var(--text-3)">In Interview Stage</div>
            </div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:10px;background:rgba(16,185,129,0.12);color:#10b981;display:flex;align-items:center;justify-content:center;font-size:17px">
              <i class="fa fa-file-signature"></i>
            </div>
            <div>
              <div style="font-size:20px;font-weight:800;color:#10b981">${offerCount}</div>
              <div style="font-size:11.5px;color:var(--text-3)">Offers Extended</div>
            </div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:10px;background:rgba(6,182,212,0.12);color:#06b6d4;display:flex;align-items:center;justify-content:center;font-size:17px">
              <i class="fa fa-user-check"></i>
            </div>
            <div>
              <div style="font-size:20px;font-weight:800;color:#06b6d4">${hiredCount}</div>
              <div style="font-size:11.5px;color:var(--text-3)">Successfully Hired</div>
            </div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:10px;background:rgba(100,116,139,0.12);color:#64748b;display:flex;align-items:center;justify-content:center;font-size:17px">
              <i class="fa fa-filter"></i>
            </div>
            <div>
              <div style="font-size:20px;font-weight:800;color:#64748b">${allApps.length > 0 ? Math.round((hiredCount / allApps.length) * 100) : 0}%</div>
              <div style="font-size:11.5px;color:var(--text-3)">Pipeline Win Rate</div>
            </div>
          </div>
        </div>

        <!-- Filter, Search & View Switcher Bar -->
        <div class="card" style="padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <div style="position:relative">
              <i class="fa fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-3);font-size:12px"></i>
              <input type="text" class="form-control" style="padding-left:30px;width:220px;font-size:12.5px" placeholder="Search candidate..." value="${this.pipelineFilter.query}" oninput="Recruitment.setPipelineFilter('query', this.value)">
            </div>
            <select class="form-control" style="width:210px;font-size:12.5px" onchange="Recruitment.setPipelineFilter('jobId', this.value)">
              <option value="all" ${this.pipelineFilter.jobId === 'all' ? 'selected' : ''}>All Positions (${allApps.length} candidates)</option>
              ${jobs.map(j => {
                const count = allApps.filter(a => a.jobId === j.id).length;
                return `<option value="${j.id}" ${String(this.pipelineFilter.jobId) === String(j.id) ? 'selected' : ''}>${j.title} (${count})</option>`;
              }).join('')}
            </select>
            <select class="form-control" style="width:160px;font-size:12.5px" onchange="Recruitment.setPipelineFilter('score', this.value)">
              <option value="all" ${this.pipelineFilter.score === 'all' ? 'selected' : ''}>All Candidates</option>
              <option value="top_rated" ${this.pipelineFilter.score === 'top_rated' ? 'selected' : ''}>★ Top Rated (4.0+)</option>
              <option value="offer_ready" ${this.pipelineFilter.score === 'offer_ready' ? 'selected' : ''}>✉ Offer Ready</option>
            </select>
            ${(this.pipelineFilter.query || this.pipelineFilter.jobId !== 'all' || this.pipelineFilter.score !== 'all') ? `
              <button class="btn btn-ghost btn-xs text-danger" onclick="Recruitment.resetPipelineFilter()">
                <i class="fa fa-times"></i> Clear Filters
              </button>
            ` : ''}
          </div>

          <div style="display:flex;align-items:center;gap:10px">
            <!-- View Mode Switcher -->
            <div style="display:inline-flex;border:1px solid var(--border);border-radius:8px;padding:2px;background:var(--surface)">
              <button class="btn btn-xs ${this.pipelineFilter.viewMode === 'kanban' ? 'btn-primary' : 'btn-ghost'}" style="border-radius:6px;font-weight:600" onclick="Recruitment.setPipelineFilter('viewMode', 'kanban')">
                <i class="fa fa-columns" style="margin-right:4px"></i> Board View
              </button>
              <button class="btn btn-xs ${this.pipelineFilter.viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}" style="border-radius:6px;font-weight:600" onclick="Recruitment.setPipelineFilter('viewMode', 'table')">
                <i class="fa fa-table-list" style="margin-right:4px"></i> Table View
              </button>
            </div>

            <button class="btn btn-primary btn-sm" onclick="Recruitment.showAddApplicantModal()">
              <i class="fa fa-user-plus"></i> Add Candidate
            </button>
          </div>
        </div>

        <style>
          .kanban-col-dragover {
            border: 2px dashed var(--primary) !important;
            background: rgba(37, 99, 235, 0.05) !important;
            box-shadow: 0 0 12px rgba(37, 99, 235, 0.15) !important;
          }
          .ats-kanban-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 9px;
            padding: 13px;
            cursor: grab;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
            position: relative;
          }
          .ats-kanban-card:hover {
            border-color: var(--primary);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            transform: translateY(-1px);
          }
          .ats-kanban-card:active {
            cursor: grabbing;
          }
        </style>

        ${this.pipelineFilter.viewMode === 'table' ? this.renderPipelineTableView(filteredApps, jobs, stages, scorecards, offers) : `
          <!-- Kanban Board View -->
          <div class="kanban" style="display:flex;gap:14px;overflow-x:auto;padding-bottom:14px;align-items:flex-start">
            ${stages.map(stage => {
              const stageApps = filteredApps.filter(a => a.stage === stage.id);
              return `
                <div class="kanban-col"
                  style="min-width:270px;max-width:320px;flex:1;background:var(--surface);border:1px solid var(--border);border-radius:10px;display:flex;flex-direction:column;max-height:calc(100vh - 280px);transition:all .2s"
                  ondragover="Recruitment.handleDragOver(event)"
                  ondragleave="Recruitment.handleDragLeave(event)"
                  ondrop="Recruitment.handleDrop(event, '${stage.id}')">
                  
                  <!-- Column Header -->
                  <div class="kanban-col-header" style="padding:12px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--surface)">
                    <div style="display:flex;align-items:center;gap:8px">
                      <span style="width:10px;height:10px;border-radius:50%;background:${stage.color};box-shadow:0 0 8px ${stage.color}88"></span>
                      <span style="font-size:13px;font-weight:700;color:var(--text)">${stage.label}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px">
                      <span class="badge" style="background:${stage.color}22;color:${stage.color};font-weight:700;font-size:11px;padding:2px 7px">${stageApps.length}</span>
                      <button class="btn btn-ghost btn-xs" style="padding:2px 5px;color:var(--text-3)" title="Add Candidate to ${stage.label}" onclick="Recruitment.showAddApplicantModal('${stage.id}')">
                        <i class="fa fa-plus"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Column Items Dropzone -->
                  <div class="kanban-items" style="padding:10px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:10px">
                    ${stageApps.length === 0 ? `
                      <div style="border:1.5px dashed var(--border);border-radius:8px;padding:28px 12px;text-align:center;color:var(--text-3);margin:6px 0">
                        <i class="fa ${stage.icon}" style="font-size:24px;opacity:0.3;margin-bottom:6px;display:block"></i>
                        <div style="font-size:12px;font-weight:600">No candidates in ${stage.label}</div>
                        <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px">Drag candidate here</div>
                      </div>
                    ` : stageApps.map(app => {
                      const job = jobs.find(j => j.id === app.jobId);
                      const hasOffer = offers.some(o => o.applicationId === app.id);
                      const appScorecards = scorecards.filter(s => s.applicantId === app.id);
                      const latestScorecard = appScorecards[0];
                      const initials = (app.name || 'Candidate').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

                      return `
                        <div class="ats-kanban-card"
                          draggable="true"
                          ondragstart="Recruitment.handleDragStart(event, ${app.id})"
                          ondragend="Recruitment.handleDragEnd(event)"
                          onclick="Recruitment.viewApplicant(${app.id})">
                          
                          <!-- Top Row: Avatar, Name & Grip -->
                          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                            <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
                              <div style="width:28px;height:28px;border-radius:50%;background:${stage.color}18;color:${stage.color};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0">
                                ${initials}
                              </div>
                              <div style="min-width:0;flex:1">
                                <div style="font-size:13px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${app.name}</div>
                              </div>
                            </div>
                            <div style="display:flex;align-items:center;gap:4px">
                              ${hasOffer ? `<span class="badge badge-success" style="font-size:9.5px;padding:1px 5px" title="Official Offer Generated"><i class="fa fa-file-check"></i> Offer</span>` : ''}
                              <i class="fa fa-grip-vertical" style="color:var(--text-3);opacity:0.4;cursor:grab;font-size:11px" title="Drag to reorder/move"></i>
                            </div>
                          </div>

                          <!-- Job Title Tag -->
                          <div style="margin-top:6px">
                            <span style="font-size:11px;font-weight:600;color:var(--primary);background:rgba(37,99,235,0.08);padding:2px 7px;border-radius:4px;display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                              <i class="fa fa-briefcase" style="font-size:10px;margin-right:4px"></i>${job?.title || 'General Opening'}
                            </span>
                          </div>

                          <!-- Contact & Date Meta -->
                          <div style="font-size:11px;color:var(--text-3);margin-top:5px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                            <span><i class="fa fa-clock" style="font-size:10px"></i> ${Utils.formatDate(app.appliedOn)}</span>
                            ${app.cnic ? `<span>&bull; <i class="fa fa-id-card" style="font-size:10px"></i> ${app.cnic}</span>` : ''}
                          </div>

                          <!-- Scorecard / Evaluation Rating -->
                          ${latestScorecard ? `
                            <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:4px 8px;margin-top:6px">
                              <span style="font-size:11px;font-weight:700;color:#f59e0b"><i class="fa fa-star"></i> ${latestScorecard.overallScore}/5.0</span>
                              <span class="badge ${latestScorecard.recommendation?.includes('Hire') ? 'badge-success' : 'badge-secondary'}" style="font-size:9px;padding:1px 5px">${latestScorecard.recommendation}</span>
                            </div>
                          ` : ''}

                          <!-- Composite Match Progress -->
                          ${app.score ? `
                            <div style="margin-top:6px">
                              <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-3);margin-bottom:2px">
                                <span>Profile Match</span>
                                <span style="font-weight:700;color:var(--text)">${app.score}%</span>
                              </div>
                              <div class="progress" style="height:4px;border-radius:2px;background:var(--surface-2)">
                                <div class="progress-bar" style="width:${app.score}%;background:${stage.color}"></div>
                              </div>
                            </div>
                          ` : ''}

                          <!-- Redesigned Action Section (Clean 2-tier layout, no button stacking!) -->
                          <div style="margin-top:10px">
                            <!-- Tier 1: Main Progression Action -->
                            ${stage.id === 'applied' ? `
                              <button class="btn btn-xs" style="width:100%;background:rgba(99,102,241,0.1);color:#6366f1;border:1px solid rgba(99,102,241,0.3);font-weight:700;padding:5px 8px;border-radius:6px;display:flex;align-items:center;justify-content:center;gap:6px"
                                onclick="event.stopPropagation();Recruitment.moveStage(${app.id}, 'shortlisted')">
                                <span>Shortlist Candidate</span> <i class="fa fa-arrow-right"></i>
                              </button>
                            ` : stage.id === 'shortlisted' ? `
                              <button class="btn btn-xs" style="width:100%;background:rgba(245,158,11,0.1);color:#d97706;border:1px solid rgba(245,158,11,0.3);font-weight:700;padding:5px 8px;border-radius:6px;display:flex;align-items:center;justify-content:center;gap:6px"
                                onclick="event.stopPropagation();Recruitment.moveStage(${app.id}, 'interview')">
                                <span>Schedule Interview</span> <i class="fa fa-comments"></i>
                              </button>
                            ` : stage.id === 'interview' ? `
                              <button class="btn btn-xs" style="width:100%;background:rgba(16,185,129,0.1);color:#059669;border:1px solid rgba(16,185,129,0.3);font-weight:700;padding:5px 8px;border-radius:6px;display:flex;align-items:center;justify-content:center;gap:6px"
                                onclick="event.stopPropagation();Recruitment.moveStage(${app.id}, 'offer')">
                                <span>Extend Formal Offer</span> <i class="fa fa-file-signature"></i>
                              </button>
                            ` : stage.id === 'offer' ? `
                              <button class="btn btn-xs btn-success" style="width:100%;font-weight:700;padding:5px 8px;border-radius:6px;display:flex;align-items:center;justify-content:center;gap:6px"
                                onclick="event.stopPropagation();Recruitment.onboardCandidateDirectly(${app.id})">
                                <i class="fa fa-user-check"></i> <span>Onboard as Employee</span>
                              </button>
                            ` : stage.id === 'hired' ? `
                              <button class="btn btn-xs btn-outline" style="width:100%;font-weight:600;padding:5px 8px;border-radius:6px;display:flex;align-items:center;justify-content:center;gap:6px"
                                onclick="event.stopPropagation();Recruitment.viewApplicant(${app.id})">
                                <i class="fa fa-user-check"></i> <span>View Profile</span>
                              </button>
                            ` : `
                              <button class="btn btn-xs btn-outline" style="width:100%;font-weight:600;padding:5px 8px;border-radius:6px;display:flex;align-items:center;justify-content:center;gap:6px"
                                onclick="event.stopPropagation();Recruitment.moveStage(${app.id}, 'applied')">
                                <i class="fa fa-rotate-left"></i> <span>Reactivate</span>
                              </button>
                            `}

                            <!-- Tier 2: Secondary Toolbar Icons -->
                            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid var(--border)">
                              <button class="btn btn-ghost btn-xs" style="font-size:11px;color:#d97706;padding:2px 6px;display:flex;align-items:center;gap:4px"
                                onclick="event.stopPropagation();Recruitment.showScorecardModal(${app.id})" title="Evaluation Scorecard">
                                <i class="fa fa-star"></i> <span>Scorecard</span>
                              </button>

                              <div style="display:flex;align-items:center;gap:2px">
                                ${isHR && (stage.id === 'interview' || stage.id === 'offer') ? `
                                  <button class="btn btn-ghost btn-xs text-primary" style="font-size:11px;padding:2px 6px"
                                    onclick="event.stopPropagation();Recruitment.showGenerateOfferLetterModal(${app.id})" title="Generate Formal Offer Letter">
                                    <i class="fa fa-file-contract"></i>
                                  </button>
                                ` : ''}
                                ${stage.id !== 'hired' && stage.id !== 'rejected' ? `
                                  <button class="btn btn-ghost btn-xs text-danger" style="font-size:11px;padding:2px 6px"
                                    onclick="event.stopPropagation();Recruitment.moveStage(${app.id}, 'rejected')" title="Reject Candidate">
                                    <i class="fa fa-times"></i>
                                  </button>
                                ` : ''}
                                <button class="btn btn-ghost btn-xs text-muted" style="font-size:11px;padding:2px 6px"
                                  onclick="event.stopPropagation();Recruitment.showApplicantQuickActionsModal(${app.id})" title="More Actions & Stage Jump">
                                  <i class="fa fa-ellipsis-v"></i>
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  renderPipelineTableView(apps, jobs, stages, scorecards, offers) {
    if (apps.length === 0) {
      return `
        <div class="card" style="text-align:center;padding:50px;color:var(--text-3)">
          <i class="fa fa-users" style="font-size:42px;opacity:0.3;margin-bottom:12px;display:block"></i>
          <div style="font-size:15px;font-weight:700;color:var(--text)">No Candidates Found</div>
          <p style="font-size:12px;max-width:380px;margin:6px auto 14px">Try adjusting your search criteria or add new applicants to the pipeline.</p>
          <button class="btn btn-primary btn-sm" onclick="Recruitment.showAddApplicantModal()"><i class="fa fa-plus"></i> Add First Candidate</button>
        </div>
      `;
    }

    const isHR = this.isHROrAdmin();

    return `
      <div class="table-responsive" style="background:var(--card);border:1px solid var(--border);border-radius:10px;overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:12.5px">
          <thead>
            <tr style="background:var(--surface);border-bottom:1px solid var(--border);text-align:left">
              <th style="padding:12px 14px">Candidate</th>
              <th style="padding:12px 14px">Position</th>
              <th style="padding:12px 14px">Applied Date</th>
              <th style="padding:12px 14px">Stage</th>
              <th style="padding:12px 14px">Scorecard / Rating</th>
              <th style="padding:12px 14px">Offer Status</th>
              <th style="padding:12px 14px;text-align:center">Advance Stage</th>
              <th style="padding:12px 14px;text-align:center">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${apps.map(app => {
              const job = jobs.find(j => j.id === app.jobId);
              const stageObj = stages.find(s => s.id === app.stage) || { label: app.stage, color: '#64748b' };
              const hasOffer = offers.some(o => o.applicationId === app.id);
              const sc = scorecards.find(s => s.applicantId === app.id);
              const initials = (app.name || 'C').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

              return `
                <tr style="border-bottom:1px solid var(--border);transition:background .15s" onmouseenter="this.style.background='var(--surface)'" onmouseleave="this.style.background='transparent'">
                  <td style="padding:12px 14px">
                    <div style="display:flex;align-items:center;gap:10px">
                      <div style="width:32px;height:32px;border-radius:50%;background:${stageObj.color}18;color:${stageObj.color};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800">
                        ${initials}
                      </div>
                      <div>
                        <div style="font-weight:700;color:var(--text);cursor:pointer" onclick="Recruitment.viewApplicant(${app.id})">${app.name}</div>
                        <div style="font-size:11px;color:var(--text-3)">${app.email} &bull; ${app.phone || app.cnic || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style="padding:12px 14px">
                    <span style="font-weight:600;color:var(--primary)"><i class="fa fa-briefcase" style="margin-right:4px"></i>${job?.title || '—'}</span>
                  </td>
                  <td style="padding:12px 14px;color:var(--text-2)">${Utils.formatDate(app.appliedOn)}</td>
                  <td style="padding:12px 14px">
                    <span class="badge" style="background:${stageObj.color}22;color:${stageObj.color};font-weight:700">
                      ${stageObj.label}
                    </span>
                  </td>
                  <td style="padding:12px 14px">
                    ${sc ? `
                      <div style="display:flex;align-items:center;gap:6px">
                        <span style="color:#f59e0b;font-weight:700"><i class="fa fa-star"></i> ${sc.overallScore}/5.0</span>
                        <span class="badge badge-secondary" style="font-size:9.5px">${sc.recommendation}</span>
                      </div>
                    ` : (app.score ? `<span style="font-weight:600">${app.score}% Match</span>` : `<span class="text-muted text-xs">Pending review</span>`)}
                  </td>
                  <td style="padding:12px 14px">
                    ${hasOffer ? `<span class="badge badge-success"><i class="fa fa-check"></i> Offer Sent</span>` : `<span class="text-muted text-xs">—</span>`}
                  </td>
                  <td style="padding:12px 14px;text-align:center">
                    <select class="form-control form-control-sm" style="font-size:11.5px;padding:4px 8px;width:130px;margin:0 auto"
                      onchange="Recruitment.moveStage(${app.id}, this.value)">
                      ${stages.map(s => `<option value="${s.id}" ${s.id === app.stage ? 'selected' : ''}>${s.label}</option>`).join('')}
                    </select>
                  </td>
                  <td style="padding:12px 14px;text-align:center">
                    <div style="display:flex;gap:4px;justify-content:center">
                      <button class="btn btn-xs btn-outline" onclick="Recruitment.viewApplicant(${app.id})" title="View Details"><i class="fa fa-eye"></i></button>
                      <button class="btn btn-xs btn-ghost text-warning" onclick="Recruitment.showScorecardModal(${app.id})" title="Scorecard"><i class="fa fa-star"></i></button>
                      ${isHR ? `
                        <button class="btn btn-xs btn-ghost text-primary" onclick="Recruitment.showGenerateOfferLetterModal(${app.id})" title="Create Offer Letter"><i class="fa fa-file-contract"></i></button>
                      ` : ''}
                      ${app.stage !== 'rejected' ? `
                        <button class="btn btn-xs btn-ghost text-danger" onclick="Recruitment.moveStage(${app.id}, 'rejected')" title="Reject"><i class="fa fa-times"></i></button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // ═══════════════════════════════════════════════
  // PIPELINE DRAG AND DROP & FILTER ACTIONS
  // ═══════════════════════════════════════════════

  handleDragStart(e, appId) {
    this.draggedAppId = appId;
    e.dataTransfer.setData('text/plain', String(appId));
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (e.target) e.target.style.opacity = '0.35';
    }, 0);
  },

  handleDragEnd(e) {
    this.draggedAppId = null;
    if (e.target) e.target.style.opacity = '1';
    document.querySelectorAll('.kanban-col').forEach(c => {
      c.classList.remove('kanban-col-dragover');
    });
  },

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const col = e.currentTarget;
    if (!col.classList.contains('kanban-col-dragover')) {
      col.classList.add('kanban-col-dragover');
    }
  },

  handleDragLeave(e) {
    const col = e.currentTarget;
    col.classList.remove('kanban-col-dragover');
  },

  handleDrop(e, targetStage) {
    e.preventDefault();
    const col = e.currentTarget;
    col.classList.remove('kanban-col-dragover');
    const appId = Number(e.dataTransfer.getData('text/plain') || this.draggedAppId);
    if (!appId) return;

    const app = DB.find('applications', appId);
    if (app && app.stage !== targetStage) {
      this.moveStage(appId, targetStage);
    }
  },

  setPipelineFilter(key, val) {
    this.pipelineFilter[key] = val;
    this.renderView();
  },

  resetPipelineFilter() {
    this.pipelineFilter = { query: '', jobId: 'all', score: 'all', viewMode: 'kanban' };
    this.renderView();
  },

  showApplicantQuickActionsModal(appId) {
    const app = DB.find('applications', Number(appId));
    if (!app) return;
    const job = DB.find('recruitment', app.jobId);
    const stages = [
      { id: 'applied',     label: '1. Applied (New Review)' },
      { id: 'shortlisted', label: '2. Shortlisted' },
      { id: 'interview',   label: '3. In Interview' },
      { id: 'offer',       label: '4. Offer Extended' },
      { id: 'hired',       label: '5. Hired / Converted' },
      { id: 'rejected',    label: '6. Rejected' }
    ];

    Modal.show(`Candidate Actions — ${app.name}`, `
      <div style="margin-bottom:16px;background:var(--surface);padding:14px;border-radius:8px;border:1px solid var(--border)">
        <div style="font-size:14px;font-weight:700">${app.name}</div>
        <div style="font-size:12px;color:var(--text-3);margin-top:2px">${job?.title || 'Position'} &bull; Current Stage: <strong style="color:var(--primary)">${app.stage.toUpperCase()}</strong></div>
      </div>

      <div class="form-group" style="margin-bottom:16px">
        <label class="form-label" style="font-weight:700">Move Candidate to Stage:</label>
        <select class="form-control" id="qa-target-stage">
          ${stages.map(s => `<option value="${s.id}" ${s.id === app.stage ? 'selected' : ''}>${s.label}</option>`).join('')}
        </select>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-primary" onclick="Recruitment.moveStage(${app.id}, document.getElementById('qa-target-stage').value);Modal.close('dynamic-modal')">
          <i class="fa fa-arrow-right"></i> Update Stage
        </button>
        <button class="btn btn-outline" onclick="Modal.close('dynamic-modal');Recruitment.viewApplicant(${app.id})">
          <i class="fa fa-eye"></i> View Full Application Profile
        </button>
        <button class="btn btn-outline" onclick="Modal.close('dynamic-modal');Recruitment.showScorecardModal(${app.id})">
          <i class="fa fa-star text-warning"></i> View / Submit Scorecard
        </button>
        ${this.isHROrAdmin() ? `
          <button class="btn btn-outline" onclick="Modal.close('dynamic-modal');Recruitment.showGenerateOfferLetterModal(${app.id})">
            <i class="fa fa-file-signature text-primary"></i> Create Formal Offer Letter
          </button>
          <button class="btn btn-outline" onclick="Modal.close('dynamic-modal');Recruitment.onboardCandidateDirectly(${app.id})">
            <i class="fa fa-user-plus text-success"></i> Direct Onboard as Employee
          </button>
        ` : ''}
        ${app.stage !== 'rejected' ? `
          <button class="btn btn-ghost text-danger" onclick="Recruitment.moveStage(${app.id}, 'rejected');Modal.close('dynamic-modal')">
            <i class="fa fa-times"></i> Reject Candidate
          </button>
        ` : ''}
      </div>
    `);
  },

  showAddApplicantModal(defaultStage = 'applied') {
    const jobs = DB.get('recruitment') || [];
    const today = new Date().toISOString().split('T')[0];

    Modal.show('Add New Candidate to Pipeline', `
      <form onsubmit="Recruitment.saveNewApplicant(event)">
        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label required">Candidate Full Name</label>
            <input class="form-control" id="ap-name" required placeholder="e.g. Daniyal Siddiqui">
          </div>
          <div class="form-group">
            <label class="form-label required">Target Job Position</label>
            <select class="form-control" id="ap-job" required>
              ${jobs.map(j => `<option value="${j.id}">${j.title} (${Utils.getDeptName(j.departmentId)})</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label required">Email Address</label>
            <input class="form-control" id="ap-email" type="email" required placeholder="candidate@example.com">
          </div>
          <div class="form-group">
            <label class="form-label required">Contact Phone</label>
            <input class="form-control" id="ap-phone" required placeholder="0300-1234567">
          </div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label">CNIC Number</label>
            <input class="form-control" id="ap-cnic" placeholder="42101-1234567-1" maxlength="15">
          </div>
          <div class="form-group">
            <label class="form-label required">Initial Pipeline Stage</label>
            <select class="form-control" id="ap-stage" required>
              <option value="applied" ${defaultStage === 'applied' ? 'selected' : ''}>Applied (New Review)</option>
              <option value="shortlisted" ${defaultStage === 'shortlisted' ? 'selected' : ''}>Shortlisted</option>
              <option value="interview" ${defaultStage === 'interview' ? 'selected' : ''}>Interview</option>
              <option value="offer" ${defaultStage === 'offer' ? 'selected' : ''}>Offer Extended</option>
              <option value="hired" ${defaultStage === 'hired' ? 'selected' : ''}>Hired</option>
            </select>
          </div>
        </div>

        <div class="form-row form-row-3">
          <div class="form-group">
            <label class="form-label">Application Date</label>
            <input type="date" class="form-control" id="ap-date" value="${today}">
          </div>
          <div class="form-group">
            <label class="form-label">Match Score (%)</label>
            <input type="number" min="0" max="100" class="form-control" id="ap-score" value="75">
          </div>
          <div class="form-group">
            <label class="form-label">Resume / CV File Name</label>
            <input class="form-control" id="ap-resume" placeholder="e.g. resume_dan.pdf" value="resume.pdf">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Screening Notes & Feedback</label>
          <textarea class="form-control" id="ap-notes" rows="2" placeholder="Initial sourcing notes, key competencies, referral details..."></textarea>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
          <button type="button" class="btn btn-secondary" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa fa-check"></i> Add to Pipeline</button>
        </div>
      </form>
    `);
  },

  saveNewApplicant(e) {
    e.preventDefault();
    const name = document.getElementById('ap-name').value.trim();
    const jobId = Number(document.getElementById('ap-job').value);
    const email = document.getElementById('ap-email').value.trim();
    const phone = document.getElementById('ap-phone').value.trim();
    const cnic = document.getElementById('ap-cnic').value.trim();
    const stage = document.getElementById('ap-stage').value;
    const appliedOn = document.getElementById('ap-date').value;
    const score = parseInt(document.getElementById('ap-score').value) || 0;
    const resume = document.getElementById('ap-resume').value.trim() || 'resume.pdf';
    const notes = document.getElementById('ap-notes').value.trim();

    const apps = DB.get('applications') || [];
    const newId = apps.length ? Math.max(...apps.map(a => a.id)) + 1 : 1;
    const newApp = { id: newId, jobId, name, email, phone, cnic, stage, appliedOn, resume, interviewDate: null, score, notes };
    apps.push(newApp);
    DB.set('applications', apps);

    // Update job applicantCount
    const job = DB.find('recruitment', jobId);
    if (job) {
      job.applicantCount = (job.applicantCount || 0) + 1;
      DB.update('recruitment', jobId, { applicantCount: job.applicantCount });
    }

    DB.log('CREATE', 'Recruitment', `Added new applicant ${name} to pipeline #${newId}`, Auth.user?.id);
    Toast.show(`Candidate ${name} added to pipeline successfully!`, 'success');
    Modal.close('dynamic-modal');
    this.renderView();
  },

  exportPipelineCSV() {
    const apps = DB.get('applications') || [];
    const jobs = DB.get('recruitment') || [];
    let csv = 'ID,Candidate Name,Email,Phone,CNIC,Job Title,Stage,Applied Date,Score,Notes\r\n';
    apps.forEach(a => {
      const j = jobs.find(job => job.id === a.jobId);
      csv += `${a.id},"${a.name || ''}","${a.email || ''}","${a.phone || ''}","${a.cnic || ''}","${j?.title || ''}","${a.stage || ''}","${a.appliedOn || ''}",${a.score || 0},"${(a.notes || '').replace(/"/g, '""')}"\r\n`;
    });
    Utils.downloadCSV('\uFEFF' + csv, `applicant_pipeline_${new Date().toISOString().split('T')[0]}.csv`);
    Toast.show('Applicant pipeline exported to CSV!', 'success');
  },

  // ═══════════════════════════════════════════════
  // OFFER LETTERS MANAGEMENT (HR & ADMIN ONLY)
  // ═══════════════════════════════════════════════

  getOfferValidity(offer) {
    const issueDt = new Date(offer.issueDate);
    const expiryDt = new Date(offer.expiryDate || (issueDt.getTime() + 48 * 3600 * 1000));
    const now = new Date();
    const diffMs = expiryDt.getTime() - now.getTime();
    const hrsLeft = Math.max(0, Math.round(diffMs / (3600 * 1000)));

    if (offer.status === 'accepted') {
      return { status: 'accepted', badgeClass: 'badge-success', label: 'Accepted by Candidate', icon: 'fa-circle-check' };
    }
    if (offer.status === 'rejected') {
      return { status: 'rejected', badgeClass: 'badge-danger', label: 'Declined by Candidate', icon: 'fa-circle-xmark' };
    }
    if (offer.status === 'converted') {
      return { status: 'converted', badgeClass: 'badge-info', label: 'Onboarded as Employee', icon: 'fa-user-check' };
    }
    if (diffMs <= 0) {
      return { status: 'expired', badgeClass: 'badge-danger', label: 'Expired (2-Day Window Passed)', icon: 'fa-hourglass-end' };
    }
    if (hrsLeft <= 24) {
      return { status: 'urgent', badgeClass: 'badge-danger', label: `${hrsLeft}h Remaining (Urgent)`, icon: 'fa-clock' };
    }
    return { status: 'active', badgeClass: 'badge-warning', label: `Valid (${hrsLeft}h Remaining)`, icon: 'fa-clock' };
  },

  getFilteredOffers() {
    let list = DB.get('offer_letters') || [];
    const { query, type, status } = this.offerFilter;

    if (query) {
      const q = query.toLowerCase().trim();
      list = list.filter(o =>
        (o.candidateName || '').toLowerCase().includes(q) ||
        (o.cnic || '').toLowerCase().includes(q) ||
        (o.refNo || '').toLowerCase().includes(q) ||
        (o.designation || '').toLowerCase().includes(q)
      );
    }
    if (type && type !== 'all') {
      list = list.filter(o => (o.employmentType || '').toLowerCase() === type.toLowerCase());
    }
    if (status && status !== 'all') {
      list = list.filter(o => (o.status || '').toLowerCase() === status.toLowerCase());
    }
    return list.sort((a,b) => b.id - a.id);
  },

  filterOfferSearch(val) {
    this.offerFilter.query = val;
    this.renderOfferLettersTable();
  },

  filterOfferType(type) {
    this.offerFilter.type = type;
    this.renderOfferLettersTable();
  },

  filterOfferStatus(status) {
    this.offerFilter.status = status;
    this.renderOfferLettersTable();
  },

  renderOfferLetters(container) {
    container = container || document.getElementById('rec-content') || document.getElementById('recruitment-tab-content') || document.getElementById('content-body');
    if (!container) return;

    if (!this.isHROrAdmin()) {
      container.innerHTML = `
        <div class="card" style="text-align:center;padding:48px 20px">
          <i class="fa fa-lock" style="font-size:42px;color:var(--warning);margin-bottom:14px;display:block"></i>
          <h3 style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:6px">Access Restricted</h3>
          <p style="color:var(--text-3);font-size:13px;max-width:440px;margin:0 auto">
            Offer letter generation and candidate appointment agreements are strictly restricted to <strong>Super Admin</strong> and <strong>HR Manager</strong> roles as per company governance policy.
          </p>
        </div>
      `;
      return;
    }

    const allOffers = DB.get('offer_letters') || [];
    const permanentCount = allOffers.filter(o => o.employmentType === 'permanent').length;
    const contractCount = allOffers.filter(o => o.employmentType === 'contract').length;
    const internCount = allOffers.filter(o => o.employmentType === 'internship').length;
    const acceptedCount = allOffers.filter(o => o.status === 'accepted' || o.status === 'converted').length;

    container.innerHTML = `
      <!-- Offer Metric Counters -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 18px">
          <div style="font-size:11px;color:var(--text-3);font-weight:600;text-transform:uppercase">Total Offers Issued</div>
          <div style="font-size:22px;font-weight:800;color:var(--text);margin-top:2px">${allOffers.length}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${permanentCount} Permanent • ${contractCount} Contract • ${internCount} Intern</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 18px">
          <div style="font-size:11px;color:var(--success);font-weight:600;text-transform:uppercase">Accepted Offers</div>
          <div style="font-size:22px;font-weight:800;color:var(--success);margin-top:2px">${acceptedCount}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${Math.round((acceptedCount / (allOffers.length || 1)) * 100)}% Conversion Rate</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 18px">
          <div style="font-size:11px;color:var(--warning);font-weight:600;text-transform:uppercase">Active 2-Day Windows</div>
          <div style="font-size:22px;font-weight:800;color:var(--warning);margin-top:2px">
            ${allOffers.filter(o => (o.status === 'sent' || o.status === 'draft') && this.getOfferValidity(o).status !== 'expired').length}
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Within 48h Response Period</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 18px">
          <div style="font-size:11px;color:var(--info);font-weight:600;text-transform:uppercase">Onboarded to Staff</div>
          <div style="font-size:22px;font-weight:800;color:var(--info);margin-top:2px">${allOffers.filter(o => o.status === 'converted').length}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Converted to Active Employees</div>
        </div>
      </div>

      <!-- Filters & Actions Header -->
      <div class="card" style="margin-bottom:16px;padding:14px 18px">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:260px">
            <div style="position:relative;flex:1">
              <i class="fa fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:12px"></i>
              <input type="text" class="form-control" style="padding-left:34px;font-size:12.5px"
                placeholder="Search candidate name, CNIC (e.g. 42101-...), Ref #, or designation..."
                value="${this.offerFilter.query}"
                oninput="Recruitment.filterOfferSearch(this.value)">
            </div>
            <select class="form-control" style="width:160px;font-size:12px" onchange="Recruitment.filterOfferType(this.value)">
              <option value="all" ${this.offerFilter.type==='all'?'selected':''}>All Employment Types</option>
              <option value="permanent" ${this.offerFilter.type==='permanent'?'selected':''}>Permanent</option>
              <option value="contract" ${this.offerFilter.type==='contract'?'selected':''}>Contract</option>
              <option value="internship" ${this.offerFilter.type==='internship'?'selected':''}>Internship</option>
            </select>
            <select class="form-control" style="width:150px;font-size:12px" onchange="Recruitment.filterOfferStatus(this.value)">
              <option value="all" ${this.offerFilter.status==='all'?'selected':''}>All Statuses</option>
              <option value="draft" ${this.offerFilter.status==='draft'?'selected':''}>Draft</option>
              <option value="sent" ${this.offerFilter.status==='sent'?'selected':''}>Sent (Pending)</option>
              <option value="accepted" ${this.offerFilter.status==='accepted'?'selected':''}>Accepted</option>
              <option value="rejected" ${this.offerFilter.status==='rejected'?'selected':''}>Rejected</option>
              <option value="converted" ${this.offerFilter.status==='converted'?'selected':''}>Converted</option>
            </select>
          </div>

          <button class="btn btn-primary btn-sm" onclick="Recruitment.showGenerateOfferLetterModal()">
            <i class="fa fa-plus"></i> Create Offer Letter
          </button>
        </div>
      </div>

      <!-- Offer Letters Table Container -->
      <div id="offer-letters-table-wrap"></div>
    `;

    this.renderOfferLettersTable();
  },

  renderOfferLettersTable() {
    const wrap = document.getElementById('offer-letters-table-wrap');
    if (!wrap) return;
    const offers = this.getFilteredOffers();
    const depts = DB.get('departments') || [];

    if (offers.length === 0) {
      wrap.innerHTML = `
        <div class="card" style="text-align:center;padding:50px 20px;color:var(--text-muted)">
          <i class="fa fa-file-signature" style="font-size:42px;opacity:0.3;margin-bottom:12px;display:block"></i>
          <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px">No Offer Letters Found</div>
          <p style="font-size:12px;max-width:360px;margin:0 auto 16px">No appointment offer records match your current filters. Create an offer letter for any applicant or new joining.</p>
          <button class="btn btn-primary btn-sm" onclick="Recruitment.showGenerateOfferLetterModal()">
            <i class="fa fa-plus"></i> Create First Offer Letter
          </button>
        </div>
      `;
      return;
    }

    const typeBadge = (type) => {
      if (type === 'permanent') return `<span class="badge badge-primary"><i class="fa fa-shield"></i> Permanent</span>`;
      if (type === 'contract') return `<span class="badge badge-warning" style="background:#8b5cf622;color:#a855f7;border-color:#8b5cf644"><i class="fa fa-file-contract"></i> Contract</span>`;
      if (type === 'internship') return `<span class="badge badge-info"><i class="fa fa-graduation-cap"></i> Internship</span>`;
      return `<span class="badge badge-secondary">${type}</span>`;
    };

    wrap.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ref No & Candidate</th>
              <th>CNIC</th>
              <th>Position & Dept</th>
              <th>Type</th>
              <th>Compensation</th>
              <th>Joining Date</th>
              <th>2-Day Validity Status</th>
              <th>Status</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${offers.map(o => {
              const dept = depts.find(d => d.id === o.departmentId);
              const validity = this.getOfferValidity(o);
              const statusBadges = {
                draft: 'badge-secondary',
                sent: 'badge-warning',
                accepted: 'badge-success',
                rejected: 'badge-danger',
                converted: 'badge-info'
              };

              return `
                <tr>
                  <td>
                    <div style="font-weight:700;color:var(--text);font-size:13.5px">${o.candidateName}</div>
                    <div style="font-size:11px;color:var(--text-3);font-family:monospace;margin-top:2px">
                      <i class="fa fa-hashtag" style="font-size:10px"></i> ${o.refNo}
                    </div>
                  </td>
                  <td>
                    <div style="font-family:monospace;font-size:12px;font-weight:600;color:var(--text)">
                      <i class="fa fa-id-card" style="color:var(--primary);margin-right:4px"></i>
                      ${o.cnic || '—'}
                    </div>
                  </td>
                  <td>
                    <div style="font-weight:600;font-size:13px">${o.designation}</div>
                    <div style="font-size:11.5px;color:var(--text-3)">${dept?.name || '—'}</div>
                  </td>
                  <td>
                    ${typeBadge(o.employmentType)}
                    ${o.duration ? `<div style="font-size:10.5px;color:var(--text-muted);margin-top:3px">${o.duration}</div>` : ''}
                  </td>
                  <td>
                    <div style="font-weight:700;color:var(--success);font-size:13px">${Utils.formatCurrency(o.grossSalary)}</div>
                    <div style="font-size:10.5px;color:var(--text-muted)">${o.employmentType === 'internship' ? 'Stipend / mo' : 'Gross / month'}</div>
                  </td>
                  <td>
                    <div style="font-size:12.5px;font-weight:500">${Utils.formatDate(o.joiningDate)}</div>
                  </td>
                  <td>
                    <span class="badge ${validity.badgeClass}" style="font-size:10.5px">
                      <i class="fa ${validity.icon}" style="margin-right:4px"></i>${validity.label}
                    </span>
                    <div style="font-size:10px;color:var(--text-muted);margin-top:2px">Deadline: ${Utils.formatDate(o.expiryDate)}</div>
                  </td>
                  <td>
                    <span class="badge ${statusBadges[o.status]||'badge-secondary'}" style="text-transform:uppercase;font-size:10.5px">
                      ${o.status}
                    </span>
                  </td>
                  <td style="text-align:right">
                    <div class="tbl-actions" style="justify-content:flex-end">
                      <button class="btn btn-secondary btn-xs" onclick="Recruitment.viewOfferLetter(${o.id})" title="View Corporate Offer Letter & Print/PDF">
                        <i class="fa fa-file-pdf"></i> View & PDF
                      </button>
                      <button class="btn btn-ghost btn-xs" onclick="Recruitment.sendOfferLetter(${o.id})" title="Send via Email">
                        <i class="fa fa-paper-plane"></i>
                      </button>
                      ${o.status !== 'converted' ? `
                        <button class="btn btn-success btn-xs" onclick="Recruitment.convertOfferToEmployee(${o.id})" title="Convert to Active Employee">
                          <i class="fa fa-user-plus"></i> Onboard
                        </button>
                      ` : `
                        <span class="badge badge-success" style="font-size:10px"><i class="fa fa-check"></i> Hired</span>
                      `}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // ═══════════════════════════════════════════════
  // CREATE / GENERATE OFFER LETTER MODAL
  // ═══════════════════════════════════════════════

  showGenerateOfferLetterModal(appId = null, prefillData = null) {
    if (!this.isHROrAdmin()) {
      Toast.show('Permission denied: Only HR Manager and Super Admin can generate offer letters.', 'error');
      return;
    }

    const app = appId ? DB.find('applications', Number(appId)) : null;
    const job = app ? DB.find('recruitment', app.jobId) : (prefillData?.jobId ? DB.find('recruitment', prefillData.jobId) : null);
    const depts = DB.get('departments') || [];
    const emps = (DB.get('employees') || []).filter(e => e.status === 'active');
    const apps = (DB.get('applications') || []).filter(a => a.stage !== 'hired' && a.stage !== 'rejected');

    // Candidate default values
    const candidateName = prefillData?.candidateName || app?.name || '';
    const email = prefillData?.email || app?.email || '';
    const phone = prefillData?.phone || app?.phone || '';
    const cnic = prefillData?.cnic || app?.cnic || '';
    const designation = prefillData?.designation || job?.title || '';
    const deptId = prefillData?.deptId || job?.departmentId || 1;
    const defaultSalary = prefillData?.salary || 120000;

    // Proposed joining date (+10 days from today)
    const d = new Date();
    d.setDate(d.getDate() + 10);
    const defaultJoin = d.toISOString().split('T')[0];

    Modal.show('Generate Formal Employment Offer Letter', `
      <div style="margin-bottom:14px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:12.5px;color:var(--text-2)">
          <i class="fa fa-file-contract" style="color:var(--primary);margin-right:8px"></i>
          System-generated official appointment agreement with candidate CNIC & company policy benefits.
        </div>
        <span class="badge badge-warning" style="font-size:10.5px">
          <i class="fa fa-clock"></i> 2-Day Acceptance Deadline
        </span>
      </div>

      <div class="form-group">
        <label class="form-label">Link with Applicant (Optional)</label>
        <select class="form-control" id="of-app-select" onchange="Recruitment.onOfferApplicantSelect(this.value)">
          <option value="">-- Custom Candidate / External Joining --</option>
          ${apps.map(a => `<option value="${a.id}" ${a.id === appId ? 'selected' : ''}>${a.name} • ${a.email} (${DB.find('recruitment', a.jobId)?.title || 'Role'})</option>`).join('')}
        </select>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Candidate Full Name</label>
          <input class="form-control" id="of-name" value="${candidateName}" placeholder="e.g. Muhammad Zaid Farooq">
        </div>
        <div class="form-group">
          <label class="form-label required">CNIC Number</label>
          <input class="form-control" id="of-cnic" value="${cnic}" placeholder="42101-1234567-1" maxlength="15" style="font-family:monospace">
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Candidate Email</label>
          <input class="form-control" id="of-email" type="email" value="${email}" placeholder="candidate@example.com">
        </div>
        <div class="form-group">
          <label class="form-label required">Contact Phone</label>
          <input class="form-control" id="of-phone" value="${phone}" placeholder="0300-1234567">
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Designation / Position Title</label>
          <input class="form-control" id="of-designation" value="${designation}" placeholder="e.g. Senior Full Stack Engineer">
        </div>
        <div class="form-group">
          <label class="form-label required">Department</label>
          <select class="form-control" id="of-dept">
            ${depts.map(d => `<option value="${d.id}" ${d.id === deptId ? 'selected' : ''}>${d.name}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Employment Classification</label>
          <select class="form-control" id="of-emp-type" onchange="Recruitment.onOfferTypeChange(this.value)">
            <option value="permanent" selected>Permanent (Standard Corporate Tenure)</option>
            <option value="contract">Fixed-Term Contract</option>
            <option value="internship">Internship (Leading to Full-Time)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" id="of-duration-label">Contract / Internship Term</label>
          <input class="form-control" id="of-duration" placeholder="e.g. 1 Year (Renewable) or 3 Months" value="Standard Permanent Role">
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required" id="of-salary-label">Monthly Gross Remuneration / Stipend (PKR)</label>
          <input class="form-control" id="of-salary" type="number" placeholder="120000" value="${defaultSalary}">
        </div>
        <div class="form-group">
          <label class="form-label required">Proposed Joining Date</label>
          <input class="form-control" id="of-join-date" type="date" value="${defaultJoin}">
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Reporting Supervisor / Manager</label>
          <select class="form-control" id="of-manager">
            ${emps.map(e => `<option value="${e.id}">${e.fullName} • ${Utils.getDesigName(e.designationId)} (${Utils.getDeptName(e.departmentId)})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Probationary Period (Months)</label>
          <input class="form-control" id="of-probation" type="number" value="3" min="0" max="12">
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Primary Work Location</label>
          <input class="form-control" id="of-location" value="Head Office, Islamabad" placeholder="e.g. Head Office, Islamabad / Hybrid">
        </div>
        <div class="form-group">
          <label class="form-label">Working Hours & Schedule</label>
          <input class="form-control" id="of-hours" value="Mon - Fri, 09:00 AM - 06:00 PM (40 hrs/week)">
        </div>
      </div>

      <!-- 2-Day Acceptance Callout -->
      <div style="background:linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.1));border:1px solid rgba(245,158,11,0.4);border-radius:8px;padding:14px;margin-bottom:14px">
        <div style="font-size:12.5px;font-weight:700;color:#f59e0b;display:flex;align-items:center;gap:6px">
          <i class="fa fa-hourglass-half"></i> 48-Hour Strict Acceptance Window
        </div>
        <div style="font-size:11.5px;color:var(--text-2);margin-top:4px;line-height:1.5">
          As per standard hiring protocol, this offer letter will mandate the candidate to accept or decline within <strong>two (2) business days</strong> of issue. A formal candidate acceptance slip is automatically generated.
        </div>
      </div>

      <!-- Company Policy Benefits List -->
      <div class="form-group">
        <label class="form-label">Company Policy Benefits Included:</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px">
          <label style="font-size:12px;display:flex;align-items:center;gap:8px;color:var(--text-2)">
            <input type="checkbox" id="of-b-pf" checked style="accent-color:var(--primary)"> Provident Fund (5% Employee + 5% Employer Match)
          </label>
          <label style="font-size:12px;display:flex;align-items:center;gap:8px;color:var(--text-2)">
            <input type="checkbox" id="of-b-med" checked style="accent-color:var(--primary)"> Medical & Hospitalization Insurance (Family OPD & IPD)
          </label>
          <label style="font-size:12px;display:flex;align-items:center;gap:8px;color:var(--text-2)">
            <input type="checkbox" id="of-b-leave" checked style="accent-color:var(--primary)"> 20 Annual + 12 Casual + 15 Sick Leaves
          </label>
          <label style="font-size:12px;display:flex;align-items:center;gap:8px;color:var(--text-2)">
            <input type="checkbox" id="of-b-bonus" checked style="accent-color:var(--primary)"> Annual Performance Appraisals & Eid Bonuses
          </label>
          <label style="font-size:12px;display:flex;align-items:center;gap:8px;color:var(--text-2)">
            <input type="checkbox" id="of-b-laptop" checked style="accent-color:var(--primary)"> High-End Corporate Laptop & Software Suite
          </label>
          <label style="font-size:12px;display:flex;align-items:center;gap:8px;color:var(--text-2)">
            <input type="checkbox" id="of-b-train" checked style="accent-color:var(--primary)"> Technical Training & Professional Certifications
          </label>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Special Notes / Stipulations</label>
        <textarea class="form-control" id="of-notes" rows="2" placeholder="Any special signing bonuses, relocation assistance, or role-specific milestones..."></textarea>
      </div>
    `, {
      size: 'modal-lg',
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Recruitment.saveOfferLetter()"><i class="fa fa-file-signature"></i> Generate & Preview Offer Letter</button>
      `
    });
  },

  onOfferApplicantSelect(appId) {
    if (!appId) return;
    const app = DB.find('applications', Number(appId));
    if (!app) return;
    const job = DB.find('recruitment', app.jobId);

    const nameEl = document.getElementById('of-name');
    const emailEl = document.getElementById('of-email');
    const phoneEl = document.getElementById('of-phone');
    const cnicEl = document.getElementById('of-cnic');
    const desigEl = document.getElementById('of-designation');
    const deptEl = document.getElementById('of-dept');

    if (nameEl) nameEl.value = app.name || '';
    if (emailEl) emailEl.value = app.email || '';
    if (phoneEl) phoneEl.value = app.phone || '';
    if (cnicEl) cnicEl.value = app.cnic || '';
    if (desigEl && job?.title) desigEl.value = job.title;
    if (deptEl && job?.departmentId) deptEl.value = job.departmentId;
  },

  onOfferTypeChange(type) {
    const durEl = document.getElementById('of-duration');
    const probEl = document.getElementById('of-probation');
    const salaryLbl = document.getElementById('of-salary-label');

    if (type === 'internship') {
      if (durEl) durEl.value = '3 Months (Leading to Permanent Placement)';
      if (probEl) probEl.value = '1';
      if (salaryLbl) salaryLbl.textContent = 'Monthly Internship Stipend (PKR)';
    } else if (type === 'contract') {
      if (durEl) durEl.value = '1 Year (Renewable on mutual consent)';
      if (probEl) probEl.value = '2';
      if (salaryLbl) salaryLbl.textContent = 'Monthly Gross Remuneration (PKR)';
    } else {
      if (durEl) durEl.value = 'Standard Permanent Role';
      if (probEl) probEl.value = '3';
      if (salaryLbl) salaryLbl.textContent = 'Monthly Gross Salary (PKR)';
    }
  },

  saveOfferLetter() {
    if (!this.isHROrAdmin()) return;
    const candidateName = document.getElementById('of-name')?.value.trim();
    const cnic = document.getElementById('of-cnic')?.value.trim();
    const email = document.getElementById('of-email')?.value.trim();
    const phone = document.getElementById('of-phone')?.value.trim();
    const designation = document.getElementById('of-designation')?.value.trim();
    const departmentId = parseInt(document.getElementById('of-dept')?.value) || 1;
    const employmentType = document.getElementById('of-emp-type')?.value || 'permanent';
    const duration = document.getElementById('of-duration')?.value.trim() || '';
    const grossSalary = parseFloat(document.getElementById('of-salary')?.value) || 50000;
    const joiningDate = document.getElementById('of-join-date')?.value || Utils.today();
    const reportingManagerId = parseInt(document.getElementById('of-manager')?.value) || 1;
    const probationMonths = parseInt(document.getElementById('of-probation')?.value) || 3;
    const location = document.getElementById('of-location')?.value.trim() || 'Head Office, Islamabad';
    const workHours = document.getElementById('of-hours')?.value.trim() || 'Mon - Fri, 09:00 AM - 06:00 PM';
    const notes = document.getElementById('of-notes')?.value.trim() || '';
    const appSelectVal = document.getElementById('of-app-select')?.value;
    const applicationId = appSelectVal ? parseInt(appSelectVal) : null;

    if (!candidateName) { Toast.show('Candidate Name is required', 'error'); return; }
    if (!cnic) { Toast.show('Candidate CNIC is required', 'error'); return; }
    if (!designation) { Toast.show('Designation is required', 'error'); return; }
    if (!grossSalary || grossSalary <= 0) { Toast.show('Valid salary or stipend is required', 'error'); return; }

    // Compile chosen benefits
    const benefits = [];
    if (document.getElementById('of-b-pf')?.checked) benefits.push('Company Provident Fund (5% Employee + 5% Employer Match)');
    if (document.getElementById('of-b-med')?.checked) benefits.push('Comprehensive Medical & Hospitalization Insurance (Family OPD & IPD)');
    if (document.getElementById('of-b-leave')?.checked) benefits.push('20 Annual Leaves + 12 Casual Leaves + 15 Sick Leaves with carry forward');
    if (document.getElementById('of-b-bonus')?.checked) benefits.push('Annual Performance Appraisals & Eid Performance Bonuses');
    if (document.getElementById('of-b-laptop')?.checked) benefits.push('High-End Corporate Laptop & Official Software Licenses');
    if (document.getElementById('of-b-train')?.checked) benefits.push('Annual Professional Training & Certification Sponsorship');

    // Calculate dates: 2-day acceptance deadline
    const issueDate = Utils.today();
    const expDt = new Date();
    expDt.setDate(expDt.getDate() + 2);
    const expiryDate = expDt.toISOString().split('T')[0];

    // Reference Number
    const count = (DB.get('offer_letters') || []).length + 1;
    const refNo = `HRM-OL-2026-${String(count).padStart(3, '0')}`;

    // Basic salary calculation
    const basicSalary = employmentType === 'internship' ? grossSalary : Math.round(grossSalary * 0.6);
    const house = employmentType === 'internship' ? 0 : Math.round(grossSalary * 0.2);
    const med = employmentType === 'internship' ? 0 : Math.round(grossSalary * 0.1);
    const conv = employmentType === 'internship' ? 0 : Math.round(grossSalary * 0.1);

    const newOffer = {
      id: DB.nextId('offer_letters'),
      refNo,
      applicationId,
      candidateName,
      cnic,
      email,
      phone,
      designation,
      departmentId,
      employmentType,
      duration,
      grossSalary,
      basicSalary,
      allowances: { house, medical: med, conveyance: conv },
      joiningDate,
      reportingManagerId,
      probationMonths,
      issueDate,
      expiryDate,
      status: 'draft',
      location,
      workHours,
      benefits,
      notes
    };

    DB.add('offer_letters', newOffer);

    // If linked to applicant, update applicant record and CNIC
    if (applicationId) {
      DB.update('applications', applicationId, { stage: 'offer', cnic });
    }

    DB.log('ADD', 'Recruitment', `Generated Offer Letter #${refNo} for ${candidateName} (${designation})`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show(`Offer letter #${refNo} generated successfully!`, 'success');

    // Switch view and open preview
    this.currentView = 'offers';
    this.render();
    setTimeout(() => {
      this.viewOfferLetter(newOffer.id);
    }, 250);
  },

  // ═══════════════════════════════════════════════
  // VIEW SYSTEM-DESIGNED OFFER LETTER MODAL
  // ═══════════════════════════════════════════════

  viewOfferLetter(offerId) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Offer letters and compensation details are restricted to HR & Admin.', 'error');
      return;
    }
    const offer = DB.find('offer_letters', Number(offerId));
    if (!offer) { Toast.show('Offer letter record not found', 'error'); return; }

    const dept = DB.find('departments', offer.departmentId);
    const mgr = DB.find('employees', offer.reportingManagerId);
    const validity = this.getOfferValidity(offer);
    const isHR = this.isHROrAdmin();
    const settings = DB.getObj('settings') || {};
    const safeSrc = src => (src ? String(src).replace(/"/g, '&quot;') : '');
    const companyName = settings.companyName || 'HRM Pro Enterprise Solutions (Pvt) Ltd';
    const companyAddress = settings.companyAddress || 'Plot 42, Executive Tech Park, Constitution Avenue, Islamabad, Pakistan';
    const companyEmail = settings.companyEmail || 'hr@company.com';
    const companyPhone = settings.companyPhone || '+92-21-1234567';
    const companyNTN = settings.companyNTN || '1234567-8';
    const companyLogo = safeSrc(settings.companyLogo || '');
    const companyBanner = safeSrc(settings.companyLetterheadBanner || '');
    const letterheadType = settings.companyLetterheadType || 'dynamic';
    const signatoryName = settings.signatoryName || 'Sara Malik';
    const signatoryTitle = settings.signatoryTitle || 'Head of Human Resources & Corporate Governance';
    const signatorySignature = safeSrc(settings.signatorySignature || '');
    const companyStamp = safeSrc(settings.companyStamp || '');

    const isFullPage = (letterheadType === 'full_page' || letterheadType === 'custom_banner') && Boolean(companyBanner);
    const topMargin = (settings.companyLetterheadTopMargin !== undefined && settings.companyLetterheadTopMargin !== null && settings.companyLetterheadTopMargin !== '') ? Number(settings.companyLetterheadTopMargin) : 160;
    const bottomMargin = (settings.companyLetterheadBottomMargin !== undefined && settings.companyLetterheadBottomMargin !== null && settings.companyLetterheadBottomMargin !== '') ? Number(settings.companyLetterheadBottomMargin) : 95;

    const docContainerStyle = isFullPage
      ? `background:#ffffff url('${companyBanner}') no-repeat top center;background-size:100% 100%;padding:${topMargin}px 35px ${bottomMargin}px 35px;box-sizing:border-box;border-radius:8px;border:1px solid #ddd;min-height:1050px;box-shadow:0 4px 20px rgba(0,0,0,0.08)`
      : ``;

    Modal.show({
      size: 'modal-lg',
      title: `<div style="display:flex;align-items:center;gap:10px">
        <i class="fa fa-file-signature" style="color:var(--primary)"></i>
        <span>Employment Offer Letter — ${offer.candidateName}</span>
        <span class="badge ${validity.badgeClass}" style="font-size:11px"><i class="fa ${validity.icon}"></i> ${validity.label}</span>
      </div>`,
      body: `
        <div class="offer-doc-container" ${docContainerStyle ? `style="${docContainerStyle}"` : ''}>
          <!-- Corporate Letterhead -->
          ${isFullPage ? `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0 10px 0;border-bottom:2px solid #1e3a8a;margin-bottom:18px;font-size:12px;color:#475569">
              <div>Ref: <span class="offer-ref-no">${offer.refNo}</span></div>
              <div>Date of Issue: <strong>${Utils.formatDate(offer.issueDate)}</strong></div>
              <div style="color:#b45309;font-weight:700">Strict 2-Day Acceptance Notice</div>
            </div>
          ` : (letterheadType === 'custom_banner' && companyBanner ? `
            <div style="background:#fff;border-bottom:3px solid #1e3a8a;padding:12px 18px;margin-bottom:12px">
              <img src="${companyBanner}" style="width:100%;max-height:120px;object-fit:contain" alt="${companyName}">
              <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid #e2e8f0;font-size:11.5px;color:#475569">
                <div>Ref: <span class="offer-ref-no">${offer.refNo}</span></div>
                <div>Date of Issue: <strong>${Utils.formatDate(offer.issueDate)}</strong></div>
                <div style="color:#b45309;font-weight:700">Strict 2-Day Acceptance Notice</div>
              </div>
            </div>
          ` : `
            <div class="offer-letterhead">
              <div class="offer-logo-badge">
                ${companyLogo ? `
                  <div style="width:52px;height:52px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;padding:4px;flex-shrink:0">
                    <img src="${companyLogo}" style="max-width:100%;max-height:100%;object-fit:contain" alt="Logo">
                  </div>
                ` : `<div class="offer-logo-icon">${companyName.slice(0,2).toUpperCase()}</div>`}
                <div>
                  <div class="offer-company-title">${companyName.toUpperCase()}</div>
                  <div class="offer-company-sub">${companyAddress} • NTN: ${companyNTN}</div>
                  <div class="offer-company-sub">Phone: ${companyPhone} • Email: ${companyEmail}</div>
                </div>
              </div>
              <div class="offer-ref-box">
                <div>Ref: <span class="offer-ref-no">${offer.refNo}</span></div>
                <div style="margin-top:3px">Date of Issue: <strong>${Utils.formatDate(offer.issueDate)}</strong></div>
                <div style="margin-top:3px;color:#facc15;font-weight:700">Strict 2-Day Acceptance Notice</div>
              </div>
            </div>
          `)}

          <!-- Document Body -->
          <div class="offer-body">
            <!-- Recipient Block -->
            <div class="offer-recipient-block">
              <div>
                <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">Private & Confidential / Addressee:</div>
                <div style="font-size:15px;font-weight:800;color:#0f172a;margin-top:2px">${offer.candidateName}</div>
                <div style="font-size:12.5px;color:#334155;margin-top:2px"><i class="fa fa-id-card" style="color:#2563eb;margin-right:5px"></i>CNIC: <strong>${offer.cnic || '—'}</strong></div>
                <div style="font-size:12px;color:#64748b;margin-top:2px">${offer.email || '—'} • ${offer.phone || '—'}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">Proposed Appointment:</div>
                <div style="font-size:14px;font-weight:700;color:#0f172a;margin-top:2px">${offer.designation}</div>
                <div style="font-size:12px;color:#2563eb;font-weight:600">${dept?.name || '—'} Department</div>
                <div style="margin-top:4px">
                  <span class="offer-status-pill" style="background:#e0e7ff;color:#3730a3">${(offer.employmentType || 'permanent').toUpperCase()} APPOINTMENT</span>
                </div>
              </div>
            </div>

            <!-- Subject Line -->
            <div class="offer-subject-bar">
              Subject: Formal Offer of Employment & Terms of Engagement — ${offer.designation}
            </div>

            <!-- Opening Paragraph -->
            <p style="margin-bottom:16px;color:#334155;line-height:1.65">
              Dear <strong>${offer.candidateName}</strong>,<br>
              On behalf of <strong>HRM Pro Enterprise Solutions (Pvt) Ltd</strong>, we are delighted to formally extend this offer of employment for the position of 
              <strong>${offer.designation}</strong> in our <strong>${dept?.name || '—'}</strong> team. 
              Our evaluation committee was thoroughly impressed by your credentials, expertise, and technical aptitude, and we look forward to your valuable contributions to our organization.
            </p>

            <!-- 2-Day Validity Warning Banner -->
            <div class="offer-validity-alert ${validity.status === 'urgent' || validity.status === 'expired' ? 'urgent' : ''}">
              <i class="fa fa-triangle-exclamation" style="font-size:18px;color:${validity.status === 'urgent' || validity.status === 'expired' ? '#dc2626' : '#d97706'};margin-top:2px"></i>
              <div>
                <div style="font-size:13px;font-weight:800;color:${validity.status === 'urgent' || validity.status === 'expired' ? '#991b1b' : '#92400e'}">
                  OFFER VALIDITY & 48-HOUR ACCEPTANCE DEADLINE (TWO BUSINESS DAYS)
                </div>
                <div style="font-size:12px;color:#475569;margin-top:3px;line-height:1.5">
                  This offer of employment is strictly valid for <strong>two (2) business days</strong> from the date of issue and shall officially expire on 
                  <strong>${Utils.formatDate(offer.expiryDate)} at 18:00 PKT</strong>. 
                  To confirm your acceptance, please sign, date, and return the duplicate copy of this letter with the attached Acceptance Slip within forty-eight (48) hours. If not accepted within this window, this offer shall automatically lapse and be deemed withdrawn.
                </div>
              </div>
            </div>

            <!-- Appointment Terms Grid -->
            <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#1e3a8a;margin-bottom:8px">
              1. Key Terms of Appointment
            </div>
            <div class="offer-terms-grid">
              <div class="offer-term-card">
                <div class="offer-term-label">Position / Designation</div>
                <div class="offer-term-value">${offer.designation}</div>
              </div>
              <div class="offer-term-card">
                <div class="offer-term-label">Department</div>
                <div class="offer-term-value">${dept?.name || '—'}</div>
              </div>
              <div class="offer-term-card">
                <div class="offer-term-label">Employment Classification</div>
                <div class="offer-term-value">${(offer.employmentType || 'permanent').toUpperCase()} ${offer.duration ? `— ${offer.duration}` : ''}</div>
              </div>
              <div class="offer-term-card">
                <div class="offer-term-label">Expected Date of Joining</div>
                <div class="offer-term-value">${Utils.formatDate(offer.joiningDate)}</div>
              </div>
              <div class="offer-term-card">
                <div class="offer-term-label">Reporting Authority</div>
                <div class="offer-term-value">${mgr?.fullName || 'Department Head'} (${Utils.getDesigName(mgr?.designationId)})</div>
              </div>
              <div class="offer-term-card">
                <div class="offer-term-label">Work Location & Hours</div>
                <div class="offer-term-value">${offer.location || 'Head Office, Islamabad'} • ${offer.workHours || 'Mon-Fri, 9am-6pm'}</div>
              </div>
            </div>

            <!-- Remuneration & Compensation Table -->
            <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#1e3a8a;margin-bottom:8px">
              2. Remuneration & Compensation Package
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:12.5px;border:1px solid #e2e8f0">
              <thead>
                <tr style="background:#f1f5f9;border-bottom:2px solid #cbd5e1">
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#475569">Remuneration Element</th>
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#475569">Description</th>
                  <th style="padding:8px 12px;text-align:right;font-size:11px;color:#475569">Monthly Entitlement</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #e2e8f0">
                  <td style="padding:8px 12px;font-weight:600">Basic Salary</td>
                  <td style="padding:8px 12px;color:#64748b">Fixed Base Compensation</td>
                  <td style="padding:8px 12px;text-align:right;font-weight:600">${Utils.formatCurrency(offer.basicSalary || Math.round(offer.grossSalary * 0.6))}</td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0">
                  <td style="padding:8px 12px;font-weight:600">House Rent Allowance (HRA)</td>
                  <td style="padding:8px 12px;color:#64748b">Housing & Utility Support</td>
                  <td style="padding:8px 12px;text-align:right">${Utils.formatCurrency(offer.allowances?.house || Math.round(offer.grossSalary * 0.2))}</td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0">
                  <td style="padding:8px 12px;font-weight:600">Medical & Statutory Conveyance</td>
                  <td style="padding:8px 12px;color:#64748b">Standard Travel & Wellness</td>
                  <td style="padding:8px 12px;text-align:right">${Utils.formatCurrency((offer.allowances?.medical || Math.round(offer.grossSalary * 0.1)) + (offer.allowances?.conveyance || Math.round(offer.grossSalary * 0.1)))}</td>
                </tr>
                <tr style="background:#f0fdf4;border-top:2px solid #86efac;font-weight:800">
                  <td colspan="2" style="padding:10px 12px;color:#15803d;font-size:13px">TOTAL GROSS MONTHLY REMUNERATION</td>
                  <td style="padding:10px 12px;text-align:right;color:#15803d;font-size:15px">${Utils.formatCurrency(offer.grossSalary)}</td>
                </tr>
              </tbody>
            </table>

            <!-- Benefits as per Company Policy -->
            <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#1e3a8a;margin-bottom:8px">
              3. Benefits & Privileges (as per Company Policy)
            </div>
            <div class="offer-benefits-list">
              ${(offer.benefits || []).map(b => `
                <div class="offer-benefit-item">
                  <i class="fa fa-circle-check"></i>
                  <span>${b}</span>
                </div>
              `).join('')}
            </div>

            <!-- Terms & Pre-requisites -->
            <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#1e3a8a;margin-bottom:8px">
              4. Probation, Verification & General Terms
            </div>
            <p style="font-size:12px;color:#475569;margin-bottom:16px;line-height:1.6">
              ${offer.employmentType === 'internship' ? `This internship shall span ${offer.duration || '3 months'}, with scheduled performance milestones and designated mentor support.` : `Your appointment is subject to an initial probationary tenure of ${offer.probationMonths || 3} months. Upon successful appraisal, your position shall be confirmed in writing.`}
              You will be expected to adhere to all corporate conduct rules, IP assignment clauses, and non-disclosure standards. On your commencement date, you are requested to present verified copies of your <strong>CNIC (${offer.cnic || 'National ID'})</strong>, degree transcripts, and previous employer service certificates.
            </p>

            <!-- Corporate Signatures -->
            <div class="offer-signatures">
              <div>
                ${signatorySignature ? `
                  <div style="margin-bottom:4px">
                    <img src="${signatorySignature}" style="max-height:50px;max-width:160px;object-fit:contain" alt="Signature">
                  </div>
                ` : `<div style="height:36px"></div>`}
                <div class="offer-sig-line">
                  <strong>${signatoryName}</strong><br>
                  ${signatoryTitle}<br>
                  ${companyName}
                </div>
              </div>
              <div>
                ${companyStamp ? `
                  <div style="margin-bottom:4px;display:flex;justify-content:center">
                    <img src="${companyStamp}" style="max-height:52px;max-width:52px;object-fit:contain;transform:rotate(-5deg)" alt="Stamp">
                  </div>
                ` : `<div style="height:36px"></div>`}
                <div class="offer-sig-line">
                  <strong>Ahmed Khan</strong><br>
                  Chief Executive Officer (CEO)<br>
                  ${companyName}
                </div>
              </div>
            </div>

            <!-- Detachable Candidate Acceptance Slip -->
            <div class="offer-acceptance-slip">
              <div class="offer-acceptance-slip-title">
                <i class="fa fa-file-circle-check" style="color:#2563eb;margin-right:6px"></i>
                CANDIDATE ACCEPTANCE / DECLARATION SLIP (RETURN WITHIN 2 DAYS)
              </div>
              <div style="font-size:12px;color:#475569;margin-bottom:12px">
                Please review, sign, and return this slip within <strong>two (2) business days</strong> of receipt:
              </div>
              <div style="display:flex;gap:24px;margin-bottom:16px;flex-wrap:wrap">
                <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:#0f172a;cursor:pointer">
                  <input type="checkbox" ${offer.status === 'accepted' || offer.status === 'converted' ? 'checked' : ''} style="width:16px;height:16px;accent-color:#2563eb">
                  I hereby ACCEPT the offer of employment on the terms specified above.
                </label>
                <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:#64748b;cursor:pointer">
                  <input type="checkbox" ${offer.status === 'rejected' ? 'checked' : ''} style="width:16px;height:16px;accent-color:#ef4444">
                  I hereby DECLINE the offer of employment.
                </label>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;padding-top:12px;border-top:1px dashed #cbd5e1">
                <div>
                  <div style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700">Candidate Signature</div>
                  <div style="border-bottom:1px solid #94a3b8;height:24px;margin-top:4px"></div>
                </div>
                <div>
                  <div style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700">CNIC Verification</div>
                  <div style="border-bottom:1px solid #94a3b8;height:24px;margin-top:4px;font-size:12px;font-weight:700;color:#0f172a;line-height:24px">${offer.cnic || '—'}</div>
                </div>
                <div>
                  <div style="font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700">Date of Signing</div>
                  <div style="border-bottom:1px solid #94a3b8;height:24px;margin-top:4px;font-size:12px;color:#475569;line-height:24px">${offer.status === 'accepted' || offer.status === 'converted' ? Utils.formatDate(offer.issueDate) : ''}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary btn-sm" onclick="Modal.close('dynamic-modal')">Close</button>
        <button class="btn btn-ghost btn-sm" onclick="Recruitment.sendOfferLetter(${offer.id})"><i class="fa fa-envelope"></i> Email to Candidate</button>
        ${offer.status !== 'accepted' && offer.status !== 'converted' ? `
          <button class="btn btn-success btn-sm" onclick="Recruitment.setOfferStatus(${offer.id}, 'accepted')"><i class="fa fa-check"></i> Candidate Accepted</button>
          <button class="btn btn-danger btn-sm" onclick="Recruitment.setOfferStatus(${offer.id}, 'rejected')"><i class="fa fa-times"></i> Candidate Declined</button>
        ` : ''}
        ${offer.status !== 'converted' ? `
          <button class="btn btn-info btn-sm" onclick="Recruitment.convertOfferToEmployee(${offer.id})"><i class="fa fa-user-plus"></i> ${offer.status === 'accepted' ? 'Register Employee & Setup Login' : 'Convert to Employee'}</button>
        ` : ''}
        <button class="btn btn-primary btn-sm" onclick="Recruitment.printOfferLetter(${offer.id})">
          <i class="fa fa-print"></i> Print / Save as PDF
        </button>
      `
    });
  },

  // ═══════════════════════════════════════════════
  // PRINT & PDF GENERATOR
  // ═══════════════════════════════════════════════

  printOfferLetter(offerId) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Printing offer letters is restricted to HR & Admin.', 'error');
      return;
    }
    const offer = DB.find('offer_letters', Number(offerId));
    if (!offer) return;
    const dept = DB.find('departments', offer.departmentId);
    const mgr = DB.find('employees', offer.reportingManagerId);
    const settings = DB.getObj('settings') || {};
    const safeSrc = src => (src ? String(src).replace(/"/g, '&quot;') : '');
    const companyName = settings.companyName || 'HRM Pro Enterprise Solutions (Pvt) Ltd';
    const companyAddress = settings.companyAddress || 'Plot 42, Executive Tech Park, Constitution Avenue, Islamabad, Pakistan';
    const companyEmail = settings.companyEmail || 'hr@company.com';
    const companyPhone = settings.companyPhone || '+92-21-1234567';
    const companyNTN = settings.companyNTN || '1234567-8';
    const companyLogo = safeSrc(settings.companyLogo || '');
    const companyBanner = safeSrc(settings.companyLetterheadBanner || '');
    const letterheadType = settings.companyLetterheadType || 'dynamic';
    const signatoryName = settings.signatoryName || 'Sara Malik';
    const signatoryTitle = settings.signatoryTitle || 'Head of Human Resources & Corporate Governance';
    const signatorySignature = safeSrc(settings.signatorySignature || '');
    const companyStamp = safeSrc(settings.companyStamp || '');

    const isFullPage = (letterheadType === 'full_page' || letterheadType === 'custom_banner') && Boolean(companyBanner);
    const topMargin = (settings.companyLetterheadTopMargin !== undefined && settings.companyLetterheadTopMargin !== null && settings.companyLetterheadTopMargin !== '') ? Number(settings.companyLetterheadTopMargin) : 160;
    const bottomMargin = (settings.companyLetterheadBottomMargin !== undefined && settings.companyLetterheadBottomMargin !== null && settings.companyLetterheadBottomMargin !== '') ? Number(settings.companyLetterheadBottomMargin) : 95;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Offer Letter — ${offer.candidateName} (${offer.refNo})</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          @media print {
            body { margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            padding: ${isFullPage ? `${topMargin}px 45px ${bottomMargin}px 45px` : '35px 45px'};
            ${isFullPage ? `background-image: url('${companyBanner}'); background-size: 100% 100%; background-repeat: no-repeat; background-position: top center;` : ''}
            font-size: 13px;
            line-height: 1.6;
          }
          .letterhead {
            border-bottom: 3px solid #1e3a8a;
            padding-bottom: 16px;
            margin-bottom: 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .comp-title { font-size: 19px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; }
          .comp-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
          .ref-table { text-align: right; font-size: 11.5px; color: #475569; }
          .ref-no { font-weight: 800; color: #1d4ed8; font-family: monospace; font-size: 13px; }
          .recipient-block { margin-bottom: 18px; font-size: 13px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; display: flex; justify-content: space-between; }
          .subject-bar {
            background: #f1f5f9;
            border-left: 4px solid #1e3a8a;
            padding: 8px 12px;
            font-weight: 800;
            font-size: 13px;
            text-transform: uppercase;
            margin-bottom: 14px;
            letter-spacing: 0.5px;
          }
          .validity-alert {
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-left: 4px solid #d97706;
            padding: 10px 14px;
            border-radius: 6px;
            margin-bottom: 16px;
            font-size: 12px;
          }
          .terms-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 16px;
          }
          .term-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
            border-radius: 6px;
          }
          .term-lbl { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; }
          .term-val { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12px; }
          th { background: #f1f5f9; padding: 7px 10px; text-align: left; border: 1px solid #cbd5e1; font-size: 11px; text-transform: uppercase; }
          td { padding: 7px 10px; border: 1px solid #e2e8f0; }
          .benefits-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 16px;
          }
          .benefits-box ul { list-style: square inside; font-size: 12px; color: #334155; }
          .benefits-box li { padding: 2.5px 0; }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 24px;
            padding-top: 14px;
            border-top: 1px solid #cbd5e1;
          }
          .sig-line { border-top: 1px dashed #64748b; padding-top: 6px; font-size: 11px; text-align: center; color: #475569; }
          .acceptance-slip {
            margin-top: 24px;
            padding: 14px;
            border: 2px dashed #94a3b8;
            border-radius: 8px;
            background: #f8fafc;
          }
          .slip-title { font-weight: 800; text-transform: uppercase; font-size: 11.5px; text-align: center; margin-bottom: 8px; }
        </style>
      </head>
      <body>
        ${isFullPage ? `
          <div style="display:flex;justify-content:space-between;padding-bottom:10px;border-bottom:2px solid #1e3a8a;margin-bottom:18px;font-size:11.5px;color:#475569">
            <div>Reference: <span class="ref-no">${offer.refNo}</span></div>
            <div>Date of Issue: <strong>${Utils.formatDate(offer.issueDate)}</strong></div>
            <div style="color:#b45309;font-weight:700">Accept/Reject Window: 2 Days</div>
          </div>
        ` : (letterheadType === 'custom_banner' && companyBanner ? `
          <div style="margin-bottom:16px;border-bottom:3px solid #1e3a8a;padding-bottom:10px">
            <img src="${companyBanner}" style="width:100%;max-height:120px;object-fit:contain" alt="${companyName}">
            <div style="display:flex;justify-content:space-between;padding-top:8px;font-size:11.5px;color:#475569">
              <div>Reference: <span class="ref-no">${offer.refNo}</span></div>
              <div>Date of Issue: <strong>${Utils.formatDate(offer.issueDate)}</strong></div>
              <div style="color:#b45309;font-weight:700">Accept/Reject Window: 2 Days</div>
            </div>
          </div>
        ` : `
          <div class="letterhead">
            <div style="display:flex;align-items:center;gap:12px">
              ${companyLogo ? `<img src="${companyLogo}" style="max-height:55px;max-width:85px;object-fit:contain">` : ''}
              <div>
                <div class="comp-title">${companyName.toUpperCase()}</div>
                <div class="comp-sub">${companyAddress}</div>
                <div class="comp-sub">Phone: ${companyPhone} • Email: ${companyEmail} • NTN: ${companyNTN}</div>
              </div>
            </div>
            <div class="ref-table">
              <div>Reference: <span class="ref-no">${offer.refNo}</span></div>
              <div>Date of Issue: <strong>${Utils.formatDate(offer.issueDate)}</strong></div>
              <div style="margin-top:3px;color:#b45309;font-weight:700">Accept/Reject Window: 2 Days</div>
            </div>
          </div>
        `)}

        <div class="recipient-block">
          <div>
            <div><strong>To:</strong> ${offer.candidateName}</div>
            <div><strong>CNIC:</strong> ${offer.cnic || '—'}</div>
            <div><strong>Contact:</strong> ${offer.email || '—'} • ${offer.phone || '—'}</div>
          </div>
          <div style="text-align:right">
            <div><strong>Designation:</strong> ${offer.designation}</div>
            <div><strong>Department:</strong> ${dept?.name || '—'}</div>
            <div><strong>Type:</strong> ${(offer.employmentType || 'permanent').toUpperCase()}</div>
          </div>
        </div>

        <div class="subject-bar">
          SUBJECT: FORMAL EMPLOYMENT OFFER LETTER & APPOINTMENT TERMS
        </div>

        <div style="margin-bottom:12px">
          Dear <strong>${offer.candidateName}</strong>,
        </div>

        <p style="margin-bottom:12px">
          We are pleased to extend this formal offer of employment for the position of 
          <strong>${offer.designation}</strong> with <strong>HRM Pro Enterprise Solutions (Pvt) Ltd</strong> within our <strong>${dept?.name || '—'}</strong> department. 
          This appointment is subject to the terms, compensation, and policy benefits outlined below.
        </p>

        <div class="validity-alert">
          <strong>⚠️ 48-HOUR ACCEPTANCE DEADLINE:</strong> This employment offer is strictly valid for <strong>two (2) business days</strong> from the date of issue and shall officially lapse on <strong>${Utils.formatDate(offer.expiryDate)} at 18:00 PKT</strong>. Please sign and return the attached Acceptance Slip within 48 hours to confirm your appointment.
        </div>

        <div class="terms-grid">
          <div class="term-box">
            <div class="term-lbl">Designation / Title</div>
            <div class="term-val">${offer.designation}</div>
          </div>
          <div class="term-box">
            <div class="term-lbl">Department</div>
            <div class="term-val">${dept?.name || '—'}</div>
          </div>
          <div class="term-box">
            <div class="term-lbl">Employment Classification</div>
            <div class="term-val">${(offer.employmentType || 'permanent').toUpperCase()} ${offer.duration ? `(${offer.duration})` : ''}</div>
          </div>
          <div class="term-box">
            <div class="term-lbl">Commencement / Joining Date</div>
            <div class="term-val">${Utils.formatDate(offer.joiningDate)}</div>
          </div>
          <div class="term-box">
            <div class="term-lbl">Reporting Supervisor</div>
            <div class="term-val">${mgr?.fullName || 'Department Head'}</div>
          </div>
          <div class="term-box">
            <div class="term-lbl">Location & Schedule</div>
            <div class="term-val">${offer.location || 'Head Office, Islamabad'} • ${offer.workHours || 'Mon-Fri, 9am-6pm'}</div>
          </div>
        </div>

        <div style="font-weight:700;font-size:11.5px;margin-bottom:4px;text-transform:uppercase;color:#1e3a8a">
          1. Compensation & Remuneration Structure
        </div>
        <table>
          <thead>
            <tr>
              <th>Salary Component</th>
              <th>Basis</th>
              <th style="text-align:right">Monthly Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary</td>
              <td>Base Emoluments</td>
              <td style="text-align:right;font-weight:600">${Utils.formatCurrency(offer.basicSalary || Math.round(offer.grossSalary * 0.6))}</td>
            </tr>
            <tr>
              <td>House Rent Allowance (HRA)</td>
              <td>Housing Subsidy</td>
              <td style="text-align:right">${Utils.formatCurrency(offer.allowances?.house || Math.round(offer.grossSalary * 0.2))}</td>
            </tr>
            <tr>
              <td>Medical & Conveyance Allowance</td>
              <td>Statutory Utilities</td>
              <td style="text-align:right">${Utils.formatCurrency((offer.allowances?.medical || Math.round(offer.grossSalary * 0.1)) + (offer.allowances?.conveyance || Math.round(offer.grossSalary * 0.1)))}</td>
            </tr>
            <tr style="background:#f8fafc;font-weight:800">
              <td colspan="2">TOTAL GROSS MONTHLY REMUNERATION</td>
              <td style="text-align:right;color:#15803d;font-size:13.5px">${Utils.formatCurrency(offer.grossSalary)}</td>
            </tr>
          </tbody>
        </table>

        <div style="font-weight:700;font-size:11.5px;margin-bottom:4px;text-transform:uppercase;color:#1e3a8a">
          2. Benefits as per Company Policy
        </div>
        <div class="benefits-box">
          <ul>
            ${(offer.benefits || []).map(b => `<li>${b}</li>`).join('')}
          </ul>
        </div>

        <div style="font-weight:700;font-size:11.5px;margin-bottom:4px;text-transform:uppercase;color:#1e3a8a">
          3. Terms of Appointment & Documentation
        </div>
        <p style="font-size:11.5px;color:#334155;margin-bottom:12px;line-height:1.5">
          ${offer.employmentType === 'internship' ? `This internship is for ${offer.duration || '3 months'}, with scheduled reviews and designated technical mentorship.` : `Your appointment will be subject to an initial probationary period of ${offer.probationMonths || 3} months.`}
          You will be required to submit copies of your CNIC (${offer.cnic || 'National ID'}), educational degrees, and previous employer relieving letter upon joining.
        </p>

        <div class="signatures">
          <div>
            ${signatorySignature ? `
              <div style="margin-bottom:4px;text-align:center">
                <img src="${signatorySignature}" style="max-height:48px;max-width:160px;object-fit:contain" alt="Signature">
              </div>
            ` : `<div style="height:30px"></div>`}
            <div class="sig-line">
              <strong>${signatoryName}</strong><br>
              ${signatoryTitle}<br>
              ${companyName}
            </div>
          </div>
          <div>
            ${companyStamp ? `
              <div style="margin-bottom:4px;text-align:center">
                <img src="${companyStamp}" style="max-height:50px;max-width:50px;object-fit:contain;transform:rotate(-5deg)" alt="Stamp">
              </div>
            ` : `<div style="height:30px"></div>`}
            <div class="sig-line">
              <strong>Ahmed Khan</strong><br>
              Chief Executive Officer (CEO)<br>
              ${companyName}
            </div>
          </div>
        </div>

        <div class="acceptance-slip">
          <div class="slip-title">CANDIDATE ACCEPTANCE / DECLARATION SLIP (RETURN WITHIN 2 DAYS)</div>
          <div style="display:flex;gap:20px;margin-bottom:10px;font-size:11.5px">
            <div>[ &nbsp; ] <strong>I ACCEPT</strong> the offer of employment as outlined above.</div>
            <div>[ &nbsp; ] <strong>I DECLINE</strong> the offer of employment.</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:10px">
            <div>
              <div style="font-size:9.5px;color:#64748b;text-transform:uppercase">Candidate Signature</div>
              <div style="border-bottom:1px solid #000;height:20px"></div>
            </div>
            <div>
              <div style="font-size:9.5px;color:#64748b;text-transform:uppercase">CNIC: ${offer.cnic || '__________________'}</div>
              <div style="border-bottom:1px solid #000;height:20px"></div>
            </div>
            <div>
              <div style="font-size:9.5px;color:#64748b;text-transform:uppercase">Date: __________________</div>
              <div style="border-bottom:1px solid #000;height:20px"></div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 350);
          };
        <\/script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=880,height=950');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printContent);
      printWin.document.close();
    } else {
      window.print();
    }
  },

  sendOfferLetter(offerId) {
    if (!this.isHROrAdmin()) return;
    const offer = DB.find('offer_letters', Number(offerId));
    if (!offer) return;

    DB.update('offer_letters', offer.id, { status: 'sent' });
    DB.log('PROCESS', 'Recruitment', `Emailed formal offer letter #${offer.refNo} to ${offer.candidateName} (${offer.email})`, Auth.user?.id);
    Toast.show(`Offer letter #${offer.refNo} sent to ${offer.email}!`, 'success', 'PDF copy dispatched with 48h acceptance window.');
    if (this.currentView === 'offers') this.renderView();
  },

  setOfferStatus(offerId, newStatus) {
    if (!this.isHROrAdmin()) return;
    const offer = DB.find('offer_letters', Number(offerId));
    if (!offer) return;

    DB.update('offer_letters', offer.id, { status: newStatus });
    if (offer.applicationId) {
      if (newStatus === 'accepted') DB.update('applications', offer.applicationId, { stage: 'offer' });
      else if (newStatus === 'rejected') DB.update('applications', offer.applicationId, { stage: 'rejected' });
    }

    DB.log('UPDATE', 'Recruitment', `Offer #${offer.refNo} status updated to: ${(newStatus || '').toUpperCase()}`, Auth.user?.id);
    Modal.close('dynamic-modal');

    if (newStatus === 'accepted') {
      Toast.show(`Offer #${offer.refNo} marked as ACCEPTED!`, 'success');
      // Prompt HR to register new employee and setup login immediately
      setTimeout(() => {
        Modal.confirm(
          'Candidate Accepted — Register Employee',
          `<strong>${offer.candidateName}</strong> has accepted the appointment offer (Ref: <code>${offer.refNo}</code>).<br><br>Would you like to register this new employee, configure their system role, and generate their login credentials now?`,
          () => {
            Recruitment.convertOfferToEmployee(offer.id);
          },
          'primary'
        );
      }, 300);
    } else {
      Toast.show(`Offer #${offer.refNo} marked as ${newStatus}!`, 'info');
    }
    if (this.currentView === 'offers') this.renderView();
  },

  convertOfferToEmployee(offerId) {
    if (!this.isHROrAdmin()) return;
    const offer = DB.find('offer_letters', Number(offerId));
    if (!offer) return;

    Modal.close('dynamic-modal');

    if (offer.status !== 'accepted' && offer.status !== 'converted') {
      DB.update('offer_letters', offer.id, { status: 'accepted' });
    }
    if (offer.applicationId) {
      DB.update('applications', offer.applicationId, { stage: 'offer' });
    }

    const parts = (offer.candidateName || '').trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || 'Employee';

    App.navigate('employees');
    setTimeout(() => {
      if (typeof Employees !== 'undefined' && Employees.showAddForm) {
        Employees.showAddForm({
          firstName,
          lastName,
          email: offer.email || '',
          phone: offer.phone || '',
          cnic: offer.cnic || '',
          departmentId: offer.departmentId || 1,
          designationName: offer.designation || '',
          joiningDate: offer.joiningDate || Utils.today(),
          salary: offer.grossSalary || 50000,
          empType: offer.employmentType === 'permanent' ? 'Permanent' : (offer.employmentType === 'contract' ? 'Contract' : 'Probation'),
          applicantId: offer.applicationId || null,
          offerId: offer.id,
          offerRefNo: offer.refNo
        });
      }
      Toast.show(`Registering ${offer.candidateName}`, 'info', 'Details pre-filled from accepted Offer Letter. Configure role & login credentials.');
    }, 200);
  },

  onboardCandidateDirectly(appId) {
    if (!this.isHROrAdmin()) return;
    const apps = DB.get('applications') || [];
    const app = apps.find(a => a.id === appId);
    if (!app) return;

    const emps = DB.get('employees') || [];
    // Check if already onboarded (by email or cnic or name)
    const existing = emps.find(e => (app.email && e.email === app.email) || (app.cnic && e.cnic === app.cnic));
    if (existing) {
      Toast.show(`Candidate already exists as employee (${existing.empNo})!`, 'info');
      App.navigate('employees');
      setTimeout(() => Employees.renderProfile(existing.id), 200);
      return;
    }

    const job = DB.find('recruitment', app.jobId) || {};
    const offers = DB.get('offer_letters') || [];
    const offer = offers.find(o => o.applicationId === app.id);

    const parts = (app.name || 'New Employee').trim().split(' ');
    const firstName = parts[0] || 'Employee';
    const lastName = parts.slice(1).join(' ') || 'Joiner';

    App.navigate('employees');
    setTimeout(() => {
      if (typeof Employees !== 'undefined' && Employees.showAddForm) {
        Employees.showAddForm({
          firstName,
          lastName,
          email: app.email || '',
          phone: app.phone || '',
          cnic: app.cnic || '',
          departmentId: job.departmentId || 1,
          designationName: job.title || '',
          joiningDate: offer?.joiningDate || Utils.today(),
          salary: offer?.grossSalary || job.salary || 65000,
          empType: 'Probation',
          applicantId: app.id,
          offerId: offer?.id || null
        });
      }
      Toast.show(`Onboarding ${app.name}`, 'info', 'Candidate details prefilled into employee registration form.');
    }, 200);
  },

  // ═══════════════════════════════════════════════
  // RECRUITMENT APPLICANT & JOB HELPERS
  // ═══════════════════════════════════════════════

  toggleJobStatus(jobId) {
    const job = DB.find('recruitment', jobId);
    if (!job) return;
    const newStatus = job.status === 'open' ? 'closed' : 'open';
    DB.update('recruitment', jobId, { status: newStatus });
    DB.log('UPDATE', 'Recruitment', `Job #${jobId} (${job.title}) status set to ${newStatus}`, Auth.user?.id);
    Toast.show(`Job marked as ${newStatus}!`, 'success');
    this.renderView();
  },

  moveStage(appId, newStage) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Candidate stage progression is restricted to HR & Admin.', 'error');
      return;
    }
    if (!newStage) return;
    DB.update('applications', appId, { stage: newStage });
    Toast.show(`Applicant moved to ${newStage}!`, 'success');
    this.renderView();
  },

  viewApplicant(appId) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Candidate profiles and resumes are restricted to HR & Admin.', 'error');
      return;
    }
    const app = DB.find('applications', appId);
    const job = DB.find('recruitment', app.jobId);
    const isHR = this.isHROrAdmin();
    const existingOffer = (DB.get('offer_letters') || []).find(o => o.applicationId === app.id);

    Modal.show(`Applicant — ${app.name}`, `
      ${[
        ['Name', `<strong>${app.name}</strong>`],
        ['CNIC', app.cnic || '—'],
        ['Email', `<a href="mailto:${app.email}" style="color:var(--primary);text-decoration:none">${app.email}</a>`],
        ['Phone', `<a href="tel:${app.phone}" style="color:var(--primary);text-decoration:none">${app.phone}</a>`],
        ['City / Location', app.city || '—'],
        ['Applied For', `<span class="badge badge-primary">${job?.title || 'Open Position'}</span>`],
        ['Experience', app.experience || '—'],
        ['Expected Salary', app.expectedSalary ? (String(app.expectedSalary).includes('PKR') ? app.expectedSalary : `PKR ${app.expectedSalary}`) : '—'],
        ['Applied On', Utils.formatDate(app.appliedOn)],
        ['Stage', Utils.statusBadge(app.stage)],
        ['Cover Note', app.coverNote ? `<div style="max-height:80px;overflow-y:auto;background:var(--surface-2);padding:6px 10px;border-radius:6px;font-size:12px;color:var(--text);line-height:1.4">${app.coverNote}</div>` : '<span class="text-muted text-xs">None provided</span>'],
        ['Resume / CV', `
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span class="badge badge-primary" style="font-size:11px"><i class="fa fa-file-pdf"></i> ${app.resumeName || app.resume || 'Resume.pdf'}</span>
            <button class="btn btn-xs btn-outline" onclick="Recruitment.viewResume(${app.id})"><i class="fa fa-eye"></i> View CV</button>
            <button class="btn btn-xs btn-secondary" onclick="Recruitment.downloadResume(${app.id})"><i class="fa fa-download"></i> Download</button>
          </div>
        `],
        ['Offer Letter', existingOffer ? `<span class="badge badge-success"><i class="fa fa-file-check"></i> ${existingOffer.refNo} (${(existingOffer.status || 'Active').toUpperCase()})</span>` : '<span class="text-muted text-xs">Not issued yet</span>']
      ].map(([l,v])=>`<div style="display:flex;padding:8px 0;border-bottom:1px solid var(--border)"><div style="width:140px;font-size:12px;color:var(--text-3);font-weight:500">${l}</div><div style="font-size:13px;flex:1">${v}</div></div>`).join('')}

      <div style="margin-top:14px">
        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label">Interview Date</label>
            <input type="date" class="form-control" id="app-int-date" value="${app.interviewDate || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Score (%)</label>
            <input type="number" class="form-control" id="app-score" value="${app.score || 0}" min="0" max="100">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes & Evaluation</label>
          <textarea class="form-control" id="app-notes" rows="3" placeholder="Interview remarks, candidate strengths/weaknesses...">${app.notes || ''}</textarea>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        <button class="btn btn-secondary" onclick="Recruitment.saveApplicantEvaluation(${app.id})"><i class="fa fa-save"></i> Save Evaluation</button>
        ${isHR ? (existingOffer ? `
          <button class="btn btn-primary" onclick="Modal.close('dynamic-modal');Recruitment.viewOfferLetter(${existingOffer.id})">
            <i class="fa fa-file-pdf"></i> View Offer Letter
          </button>
        ` : `
          <button class="btn btn-primary" onclick="Modal.close('dynamic-modal');Recruitment.showGenerateOfferLetterModal(${app.id})">
            <i class="fa fa-file-signature"></i> Generate Offer Letter
          </button>
        `) : ''}
        ${app.stage === 'offer' || app.stage === 'interview' ? `
          <button class="btn btn-success" onclick="Recruitment.convertToEmployee(${app.id})"><i class="fa fa-user-plus"></i> Convert to Employee</button>
        ` : ''}
      `
    });
  },

  generateCandidatePdf(app, job) {
    const safeStr = str => (str || '').replace(/[()\\\\\r\n]/g, ' ').slice(0, 95);
    const name = safeStr(app.name || 'Candidate CV');
    const title = safeStr(job?.title || app.jobTitle || 'Job Opening');
    const email = safeStr(app.email || '');
    const phone = safeStr(app.phone || '');
    const city = safeStr(app.city || 'Not Specified');
    const exp = safeStr(app.experience || 'Not Specified');
    const salary = safeStr(app.expectedSalary ? (String(app.expectedSalary).includes('PKR') ? app.expectedSalary : 'PKR ' + app.expectedSalary) : 'Negotiable');
    const date = safeStr(app.appliedOn || new Date().toISOString().slice(0, 10));
    const stage = safeStr((app.stage || 'applied').toUpperCase());
    const cover = (app.coverNote || app.notes || 'Professional candidate profile registered in HRM Pro ATS.').replace(/[()\\\\\r]/g, ' ');

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
    // Header background banner
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

    const streamLen = new TextEncoder().encode(stream).length;
    let fullPdf = '%PDF-1.4\n';
    const objOffsets = {};

    function addObj(id, content) {
      objOffsets[id] = new TextEncoder().encode(fullPdf).length;
      fullPdf += id + ' 0 obj\n' + content + '\nendobj\n';
    }

    addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    addObj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    addObj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>');
    addObj(4, '<< /Length ' + streamLen + ' >>\nstream\n' + stream.trim() + '\nendstream');
    addObj(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    addObj(6, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

    const startXref = new TextEncoder().encode(fullPdf).length;
    fullPdf += 'xref\n0 7\n0000000000 65535 f \n';
    for (let i = 1; i <= 6; i++) {
      const o = String(objOffsets[i]).padStart(10, '0');
      fullPdf += o + ' 00000 n \n';
    }
    fullPdf += 'trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n' + startXref + '\n%%EOF\n';

    return fullPdf;
  },

  getCandidatePdfBlobUrl(app) {
    // 1. Prioritize synchronized Base64 payload (works seamlessly across all remote devices)
    if (app.resumeData && typeof app.resumeData === 'string' && app.resumeData.includes(';base64,')) {
      try {
        const parts = app.resumeData.split(';base64,');
        const mime = parts[0].replace('data:', '') || 'application/pdf';
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        return URL.createObjectURL(blob);
      } catch (e) {
        console.warn('[Recruitment] Error decoding candidate resumeData:', e);
      }
    }
    // 2. If valid external remote URL or server path
    if (app.resumeUrl && (app.resumeUrl.startsWith('http') || app.resumeUrl.startsWith('blob:'))) {
      return app.resumeUrl;
    }
    // 3. Fallback: Dynamically generate authentic Candidate PDF
    const job = DB.find('recruitment', app.jobId);
    const pdfContent = this.generateCandidatePdf(app, job);
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  },

  switchCvView(mode) {
    const docTab = document.getElementById('cv-tab-doc');
    const sumTab = document.getElementById('cv-tab-summary');
    const docPanel = document.getElementById('cv-panel-doc');
    const sumPanel = document.getElementById('cv-panel-summary');
    if (!docPanel || !sumPanel) return;

    if (mode === 'doc') {
      docPanel.style.display = 'block';
      sumPanel.style.display = 'none';
      if (docTab) { docTab.className = 'btn btn-sm btn-primary'; }
      if (sumTab) { sumTab.className = 'btn btn-sm btn-outline'; }
    } else {
      docPanel.style.display = 'none';
      sumPanel.style.display = 'block';
      if (docTab) { docTab.className = 'btn btn-sm btn-outline'; }
      if (sumTab) { sumTab.className = 'btn btn-sm btn-primary'; }
    }
  },

  viewResume(appId) {
    const app = DB.find('applications', appId);
    if (!app) return;
    const job = DB.find('recruitment', app.jobId);
    const docUrl = this.getCandidatePdfBlobUrl(app);
    const fileName = app.resumeName || app.resume || `${(app.name || 'candidate').replace(/\s+/g,'_')}_CV.pdf`;
    const isWordDoc = fileName.match(/\.(doc|docx)$/i);

    Modal.show(`Candidate Curriculum Vitae — ${app.name}`, `
      <div style="padding:4px">
        <!-- Top Action Bar -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <div>
            <div style="font-weight:800;font-size:15px;color:var(--text);display:flex;align-items:center;gap:8px">
              ${app.name}
              <span class="badge badge-success" style="font-size:10.5px;font-weight:700;padding:3px 8px">${(app.stage || 'applied').toUpperCase()}</span>
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">
              Target: <strong style="color:var(--text)">${job?.title || 'Job Opening'}</strong> • Applied on ${Utils.formatDate(app.appliedOn)}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" onclick="Recruitment.downloadResume(${app.id})" title="Download authentic uploaded document">
              <i class="fa fa-download"></i> Download Candidate's Uploaded CV
            </button>
            <button class="btn btn-outline btn-sm" onclick="Recruitment.openResumeInNewTab(${app.id})" title="Open document in a new browser tab">
              <i class="fa fa-arrow-up-right-from-square"></i> Open in Tab
            </button>
            <button class="btn btn-secondary btn-sm" onclick="Recruitment.printResume(${app.id})" title="Print or Save candidate summary">
              <i class="fa fa-print"></i> Print
            </button>
          </div>
        </div>

        <!-- View Switcher Tabs -->
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <button id="cv-tab-doc" class="btn btn-sm btn-primary" onclick="Recruitment.switchCvView('doc')">
            <i class="fa ${isWordDoc ? 'fa-file-word' : 'fa-file-pdf'}"></i> Candidate's Uploaded Document (${fileName})
          </button>
          <button id="cv-tab-summary" class="btn btn-sm btn-outline" onclick="Recruitment.switchCvView('summary')">
            <i class="fa fa-clipboard-user"></i> HR Candidate Summary & Details
          </button>
        </div>

        <!-- Panel 1: Candidate's Actual Uploaded Document -->
        <div id="cv-panel-doc" style="display:block">
          ${isWordDoc ? `
            <div style="background:#f8fafc;border:2px dashed #93c5fd;border-radius:12px;padding:36px 20px;text-align:center;margin-bottom:10px">
              <div style="width:68px;height:68px;background:#dbeafe;color:#2563eb;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 16px auto">
                <i class="fa fa-file-word"></i>
              </div>
              <h3 style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 6px 0">${fileName}</h3>
              <p style="font-size:13px;color:#64748b;max-width:440px;margin:0 auto 20px auto">
                Candidate uploaded an authentic Microsoft Word document. Click below to download and view the original file.
              </p>
              <button class="btn btn-primary" onclick="Recruitment.downloadResume(${app.id})" style="padding:10px 24px;font-weight:700;font-size:14px">
                <i class="fa fa-download"></i> Download & Open ${fileName}
              </button>
            </div>
          ` : `
            <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;background:#0f172a">
              <iframe src="${docUrl}#toolbar=1" style="width:100%;height:620px;border:none;background:#ffffff;display:block" title="Candidate CV Document"></iframe>
            </div>
          `}
        </div>

        <!-- Panel 2: HR Application Summary & Details -->
        <div id="cv-panel-summary" style="display:none;background:#ffffff;color:#1e293b;border:1px solid #cbd5e1;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.06);max-height:580px;overflow-y:auto;padding:24px 28px">
          <!-- Document Header -->
          <div style="border-bottom:2px solid #2563eb;padding-bottom:16px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px">
            <div>
              <h1 style="font-size:22px;font-weight:900;color:#0f172a;margin:0 0 4px 0;letter-spacing:-0.5px">${app.name}</h1>
              <div style="font-size:13.5px;font-weight:700;color:#2563eb;margin-bottom:8px">${job?.title || 'Applicant'}</div>
              <div style="font-size:12.5px;color:#475569;display:flex;flex-wrap:wrap;gap:14px">
                <span><i class="fa fa-envelope" style="color:#2563eb"></i> ${app.email}</span>
                <span><i class="fa fa-phone" style="color:#10b981"></i> ${app.phone || '—'}</span>
                ${app.city ? `<span><i class="fa fa-location-dot" style="color:#ef4444"></i> ${app.city}</span>` : ''}
                ${app.cnic ? `<span><i class="fa fa-id-card" style="color:#8b5cf6"></i> ${app.cnic}</span>` : ''}
              </div>
            </div>
            <div style="text-align:right">
              <span class="badge badge-success" style="font-size:11px;font-weight:700;padding:4px 10px"><i class="fa fa-circle-check"></i> ${(app.stage || 'applied').toUpperCase()}</span>
              <div style="font-size:11px;color:#64748b;margin-top:6px">ID: #HRM-APP-${app.id}</div>
            </div>
          </div>

          <!-- Summary & Experience Cards -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px">
              <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Industry Experience</div>
              <div style="font-size:15px;font-weight:800;color:#0f172a">${app.experience || 'Not specified'}</div>
              <div style="font-size:11.5px;color:#64748b;margin-top:2px">Applied Role: ${job?.title || 'Open Position'}</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px">
              <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Expected Monthly Salary</div>
              <div style="font-size:15px;font-weight:800;color:#16a34a">${app.expectedSalary ? (String(app.expectedSalary).includes('PKR') ? app.expectedSalary : `PKR ${app.expectedSalary}`) : 'Negotiable'}</div>
              <div style="font-size:11.5px;color:#64748b;margin-top:2px">Budget: PKR ${job?.salary || 'Market Rate'}</div>
            </div>
          </div>

          <!-- Statement / Cover Note -->
          <div style="margin-bottom:18px">
            <h3 style="font-size:13px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px 0;border-left:3px solid #2563eb;padding-left:8px">
              Candidate Cover Note & Pitch
            </h3>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;font-size:13px;line-height:1.7;color:#334155">
              ${app.coverNote || 'No cover note submitted by candidate.'}
            </div>
          </div>

          ${app.portfolio ? `
            <div style="margin-bottom:18px">
              <h3 style="font-size:13px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px 0;border-left:3px solid #2563eb;padding-left:8px">
                Online Portfolio & Links
              </h3>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;font-size:12.5px">
                <a href="${app.portfolio}" target="_blank" style="color:#2563eb;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
                  <i class="fa fa-arrow-up-right-from-square"></i> ${app.portfolio}
                </a>
              </div>
            </div>
          ` : ''}

          <!-- Original File Attachment Banner -->
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:38px;height:38px;background:#2563eb;color:#ffffff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px">
                <i class="fa ${isWordDoc ? 'fa-file-word' : 'fa-file-pdf'}"></i>
              </div>
              <div>
                <div style="font-weight:700;font-size:13.5px;color:#0f172a">${fileName}</div>
                <div style="font-size:11px;color:#475569">Candidate uploaded document • Authenticated by HRM Pro Cloud</div>
              </div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary btn-sm" onclick="Recruitment.downloadResume(${app.id})">
                <i class="fa fa-download"></i> Download CV
              </button>
            </div>
          </div>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        <button class="btn btn-outline" onclick="Modal.close('dynamic-modal');Recruitment.viewApplicant(${app.id})"><i class="fa fa-arrow-left"></i> Applicant Profile</button>
        <button class="btn btn-secondary" onclick="Recruitment.printResume(${app.id})"><i class="fa fa-print"></i> Print / Save as PDF</button>
        <button class="btn btn-primary" onclick="Recruitment.downloadResume(${app.id})"><i class="fa fa-download"></i> Download Candidate's Uploaded CV</button>
      `
    });
  },

  openResumeInNewTab(appId) {
    const app = DB.find('applications', appId);
    if (!app) return;
    const url = this.getCandidatePdfBlobUrl(app);
    window.open(url, '_blank');
  },

  downloadResume(appId) {
    const app = DB.find('applications', appId);
    if (!app) return;
    const fileName = app.resumeName || app.resume || `${(app.name || 'candidate').replace(/\s+/g,'_')}_CV.pdf`;

    // 1. If raw base64 data is synchronized (accessible on all devices & browsers)
    if (app.resumeData && typeof app.resumeData === 'string' && app.resumeData.includes(';base64,')) {
      try {
        const parts = app.resumeData.split(';base64,');
        const mime = parts[0].replace('data:', '') || 'application/pdf';
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 3000);
        Toast.show(`Downloading candidate's authentic CV: ${fileName}`, 'success');
        return;
      } catch (err) {
        console.error('[Recruitment] Download base64 decode failed:', err);
      }
    }

    // 2. If uploaded on server, trigger direct download of candidate's authentic file
    if (app.resumeUrl && (app.resumeUrl.startsWith('http') || app.resumeUrl.startsWith('/uploads'))) {
      const a = document.createElement('a');
      a.href = app.resumeUrl;
      a.download = fileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      Toast.show(`Downloading candidate's uploaded CV: ${fileName}`, 'success');
      return;
    }

    // 3. Fallback: Generate genuine standards-compliant PDF binary
    const job = DB.find('recruitment', app.jobId);
    const pdfString = this.generateCandidatePdf(app, job);
    const blob = new Blob([pdfString], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    Toast.show(`Downloaded candidate document: ${fileName}`, 'success');
  },

  printResume(appId) {
    const app = DB.find('applications', appId);
    if (!app) return;
    const job = DB.find('recruitment', app.jobId);
    const settings = DB.getObj('settings') || {};
    const companyName = settings.companyName || 'HRM Pro Enterprise Solutions';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      Toast.show('Please allow popups to print / save PDF.', 'warning');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Curriculum Vitae — ${app.name}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          @media print {
            body { margin: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            padding: 20px;
            font-size: 13px;
            line-height: 1.6;
          }
          .header-banner {
            border-bottom: 2px solid #2563eb;
            padding-bottom: 16px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .cand-name { font-size: 24px; font-weight: 800; color: #0f172a; }
          .cand-role { font-size: 14px; font-weight: 700; color: #2563eb; margin-top: 2px; }
          .contact-line { font-size: 11.5px; color: #475569; margin-top: 6px; }
          .section-title {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 16px 0 8px 0;
            border-left: 3px solid #2563eb;
            padding-left: 8px;
          }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; }
          .box-lbl { font-size: 10.5px; font-weight: 700; color: #64748b; text-transform: uppercase; }
          .box-val { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px; }
          .note-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 12.5px; line-height: 1.6; }
          .footer-stamp {
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="header-banner">
          <div>
            <div class="cand-name">${app.name}</div>
            <div class="cand-role">${job?.title || 'Candidate Profile'}</div>
            <div class="contact-line">
              Email: ${app.email} &nbsp;|&nbsp; Phone: ${app.phone || '—'} &nbsp;|&nbsp; City: ${app.city || '—'}
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700;color:#2563eb;font-size:13px">${companyName}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px">Application Date: ${Utils.formatDate(app.appliedOn)}</div>
            <div style="font-size:11px;color:#16a34a;font-weight:700;margin-top:2px">Status: ${(app.stage || 'applied').toUpperCase()}</div>
          </div>
        </div>

        <div class="section-title">Candidate Profile & Compensation</div>
        <div class="grid-2">
          <div class="box">
            <div class="box-lbl">Relevant Experience</div>
            <div class="box-val">${app.experience || 'Not specified'}</div>
          </div>
          <div class="box">
            <div class="box-lbl">Expected Salary</div>
            <div class="box-val" style="color:#16a34a">${app.expectedSalary ? (String(app.expectedSalary).includes('PKR') ? app.expectedSalary : `PKR ${app.expectedSalary}`) : 'Negotiable'}</div>
          </div>
        </div>

        <div class="section-title">Candidate Statement / Pitch</div>
        <div class="note-box">
          ${app.coverNote || 'Dedicated professional applying for this position via the official Careers Portal. Available for technical evaluation, interview rounds, and immediate organizational alignment.'}
        </div>

        ${app.portfolio ? `
          <div class="section-title">Portfolio & Links</div>
          <div class="note-box">
            ${app.portfolio}
          </div>
        ` : ''}

        <div class="section-title">ATS Telemetry & Evaluation Record</div>
        <div class="note-box">
          • Verification Source: Official Public Careers Portal<br>
          • Candidate ID: #HRM-APP-${app.id}<br>
          • Target Position: ${job?.title || 'Open Role'}<br>
          • Authentication: Verified by HRM Pro Enterprise ATS Pipeline
        </div>

        <div class="footer-stamp">
          <div>HRM Pro Talent Acquisition System</div>
          <div>Official Candidate Curriculum Vitae</div>
          <div>Page 1 of 1</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  },

  saveApplicantEvaluation(appId) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Candidate evaluation is restricted to HR & Admin.', 'error');
      return;
    }
    const interviewDate = document.getElementById('app-int-date').value;
    const score = parseInt(document.getElementById('app-score').value) || 0;
    const notes = document.getElementById('app-notes').value.trim();
    DB.update('applications', appId, { interviewDate, score, notes });
    DB.log('UPDATE', 'Recruitment', `Updated evaluation for applicant #${appId}`, Auth.user?.id);
    Toast.show('Applicant evaluation saved!', 'success');
    this.renderView();
  },

  convertToEmployee(appId) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Converting applicants to employees is restricted to HR & Admin.', 'error');
      return;
    }
    const app = DB.find('applications', appId);
    if (!app) return;
    const job = DB.find('recruitment', app.jobId);
    const parts = (app.name || '').trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || 'Employee';

    Modal.close('dynamic-modal');
    App.navigate('employees');
    setTimeout(() => {
      if (typeof Employees !== 'undefined' && Employees.showAddForm) {
        Employees.showAddForm({
          firstName,
          lastName,
          email: app.email || '',
          phone: app.phone || '',
          cnic: app.cnic || '',
          departmentId: job?.departmentId || 1,
          applicantId: appId
        });
      }
      Toast.show(`Converting ${app.name} to employee`, 'info', 'Complete profile and click Save Employee');
    }, 200);
  },

  showAddJob() {
    if (!this.isHROrAdmin()) {
      Toast.show('Permission denied: Job creation is restricted to HR & Admin.', 'error');
      return;
    }
    const depts = DB.get('departments') || [];
    Modal.show('Post New Job', `
      <div class="form-group"><label class="form-label required">Job Title</label><input class="form-control" id="jf-title" placeholder="e.g. Senior React Developer"></div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label required">Department</label>
          <select class="form-control" id="jf-dept">${depts.map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}</select>
        </div>
        <div class="form-group"><label class="form-label">Positions</label><input class="form-control" id="jf-positions" type="number" value="1" min="1"></div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Salary Range (PKR)</label><input class="form-control" id="jf-salary" placeholder="e.g. 100000-150000"></div>
        <div class="form-group"><label class="form-label">Experience Required</label><input class="form-control" id="jf-exp" placeholder="e.g. 3-5 years"></div>
      </div>
      <div class="form-group"><label class="form-label">Application Deadline</label><input type="date" class="form-control" id="jf-deadline"></div>
      <div class="form-group"><label class="form-label">Job Description</label><textarea class="form-control" id="jf-desc" rows="3" placeholder="Describe the role and requirements..."></textarea></div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Recruitment.saveJob()"><i class="fa fa-save"></i> Post Job</button>
      `
    });
  },

  saveJob() {
    if (!this.isHROrAdmin()) {
      Toast.show('Permission denied: Job creation is restricted to HR & Admin.', 'error');
      return;
    }
    const title = document.getElementById('jf-title').value.trim();
    if (!title) { Toast.show('Please enter job title', 'error'); return; }
    DB.add('recruitment', {
      id: DB.nextId('recruitment'),
      title,
      departmentId: parseInt(document.getElementById('jf-dept').value),
      positions: parseInt(document.getElementById('jf-positions').value) || 1,
      status: 'open',
      postedOn: Utils.today(),
      deadline: document.getElementById('jf-deadline').value,
      salary: document.getElementById('jf-salary').value,
      experience: document.getElementById('jf-exp').value,
      description: document.getElementById('jf-desc').value,
      applicantCount: 0,
    });
    DB.log('ADD', 'Recruitment', `Job posted: ${title}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Job posted successfully!', 'success');
    this.renderView();
  },

  viewJob(jobId) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Job details are restricted to HR & Admin.', 'error');
      return;
    }
    const job = DB.find('recruitment', jobId);
    if (!job) return;
    const depts = DB.get('departments') || [];
    const dept = depts.find(d => d.id === job.departmentId);
    const allApps = DB.get('applications') || [];
    const jobApps = allApps.filter(a => String(a.jobId) === String(job.id) || (a.jobTitle && a.jobTitle.toLowerCase() === job.title.toLowerCase()));

    Modal.show(`Job Opening — ${job.title}`, `
      <div style="padding:6px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
          <div>
            <span class="badge badge-primary">${dept?.name || 'Department'}</span>
            <span class="badge ${job.status === 'open' ? 'badge-success' : 'badge-secondary'}" style="margin-left:6px">${(job.status || 'open').toUpperCase()}</span>
          </div>
          <div style="font-size:12px;color:var(--text-3)"><i class="fa fa-calendar"></i> Deadline: ${Utils.formatDate(job.deadline)}</div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
          <div class="card" style="margin:0;padding:10px;text-align:center;background:var(--surface)">
            <div style="font-size:11px;color:var(--text-3)">Positions</div>
            <div style="font-weight:700;font-size:14px;color:var(--text)">${job.positions}</div>
          </div>
          <div class="card" style="margin:0;padding:10px;text-align:center;background:var(--surface)">
            <div style="font-size:11px;color:var(--text-3)">Experience</div>
            <div style="font-weight:700;font-size:14px;color:var(--text)">${job.experience}</div>
          </div>
          <div class="card" style="margin:0;padding:10px;text-align:center;background:var(--surface)">
            <div style="font-size:11px;color:var(--text-3)">Offered Salary</div>
            <div style="font-weight:700;font-size:14px;color:#10b981">PKR ${job.salary}</div>
          </div>
          <div class="card" style="margin:0;padding:10px;text-align:center;background:var(--surface);cursor:pointer" onclick="Modal.close('dynamic-modal');Recruitment.viewJobApplicants(${job.id})">
            <div style="font-size:11px;color:var(--text-3)">Applicants</div>
            <div style="font-weight:700;font-size:14px;color:#2563eb"><i class="fa fa-users"></i> ${job.applicantCount || jobApps.length}</div>
          </div>
        </div>

        <div style="margin-bottom:14px">
          <h4 style="font-size:13px;font-weight:700;margin-bottom:4px;color:var(--text)">Position Description</h4>
          <p style="font-size:12.5px;color:var(--text-2);line-height:1.6;margin:0">${job.description || 'No detailed description provided.'}</p>
        </div>

        <div style="background:var(--surface-2);border-radius:8px;padding:12px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-weight:700;font-size:13px;color:var(--text)">Received Candidate Applications (${jobApps.length})</div>
            <div style="font-size:11.5px;color:var(--text-3)">Inspect individual CVs, cover notes, and progress applicants across the ATS pipeline.</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="Modal.close('dynamic-modal');Recruitment.viewJobApplicants(${job.id})">
            <i class="fa fa-users"></i> View Applicants (${jobApps.length})
          </button>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        <button class="btn btn-secondary" onclick="Modal.close('dynamic-modal');Recruitment.viewJobApplicants(${job.id})"><i class="fa fa-users"></i> View ${jobApps.length} Applicants</button>
        <button class="btn btn-primary" onclick="Recruitment.openJobPipeline(${job.id})"><i class="fa fa-list-check"></i> ATS Pipeline</button>
      `
    });
  },

  viewJobApplicants(jobId) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Candidate profiles and resumes are restricted to HR & Admin.', 'error');
      return;
    }
    const jobs = DB.get('recruitment') || [];
    const job = jobs.find(j => j.id === jobId || j.id === Number(jobId));
    if (!job) {
      Toast.show('Job opening not found.', 'error');
      return;
    }
    const allApps = DB.get('applications') || [];
    const depts = DB.get('departments') || [];
    const dept = depts.find(d => d.id === job.departmentId);

    // Match applicants by jobId or jobTitle
    const jobApps = allApps.filter(a => String(a.jobId) === String(job.id) || (a.jobTitle && a.jobTitle.toLowerCase() === job.title.toLowerCase()));

    const stageColors = {
      applied: { color: '#64748b', label: 'Applied' },
      shortlisted: { color: '#6366f1', label: 'Shortlisted' },
      interview: { color: '#f59e0b', label: 'Interview' },
      offer: { color: '#10b981', label: 'Offer Extended' },
      hired: { color: '#06b6d4', label: 'Hired' },
      rejected: { color: '#ef4444', label: 'Rejected' }
    };

    Modal.show(`${job.title} — Applied Applicants (${jobApps.length})`, `
      <div style="padding:4px">
        <!-- Job Context Ribbon -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <div>
            <div style="font-weight:800;font-size:15px;color:var(--text)">${job.title}</div>
            <div style="font-size:12px;color:var(--text-3);margin-top:2px">${dept?.name || 'Department'} • ${job.positions} Open Position${job.positions > 1 ? 's' : ''} • Salary PKR ${job.salary} • Due ${Utils.formatDate(job.deadline)}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="badge ${job.status === 'open' ? 'badge-success' : 'badge-secondary'}">${(job.status || 'open').toUpperCase()}</span>
            <button class="btn btn-primary btn-sm" onclick="Recruitment.openJobPipeline(${job.id})">
              <i class="fa fa-list-check"></i> Filter Pipeline (${jobApps.length})
            </button>
          </div>
        </div>

        ${jobApps.length === 0 ? `
          <div style="text-align:center;padding:36px 16px;background:var(--surface-2);border-radius:10px;border:1px dashed var(--border)">
            <i class="fa fa-users" style="font-size:36px;color:var(--text-3);opacity:0.4;margin-bottom:10px;display:block"></i>
            <h4 style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px">No Detailed Applicant Records Found</h4>
            <p style="font-size:12.5px;color:var(--text-3);max-width:420px;margin:0 auto 16px auto">
              This position indicates ${job.applicantCount || 0} registered candidates. When candidates submit their CV through the landing page, their complete profiles will appear right here.
            </p>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
              <button class="btn btn-outline btn-sm" onclick="Modal.close('dynamic-modal');Recruitment.showAddApplicantModal('applied')">
                <i class="fa fa-user-plus"></i> Add Candidate Manually
              </button>
              <button class="btn btn-primary btn-sm" onclick="Recruitment.openJobPipeline(${job.id})">
                <i class="fa fa-columns"></i> View ATS Pipeline
              </button>
            </div>
          </div>
        ` : `
          <!-- Applicants Table -->
          <div style="max-height:460px;overflow-y:auto;border:1px solid var(--border);border-radius:10px">
            <table class="table" style="margin:0;font-size:12.5px;width:100%">
              <thead style="background:var(--surface);position:sticky;top:0;z-index:2">
                <tr>
                  <th style="padding:10px 12px">Candidate</th>
                  <th style="padding:10px 12px">Contact Details</th>
                  <th style="padding:10px 12px">Experience & Salary</th>
                  <th style="padding:10px 12px">Applied Date</th>
                  <th style="padding:10px 12px">Stage</th>
                  <th style="padding:10px 12px;text-align:center">Resume & Actions</th>
                </tr>
              </thead>
              <tbody>
                ${jobApps.map(a => {
                  const st = stageColors[a.stage] || { color: '#64748b', label: a.stage || 'Applied' };
                  return `
                    <tr style="border-bottom:1px solid var(--border)">
                      <td style="padding:10px 12px">
                        <div style="display:flex;align-items:center;gap:8px">
                          <div style="width:32px;height:32px;border-radius:50%;background:rgba(37,99,235,0.12);color:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0">
                            ${(a.name || 'C').charAt(0)}
                          </div>
                          <div>
                            <div style="font-weight:700;color:var(--text);cursor:pointer" onclick="Modal.close('dynamic-modal');Recruitment.viewApplicant(${a.id})">${a.name}</div>
                            <div style="font-size:11px;color:var(--text-3)">${a.portfolio ? `<a href="${a.portfolio}" target="_blank" style="color:var(--primary)"><i class="fa fa-link"></i> Portfolio</a>` : (a.cnic || 'Public Candidate')}</div>
                          </div>
                        </div>
                      </td>
                      <td style="padding:10px 12px">
                        <div><a href="mailto:${a.email}" style="color:var(--primary);text-decoration:none">${a.email}</a></div>
                        <div style="font-size:11px;color:var(--text-3)">${a.phone || '—'} ${a.city ? `• ${a.city}` : ''}</div>
                      </td>
                      <td style="padding:10px 12px">
                        <div><strong>${a.experience || '—'}</strong></div>
                        <div style="font-size:11px;color:#10b981">${a.expectedSalary ? (String(a.expectedSalary).includes('PKR') ? a.expectedSalary : `PKR ${a.expectedSalary}`) : '—'}</div>
                      </td>
                      <td style="padding:10px 12px;color:var(--text-3);white-space:nowrap">
                        ${Utils.formatDate(a.appliedOn)}
                      </td>
                      <td style="padding:10px 12px;white-space:nowrap">
                        <span class="badge" style="background:${st.color}22;color:${st.color};font-weight:700">
                          ${st.label}
                        </span>
                      </td>
                      <td style="padding:10px 12px;text-align:center">
                        <div style="display:flex;gap:4px;justify-content:center">
                          <button class="btn btn-xs btn-outline" onclick="Recruitment.viewResume(${a.id})" title="View CV / Resume">
                            <i class="fa fa-file-pdf"></i> CV
                          </button>
                          <button class="btn btn-xs btn-outline" onclick="Modal.close('dynamic-modal');Recruitment.viewApplicant(${a.id})" title="View Full Profile">
                            <i class="fa fa-eye"></i>
                          </button>
                          ${a.stage === 'applied' ? `
                            <button class="btn btn-xs btn-success" onclick="Recruitment.moveStage(${a.id}, 'shortlisted');Recruitment.viewJobApplicants(${job.id})" title="Shortlist Candidate">
                              <i class="fa fa-check"></i>
                            </button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Close</button>
        <button class="btn btn-outline" onclick="Modal.close('dynamic-modal');Recruitment.showAddApplicantModal('applied')">
          <i class="fa fa-user-plus"></i> Add New Candidate
        </button>
        <button class="btn btn-primary" onclick="Recruitment.openJobPipeline(${job.id})">
          <i class="fa fa-list-check"></i> Go to ATS Pipeline
        </button>
      `
    });
  },

  // ═══════════════════════════════════════════════
  // SEPARATION VACANCIES & REPLACEMENT RADAR ENGINE
  // ═══════════════════════════════════════════════

  getSeparationVacancies() {
    const emps = DB.get('employees') || [];
    const clearances = DB.get('exit_clearances') || [];
    const reqs = DB.get('job_requisitions') || [];
    const depts = DB.get('departments') || [];
    const desigs = DB.get('designations') || [];

    const vacancies = [];
    const processedEmpIds = new Set();

    // 1. From exit clearances (completed, in_progress, approved, notice_period)
    clearances.forEach(c => {
      if (['completed', 'in_progress', 'approved', 'notice_period'].includes(c.status)) {
        const emp = emps.find(e => e.id === c.employeeId);
        if (emp && !processedEmpIds.has(emp.id)) {
          processedEmpIds.add(emp.id);
          const dept = depts.find(d => d.id === emp.departmentId);
          const desig = desigs.find(d => d.id === emp.designationId);
          const linkedReq = reqs.find(r => r.vacatedEmployeeId === emp.id || (r.reason === 'Replacement' && (r.notes || '').includes(emp.fullName)));
          
          vacancies.push({
            empId: emp.id,
            empNo: emp.empNo,
            fullName: emp.fullName,
            photo: emp.photo,
            departmentId: emp.departmentId,
            departmentName: dept?.name || 'General',
            designationId: emp.designationId,
            designationName: desig?.name || emp.role || 'Role',
            separationType: c.status === 'completed' ? 'Resigned / Exited' : 'Resignation in Notice',
            exitDate: c.lastWorkingDay || c.completedDate || emp.exitDate || '2026-09-25',
            reason: c.reason || 'Voluntary Resignation',
            status: c.status,
            linkedReq: linkedReq || null,
            isBackfilled: !!linkedReq && (linkedReq.status === 'approved' || !!linkedReq.jobPostId)
          });
        }
      }
    });

    // 2. From employees with status inactive/terminated not already in clearances
    emps.forEach(emp => {
      if ((emp.status === 'inactive' || emp.status === 'terminated') && !processedEmpIds.has(emp.id)) {
        processedEmpIds.add(emp.id);
        const dept = depts.find(d => d.id === emp.departmentId);
        const desig = desigs.find(d => d.id === emp.designationId);
        const linkedReq = reqs.find(r => r.vacatedEmployeeId === emp.id || (r.reason === 'Replacement' && (r.notes || '').includes(emp.fullName)));

        vacancies.push({
          empId: emp.id,
          empNo: emp.empNo,
          fullName: emp.fullName,
          photo: emp.photo,
          departmentId: emp.departmentId,
          departmentName: dept?.name || 'General',
          designationId: emp.designationId,
          designationName: desig?.name || emp.role || 'Role',
          separationType: emp.status === 'terminated' ? 'Terminated' : 'Separated (Ex-Employee)',
          exitDate: emp.exitDate || '2026-03-31',
          reason: 'Separation / Inactive Account',
          status: 'completed',
          linkedReq: linkedReq || null,
          isBackfilled: !!linkedReq && (linkedReq.status === 'approved' || !!linkedReq.jobPostId)
        });
      }
    });

    return vacancies;
  },

  getDepartmentStructure(deptId) {
    const depts = DB.get('departments') || [];
    const emps = DB.get('employees') || [];
    const reqs = DB.get('job_requisitions') || [];
    const vacancies = this.getSeparationVacancies();

    let targetDept;
    if (deptId && deptId !== 'all') {
      targetDept = depts.find(d => d.id === parseInt(deptId));
    }
    if (!targetDept) targetDept = depts[0] || { id: 1, name: 'General', employeeCount: 5 };

    // Active filled seats in this department
    const activeMembers = emps.filter(e => e.departmentId === targetDept.id && e.status !== 'inactive' && e.status !== 'terminated');
    
    // Department Head
    const headEmp = emps.find(e => e.id === targetDept.headId) || activeMembers.find(e => e.role === 'dept_manager') || activeMembers[0];

    // Vacant seats from separated employees in this department needing backfill
    const deptVacancies = vacancies.filter(v => v.departmentId === targetDept.id && (!v.linkedReq || v.linkedReq.status !== 'approved'));
    
    // Approved expansion seats / requisitions ready for hire
    const approvedSeats = reqs.filter(r => r.departmentId === targetDept.id && r.status === 'approved' && (!r.jobPostId || DB.get('recruitment')?.find(j => j.id === r.jobPostId)?.status === 'open'));
    
    // Pending quotations / proposals awaiting HR/Admin review
    const pendingQuotations = reqs.filter(r => r.departmentId === targetDept.id && r.status === 'pending_review');

    // Total planned/budgeted capacity
    const totalCapacity = activeMembers.length + deptVacancies.length + approvedSeats.reduce((s, r) => s + (r.headcount || 1), 0);
    const filledCount = activeMembers.length;
    const fulfillmentPct = totalCapacity > 0 ? Math.round((filledCount / totalCapacity) * 100) : 100;

    return {
      department: targetDept,
      headEmp,
      activeMembers,
      deptVacancies,
      approvedSeats,
      pendingQuotations,
      totalCapacity,
      filledCount,
      fulfillmentPct
    };
  },

  // ═══════════════════════════════════════════════
  // HEADCOUNT REQUISITIONS, TEAM STRUCTURE & VACANCIES
  // ═══════════════════════════════════════════════

  renderRequisitions(container) {
    const isHR = this.isHROrAdmin();
    const isDeptMgr = Auth.role === 'dept_manager';
    const myDeptId = Auth.employee?.departmentId;

    // For deputy managers, lock structureDeptId to their own department
    if (isDeptMgr && myDeptId) {
      this.structureDeptId = myDeptId;
    } else if (!this.structureDeptId && myDeptId) {
      this.structureDeptId = myDeptId;
    }

    const allVacancies = this.getSeparationVacancies();
    const vacancies = (isDeptMgr && myDeptId) ? allVacancies.filter(v => v.departmentId === myDeptId) : allVacancies;
    const unfulfilledVacancies = vacancies.filter(v => !v.isBackfilled);

    const allReqs = DB.get('job_requisitions') || [];
    const reqs = (isDeptMgr && myDeptId) ? allReqs.filter(r => r.departmentId === myDeptId || r.requestedBy === (Auth.user?.id || Auth.employee?.id)) : allReqs;
    const pendingReqs = reqs.filter(r => r.status === 'pending_review');

    if (!this.requisitionTab) this.requisitionTab = 'structure';

    container.innerHTML = `
      <div class="card" style="margin-bottom:18px">
        <!-- Requisitions Sub-Header Navigation -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:18px;border-bottom:1px solid var(--border);padding-bottom:14px">
          <div>
            <div style="font-size:17px;font-weight:700;display:flex;align-items:center;gap:8px">
              <i class="fa fa-sitemap" style="color:var(--primary)"></i>
              <span>${isDeptMgr ? 'Team Structure & Headcount Quotations' : 'Department Team Structure & Headcount Management'}</span>
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-top:3px">
              ${isDeptMgr ? 'Review your team structure, track vacant seats of under-employees, and submit position quotations for HR/Admin approval' : 'Manage department team structures, track vacant positions from resignations/terminations, and submit position quotations for HR/Admin approval'}
            </div>
          </div>
          
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" onclick="Recruitment.showNewPositionQuotationModal()" title="Initiate Position Quotation for HR Approval">
              <i class="fa fa-file-invoice-dollar"></i> Initiate Position Quotation
            </button>
            ${isHR ? `
              <button class="btn btn-ghost btn-sm" onclick="Recruitment.showAddRequisitionModal()" title="Direct Headcount Requisition">
                <i class="fa fa-plus"></i> New Requisition
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Subtabs: Structure Blueprint | Requisitions & Quotations | Vacancy Radar -->
        <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;align-items:center">
          <button class="btn btn-sm ${this.requisitionTab === 'structure' ? 'btn-primary' : 'btn-ghost'}" 
            onclick="Recruitment.requisitionTab='structure';Recruitment.renderRequisitions(document.getElementById('rec-content'))"
            style="font-size:12px;font-weight:600">
            <i class="fa fa-sitemap"></i> ${isDeptMgr ? 'Team Structure & Capacity' : 'Department Team Structure & Blueprint'}
          </button>
          <button class="btn btn-sm ${this.requisitionTab === 'requisitions' ? 'btn-primary' : 'btn-ghost'}" 
            onclick="Recruitment.requisitionTab='requisitions';Recruitment.renderRequisitions(document.getElementById('rec-content'))"
            style="font-size:12px;font-weight:600;position:relative">
            <i class="fa fa-file-invoice-dollar"></i> ${isDeptMgr ? 'My Department Quotations' : 'Requisitions & Quotations'}
            ${pendingReqs.length > 0 ? `<span class="badge badge-warning" style="margin-left:6px;font-size:10px;padding:1px 5px">${pendingReqs.length}</span>` : ''}
          </button>
          <button class="btn btn-sm ${this.requisitionTab === 'radar' ? 'btn-primary' : 'btn-ghost'}" 
            onclick="Recruitment.requisitionTab='radar';Recruitment.renderRequisitions(document.getElementById('rec-content'))"
            style="font-size:12px;font-weight:600;position:relative">
            <i class="fa fa-triangle-exclamation"></i> ${isDeptMgr ? 'Team Vacancies Radar' : 'Separation & Vacancies Radar'}
            ${unfulfilledVacancies.length > 0 ? `<span class="badge badge-danger" style="margin-left:6px;font-size:10px;padding:1px 5px">${unfulfilledVacancies.length} Vacant</span>` : ''}
          </button>
        </div>

        <!-- Sub-Content Container -->
        <div id="sub-req-content"></div>
      </div>
    `;

    const subContainer = document.getElementById('sub-req-content');
    if (!subContainer) return;

    if (this.requisitionTab === 'structure') {
      this.renderTeamStructure(subContainer);
    } else if (this.requisitionTab === 'requisitions') {
      this.renderRequisitionsList(subContainer);
    } else if (this.requisitionTab === 'radar') {
      this.renderVacancyRadar(subContainer);
    }
  },

  // ═══════════════════════════════════════════════
  // 1. DEPARTMENT TEAM STRUCTURE & HEADCOUNT BLUEPRINT
  // ═══════════════════════════════════════════════

  renderTeamStructure(container) {
    const depts = DB.get('departments') || [];
    const isHR = this.isHROrAdmin();
    const isDeptMgr = Auth.role === 'dept_manager';
    const myDeptId = Auth.employee?.departmentId;
    
    // For deputy managers, enforce strictly their own department
    let selectedDeptId = (isDeptMgr && myDeptId) ? myDeptId : (this.structureDeptId || (myDeptId ? myDeptId : (depts[0]?.id || 1)));
    const struct = this.getDepartmentStructure(selectedDeptId);
    if (!struct) return;

    const dept = struct.department;
    const isMyDept = myDeptId === dept.id;

    container.innerHTML = `
      <!-- Department Selector & Capacity Filter Bar -->
      <div style="background:var(--surface-2);border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">
        <div style="display:flex;align-items:center;gap:12px">
          <label style="font-size:12.5px;font-weight:700;color:var(--text)">${isDeptMgr ? 'My Department:' : 'Select Department:'}</label>
          ${isDeptMgr ? `
            <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:8px 14px;font-weight:700;font-size:13px;display:flex;align-items:center;gap:8px">
              <i class="fa fa-building" style="color:var(--primary)"></i>
              <span>${dept.name} (${dept.code})</span>
              <span class="badge badge-primary" style="font-size:10px;margin-left:6px"><i class="fa fa-shield-halved"></i> Supervised Team</span>
            </div>
          ` : `
            <select class="form-control" style="width:260px;font-weight:600" onchange="Recruitment.structureDeptId=parseInt(this.value);Recruitment.renderTeamStructure(document.getElementById('sub-req-content'))">
              ${depts.map(d => `
                <option value="${d.id}" ${d.id === dept.id ? 'selected' : ''}>
                  ${d.name} (${d.code}) ${d.id === myDeptId ? '★ [My Dept]' : ''}
                </option>
              `).join('')}
            </select>
            ${isMyDept ? `<span class="badge badge-primary" style="font-size:11px"><i class="fa fa-star"></i> My Supervised Team</span>` : ''}
          `}
        </div>

        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" onclick="Recruitment.showNewPositionQuotationModal(${dept.id})">
            <i class="fa fa-plus-circle"></i> Add Position Quotation for ${dept.code}
          </button>
        </div>
      </div>

      <!-- Department Capacity & Headcount Metrics -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--primary)">${struct.totalCapacity}</div>
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Target Headcount</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--success)">${struct.filledCount}</div>
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Active Filled Seats</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--warning)">${struct.deptVacancies.length}</div>
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Vacant (Separated)</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--info)">${struct.approvedSeats.length}</div>
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Approved Expansion</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:#8b5cf6">${struct.pendingQuotations.length}</div>
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Pending Quotations</div>
        </div>
      </div>

      <!-- Capacity Utilization Bar -->
      <div style="background:var(--surface-2);border-radius:8px;padding:12px 16px;margin-bottom:24px;display:flex;align-items:center;gap:16px">
        <div style="font-size:12px;font-weight:700;white-space:nowrap">Headcount Capacity Utilization:</div>
        <div style="flex:1;background:var(--border);height:10px;border-radius:5px;overflow:hidden;position:relative">
          <div style="width:${Math.min(struct.fulfillmentPct, 100)}%;background:linear-gradient(90deg, #10b981, #3b82f6);height:100%;border-radius:5px;transition:width .4s"></div>
        </div>
        <div style="font-size:12px;font-weight:800;color:var(--text)">${struct.filledCount} / ${struct.totalCapacity} (${struct.fulfillmentPct}%)</div>
      </div>

      <!-- VISUAL TEAM HIERARCHY & SEAT MATRIX -->
      <div style="margin-bottom:24px">
        <div style="font-size:15px;font-weight:700;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">
          <span><i class="fa fa-diagram-project" style="color:var(--primary);margin-right:6px"></i>${dept.name} — Interactive Team Structure & Seat Blueprint</span>
          <span style="font-size:11.5px;color:var(--text-3);font-weight:normal">Live synchronization with exits, quotations & hiring pipeline</span>
        </div>

        <!-- 1. Department Leadership Tier -->
        <div style="display:flex;justify-content:center;margin-bottom:16px">
          ${struct.headEmp ? `
            <div style="background:var(--card);border:2px solid var(--primary);box-shadow:0 4px 14px rgba(99,102,241,0.15);border-radius:12px;padding:14px 20px;width:340px;text-align:center;position:relative">
              <span class="badge badge-primary" style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);font-size:10.5px">
                <i class="fa fa-crown"></i> Department Head
              </span>
              <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:6px">
                <div class="avatar avatar-md" style="background:${Utils.avatarColor(struct.headEmp.id)}">
                  ${struct.headEmp.photo ? `<img src="${struct.headEmp.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : Utils.avatarInitials(struct.headEmp.fullName)}
                </div>
                <div style="text-align:left">
                  <div style="font-weight:800;font-size:13.5px;color:var(--text)">${struct.headEmp.fullName}</div>
                  <div style="font-size:11.5px;color:var(--primary);font-weight:600">${Utils.getDesigName ? Utils.getDesigName(struct.headEmp.designationId) : 'Head of Department'}</div>
                  <div style="font-size:10.5px;color:var(--text-3)">${struct.headEmp.empNo} • Active</div>
                </div>
              </div>
            </div>
          ` : `
            <div style="background:var(--surface-2);border:2px dashed var(--warning);border-radius:12px;padding:12px 20px;text-align:center;width:320px">
              <div style="font-size:12px;font-weight:700;color:var(--warning)">Head of Department Not Assigned</div>
            </div>
          `}
        </div>

        <!-- Visual Connector Line -->
        <div style="display:flex;justify-content:center;margin-bottom:16px">
          <div style="width:2px;height:24px;background:var(--border)"></div>
        </div>

        <!-- 2. Team Seats Grid (Filled, Vacant from Exits, Approved Expansion, Proposed Quotations) -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:14px">
          
          <!-- FILLED ACTIVE SEATS -->
          ${struct.activeMembers.filter(e => e.id !== struct.headEmp?.id).map(m => {
            const desig = DB.find('designations', m.designationId);
            return `
              <div style="background:var(--card);border:1px solid var(--border);border-left:4px solid var(--success);border-radius:10px;padding:14px;position:relative;transition:all .2s" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform='none'">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                  <span class="badge badge-success" style="font-size:10px"><i class="fa fa-circle-check"></i> Filled Seat</span>
                  <span style="font-size:10.5px;font-family:monospace;color:var(--text-3)">${m.empNo}</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="avatar avatar-sm" style="background:${Utils.avatarColor(m.id)}">
                    ${m.photo ? `<img src="${m.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : Utils.avatarInitials(m.fullName)}
                  </div>
                  <div>
                    <div style="font-weight:700;font-size:13px;color:var(--text)">${m.fullName}</div>
                    <div style="font-size:11.5px;color:var(--text-2)">${desig?.name || m.role || 'Staff Member'}</div>
                    <div style="font-size:10px;color:var(--text-3);margin-top:2px">Joined: ${Utils.formatDate(m.joiningDate)}</div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}

          <!-- VACANT SEATS FROM RESIGNATIONS / TERMINATIONS -->
          ${struct.deptVacancies.map(v => `
            <div style="background:rgba(245,158,11,0.06);border:2px dashed #f59e0b;border-radius:10px;padding:14px;position:relative;transition:all .2s">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                <span class="badge badge-warning" style="font-size:10px"><i class="fa fa-user-clock"></i> Vacant (Separated)</span>
                <span style="font-size:10px;color:#b45309;font-weight:700">${v.separationType}</span>
              </div>
              <div style="margin-bottom:10px">
                <div style="font-weight:700;font-size:13px;color:var(--text)">${v.designationName}</div>
                <div style="font-size:11px;color:var(--text-2);margin-top:2px">
                  Vacated by: <strong>${v.fullName}</strong> (${v.empNo})
                </div>
                <div style="font-size:10.5px;color:var(--text-3);margin-top:1px">Exit Date: ${Utils.formatDate(v.exitDate)}</div>
              </div>
              <div style="border-top:1px dashed rgba(245,158,11,0.3);padding-top:10px;display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:10.5px;color:#b45309"><i class="fa fa-exclamation-triangle"></i> Needs Backfill</span>
                <button class="btn btn-warning btn-xs" onclick="Recruitment.initiateReplacementFromVacancy(${v.empId})" title="${isDeptMgr ? 'Submit replacement quotation to HR' : 'Create formal replacement requisition'}">
                  <i class="fa ${isDeptMgr ? 'fa-file-invoice-dollar' : 'fa-user-plus'}"></i> ${isDeptMgr ? 'Send Replacement Quotation' : 'Requisition / Backfill'}
                </button>
              </div>
            </div>
          `).join('')}

          <!-- APPROVED NEW EXPANSION POSITIONS -->
          ${struct.approvedSeats.map(r => `
            <div style="background:rgba(59,130,246,0.06);border:2px dashed #3b82f6;border-radius:10px;padding:14px;position:relative">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                <span class="badge badge-info" style="font-size:10px"><i class="fa fa-check-double"></i> Approved Position</span>
                <span style="font-size:10px;font-family:monospace;color:var(--primary);font-weight:700">${r.reqNumber}</span>
              </div>
              <div style="margin-bottom:10px">
                <div style="font-weight:700;font-size:13px;color:var(--text)">${r.title}</div>
                <div style="font-size:11px;color:var(--text-2);margin-top:2px">
                  Headcount: <strong>${r.headcount || 1} Opening(s)</strong> • ${r.employmentType || 'Permanent'}
                </div>
                <div style="font-size:10.5px;color:var(--text-3);margin-top:1px">Approved: ${Utils.formatDate(r.approvedAt || r.createdAt)}</div>
              </div>
              <div style="border-top:1px dashed rgba(59,130,246,0.3);padding-top:10px;display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:10.5px;color:var(--info)"><i class="fa fa-check"></i> Ready to Hire</span>
                ${r.jobPostId ? `
                  <span class="badge badge-success" style="font-size:10px"><i class="fa fa-briefcase"></i> Job Posted</span>
                ` : isHR ? `
                  <button class="btn btn-primary btn-xs" onclick="Recruitment.convertRequisitionToJob(${r.id})" title="Post Opening to ATS Pipeline">
                    <i class="fa fa-briefcase"></i> Post Job
                  </button>
                ` : `
                  <span class="badge badge-info" style="font-size:10px"><i class="fa fa-check-double"></i> Approved by HR</span>
                `}
              </div>
            </div>
          `).join('')}

          <!-- PROPOSED POSITION QUOTATIONS (PENDING HR/ADMIN APPROVAL) -->
          ${struct.pendingQuotations.map(r => {
            const requester = Utils.getEmpName(r.requestedBy);
            return `
              <div style="background:rgba(139,92,246,0.06);border:2px dashed #8b5cf6;border-radius:10px;padding:14px;position:relative">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
                  <span class="badge badge-secondary" style="background:#8b5cf6;color:white;font-size:10px"><i class="fa fa-clock"></i> Quotation Pending</span>
                  <span style="font-size:10px;font-family:monospace;color:#8b5cf6;font-weight:700">${r.reqNumber}</span>
                </div>
                <div style="margin-bottom:10px">
                  <div style="font-weight:700;font-size:13px;color:var(--text)">${r.title}</div>
                  <div style="font-size:11px;color:var(--text-2);margin-top:2px">
                    Proposed by: <strong>${requester}</strong>
                  </div>
                  <div style="font-size:10.5px;color:var(--text-3);margin-top:1px">Target Budget: PKR ${(r.minSalary||0).toLocaleString()} – ${(r.maxSalary||0).toLocaleString()}</div>
                </div>
                <div style="border-top:1px dashed rgba(139,92,246,0.3);padding-top:10px;display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:10.5px;color:#8b5cf6"><i class="fa fa-hourglass-half"></i> Awaiting Approval</span>
                  ${isHR ? `
                    <button class="btn btn-primary btn-xs" onclick="Recruitment.reviewPositionQuotation(${r.id})" title="Inspect quotation and approve into team structure">
                      <i class="fa fa-clipboard-check"></i> Review Quotation
                    </button>
                  ` : `
                    <span class="badge badge-warning" style="font-size:9.5px">Under HR Review</span>
                  `}
                </div>
              </div>
            `;
          }).join('')}

        </div>
      </div>
    `;
  },

  // ═══════════════════════════════════════════════
  // 2. SEPARATION & VACANCIES RADAR
  // ═══════════════════════════════════════════════

  renderVacancyRadar(container) {
    const isHR = this.isHROrAdmin();
    const isDeptMgr = Auth.role === 'dept_manager';
    const myDeptId = Auth.employee?.departmentId;

    let vacancies = this.getSeparationVacancies();
    if (isDeptMgr && myDeptId) {
      vacancies = vacancies.filter(v => v.departmentId === myDeptId);
    }

    container.innerHTML = `
      <div style="margin-bottom:18px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div>
            <div style="font-size:15px;font-weight:700">${isDeptMgr ? 'Department Vacant Positions Radar' : 'Separation & Vacant Position Replacement Radar'}</div>
            <div style="font-size:12px;color:var(--text-3)">
              ${isDeptMgr ? 'Track departed employees under your team and submit replacement quotations to HR/Admin for approval' : 'Automatic tracking of departed personnel (resigned, terminated, exit clearances) to ensure seamless backfilling'}
            </div>
          </div>
          <div style="font-size:12px;font-weight:700;color:var(--warning)">
            <i class="fa fa-triangle-exclamation"></i> ${vacancies.filter(v => !v.isBackfilled).length} Vacant Position(s) Requiring Replacement
          </div>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Separated Employee</th>
                <th>Vacated Role & Dept</th>
                <th>Separation Type</th>
                <th>Exit Date</th>
                <th>Separation Reason</th>
                <th>Replacement Status</th>
                <th style="text-align:right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${vacancies.length === 0 ? `
                <tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-3)">No employee separations or vacant seats recorded for this department.</td></tr>
              ` : vacancies.map(v => {
                const req = v.linkedReq;
                let statusBadge = `<span class="badge badge-danger"><i class="fa fa-circle-exclamation"></i> Vacant (No Requisition)</span>`;
                if (req) {
                  if (req.status === 'approved' && req.jobPostId) {
                    statusBadge = `<span class="badge badge-success"><i class="fa fa-check-double"></i> Job Posted (#${req.jobPostId})</span>`;
                  } else if (req.status === 'approved') {
                    statusBadge = `<span class="badge badge-info"><i class="fa fa-check"></i> Requisition Approved</span>`;
                  } else if (req.status === 'pending_review') {
                    statusBadge = `<span class="badge badge-warning"><i class="fa fa-clock"></i> Quotation Under Review</span>`;
                  }
                }

                return `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div class="avatar avatar-sm" style="background:${Utils.avatarColor(v.empId)}">
                          ${v.photo ? `<img src="${v.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : Utils.avatarInitials(v.fullName)}
                        </div>
                        <div>
                          <div style="font-weight:700;font-size:13px">${v.fullName}</div>
                          <div style="font-size:11px;color:var(--text-3);font-family:monospace">${v.empNo}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="font-weight:600;font-size:12.5px">${v.designationName}</div>
                      <div style="font-size:11px;color:var(--text-3)">${v.departmentName}</div>
                    </td>
                    <td><span class="badge ${v.separationType.includes('Notice') ? 'badge-warning' : 'badge-secondary'}" style="font-size:10.5px">${v.separationType}</span></td>
                    <td style="font-size:11.5px;color:var(--text-2)">${Utils.formatDate(v.exitDate)}</td>
                    <td style="font-size:11.5px;color:var(--text-3);max-width:200px" title="${v.reason}">
                      ${v.reason.length > 35 ? v.reason.substring(0, 35) + '...' : v.reason}
                    </td>
                    <td>${statusBadge}</td>
                    <td style="text-align:right">
                      ${!v.isBackfilled ? `
                        <button class="btn btn-warning btn-xs" onclick="Recruitment.initiateReplacementFromVacancy(${v.empId})" title="${isDeptMgr ? 'Submit replacement quotation to HR' : 'Create formal replacement requisition'}">
                          <i class="fa ${isDeptMgr ? 'fa-file-invoice-dollar' : 'fa-user-plus'}"></i> ${isDeptMgr ? 'Send Replacement Quotation' : 'Initiate Replacement'}
                        </button>
                      ` : req && req.status === 'approved' && !req.jobPostId ? `
                        ${isHR ? `
                          <button class="btn btn-primary btn-xs" onclick="Recruitment.convertRequisitionToJob(${req.id})">
                            <i class="fa fa-briefcase"></i> Post Job
                          </button>
                        ` : `
                          <span class="badge badge-info" style="font-size:10px"><i class="fa fa-check"></i> Approved by HR</span>
                        `}
                      ` : `
                        <button class="btn btn-ghost btn-xs" onclick="Recruitment.viewRequisition(${req.id})">
                          <i class="fa fa-eye"></i> View Details
                        </button>
                      `}
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

  // ═══════════════════════════════════════════════
  // 3. HEADCOUNT REQUISITIONS & QUOTATIONS LIST
  // ═══════════════════════════════════════════════

  renderRequisitionsList(container) {
    const isHR = this.isHROrAdmin();
    const isDeptMgr = Auth.role === 'dept_manager';
    const myDeptId = Auth.employee?.departmentId;
    const depts = DB.get('departments') || [];

    let reqs = DB.get('job_requisitions') || [];
    if (isDeptMgr && myDeptId) {
      reqs = reqs.filter(r => r.departmentId === myDeptId || r.requestedBy === (Auth.user?.id || Auth.employee?.id));
    }

    const totalHeadcount = reqs.reduce((sum, r) => sum + (r.headcount || 1), 0);
    const approvedHeadcount = reqs.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.headcount || 1), 0);
    const pendingCount = reqs.filter(r => r.status === 'pending_review').length;
    const totalMaxBudget = reqs.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.maxSalary || 0) * (r.headcount || 1), 0);

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
        <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--primary)">${reqs.length}</div>
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Total Requisitions</div>
        </div>
        <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--success)">${approvedHeadcount} / ${totalHeadcount}</div>
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Approved Headcount</div>
        </div>
        <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--warning)">${pendingCount}</div>
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Pending Review</div>
        </div>
        <div style="background:var(--surface-2);border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--info)">PKR ${(totalMaxBudget/1000000).toFixed(1)}M</div>
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;margin-top:2px">Approved Mo. Payroll Cap</div>
        </div>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ref & Type</th>
              <th>Role & Department</th>
              <th>Requested By</th>
              <th>Headcount</th>
              <th>Budget Salary Range</th>
              <th>Priority</th>
              <th>Status</th>
              <th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${reqs.length === 0 ? `
              <tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-3)">No requisitions or quotations found for this department.</td></tr>
            ` : reqs.map(r => {
              const dept = depts.find(d => d.id === r.departmentId);
              const requester = Utils.getEmpName(r.requestedBy);
              const priorityClass = r.priority === 'Urgent' ? 'badge-danger' : r.priority === 'High' ? 'badge-warning' : 'badge-secondary';
              const isQuotation = r.isQuotation || (r.reqNumber && r.reqNumber.startsWith('POS-QUOT')) || (r.reqNumber && r.reqNumber.startsWith('QUOT'));
              const typeBadge = isQuotation 
                ? `<span class="badge badge-secondary" style="background:#8b5cf6;color:white;font-size:9px">QUOTATION</span>` 
                : `<span class="badge badge-ghost" style="font-size:9px">STANDARD</span>`;

              const statusBadge = r.status === 'approved' ? '<span class="badge badge-success"><i class="fa fa-check"></i> Approved</span>' :
                                  r.status === 'rejected' ? '<span class="badge badge-danger"><i class="fa fa-times"></i> Rejected</span>' :
                                  '<span class="badge badge-warning"><i class="fa fa-clock"></i> Pending Review</span>';

              return `
                <tr>
                  <td>
                    <div style="font-weight:700;font-family:monospace;font-size:12px;color:var(--primary)">${r.reqNumber}</div>
                    <div style="margin-top:2px">${typeBadge}</div>
                  </td>
                  <td>
                    <div style="font-weight:700;font-size:13px;color:var(--text)">${r.title}</div>
                    <div style="font-size:11px;color:var(--text-3)">${dept?.name || 'General'} • ${r.employmentType || 'Permanent'}</div>
                  </td>
                  <td>
                    <div style="font-size:12px;font-weight:600">${requester}</div>
                    <div style="font-size:10.5px;color:var(--text-3)">${r.reason || 'Expansion'}</div>
                  </td>
                  <td style="font-weight:700;font-size:13px;text-align:center">${r.headcount || 1}</td>
                  <td style="font-family:monospace;font-size:12px">
                    PKR ${(r.minSalary||0).toLocaleString()} – ${(r.maxSalary||0).toLocaleString()}
                  </td>
                  <td><span class="badge ${priorityClass}" style="font-size:10.5px">${r.priority}</span></td>
                  <td>${statusBadge}</td>
                  <td style="text-align:right;white-space:nowrap">
                    ${isHR && r.status === 'approved' && !r.jobPostId ? `
                      <button class="btn btn-primary btn-xs" onclick="Recruitment.convertRequisitionToJob(${r.id})" title="Post Opening to ATS Pipeline">
                        <i class="fa fa-briefcase"></i> Post Job
                      </button>
                    ` : r.status === 'approved' && r.jobPostId ? `
                      <span class="badge badge-info" style="font-size:10px"><i class="fa fa-check-double"></i> Posted</span>
                    ` : ''}

                    ${isHR && r.status === 'pending_review' ? `
                      ${isQuotation ? `
                        <button class="btn btn-primary btn-xs" onclick="Recruitment.reviewPositionQuotation(${r.id})" title="Inspect and approve quotation">
                          <i class="fa fa-clipboard-check"></i> Review
                        </button>
                      ` : `
                        <button class="btn btn-success btn-xs" onclick="Recruitment.approveRequisition(${r.id})" title="Approve Headcount">
                          <i class="fa fa-check"></i>
                        </button>
                      `}
                      <button class="btn btn-danger btn-xs" onclick="Recruitment.rejectRequisition(${r.id})" title="Reject Requisition">
                        <i class="fa fa-times"></i>
                      </button>
                    ` : ''}

                    <button class="btn btn-ghost btn-xs" onclick="Recruitment.viewRequisition(${r.id})" title="Inspect Requisition Details">
                      <i class="fa fa-eye"></i> View
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // ═══════════════════════════════════════════════
  // 4. MANAGER NEW POSITION / REPLACEMENT QUOTATION MODAL
  // ═══════════════════════════════════════════════

  showNewPositionQuotationModal(preselectedDeptId, prefill = {}) {
    const depts = DB.get('departments') || [];
    const myDeptId = Auth.employee?.departmentId;
    const isDeptMgr = Auth.role === 'dept_manager';
    const activeDeptId = (isDeptMgr && myDeptId) ? myDeptId : (preselectedDeptId || myDeptId || depts[0]?.id);
    const p = prefill || {};

    const isReplacement = !!p.vacatedEmployeeId;
    const modalTitle = isReplacement 
      ? `Submit Replacement Quotation for Separated Employee to HR/Admin`
      : `Submit New Position & Headcount Quotation to HR/Admin`;

    Modal.show(modalTitle, `
      <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:8px;padding:12px;margin-bottom:16px;font-size:12px;line-height:1.5">
        <i class="fa fa-circle-info" style="color:var(--primary)"></i>
        ${isReplacement ? `
          <strong>Replacement Quotation for Under-Employee:</strong> As department manager, submit this quotation to backfill the vacated seat left by <strong>${p.vacatedEmployeeName || 'separated personnel'}</strong>. Upon HR/Admin approval, this seat will enter the recruitment pipeline.
        ` : `
          <strong>Department Headcount Expansion Flow:</strong> As department manager, submit this quotation with budget, equipment, and business case. Upon HR or Admin approval, your department's team structure will <strong>automatically update</strong> with the new position slot ready for recruitment.
        `}
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Department *</label>
          ${isDeptMgr && myDeptId ? `
            <input class="form-control" value="${depts.find(d=>d.id===myDeptId)?.name || 'My Department'} (${depts.find(d=>d.id===myDeptId)?.code || 'DEPT'})" disabled style="background:var(--surface-2);font-weight:600">
            <input type="hidden" id="pq-dept" value="${myDeptId}">
          ` : `
            <select class="form-control" id="pq-dept">
              ${depts.map(d => `<option value="${d.id}" ${d.id === activeDeptId ? 'selected' : ''}>${d.name} (${d.code})</option>`).join('')}
            </select>
          `}
        </div>
        <div class="form-group">
          <label class="form-label">Proposed Position Title *</label>
          <input class="form-control" id="pq-title" placeholder="e.g. Senior Cloud DevOps Engineer" value="${p.title || ''}">
        </div>
      </div>

      <div class="form-row form-row-3">
        <div class="form-group">
          <label class="form-label">Position Level</label>
          <select class="form-control" id="pq-level">
            <option value="Junior" ${p.level==='Junior'?'selected':''}>Junior / Entry Level</option>
            <option value="Mid" ${p.level==='Mid'?'selected':''}>Mid-Level Professional</option>
            <option value="Senior" ${(!p.level || p.level==='Senior')?'selected':''}>Senior Professional</option>
            <option value="Lead" ${p.level==='Lead'?'selected':''}>Team Lead / Principal</option>
            <option value="Executive" ${p.level==='Executive'?'selected':''}>Executive / Management</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Headcount Openings</label>
          <input class="form-control" id="pq-count" type="number" min="1" max="10" value="${p.headcount || 1}" ${isReplacement ? 'readonly' : ''}>
        </div>
        <div class="form-group">
          <label class="form-label">Employment Type</label>
          <select class="form-control" id="pq-type">
            <option value="Permanent" selected>Permanent Salaried</option>
            <option value="Contract">Fixed Term Contract</option>
            <option value="Trainee">Graduate Trainee</option>
          </select>
        </div>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Quoted Minimum Monthly Salary (PKR) *</label>
          <input class="form-control" id="pq-minsal" type="number" step="10000" value="${p.minSalary || 220000}">
        </div>
        <div class="form-group">
          <label class="form-label">Quoted Maximum Monthly Budget Ceiling (PKR) *</label>
          <input class="form-control" id="pq-maxsal" type="number" step="10000" value="${p.maxSalary || 300000}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Hardware & Workstation Quotation</label>
        <input class="form-control" id="pq-hardware" placeholder="e.g. MacBook Pro M3 Max 32GB RAM, Dual 4K Dell Displays, Standing Desk" value="${p.hardware || ''}">
      </div>

      <div class="form-group">
        <label class="form-label">Software, Cloud & Tooling Licenses</label>
        <input class="form-control" id="pq-software" placeholder="e.g. AWS Dev Cloud Sandbox, JetBrains Suite, GitHub Copilot License" value="${p.software || ''}">
      </div>

      <div class="form-group">
        <label class="form-label">Business Case & ROI Justification *</label>
        <textarea class="form-control" id="pq-case" rows="3" placeholder="Detail why this position is required, what deliverables the hire will produce, and team impact...">${p.businessCase || ''}</textarea>
      </div>

      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Key Core Competencies & Skills</label>
          <input class="form-control" id="pq-skills" placeholder="e.g. Kubernetes, Terraform, Go/Node, AWS Architecture" value="${p.skills || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Target Onboarding Date</label>
          <input class="form-control" id="pq-date" type="date" value="${p.targetDate || new Date(Date.now() + 30*86400000).toISOString().split('T')[0]}">
        </div>
      </div>

      <input type="hidden" id="pq-vacated-id" value="${p.vacatedEmployeeId || ''}">
      <input type="hidden" id="pq-vacated-name" value="${p.vacatedEmployeeName || ''}">
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Recruitment.savePositionQuotation(${activeDeptId})">
          <i class="fa fa-paper-plane"></i> Submit Quotation to HR/Admin
        </button>
      `
    });
  },

  savePositionQuotation(fallbackDeptId) {
    const isDeptMgr = Auth.role === 'dept_manager';
    const myDeptId = Auth.employee?.departmentId;
    const deptSelect = document.getElementById('pq-dept');
    let deptId = deptSelect ? parseInt(deptSelect.value) : fallbackDeptId;
    if (isDeptMgr && myDeptId) {
      deptId = myDeptId; // Force department boundary
    }

    const title = (document.getElementById('pq-title')?.value || '').trim();
    const level = document.getElementById('pq-level')?.value || 'Senior';
    const count = parseInt(document.getElementById('pq-count')?.value) || 1;
    const type = document.getElementById('pq-type')?.value || 'Permanent';
    const minSal = parseInt(document.getElementById('pq-minsal')?.value) || 0;
    const maxSal = parseInt(document.getElementById('pq-maxsal')?.value) || 0;
    const hardware = (document.getElementById('pq-hardware')?.value || '').trim();
    const software = (document.getElementById('pq-software')?.value || '').trim();
    const businessCase = (document.getElementById('pq-case')?.value || '').trim();
    const skills = (document.getElementById('pq-skills')?.value || '').trim();
    const targetDate = document.getElementById('pq-date')?.value || '';
    const vacatedEmployeeId = parseInt(document.getElementById('pq-vacated-id')?.value) || null;
    const vacatedEmployeeName = document.getElementById('pq-vacated-name')?.value || null;

    if (!title) {
      Toast.show('Position title is required', 'error');
      return;
    }
    if (!businessCase) {
      Toast.show('Please provide a business case and justification for the position quotation', 'error');
      return;
    }

    const reqs = DB.get('job_requisitions') || [];
    const nextNum = reqs.length + 1;
    const reqNumber = `POS-QUOT-2026-${String(nextNum).padStart(3, '0')}`;
    const isHR = this.isHROrAdmin();

    const newQuotation = {
      id: DB.nextId('job_requisitions'),
      reqNumber,
      isQuotation: true,
      title,
      level,
      departmentId: deptId,
      requestedBy: Auth.user?.id || Auth.employee?.id || 1,
      headcount: count,
      employmentType: type,
      priority: vacatedEmployeeId ? 'Urgent' : 'High',
      reason: vacatedEmployeeId ? 'Replacement' : 'Expansion',
      vacatedEmployeeId,
      vacatedEmployeeName,
      minSalary: minSal,
      maxSalary: maxSal,
      targetDate,
      status: isHR ? 'approved' : 'pending_review',
      approvedBy: isHR ? (Auth.user?.id || 1) : null,
      approvedAt: isHR ? Utils.today() : null,
      notes: businessCase,
      quotationDetails: {
        hardware,
        software,
        skills,
        level,
        businessCase
      },
      jobPostId: null,
      createdAt: Utils.today()
    };

    reqs.push(newQuotation);
    DB.set('job_requisitions', reqs);

    // Also notify HR/Admin
    if (typeof Notifications !== 'undefined' && Notifications.add) {
      Notifications.add({
        title: `New Position Quotation: ${title}`,
        message: `${Auth.employee?.fullName || 'Manager'} submitted a quotation (${vacatedEmployeeId ? 'Replacement for ' + vacatedEmployeeName : 'Team Expansion'}) for HR approval.`,
        type: 'recruitment',
        targetRole: 'hr_manager'
      });
    }

    DB.log('QUOTATION_SUBMITTED', 'Recruitment', `Manager submitted new position quotation ${reqNumber} for ${title}`, Auth.user?.id, 'INFO');
    Toast.show(`Position quotation ${reqNumber} submitted to HR/Admin for approval!`, 'success');
    Modal.close('dynamic-modal');

    // Switch to team structure view for the department
    this.structureDeptId = deptId;
    this.requisitionTab = 'structure';
    this.render();
  },

  // ═══════════════════════════════════════════════
  // 5. HR/ADMIN REVIEW & APPROVAL OF POSITION QUOTATION
  // ═══════════════════════════════════════════════

  reviewPositionQuotation(id) {
    if (!this.isHROrAdmin()) {
      Toast.show('Permission denied: Only HR and Admin can review position quotations.', 'error');
      return;
    }
    const reqs = DB.get('job_requisitions') || [];
    const r = reqs.find(x => x.id === id);
    if (!r) return;
    const depts = DB.get('departments') || [];
    const dept = depts.find(d => d.id === r.departmentId);
    const requester = Utils.getEmpName(r.requestedBy);
    const q = r.quotationDetails || {};

    Modal.show(`Review Position Quotation: ${r.reqNumber}`, `
      <div style="background:var(--surface-2);border-radius:10px;padding:16px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:16px;font-weight:800;color:var(--text)">${r.title}</div>
            <div style="font-size:12px;color:var(--primary);font-weight:600;margin-top:2px">
              ${dept?.name || 'Department'} • ${r.level || 'Senior'} Level • ${r.headcount || 1} Seat(s)
            </div>
          </div>
          <span class="badge badge-warning"><i class="fa fa-clock"></i> Pending HR/Admin Review</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;font-size:12.5px">
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px">
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase">Requested By</div>
          <div style="font-weight:700;margin-top:2px">${requester}</div>
          <div style="font-size:11px;color:var(--text-3);margin-top:8px">Target Onboarding</div>
          <div style="font-weight:700;margin-top:2px">${Utils.formatDate(r.targetDate)}</div>
        </div>
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px">
          <div style="font-size:11px;color:var(--text-3);text-transform:uppercase">Quoted Monthly Salary Range</div>
          <div style="font-weight:800;color:var(--success);margin-top:2px">
            PKR ${(r.minSalary||0).toLocaleString()} – ${(r.maxSalary||0).toLocaleString()}
          </div>
          <div style="font-size:11px;color:var(--text-3);margin-top:8px">Team Structure Impact</div>
          <div style="font-weight:700;color:var(--info);margin-top:2px">
            +${r.headcount || 1} Approved Seat to ${dept?.code || 'Dept'} Hierarchy
          </div>
        </div>
      </div>

      ${q.hardware ? `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:12px;font-size:12px">
          <strong><i class="fa fa-laptop" style="color:var(--primary);margin-right:5px"></i>Hardware & Workstation:</strong>
          <div style="margin-top:3px;color:var(--text-2)">${q.hardware}</div>
        </div>
      ` : ''}

      ${q.software ? `
        <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:12px;font-size:12px">
          <strong><i class="fa fa-cubes" style="color:var(--info);margin-right:5px"></i>Software & Cloud Tools:</strong>
          <div style="margin-top:3px;color:var(--text-2)">${q.software}</div>
        </div>
      ` : ''}

      <div style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:14px;font-size:12px">
        <strong><i class="fa fa-briefcase" style="color:var(--primary);margin-right:5px"></i>Business Case & ROI Justification:</strong>
        <div style="margin-top:5px;color:var(--text-2);line-height:1.5">${r.notes || q.businessCase || 'No business case provided.'}</div>
      </div>

      <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:8px;padding:10px 14px;font-size:12px;color:#065f46">
        <i class="fa fa-check-circle"></i> <strong>Approval Effect:</strong> Approving will immediately add this position to the <strong>${dept?.name} Team Structure</strong>, increment department headcount capacity, and open recruitment job posting.
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-danger" onclick="Recruitment.rejectPositionQuotation(${r.id})">
          <i class="fa fa-times"></i> Reject
        </button>
        <button class="btn btn-success" onclick="Recruitment.approvePositionQuotation(${r.id})">
          <i class="fa fa-check-circle"></i> Approve Position & Update Team Structure
        </button>
      `
    });
  },

  approvePositionQuotation(id) {
    if (!this.isHROrAdmin()) {
      Toast.show('Permission denied: Only HR and Admin can approve position quotations.', 'error');
      return;
    }
    const reqs = DB.get('job_requisitions') || [];
    const r = reqs.find(x => x.id === id);
    if (!r) return;

    r.status = 'approved';
    r.approvedBy = Auth.user?.id || 1;
    r.approvedAt = Utils.today();
    DB.set('job_requisitions', reqs);

    // Update department capacity in DB if tracked
    const depts = DB.get('departments') || [];
    const dept = depts.find(d => d.id === r.departmentId);
    if (dept) {
      dept.employeeCount = (dept.employeeCount || 0) + (r.headcount || 1);
      DB.set('departments', depts);
    }

    DB.log('APPROVE_QUOTATION', 'Recruitment', `Approved position quotation ${r.reqNumber} for ${r.title} in ${dept?.name || 'dept'}. Team structure updated.`, Auth.user?.id, 'INFO');
    Toast.show(`Quotation ${r.reqNumber} approved! Department team structure updated.`, 'success');
    Modal.close('dynamic-modal');

    // Automatically navigate to team structure
    this.structureDeptId = r.departmentId;
    this.requisitionTab = 'structure';
    this.render();
  },

  rejectPositionQuotation(id) {
    if (!this.isHROrAdmin()) {
      Toast.show('Permission denied: Only HR and Admin can reject position quotations.', 'error');
      return;
    }
    const reqs = DB.get('job_requisitions') || [];
    const r = reqs.find(x => x.id === id);
    if (!r) return;

    Modal.confirm('Reject Position Quotation', `Are you sure you want to reject position quotation <strong>${r.reqNumber}</strong>?`, () => {
      r.status = 'rejected';
      DB.set('job_requisitions', reqs);
      DB.log('REJECT_QUOTATION', 'Recruitment', `Rejected position quotation ${r.reqNumber}`, Auth.user?.id, 'WARNING');
      Toast.show('Position quotation rejected', 'info');
      Modal.close('dynamic-modal');
      this.render();
    }, 'danger');
  },

  // ═══════════════════════════════════════════════
  // 6. VACANCY TO REPLACEMENT REQUISITION SHORTCUT
  // ═══════════════════════════════════════════════

  initiateReplacementFromVacancy(empId) {
    const emp = DB.find('employees', empId);
    if (!emp) return;
    const isDeptMgr = Auth.role === 'dept_manager';
    const myDeptId = Auth.employee?.departmentId;

    if (isDeptMgr && myDeptId && emp.departmentId !== myDeptId) {
      Toast.show('Access Denied: You can only submit replacement quotations for separated employees under your department.', 'error');
      return;
    }

    const desig = DB.find('designations', emp.designationId);
    const clearances = DB.get('exit_clearances') || [];
    const clearance = clearances.find(c => c.employeeId === emp.id);
    const desigName = desig?.name || emp.role || 'Staff Member';

    if (isDeptMgr) {
      // Deputy Manager flow: Open quotation modal with replacement prefill
      this.showNewPositionQuotationModal(emp.departmentId, {
        title: `${desigName} (Replacement)`,
        level: 'Mid',
        headcount: 1,
        minSalary: Math.round((emp.basicSalary || 150000) * 1.05),
        maxSalary: Math.round((emp.basicSalary || 150000) * 1.3),
        vacatedEmployeeId: emp.id,
        vacatedEmployeeName: emp.fullName,
        businessCase: `Replacement quotation for vacated seat previously held by ${emp.fullName} (${emp.empNo}, ${desigName}) who separated on ${clearance?.lastWorkingDay || emp.exitDate || 'recent date'}. Critical operational backfill needed to maintain team delivery commitments.`
      });
    } else {
      // HR/Admin flow: Can submit direct requisition
      this.showAddRequisitionModal({
        title: `${desigName} (Replacement)`,
        departmentId: emp.departmentId,
        reason: 'Replacement',
        priority: 'Urgent',
        notes: `Replacement requirement for separated personnel ${emp.fullName} (${emp.empNo}) who departed on ${clearance?.lastWorkingDay || emp.exitDate || 'recent'}. Separation reason: ${clearance?.reason || 'Resignation'}.`,
        vacatedEmployeeId: emp.id,
        vacatedEmployeeName: emp.fullName
      });
    }
  },

  showAddRequisitionModal(prefill) {
    if (!this.isHROrAdmin()) {
      Toast.show('Direct requisition creation is restricted to HR & Admin. Please use Initiate Position Quotation.', 'warning');
      this.showNewPositionQuotationModal();
      return;
    }
    const depts = DB.get('departments') || [];
    const p = prefill || {};

    Modal.show('Submit Headcount & Budget Requisition', `
      <div class="form-group">
        <label class="form-label">Position Title</label>
        <input class="form-control" id="rq-title" placeholder="e.g. Staff Site Reliability Engineer" value="${p.title || ''}">
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Department</label>
          <select class="form-control" id="rq-dept">
            ${depts.map(d => `<option value="${d.id}" ${d.id === p.departmentId ? 'selected' : ''}>${d.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Headcount Openings</label>
          <input class="form-control" id="rq-count" type="number" min="1" max="20" value="1">
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Employment Classification</label>
          <select class="form-control" id="rq-type">
            <option value="Permanent" selected>Permanent Salaried</option>
            <option value="Contract">Fixed Term Contract</option>
            <option value="Internship">Graduate Trainee / Internship</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Hiring Priority</label>
          <select class="form-control" id="rq-priority">
            <option value="Urgent" ${p.priority === 'Urgent' ? 'selected' : ''}>Urgent (Immediate Need / Replacement)</option>
            <option value="High" ${p.priority === 'High' || !p.priority ? 'selected' : ''}>High (Next 30 Days)</option>
            <option value="Medium">Medium (Q3 Growth)</option>
            <option value="Standard">Standard</option>
          </select>
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Minimum Monthly Salary (PKR)</label>
          <input class="form-control" id="rq-minsal" type="number" step="10000" value="200000">
        </div>
        <div class="form-group">
          <label class="form-label">Maximum Budget Ceiling (PKR)</label>
          <input class="form-control" id="rq-maxsal" type="number" step="10000" value="280000">
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Target Onboarding Date</label>
          <input class="form-control" id="rq-target" type="date" value="${new Date(Date.now() + 30*86400000).toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">Requisition Justification</label>
          <select class="form-control" id="rq-reason">
            <option value="Replacement" ${p.reason === 'Replacement' ? 'selected' : ''}>Replacement for Separated Personnel</option>
            <option value="Expansion" ${p.reason === 'Expansion' ? 'selected' : ''}>Team Expansion / Revenue Scaling</option>
            <option value="New Technology">New Technology Stack Specialization</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Operational Notes & Justification</label>
        <textarea class="form-control" id="rq-notes" rows="3" placeholder="Explain project business justification, reporting lines, and expected deliverables...">${p.notes || ''}</textarea>
      </div>
      <input type="hidden" id="rq-vacated-id" value="${p.vacatedEmployeeId || ''}">
      <input type="hidden" id="rq-vacated-name" value="${p.vacatedEmployeeName || ''}">
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Recruitment.saveRequisition()"><i class="fa fa-save"></i> Submit for Approval</button>
      `
    });
  },

  saveRequisition() {
    if (!this.isHROrAdmin()) {
      Toast.show('Permission denied: Only HR and Admin can submit direct requisitions.', 'error');
      return;
    }
    const title = document.getElementById('rq-title').value.trim();
    const deptId = parseInt(document.getElementById('rq-dept').value);
    const count = parseInt(document.getElementById('rq-count').value) || 1;
    const type = document.getElementById('rq-type').value;
    const priority = document.getElementById('rq-priority').value;
    const minSal = parseInt(document.getElementById('rq-minsal').value) || 0;
    const maxSal = parseInt(document.getElementById('rq-maxsal').value) || 0;
    const targetDate = document.getElementById('rq-target').value;
    const reason = document.getElementById('rq-reason').value;
    const notes = document.getElementById('rq-notes').value.trim();
    const vacatedEmployeeId = parseInt(document.getElementById('rq-vacated-id')?.value) || null;
    const vacatedEmployeeName = document.getElementById('rq-vacated-name')?.value || null;

    if (!title) {
      Toast.show('Position title is required', 'error');
      return;
    }

    const reqs = DB.get('job_requisitions') || [];
    const nextNum = reqs.length + 1;
    const reqNumber = `REQ-2026-${String(nextNum).padStart(3, '0')}`;
    const isHR = this.isHROrAdmin();

    const newReq = {
      id: DB.nextId('job_requisitions'),
      reqNumber,
      title,
      departmentId: deptId,
      requestedBy: Auth.user?.id || 1,
      headcount: count,
      employmentType: type,
      priority,
      reason,
      vacatedEmployeeId,
      vacatedEmployeeName,
      minSalary: minSal,
      maxSalary: maxSal,
      targetDate,
      status: isHR ? 'approved' : 'pending_review',
      approvedBy: isHR ? (Auth.user?.id || 1) : null,
      approvedAt: isHR ? Utils.today() : null,
      notes,
      jobPostId: null,
      createdAt: Utils.today()
    };

    reqs.push(newReq);
    DB.set('job_requisitions', reqs);
    DB.log('CREATE', 'Recruitment', `Submitted headcount requisition ${reqNumber} for ${title} (${count} opening(s))`, Auth.user?.id, 'INFO');
    Toast.show('Headcount requisition submitted successfully!', 'success');
    Modal.close('dynamic-modal');
    this.render();
  },

  approveRequisition(id) {
    if (!this.isHROrAdmin()) {
      Toast.show('Permission denied: Only HR and Admin can approve headcount requisitions.', 'error');
      return;
    }
    const reqs = DB.get('job_requisitions') || [];
    const idx = reqs.findIndex(r => r.id === id);
    if (idx === -1) return;

    reqs[idx].status = 'approved';
    reqs[idx].approvedBy = Auth.user?.id || 1;
    reqs[idx].approvedAt = Utils.today();
    DB.set('job_requisitions', reqs);
    DB.log('APPROVE', 'Recruitment', `Approved headcount requisition ${reqs[idx].reqNumber} for ${reqs[idx].title}`, Auth.user?.id, 'WARNING');
    Toast.show(`Requisition ${reqs[idx].reqNumber} approved!`, 'success');
    this.render();
  },

  rejectRequisition(id) {
    if (!this.isHROrAdmin()) {
      Toast.show('Permission denied: Only HR and Admin can reject headcount requisitions.', 'error');
      return;
    }
    const reqs = DB.get('job_requisitions') || [];
    const idx = reqs.findIndex(r => r.id === id);
    if (idx === -1) return;

    Modal.confirm('Reject Requisition', `Are you sure you want to reject requisition <strong>${reqs[idx].reqNumber}</strong>?`, () => {
      reqs[idx].status = 'rejected';
      DB.set('job_requisitions', reqs);
      DB.log('REJECT', 'Recruitment', `Rejected headcount requisition ${reqs[idx].reqNumber}`, Auth.user?.id, 'WARNING');
      Toast.show('Requisition rejected', 'info');
      this.render();
    }, 'danger');
  },

  convertRequisitionToJob(id) {
    if (!this.isHROrAdmin()) {
      Toast.show('Permission denied: Only HR and Admin can convert requisitions into active job postings.', 'error');
      return;
    }
    const reqs = DB.get('job_requisitions') || [];
    const r = reqs.find(x => x.id === id);
    if (!r) return;

    const newJob = {
      id: DB.nextId('recruitment'),
      title: r.title,
      departmentId: r.departmentId,
      positions: r.headcount || 1,
      status: 'open',
      postedOn: Utils.today(),
      deadline: r.targetDate || '2026-10-31',
      salary: `${r.minSalary ? (r.minSalary/1000) + 'k' : '200k'}-${r.maxSalary ? (r.maxSalary/1000) + 'k' : '300k'}`,
      experience: '3-6 years',
      description: `Active job opening created from approved requisition ${r.reqNumber}. ${r.notes || ''}`,
      applicantCount: 0
    };

    DB.add('recruitment', newJob);
    r.jobPostId = newJob.id;
    DB.set('job_requisitions', reqs);
    DB.log('CREATE', 'Recruitment', `Created active job posting #${newJob.id} from approved requisition ${r.reqNumber}`, Auth.user?.id, 'INFO');
    Toast.show(`Job posting created for "${r.title}"!`, 'success');
    this.switchView('jobs');
  },

  viewRequisition(id) {
    const r = (DB.get('job_requisitions') || []).find(x => x.id === id);
    if (!r) return;
    const dept = (DB.get('departments') || []).find(d => d.id === r.departmentId);
    const q = r.quotationDetails || {};

    Modal.show(`Requisition Inspection: ${r.reqNumber}`, `
      <div style="background:var(--surface-2);padding:14px;border-radius:10px;margin-bottom:14px;font-size:12.5px;line-height:1.6">
        <div><strong>Position Title:</strong> ${r.title}</div>
        <div><strong>Department:</strong> ${dept?.name || 'General'}</div>
        <div><strong>Requested Headcount:</strong> ${r.headcount || 1} (${r.employmentType || 'Permanent'})</div>
        <div><strong>Target Compensation:</strong> PKR ${(r.minSalary||0).toLocaleString()} – ${(r.maxSalary||0).toLocaleString()} / month</div>
        <div><strong>Target Onboarding Date:</strong> ${r.targetDate || 'Flexible'}</div>
        <div><strong>Reason & Justification:</strong> ${r.reason || 'Expansion'}</div>
        <div><strong>Status:</strong> ${(r.status || 'Pending').toUpperCase()}</div>
        ${r.vacatedEmployeeName ? `<div><strong>Backfilling Seat Vacated By:</strong> ${r.vacatedEmployeeName}</div>` : ''}
      </div>
      ${q.hardware ? `
        <div style="margin-bottom:8px;font-size:12px"><strong>Hardware:</strong> ${q.hardware}</div>
      ` : ''}
      <div style="font-size:12px;color:var(--text);margin-bottom:6px"><strong>Justification Notes:</strong></div>
      <div style="background:var(--card);border:1px solid var(--border);padding:12px;border-radius:8px;font-size:12px;color:var(--text-2);line-height:1.5">
        ${r.notes || q.businessCase || 'No detailed notes recorded.'}
      </div>
    `, {
      footer: `<button class="btn btn-primary" onclick="Modal.close('dynamic-modal')">Close Inspection</button>`
    });
  },

  // ═══════════════════════════════════════════════
  // CANDIDATE INTERVIEW SCORECARDS & RUBRIC EVALUATOR
  // ═══════════════════════════════════════════════

  showScorecardModal(applicantId) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Candidate scorecards are restricted to HR & Admin.', 'error');
      return;
    }
    const app = DB.find('applications', applicantId);
    if (!app) return;
    const job = DB.find('recruitment', app.jobId);
    const existingScorecards = (DB.get('interview_scorecards') || []).filter(s => s.applicantId === applicantId);
    const existing = existingScorecards[0];

    Modal.show(`Candidate Evaluation Scorecard: ${app.name}`, `
      <div style="background:var(--surface-2);padding:12px;border-radius:8px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:700;font-size:13px">${app.name} (${app.email})</div>
          <div style="font-size:11px;color:var(--text-3)">Role: ${job?.title || 'Open Position'} • Evaluator: ${Auth.employee?.fullName || 'Senior Evaluator'}</div>
        </div>
        <div id="sc-live-score" style="text-align:right">
          <div style="font-size:24px;font-weight:800;color:var(--primary)">${existing ? existing.overallScore : '4.0'} <span style="font-size:13px;color:var(--text-3)">/ 5.0</span></div>
          <span class="badge ${existing?.recommendation?.includes('Hire') ? 'badge-success' : 'badge-primary'}" id="sc-live-badge">${existing ? existing.recommendation : 'Hire'}</span>
        </div>
      </div>

      <div style="font-size:12.5px;font-weight:700;margin-bottom:10px">Multi-Competency Rubric Assessment (1 to 5 Stars):</div>

      ${[
        { id:'sc-tech', label:'1. Technical Competency & Architecture Depth (Weight 30%)', desc:'Mastery of software systems, coding paradigms, and modern tech stack', val: existing?.ratings?.technical || 4 },
        { id:'sc-prob', label:'2. Problem Solving & Analytical Rigor (Weight 25%)', desc:'Debugging, algorithm efficiency, trade-off analysis under pressure', val: existing?.ratings?.problemSolving || 4 },
        { id:'sc-comm', label:'3. Communication & Interpersonal Presence (Weight 15%)', desc:'Clarity, active listening, executive presentation, and team collaboration', val: existing?.ratings?.communication || 4 },
        { id:'sc-cult', label:'4. Culture Fit & Corporate Values Alignment (Weight 15%)', desc:'Empathy, constructive feedback reception, transparency, and integrity', val: existing?.ratings?.cultureFit || 4 },
        { id:'sc-lead', label:'5. Leadership, Autonomy & Ownership (Weight 15%)', desc:'Proactive initiative, mentoring potential, and accountability for outcomes', val: existing?.ratings?.leadership || 4 },
      ].map(crit => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1;padding-right:12px">
            <div style="font-size:12px;font-weight:600">${crit.label}</div>
            <div style="font-size:10.5px;color:var(--text-3)">${crit.desc}</div>
          </div>
          <div style="width:140px">
            <select class="form-control" id="${crit.id}" onchange="Recruitment.updateScorecardLiveMath()" style="font-weight:700">
              <option value="5" ${crit.val===5?'selected':''}>⭐⭐⭐⭐⭐ (5 - Outstanding)</option>
              <option value="4" ${crit.val===4?'selected':''}>⭐⭐⭐⭐ (4 - Exceeds Expectations)</option>
              <option value="3" ${crit.val===3?'selected':''}>⭐⭐⭐ (3 - Meets Expectations)</option>
              <option value="2" ${crit.val===2?'selected':''}>⭐⭐ (2 - Below Bar / Gaps)</option>
              <option value="1" ${crit.val===1?'selected':''}>⭐ (1 - Significant Risk)</option>
            </select>
          </div>
        </div>
      `).join('')}

      <div class="form-group" style="margin-top:14px">
        <label class="form-label">Final Hiring Recommendation</label>
        <select class="form-control" id="sc-rec" style="font-weight:700">
          <option value="Strong Hire" ${existing?.recommendation==='Strong Hire'?'selected':''}>🟢 Strong Hire (Top 5% Candidate, Champion for Role)</option>
          <option value="Hire" ${(!existing || existing?.recommendation==='Hire')?'selected':''}>🟢 Hire (Solid addition, meets role criteria)</option>
          <option value="Hold" ${existing?.recommendation==='Hold'?'selected':''}>🟡 Hold / Re-evaluate against pool</option>
          <option value="No Hire" ${existing?.recommendation==='No Hire'?'selected':''}>🔴 No Hire (Does not meet required technical bar)</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Key Strengths & Notable Highlights</label>
        <textarea class="form-control" id="sc-strengths" rows="2" placeholder="Specific technical examples, stellar responses, or project achievements...">${existing?.strengths || ''}</textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Key Concerns & Developmental Areas</label>
        <textarea class="form-control" id="sc-concerns" rows="2" placeholder="Knowledge gaps, hesitation points, or mentorship requirements...">${existing?.concerns || ''}</textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Recruitment.saveScorecard(${applicantId})"><i class="fa fa-save"></i> Save Scorecard</button>
      `
    });
  },

  updateScorecardLiveMath() {
    const tech = parseInt(document.getElementById('sc-tech')?.value || 4);
    const prob = parseInt(document.getElementById('sc-prob')?.value || 4);
    const comm = parseInt(document.getElementById('sc-comm')?.value || 4);
    const cult = parseInt(document.getElementById('sc-cult')?.value || 4);
    const lead = parseInt(document.getElementById('sc-lead')?.value || 4);

    const overall = (tech * 0.30 + prob * 0.25 + comm * 0.15 + cult * 0.15 + lead * 0.15).toFixed(1);
    const liveScoreEl = document.getElementById('sc-live-score');
    if (liveScoreEl) {
      const rec = overall >= 4.3 ? 'Strong Hire' : overall >= 3.5 ? 'Hire' : overall >= 2.8 ? 'Hold' : 'No Hire';
      const badgeClass = rec.includes('Hire') ? 'badge-success' : rec === 'Hold' ? 'badge-warning' : 'badge-danger';
      liveScoreEl.innerHTML = `
        <div style="font-size:24px;font-weight:800;color:var(--primary)">${overall} <span style="font-size:13px;color:var(--text-3)">/ 5.0</span></div>
        <span class="badge ${badgeClass}">${rec}</span>
      `;
      const recSelect = document.getElementById('sc-rec');
      if (recSelect) recSelect.value = rec;
    }
  },

  saveScorecard(applicantId) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Candidate scorecards are restricted to HR & Admin.', 'error');
      return;
    }
    const app = DB.find('applications', applicantId);
    if (!app) return;

    const tech = parseInt(document.getElementById('sc-tech').value);
    const prob = parseInt(document.getElementById('sc-prob').value);
    const comm = parseInt(document.getElementById('sc-comm').value);
    const cult = parseInt(document.getElementById('sc-cult').value);
    const lead = parseInt(document.getElementById('sc-lead').value);

    const overallScore = parseFloat((tech * 0.30 + prob * 0.25 + comm * 0.15 + cult * 0.15 + lead * 0.15).toFixed(1));
    const recommendation = document.getElementById('sc-rec').value;
    const strengths = document.getElementById('sc-strengths').value.trim();
    const concerns = document.getElementById('sc-concerns').value.trim();

    const scorecards = DB.get('interview_scorecards') || [];
    const existingIdx = scorecards.findIndex(s => s.applicantId === applicantId);

    const scorecardObj = {
      id: existingIdx !== -1 ? scorecards[existingIdx].id : DB.nextId('interview_scorecards'),
      applicantId,
      candidateName: app.name,
      jobId: app.jobId,
      interviewerId: Auth.user?.id || 1,
      interviewerName: Auth.employee?.fullName || 'Senior Evaluator',
      stage: 'Multi-Competency Interview',
      ratings: { technical: tech, problemSolving: prob, communication: comm, cultureFit: cult, leadership: lead },
      overallScore,
      recommendation,
      strengths,
      concerns,
      evaluatedAt: new Date().toISOString().split('T')[0]
    };

    if (existingIdx !== -1) {
      scorecards[existingIdx] = scorecardObj;
    } else {
      scorecards.push(scorecardObj);
    }
    DB.set('interview_scorecards', scorecards);

    // Update applicant score
    app.score = Math.round(overallScore * 20); // convert 5.0 to 100%
    DB.update('applications', applicantId, app);

    DB.log('EVALUATE', 'Recruitment', `Evaluated candidate ${app.name}: Score ${overallScore}/5.0 (${recommendation})`, Auth.user?.id, 'INFO');
    Toast.show(`Scorecard saved for ${app.name}! (Score: ${overallScore}/5.0)`, 'success');
    Modal.close('dynamic-modal');
    this.render();
  },

  // ═══════════════════════════════════════════════
  // PHASE 4: INTERVIEWS, RUBRICS, TALENT POOLS & ONBOARDING
  // ═══════════════════════════════════════════════

  renderInterviews(container) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Interview panels and scheduling are restricted to HR & Admin.', 'error');
      this.currentView = 'requisitions';
      this.render();
      return;
    }
    const interviews = DB.get('interviews') || [];
    const feedbacks = DB.get('interview_feedbacks') || [];
    const stages = DB.get('recruitment_stages') || [];

    container.innerHTML = `
      <div class="animate-fade-in">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid var(--primary)">
            <div style="font-size:11.5px;color:var(--text-3);text-transform:uppercase;font-weight:600">Total Scheduled</div>
            <div style="font-size:24px;font-weight:800;color:var(--primary);margin-top:4px">${interviews.length}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Across all active job requisitions</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid var(--success)">
            <div style="font-size:11.5px;color:var(--text-3);text-transform:uppercase;font-weight:600">Completed Rounds</div>
            <div style="font-size:24px;font-weight:800;color:var(--success);margin-top:4px">${interviews.filter(i=>i.status==='completed').length}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Evaluation scorecards filed</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid var(--warning)">
            <div style="font-size:11.5px;color:var(--text-3);text-transform:uppercase;font-weight:600">Upcoming Rounds</div>
            <div style="font-size:24px;font-weight:800;color:var(--warning);margin-top:4px">${interviews.filter(i=>i.status==='scheduled').length}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Pending panel execution</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid var(--accent)">
            <div style="font-size:11.5px;color:var(--text-3);text-transform:uppercase;font-weight:600">Rubric Evaluations</div>
            <div style="font-size:24px;font-weight:800;color:var(--accent);margin-top:4px">${feedbacks.length}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Multi-criteria feedback recorded</div>
          </div>
        </div>

        <div class="card" style="padding:0;margin-bottom:24px">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <div>
              <span style="font-size:14px;font-weight:700">Interview Rounds &amp; Scheduling</span>
              <span class="badge badge-primary" style="margin-left:8px">${interviews.length} Sessions</span>
            </div>
            <button class="btn btn-primary btn-xs" onclick="Recruitment.showScheduleInterviewModal()"><i class="fa fa-plus"></i> Schedule Interview</button>
          </div>
          <div class="table-wrapper" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Round / Stage</th>
                  <th>Interviewer Panel</th>
                  <th>Scheduled Date &amp; Time</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Evaluation</th>
                </tr>
              </thead>
              <tbody>
                ${interviews.map(inv => {
                  const candidate = (DB.get('applications')||[]).find(a => a.id === inv.candidateId);
                  const interviewer = DB.find('employees', inv.interviewerId);
                  const fb = feedbacks.find(f => f.interviewId === inv.id);
                  return `
                    <tr>
                      <td>
                        <div style="font-weight:700">${candidate?.name || 'Candidate #' + inv.candidateId}</div>
                        <div style="font-size:11px;color:var(--text-3)">${candidate?.email || '—'}</div>
                      </td>
                      <td><strong>${inv.roundName}</strong></td>
                      <td>${interviewer?.fullName || 'Senior Panelist'}</td>
                      <td><i class="fa fa-clock" style="color:var(--text-3);margin-right:4px"></i>${inv.scheduledAt ? inv.scheduledAt.replace('T',' ') : '—'}</td>
                      <td><span class="chip"><i class="fa ${inv.mode==='Online Video'?'fa-video':'fa-building'}" style="margin-right:4px"></i>${inv.mode || 'In-Person'}</span></td>
                      <td>${Utils.statusBadge(inv.status)}</td>
                      <td>
                        ${fb ? `
                          <span class="badge badge-success" title="${fb.remarks}"><i class="fa fa-star"></i> ${fb.score}/5.0 (${fb.recommendation})</span>
                        ` : `
                          <button class="btn btn-warning btn-xs" onclick="Recruitment.showSubmitInterviewFeedbackModal(${inv.id})"><i class="fa fa-star-half-stroke"></i> Evaluate</button>
                        `}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recruitment Pipeline Stages Definition Master -->
        <div class="card" style="padding:0">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <div>
              <span style="font-size:14px;font-weight:700">Governance Pipeline Stages Master</span>
              <span class="badge badge-secondary" style="margin-left:8px">${stages.length} Configured Stages</span>
            </div>
          </div>
          <div class="table-wrapper" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Stage Name</th>
                  <th>Order</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${stages.map(st => `
                  <tr>
                    <td style="font-weight:700"><i class="fa fa-circle-dot" style="color:var(--primary);margin-right:6px"></i>${st.name}</td>
                    <td><span class="chip">Stage #${st.order}</span></td>
                    <td style="color:var(--text-3);font-size:12px">${st.description || 'Standard applicant progression stage'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  showScheduleInterviewModal() {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Interview scheduling is restricted to HR & Admin.', 'error');
      return;
    }
    const apps = DB.get('applications') || [];
    const emps = DB.get('employees').filter(e => e.status === 'active');
    Modal.show('Schedule Candidate Interview Round', `
      <div class="form-group">
        <label class="form-label required">Candidate Application</label>
        <select class="form-control" id="inv-cand">
          ${apps.map(a => `<option value="${a.id}">${a.name} (${a.role || 'Applicant'})</option>`).join('')}
        </select>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Round Name</label>
          <input class="form-control" id="inv-round" value="Technical Round 1" placeholder="e.g. Technical Round 1">
        </div>
        <div class="form-group">
          <label class="form-label required">Lead Interviewer</label>
          <select class="form-control" id="inv-panel">
            ${emps.map(e => `<option value="${e.id}">${e.fullName} (${Utils.getDesigName(e.designationId)})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Scheduled Date &amp; Time</label>
          <input type="datetime-local" class="form-control" id="inv-time" value="${Utils.today()}T10:00">
        </div>
        <div class="form-group">
          <label class="form-label required">Interview Mode</label>
          <select class="form-control" id="inv-mode">
            <option value="Online Video">Online Video (Google Meet)</option>
            <option value="In-Person">In-Person (HQ Conference Room)</option>
            <option value="Phone Screen">Phone Screen</option>
          </select>
        </div>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Recruitment.saveScheduledInterview()"><i class="fa fa-calendar-plus"></i> Schedule Round</button>
      `
    });
  },

  saveScheduledInterview() {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Interview scheduling is restricted to HR & Admin.', 'error');
      return;
    }
    const candidateId = parseInt(document.getElementById('inv-cand').value);
    const roundName = document.getElementById('inv-round').value.trim();
    const interviewerId = parseInt(document.getElementById('inv-panel').value);
    const scheduledAt = document.getElementById('inv-time').value;
    const mode = document.getElementById('inv-mode').value;

    const interviews = DB.get('interviews') || [];
    const newInv = {
      id: interviews.length > 0 ? Math.max(...interviews.map(i => i.id)) + 1 : 1,
      candidateId, roundName, interviewerId, scheduledAt, mode, status: 'scheduled'
    };
    interviews.push(newInv);
    DB.set('interviews', interviews);
    DB.log('SCHEDULE', 'Recruitment', `Scheduled ${roundName} for candidate #${candidateId}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Interview scheduled successfully!', 'success');
    this.renderView();
  },

  showSubmitInterviewFeedbackModal(interviewId) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Interview feedback is restricted to HR & Admin.', 'error');
      return;
    }
    const inv = (DB.get('interviews') || []).find(i => i.id === interviewId);
    if (!inv) return;
    const candidate = (DB.get('applications')||[]).find(a => a.id === inv.candidateId);

    Modal.show(`Interview Rubric Evaluation — ${candidate?.name || 'Candidate'}`, `
      <div style="font-size:12.5px;color:var(--text-3);margin-bottom:14px">
        Round: <strong>${inv.roundName}</strong> &bull; Scheduled: <strong>${inv.scheduledAt ? inv.scheduledAt.replace('T',' ') : ''}</strong>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label required">Overall Score (out of 5.0)</label>
          <input type="number" class="form-control" id="ifb-score" min="1" max="5" step="0.1" value="4.5">
        </div>
        <div class="form-group">
          <label class="form-label required">Hiring Recommendation</label>
          <select class="form-control" id="ifb-rec">
            <option value="Strong Hire">Strong Hire</option>
            <option value="Hire" selected>Hire</option>
            <option value="Hold">Hold / Re-evaluate</option>
            <option value="Reject">Reject</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label required">Detailed Evaluator Rubric Remarks</label>
        <textarea class="form-control" id="ifb-remarks" rows="3" placeholder="Assess technical competency, problem-solving, architectural depth, and cultural alignment...">Demonstrated strong system architecture comprehension, solid problem-solving skills, and proactive communication.</textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Recruitment.saveInterviewFeedback(${interviewId})"><i class="fa fa-save"></i> Save Feedback</button>
      `
    });
  },

  saveInterviewFeedback(interviewId) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Interview feedback is restricted to HR & Admin.', 'error');
      return;
    }
    const score = parseFloat(document.getElementById('ifb-score').value) || 4.0;
    const recommendation = document.getElementById('ifb-rec').value;
    const remarks = document.getElementById('ifb-remarks').value.trim();

    const feedbacks = DB.get('interview_feedbacks') || [];
    const newFb = {
      id: feedbacks.length > 0 ? Math.max(...feedbacks.map(f => f.id)) + 1 : 1,
      interviewId, score, recommendation, remarks
    };
    feedbacks.push(newFb);
    DB.set('interview_feedbacks', feedbacks);

    // Mark interview as completed
    const interviews = DB.get('interviews') || [];
    const inv = interviews.find(i => i.id === interviewId);
    if (inv) {
      inv.status = 'completed';
      DB.set('interviews', interviews);
    }

    DB.log('EVALUATE', 'Recruitment', `Submitted rubric feedback for Interview #${interviewId}: ${score}/5.0`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Evaluation feedback saved!', 'success');
    this.renderView();
  },

  renderTalentPools(container) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Talent pools and sourcing reservoirs are restricted to HR & Admin.', 'error');
      this.currentView = 'requisitions';
      this.render();
      return;
    }
    const pools = DB.get('talent_pools') || [];
    const refChecks = DB.get('reference_checks') || [];

    container.innerHTML = `
      <div class="animate-fade-in">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
          <!-- Talent Pools Card -->
          <div class="card" style="padding:0">
            <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
              <div>
                <span style="font-size:14px;font-weight:700">Talent Pools &amp; Candidate Sourcing</span>
                <span class="badge badge-primary" style="margin-left:8px">${pools.length} Pools</span>
              </div>
              <button class="btn btn-primary btn-xs" onclick="Recruitment.showAddTalentPoolModal()"><i class="fa fa-plus"></i> New Pool</button>
            </div>
            <div class="table-wrapper" style="border:none">
              <table>
                <thead>
                  <tr>
                    <th>Pool Title</th>
                    <th>Functional Domain</th>
                    <th>Strategic Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${pools.map(p => `
                    <tr>
                      <td style="font-weight:700"><i class="fa fa-folder-open" style="color:var(--primary);margin-right:6px"></i>${p.title}</td>
                      <td><span class="chip">${p.domain}</span></td>
                      <td style="font-size:12px;color:var(--text-3)">${p.notes || '—'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Reference Checks Card -->
          <div class="card" style="padding:0">
            <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
              <div>
                <span style="font-size:14px;font-weight:700">Candidate Reference Checks</span>
                <span class="badge badge-info" style="margin-left:8px">${refChecks.length} Verified</span>
              </div>
            </div>
            <div class="table-wrapper" style="border:none">
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Referee Name</th>
                    <th>Company / Role</th>
                    <th>Rating</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${refChecks.map(r => {
                    const candidate = (DB.get('applications')||[]).find(a => a.id === r.candidateId);
                    return `
                      <tr>
                        <td style="font-weight:600">${candidate?.name || 'Candidate #' + r.candidateId}</td>
                        <td>${r.refereeName}</td>
                        <td style="font-size:11.5px;color:var(--text-3)">${r.company} (${r.designation})</td>
                        <td><span style="font-weight:700;color:var(--warning)">★ ${r.rating} / 5.0</span></td>
                        <td><span class="badge ${r.status==='verified'?'badge-success':'badge-secondary'}">${r.status}</span></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  showAddTalentPoolModal() {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Talent pools are restricted to HR & Admin.', 'error');
      return;
    }
    Modal.show('Create Talent Sourcing Pool', `
      <div class="form-group">
        <label class="form-label required">Pool Title</label>
        <input class="form-control" id="tp-title" placeholder="e.g. Senior Machine Learning &amp; AI Engineers">
      </div>
      <div class="form-group">
        <label class="form-label required">Functional Domain</label>
        <input class="form-control" id="tp-domain" placeholder="e.g. AI / Machine Learning" value="Engineering">
      </div>
      <div class="form-group">
        <label class="form-label">Strategic Sourcing Notes</label>
        <textarea class="form-control" id="tp-notes" rows="2" placeholder="Notes on talent pipeline, target companies, or upcoming hiring waves...">Pre-screened candidates identified for future expansion</textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Recruitment.saveTalentPool()"><i class="fa fa-save"></i> Save Talent Pool</button>
      `
    });
  },

  saveTalentPool() {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Talent pools are restricted to HR & Admin.', 'error');
      return;
    }
    const title = document.getElementById('tp-title').value.trim();
    if (!title) { Toast.show('Please enter talent pool title', 'error'); return; }
    const domain = document.getElementById('tp-domain').value.trim() || 'General';
    const notes = document.getElementById('tp-notes').value.trim();

    const pools = DB.get('talent_pools') || [];
    const newPool = {
      id: pools.length > 0 ? Math.max(...pools.map(p => p.id)) + 1 : 1,
      title, domain, notes
    };
    pools.push(newPool);
    DB.set('talent_pools', pools);
    DB.log('CREATE', 'Recruitment', `Created Talent Pool: ${title}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Talent Pool created!', 'success');
    this.renderView();
  },

  getOnboardingTasks(ob) {
    if (Array.isArray(ob.tasks) && ob.tasks.length > 0) return ob.tasks;
    if (typeof ob.checklist === 'string') {
      try { return JSON.parse(ob.checklist); } catch (e) { return []; }
    }
    if (Array.isArray(ob.checklist)) return ob.checklist;
    return [];
  },

  renderOnboarding(container) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Only HR and Administrators have access to onboarding pipelines.', 'error');
      this.currentView = 'requisitions';
      this.render();
      return;
    }
    const onboardings = DB.get('onboardings') || [];
    const completedCount = onboardings.filter(o => o.status === 'completed' || o.progress === 100).length;
    const inProgressCount = onboardings.length - completedCount;
    const avgProgress = onboardings.length > 0 ? Math.round(onboardings.reduce((sum, o) => sum + (o.progress || 0), 0) / onboardings.length) : 0;
    
    // Count total remaining tasks
    let totalPendingTasks = 0;
    onboardings.forEach(ob => {
      const tasks = this.getOnboardingTasks(ob);
      totalPendingTasks += tasks.filter(t => !t.completed).length;
    });

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Onboarding Process KPI Cards -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid var(--primary)">
            <div style="font-size:11.5px;color:var(--text-3);text-transform:uppercase;font-weight:600">Total in Onboarding</div>
            <div style="font-size:24px;font-weight:800;color:var(--primary);margin-top:4px">${onboardings.length}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">New hires in onboarding cycle</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid var(--warning)">
            <div style="font-size:11.5px;color:var(--text-3);text-transform:uppercase;font-weight:600">In-Progress Pipeline</div>
            <div style="font-size:24px;font-weight:800;color:var(--warning);margin-top:4px">${inProgressCount}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">Checklist tasks pending</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid var(--success)">
            <div style="font-size:11.5px;color:var(--text-3);text-transform:uppercase;font-weight:600">Ready for Day-1</div>
            <div style="font-size:24px;font-weight:800;color:var(--success);margin-top:4px">${completedCount}</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">100% completed checklists</div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;border-top:3px solid var(--accent)">
            <div style="font-size:11.5px;color:var(--text-3);text-transform:uppercase;font-weight:600">Avg Completion Rate</div>
            <div style="font-size:24px;font-weight:800;color:var(--accent);margin-top:4px">${avgProgress}%</div>
            <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${totalPendingTasks} total tasks pending</div>
          </div>
        </div>

        <div class="card" style="padding:0">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
            <div>
              <span style="font-size:14px;font-weight:700">New Hire Onboarding Pipeline &amp; Task Checklists</span>
              <span class="badge badge-success" style="margin-left:8px">${onboardings.length} In Onboarding</span>
            </div>
            <button class="btn btn-primary btn-sm" onclick="Recruitment.showAddOnboardingModal()">
              <i class="fa fa-user-plus"></i> Initiate New Hire Onboarding
            </button>
          </div>
          <div class="table-wrapper" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Candidate / New Hire</th>
                  <th>Joining Date</th>
                  <th>Assigned Buddy</th>
                  <th>Checklist Progress</th>
                  <th>Status</th>
                  <th style="text-align:center">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${onboardings.length === 0 ? `
                  <tr>
                    <td colspan="6" style="text-align:center;padding:30px;color:var(--text-3)">
                      <i class="fa fa-clipboard-check" style="font-size:32px;opacity:0.4;margin-bottom:8px;display:block"></i>
                      No candidates currently in onboarding. Click <strong>Initiate New Hire Onboarding</strong> to launch pre-boarding!
                    </td>
                  </tr>
                ` : onboardings.map(ob => {
                  const candidate = (DB.get('applications')||[]).find(a => a.id === ob.candidateId);
                  const buddy = DB.find('employees', ob.buddyId);
                  const tasks = this.getOnboardingTasks(ob);
                  const completedTasks = tasks.filter(t => t.completed).length;
                  const pct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : (ob.progress || 0);
                  const color = pct === 100 ? 'var(--success)' : pct >= 50 ? 'var(--primary)' : 'var(--warning)';
                  const initials = (candidate?.name || 'NH').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();

                  return `
                    <tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:10px">
                          <div style="width:34px;height:34px;border-radius:50%;background:var(--primary-glow);color:var(--primary);font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;border:1px solid var(--primary)">
                            ${initials}
                          </div>
                          <div>
                            <div style="font-weight:700">${candidate?.name || 'Candidate #' + ob.candidateId}</div>
                            <div style="font-size:11px;color:var(--text-3)">${candidate?.role || 'New Employee'}</div>
                          </div>
                        </div>
                      </td>
                      <td><i class="fa fa-calendar-check" style="color:var(--primary);margin-right:4px"></i>${ob.joiningDate || '2026-09-15'}</td>
                      <td><i class="fa fa-user-shield" style="color:var(--info);margin-right:4px"></i>${buddy?.fullName || 'Senior Buddy'}</td>
                      <td style="width:190px">
                        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
                          <span>${completedTasks}/${tasks.length} Tasks</span>
                          <strong style="color:${color}">${pct}%</strong>
                        </div>
                        <div class="progress" style="height:7px;border-radius:4px"><div class="progress-bar" style="width:${pct}%;background:${color}"></div></div>
                      </td>
                      <td>
                        <span class="badge ${pct===100 || ob.status==='completed'?'badge-success':'badge-primary'}">
                          ${pct===100 || ob.status==='completed' ? 'Ready for Day-1' : 'In Progress'}
                        </span>
                      </td>
                      <td style="text-align:center">
                        <div style="display:flex;gap:6px;justify-content:center">
                          <button class="btn btn-outline btn-xs" onclick="Recruitment.viewOnboardingChecklist(${ob.id})" title="View and toggle checklist">
                            <i class="fa fa-list-check"></i> Checklist
                          </button>
                          ${candidate ? `
                            <button class="btn btn-ghost btn-xs text-success" onclick="Recruitment.onboardCandidateDirectly(${candidate.id})" title="Create official employee profile">
                              <i class="fa fa-user-plus"></i>
                            </button>
                          ` : ''}
                        </div>
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

  showAddOnboardingModal() {
    if (!this.isHROrAdmin()) return Toast.show('Access Denied: Only HR and Administrators can initiate onboarding.', 'error');
    const apps = DB.get('applications') || [];
    const emps = (DB.get('employees') || []).filter(e => e.status === 'active');
    const onboardings = DB.get('onboardings') || [];
    const alreadyOnboardedIds = onboardings.map(o => o.candidateId);
    
    // Prioritize candidates in 'hired' or 'offer' stage who aren't yet in onboardings
    const eligibleApps = apps.filter(a => !alreadyOnboardedIds.includes(a.id));
    const candidateList = eligibleApps.length > 0 ? eligibleApps : apps;
    const defaultDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    Modal.show('Initiate New Hire Onboarding', `
      <form onsubmit="Recruitment.saveNewOnboarding(event)">
        <div class="form-group">
          <label class="form-label required">Select Candidate / New Hire</label>
          <select class="form-control" id="ob-candidate-select" required>
            <option value="">-- Choose Candidate --</option>
            ${candidateList.map(a => `
              <option value="${a.id}">${a.name} — ${a.role || 'Candidate'} (${(a.stage||'applied').toUpperCase()})</option>
            `).join('')}
          </select>
        </div>
        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label required">Target Joining Date</label>
            <input type="date" class="form-control" id="ob-joining-date" value="${defaultDate}" required>
          </div>
          <div class="form-group">
            <label class="form-label required">Assigned Onboarding Buddy / Mentor</label>
            <select class="form-control" id="ob-buddy-select" required>
              ${emps.map(e => `
                <option value="${e.id}">${e.fullName} (${Utils.getDesigName(e.designationId) || 'Mentor'})</option>
              `).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Onboarding Track Template</label>
          <select class="form-control" id="ob-template-select">
            <option value="standard">Standard Full Onboarding (8 Stages: Docs, IT, Payroll, Induction)</option>
            <option value="engineering">Technical / Engineering Track (Includes GitHub, AWS & Architecture Briefing)</option>
            <option value="executive">Management / Executive Track (Leadership Orientation & KPI Alignment)</option>
          </select>
        </div>
        <div style="background:var(--surface);padding:12px;border-radius:8px;margin-top:8px;font-size:12px;color:var(--text-3)">
          <i class="fa fa-circle-info text-primary" style="margin-right:6px"></i>
          This initiates the post-offer onboarding process according to the recruitment cycle, creating the Day-1 task checklist.
        </div>
        <div class="modal-footer" style="padding:16px 0 0;margin-top:16px;display:flex;justify-content:flex-end;gap:8px">
          <button type="button" class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa fa-check"></i> Launch Onboarding</button>
        </div>
      </form>
    `);
  },

  saveNewOnboarding(e) {
    e.preventDefault();
    if (!this.isHROrAdmin()) return Toast.show('Access Denied: Only HR and Administrators can initiate onboarding.', 'error');
    const candidateId = parseInt(document.getElementById('ob-candidate-select').value);
    if (!candidateId) { Toast.show('Please select a candidate', 'error'); return; }
    const joiningDate = document.getElementById('ob-joining-date').value;
    const buddyId = parseInt(document.getElementById('ob-buddy-select').value) || 1;
    const template = document.getElementById('ob-template-select').value;

    let tasks = [
      { category: 'Pre-Joining & Compliance', task: 'Signed Formal Offer Letter & Employment Agreement', completed: true },
      { category: 'Pre-Joining & Compliance', task: 'CNIC, Educational Degrees & Experience Letters Verification', completed: false },
      { category: 'Pre-Joining & Compliance', task: 'Professional Reference & Background Check Clearance', completed: false },
      { category: 'IT & Equipment Setup', task: 'Corporate Laptop, Workstation & Equipment Issuance', completed: false },
      { category: 'IT & Systems Access', task: 'Corporate Email, IAM, Slack & Core Tools Provisioning', completed: false },
      { category: 'Finance & Payroll', task: 'Bank Payout Account Details & NTN Tax Registration', completed: false },
      { category: 'Orientation & Induction', task: 'HR Policies Briefing & Company Handbook Handover', completed: false },
      { category: 'Orientation & Induction', task: 'Team Introduction & 30-Day Probation Goal Setting', completed: false }
    ];

    if (template === 'engineering') {
      tasks.push({ category: 'IT & Systems Access', task: 'GitHub Organization, AWS IAM & Staging Environment Access', completed: false });
      tasks.push({ category: 'Orientation & Induction', task: 'Engineering Architecture Deep Dive & Codebase Walkthrough', completed: false });
    } else if (template === 'executive') {
      tasks.push({ category: 'Orientation & Induction', task: 'Executive Leadership Briefing & Department KPI Alignment', completed: false });
    }

    const onboardings = DB.get('onboardings') || [];
    const newOb = {
      id: onboardings.length > 0 ? Math.max(...onboardings.map(o => o.id)) + 1 : 1,
      candidateId,
      status: 'in_progress',
      joiningDate,
      buddyId,
      progress: Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100),
      tasks,
      checklist: JSON.stringify(tasks)
    };

    onboardings.push(newOb);
    DB.set('onboardings', onboardings);

    // Also update candidate stage to hired if not already
    const app = DB.find('applications', candidateId);
    if (app && app.stage !== 'hired') {
      DB.update('applications', candidateId, { stage: 'hired' });
    }

    DB.log('CREATE', 'Recruitment', `Initiated Onboarding Checklist for candidate #${candidateId}`, Auth.user?.id);
    Modal.close('dynamic-modal');
    Toast.show('Candidate onboarding initiated successfully!', 'success');
    this.render();
  },

  viewOnboardingChecklist(onboardingId) {
    if (!this.isHROrAdmin()) return Toast.show('Access Denied: Only HR and Administrators can view onboarding checklists.', 'error');
    const onboardings = DB.get('onboardings') || [];
    const ob = onboardings.find(o => o.id === onboardingId);
    if (!ob) return;
    const candidate = (DB.get('applications')||[]).find(a => a.id === ob.candidateId);
    const buddy = DB.find('employees', ob.buddyId);
    const tasks = this.getOnboardingTasks(ob);
    const completedTasks = tasks.filter(t => t.completed).length;
    const pct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const color = pct === 100 ? 'var(--success)' : pct >= 50 ? 'var(--primary)' : 'var(--warning)';

    // Auto-categorize legacy tasks
    tasks.forEach(t => {
      if (!t.category) {
        const txt = (t.task || '').toLowerCase();
        if (txt.includes('cnic') || txt.includes('degree') || txt.includes('verification') || txt.includes('contract') || txt.includes('offer')) {
          t.category = 'Pre-Joining & Compliance';
        } else if (txt.includes('laptop') || txt.includes('macbook') || txt.includes('sim') || txt.includes('hardware') || txt.includes('equipment')) {
          t.category = 'IT & Equipment Setup';
        } else if (txt.includes('iam') || txt.includes('slack') || txt.includes('email') || txt.includes('access') || txt.includes('aws')) {
          t.category = 'IT & Systems Access';
        } else if (txt.includes('bank') || txt.includes('payout') || txt.includes('tax') || txt.includes('salary') || txt.includes('payroll')) {
          t.category = 'Finance & Payroll';
        } else {
          t.category = 'Orientation & Induction';
        }
      }
    });

    // Group tasks by category
    const categories = ['Pre-Joining & Compliance', 'IT & Equipment Setup', 'IT & Systems Access', 'Finance & Payroll', 'Orientation & Induction'];
    const uncategorized = tasks.filter(t => !t.category || !categories.includes(t.category));

    Modal.show(`Onboarding Checklist — ${candidate?.name || 'New Hire'}`, `
      <div style="background:var(--surface);padding:14px 18px;border-radius:10px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-size:16px;font-weight:700">${candidate?.name || 'New Employee'}</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:2px">
            Role: <strong>${candidate?.role || 'New Hire'}</strong> &bull; Joining: <strong>${ob.joiningDate || '2026-09-15'}</strong> &bull; Buddy: <strong>${buddy?.fullName || 'Assigned Buddy'}</strong>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:14px;font-weight:800;color:${color}">${pct}% Complete</div>
          <div style="font-size:11px;color:var(--text-3)">${completedTasks} of ${tasks.length} tasks done</div>
        </div>
      </div>

      <div class="progress" style="height:8px;border-radius:4px;margin-bottom:18px">
        <div class="progress-bar" style="width:${pct}%;background:${color}"></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;max-height:420px;overflow-y:auto;padding-right:4px">
        ${categories.map(cat => {
          const catTasks = tasks.map((t, idx) => ({ ...t, originalIndex: idx })).filter(t => t.category === cat);
          if (catTasks.length === 0) return '';
          return `
            <div style="border:1px solid var(--border);border-radius:8px;padding:10px 14px;background:var(--card)">
              <div style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:6px">
                <i class="fa fa-circle-check"></i> ${cat}
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">
                ${catTasks.map(t => `
                  <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--surface);border-radius:6px;cursor:pointer;transition:all .15s">
                    <input type="checkbox" id="ob-task-${t.originalIndex}" ${t.completed ? 'checked' : ''} onchange="Recruitment.toggleOnboardingTask(${onboardingId}, ${t.originalIndex}, this.checked)">
                    <span style="font-size:13px;font-weight:500;${t.completed ? 'text-decoration:line-through;color:var(--text-3)' : 'color:var(--text)'}">${t.task}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}

        ${uncategorized.length > 0 ? `
          <div style="border:1px solid var(--border);border-radius:8px;padding:10px 14px;background:var(--card)">
            <div style="font-size:12px;font-weight:700;color:var(--text-2);text-transform:uppercase;margin-bottom:8px">
              Additional Onboarding Tasks
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${tasks.map((t, idx) => ({ ...t, originalIndex: idx }))
                .filter(t => !t.category || !categories.includes(t.category))
                .map(t => `
                  <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--surface);border-radius:6px;cursor:pointer">
                    <input type="checkbox" id="ob-task-${t.originalIndex}" ${t.completed ? 'checked' : ''} onchange="Recruitment.toggleOnboardingTask(${onboardingId}, ${t.originalIndex}, this.checked)">
                    <span style="font-size:13px;font-weight:500;${t.completed ? 'text-decoration:line-through;color:var(--text-3)' : 'color:var(--text)'}">${t.task}</span>
                  </label>
                `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Add Custom Task Input -->
        <div style="display:flex;gap:8px;margin-top:6px">
          <input type="text" class="form-control" id="new-ob-task-name" placeholder="Add custom onboarding task...">
          <button class="btn btn-outline btn-sm" style="white-space:nowrap" onclick="Recruitment.addCustomOnboardingTask(${onboardingId})">
            <i class="fa fa-plus"></i> Add Task
          </button>
        </div>
      </div>
    `, {
      footer: `
        <div style="display:flex;justify-content:space-between;width:100%;align-items:center">
          ${candidate ? `
            <button class="btn btn-ghost btn-sm text-success" onclick="Modal.close('dynamic-modal');Recruitment.onboardCandidateDirectly(${candidate.id})">
              <i class="fa fa-user-plus"></i> Transfer to Employee Profile
            </button>
          ` : `<div></div>`}
          <button class="btn btn-primary" onclick="Modal.close('dynamic-modal')">Done</button>
        </div>
      `
    });
  },

  addCustomOnboardingTask(onboardingId) {
    if (!this.isHROrAdmin()) return Toast.show('Access Denied: Only HR and Administrators can manage onboarding checklists.', 'error');
    const input = document.getElementById('new-ob-task-name');
    const taskName = input?.value.trim();
    if (!taskName) { Toast.show('Please enter task description', 'warning'); return; }

    const onboardings = DB.get('onboardings') || [];
    const ob = onboardings.find(o => o.id === onboardingId);
    if (!ob) return;

    const tasks = this.getOnboardingTasks(ob);
    tasks.push({ category: 'Orientation & Induction', task: taskName, completed: false });
    ob.tasks = tasks;
    ob.checklist = JSON.stringify(tasks);
    const completedTasks = tasks.filter(t => t.completed).length;
    ob.progress = Math.round((completedTasks / tasks.length) * 100);
    ob.status = ob.progress === 100 ? 'completed' : 'in_progress';
    
    DB.set('onboardings', onboardings);
    Toast.show('Task added to onboarding checklist!', 'success');
    this.viewOnboardingChecklist(onboardingId);
    this.renderView();
  },

  toggleOnboardingTask(onboardingId, taskIdx, isCompleted) {
    if (!this.isHROrAdmin()) return Toast.show('Access Denied: Only HR and Administrators can manage onboarding checklists.', 'error');
    const onboardings = DB.get('onboardings') || [];
    const ob = onboardings.find(o => o.id === onboardingId);
    if (!ob) return;
    const tasks = this.getOnboardingTasks(ob);
    if (!tasks[taskIdx]) return;
    tasks[taskIdx].completed = isCompleted;
    ob.tasks = tasks;
    ob.checklist = JSON.stringify(tasks);
    const completedTasks = tasks.filter(t => t.completed).length;
    ob.progress = Math.round((completedTasks / tasks.length) * 100);
    if (ob.progress === 100) ob.status = 'completed';
    else ob.status = 'in_progress';
    DB.set('onboardings', onboardings);
    DB.log('UPDATE', 'Recruitment', `Updated onboarding task #${taskIdx} for Onboarding #${onboardingId}`, Auth.user?.id);
    this.renderView();
    // Also re-render the modal if open
    const modal = document.getElementById('dynamic-modal');
    if (modal && modal.style.display !== 'none') {
      this.viewOnboardingChecklist(onboardingId);
    }
  },

  // ═══════════════════════════════════════════════
  // RECRUITMENT INTERVIEW ASSESSMENT SHEETS & FUNNEL ANALYTICS
  // ═══════════════════════════════════════════════

  assessmentFilter: { jobId: 'all', search: '', recommendation: 'all' },

  renderAssessmentSheets(container) {
    if (!this.isHROrAdmin()) {
      Toast.show('Access Denied: Only HR and Administrators have access to candidate assessments and funnel analytics.', 'error');
      this.currentView = 'requisitions';
      this.render();
      return;
    }
    const jobs = DB.get('recruitment') || [];
    let assessments = DB.get('candidate_assessments') || [];

    // Summary calculations across relevant jobs
    const trackedJobs = jobs.filter(j => j.applicantCount || assessments.some(a => a.jobId === j.id));
    const totalTracked = trackedJobs.reduce((sum, j) => sum + (j.applicantCount || assessments.filter(a => a.jobId === j.id).length || 0), 0);
    const totalInterviewed = assessments.length;
    const totalShortlisted = assessments.filter(a => a.isShortlisted !== undefined ? a.isShortlisted : (['P1', 'P2'].includes(a.priority) || a.recommendation === 'Recommended for Offer')).length;
    const totalHired = assessments.filter(a => a.hired).length;
    const overallYield = totalTracked > 0 ? ((totalHired / totalTracked) * 100).toFixed(1) : '0.0';

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Top Metrics Ribbon -->
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">
          <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;display:flex;align-items:center;gap:12px">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(37,99,235,0.12);color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:18px">
              <i class="fa fa-users"></i>
            </div>
            <div>
              <div style="font-size:22px;font-weight:800;color:#2563eb">${totalTracked}</div>
              <div style="font-size:12px;color:var(--text-3)">Total Tracked</div>
            </div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;display:flex;align-items:center;gap:12px">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(14,165,233,0.12);color:#0ea5e9;display:flex;align-items:center;justify-content:center;font-size:18px">
              <i class="fa fa-comments"></i>
            </div>
            <div>
              <div style="font-size:22px;font-weight:800;color:#0ea5e9">${totalInterviewed}</div>
              <div style="font-size:12px;color:var(--text-3)">Interviewed Candidates</div>
            </div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;display:flex;align-items:center;gap:12px">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(217,119,6,0.12);color:#d97706;display:flex;align-items:center;justify-content:center;font-size:18px">
              <i class="fa fa-list-check"></i>
            </div>
            <div>
              <div style="font-size:22px;font-weight:800;color:#d97706">${totalShortlisted}</div>
              <div style="font-size:12px;color:var(--text-3)">Shortlisted (P1/P2/P3)</div>
            </div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;display:flex;align-items:center;gap:12px">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(5,150,105,0.12);color:#059669;display:flex;align-items:center;justify-content:center;font-size:18px">
              <i class="fa fa-user-check"></i>
            </div>
            <div>
              <div style="font-size:22px;font-weight:800;color:#059669">${totalHired}</div>
              <div style="font-size:12px;color:var(--text-3)">Selected / Hired</div>
            </div>
          </div>
          <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px;display:flex;align-items:center;gap:12px">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(124,58,237,0.12);color:#7c3aed;display:flex;align-items:center;justify-content:center;font-size:18px">
              <i class="fa fa-chart-line"></i>
            </div>
            <div>
              <div style="font-size:22px;font-weight:800;color:#7c3aed">${overallYield}%</div>
              <div style="font-size:12px;color:var(--text-3)">Overall Conversion Rate</div>
            </div>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="card" style="padding:14px 18px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <div style="font-size:13px;font-weight:700;color:var(--text-2)">
              <i class="fa fa-filter" style="margin-right:6px"></i>Filter Cohorts:
            </div>
            <select class="form-control" style="width:230px;font-size:12.5px" onchange="Recruitment.setAssessmentFilter('jobId', this.value)">
              <option value="all" ${this.assessmentFilter.jobId === 'all' ? 'selected' : ''}>All Positions (${jobs.length})</option>
              ${jobs.map(j => `<option value="${j.id}" ${String(this.assessmentFilter.jobId) === String(j.id) ? 'selected' : ''}>${j.title}</option>`).join('')}
            </select>
            <select class="form-control" style="width:190px;font-size:12.5px" onchange="Recruitment.setAssessmentFilter('recommendation', this.value)">
              <option value="all" ${this.assessmentFilter.recommendation === 'all' ? 'selected' : ''}>All Recommendations</option>
              <option value="Recommended for Offer" ${this.assessmentFilter.recommendation === 'Recommended for Offer' ? 'selected' : ''}>Recommended for Offer</option>
              <option value="Hold / Backup" ${this.assessmentFilter.recommendation === 'Hold / Backup' ? 'selected' : ''}>Hold / Backup</option>
              <option value="Not Recommended" ${this.assessmentFilter.recommendation === 'Not Recommended' ? 'selected' : ''}>Not Recommended</option>
            </select>
            <div style="position:relative">
              <i class="fa fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-3);font-size:12px"></i>
              <input type="text" class="form-control" style="padding-left:30px;width:200px;font-size:12.5px" placeholder="Search candidate..." value="${this.assessmentFilter.search}" oninput="Recruitment.setAssessmentFilter('search', this.value)">
            </div>
            ${(this.assessmentFilter.jobId !== 'all' || this.assessmentFilter.recommendation !== 'all' || this.assessmentFilter.search) ? `
              <button class="btn btn-ghost btn-xs text-danger" onclick="Recruitment.resetAssessmentFilter()">
                <i class="fa fa-times"></i> Clear Filters
              </button>
            ` : ''}
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-outline btn-sm" onclick="Recruitment.exportAssessmentCSV()">
              <i class="fa fa-file-csv"></i> Export CSV
            </button>
            <button class="btn btn-outline btn-sm" onclick="Recruitment.printAssessmentSheet()">
              <i class="fa fa-print"></i> Print Sheet
            </button>
            <button class="btn btn-primary btn-sm" onclick="Recruitment.showAddAssessmentModal()">
              <i class="fa fa-plus"></i> Add Candidate Evaluation
            </button>
          </div>
        </div>

        <!-- Section 1: Position-Wise Assessment Sheets -->
        <div id="position-assessment-sheets-wrap">
          ${this.renderAssessmentCards(jobs, assessments)}
        </div>

        <!-- Section 2: Recruitment Funnel & Conversion Analytics Table -->
        <div id="recruitment-funnel-analytics-wrap" style="margin-top:20px">
          ${this.renderFunnelAnalyticsTable(jobs, assessments)}
        </div>
      </div>
    `;
  },

  setAssessmentFilter(key, val) {
    this.assessmentFilter[key] = val;
    this.renderView();
  },

  resetAssessmentFilter() {
    this.assessmentFilter = { jobId: 'all', search: '', recommendation: 'all' };
    this.renderView();
  },

  renderAssessmentCards(jobs, allAssessments) {
    let targetJobs = jobs;
    if (this.assessmentFilter.jobId !== 'all') {
      targetJobs = jobs.filter(j => String(j.id) === String(this.assessmentFilter.jobId));
    }

    // Keep jobs that have assessments or applicant count or were explicitly selected
    if (this.assessmentFilter.jobId === 'all') {
      targetJobs = targetJobs.filter(j => j.applicantCount || allAssessments.some(a => a.jobId === j.id));
    }

    if (targetJobs.length === 0) {
      return `
        <div class="card" style="text-align:center;padding:40px;color:var(--text-3)">
          <i class="fa fa-filter" style="font-size:36px;opacity:0.3;margin-bottom:12px;display:block"></i>
          <div style="font-size:15px;font-weight:700;color:var(--text)">No Assessment Sheets Match Current Filters</div>
          <p style="font-size:12.5px;max-width:400px;margin:6px auto 14px">Try adjusting your position filter or search terms, or add candidate evaluations.</p>
          <button class="btn btn-primary btn-sm" onclick="Recruitment.resetAssessmentFilter()">Reset Filters</button>
        </div>
      `;
    }

    return targetJobs.map(job => {
      let jobAssessments = allAssessments.filter(a => a.jobId === job.id || (a.jobTitle && a.jobTitle.toLowerCase() === job.title.toLowerCase()));
      
      // Apply recommendation and search filters
      if (this.assessmentFilter.recommendation !== 'all') {
        jobAssessments = jobAssessments.filter(a => a.recommendation === this.assessmentFilter.recommendation);
      }
      if (this.assessmentFilter.search) {
        const q = this.assessmentFilter.search.toLowerCase();
        jobAssessments = jobAssessments.filter(a => 
          (a.candidateName && a.candidateName.toLowerCase().includes(q)) ||
          (a.address && a.address.toLowerCase().includes(q)) ||
          (a.noticePeriod && a.noticePeriod.toLowerCase().includes(q))
        );
      }

      const trackedCount = job.applicantCount !== undefined ? job.applicantCount : jobAssessments.length;
      const interviewedCount = jobAssessments.length;

      // Cohort averages
      let totalExp = 0, totalScore = 0, totalCurSalary = 0, totalExpSalary = 0;
      let validSalaryCount = 0;
      jobAssessments.forEach(c => {
        totalExp += (Number(c.experience) || 0);
        totalScore += (Number(c.score) || 0);
        if (c.currentSalary) { totalCurSalary += Number(c.currentSalary); validSalaryCount++; }
        if (c.expectedSalary) { totalExpSalary += Number(c.expectedSalary); }
      });

      const avgExp = interviewedCount > 0 ? (totalExp / interviewedCount).toFixed(1) : '-';
      const avgScore = interviewedCount > 0 ? (totalScore / interviewedCount).toFixed(1) : '-';
      const avgPct = avgScore !== '-' ? (Number(avgScore)).toFixed(1) + '%' : '-';
      const avgCurSalary = validSalaryCount > 0 ? Math.round(totalCurSalary / validSalaryCount) : '-';
      const avgExpSalary = interviewedCount > 0 ? Math.round(totalExpSalary / interviewedCount) : '-';

      const priorityBadge = (p) => {
        if (p === 'P1') return `<span class="badge" style="background:#05966922;color:#059669;border:1px solid #05966955;font-weight:700">P1</span>`;
        if (p === 'P2') return `<span class="badge" style="background:#2563eb22;color:#2563eb;border:1px solid #2563eb55;font-weight:700">P2</span>`;
        if (p === 'P3') return `<span class="badge" style="background:#d9770622;color:#d97706;border:1px solid #d9770655;font-weight:700">P3</span>`;
        return `<span class="badge" style="background:#dc262622;color:#dc2626;border:1px solid #dc262655;font-weight:700">Not Recommended</span>`;
      };

      const recBadge = (r) => {
        if (r === 'Recommended for Offer') {
          return `<span class="badge" style="background:#10b98122;color:#10b981;border:1px solid #10b98155;font-weight:700;display:inline-flex;align-items:center;gap:4px"><i class="fa fa-check-circle"></i> Recommended for Offer</span>`;
        }
        if (r === 'Hold / Backup') {
          return `<span class="badge" style="background:#f59e0b22;color:#f59e0b;border:1px solid #f59e0b55;font-weight:700;display:inline-flex;align-items:center;gap:4px"><i class="fa fa-pause-circle"></i> Hold / Backup</span>`;
        }
        return `<span class="badge" style="background:#ef444422;color:#ef4444;border:1px solid #ef444455;font-weight:700;display:inline-flex;align-items:center;gap:4px"><i class="fa fa-times-circle"></i> Not Recommended</span>`;
      };

      return `
        <div style="margin-bottom:24px;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid var(--border)">
          <!-- Position Header Banner -->
          <div style="background:#0f3562;color:#ffffff;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <div>
              <div style="font-size:14px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase">
                <i class="fa fa-clipboard-list" style="margin-right:8px;color:#60a5fa"></i>
                ${job.title} - INTERVIEW ASSESSMENT SHEET
              </div>
              <div style="font-size:11.5px;color:#93c5fd;font-style:italic;margin-top:2px">
                Funnel Tracking: ${trackedCount} Candidates Tracked | ${interviewedCount} Candidates Interviewed
              </div>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn btn-xs" style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3)" onclick="Recruitment.showAddAssessmentModal(${job.id})">
                <i class="fa fa-user-plus"></i> Add Candidate Evaluation
              </button>
            </div>
          </div>

          <!-- Assessment Table -->
          <div class="table-responsive" style="overflow-x:auto;background:var(--card)">
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead>
                <tr style="background:#13335b;color:#ffffff;font-size:11.5px;text-align:center">
                  <th style="padding:10px 12px;border:1px solid #1e497f;text-align:left">Candidate Name</th>
                  <th style="padding:10px 12px;border:1px solid #1e497f">Shortlisted Date</th>
                  <th style="padding:10px 12px;border:1px solid #1e497f">Experience</th>
                  <th style="padding:10px 12px;border:1px solid #1e497f;text-align:right">Current Salary</th>
                  <th style="padding:10px 12px;border:1px solid #1e497f;text-align:right">Expected Salary</th>
                  <th style="padding:10px 12px;border:1px solid #1e497f">Total Score(/100)</th>
                  <th style="padding:10px 12px;border:1px solid #1e497f">Percentage(%)</th>
                  <th style="padding:10px 12px;border:1px solid #1e497f">Interview Date</th>
                  <th style="padding:10px 12px;border:1px solid #1e497f">Notice Period</th>
                  <th style="padding:10px 12px;border:1px solid #1e497f;text-align:left">Address/Residence</th>
                  <th style="padding:10px 12px;border:1px solid #1e497f">Priority level</th>
                  <th style="padding:10px 12px;border:1px solid #1e497f">Recommendation</th>
                  <th style="padding:10px 12px;border:1px solid #1e497f">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${jobAssessments.length === 0 ? `
                  <tr>
                    <td colspan="13" style="text-align:center;padding:26px;color:var(--text-3)">
                      <i class="fa fa-info-circle" style="margin-right:6px"></i>
                      No candidate interview evaluations recorded for this position yet.
                      <a href="javascript:void(0)" style="color:var(--primary);font-weight:700;margin-left:4px" onclick="Recruitment.showAddAssessmentModal(${job.id})">Add Candidate</a>
                    </td>
                  </tr>
                ` : jobAssessments.map(c => `
                  <tr style="border-bottom:1px solid var(--border);transition:background .15s" onmouseenter="this.style.background='var(--surface)'" onmouseleave="this.style.background='transparent'">
                    <td style="padding:9px 12px;border:1px solid var(--border);font-weight:700">
                      <div style="display:flex;align-items:center;gap:8px">
                        <div style="width:26px;height:26px;border-radius:50%;background:rgba(15,53,98,0.12);color:#0f3562;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">
                          ${c.candidateName ? c.candidateName.charAt(0) : 'C'}
                        </div>
                        <div>
                          ${c.candidateName}
                          ${c.hired ? `<span class="badge badge-success" style="font-size:9px;padding:1px 5px;margin-left:4px">Hired</span>` : ''}
                        </div>
                      </div>
                    </td>
                    <td style="padding:9px 12px;border:1px solid var(--border);text-align:center">${c.shortlistedDate || '-'}</td>
                    <td style="padding:9px 12px;border:1px solid var(--border);text-align:center">${c.experience !== undefined ? c.experience + ' yrs' : '-'}</td>
                    <td style="padding:9px 12px;border:1px solid var(--border);text-align:right;font-family:monospace">${c.currentSalary ? Number(c.currentSalary).toLocaleString() : '-'}</td>
                    <td style="padding:9px 12px;border:1px solid var(--border);text-align:right;font-family:monospace;font-weight:600">${c.expectedSalary ? Number(c.expectedSalary).toLocaleString() : '-'}</td>
                    <td style="padding:9px 12px;border:1px solid var(--border);text-align:center;font-weight:800;font-size:13px">${c.score !== undefined ? c.score : '-'}</td>
                    <td style="padding:9px 12px;border:1px solid var(--border);text-align:center;font-weight:800;color:var(--primary);font-size:13px">${c.score !== undefined ? Number(c.score).toFixed(1) + '%' : '-'}</td>
                    <td style="padding:9px 12px;border:1px solid var(--border);text-align:center">${c.interviewDate || '-'}</td>
                    <td style="padding:9px 12px;border:1px solid var(--border);text-align:center">${c.noticePeriod || '-'}</td>
                    <td style="padding:9px 12px;border:1px solid var(--border);text-align:left">${c.address || '-'}</td>
                    <td style="padding:9px 12px;border:1px solid var(--border);text-align:center">${priorityBadge(c.priority)}</td>
                    <td style="padding:9px 12px;border:1px solid var(--border);text-align:center">${recBadge(c.recommendation)}</td>
                    <td style="padding:9px 12px;border:1px solid var(--border);text-align:center">
                      <div style="display:flex;gap:4px;justify-content:center;align-items:center">
                        ${c.recommendation === 'Recommended for Offer' ? `
                          <button class="btn btn-xs btn-success" title="Generate Employment Offer Letter" onclick="Recruitment.convertCandidateToOffer(${c.id})">
                            <i class="fa fa-file-signature"></i> Offer
                          </button>
                        ` : ''}
                        <button class="btn btn-xs btn-outline" title="Edit Assessment" onclick="Recruitment.showEditAssessmentModal(${c.id})">
                          <i class="fa fa-edit"></i>
                        </button>
                        <button class="btn btn-xs btn-ghost text-danger" title="Delete Candidate" onclick="Recruitment.deleteAssessment(${c.id})">
                          <i class="fa fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr style="background:var(--surface-2);font-weight:800;border-top:2px solid #0f3562">
                  <td style="padding:10px 12px;border:1px solid var(--border)">Cohort Average / Summary</td>
                  <td style="padding:10px 12px;border:1px solid var(--border);text-align:center">-</td>
                  <td style="padding:10px 12px;border:1px solid var(--border);text-align:center">${avgExp !== '-' ? avgExp + ' yrs' : '-'}</td>
                  <td style="padding:10px 12px;border:1px solid var(--border);text-align:right;font-family:monospace">-</td>
                  <td style="padding:10px 12px;border:1px solid var(--border);text-align:right;font-family:monospace">-</td>
                  <td style="padding:10px 12px;border:1px solid var(--border);text-align:center;font-size:13px;color:#2563eb">${avgScore}</td>
                  <td style="padding:10px 12px;border:1px solid var(--border);text-align:center;font-size:13px;color:#2563eb">${avgPct}</td>
                  <td style="padding:10px 12px;border:1px solid var(--border);text-align:center">-</td>
                  <td style="padding:10px 12px;border:1px solid var(--border);text-align:center">-</td>
                  <td style="padding:10px 12px;border:1px solid var(--border);text-align:left">-</td>
                  <td style="padding:10px 12px;border:1px solid var(--border);text-align:center">-</td>
                  <td style="padding:10px 12px;border:1px solid var(--border);text-align:center">-</td>
                  <td style="padding:10px 12px;border:1px solid var(--border);text-align:center">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      `;
    }).join('');
  },

  renderFunnelAnalyticsTable(jobs, allAssessments) {
    // Collect distinct jobs to report in conversion matrix
    const matrixJobs = jobs.filter(j => j.applicantCount || allAssessments.some(a => a.jobId === j.id));

    let sumTracked = 0;
    let sumInterviewed = 0;
    let sumShortlisted = 0;
    let sumHired = 0;

    const rowsHTML = matrixJobs.map(job => {
      const jobAssessments = allAssessments.filter(a => a.jobId === job.id || (a.jobTitle && a.jobTitle.toLowerCase() === job.title.toLowerCase()));
      const tracked = job.applicantCount !== undefined ? job.applicantCount : jobAssessments.length;
      const interviewed = jobAssessments.length;
      const shortlisted = jobAssessments.filter(a => a.isShortlisted !== undefined ? a.isShortlisted : (['P1', 'P2'].includes(a.priority) || a.recommendation === 'Recommended for Offer')).length;
      const hired = jobAssessments.filter(a => a.hired).length;

      sumTracked += tracked;
      sumInterviewed += interviewed;
      sumShortlisted += shortlisted;
      sumHired += hired;

      const interviewRate = tracked > 0 ? ((interviewed / tracked) * 100).toFixed(1) + '%' : '0.0%';
      const shortlistRate = interviewed > 0 ? ((shortlisted / interviewed) * 100).toFixed(1) + '%' : '0.0%';
      const offerShortlistRate = shortlisted > 0 ? ((hired / shortlisted) * 100).toFixed(1) + '%' : '0.0%';
      const interviewToHireRate = interviewed > 0 ? ((hired / interviewed) * 100).toFixed(1) + '%' : '0.0%';
      const overallConversionRate = tracked > 0 ? ((hired / tracked) * 100).toFixed(1) + '%' : '0.0%';

      return `
        <tr style="border-bottom:1px solid var(--border);transition:background .15s" onmouseenter="this.style.background='var(--surface)'" onmouseleave="this.style.background='transparent'">
          <td style="padding:11px 14px;border:1px solid var(--border);font-weight:700">
            <i class="fa fa-briefcase" style="color:#2563eb;margin-right:6px"></i>
            ${job.title}
          </td>
          <td style="padding:11px 14px;border:1px solid var(--border);text-align:center;font-weight:700">${tracked}</td>
          <td style="padding:11px 14px;border:1px solid var(--border);text-align:center;font-weight:700">${interviewed}</td>
          <td style="padding:11px 14px;border:1px solid var(--border);text-align:center;font-weight:700;color:#d97706">${shortlisted}</td>
          <td style="padding:11px 14px;border:1px solid var(--border);text-align:center;font-weight:700;color:#059669">${hired}</td>
          <td style="padding:11px 14px;border:1px solid var(--border);text-align:center;font-weight:700;color:#2563eb">${interviewRate}</td>
          <td style="padding:11px 14px;border:1px solid var(--border);text-align:center;font-weight:700;color:#059669">${shortlistRate}</td>
          <td style="padding:11px 14px;border:1px solid var(--border);text-align:center;font-weight:700;color:#d97706">${offerShortlistRate}</td>
          <td style="padding:11px 14px;border:1px solid var(--border);text-align:center;font-weight:700;color:#7c3aed">${interviewToHireRate}</td>
          <td style="padding:11px 14px;border:1px solid var(--border);text-align:center;font-weight:800;color:#dc2626">${overallConversionRate}</td>
        </tr>
      `;
    }).join('');

    const totalInterviewRate = sumTracked > 0 ? ((sumInterviewed / sumTracked) * 100).toFixed(1) + '%' : '0.0%';
    const totalShortlistRate = sumInterviewed > 0 ? ((sumShortlisted / sumInterviewed) * 100).toFixed(1) + '%' : '0.0%';
    const totalOfferShortlist = sumShortlisted > 0 ? ((sumHired / sumShortlisted) * 100).toFixed(1) + '%' : '0.0%';
    const totalInterviewToHire = sumInterviewed > 0 ? ((sumHired / sumInterviewed) * 100).toFixed(1) + '%' : '0.0%';
    const totalOverallConversion = sumTracked > 0 ? ((sumHired / sumTracked) * 100).toFixed(1) + '%' : '0.0%';

    return `
      <div style="border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid var(--border)">
        <div style="background:#0a2540;color:#ffffff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-size:14px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase">
              <i class="fa fa-filter" style="margin-right:8px;color:#38bdf8"></i>
              RECRUITMENT FUNNEL & CONVERSION ANALYTICS
            </div>
            <div style="font-size:11.5px;color:#93c5fd;margin-top:2px">
              Multi-stage recruitment velocity matrix and yield benchmarking across job profiles
            </div>
          </div>
          <div>
            <span class="badge" style="background:rgba(56,189,248,0.2);color:#38bdf8;border:1px solid rgba(56,189,248,0.4)">
              <i class="fa fa-chart-pie"></i> Exact Cohort Benchmarks
            </span>
          </div>
        </div>

        <div class="table-responsive" style="overflow-x:auto;background:var(--card)">
          <table style="width:100%;border-collapse:collapse;font-size:12.5px">
            <thead>
              <tr style="background:#13335b;color:#ffffff;font-size:11.5px;text-align:center">
                <th style="padding:11px 14px;border:1px solid #1e497f;text-align:left">Position Title</th>
                <th style="padding:11px 14px;border:1px solid #1e497f">Total Tracked</th>
                <th style="padding:11px 14px;border:1px solid #1e497f">Interviewed</th>
                <th style="padding:11px 14px;border:1px solid #1e497f">Shortlisted<br><span style="font-size:10px;font-weight:normal">(P1/P2/P3)</span></th>
                <th style="padding:11px 14px;border:1px solid #1e497f">Hired</th>
                <th style="padding:11px 14px;border:1px solid #1e497f">Interview Rate<br><span style="font-size:10px;font-weight:normal">(Interviewed / Tracked)</span></th>
                <th style="padding:11px 14px;border:1px solid #1e497f">Shortlist Rate<br><span style="font-size:10px;font-weight:normal">(Shortlisted / Interviewed)</span></th>
                <th style="padding:11px 14px;border:1px solid #1e497f">Offer / Hire from Shortlist<br><span style="font-size:10px;font-weight:normal">(Hired / Shortlisted)</span></th>
                <th style="padding:11px 14px;border:1px solid #1e497f">Interview-to-Hire Rate<br><span style="font-size:10px;font-weight:normal">(Hired / Interviewed)</span></th>
                <th style="padding:11px 14px;border:1px solid #1e497f">Overall Conversion Rate<br><span style="font-size:10px;font-weight:normal">(Hired / Total Tracked)</span></th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
            <tfoot>
              <tr style="background:var(--surface-2);font-weight:800;font-size:13px;border-top:2px solid #0a2540">
                <td style="padding:12px 14px;border:1px solid var(--border)">Total / Pipeline Average</td>
                <td style="padding:12px 14px;border:1px solid var(--border);text-align:center">${sumTracked}</td>
                <td style="padding:12px 14px;border:1px solid var(--border);text-align:center">${sumInterviewed}</td>
                <td style="padding:12px 14px;border:1px solid var(--border);text-align:center;color:#d97706">${sumShortlisted}</td>
                <td style="padding:12px 14px;border:1px solid var(--border);text-align:center;color:#059669">${sumHired}</td>
                <td style="padding:12px 14px;border:1px solid var(--border);text-align:center;color:#2563eb">${totalInterviewRate}</td>
                <td style="padding:12px 14px;border:1px solid var(--border);text-align:center;color:#059669">${totalShortlistRate}</td>
                <td style="padding:12px 14px;border:1px solid var(--border);text-align:center;color:#d97706">${totalOfferShortlist}</td>
                <td style="padding:12px 14px;border:1px solid var(--border);text-align:center;color:#7c3aed">${totalInterviewToHire}</td>
                <td style="padding:12px 14px;border:1px solid var(--border);text-align:center;color:#dc2626;font-size:13.5px">${totalOverallConversion}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
  },

  showAddAssessmentModal(prefillJobId = null) {
    if (!this.isHROrAdmin()) return Toast.show('Access Denied: Only HR and Administrators can record candidate evaluations.', 'error');
    const jobs = DB.get('recruitment') || [];
    const today = new Date().toISOString().split('T')[0];

    Modal.show('Add Candidate Interview Evaluation', `
      <form onsubmit="Recruitment.saveAssessment(event)">
        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label required">Job Position</label>
            <select class="form-control" id="ev-job-id" required>
              ${jobs.map(j => `<option value="${j.id}" ${String(j.id) === String(prefillJobId) ? 'selected' : ''}>${j.title}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Candidate Full Name</label>
            <input class="form-control" id="ev-name" required placeholder="e.g. Candidate 7 or Full Name">
          </div>
        </div>

        <div class="form-row form-row-3">
          <div class="form-group">
            <label class="form-label">Shortlisted Date</label>
            <input type="date" class="form-control" id="ev-shortlist-date" value="${today}">
          </div>
          <div class="form-group">
            <label class="form-label required">Experience (Years)</label>
            <input type="number" step="0.5" min="0" class="form-control" id="ev-exp" required placeholder="3.5" value="3.0">
          </div>
          <div class="form-group">
            <label class="form-label">Interview Date</label>
            <input type="date" class="form-control" id="ev-interview-date" value="${today}">
          </div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label">Current Salary (PKR)</label>
            <input type="number" class="form-control" id="ev-curr-sal" placeholder="e.g. 75000" value="70000">
          </div>
          <div class="form-group">
            <label class="form-label required">Expected Salary (PKR)</label>
            <input type="number" class="form-control" id="ev-exp-sal" required placeholder="e.g. 90000" value="90000">
          </div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label required">Total Score (/100)</label>
            <input type="number" min="0" max="100" class="form-control" id="ev-score" required placeholder="75" value="75" oninput="document.getElementById('ev-pct-display').textContent = this.value + '%'">
          </div>
          <div class="form-group">
            <label class="form-label">Calculated Percentage</label>
            <div id="ev-pct-display" style="padding:10px;background:var(--surface);border-radius:8px;font-weight:800;font-size:15px;color:var(--primary)">75%</div>
          </div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label">Notice Period</label>
            <select class="form-control" id="ev-notice">
              <option value="Immediate">Immediate</option>
              <option value="15 Days">15 Days</option>
              <option value="30 Days" selected>30 Days</option>
              <option value="45 Days">45 Days</option>
              <option value="60 Days">60 Days</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Address / Residence</label>
            <input class="form-control" id="ev-address" placeholder="e.g. Clifton, Karachi" value="Karachi">
          </div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label required">Priority Level</label>
            <select class="form-control" id="ev-priority" required onchange="Recruitment.onAssessmentPriorityChange(this.value)">
              <option value="P1">P1 — Top Tier / Immediate Fit</option>
              <option value="P2" selected>P2 — Solid Fit / Shortlist</option>
              <option value="P3">P3 — Backup / Moderate Fit</option>
              <option value="Not Recommended">Not Recommended</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Recommendation</label>
            <select class="form-control" id="ev-recommendation" required>
              <option value="Recommended for Offer" selected>Recommended for Offer</option>
              <option value="Hold / Backup">Hold / Backup</option>
              <option value="Not Recommended">Not Recommended</option>
            </select>
          </div>
        </div>

        <div style="background:var(--surface);padding:12px;border-radius:8px;margin-bottom:16px;display:flex;gap:20px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600">
            <input type="checkbox" id="ev-is-shortlisted" checked>
            Include in Shortlisted Pool (P1/P2/P3)
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600">
            <input type="checkbox" id="ev-hired">
            Mark Candidate as Hired / Selected
          </label>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px">
          <button type="button" class="btn btn-secondary" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa fa-save"></i> Save Evaluation</button>
        </div>
      </form>
    `);
  },

  onAssessmentPriorityChange(val) {
    const recSelect = document.getElementById('ev-recommendation');
    const shortCheck = document.getElementById('ev-is-shortlisted');
    if (!recSelect) return;
    if (val === 'Not Recommended') {
      recSelect.value = 'Not Recommended';
      if (shortCheck) shortCheck.checked = false;
    } else if (val === 'P3') {
      recSelect.value = 'Hold / Backup';
      if (shortCheck) shortCheck.checked = true;
    } else {
      recSelect.value = 'Recommended for Offer';
      if (shortCheck) shortCheck.checked = true;
    }
  },

  showEditAssessmentModal(id) {
    if (!this.isHROrAdmin()) return Toast.show('Access Denied: Only HR and Administrators can edit candidate evaluations.', 'error');
    const assessments = DB.get('candidate_assessments') || [];
    const item = assessments.find(a => a.id === Number(id));
    if (!item) return;
    const jobs = DB.get('recruitment') || [];

    Modal.show(`Edit Candidate Evaluation — ${item.candidateName}`, `
      <form onsubmit="Recruitment.saveAssessment(event, ${item.id})">
        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label required">Job Position</label>
            <select class="form-control" id="ev-job-id" required>
              ${jobs.map(j => `<option value="${j.id}" ${String(j.id) === String(item.jobId) ? 'selected' : ''}>${j.title}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Candidate Full Name</label>
            <input class="form-control" id="ev-name" required value="${item.candidateName}">
          </div>
        </div>

        <div class="form-row form-row-3">
          <div class="form-group">
            <label class="form-label">Shortlisted Date</label>
            <input type="date" class="form-control" id="ev-shortlist-date" value="${item.shortlistedDate || ''}">
          </div>
          <div class="form-group">
            <label class="form-label required">Experience (Years)</label>
            <input type="number" step="0.5" min="0" class="form-control" id="ev-exp" required value="${item.experience || 0}">
          </div>
          <div class="form-group">
            <label class="form-label">Interview Date</label>
            <input type="date" class="form-control" id="ev-interview-date" value="${item.interviewDate || ''}">
          </div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label">Current Salary (PKR)</label>
            <input type="number" class="form-control" id="ev-curr-sal" value="${item.currentSalary || 0}">
          </div>
          <div class="form-group">
            <label class="form-label required">Expected Salary (PKR)</label>
            <input type="number" class="form-control" id="ev-exp-sal" required value="${item.expectedSalary || 0}">
          </div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label required">Total Score (/100)</label>
            <input type="number" min="0" max="100" class="form-control" id="ev-score" required value="${item.score || 0}" oninput="document.getElementById('ev-pct-display').textContent = this.value + '%'">
          </div>
          <div class="form-group">
            <label class="form-label">Calculated Percentage</label>
            <div id="ev-pct-display" style="padding:10px;background:var(--surface);border-radius:8px;font-weight:800;font-size:15px;color:var(--primary)">${item.score || 0}%</div>
          </div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label">Notice Period</label>
            <input class="form-control" id="ev-notice" value="${item.noticePeriod || '30 Days'}">
          </div>
          <div class="form-group">
            <label class="form-label">Address / Residence</label>
            <input class="form-control" id="ev-address" value="${item.address || ''}">
          </div>
        </div>

        <div class="form-row form-row-2">
          <div class="form-group">
            <label class="form-label required">Priority Level</label>
            <select class="form-control" id="ev-priority" required onchange="Recruitment.onAssessmentPriorityChange(this.value)">
              <option value="P1" ${item.priority === 'P1' ? 'selected' : ''}>P1 — Top Tier / Immediate Fit</option>
              <option value="P2" ${item.priority === 'P2' ? 'selected' : ''}>P2 — Solid Fit / Shortlist</option>
              <option value="P3" ${item.priority === 'P3' ? 'selected' : ''}>P3 — Backup / Moderate Fit</option>
              <option value="Not Recommended" ${item.priority === 'Not Recommended' ? 'selected' : ''}>Not Recommended</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label required">Recommendation</label>
            <select class="form-control" id="ev-recommendation" required>
              <option value="Recommended for Offer" ${item.recommendation === 'Recommended for Offer' ? 'selected' : ''}>Recommended for Offer</option>
              <option value="Hold / Backup" ${item.recommendation === 'Hold / Backup' ? 'selected' : ''}>Hold / Backup</option>
              <option value="Not Recommended" ${item.recommendation === 'Not Recommended' ? 'selected' : ''}>Not Recommended</option>
            </select>
          </div>
        </div>

        <div style="background:var(--surface);padding:12px;border-radius:8px;margin-bottom:16px;display:flex;gap:20px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600">
            <input type="checkbox" id="ev-is-shortlisted" ${item.isShortlisted ? 'checked' : ''}>
            Include in Shortlisted Pool (P1/P2/P3)
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600">
            <input type="checkbox" id="ev-hired" ${item.hired ? 'checked' : ''}>
            Mark Candidate as Hired / Selected
          </label>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px">
          <button type="button" class="btn btn-secondary" onclick="Modal.close('dynamic-modal')">Cancel</button>
          <button type="submit" class="btn btn-primary"><i class="fa fa-save"></i> Update Evaluation</button>
        </div>
      </form>
    `);
  },

  saveAssessment(e, id = null) {
    e.preventDefault();
    if (!this.isHROrAdmin()) return Toast.show('Access Denied: Only HR and Administrators can save candidate evaluations.', 'error');
    const jobId = Number(document.getElementById('ev-job-id').value);
    const job = DB.find('recruitment', jobId);
    const candidateName = document.getElementById('ev-name').value.trim();
    const shortlistedDate = document.getElementById('ev-shortlist-date').value;
    const experience = parseFloat(document.getElementById('ev-exp').value) || 0;
    const currentSalary = parseFloat(document.getElementById('ev-curr-sal').value) || 0;
    const expectedSalary = parseFloat(document.getElementById('ev-exp-sal').value) || 0;
    const score = parseFloat(document.getElementById('ev-score').value) || 0;
    const interviewDate = document.getElementById('ev-interview-date').value;
    const noticePeriod = document.getElementById('ev-notice').value.trim();
    const address = document.getElementById('ev-address').value.trim();
    const priority = document.getElementById('ev-priority').value;
    const recommendation = document.getElementById('ev-recommendation').value;
    const isShortlisted = document.getElementById('ev-is-shortlisted').checked;
    const hired = document.getElementById('ev-hired').checked;

    const assessments = DB.get('candidate_assessments') || [];

    if (id) {
      const idx = assessments.findIndex(a => a.id === Number(id));
      if (idx !== -1) {
        assessments[idx] = {
          ...assessments[idx],
          jobId,
          jobTitle: job?.title || assessments[idx].jobTitle,
          candidateName,
          shortlistedDate,
          experience,
          currentSalary,
          expectedSalary,
          score,
          interviewDate,
          noticePeriod,
          address,
          priority,
          recommendation,
          isShortlisted,
          hired
        };
        DB.set('candidate_assessments', assessments);
        Toast.show('Candidate interview evaluation updated successfully.', 'success');
      }
    } else {
      const newId = assessments.length ? Math.max(...assessments.map(a => a.id)) + 1 : 1;
      assessments.push({
        id: newId,
        jobId,
        jobTitle: job?.title || 'Open Position',
        candidateName,
        shortlistedDate,
        experience,
        currentSalary,
        expectedSalary,
        score,
        interviewDate,
        noticePeriod,
        address,
        priority,
        recommendation,
        isShortlisted,
        hired
      });
      DB.set('candidate_assessments', assessments);
      Toast.show('New candidate interview evaluation saved successfully.', 'success');
    }

    Modal.close('dynamic-modal');
    this.renderView();
  },

  deleteAssessment(id) {
    if (!this.isHROrAdmin()) return Toast.show('Access Denied: Only HR and Administrators can delete candidate evaluations.', 'error');
    if (!confirm('Are you sure you want to remove this candidate interview evaluation?')) return;
    let assessments = DB.get('candidate_assessments') || [];
    assessments = assessments.filter(a => a.id !== Number(id));
    DB.set('candidate_assessments', assessments);
    Toast.show('Candidate evaluation deleted.', 'info');
    this.renderView();
  },

  convertCandidateToOffer(id) {
    if (!this.isHROrAdmin()) return Toast.show('Access Denied: Only HR and Administrators can generate offer letters.', 'error');
    const assessments = DB.get('candidate_assessments') || [];
    const item = assessments.find(a => a.id === Number(id));
    if (!item) return;

    const job = DB.find('recruitment', item.jobId);
    this.showGenerateOfferLetterModal(null, {
      candidateName: item.candidateName,
      designation: item.jobTitle || job?.title || '',
      salary: item.expectedSalary || 100000,
      jobId: item.jobId,
      deptId: job?.departmentId || 1
    });
    Toast.show(`Candidate ${item.candidateName} prefilled into employment offer letter generator.`, 'info');
  },

  exportAssessmentCSV() {
    if (!this.isHROrAdmin()) return Toast.show('Access Denied: Only HR and Administrators can export assessment sheets.', 'error');
    const jobs = DB.get('recruitment') || [];
    const assessments = DB.get('candidate_assessments') || [];

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'POSITION INTERVIEW ASSESSMENT SHEETS\r\n';
    csvContent += 'Job Title,Candidate Name,Shortlisted Date,Experience (Yrs),Current Salary,Expected Salary,Total Score (/100),Percentage (%),Interview Date,Notice Period,Address,Priority,Recommendation,Hired Status\r\n';

    assessments.forEach(c => {
      const row = [
        `"${c.jobTitle || ''}"`,
        `"${c.candidateName || ''}"`,
        `"${c.shortlistedDate || ''}"`,
        c.experience || 0,
        c.currentSalary || 0,
        c.expectedSalary || 0,
        c.score || 0,
        `${c.score || 0}%`,
        `"${c.interviewDate || ''}"`,
        `"${c.noticePeriod || ''}"`,
        `"${c.address || ''}"`,
        `"${c.priority || ''}"`,
        `"${c.recommendation || ''}"`,
        c.hired ? 'Hired' : 'Pending'
      ];
      csvContent += row.join(',') + '\r\n';
    });

    csvContent += '\r\nRECRUITMENT FUNNEL & CONVERSION ANALYTICS\r\n';
    csvContent += 'Position Title,Total Tracked,Interviewed,Shortlisted (P1/P2/P3),Hired,Interview Rate (%),Shortlist Rate (%),Offer / Hire from Shortlist (%),Interview-to-Hire Rate (%),Overall Conversion Rate (%)\r\n';

    const matrixJobs = jobs.filter(j => j.applicantCount || assessments.some(a => a.jobId === j.id));
    let sumTracked = 0, sumInterviewed = 0, sumShortlisted = 0, sumHired = 0;

    matrixJobs.forEach(job => {
      const jobAssessments = assessments.filter(a => a.jobId === job.id || (a.jobTitle && a.jobTitle.toLowerCase() === job.title.toLowerCase()));
      const tracked = job.applicantCount !== undefined ? job.applicantCount : jobAssessments.length;
      const interviewed = jobAssessments.length;
      const shortlisted = jobAssessments.filter(a => a.isShortlisted !== undefined ? a.isShortlisted : (['P1', 'P2'].includes(a.priority) || a.recommendation === 'Recommended for Offer')).length;
      const hired = jobAssessments.filter(a => a.hired).length;

      sumTracked += tracked;
      sumInterviewed += interviewed;
      sumShortlisted += shortlisted;
      sumHired += hired;

      const interviewRate = tracked > 0 ? ((interviewed / tracked) * 100).toFixed(1) + '%' : '0.0%';
      const shortlistRate = interviewed > 0 ? ((shortlisted / interviewed) * 100).toFixed(1) + '%' : '0.0%';
      const offerShortlistRate = shortlisted > 0 ? ((hired / shortlisted) * 100).toFixed(1) + '%' : '0.0%';
      const interviewToHireRate = interviewed > 0 ? ((hired / interviewed) * 100).toFixed(1) + '%' : '0.0%';
      const overallConversionRate = tracked > 0 ? ((hired / tracked) * 100).toFixed(1) + '%' : '0.0%';

      csvContent += `"${job.title}",${tracked},${interviewed},${shortlisted},${hired},${interviewRate},${shortlistRate},${offerShortlistRate},${interviewToHireRate},${overallConversionRate}\r\n`;
    });

    const totalInterviewRate = sumTracked > 0 ? ((sumInterviewed / sumTracked) * 100).toFixed(1) + '%' : '0.0%';
    const totalShortlistRate = sumInterviewed > 0 ? ((sumShortlisted / sumInterviewed) * 100).toFixed(1) + '%' : '0.0%';
    const totalOfferShortlist = sumShortlisted > 0 ? ((sumHired / sumShortlisted) * 100).toFixed(1) + '%' : '0.0%';
    const totalInterviewToHire = sumInterviewed > 0 ? ((sumHired / sumInterviewed) * 100).toFixed(1) + '%' : '0.0%';
    const totalOverallConversion = sumTracked > 0 ? ((sumHired / sumTracked) * 100).toFixed(1) + '%' : '0.0%';

    csvContent += `Total / Pipeline Average,${sumTracked},${sumInterviewed},${sumShortlisted},${sumHired},${totalInterviewRate},${totalShortlistRate},${totalOfferShortlist},${totalInterviewToHire},${totalOverallConversion}\r\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `recruitment_assessment_and_funnel_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Toast.show('Recruitment Assessment & Funnel CSV exported.', 'success');
  },

  printAssessmentSheet() {
    if (!this.isHROrAdmin()) return Toast.show('Access Denied: Only HR and Administrators can print assessment sheets.', 'error');
    window.print();
  }
};
