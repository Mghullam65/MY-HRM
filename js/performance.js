// ============================================================
// HRM SYSTEM — Performance Module
// ============================================================

const Performance = {
  currentView: 'reviews',

  getScopedEmployees() {
    let emps = DB.get('employees').filter(e => e.status === 'active');
    if (Auth.role === 'dept_manager') {
      const myId = Auth.employee?.id;
      emps = emps.filter(e => e.managerId === myId || e.reportingTo === myId);
    }
    return emps;
  },

  getScopedReviews() {
    const allReviews = DB.get('performance_reviews') || [];
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
                  <span class="chip" style="margin-bottom:6px">${r.type.toUpperCase()} ${r.quarter||''} ${r.year}</span><br>
                  ${Utils.statusBadge(r.status)}
                </div>
              </div>

              ${r.status === 'completed' ? `
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px">
                  ${[
                    { label:'KPI Score', val:r.kpiScore+'%', color:'var(--primary)' },
                    { label:'KRA Score', val:r.kraScore+'%', color:'var(--accent)' },
                    { label:'Overall Rating', val:'★'.repeat(r.overallRating)+'☆'.repeat(5-r.overallRating), color:'var(--warning)' },
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
};

// ============================================================
// HRM SYSTEM — Recruitment Module
// ============================================================

const Recruitment = {
  currentView: 'jobs',
  offerFilter: { query: '', type: 'all', status: 'all' },

  isHROrAdmin() {
    return Auth.role === 'superadmin' || Auth.role === 'hr_manager';
  },

  render() {
    const content = document.getElementById('page-content');
    const jobs = DB.get('recruitment') || [];
    const apps = DB.get('applications') || [];
    const offers = DB.get('offer_letters') || [];
    const reqs = DB.get('job_requisitions') || [];
    const pendingReqs = reqs.filter(r => r.status === 'pending_review').length;
    const isHR = this.isHROrAdmin();

    content.innerHTML = `
      <div class="animate-fade-in">
        <!-- Recruitment Top KPI Banner -->
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">
          ${[
            { label:'Open Positions',  val:jobs.filter(j=>j.status==='open').length, icon:'fa-briefcase', color:'var(--success)', action:"Recruitment.switchView('jobs')" },
            { label:'Headcount Reqs',  val:reqs.length, icon:'fa-file-invoice-dollar', color:'var(--info)', action:"Recruitment.switchView('requisitions')" },
            { label:'Total Applicants',val:apps.length, icon:'fa-users', color:'var(--primary)', action:"Recruitment.switchView('pipeline')" },
            { label:'In Interview',    val:apps.filter(a=>a.stage==='interview').length, icon:'fa-comments', color:'var(--warning)', action:"Recruitment.switchView('pipeline')" },
            { label:'Offer Letters',   val:offers.length, icon:'fa-file-signature', color:'var(--accent)', action: isHR ? "Recruitment.switchView('offers')" : '' },
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

        <!-- Recruitment View Tabs -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:10px;width:fit-content">
            <button class="tab-toggle-btn ${this.currentView==='jobs'?'active':''}" onclick="Recruitment.switchView('jobs')">
              <i class="fa fa-briefcase" style="margin-right:6px"></i>Job Postings
            </button>
            <button class="tab-toggle-btn ${this.currentView==='requisitions'?'active':''}" onclick="Recruitment.switchView('requisitions')" style="position:relative">
              <i class="fa fa-file-invoice-dollar" style="margin-right:6px"></i>Requisitions & Headcount
              ${pendingReqs ? `<span class="badge badge-warning" style="margin-left:6px;font-size:10px;padding:2px 6px">${pendingReqs}</span>` : ''}
            </button>
            <button class="tab-toggle-btn ${this.currentView==='pipeline'?'active':''}" onclick="Recruitment.switchView('pipeline')">
              <i class="fa fa-list-check" style="margin-right:6px"></i>Applicant Pipeline
            </button>
            ${isHR ? `
              <button class="tab-toggle-btn ${this.currentView==='offers'?'active':''}" onclick="Recruitment.switchView('offers')" style="position:relative">
                <i class="fa fa-file-signature" style="margin-right:6px"></i>Offer Letters
                <span class="badge badge-primary" style="margin-left:6px;font-size:10px;padding:2px 6px">${offers.length}</span>
              </button>
            ` : ''}
          </div>

          ${this.currentView === 'requisitions' ? `
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary btn-sm" onclick="Recruitment.showAddRequisitionModal()">
                <i class="fa fa-plus"></i> Submit Headcount Requisition
              </button>
            </div>
          ` : isHR && this.currentView === 'offers' ? `
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary btn-sm" onclick="Recruitment.showGenerateOfferLetterModal()">
                <i class="fa fa-plus"></i> Create Offer Letter
              </button>
            </div>
          ` : ''}
        </div>
        <style>
          .tab-toggle-btn { padding:8px 16px;border:none;background:transparent;color:var(--text-3);font-size:12.5px;font-weight:600;border-radius:7px;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center; }
          .tab-toggle-btn.active { background:var(--primary);color:white;box-shadow:0 2px 8px var(--primary-glow); }
          .tab-toggle-btn:hover:not(.active) { background:var(--surface-2);color:var(--text); }
        </style>

        <div id="rec-content"></div>
      </div>
    `;
    this.renderView();
  },

  switchView(view) {
    this.currentView = view;
    document.querySelectorAll('.tab-toggle-btn').forEach(b => {
      const isMatch = b.getAttribute('onclick')?.includes(`'${view}'`);
      b.classList.toggle('active', !!isMatch);
    });
    this.renderView();
  },

  renderView() {
    const container = document.getElementById('rec-content');
    if (!container) return;
    if (this.currentView === 'jobs') this.renderJobs(container);
    else if (this.currentView === 'requisitions') this.renderRequisitions(container);
    else if (this.currentView === 'pipeline') this.renderPipeline(container);
    else if (this.currentView === 'offers') this.renderOfferLetters(container);
  },

  renderJobs(container) {
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
              <div style="display:flex;align-items:center;justify-content:space-between">
                <span style="font-size:13px;color:var(--primary);font-weight:600"><i class="fa fa-users" style="margin-right:6px"></i>${j.applicantCount} applicants</span>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-ghost btn-sm" onclick="Recruitment.toggleJobStatus(${j.id})">
                    <i class="fa ${j.status==='open'?'fa-lock':'fa-lock-open'}"></i> ${j.status==='open'?'Close':'Reopen'}
                  </button>
                  <button class="btn btn-ghost btn-sm" onclick="Recruitment.viewJob(${j.id})"><i class="fa fa-eye"></i> View</button>
                  <button class="btn btn-primary btn-sm" onclick="Recruitment.switchView('pipeline')"><i class="fa fa-list-check"></i> Pipeline</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderPipeline(container) {
    const apps = DB.get('applications') || [];
    const isHR = this.isHROrAdmin();
    const stages = [
      { id:'applied',     label:'Applied',      color:'#6b7280' },
      { id:'shortlisted', label:'Shortlisted',   color:'#6366f1' },
      { id:'interview',   label:'Interview',     color:'#f59e0b' },
      { id:'offer',       label:'Offer Extended',color:'#10b981' },
      { id:'hired',       label:'Hired',         color:'#14b8a6' },
      { id:'rejected',    label:'Rejected',      color:'#ef4444' },
    ];

    container.innerHTML = `
      <div class="kanban">
        ${stages.map(stage => {
          const stageApps = apps.filter(a => a.stage === stage.id);
          return `
            <div class="kanban-col">
              <div class="kanban-col-header">
                <span><span style="width:10px;height:10px;border-radius:50%;background:${stage.color};display:inline-block;margin-right:8px"></span>${stage.label}</span>
                <span class="badge" style="background:${stage.color}22;color:${stage.color}">${stageApps.length}</span>
              </div>
              <div class="kanban-items">
                ${stageApps.length === 0 ? '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:20px">No applicants</div>' :
                stageApps.map(app => {
                  const job = DB.find('recruitment', app.jobId);
                  const hasOffer = (DB.get('offer_letters')||[]).some(o => o.applicationId === app.id);
                  const appScorecards = (DB.get('interview_scorecards')||[]).filter(s => s.applicantId === app.id);
                  const latestScorecard = appScorecards[0];
                  return `
                    <div class="kanban-card" onclick="Recruitment.viewApplicant(${app.id})">
                      <div style="display:flex;align-items:center;justify-content:space-between">
                        <div class="kc-name">${app.name}</div>
                        ${hasOffer ? '<span class="badge badge-success" style="font-size:9.5px"><i class="fa fa-file-check"></i> Offer Ready</span>' : ''}
                      </div>
                      <div class="kc-meta">${job?.title||'—'} • Applied: ${Utils.formatDate(app.appliedOn)}</div>
                      ${app.cnic ? `<div style="font-size:10.5px;color:var(--text-3);margin-top:2px"><i class="fa fa-id-card" style="margin-right:4px"></i>${app.cnic}</div>` : ''}

                      ${latestScorecard ? `
                        <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-2);padding:4px 8px;border-radius:6px;margin-top:6px">
                          <span style="font-size:11px;font-weight:700;color:var(--warning)"><i class="fa fa-star"></i> ${latestScorecard.overallScore}/5.0</span>
                          <span class="badge ${latestScorecard.recommendation.includes('Hire') ? 'badge-success' : 'badge-secondary'}" style="font-size:9.5px;padding:2px 5px">${latestScorecard.recommendation}</span>
                        </div>
                      ` : ''}

                      ${app.score ? `<div class="progress" style="margin-top:8px"><div class="progress-bar" style="width:${app.score}%;background:${stage.color}"></div></div><div style="font-size:10px;margin-top:3px;color:var(--text-muted)">Composite Score: ${app.score}%</div>` : ''}
                      <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;margin-top:10px;flex-wrap:wrap">
                        <div style="display:flex;gap:4px">
                          ${stage.id !== 'hired' && stage.id !== 'rejected' ? `
                            <button class="btn btn-success btn-xs" onclick="event.stopPropagation();Recruitment.moveStage(${app.id},'${stages[stages.findIndex(s=>s.id===stage.id)+1]?.id}')" title="Advance Stage"><i class="fa fa-arrow-right"></i></button>
                            <button class="btn btn-danger btn-xs" onclick="event.stopPropagation();Recruitment.moveStage(${app.id},'rejected')" title="Reject"><i class="fa fa-times"></i></button>
                          ` : ''}
                        </div>
                        <div style="display:flex;gap:4px">
                          <button class="btn btn-warning btn-xs" onclick="event.stopPropagation();Recruitment.showScorecardModal(${app.id})" title="Interview Evaluation Scorecard">
                            <i class="fa fa-star-half-stroke"></i> ${latestScorecard ? 'Scorecard (' + latestScorecard.overallScore + ')' : 'Scorecard'}
                          </button>
                          ${isHR && (stage.id === 'interview' || stage.id === 'offer') ? `
                            <button class="btn btn-primary btn-xs" onclick="event.stopPropagation();Recruitment.showGenerateOfferLetterModal(${app.id})" title="Generate Formal Offer Letter">
                              <i class="fa fa-file-signature"></i> Offer
                            </button>
                          ` : ''}
                          ${isHR && (stage.id === 'offer' || stage.id === 'hired') ? `
                            <button class="btn btn-success btn-xs" onclick="event.stopPropagation();Recruitment.onboardCandidateDirectly(${app.id})" title="Onboard as Employee">
                              <i class="fa fa-user-plus"></i> Onboard
                            </button>
                          ` : ''}
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
    `;
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

  showGenerateOfferLetterModal(appId = null) {
    if (!this.isHROrAdmin()) {
      Toast.show('Permission denied: Only HR Manager and Super Admin can generate offer letters.', 'error');
      return;
    }

    const app = appId ? DB.find('applications', Number(appId)) : null;
    const job = app ? DB.find('recruitment', app.jobId) : null;
    const depts = DB.get('departments') || [];
    const emps = (DB.get('employees') || []).filter(e => e.status === 'active');
    const apps = (DB.get('applications') || []).filter(a => a.stage !== 'hired' && a.stage !== 'rejected');

    // Candidate default values
    const candidateName = app?.name || '';
    const email = app?.email || '';
    const phone = app?.phone || '';
    const cnic = app?.cnic || '';
    const designation = job?.title || '';
    const deptId = job?.departmentId || 1;

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
          <input class="form-control" id="of-salary" type="number" placeholder="120000" value="120000">
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
    const offer = DB.find('offer_letters', Number(offerId));
    if (!offer) { Toast.show('Offer letter record not found', 'error'); return; }

    const dept = DB.find('departments', offer.departmentId);
    const mgr = DB.find('employees', offer.reportingManagerId);
    const validity = this.getOfferValidity(offer);
    const isHR = this.isHROrAdmin();

    Modal.show({
      size: 'modal-lg',
      title: `<div style="display:flex;align-items:center;gap:10px">
        <i class="fa fa-file-signature" style="color:var(--primary)"></i>
        <span>Employment Offer Letter — ${offer.candidateName}</span>
        <span class="badge ${validity.badgeClass}" style="font-size:11px"><i class="fa ${validity.icon}"></i> ${validity.label}</span>
      </div>`,
      body: `
        <div class="offer-doc-container">
          <!-- Corporate Letterhead -->
          <div class="offer-letterhead">
            <div class="offer-logo-badge">
              <div class="offer-logo-icon">HP</div>
              <div>
                <div class="offer-company-title">HRM PRO ENTERPRISE SOLUTIONS (PVT) LTD</div>
                <div class="offer-company-sub">Executive Tech Park, Constitution Avenue, Islamabad • NTN: 9482710-3</div>
                <div class="offer-company-sub">Web: www.hrmpro.pk • Phone: +92 (51) 8899-200 • Email: careers@hrmpro.com</div>
              </div>
            </div>
            <div class="offer-ref-box">
              <div>Ref: <span class="offer-ref-no">${offer.refNo}</span></div>
              <div style="margin-top:3px">Date of Issue: <strong>${Utils.formatDate(offer.issueDate)}</strong></div>
              <div style="margin-top:3px;color:#facc15;font-weight:700">Strict 2-Day Acceptance Notice</div>
            </div>
          </div>

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
                  <span class="offer-status-pill" style="background:#e0e7ff;color:#3730a3">${offer.employmentType.toUpperCase()} APPOINTMENT</span>
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
                <div class="offer-term-value">${offer.employmentType.toUpperCase()} ${offer.duration ? `— ${offer.duration}` : ''}</div>
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
                <div style="height:36px"></div>
                <div class="offer-sig-line">
                  <strong>Sara Malik</strong><br>
                  Head of Human Resources & Talent Acquisition<br>
                  HRM Pro Enterprise Solutions (Pvt) Ltd
                </div>
              </div>
              <div>
                <div style="height:36px"></div>
                <div class="offer-sig-line">
                  <strong>Ahmed Khan</strong><br>
                  Chief Executive Officer (CEO)<br>
                  HRM Pro Enterprise Solutions (Pvt) Ltd
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
    const offer = DB.find('offer_letters', Number(offerId));
    if (!offer) return;
    const dept = DB.find('departments', offer.departmentId);
    const mgr = DB.find('employees', offer.reportingManagerId);

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Offer Letter — ${offer.candidateName} (${offer.refNo})</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #1e293b;
            background: #fff;
            padding: 8px;
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
        <div class="letterhead">
          <div>
            <div class="comp-title">HRM PRO ENTERPRISE SOLUTIONS (PVT) LTD</div>
            <div class="comp-sub">Plot 42, Executive Tech Park, Constitution Avenue, Islamabad, Pakistan</div>
            <div class="comp-sub">Phone: +92 (51) 8899-200 • Email: hr@hrmpro.com • NTN: 9482710-3</div>
          </div>
          <div class="ref-table">
            <div>Reference: <span class="ref-no">${offer.refNo}</span></div>
            <div>Date of Issue: <strong>${Utils.formatDate(offer.issueDate)}</strong></div>
            <div style="margin-top:3px;color:#b45309;font-weight:700">Accept/Reject Window: 2 Days</div>
          </div>
        </div>

        <div class="recipient-block">
          <div>
            <div><strong>To:</strong> ${offer.candidateName}</div>
            <div><strong>CNIC:</strong> ${offer.cnic || '—'}</div>
            <div><strong>Contact:</strong> ${offer.email || '—'} • ${offer.phone || '—'}</div>
          </div>
          <div style="text-align:right">
            <div><strong>Designation:</strong> ${offer.designation}</div>
            <div><strong>Department:</strong> ${dept?.name || '—'}</div>
            <div><strong>Type:</strong> ${offer.employmentType.toUpperCase()}</div>
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
            <div class="term-val">${offer.employmentType.toUpperCase()} ${offer.duration ? `(${offer.duration})` : ''}</div>
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
            <div style="height:30px"></div>
            <div class="sig-line">
              <strong>Sara Malik</strong><br>
              Head of Human Resources<br>
              HRM Pro Enterprise Solutions
            </div>
          </div>
          <div>
            <div style="height:30px"></div>
            <div class="sig-line">
              <strong>Ahmed Khan</strong><br>
              Chief Executive Officer (CEO)<br>
              HRM Pro Enterprise Solutions
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

    DB.log('UPDATE', 'Recruitment', `Offer #${offer.refNo} status updated to: ${newStatus.toUpperCase()}`, Auth.user?.id);
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
    if (!newStage) return;
    DB.update('applications', appId, { stage: newStage });
    Toast.show(`Applicant moved to ${newStage}!`, 'success');
    this.renderView();
  },

  viewApplicant(appId) {
    const app = DB.find('applications', appId);
    const job = DB.find('recruitment', app.jobId);
    const isHR = this.isHROrAdmin();
    const existingOffer = (DB.get('offer_letters') || []).find(o => o.applicationId === app.id);

    Modal.show(`Applicant — ${app.name}`, `
      ${[
        ['Name', app.name],
        ['CNIC', app.cnic || '—'],
        ['Email', app.email],
        ['Phone', app.phone],
        ['Applied For', job?.title],
        ['Applied On', Utils.formatDate(app.appliedOn)],
        ['Stage', Utils.statusBadge(app.stage)],
        ['Offer Letter', existingOffer ? `<span class="badge badge-success"><i class="fa fa-file-check"></i> ${existingOffer.refNo} (${existingOffer.status.toUpperCase()})</span>` : '<span class="text-muted text-xs">Not issued yet</span>']
      ].map(([l,v])=>`<div style="display:flex;padding:8px 0;border-bottom:1px solid var(--border)"><div style="width:140px;font-size:12px;color:var(--text-3);font-weight:500">${l}</div><div style="font-size:13px">${v}</div></div>`).join('')}

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

  saveApplicantEvaluation(appId) {
    const interviewDate = document.getElementById('app-int-date').value;
    const score = parseInt(document.getElementById('app-score').value) || 0;
    const notes = document.getElementById('app-notes').value.trim();
    DB.update('applications', appId, { interviewDate, score, notes });
    DB.log('UPDATE', 'Recruitment', `Updated evaluation for applicant #${appId}`, Auth.user?.id);
    Toast.show('Applicant evaluation saved!', 'success');
    this.renderView();
  },

  convertToEmployee(appId) {
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
    const job = DB.find('recruitment', jobId);
    Toast.show(`${job.title} — ${job.applicantCount} applicants`, 'info');
  },

  // ═══════════════════════════════════════════════
  // HEADCOUNT REQUISITIONS & BUDGETING
  // ═══════════════════════════════════════════════

  renderRequisitions(container) {
    const reqs = DB.get('job_requisitions') || [];
    const depts = DB.get('departments') || [];
    const isHR = this.isHROrAdmin();

    const totalHeadcount = reqs.reduce((sum, r) => sum + (r.headcount || 1), 0);
    const approvedHeadcount = reqs.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.headcount || 1), 0);
    const pendingCount = reqs.filter(r => r.status === 'pending_review').length;
    const totalMaxBudget = reqs.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.maxSalary || 0) * (r.headcount || 1), 0);

    container.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
          <div>
            <div style="font-size:16px;font-weight:700">Headcount Requisitions & Budget Approvals</div>
            <div style="font-size:12px;color:var(--text-3);margin-top:3px">Formal departmental position opening requests with budget salary ceiling and executive authorization</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="Recruitment.showAddRequisitionModal()">
            <i class="fa fa-plus"></i> New Requisition
          </button>
        </div>

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
                <th>Requisition Ref</th>
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
                <tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-3)">No requisitions submitted. Click "New Requisition" to request headcount.</td></tr>
              ` : reqs.map(r => {
                const dept = depts.find(d => d.id === r.departmentId);
                const requester = Utils.getEmpName(r.requestedBy);
                const priorityClass = r.priority === 'Urgent' ? 'badge-danger' : r.priority === 'High' ? 'badge-warning' : 'badge-secondary';
                const statusBadge = r.status === 'approved' ? '<span class="badge badge-success"><i class="fa fa-check"></i> Approved</span>' :
                                    r.status === 'rejected' ? '<span class="badge badge-danger"><i class="fa fa-times"></i> Rejected</span>' :
                                    '<span class="badge badge-warning"><i class="fa fa-clock"></i> Pending Review</span>';

                return `
                  <tr>
                    <td>
                      <div style="font-weight:700;font-family:monospace;font-size:12px;color:var(--primary)">${r.reqNumber}</div>
                      <div style="font-size:10.5px;color:var(--text-3)">${Utils.formatDate(r.createdAt)}</div>
                    </td>
                    <td>
                      <div style="font-weight:700;font-size:13px;color:var(--text)">${r.title}</div>
                      <div style="font-size:11px;color:var(--text-3)">${dept?.name || 'General'} • ${r.employmentType || 'Permanent'}</div>
                    </td>
                    <td>
                      <div style="font-size:12px;font-weight:600">${requester}</div>
                      <div style="font-size:10.5px;color:var(--text-3)">${r.reason || 'Expansion'}</div>
                    </td>
                    <td style="font-weight:700;font-size:13px;text-align:center">${r.headcount}</td>
                    <td style="font-family:monospace;font-size:12px">
                      PKR ${(r.minSalary||0).toLocaleString()} – ${(r.maxSalary||0).toLocaleString()}
                    </td>
                    <td><span class="badge ${priorityClass}" style="font-size:10.5px">${r.priority}</span></td>
                    <td>${statusBadge}</td>
                    <td style="text-align:right;white-space:nowrap">
                      ${r.status === 'approved' && !r.jobPostId ? `
                        <button class="btn btn-primary btn-xs" onclick="Recruitment.convertRequisitionToJob(${r.id})" title="Post Opening to ATS Pipeline">
                          <i class="fa fa-briefcase"></i> Post Job
                        </button>
                      ` : r.status === 'approved' && r.jobPostId ? `
                        <span class="badge badge-info" style="font-size:10px"><i class="fa fa-check-double"></i> Posted</span>
                      ` : ''}

                      ${isHR && r.status === 'pending_review' ? `
                        <button class="btn btn-success btn-xs" onclick="Recruitment.approveRequisition(${r.id})" title="Approve Headcount">
                          <i class="fa fa-check"></i>
                        </button>
                        <button class="btn btn-danger btn-xs" onclick="Recruitment.rejectRequisition(${r.id})" title="Reject Requisition">
                          <i class="fa fa-times"></i>
                        </button>
                      ` : ''}

                      <button class="btn btn-ghost btn-xs" onclick="Recruitment.viewRequisition(${r.id})" title="Inspect Requisition Details">
                        <i class="fa fa-eye"></i>
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

  showAddRequisitionModal() {
    const depts = DB.get('departments') || [];
    Modal.show('Submit Headcount & Budget Requisition', `
      <div class="form-group">
        <label class="form-label">Position Title</label>
        <input class="form-control" id="rq-title" placeholder="e.g. Staff Site Reliability Engineer">
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Department</label>
          <select class="form-control" id="rq-dept">
            ${depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
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
            <option value="Permanent">Permanent Salaried</option>
            <option value="Contract">Fixed Term Contract</option>
            <option value="Internship">Graduate Trainee / Internship</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Hiring Priority</label>
          <select class="form-control" id="rq-priority">
            <option value="Urgent">Urgent (Immediate Project Need)</option>
            <option value="High" selected>High (Next 30 Days)</option>
            <option value="Medium">Medium (Q3 Growth)</option>
            <option value="Standard">Standard Replacement</option>
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
          <input class="form-control" id="rq-target" type="date" value="2026-10-15">
        </div>
        <div class="form-group">
          <label class="form-label">Requisition Justification</label>
          <select class="form-control" id="rq-reason">
            <option value="Expansion">Team Expansion / Revenue Scaling</option>
            <option value="Replacement">Replacement for Separated Personnel</option>
            <option value="New Technology">New Technology Stack Specialization</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Operational Notes & Justification</label>
        <textarea class="form-control" id="rq-notes" rows="3" placeholder="Explain project business justification, reporting lines, and expected deliverables..."></textarea>
      </div>
    `, {
      footer: `
        <button class="btn btn-ghost" onclick="Modal.close('dynamic-modal')">Cancel</button>
        <button class="btn btn-primary" onclick="Recruitment.saveRequisition()"><i class="fa fa-save"></i> Submit for Approval</button>
      `
    });
  },

  saveRequisition() {
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

    if (!title) {
      Toast.show('Position title is required', 'error');
      return;
    }

    const reqs = DB.get('job_requisitions') || [];
    const nextNum = reqs.length + 1;
    const reqNumber = `REQ-2026-${String(nextNum).padStart(3, '0')}`;

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
      minSalary: minSal,
      maxSalary: maxSal,
      targetDate,
      status: this.isHROrAdmin() ? 'approved' : 'pending_review',
      approvedBy: this.isHROrAdmin() ? (Auth.user?.id || 1) : null,
      approvedAt: this.isHROrAdmin() ? new Date().toISOString().split('T')[0] : null,
      notes,
      jobPostId: null,
      createdAt: new Date().toISOString().split('T')[0]
    };

    reqs.push(newReq);
    DB.set('job_requisitions', reqs);
    DB.log('CREATE', 'Recruitment', `Submitted headcount requisition ${reqNumber} for ${title} (${count} opening(s))`, Auth.user?.id, 'INFO');
    Toast.show('Headcount requisition submitted successfully!', 'success');
    Modal.close('dynamic-modal');
    this.render();
  },

  approveRequisition(id) {
    const reqs = DB.get('job_requisitions') || [];
    const idx = reqs.findIndex(r => r.id === id);
    if (idx === -1) return;

    reqs[idx].status = 'approved';
    reqs[idx].approvedBy = Auth.user?.id || 1;
    reqs[idx].approvedAt = new Date().toISOString().split('T')[0];
    DB.set('job_requisitions', reqs);
    DB.log('APPROVE', 'Recruitment', `Approved headcount requisition ${reqs[idx].reqNumber} for ${reqs[idx].title}`, Auth.user?.id, 'WARNING');
    Toast.show(`Requisition ${reqs[idx].reqNumber} approved!`, 'success');
    this.render();
  },

  rejectRequisition(id) {
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

    Modal.show(`Requisition Inspection: ${r.reqNumber}`, `
      <div style="background:var(--surface-2);padding:14px;border-radius:10px;margin-bottom:14px;font-size:12.5px;line-height:1.6">
        <div><strong>Position Title:</strong> ${r.title}</div>
        <div><strong>Department:</strong> ${dept?.name || 'General'}</div>
        <div><strong>Requested Headcount:</strong> ${r.headcount} (${r.employmentType || 'Permanent'})</div>
        <div><strong>Target Compensation:</strong> PKR ${(r.minSalary||0).toLocaleString()} – ${(r.maxSalary||0).toLocaleString()} / month</div>
        <div><strong>Target Onboarding Date:</strong> ${r.targetDate || 'Flexible'}</div>
        <div><strong>Reason & Justification:</strong> ${r.reason}</div>
        <div><strong>Status:</strong> ${r.status.toUpperCase()}</div>
      </div>
      <div style="font-size:12px;color:var(--text);margin-bottom:6px"><strong>Justification Notes:</strong></div>
      <div style="background:var(--card);border:1px solid var(--border);padding:12px;border-radius:8px;font-size:12px;color:var(--text-2);line-height:1.5">
        ${r.notes || 'No detailed notes recorded.'}
      </div>
    `, {
      footer: `<button class="btn btn-primary" onclick="Modal.close('dynamic-modal')">Close Inspection</button>`
    });
  },

  // ═══════════════════════════════════════════════
  // CANDIDATE INTERVIEW SCORECARDS & RUBRIC EVALUATOR
  // ═══════════════════════════════════════════════

  showScorecardModal(applicantId) {
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
};
