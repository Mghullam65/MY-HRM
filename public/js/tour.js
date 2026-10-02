/**
 * HRM Pro — Interactive Product Walkthrough & Feature Tour Engine
 * Provides guided spotlight tours tailored by user persona and role.
 */
const HRMTour = {
  currentStep: 0,
  isActive: false,

  steps: [
    {
      target: '#persona-chip',
      title: '🎭 Persona Switcher & Role Simulation',
      description: 'Switch between 6 pre-configured enterprise roles (Super Admin, HR Director, Dept Manager, Employee, etc.) to experience granular permissions and role-scoped interfaces in real-time.',
      placement: 'bottom'
    },
    {
      target: '#company-switcher-btn, .topbar-company-badge',
      title: '🏢 Multi-Entity Holding Switcher',
      description: 'Effortlessly switch between corporate subsidiaries and multi-tenant entities (ApexTech Solutions, Apex Logistics, Apex Capital) with independent payroll, currencies, and headcount quotas.',
      placement: 'bottom'
    },
    {
      target: '.stat-card, .metric-card, .kpi-card',
      title: '📊 Real-Time Workforce Telemetry',
      description: 'Live operational KPIs counting active employees, daily biometric attendance, pending leave approvals, and payroll run status updated in 0ms.',
      placement: 'bottom'
    },
    {
      target: '#sidebar, .nav-pillars-row',
      title: '🧭 Two-Tier Navigation Architecture',
      description: 'Corporate navigation organized into 5 executive pillars (People & Talent, Time & Attendance, Finance & Payroll, Operations & Compliance, System Administration) with smooth dropdown cards.',
      placement: 'bottom'
    },
    {
      target: '#chat-floating-launcher, .chat-floating-launcher',
      title: '💬 Enterprise Collaboration & AI Co-Pilot',
      description: 'Microsoft Teams-style messaging with live channels, presence status, voice calls, and an intelligent AI HR Co-Pilot ready to draft offer letters, check tax policies, and analyze rosters.',
      placement: 'left'
    }
  ],

  start(force = false) {
    if (this.isActive) return;
    if (!force && localStorage.getItem('hrm_tour_completed') === 'true') return;

    this.currentStep = 0;
    this.isActive = true;
    this.renderOverlay();
    this.showStep(0);
  },

  renderOverlay() {
    let overlay = document.getElementById('hrm-tour-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'hrm-tour-overlay';
      overlay.className = 'hrm-tour-overlay';
      overlay.innerHTML = `
        <div id="hrm-tour-spotlight" class="hrm-tour-spotlight"></div>
        <div id="hrm-tour-popover" class="hrm-tour-popover">
          <div class="hrm-tour-header">
            <div class="hrm-tour-badge">
              <i class="fa fa-sparkles text-primary"></i> <span id="hrm-tour-counter">Step 1 of 5</span>
            </div>
            <button class="hrm-tour-close" onclick="HRMTour.end()" title="Close Tour">✕</button>
          </div>
          <h4 id="hrm-tour-title" class="hrm-tour-title">Tour Title</h4>
          <p id="hrm-tour-desc" class="hrm-tour-desc">Tour Description</p>
          <div class="hrm-tour-footer">
            <button class="btn btn-ghost btn-sm" onclick="HRMTour.end()">Skip Tour</button>
            <div style="display:flex;gap:8px">
              <button id="hrm-tour-prev-btn" class="btn btn-secondary btn-sm" onclick="HRMTour.prev()">Back</button>
              <button id="hrm-tour-next-btn" class="btn btn-primary btn-sm" onclick="HRMTour.next()">Next</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';
  },

  showStep(index) {
    if (index < 0 || index >= this.steps.length) {
      this.end();
      return;
    }

    this.currentStep = index;
    const step = this.steps[index];

    // Find element
    let el = null;
    const selectors = step.target.split(',');
    for (const sel of selectors) {
      const found = document.querySelector(sel.trim());
      if (found && found.offsetParent !== null) {
        el = found;
        break;
      }
    }

    const popover = document.getElementById('hrm-tour-popover');
    const spotlight = document.getElementById('hrm-tour-spotlight');
    const counter = document.getElementById('hrm-tour-counter');
    const title = document.getElementById('hrm-tour-title');
    const desc = document.getElementById('hrm-tour-desc');
    const prevBtn = document.getElementById('hrm-tour-prev-btn');
    const nextBtn = document.getElementById('hrm-tour-next-btn');

    if (!popover || !spotlight) return;

    counter.textContent = `Step ${index + 1} of ${this.steps.length}`;
    title.innerHTML = step.title;
    desc.textContent = step.description;

    prevBtn.style.display = index === 0 ? 'none' : 'inline-flex';
    nextBtn.innerHTML = index === this.steps.length - 1 ? 'Finish <i class="fa fa-check"></i>' : 'Next <i class="fa fa-arrow-right"></i>';

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const rect = el.getBoundingClientRect();
      const pad = 8;

      spotlight.style.display = 'block';
      spotlight.style.top = `${rect.top - pad}px`;
      spotlight.style.left = `${rect.left - pad}px`;
      spotlight.style.width = `${rect.width + pad * 2}px`;
      spotlight.style.height = `${rect.height + pad * 2}px`;

      // Position popover
      const popWidth = Math.min(360, window.innerWidth - 32);
      popover.style.width = `${popWidth}px`;

      let top = rect.bottom + 16;
      let left = Math.max(16, Math.min(rect.left, window.innerWidth - popWidth - 16));

      if (top + 220 > window.innerHeight) {
        top = Math.max(16, rect.top - 220);
      }

      popover.style.top = `${top}px`;
      popover.style.left = `${left}px`;
    } else {
      // Center popover if target not found in DOM
      spotlight.style.display = 'none';
      popover.style.width = '360px';
      popover.style.top = '50%';
      popover.style.left = '50%';
      popover.style.transform = 'translate(-50%, -50%)';
    }
  },

  next() {
    if (this.currentStep < this.steps.length - 1) {
      this.showStep(this.currentStep + 1);
    } else {
      this.end();
    }
  },

  prev() {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  },

  end() {
    this.isActive = false;
    localStorage.setItem('hrm_tour_completed', 'true');
    const overlay = document.getElementById('hrm-tour-overlay');
    if (overlay) overlay.style.display = 'none';
  }
};

window.HRMTour = HRMTour;
