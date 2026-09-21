const fs = require('fs');

let code = fs.readFileSync('js/recruitment.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Stage 3 Sub-Nav in renderInterviews
const interviewAnchor = `    container.innerHTML = \`
      <div class="animate-fade-in">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">`;

const interviewSubNav = `    container.innerHTML = \`
      <div class="animate-fade-in">
        <!-- Stage 3 Sub-Navigation -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
            <button class="btn btn-sm \${this.currentView==='pipeline'?'btn-primary':'btn-ghost'}" onclick="Recruitment.switchView('pipeline')">
              <i class="fa fa-list-check"></i> Candidate Pipeline
            </button>
            <button class="btn btn-sm \${this.currentView==='interviews'?'btn-primary':'btn-ghost'}" onclick="Recruitment.switchView('interviews')">
              <i class="fa fa-comments"></i> Interviews &amp; 10-Criteria Rubrics
            </button>
            <button class="btn btn-sm \${this.currentView==='assessment_sheets'?'btn-primary':'btn-ghost'}" onclick="Recruitment.switchView('assessment_sheets')">
              <i class="fa fa-table-list"></i> Assessment Sheets &amp; Funnel
            </button>
          </div>
          <button class="btn btn-primary btn-sm" onclick="Recruitment.showScheduleInterviewModal()">
            <i class="fa fa-calendar-plus"></i> Schedule Interview
          </button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">`;

if (code.includes(interviewAnchor)) {
  code = code.replace(interviewAnchor, interviewSubNav);
  console.log('✅ Added Stage 3 Sub-Nav to renderInterviews');
} else {
  console.log('⚠️ Could not find interviewAnchor');
}

// 2. Stage 3 Sub-Nav in renderAssessmentSheets
const assessmentAnchor = `    container.innerHTML = \`
      <div class="animate-fade-in">
        <!-- Top Metrics Ribbon -->
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">`;

const assessmentSubNav = `    container.innerHTML = \`
      <div class="animate-fade-in">
        <!-- Stage 3 Sub-Navigation -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
            <button class="btn btn-sm \${this.currentView==='pipeline'?'btn-primary':'btn-ghost'}" onclick="Recruitment.switchView('pipeline')">
              <i class="fa fa-list-check"></i> Candidate Pipeline
            </button>
            <button class="btn btn-sm \${this.currentView==='interviews'?'btn-primary':'btn-ghost'}" onclick="Recruitment.switchView('interviews')">
              <i class="fa fa-comments"></i> Interviews &amp; 10-Criteria Rubrics
            </button>
            <button class="btn btn-sm \${this.currentView==='assessment_sheets'?'btn-primary':'btn-ghost'}" onclick="Recruitment.switchView('assessment_sheets')">
              <i class="fa fa-table-list"></i> Assessment Sheets &amp; Funnel
            </button>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Recruitment.exportAssessmentFunnelCSV()">
            <i class="fa fa-file-csv"></i> Export Funnel CSV
          </button>
        </div>

        <!-- Top Metrics Ribbon -->
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">`;

if (code.includes(assessmentAnchor)) {
  code = code.replace(assessmentAnchor, assessmentSubNav);
  console.log('✅ Added Stage 3 Sub-Nav to renderAssessmentSheets');
} else {
  console.log('⚠️ Could not find assessmentAnchor');
}

// 3. Stage 4 Sub-Nav in renderOfferLetters
const offerAnchor = `    container.innerHTML = \`
      <!-- Offer Metric Counters -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">`;

const offerSubNav = `    container.innerHTML = \`
      <!-- Stage 4 Sub-Navigation -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
        <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
          <button class="btn btn-sm \${this.currentView==='offers'?'btn-primary':'btn-ghost'}" onclick="Recruitment.switchView('offers')">
            <i class="fa fa-file-signature"></i> Offer Letters &amp; Cascade
          </button>
          <button class="btn btn-sm \${this.currentView==='onboarding'?'btn-primary':'btn-ghost'}" onclick="Recruitment.switchView('onboarding')">
            <i class="fa fa-user-plus"></i> Onboarding Checklists &amp; 1-Click Hire
          </button>
        </div>
        <button class="btn btn-primary btn-sm" onclick="Recruitment.showNewOfferModal()">
          <i class="fa fa-plus"></i> Generate Formal Offer Letter
        </button>
      </div>

      <!-- Offer Metric Counters -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">`;

if (code.includes(offerAnchor)) {
  code = code.replace(offerAnchor, offerSubNav);
  console.log('✅ Added Stage 4 Sub-Nav to renderOfferLetters');
} else {
  console.log('⚠️ Could not find offerAnchor');
}

// 4. Stage 4 Sub-Nav in renderOnboarding
const onboardingAnchor = `    container.innerHTML = \`
      <div class="animate-fade-in">
        <!-- Onboarding Process KPI Cards -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">`;

const onboardingSubNav = `    container.innerHTML = \`
      <div class="animate-fade-in">
        <!-- Stage 4 Sub-Navigation -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px">
          <div style="display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:10px">
            <button class="btn btn-sm \${this.currentView==='offers'?'btn-primary':'btn-ghost'}" onclick="Recruitment.switchView('offers')">
              <i class="fa fa-file-signature"></i> Offer Letters &amp; Cascade
            </button>
            <button class="btn btn-sm \${this.currentView==='onboarding'?'btn-primary':'btn-ghost'}" onclick="Recruitment.switchView('onboarding')">
              <i class="fa fa-user-plus"></i> Onboarding Checklists &amp; 1-Click Hire
            </button>
          </div>
          <button class="btn btn-primary btn-sm" onclick="Recruitment.showNewOnboardingModal()">
            <i class="fa fa-user-plus"></i> Initiate Onboarding
          </button>
        </div>

        <!-- Onboarding Process KPI Cards -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">`;

if (code.includes(onboardingAnchor)) {
  code = code.replace(onboardingAnchor, onboardingSubNav);
  console.log('✅ Added Stage 4 Sub-Nav to renderOnboarding');
} else {
  console.log('⚠️ Could not find onboardingAnchor');
}

// 5. Stage 1 Sub-Nav in renderRequisitions
const reqAnchor = `          <button class="btn btn-sm \${this.requisitionTab === 'radar' ? 'btn-primary' : 'btn-ghost'}" 
            onclick="Recruitment.requisitionTab='radar';Recruitment.renderRequisitions(document.getElementById('rec-content'))"
            style="font-size:12px;font-weight:600;position:relative">
            <i class="fa fa-triangle-exclamation"></i> \${isDeptMgr ? 'Team Vacancies Radar' : 'Separation & Vacancies Radar'}
            \${unfulfilledVacancies.length > 0 ? \`<span class="badge badge-danger" style="margin-left:6px;font-size:10px;padding:1px 5px">\${unfulfilledVacancies.length} Vacant</span>\` : ''}
          </button>
        </div>`;

const reqSubNav = `          <button class="btn btn-sm \${this.requisitionTab === 'radar' ? 'btn-primary' : 'btn-ghost'}" 
            onclick="Recruitment.requisitionTab='radar';Recruitment.renderRequisitions(document.getElementById('rec-content'))"
            style="font-size:12px;font-weight:600;position:relative">
            <i class="fa fa-triangle-exclamation"></i> \${isDeptMgr ? 'Team Vacancies Radar' : 'Separation & Vacancies Radar'}
            \${unfulfilledVacancies.length > 0 ? \`<span class="badge badge-danger" style="margin-left:6px;font-size:10px;padding:1px 5px">\${unfulfilledVacancies.length} Vacant</span>\` : ''}
          </button>
          \${isHR ? \`
            <button class="btn btn-sm btn-ghost" onclick="Recruitment.switchView('dashboard')" style="font-size:12px;font-weight:600">
              <i class="fa fa-chart-pie"></i> Funnel Analytics &amp; KPIs
            </button>
          \` : ''}
        </div>`;

if (code.includes(reqAnchor)) {
  code = code.replace(reqAnchor, reqSubNav);
  console.log('✅ Added Analytics button to renderRequisitions');
} else {
  console.log('⚠️ Could not find reqAnchor');
}

// 6. Stage 1 Sub-Nav in renderRecruitmentDashboard
const dashAnchor = `<button class="btn btn-outline btn-sm" onclick="Recruitment.exportDashboardReport()">
              <i class="fa fa-file-csv"></i> Export Report
            </button>`;

const dashSubNav = `<button class="btn btn-secondary btn-sm" onclick="Recruitment.switchView('requisitions')">
              <i class="fa fa-file-invoice-dollar"></i> Requisitions Workspace
            </button>
            <button class="btn btn-outline btn-sm" onclick="Recruitment.exportDashboardReport()">
              <i class="fa fa-file-csv"></i> Export Report
            </button>`;

if (code.includes(dashAnchor)) {
  code = code.replace(dashAnchor, dashSubNav);
  console.log('✅ Added Requisitions button to renderRecruitmentDashboard');
} else {
  console.log('⚠️ Could not find dashAnchor');
}

fs.writeFileSync('js/recruitment.js', code, 'utf8');
console.log('Done patching sub-navigations in js/recruitment.js');
