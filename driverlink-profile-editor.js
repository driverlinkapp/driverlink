/**
 * DriverLink Profile Editor v3 — Self-Injecting Module
 *
 * Fixes:
 * - Uses dlProfiles + dlAuth directly (bypasses broken dlProfileEngine)
 * - Replaces ALL hardcoded fake profile data with real Supabase data
 * - Shows empty states when no data exists (no fake companies, views, etc.)
 * - Loads real profile on page navigation
 *
 * Load AFTER supabase-client.js, driverlink-backend-wiring.js, driverlink-auth-ui.js
 */

(function() {
  'use strict';

  // =========================================================================
  // 1. INJECT CSS
  // =========================================================================

  const css = `
/* Edit Profile Button */
.profile-edit-btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 1.2rem; margin-top: 0.75rem;
  background: rgba(0, 255, 136, 0.08); color: var(--green);
  border: 1px solid rgba(0, 255, 136, 0.25); border-radius: 8px;
  font-size: 0.82rem; font-weight: 700; cursor: pointer;
  transition: all 0.2s; font-family: inherit;
}
.profile-edit-btn:hover {
  background: rgba(0, 255, 136, 0.15); border-color: var(--green);
  transform: translateY(-1px); box-shadow: 0 0 16px rgba(0, 255, 136, 0.15);
}

/* Edit Modal Overlay */
.profile-edit-overlay {
  position: fixed; inset: 0; z-index: 900;
  background: rgba(11, 15, 26, 0.88); backdrop-filter: blur(8px);
  display: none; align-items: flex-start; justify-content: center;
  padding: 2rem 1rem; overflow-y: auto;
}
.profile-edit-overlay.on { display: flex; }

/* Edit Panel */
.profile-edit-panel {
  background: var(--surf); border: 1px solid var(--brd);
  border-radius: 12px; max-width: 540px; width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: peSlideUp 0.3s ease-out;
}
@keyframes peSlideUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}

.pe-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--brd);
}
.pe-header h3 {
  font-size: 1.05rem; font-weight: 800; color: var(--txt); margin: 0;
  display: flex; align-items: center; gap: 0.4rem;
}
.pe-header h3 i { color: var(--green); }
.pe-close {
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(255,255,255,0.04); border: 1px solid var(--brd);
  color: var(--txt2); font-size: 0.9rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.pe-close:hover { background: rgba(255, 71, 87, 0.1); color: var(--red); border-color: rgba(255, 71, 87, 0.3); }

.pe-body { padding: 1.5rem; }

.pe-section { margin-bottom: 1.5rem; }
.pe-section-title {
  font-size: 0.72rem; font-weight: 700; color: var(--green);
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 0.75rem; padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(0,255,136,0.1);
}

.pe-field { margin-bottom: 1rem; }
.pe-field label {
  display: block; font-size: 0.78rem; font-weight: 600;
  color: var(--txt); margin-bottom: 0.3rem;
}
.pe-field .pe-hint {
  font-size: 0.68rem; color: var(--txt3); font-weight: 400; margin-left: 0.3rem;
}

.pe-input, .pe-select, .pe-textarea {
  width: 100%; padding: 0.6rem 0.75rem;
  background: rgba(255,255,255,0.04); border: 2px solid var(--brd);
  border-radius: 8px; color: var(--txt); font-size: 0.85rem;
  font-family: inherit; transition: all 0.15s; box-sizing: border-box;
}
.pe-input:focus, .pe-select:focus, .pe-textarea:focus {
  outline: none; border-color: var(--green);
  background: rgba(0,255,136,0.04); box-shadow: 0 0 12px rgba(0,255,136,0.08);
}
.pe-textarea { min-height: 80px; resize: vertical; }
.pe-select { cursor: pointer; }
.pe-select option { background: var(--surf); color: var(--txt); }

.pe-row { display: flex; gap: 0.75rem; }
.pe-row .pe-field { flex: 1; }

/* Toggle */
.pe-toggle {
  display: flex; align-items: center; gap: 0.6rem;
  cursor: pointer; padding: 0.5rem 0;
}
.pe-toggle-track {
  width: 40px; height: 22px; border-radius: 99px;
  background: var(--brd); position: relative; transition: background 0.2s;
  flex-shrink: 0;
}
.pe-toggle-track.on { background: var(--green); }
.pe-toggle-thumb {
  width: 18px; height: 18px; border-radius: 50%;
  background: #fff; position: absolute; top: 2px; left: 2px;
  transition: transform 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
.pe-toggle-track.on .pe-toggle-thumb { transform: translateX(18px); }
.pe-toggle-label { font-size: 0.82rem; font-weight: 600; color: var(--txt); }
.pe-toggle-sub { font-size: 0.7rem; color: var(--txt3); }

/* Footer */
.pe-footer {
  display: flex; gap: 0.75rem; padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--brd);
}
.pe-btn-cancel {
  flex: 1; padding: 0.6rem; border-radius: 8px;
  background: rgba(255,255,255,0.04); border: 1px solid var(--brd);
  color: var(--txt2); font-size: 0.85rem; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: all 0.15s;
}
.pe-btn-cancel:hover { border-color: var(--txt2); color: var(--txt); }

.pe-btn-save {
  flex: 2; padding: 0.6rem; border-radius: 8px;
  background: var(--green); border: none; color: #0b0f1a;
  font-size: 0.85rem; font-weight: 700; cursor: pointer;
  font-family: inherit; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 0.3rem;
}
.pe-btn-save:hover { background: #00ffaa; box-shadow: 0 0 20px rgba(0,255,136,0.3); }
.pe-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* Toast notification */
.pe-toast {
  position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
  background: var(--green); color: #0b0f1a; padding: 0.65rem 1.5rem;
  border-radius: 8px; font-size: 0.85rem; font-weight: 700;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 999;
  animation: peToast 3s ease-in-out forwards;
  display: flex; align-items: center; gap: 0.4rem;
}
@keyframes peToast {
  0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
  10% { opacity: 1; transform: translateX(-50%) translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
}

/* Empty state for profile sections */
.profile-empty-state {
  text-align: center; padding: 2rem 1rem; color: var(--txt3);
  font-size: 0.85rem;
}
.profile-empty-state i { font-size: 1.5rem; margin-bottom: 0.5rem; display: block; opacity: 0.4; }

/* Not logged in state */
.profile-login-prompt {
  text-align: center; padding: 3rem 1rem; color: var(--txt2);
}
.profile-login-prompt h3 { color: var(--green); margin-bottom: 0.5rem; }
.profile-login-prompt p { font-size: 0.9rem; margin-bottom: 1.5rem; }
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'driverlink-profile-editor-css';
  const old = document.getElementById('driverlink-profile-editor-css');
  if (old) old.remove();
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // =========================================================================
  // 2. SPECIALTIES LIST
  // =========================================================================

  const SPECIALTIES = [
    'OTR', 'Local', 'Regional', 'Hazmat', 'Tanker',
    'Flatbed', 'Refrigerated', 'Propane', 'Fuel', 'Chemical',
    'LPG', 'Dry Van', 'Intermodal', 'Heavy Haul', 'Other'
  ];

  // =========================================================================
  // 3. BUILD EDIT MODAL HTML
  // =========================================================================

  function buildDriverForm() {
    return `
      <div class="pe-section">
        <div class="pe-section-title">Basic Info</div>
        <div class="pe-field">
          <label for="pe-fullname">Full Name</label>
          <input type="text" id="pe-fullname" class="pe-input" placeholder="Your full name">
        </div>
        <div class="pe-field">
          <label for="pe-specialty">Specialty</label>
          <select id="pe-specialty" class="pe-select">
            <option value="">Select your specialty...</option>
            ${SPECIALTIES.map(s => '<option value="' + s + '">' + s + '</option>').join('')}
          </select>
        </div>
        <div class="pe-row">
          <div class="pe-field">
            <label for="pe-experience">Years Experience</label>
            <input type="number" id="pe-experience" class="pe-input" min="0" max="50" placeholder="0">
          </div>
          <div class="pe-field">
            <label for="pe-license">CDL Number <span class="pe-hint">(optional)</span></label>
            <input type="text" id="pe-license" class="pe-input" placeholder="License #">
          </div>
        </div>
      </div>
      <div class="pe-section">
        <div class="pe-section-title">Contact & Location</div>
        <div class="pe-row">
          <div class="pe-field">
            <label for="pe-phone">Phone</label>
            <input type="tel" id="pe-phone" class="pe-input" placeholder="(555) 123-4567">
          </div>
          <div class="pe-field">
            <label for="pe-address">Location</label>
            <input type="text" id="pe-address" class="pe-input" placeholder="City, State">
          </div>
        </div>
      </div>
      <div class="pe-section">
        <div class="pe-section-title">About You</div>
        <div class="pe-field">
          <label for="pe-bio">Bio <span class="pe-hint">(tell companies about yourself)</span></label>
          <textarea id="pe-bio" class="pe-textarea" placeholder="I'm an experienced hauler specializing in..."></textarea>
        </div>
      </div>
      <div class="pe-section">
        <div class="pe-section-title">Visibility</div>
        <div class="pe-toggle" onclick="profileEditor.togglePublic()">
          <div class="pe-toggle-track" id="pe-public-toggle">
            <div class="pe-toggle-thumb"></div>
          </div>
          <div>
            <div class="pe-toggle-label">Public Profile</div>
            <div class="pe-toggle-sub">Companies can find you in search results</div>
          </div>
        </div>
      </div>
    `;
  }

  function buildCompanyForm() {
    return `
      <div class="pe-section">
        <div class="pe-section-title">Company Info</div>
        <div class="pe-field">
          <label for="pe-companyname">Company Name</label>
          <input type="text" id="pe-companyname" class="pe-input" placeholder="Your company name">
        </div>
        <div class="pe-row">
          <div class="pe-field">
            <label for="pe-fleetsize">Fleet Size</label>
            <input type="number" id="pe-fleetsize" class="pe-input" min="0" placeholder="Number of trucks">
          </div>
          <div class="pe-field">
            <label for="pe-website">Website <span class="pe-hint">(optional)</span></label>
            <input type="url" id="pe-website" class="pe-input" placeholder="https://yourcompany.com">
          </div>
        </div>
      </div>
      <div class="pe-section">
        <div class="pe-section-title">Contact & Location</div>
        <div class="pe-row">
          <div class="pe-field">
            <label for="pe-phone">Phone</label>
            <input type="tel" id="pe-phone" class="pe-input" placeholder="(555) 123-4567">
          </div>
          <div class="pe-field">
            <label for="pe-address">Location</label>
            <input type="text" id="pe-address" class="pe-input" placeholder="City, State">
          </div>
        </div>
      </div>
      <div class="pe-section">
        <div class="pe-section-title">About Your Company</div>
        <div class="pe-field">
          <label for="pe-bio">Description <span class="pe-hint">(tell drivers about your company)</span></label>
          <textarea id="pe-bio" class="pe-textarea" placeholder="We're a fleet specializing in..."></textarea>
        </div>
      </div>
      <div class="pe-section">
        <div class="pe-section-title">Visibility</div>
        <div class="pe-toggle" onclick="profileEditor.togglePublic()">
          <div class="pe-toggle-track" id="pe-public-toggle">
            <div class="pe-toggle-thumb"></div>
          </div>
          <div>
            <div class="pe-toggle-label">Public Profile</div>
            <div class="pe-toggle-sub">Drivers can find your company in search results</div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 4. INJECT MODAL INTO DOM
  // =========================================================================

  const overlayHTML = `
    <div id="profile-edit-overlay" class="profile-edit-overlay">
      <div class="profile-edit-panel">
        <div class="pe-header">
          <h3><i class="fas fa-pen"></i> Edit Profile</h3>
          <button class="pe-close" onclick="profileEditor.close()"><i class="fas fa-times"></i></button>
        </div>
        <div class="pe-body" id="pe-form-body">
        </div>
        <div class="pe-footer">
          <button class="pe-btn-cancel" onclick="profileEditor.close()">Cancel</button>
          <button class="pe-btn-save" id="pe-save-btn" onclick="profileEditor.save()">
            <i class="fas fa-check"></i> Save Changes
          </button>
        </div>
      </div>
    </div>
  `;

  // Remove old overlay if present
  const oldOverlay = document.getElementById('profile-edit-overlay');
  if (oldOverlay) oldOverlay.remove();

  const overlayContainer = document.createElement('div');
  overlayContainer.innerHTML = overlayHTML;
  document.body.appendChild(overlayContainer.firstElementChild);

  // =========================================================================
  // 5. INJECT EDIT BUTTON INTO PROFILE PAGE
  // =========================================================================

  function injectEditButton() {
    const profileHead = document.querySelector('#profile .profile-head');
    if (!profileHead) return;

    const existing = profileHead.querySelector('.profile-edit-btn');
    if (existing) return;

    // Find or create the button container (the div with status pill)
    let btnContainer = profileHead.querySelector('.status-pill');
    if (btnContainer) btnContainer = btnContainer.parentElement;
    else btnContainer = profileHead;

    const btn = document.createElement('button');
    btn.className = 'profile-edit-btn';
    btn.innerHTML = '<i class="fas fa-pen"></i> Edit Profile';
    btn.onclick = function() { profileEditor.open(); };
    btnContainer.appendChild(btn);
  }

  // =========================================================================
  // 6. REPLACE HARDCODED PROFILE DATA WITH REAL DATA
  // =========================================================================

  async function loadRealProfileData() {
    // Check if user is logged in
    let user = null;
    try {
      if (typeof dlAuth !== 'undefined' && dlAuth.getUser) {
        user = await dlAuth.getUser();
      }
    } catch(e) {
      console.warn('[ProfileEditor] Could not get user:', e);
    }

    if (!user || !user.id) {
      showNotLoggedInState();
      return null;
    }

    // Determine role
    const role = (user.user_metadata && user.user_metadata.role) || 'driver';
    const isCompany = role === 'fleet_owner';

    // Load profile from Supabase directly via dlProfiles
    let profile = null;
    try {
      if (isCompany && typeof dlProfiles !== 'undefined') {
        profile = await dlProfiles.getCompanyProfile(user.id);
      } else if (typeof dlProfiles !== 'undefined') {
        profile = await dlProfiles.getDriverProfile(user.id);
      }
    } catch(e) {
      console.warn('[ProfileEditor] Could not load profile:', e);
    }

    // Update the profile page with real data
    updateProfilePageWithRealData(profile, isCompany, user);
    return profile;
  }

  function showNotLoggedInState() {
    const profileContainer = document.querySelector('#profile .profile');
    if (!profileContainer) return;

    profileContainer.innerHTML = `
      <div class="profile-login-prompt">
        <h3><i class="fas fa-user-circle"></i> Your Profile</h3>
        <p>Sign in or create an account to build your professional profile.</p>
        <button class="btn btn-g" onclick="if(window.authUI) authUI.show('signup'); else document.querySelector('.auth-signup-btn')?.click();">
          <i class="fas fa-user-plus"></i> Create Your Profile
        </button>
      </div>
    `;
  }

  function updateProfilePageWithRealData(profile, isCompany, user) {
    const data = profile || {};

    // --- Profile Head ---
    const nameEl = document.querySelector('#profile .profile-name');
    const titleEl = document.querySelector('#profile .profile-title');
    const avatarEl = document.querySelector('#profile .avatar-lg');

    if (isCompany) {
      if (nameEl) nameEl.textContent = data.company_name || 'My Company';
      if (titleEl) titleEl.textContent = data.bio ? data.bio.substring(0, 60) : 'Fleet Owner';
    } else {
      const name = data.full_name || (user.user_metadata && user.user_metadata.full_name) || 'Driver';
      if (nameEl) nameEl.textContent = name;

      const parts = [];
      if (data.specialty) parts.push(data.specialty + ' Driver');
      if (data.address) parts.push(data.address);
      if (titleEl) titleEl.textContent = parts.length > 0 ? parts.join(' \u00b7 ') : 'Complete your profile to get started';

      // Update avatar initials
      if (avatarEl) {
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        avatarEl.textContent = initials;
      }
    }

    // --- Badges: only show earned ones ---
    const badgesEl = document.querySelector('#profile .profile-badges');
    if (badgesEl) {
      const badges = [];
      if (data.license_number) badges.push('<span class="badge badge-green"><i class="fas fa-shield-alt"></i> CDL Verified</span>');
      if (data.years_experience && data.years_experience >= 5) badges.push('<span class="badge badge-blue"><i class="fas fa-clock"></i> ' + data.years_experience + 'yr Veteran</span>');
      if (data.specialty && data.specialty.toLowerCase().includes('hazmat')) badges.push('<span class="badge badge-purple"><i class="fas fa-biohazard"></i> HAZMAT</span>');

      if (badges.length === 0) {
        badgesEl.innerHTML = '<span style="color:var(--txt3);font-size:0.78rem;">Complete your profile to earn badges</span>';
      } else {
        badgesEl.innerHTML = badges.join(' ');
      }
    }

    // --- Stats ---
    const statsEls = document.querySelectorAll('#profile .ps-n');
    const statsLabels = document.querySelectorAll('#profile .ps-l');
    if (statsEls.length >= 3) {
      statsEls[0].textContent = '-'; // Driver score - not implemented yet
      statsLabels[0].textContent = 'Score';
      statsEls[1].textContent = data.years_experience || '0';
      statsLabels[1].textContent = 'Yrs Exp';
      statsEls[2].textContent = '0';
      statsLabels[2].textContent = 'Incidents';
    }

    // --- Profile Views: REAL data only (empty for now) ---
    const viewsSection = document.getElementById('profile-views-section');
    if (viewsSection) {
      const viewCountBadge = document.getElementById('view-count-badge');
      const viewsList = document.getElementById('profile-views-list');

      if (viewCountBadge) viewCountBadge.textContent = '0 views';
      if (viewsList) {
        viewsList.innerHTML = '<div class="profile-empty-state"><i class="fas fa-eye-slash"></i>No profile views yet. Make your profile public and complete it to get noticed by companies.</div>';
      }

      // Remove the chart if it exists (it's fake)
      const chart = document.getElementById('profile-views-chart');
      if (chart) chart.style.display = 'none';
    }

    // --- Credentials section: show real or empty ---
    const credSection = document.querySelectorAll('#profile .profile-section')[1];
    if (credSection) {
      if (data.license_number || (data.endorsements && data.endorsements.length > 0)) {
        // Show real credentials
        let html = '<div class="ps-title"><i class="fas fa-id-card"></i> Credentials</div>';
        if (data.license_number) html += '<div class="ps-row"><span class="ps-label">CDL</span><span class="ps-val">' + data.license_number + '</span></div>';
        if (data.endorsements && data.endorsements.length > 0) html += '<div class="ps-row"><span class="ps-label">Endorsements</span><span class="ps-val">' + data.endorsements.join(', ') + '</span></div>';
        credSection.innerHTML = html;
      } else {
        credSection.innerHTML = '<div class="ps-title"><i class="fas fa-id-card"></i> Credentials</div><div class="profile-empty-state"><i class="fas fa-plus-circle"></i>Add your CDL and endorsements in Edit Profile</div>';
      }
    }

    // --- Equipment Experience: empty state ---
    const equipSection = document.querySelectorAll('#profile .profile-section')[2];
    if (equipSection) {
      if (data.specialty) {
        equipSection.innerHTML = '<div class="ps-title"><i class="fas fa-truck"></i> Specialty</div><div class="ps-row"><span class="ps-label">Primary</span><span class="ps-val">' + data.specialty + '</span></div>';
      } else {
        equipSection.innerHTML = '<div class="ps-title"><i class="fas fa-truck"></i> Equipment Experience</div><div class="profile-empty-state"><i class="fas fa-plus-circle"></i>Add your specialty in Edit Profile</div>';
      }
    }

    // --- Preferences: show real location or empty ---
    const prefSection = document.querySelectorAll('#profile .profile-section')[3];
    if (prefSection) {
      if (data.address || data.phone) {
        let html = '<div class="ps-title"><i class="fas fa-sliders-h"></i> Info</div>';
        if (data.address) html += '<div class="ps-row"><span class="ps-label">Location</span><span class="ps-val">' + data.address + '</span></div>';
        if (data.phone) html += '<div class="ps-row"><span class="ps-label">Phone</span><span class="ps-val">' + data.phone + '</span></div>';
        if (data.bio) html += '<div class="ps-row"><span class="ps-label">About</span><span class="ps-val">' + data.bio + '</span></div>';
        prefSection.innerHTML = html;
      } else {
        prefSection.innerHTML = '<div class="ps-title"><i class="fas fa-sliders-h"></i> Preferences</div><div class="profile-empty-state"><i class="fas fa-plus-circle"></i>Add your location and preferences in Edit Profile</div>';
      }
    }

    // --- Employment History: empty state ---
    const empSection = document.querySelectorAll('#profile .profile-section')[4];
    if (empSection) {
      empSection.innerHTML = '<div class="ps-title"><i class="fas fa-briefcase"></i> Employment History</div><div class="profile-empty-state"><i class="fas fa-plus-circle"></i>Employment history coming soon</div>';
    }
  }

  // =========================================================================
  // 7. PROFILE EDITOR CONTROLLER
  // =========================================================================

  window.profileEditor = {
    isPublic: true,
    currentProfile: null,
    currentRole: 'driver',
    currentUserId: null,

    async open() {
      // Get current user
      let user = null;
      try {
        user = await dlAuth.getUser();
      } catch(e) {
        this.showToast('Please sign in to edit your profile', true);
        return;
      }

      if (!user || !user.id) {
        this.showToast('Please sign in to edit your profile', true);
        return;
      }

      this.currentUserId = user.id;
      this.currentRole = (user.user_metadata && user.user_metadata.role) || 'driver';
      const isCompany = this.currentRole === 'fleet_owner';

      const formBody = document.getElementById('pe-form-body');
      formBody.innerHTML = isCompany ? buildCompanyForm() : buildDriverForm();

      // Load existing data DIRECTLY from dlProfiles
      await this.loadProfile(isCompany);

      document.getElementById('profile-edit-overlay').classList.add('on');
    },

    close() {
      document.getElementById('profile-edit-overlay').classList.remove('on');
    },

    async loadProfile(isCompany) {
      let profile = null;
      try {
        if (isCompany) {
          profile = await dlProfiles.getCompanyProfile(this.currentUserId);
        } else {
          profile = await dlProfiles.getDriverProfile(this.currentUserId);
        }
      } catch (e) {
        console.warn('[ProfileEditor] Could not load profile:', e);
      }

      this.currentProfile = profile;

      if (isCompany) {
        this.populateCompanyForm(profile);
      } else {
        this.populateDriverForm(profile);
      }
    },

    populateDriverForm(profile) {
      const data = profile || {};
      const el = (id) => document.getElementById(id);

      if (el('pe-fullname')) el('pe-fullname').value = data.full_name || '';
      if (el('pe-specialty')) el('pe-specialty').value = data.specialty || '';
      if (el('pe-experience')) el('pe-experience').value = data.years_experience || '';
      if (el('pe-license')) el('pe-license').value = data.license_number || '';
      if (el('pe-phone')) el('pe-phone').value = data.phone || '';
      if (el('pe-address')) el('pe-address').value = data.address || '';
      if (el('pe-bio')) el('pe-bio').value = data.bio || '';

      this.isPublic = data.is_public !== false;
      this.updateToggle();
    },

    populateCompanyForm(profile) {
      const data = profile || {};
      const el = (id) => document.getElementById(id);

      if (el('pe-companyname')) el('pe-companyname').value = data.company_name || '';
      if (el('pe-fleetsize')) el('pe-fleetsize').value = data.fleet_size || '';
      if (el('pe-website')) el('pe-website').value = data.website || '';
      if (el('pe-phone')) el('pe-phone').value = data.phone || '';
      if (el('pe-address')) el('pe-address').value = data.address || '';
      if (el('pe-bio')) el('pe-bio').value = data.bio || '';

      this.isPublic = data.is_public !== false;
      this.updateToggle();
    },

    togglePublic() {
      this.isPublic = !this.isPublic;
      this.updateToggle();
    },

    updateToggle() {
      const track = document.getElementById('pe-public-toggle');
      if (track) track.classList.toggle('on', this.isPublic);
    },

    async save() {
      const isCompany = this.currentRole === 'fleet_owner';
      const saveBtn = document.getElementById('pe-save-btn');
      const el = (id) => document.getElementById(id);

      let data;
      if (isCompany) {
        data = {
          company_name: (el('pe-companyname')?.value || '').trim(),
          fleet_size: parseInt(el('pe-fleetsize')?.value) || 0,
          website: (el('pe-website')?.value || '').trim(),
          phone: (el('pe-phone')?.value || '').trim(),
          address: (el('pe-address')?.value || '').trim(),
          bio: (el('pe-bio')?.value || '').trim(),
          is_public: this.isPublic
        };
        if (!data.company_name) {
          this.showToast('Please enter a company name', true);
          return;
        }
      } else {
        data = {
          full_name: (el('pe-fullname')?.value || '').trim(),
          specialty: el('pe-specialty')?.value || '',
          years_experience: parseInt(el('pe-experience')?.value) || 0,
          license_number: (el('pe-license')?.value || '').trim(),
          phone: (el('pe-phone')?.value || '').trim(),
          address: (el('pe-address')?.value || '').trim(),
          bio: (el('pe-bio')?.value || '').trim(),
          is_public: this.isPublic
        };
        if (!data.full_name) {
          this.showToast('Please enter your name', true);
          return;
        }
      }

      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

      try {
        // SAVE DIRECTLY via dlProfiles (bypasses broken dlProfileEngine)
        let result;
        if (isCompany) {
          result = await dlProfiles.updateCompanyProfile(this.currentUserId, data);
        } else {
          result = await dlProfiles.updateDriverProfile(this.currentUserId, data);
        }

        if (!result) {
          throw new Error('Save returned empty result');
        }

        console.log('[ProfileEditor] Saved successfully:', result);

        // Reload the full profile page with the new data
        const user = await dlAuth.getUser();
        updateProfilePageWithRealData(result, isCompany, user);

        this.close();
        this.showToast('Profile saved!');
      } catch (error) {
        console.error('[ProfileEditor] Save error:', error);
        this.showToast('Failed to save: ' + error.message, true);
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Save Changes';
      }
    },

    showToast(message, isError) {
      const existing = document.querySelector('.pe-toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.className = 'pe-toast';
      if (isError) {
        toast.style.background = 'var(--red)';
        toast.style.color = '#fff';
      }
      toast.innerHTML = '<i class="fas fa-' + (isError ? 'exclamation-circle' : 'check-circle') + '"></i> ' + message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3200);
    }
  };

  // =========================================================================
  // 8. AUTO-INITIALIZE
  // =========================================================================

  function init() {
    injectEditButton();

    // Load real profile data when navigating to profile
    loadRealProfileData();

    console.log('[ProfileEditor] v3 loaded - using dlProfiles directly');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 300);
  }

  // Re-inject + reload data when navigating to profile
  const origGo = window.go;
  if (typeof origGo === 'function') {
    window.go = function(s) {
      origGo(s);
      if (s === 'profile') {
        setTimeout(() => {
          injectEditButton();
          loadRealProfileData();
        }, 100);
      }
    };
  }

  // Also listen for auth state changes to reload profile
  if (typeof dlAuth !== 'undefined' && dlAuth.onAuthChange) {
    dlAuth.onAuthChange(function(event, session) {
      if (event === 'SIGNED_IN') {
        setTimeout(() => {
          loadRealProfileData();
          injectEditButton();
        }, 500);
      }
    });
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('profile-edit-overlay');
      if (overlay && overlay.classList.contains('on')) {
        profileEditor.close();
      }
    }
  });

})();
