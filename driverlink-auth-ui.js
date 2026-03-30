/**
 * DriverLink Auth UI - Self-Injecting Module
 *
 * This script dynamically injects the authentication UI (login/signup screens)
 * into the DriverLink app. It adds CSS, HTML, and JavaScript without needing
 * to modify the main HTML file beyond adding this script tag.
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
/* ===== AUTHENTICATION SCREENS ===== */
.auth-screen {
  position: fixed;
  inset: 0;
  background: var(--bg);
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
  max-width: 420px;
  width: 100%;
  box-shadow: var(--sh-lg);
  animation: authSlideUp 0.3s ease-out;
}
@keyframes authSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--brd);
}
.auth-header .auth-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--txt);
  margin-bottom: 0.5rem;
}
.auth-header .auth-logo i {
  color: var(--green);
  font-size: 1.3rem;
  filter: drop-shadow(0 0 8px rgba(0, 255, 136, 0.4));
}
.auth-header .auth-tagline {
  font-size: 0.75rem;
  color: var(--green);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.auth-header .auth-subtitle {
  font-size: 0.85rem;
  color: var(--txt2);
  margin-top: 0.5rem;
}

/* Tab toggle */
.auth-tabs {
  display: flex;
  gap: 2px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 1.5rem;
}
.auth-tab {
  flex: 1;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--txt2);
  background: transparent;
  border: none;
  font-family: inherit;
}
.auth-tab:hover { color: var(--txt); background: rgba(255, 255, 255, 0.03); }
.auth-tab.on {
  background: var(--green);
  color: #0b0f1a;
  font-weight: 700;
  box-shadow: 0 0 12px rgba(0, 255, 136, 0.3);
}

/* Forms */
.auth-form { display: none; }
.auth-form.on { display: block; animation: authFadeIn 0.2s ease-out; }
@keyframes authFadeIn { from { opacity: 0; } to { opacity: 1; } }

.form-group { margin-bottom: 1.25rem; }
.form-group label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--txt);
  margin-bottom: 0.4rem;
}
.form-group .form-hint {
  font-size: 0.7rem;
  color: var(--txt3);
  font-weight: 500;
}

.auth-input {
  width: 100%;
  padding: 0.65rem 0.85rem;
  background: rgba(255, 255, 255, 0.04);
  border: 2px solid var(--brd);
  border-radius: 8px;
  color: var(--txt);
  font-size: 0.9rem;
  font-family: inherit;
  transition: all 0.15s;
  box-sizing: border-box;
}
.auth-input::placeholder { color: var(--txt3); }
.auth-input:focus {
  outline: none;
  border-color: var(--green);
  background: rgba(0, 255, 136, 0.04);
  box-shadow: 0 0 16px rgba(0, 255, 136, 0.1);
}
.auth-input.error {
  border-color: var(--red);
  background: rgba(255, 71, 87, 0.04);
}

/* Password strength */
.password-strength { margin-top: 0.5rem; display: flex; gap: 3px; }
.strength-bar {
  flex: 1; height: 3px;
  background: var(--brd);
  border-radius: 99px;
  transition: background 0.3s;
}
.strength-bar.weak { background: var(--red); }
.strength-bar.fair { background: var(--amber); }
.strength-bar.good { background: var(--blue); }
.strength-bar.strong { background: var(--green); }
.strength-text { font-size: 0.68rem; color: var(--txt3); margin-top: 0.3rem; display: block; }
.strength-text.weak { color: var(--red); }
.strength-text.fair { color: var(--amber); }
.strength-text.good { color: var(--blue); }
.strength-text.strong { color: var(--green); }

/* Role selector */
.role-selector { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; }
.role-btn {
  flex: 1; padding: 0.75rem;
  border: 2px solid var(--brd);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  color: var(--txt);
  font-size: 0.82rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  font-family: inherit;
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
}
.role-btn:hover {
  border-color: rgba(0, 255, 136, 0.3);
  background: rgba(0, 255, 136, 0.04);
  color: var(--green);
}
.role-btn.driver.on {
  border-color: var(--green);
  background: rgba(0, 255, 136, 0.1);
  color: var(--green);
  box-shadow: 0 0 12px rgba(0, 255, 136, 0.15);
}
.role-btn.fleet.on {
  border-color: var(--blue);
  background: rgba(59, 130, 246, 0.1);
  color: var(--blue);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.15);
}

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
.auth-btn:hover:not(:disabled) {
  background: #00ffaa;
  transform: translateY(-1px);
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
}
.auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-btn.loading { pointer-events: none; opacity: 0.7; }

/* Error */
.auth-error {
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.3);
  border-radius: 8px;
  padding: 0.75rem 0.85rem;
  margin-bottom: 1.25rem;
  color: var(--red);
  font-size: 0.82rem;
  display: none;
  animation: authSlideDown 0.2s ease-out;
}
.auth-error.on { display: block; }
@keyframes authSlideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.auth-error i { margin-right: 0.4rem; }

/* Divider */
.auth-divider {
  display: flex; align-items: center; gap: 0.75rem;
  margin: 1.25rem 0; color: var(--txt3); font-size: 0.8rem;
}
.auth-divider::before, .auth-divider::after {
  content: ''; flex: 1; height: 1px; background: var(--brd);
}

/* Links */
.auth-link {
  display: inline; color: var(--green); cursor: pointer;
  text-decoration: none; font-weight: 600; font-size: 0.8rem;
  transition: all 0.15s; border: none; background: none;
  padding: 0; font-family: inherit;
}
.auth-link:hover { text-decoration: underline; opacity: 0.8; }

.auth-footer {
  text-align: center; margin-top: 1.5rem;
  padding-top: 1.5rem; border-top: 1px solid var(--brd);
}
.auth-footer p { font-size: 0.8rem; color: var(--txt2); }
.auth-footer .auth-link { margin-left: 0.25rem; }

.guest-link {
  display: block; margin-top: 1rem; padding: 0.6rem;
  text-align: center; color: var(--txt2); font-size: 0.82rem;
  border: 1px solid var(--brd); border-radius: 8px;
  cursor: pointer; transition: all 0.15s;
  background: rgba(255, 255, 255, 0.02); text-decoration: none;
}
.guest-link:hover {
  border-color: rgba(0, 255, 136, 0.2);
  color: var(--green);
  background: rgba(0, 255, 136, 0.04);
}

/* User menu */
.user-menu {
  display: flex; align-items: center; gap: 0.75rem; position: relative;
}
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

.nav-sign-in {
  padding: 0.5rem 1rem; background: var(--green); color: #0b0f1a;
  border: none; border-radius: 6px; font-size: 0.82rem; font-weight: 700;
  cursor: pointer; transition: all 0.15s; font-family: inherit;
}
.nav-sign-in:hover {
  background: #00ffaa; transform: translateY(-1px);
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
}
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'driverlink-auth-css';
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
      <div class="auth-subtitle">Sign in or create your account to get started</div>
    </div>

    <div class="auth-tabs">
      <button class="auth-tab on" data-tab="signin" onclick="authUI.switchTab('signin')">
        <i class="fas fa-sign-in-alt"></i> Sign In
      </button>
      <button class="auth-tab" data-tab="signup" onclick="authUI.switchTab('signup')">
        <i class="fas fa-user-plus"></i> Sign Up
      </button>
    </div>

    <div id="auth-error" class="auth-error">
      <i class="fas fa-exclamation-circle"></i>
      <span id="auth-error-msg"></span>
    </div>

    <!-- SIGN IN FORM -->
    <form id="signin-form" class="auth-form on" onsubmit="authUI.handleSignIn(event)">
      <div class="form-group">
        <label for="signin-email">Email Address</label>
        <input type="email" id="signin-email" class="auth-input" placeholder="you@example.com" required>
      </div>
      <div class="form-group">
        <label for="signin-password">Password</label>
        <input type="password" id="signin-password" class="auth-input" placeholder="••••••••" required>
      </div>
      <button type="submit" class="auth-btn">
        <i class="fas fa-sign-in-alt"></i> Sign In
      </button>
      <div style="text-align: center; font-size: 0.8rem; color: var(--txt2);">
        <a class="auth-link" onclick="authUI.showForgotPassword()">Forgot password?</a>
      </div>
    </form>

    <!-- SIGN UP FORM -->
    <form id="signup-form" class="auth-form" onsubmit="authUI.handleSignUp(event)">
      <div class="form-group">
        <label for="signup-name">Full Name</label>
        <input type="text" id="signup-name" class="auth-input" placeholder="John Doe" required>
      </div>
      <div class="form-group">
        <label for="signup-email">Email Address</label>
        <input type="email" id="signup-email" class="auth-input" placeholder="you@example.com" required>
      </div>
      <div class="form-group">
        <label for="signup-password">Password</label>
        <input type="password" id="signup-password" class="auth-input" placeholder="••••••••" minlength="6" required oninput="authUI.updatePasswordStrength(this.value)">
        <div class="password-strength" id="password-strength" style="display: none;">
          <div class="strength-bar"></div>
          <div class="strength-bar"></div>
          <div class="strength-bar"></div>
          <div class="strength-bar"></div>
        </div>
        <span class="strength-text" id="strength-text"></span>
      </div>
      <div class="form-group">
        <label>What's your role?</label>
        <div class="role-selector">
          <button type="button" class="role-btn driver on" data-role="driver" onclick="authUI.selectRole('driver')">
            <i class="fas fa-steering-wheel"></i> Driver
          </button>
          <button type="button" class="role-btn fleet" data-role="fleet_owner" onclick="authUI.selectRole('fleet_owner')">
            <i class="fas fa-building"></i> Fleet Owner
          </button>
        </div>
        <input type="hidden" id="signup-role" value="driver">
      </div>
      <button type="submit" class="auth-btn">
        <i class="fas fa-user-plus"></i> Create Account
      </button>
    </form>

    <div class="auth-footer">
      <p id="auth-footer-text">
        Don't have an account? <a class="auth-link" onclick="authUI.switchTab('signup')">Sign up</a>
      </p>
    </div>

    <a class="guest-link" onclick="authUI.continueAsGuest()">
      <i class="fas fa-eye"></i> Continue as Guest (Demo Mode)
    </a>
  </div>
</div>
`;

  // Insert auth screen as the first child of <body>
  const authContainer = document.createElement('div');
  authContainer.innerHTML = authHTML;
  document.body.insertBefore(authContainer.firstElementChild, document.body.firstChild);

  // =========================================================================
  // 3. AUTH UI CONTROLLER
  // =========================================================================

  window.authUI = {
    currentUser: null,
    selectedRole: 'driver',

    // --- INITIALIZATION ---
    async init() {
      console.log('[Auth] Initializing auth UI...');

      // Check if Supabase is in demo mode — if so, skip auth check
      if (window.DL_DEMO_MODE) {
        console.log('[Auth] Demo mode active, skipping auth check');
        return;
      }

      // Check if dlAuth exists (supabase-client.js loaded)
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
          this.showAuthScreen();
        }

        // Listen for auth state changes
        dlAuth.onAuthChange((event, session) => {
          console.log('[Auth] Auth state changed:', event);
          if (event === 'SIGNED_IN') {
            this.currentUser = session.user;
            this.showApp();
          } else if (event === 'SIGNED_OUT') {
            this.currentUser = null;
            this.showAuthScreen();
          }
        });
      } catch (error) {
        console.error('[Auth] Error during init:', error);
        // Don't block the app if auth check fails
      }
    },

    // --- SCREEN MANAGEMENT ---
    showAuthScreen() {
      console.log('[Auth] Showing auth screen');
      const authScreen = document.getElementById('auth-screen');
      if (authScreen) authScreen.classList.add('on');
    },

    showApp() {
      console.log('[Auth] Showing app');
      const authScreen = document.getElementById('auth-screen');
      if (authScreen) authScreen.classList.remove('on');

      const homeScreen = document.getElementById('home');
      if (homeScreen) homeScreen.classList.add('on');

      this.updateNavBar();

      // Hide alpha modal if logged in
      const alphaModal = document.getElementById('alpha-modal');
      if (alphaModal && alphaModal.classList.contains('on')) {
        alphaModal.classList.remove('on');
      }
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
      if (footerText) {
        if (tabName === 'signin') {
          footerText.innerHTML = 'Don\'t have an account? <a class="auth-link" onclick="authUI.switchTab(\'signup\')">Sign up</a>';
        } else {
          footerText.innerHTML = 'Already have an account? <a class="auth-link" onclick="authUI.switchTab(\'signin\')">Sign in</a>';
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
        this.showAuthScreen();
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

    // --- ROLE SELECTION ---
    selectRole(role) {
      this.selectedRole = role;
      document.getElementById('signup-role').value = role;
      document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.toggle('on', btn.dataset.role === role);
      });
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

      // Remove existing user menu if any
      const existingMenu = document.querySelector('.user-menu');
      if (existingMenu) existingMenu.remove();

      const userMenuHTML = document.createElement('div');
      userMenuHTML.className = 'user-menu';
      userMenuHTML.innerHTML =
        '<div class="user-avatar" onclick="authUI.toggleDropdown()">' + initials + '</div>' +
        '<div class="user-name">' +
          '<span class="un-primary">' + fullName.split(' ')[0] + '</span>' +
          '<span class="un-secondary">' + (role === 'driver' ? 'Driver' : 'Fleet Owner') + '</span>' +
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
  // 4. AUTO-INITIALIZE
  // =========================================================================

  // Initialize when DOM is ready, or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => authUI.init());
  } else {
    // Small delay to ensure other scripts (supabase-client, backend-wiring) have initialized
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

  console.log('[Auth] DriverLink Auth UI module loaded');

})();
