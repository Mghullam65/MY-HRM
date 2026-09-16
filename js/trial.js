// ============================================================
// HRM PRO — Free Trial & Account Creation Controller
// ============================================================

const Trial = {
  selectedRole: 'client', // 'client' | 'freelancer'
  selectedPlan: 'Pro',

  render(plan = 'Pro') {
    this.selectedPlan = plan;
    const container = document.getElementById('trial-page');
    if (!container) return;

    container.innerHTML = `
      <div class="trial-page-wrapper">
        <div class="trial-top-nav">
          <a href="#" class="trial-back-link" onclick="App.showLanding();return false;">
            <i class="fa fa-arrow-left"></i> Back to Home
          </a>
        </div>

        <div class="trial-card-container animate-fade-in">
          <!-- Brand Header -->
          <div class="trial-brand-header">
            <div class="trial-brand-icon">
              <i class="fa fa-users"></i>
            </div>
            <div class="trial-brand-text">
              HRM <span class="trial-brand-accent">Pro</span>
            </div>
          </div>

          <!-- Page Titles -->
          <h1 class="trial-card-title">Create your account</h1>
          <p class="trial-card-subtitle">
            Choose how you'll use HRM Pro. You can invite others after signing up.
          </p>

          <!-- Free Trial Form -->
          <form id="trial-signup-form" onsubmit="Trial.handleSubmit(event);return false;" novalidate>
            <!-- Role Selection Segment (Matching Reference Screenshot) -->
            <div class="trial-role-section">
              <label class="trial-field-label">I am a...</label>
              <div class="trial-role-grid">
                <!-- Option 1: Client -->
                <div class="trial-role-box ${this.selectedRole === 'client' ? 'active' : ''}" 
                     id="role-box-client" 
                     onclick="Trial.selectRole('client')">
                  <div class="trial-radio-row">
                    <span class="trial-radio-circle ${this.selectedRole === 'client' ? 'checked' : ''}">
                      <span class="trial-radio-inner"></span>
                    </span>
                    <span class="trial-role-heading">Client</span>
                  </div>
                  <p class="trial-role-caption">I hire freelancers for projects</p>
                </div>

                <!-- Option 2: Freelancer -->
                <div class="trial-role-box ${this.selectedRole === 'freelancer' ? 'active' : ''}" 
                     id="role-box-freelancer" 
                     onclick="Trial.selectRole('freelancer')">
                  <div class="trial-radio-row">
                    <span class="trial-radio-circle ${this.selectedRole === 'freelancer' ? 'checked' : ''}">
                      <span class="trial-radio-inner"></span>
                    </span>
                    <span class="trial-role-heading">Freelancer</span>
                  </div>
                  <p class="trial-role-caption">I work on client projects</p>
                </div>
              </div>
            </div>

            <!-- Form Fields -->
            <div class="trial-field-group">
              <label for="trial-name" class="trial-field-label">
                Your Name <span class="trial-required-star">*</span>
              </label>
              <input 
                type="text" 
                id="trial-name" 
                class="trial-input-control" 
                placeholder="John Doe" 
                autocomplete="name"
                required
              />
            </div>

            <div class="trial-field-group">
              <label for="trial-email" class="trial-field-label">
                Email <span class="trial-required-star">*</span>
              </label>
              <input 
                type="email" 
                id="trial-email" 
                class="trial-input-control" 
                placeholder="you@example.com" 
                autocomplete="email"
                required
              />
            </div>

            <div class="trial-field-group">
              <label for="trial-password" class="trial-field-label">
                Password <span class="trial-required-star">*</span>
              </label>
              <div class="trial-password-wrap">
                <input 
                  type="password" 
                  id="trial-password" 
                  class="trial-input-control" 
                  placeholder="••••••••" 
                  autocomplete="new-password"
                  required
                />
                <button type="button" class="trial-pw-toggle" onclick="Trial.togglePassword('trial-password')">
                  <i class="fa fa-eye-slash" id="trial-password-icon"></i>
                </button>
              </div>
            </div>

            <div class="trial-field-group">
              <label for="trial-confirm-password" class="trial-field-label">
                Confirm Password <span class="trial-required-star">*</span>
              </label>
              <div class="trial-password-wrap">
                <input 
                  type="password" 
                  id="trial-confirm-password" 
                  class="trial-input-control" 
                  placeholder="••••••••" 
                  autocomplete="new-password"
                  required
                />
                <button type="button" class="trial-pw-toggle" onclick="Trial.togglePassword('trial-confirm-password')">
                  <i class="fa fa-eye-slash" id="trial-confirm-password-icon"></i>
                </button>
              </div>
            </div>

            <!-- Error Banner (Hidden by default) -->
            <div id="trial-error-banner" class="trial-error-alert" style="display:none"></div>

            <!-- Submit Button -->
            <button type="submit" id="trial-submit-btn" class="trial-btn-submit">
              <span>Create Account</span>
            </button>
          </form>

          <!-- Bottom Direct Sign In Link -->
          <div class="trial-footer-signin">
            Already have an account? 
            <a href="#" onclick="App.showLogin();return false;" class="trial-signin-link">Sign in</a>
          </div>

          <!-- Bottom Notice Card (Matching Reference Screenshot) -->
          <div class="trial-invitation-notice">
            Have an invitation? Click the link in your email to join an existing project.
          </div>
        </div>
      </div>
    `;
  },

  selectRole(role) {
    this.selectedRole = role;
    const clientBox = document.getElementById('role-box-client');
    const freelancerBox = document.getElementById('role-box-freelancer');
    if (!clientBox || !freelancerBox) return;

    if (role === 'client') {
      clientBox.classList.add('active');
      clientBox.querySelector('.trial-radio-circle')?.classList.add('checked');
      freelancerBox.classList.remove('active');
      freelancerBox.querySelector('.trial-radio-circle')?.classList.remove('checked');
    } else {
      freelancerBox.classList.add('active');
      freelancerBox.querySelector('.trial-radio-circle')?.classList.add('checked');
      clientBox.classList.remove('active');
      clientBox.querySelector('.trial-radio-circle')?.classList.remove('checked');
    }
  },

  togglePassword(fieldId) {
    const input = document.getElementById(fieldId);
    const icon = document.getElementById(fieldId + '-icon');
    if (!input || !icon) return;
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fa fa-eye';
    } else {
      input.type = 'password';
      icon.className = 'fa fa-eye-slash';
    }
  },

  handleSubmit(event) {
    if (event) event.preventDefault();
    const nameInput = document.getElementById('trial-name');
    const emailInput = document.getElementById('trial-email');
    const passwordInput = document.getElementById('trial-password');
    const confirmInput = document.getElementById('trial-confirm-password');
    const errBanner = document.getElementById('trial-error-banner');
    const submitBtn = document.getElementById('trial-submit-btn');

    if (errBanner) {
      errBanner.style.display = 'none';
      errBanner.textContent = '';
    }

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const confirmPassword = confirmInput ? confirmInput.value : '';

    // Validations
    if (!name) {
      this.showError('Please enter your full name.');
      if (nameInput) nameInput.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      this.showError('Please enter a valid email address.');
      if (emailInput) emailInput.focus();
      return;
    }

    if (!password || password.length < 6) {
      this.showError('Password must be at least 6 characters long.');
      if (passwordInput) passwordInput.focus();
      return;
    }

    if (password !== confirmPassword) {
      this.showError('Passwords do not match. Please re-enter.');
      if (confirmInput) confirmInput.focus();
      return;
    }

    // Process Registration
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa fa-circle-notch fa-spin"></i> Creating account...';
    }

    setTimeout(() => {
      try {
        const isClient = this.selectedRole === 'client';
        const role = isClient ? 'admin' : 'employee';
        const roles = isClient ? ['admin', 'hr'] : ['employee'];
        const designation = isClient ? 'Managing Director / Client' : 'Senior Specialist / Freelancer';
        const department = isClient ? 'Management' : 'Engineering & Projects';
        const empId = 'EMP-TRL-' + Math.floor(1000 + Math.random() * 9000);

        const newEmp = {
          id: empId,
          fullName: name,
          email: email,
          role: role,
          roles: roles,
          designation: designation,
          department: department,
          status: 'Active',
          joinDate: new Date().toISOString().split('T')[0],
          salary: isClient ? 150000 : 85000,
          phone: '+1 555-0188',
          isTrial: true,
          trialPlan: this.selectedPlan || 'Pro',
          trialDaysRemaining: 14,
          photo: null
        };

        // Add to employees in DB if DB is present
        if (typeof DB !== 'undefined' && DB.get) {
          const emps = DB.get('employees') || [];
          emps.unshift(newEmp);
          DB.set('employees', emps);
        }

        // Set Auth session
        if (typeof Auth !== 'undefined') {
          Auth.user = {
            id: empId,
            name: name,
            email: email,
            role: role,
            roles: roles,
            isTrial: true,
            trialPlan: this.selectedPlan || 'Pro'
          };
          Auth.employee = newEmp;

          if (typeof DB !== 'undefined' && DB.setObj) {
            DB.setObj('current_user', Auth.user);
            DB.setObj('current_employee', Auth.employee);
          }
        }

        if (typeof Toast !== 'undefined') {
          Toast.success(`🎉 Welcome to HRM Pro, ${name}! Your 14-day free trial has been activated.`);
        }

        // Navigate to App
        App.showApp();
      } catch (err) {
        console.error('Registration error:', err);
        this.showError('An error occurred while creating your account. Please try again.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Create Account</span>';
        }
      }
    }, 600);
  },

  showError(msg) {
    const errBanner = document.getElementById('trial-error-banner');
    if (errBanner) {
      errBanner.textContent = msg;
      errBanner.style.display = 'block';
    } else if (typeof Toast !== 'undefined') {
      Toast.error(msg);
    }
  }
};

window.Trial = Trial;
