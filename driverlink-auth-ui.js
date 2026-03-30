/**
 * DriverLink Auth UI - Self-Injecting Module (v2)
 *
 * Redesigned for clarity:
 *   - Prominent "Sign Up Free" button in the nav bar
 *   - 2-step signup: (1) Choose your role with big visual cards, (2) Fill details
 *   - Clear "I'm a Driver" vs "I'm Hiring Drivers" distinction
 *   - Sign-in accessible but not blocking
 *
 * Load order (in driverlink-app.html, before </body>):
 *   1. <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   2. <script src="supabase-client.js"></script>
 *   3. <script src="driverlink-backend-wiring.js"></script>
 *   4. <script src="driverlink-auth-ui.js"></script>   <-- THIS FILE
 */

(function() {
  'use strict';

  // =========================================================================
  // 1. INJECT CSS
  // =========================================================================

  const authCSS = `
/* ===== AUTH OVERLAY ===== */
.auth-screen {
  position: fixed;
  inset: 0;
  background: rgba(11, 15, 26, 0.92);
  backdrop-filter: blur(12px);
  z-index: 1000;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
}
.auth-screen.on { display: flex; }

.auth-card {
  background: var(--surf);
  border: 1px solid var(--brd);
  border-radius: var(--r);
  padding: 2rem;
  max-width: 520px;
  width: 100%;
  box-shadow: var(--sh-lg);
  animation: authSlideUp 0.3s ease-out;
}
@keyframes authSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Header */
.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--brd);
}
.auth-header .auth-logo {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  font-size: 1.4rem; font-weight: 900; color: var(--txt); margin-bottom: 0.5rem;
}
.auth-header .auth-logo i { color: var(--green); font-size: 1.3rem; filter: drop-shadow(0 0 8px rgba(0, 255, 136, 0.4)); }
.auth-header .auth-tagline { font-size: 0.75rem; color: var(--green); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.auth-header .auth-subtitle { font-size: 0.85rem; color: var(--txt2); margin-top: 0.5rem; }

/* ===== STEP 1: ROLE CHOOSER ===== */
.role-chooser { display: block; }
.role-chooser.hidden { display: none; }
.role-chooser-title {
  text-align: center; font-size: 1.15rem; font-weight: 800; color: var(--txt); margin-bottom: 0.4rem;
}
.role-chooser-sub {
  text-align: center; font-size: 0.85rem; color: var(--txt2); margin-bottom: 1.5rem;
}

.role-cards { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
@media (max-width: 500px) { .role-cards { flex-direction: column; } }

.role-card {
  flex: 1; padding: 1.5rem 1.25rem;
  border: 2px solid var(--brd);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer; transition: all 0.25s;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.role-card:hover {
  border-color: rgba(0, 255, 136, 0.4);
  background: rgba(0, 255, 136, 0.03);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
.role-card .role-icon {
  font-size: 2.5rem; margin-bottom: 0.75rem; display: block;
}
.role-card.driver-card .role-icon { color: var(--green); }
.role-card.company-card .role-icon { color: var(--blue); }

.role-card .role-card-title {
  font-size: 1.05rem; font-weight: 800; color: var(--txt); margin-bottom: 0.4rem;
}
.role-card .role-card-desc {
  font-size: 0.78rem; color: var(--txt2); line-height: 1.5;
}
.role-card .role-card-btn {
  display: inline-block; margin-top: 1rem; padding: 0.55rem 1.5rem;
  border-radius: 8px; font-size: 0.85rem; font-weight: 700;
  border: none; cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.role-card.driver-card .role-card-btn {
  background: var(--green); color: #0b0f1a;
}
.role-card.driver-card .role-card-btn:hover {
  background: #00ffaa; box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
}
.role-card.company-card .role-card-btn {
  background: var(--blue); color: #fff;
}
.role-card.company-card .role-card-btn:hover {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.role-card .role-card-perks {
  margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.06);
  text-align: left; font-size: 0.72rem; color: var(--txt3); line-height: 1.8;
}
.role-card .role-card-perks span { display: block; }
.role-card .role-card-perks i { margin-right: 0.3rem; color: var(--green); font-size: 0.65rem; }

.role-chooser-signin {
  text-align: center; font-size: 0.82rem; color: var(--txt2); margin-top: 0.5rem;
}
.role-chooser-signin .auth-link { margin-left: 0.25rem; }

.role-chooser-guest {
  display: block; margin-top: 1rem; padding: 0.55rem;
  text-align: center; color: var(--txt3); font-size: 0.78rem;
  border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;
  cursor: pointer; transition: all 0.15s;
  background: transparent; text-decoration: none; width: 100%;
  font-family: inherit;
}
.role-chooser-guest:hover { border-color: rgba(0, 255, 136, 0.2); color: var(--txt2); }

/* ===== STEP 2: FORM ===== */
.auth-form-wrapper { display: none; }
.auth-form-wrapper.on { display: block; animation: authFadeIn 0.25s ease-out; }
@keyframes authFadeIn { from { opacity: 0; } to { opacity: 1; } }

.auth-form-back {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.82rem; color: var(--txt2); cursor: pointer; margin-bottom: 1rem;
  background: none; border: none; font-family: inherit; padding: 0;
  transition: color 0.15s;
}
.auth-form-back:hover { color: var(--green); }

.auth-form-role-badge {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.35rem 0.85rem; border-radius: 99px;
  font-size: 0.78rem; font-weight: 700; margin-bottom: 1.25rem;
}
.auth-form-role-badge.driver { background: rgba(0, 255, 136, 0.12); color: var(--green); border: 1px solid rgba(0, 255, 136, 0.2); }
.auth-form-role-badge.company { background: rgba(59, 130, 246, 0.12); color: var(--blue); border: 1px solid rgba(59, 130, 246, 0.2); }

/* Tabs (sign-in / sign-up) */
.auth-tabs {
  display: flex; gap: 2px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px; padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 1.5rem;
}
.auth-tab {
  flex: 1; padding: 0.5rem; border-radius: 6px;
  font-size: 0.85rem; font-weight: 600; text-align: center;
  cursor: pointer; transition: all 0.2s;
  color: var(--txt2); background: transparent;
  border: none; font-family: inherit;
}
.auth-tab:hover { color: var(--txt); background: rgba(255, 255, 255, 0.03); }
.auth-tab.on {
  background: var(--green); color: #0b0f1a;
  font-weight: 700; box-shadow: 0 0 12px rgba(0, 255, 136, 0.3);
}

/* Forms */
.auth-form { display: none; }
.auth-form.on { display: block; }

.form-group { margin-bottom: 1.25rem; }
.form-group label { display: block; font-size: 0.82rem; font-weight: 600; color: var(--txt); margin-bottom: 0.4rem; }
.form-group .form-hint { font-size: 0.7rem; color: var(--txt3); font-weight: 500; }

.auth-input {
  width: 100%; padding: 0.65rem 0.85rem;
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid var(--brd); border-radius: 8px;
  color: var(--txt); font-size: 0.9rem; font-family: inherit;
  transition: all 0.15s; box-sizing: border-box;
}
.auth-input::placeholder { color: var(--txt3); }
.auth-input:focus {
  outline: none; border-color: var(--green);
  background: rgba(0, 255, 136, 0.04);
  box-shadow: 0 0 16px rgba(0, 255, 136, 0.1);
}
.auth-input.error { border-color: var(--red); background: rgba(255, 71, 87, 0.04); }

/* Password strength */
.password-strength { margin-top: 0.5rem; display: flex; gap: 3px; }
.strength-bar { flex: 1; height: 3px; background: var(--brd); border-radius: 99px; transition: background 0.3s; }
.strength-bar.weak { background: var(--red); }
.strength-bar.fair { background: var(--amber); }
.strength-bar.good { background: var(--blue); }
.strength-bar.strong { background: var(--green); }
.strength-text { font-size: 0.68rem; color: var(--txt3); margin-top: 0.3rem; display: block; }
.strength-text.weak { color: var(--red); }
.strength-text.fair { color: var(--amber); }
.strength-text.good { color: var(--blue); }
.strength-text.strong { color: var(--green); }

/* Auth button */
.auth-btn {
  width: 100%; padding: 0.7rem;
  background: var(--green); color: #0b0f1a;
  border: none; border-radius: 8px;
  font-size: 0.9rem; font-weight: 700;
  font-family: inherit; cursor: pointer;
  transition: all 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  margin-bottom: 1rem;
}
.auth-btn:hover:not(:disabled) { background: #00ffaa; transform: translateY(-1px); box-shadow: 0 0 20px rgba(0, 255, 136, 0.3); }
.auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-btn.loading { pointer-events: none; opacity: 0.7; }
.auth-btn.blue-btn { background: var(--blue); color: #fff; }
.auth-btn.blue-btn:hover:not(:disabled) { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); background: #4d8ef7; }

/* Error */
.auth-error {
  background: rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.3);
  border-radius: 8px; padding: 0.75rem 0.85rem; margin-bottom: 1.25rem;
  color: var(--red); font-size: 0.82rem; display: none;
  animation: authSlideDown 0.2s ease-out;
}
.auth-error.on { display: block; }
@keyframes authSlideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.auth-error i { margin-right: 0.4rem; }

/* Success */
.auth-success {
  background: rgba(0, 255, 136, 0.1); border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 8px; padding: 0.75rem 0.85rem; margin-bottom: 1.25rem;
  color: var(--green); font-size: 0.82rem; display: none;
}
.auth-success.on { display: block; }

/* Links */
.auth-link {
  display: inline; color: var(--green); cursor: pointer;
  text-decoration: none; font-weight: 600; font-size: inherit;
  transition: all 0.15s; border: none; background: none;
  padding: 0; font-family: inherit;
}
.auth-link:hover { text-decoration: underline; opacity: 0.8; }

.auth-footer {
  text-align: center; margin-top: 1.5rem;
  padding-top: 1.25rem; border-top: 1px solid var(--brd);
  font-size: 0.8rem; color: var(--txt2);
}
.auth-footer .auth-link { margin-left: 0.25rem; }

/* ===== NAV BAR ADDITIONS ===== */
.nav-auth-btns { display: flex; gap: 0.5rem; align-items: center; margin-left: auto; }
.nav-signin-btn {
  padding: 0.4rem 0.85rem;
  background: transparent; color: var(--txt2);
  border: 1px solid var(--brd); border-radius: 6px;
  font-size: 0.78rem; font-weight: 600;
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.nav-signin-btn:hover { color: var(--txt); border-color: var(--green); }

.nav-signup-btn {
  padding: 0.4rem 1rem;
  background: var(--green); color: #0b0f1a;
  border: none; border-radius: 6px;
  font-size: 0.78rem; font-weight: 700;
  cursor: pointer; transition: all 0.15s; font-family: inherit;
  display: flex; align-items: center; gap: 0.3rem;
}
.nav-signup-btn:hover {
  background: #00ffaa; transform: translateY(-1px);
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
}
.nav-signup-btn .signup-pulse {
  width: 6px; height: 6px; border-radius: 50%;
  background: #0b0f1a; animation: signupPulse 2s ease-in-out infinite;
}
@keyframes signupPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

/* User menu */
.user-menu { display: flex; align-items: center; gap: 0.75rem; position: relative; margin-left: auto; }
.user-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, var(--green), var(--blue));
  display: flex; align-items: center; justify-content: center;
  color: #0b0f1a; font-size: 0.85rem; font-weight: 700;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 0 12px rgba(0, 255, 136, 0.2);
  border: 2px solid var(--green);
}
.user-avatar:hover { transform: scale(1.08); }
.user-name { display: flex; flex-direction: column; font-size: 0.82rem; color: var(--txt); }
.user-name .un-primary { font-weight: 700; line-height: 1; }
.user-name .un-secondary { font-size: 0.7rem; color: var(--txt2); }

.user-dropdown {
  position: absolute; top: 100%; right: 0;
  background: var(--surf); border: 1px solid var(--brd);
  border-radius: 8px; box-shadow: var(--sh-lg);
  min-width: 200px; margin-top: 0.5rem;
  display: none; z-index: 100; overflow: hidden;
}
.user-dropdown.on { display: block; }
.user-dropdown-item {
  display: block; width: 100%; padding: 0.6rem 1rem;
  background: none; border: none; color: var(--txt);
  font-size: 0.82rem; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
  font-family: inherit; text-align: left;
}
.user-dropdown-item:hover { background: var(--bg); color: var(--green); }
.user-dropdown-item.danger { color: var(--red); }
.user-dropdown-item.danger:hover { background: rgba(255, 71, 87, 0.08); }
.user-dropdown-divider { height: 1px; background: var(--brd); margin: 0.4rem 0; }
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'driverlink-auth-css';
  // Remove old style if exists
  const oldStyle = document.getElementById('driverlink-auth-css');
  if (oldStyle) oldStyle.remove();
  styleEl.textContent = authCSS;
  document.head.appendChild(styleEl);

  // =========================================================================
  // 2. INJECT HTML
  // =========================================================================

  const authHTML = `
<div id="auth-screen" class="auth-screen">
  <div class="auth-card">
    <div class="auth-header">
      <div class="auth-logo">
        <i class="fas fa-truck-moving"></i>
        <span>DriverLink</span>
      </div>
      <div class="auth-tagline">Specialty Hauling Network</div>
    </div>

    <div id="auth-error" class="auth-error">
      <i class="fas fa-exclamation-circle"></i>
      <span id="auth-error-msg"></span>
    </div>

    <!-- ========== STEP 1: CHOOSE YOUR ROLE ========== -->
    <div id="role-chooser" class="role-chooser">
      <div class="role-chooser-title">How do you want to use DriverLink?</div>
      <div class="role-chooser-sub">Choose one to get started. It only takes 30 seconds.</div>

      <div class="role-cards">
        <!-- DRIVER CARD -->
        <div class="role-card driver-card" onclick="authUI.chooseRole('driver')">
          <span class="role-icon"><i class="fas fa-truck-moving"></i></span>
          <div class="role-card-title">I'm a Driver</div>
          <div class="role-card-desc">Find jobs, know your worth, and connect with top companies</div>
          <div class="role-card-perks">
            <span><i class="fas fa-check"></i> See real salary data for your specialty</span>
            <span><i class="fas fa-check"></i> Get matched with companies hiring now</span>
            <span><i class="fas fa-check"></i> 100% free, forever</span>
          </div>
          <button type="button" class="role-card-btn">Sign Up as Driver</button>
        </div>

        <!-- COMPANY CARD -->
        <div class="role-card company-card" onclick="authUI.chooseRole('fleet_owner')">
          <span class="role-icon"><i class="fas fa-building"></i></span>
          <div class="role-card-title">I'm Hiring Drivers</div>
          <div class="role-card-desc">Find qualified specialty haulers for your fleet</div>
          <div class="role-card-perks">
            <span><i class="fas fa-check"></i> Browse verified driver profiles</span>
            <span><i class="fas fa-check"></i> Post jobs and get matched</span>
            <span><i class="fas fa-check"></i> Reduce turnover with better fits</span>
          </div>
          <button type="button" class="role-card-btn">Sign Up as Company</button>
        </div>
      </div>

      <div class="role-chooser-signin">
        Already have an account? <a class="auth-link" onclick="authUI.showSignIn()">Sign in</a>
      </div>

      <button class="role-chooser-guest" onclick="authUI.continueAsGuest()">
        <i class="fas fa-eye"></i> Just browsing? Continue as guest
      </button>
    </div>

    <!-- ========== STEP 2: SIGN-UP / SIGN-IN FORMS ========== -->
    <div id="auth-form-wrapper" class="auth-form-wrapper">
      <button class="auth-form-back" onclick="authUI.backToRoleChooser()">
        <i class="fas fa-arrow-left"></i> Back
      </button>

      <div id="auth-role-badge" class="auth-form-role-badge driver">
        <i class="fas fa-truck-moving"></i> <span id="auth-role-badge-text">Signing up as Driver</span>
      </div>

      <div class="auth-tabs">
        <button class="auth-tab on" data-tab="signup" onclick="authUI.switchTab('signup')">
          <i class="fas fa-user-plus"></i> Create Account
        </button>
        <button class="auth-tab" data-tab="signin" onclick="authUI.switchTab('signin')">
          <i class="fas fa-sign-in-alt"></i> Sign In
        </button>
      </div>

      <!-- SIGN UP FORM -->
      <form id="signup-form" class="auth-form on" onsubmit="authUI.handleSignUp(event)">
        <div class="form-group">
          <label for="signup-name" id="signup-name-label">Full Name</label>
          <input type="text" id="signup-name" class="auth-input" placeholder="John Doe" required>
        </div>
        <div class="form-group">
          <label for="signup-email">Email Address</label>
          <input type="email" id="signup-email" class="auth-input" placeholder="you@example.com" required>
        </div>
        <div class="form-group">
          <label for="signup-password">Password</label>
          <input type="password" id="signup-password" class="auth-input" placeholder="At least 6 characters" minlength="6" required oninput="authUI.updatePasswordStrength(this.value)">
          <div class="password-strength" id="password-strength" style="display: none;">
            <div class="strength-bar"></div>
            <div class="strength-bar"></div>
            <div class="strength-bar"></div>
            <div class="strength-bar"></div>
          </div>
          <span class="strength-text" id="strength-text"></span>
        </div>
        <input type="hidden" id="signup-role" value="driver">
        <button type="submit" id="signup-submit-btn" class="auth-btn">
          <i class="fas fa-user-plus"></i> Create My Driver Account
        </button>
      </form>

      <!-- SIGN IN FORM -->
      <form id="signin-form" class="auth-form" onsubmit="authUI.handleSignIn(event)">
        <div class="form-group">
          <label for="signin-email">Email Address</label>
          <input type="email" id="signin-email" class="auth-input" placeholder="you@example.com" required>
        </div>
        <div class="form-group">
          <label for="signin-password">Password</label>
          <input type="password" id="signin-password" class="auth-input" placeholder="Your password" required>
        </div>
        <button type="submit" class="auth-btn">
          <i class="fas fa-sign-in-alt"></i> Sign In
        </button>
        <div style="text-align: center; font-size: 0.8rem; color: var(--txt2);">
          <a class="auth-link" onclick="authUI.showForgotPassword()">Forgot password?</a>
        </div>
      </form>

      <div class="auth-footer" id="auth-footer">
        <span id="auth-footer-text">
          Already have an account? <a class="auth-link" onclick="authUI.switchTab('signin')">Sign in</a>
        </span>
      </div>
    </div>

  </div>
</div>
`;

  // Remove old auth screen if present
  const oldAuthScreen = document.getElementById('auth-screen');
  if (oldAuthScreen) oldAuthScreen.remove();

  // Insert auth screen as the first child of <body>
  const authContainer = document.createElement('div');
  authContainer.innerHTML = authHTML;
  document.body.insertBefore(authContainer.firstElementChild, document.body.firstChild);

  // =========================================================================
  // 3. INJECT NAV BAR BUTTONS
  // =========================================================================

  function injectNavButtons() {
    // Don't inject if user is already signed in
    if (window.authUI && window.authUI.currentUser) return;

    const navInner = document.querySelector('.nav-inner');
    if (!navInner) return;

    // Remove existing auth buttons if present
    const existing = navInner.querySelector('.nav-auth-btns');
    if (existing) existing.remove();

    const btnsDiv = document.createElement('div');
    btnsDiv.className = 'nav-auth-btns';
    btnsDiv.innerHTML =
      '<button class="nav-signin-btn" onclick="authUI.showSignIn()">Sign In</button>' +
      '<button class="nav-signup-btn" onclick="authUI.showAuthScreen()">' +
        '<span class="signup-pulse"></span> Sign Up Free' +
      '</button>';

    navInner.appendChild(btnsDiv);
  }

  // =========================================================================
  // 4. AUTH UI CONTROLLER
  // =========================================================================

  window.authUI = {
    currentUser: null,
    selectedRole: 'driver',

    // --- INITIALIZATION ---
    async init() {
      console.log('[Auth] Initializing auth UI v2...');

      // Inject nav buttons
      injectNavButtons();

      // Check if Supabase is in demo mode
      if (window.DL_DEMO_MODE) {
        console.log('[Auth] Demo mode active, skipping auth check');
        return;
      }

      // Check if dlAuth exists
      if (typeof dlAuth === 'undefined') {
        console.warn('[Auth] dlAuth not available, skipping auth');
        return;
      }

      try {
        const user = await dlAuth.getUser();

        if (user) {
          this.currentUser = user;
          this.showApp();
        } else {
          // Don't auto-show auth screen, let user browse and click Sign Up
          injectNavButtons();
        }

        // Listen for auth state changes
        dlAuth.onAuthChange((event, session) => {
          console.log('[Auth] Auth state changed:', event);
          if (event === 'SIGNED_IN') {
            this.currentUser = session.user;
            this.showApp();
          } else if (event === 'SIGNED_OUT') {
            this.currentUser = null;
            this.hideApp();
          }
        });
      } catch (error) {
        console.error('[Auth] Error during init:', error);
      }
    },

    // --- SCREEN MANAGEMENT ---
    showAuthScreen() {
      console.log('[Auth] Showing auth screen (role chooser)');
      const authScreen = document.getElementById('auth-screen');
      if (authScreen) authScreen.classList.add('on');
      // Show step 1 (role chooser)
      this.showRoleChooser();
    },

    showRoleChooser() {
      const chooser = document.getElementById('role-chooser');
      const formWrapper = document.getElementById('auth-form-wrapper');
      if (chooser) chooser.classList.remove('hidden');
      if (formWrapper) formWrapper.classList.remove('on');
      this.clearError();
    },

    showSignIn() {
      console.log('[Auth] Showing sign-in form directly');
      const authScreen = document.getElementById('auth-screen');
      if (authScreen) authScreen.classList.add('on');

      // Go straight to form wrapper with sign-in tab
      const chooser = document.getElementById('role-chooser');
      const formWrapper = document.getElementById('auth-form-wrapper');
      const backBtn = formWrapper ? formWrapper.querySelector('.auth-form-back') : null;
      const roleBadge = document.getElementById('auth-role-badge');

      if (chooser) chooser.classList.add('hidden');
      if (formWrapper) formWrapper.classList.add('on');
      if (backBtn) backBtn.style.display = 'inline-flex';
      if (roleBadge) roleBadge.style.display = 'none';

      this.switchTab('signin');
    },

    showApp() {
      console.log('[Auth] Showing app');
      const authScreen = document.getElementById('auth-screen');
      if (authScreen) authScreen.classList.remove('on');

      const homeScreen = document.getElementById('home');
      if (homeScreen) homeScreen.classList.add('on');

      // Remove nav auth buttons, replace with user menu
      const navAuthBtns = document.querySelector('.nav-auth-btns');
      if (navAuthBtns) navAuthBtns.remove();

      this.updateNavBar();

      // Hide alpha modal if logged in
      const alphaModal = document.getElementById('alpha-modal');
      if (alphaModal && alphaModal.classList.contains('on')) {
        alphaModal.classList.remove('on');
      }
    },

    hideApp() {
      // Remove user menu, re-add auth buttons
      const existingMenu = document.querySelector('.user-menu');
      if (existingMenu) existingMenu.remove();
      injectNavButtons();
    },

    // --- ROLE CHOOSER ---
    chooseRole(role) {
      console.log('[Auth] User chose role:', role);
      this.selectedRole = role;
      document.getElementById('signup-role').value = role;

      // Update badge
      const badge = document.getElementById('auth-role-badge');
      const badgeText = document.getElementById('auth-role-badge-text');
      if (badge && badgeText) {
        badge.style.display = 'inline-flex';
        if (role === 'driver') {
          badge.className = 'auth-form-role-badge driver';
          badge.innerHTML = '<i class="fas fa-truck-moving"></i> <span id="auth-role-badge-text">Signing up as Driver</span>';
        } else {
          badge.className = 'auth-form-role-badge company';
          badge.innerHTML = '<i class="fas fa-building"></i> <span id="auth-role-badge-text">Signing up as Company</span>';
        }
      }

      // Update name label and button text
      const nameLabel = document.getElementById('signup-name-label');
      const submitBtn = document.getElementById('signup-submit-btn');
      if (role === 'driver') {
        if (nameLabel) nameLabel.textContent = 'Full Name';
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create My Driver Account';
        if (submitBtn) submitBtn.className = 'auth-btn';
      } else {
        if (nameLabel) nameLabel.textContent = 'Your Name (or Company Name)';
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-building"></i> Create My Company Account';
        if (submitBtn) submitBtn.className = 'auth-btn blue-btn';
      }

      // Show step 2
      const chooser = document.getElementById('role-chooser');
      const formWrapper = document.getElementById('auth-form-wrapper');
      if (chooser) chooser.classList.add('hidden');
      if (formWrapper) formWrapper.classList.add('on');

      this.switchTab('signup');
      this.clearError();
    },

    backToRoleChooser() {
      this.showRoleChooser();
    },

    // --- TAB SWITCHING ---
    switchTab(tabName) {
      document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.toggle('on', tab.dataset.tab === tabName);
      });
      document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.toggle('on', form.id === tabName + '-form');
      });

      const footerText = document.getElementById('auth-footer-text');
      const roleBadge = document.getElementById('auth-role-badge');
      if (footerText) {
        if (tabName === 'signin') {
          footerText.innerHTML = 'Don\'t have an account? <a class="auth-link" onclick="authUI.switchTab(\'signup\')">Create one</a>';
          if (roleBadge) roleBadge.style.display = 'none';
        } else {
          footerText.innerHTML = 'Already have an account? <a class="auth-link" onclick="authUI.switchTab(\'signin\')">Sign in</a>';
          if (roleBadge) roleBadge.style.display = 'inline-flex';
        }
      }
      this.clearError();
    },

    // --- SIGN IN ---
    async handleSignIn(event) {
      event.preventDefault();
      const email = document.getElementById('signin-email').value.trim();
      const password = document.getElementById('signin-password').value;

      if (!email || !password) {
        this.showError('Please fill in all fields');
        return;
      }

      this.setLoading(true);
      this.clearError();

      try {
        const { user } = await dlAuth.signIn(email, password);
        console.log('[Auth] Sign in successful:', user.email);
        this.currentUser = user;
        this.showApp();
      } catch (error) {
        console.error('[Auth] Sign in failed:', error.message);
        this.showError(error.message || 'Failed to sign in. Check your email and password.');
      } finally {
        this.setLoading(false);
      }
    },

    // --- SIGN UP ---
    async handleSignUp(event) {
      event.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const role = document.getElementById('signup-role').value;

      if (!name || !email || !password || !role) {
        this.showError('Please fill in all fields');
        return;
      }

      if (password.length < 6) {
        this.showError('Password must be at least 6 characters');
        return;
      }

      this.setLoading(true);
      this.clearError();

      try {
        const { user } = await dlAuth.signUp(email, password, role, name);
        console.log('[Auth] Sign up successful:', user.email);
        this.currentUser = user;
        this.showApp();

        // Redirect to profile setup based on role
        if (typeof go === 'function') {
          setTimeout(() => go(role === 'driver' ? 'profile' : 'fleet'), 500);
        }
      } catch (error) {
        console.error('[Auth] Sign up failed:', error.message);
        this.showError(error.message || 'Failed to create account. Try a different email.');
      } finally {
        this.setLoading(false);
      }
    },

    // --- SIGN OUT ---
    async handleSignOut() {
      this.setLoading(true);
      try {
        await dlAuth.signOut();
        this.currentUser = null;
        this.hideApp();
        // Don't auto-show auth screen, let user browse
      } catch (error) {
        console.error('[Auth] Sign out failed:', error.message);
      } finally {
        this.setLoading(false);
      }
    },

    // --- GUEST MODE ---
    continueAsGuest() {
      console.log('[Auth] Continuing as guest');
      document.getElementById('auth-screen').classList.remove('on');
      const homeScreen = document.getElementById('home');
      if (homeScreen) homeScreen.classList.add('on');
    },

    // --- PASSWORD STRENGTH ---
    updatePasswordStrength(password) {
      const strengthDisplay = document.getElementById('password-strength');
      const strengthText = document.getElementById('strength-text');
      const bars = document.querySelectorAll('.strength-bar');

      if (!strengthDisplay) return;

      if (password.length === 0) {
        strengthDisplay.style.display = 'none';
        strengthText.textContent = '';
        return;
      }

      strengthDisplay.style.display = 'flex';

      let strength = 0;
      if (password.length >= 8) strength++;
      if (password.length >= 12) strength++;
      if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;

      const strengthLevel = Math.min(Math.ceil(strength / 1.25), 4);
      const strengthName = ['weak', 'fair', 'good', 'strong'][strengthLevel - 1] || 'weak';

      bars.forEach((bar, index) => {
        bar.className = 'strength-bar';
        if (index < strengthLevel) bar.classList.add(strengthName);
      });

      strengthText.className = 'strength-text ' + strengthName;
      const labels = { weak: 'Weak password', fair: 'Fair password', good: 'Good password', strong: 'Strong password' };
      strengthText.textContent = labels[strengthName] || 'Weak password';
    },

    // --- FORGOT PASSWORD ---
    showForgotPassword() {
      this.showError('Password reset coming soon. Contact support for help.');
    },

    // --- UI HELPERS ---
    showError(message) {
      const errorEl = document.getElementById('auth-error');
      const errorMsg = document.getElementById('auth-error-msg');
      if (errorEl && errorMsg) {
        errorMsg.textContent = message;
        errorEl.classList.add('on');
      }
    },

    clearError() {
      const errorEl = document.getElementById('auth-error');
      if (errorEl) errorEl.classList.remove('on');
    },

    setLoading(isLoading) {
      const signinBtn = document.querySelector('#signin-form button[type="submit"]');
      const signupBtn = document.querySelector('#signup-form button[type="submit"]');

      [signinBtn, signupBtn].forEach(btn => {
        if (btn) {
          btn.disabled = isLoading;
          btn.classList.toggle('loading', isLoading);
          if (isLoading) {
            btn.dataset.originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
          } else if (btn.dataset.originalHtml) {
            btn.innerHTML = btn.dataset.originalHtml;
          }
        }
      });
    },

    // --- NAV BAR UPDATE ---
    updateNavBar() {
      if (!this.currentUser) return;

      const initials = this.currentUser.user_metadata?.full_name
        ? this.currentUser.user_metadata.full_name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : this.currentUser.email[0].toUpperCase();

      const fullName = this.currentUser.user_metadata?.full_name || 'User';
      const role = this.currentUser.user_metadata?.role || 'driver';

      // Remove existing menus
      const existingMenu = document.querySelector('.user-menu');
      if (existingMenu) existingMenu.remove();
      const existingBtns = document.querySelector('.nav-auth-btns');
      if (existingBtns) existingBtns.remove();

      const userMenuHTML = document.createElement('div');
      userMenuHTML.className = 'user-menu';
      userMenuHTML.innerHTML =
        '<div class="user-avatar" onclick="authUI.toggleDropdown()">' + initials + '</div>' +
        '<div class="user-name">' +
          '<span class="un-primary">' + fullName.split(' ')[0] + '</span>' +
          '<span class="un-secondary">' + (role === 'driver' ? 'Driver' : 'Company') + '</span>' +
        '</div>' +
        '<div class="user-dropdown" id="user-dropdown">' +
          '<button class="user-dropdown-item" onclick="go(\'profile\')"><i class="fas fa-id-card"></i> My Profile</button>' +
          '<div class="user-dropdown-divider"></div>' +
          '<button class="user-dropdown-item danger" onclick="authUI.handleSignOut()"><i class="fas fa-sign-out-alt"></i> Sign Out</button>' +
        '</div>';

      const navInner = document.querySelector('.nav-inner');
      if (navInner) {
        navInner.appendChild(userMenuHTML);
      }
    },

    toggleDropdown() {
      const dropdown = document.getElementById('user-dropdown');
      if (dropdown) dropdown.classList.toggle('on');
    }
  };

  // =========================================================================
  // 5. AUTO-INITIALIZE
  // =========================================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => authUI.init());
  } else {
    setTimeout(() => authUI.init(), 100);
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu && !userMenu.contains(event.target)) {
      const dropdown = document.getElementById('user-dropdown');
      if (dropdown) dropdown.classList.remove('on');
    }
  });

  // Close auth screen with Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const authScreen = document.getElementById('auth-screen');
      if (authScreen && authScreen.classList.contains('on')) {
        authUI.continueAsGuest();
      }
    }
  });

  console.log('[Auth] DriverLink Auth UI v2 module loaded');

})();
