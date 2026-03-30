/**
 * DriverLink Profile Editor - Self-Injecting Module
 *
 * Adds an "Edit Profile" button to the profile page and a slide-up edit form.
 * Loads real profile data from Supabase when available, falls back to demo data.
 * Supports both driver and company profiles.
 *
 * Load AFTER driverlink-backend-wiring.js and driverlink-auth-ui.js
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

  const ENDORSEMENTS = ['HAZMAT', 'Tanker', 'Doubles/Triples', 'X (HazMat+Tanker)', 'Passenger', 'School Bus'];

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
          <!-- Populated dynamically based on role -->
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

  const overlayContainer = document.createElement('div');
  overlayContainer.innerHTML = overlayHTML;
  document.body.appendChild(overlayContainer.firstElementChild);

  // =========================================================================
  // 5. INJECT EDIT BUTTON INTO PROFILE PAGE
  // =========================================================================

  function injectEditButton() {
    const profileHead = document.querySelector('#profile .profile-head');
    if (!profileHead) return;

    // Remove existing button if present
    const existing = profileHead.querySelector('.profile-edit-btn');
    if (existing) return; // Already injected

    const btn = document.createElement('button');
    btn.className = 'profile-edit-btn';
    btn.innerHTML = '<i class="fas fa-pen"></i> Edit Profile';
    btn.onclick = function() { profileEditor.open(); };

    // Insert after the status pill or at the end of profile-head
    const statusPill = profileHead.querySelector('.status-pill');
    if (statusPill && statusPill.parentElement) {
      statusPill.parentElement.appendChild(btn);
    } else {
      profileHead.appendChild(btn);
    }
  }

  // =========================================================================
  // 6. PROFILE EDITOR CONTROLLER
  // =========================================================================

  window.profileEditor = {
    isPublic: true,
    currentProfile: null,
    currentRole: 'driver',

    async open() {
      // Determine role
      if (typeof dlUtils !== 'undefined' && dlUtils.getCurrentRole) {
        this.currentRole = dlUtils.getCurrentRole() || 'driver';
      } else if (window.authUI && window.authUI.currentUser) {
        this.currentRole = window.authUI.currentUser.user_metadata?.role || 'driver';
      }

      const isCompany = this.currentRole === 'fleet_owner';
      const formBody = document.getElementById('pe-form-body');

      // Build the appropriate form
      formBody.innerHTML = isCompany ? buildCompanyForm() : buildDriverForm();

      // Load existing data
      await this.loadProfile(isCompany);

      // Show overlay
      document.getElementById('profile-edit-overlay').classList.add('on');
    },

    close() {
      document.getElementById('profile-edit-overlay').classList.remove('on');
    },

    async loadProfile(isCompany) {
      // Try to load from backend
      let profile = null;
      if (typeof dlProfileEngine !== 'undefined' && dlProfileEngine.loadMyProfile) {
        try {
          profile = await dlProfileEngine.loadMyProfile();
        } catch (e) {
          console.warn('[ProfileEditor] Could not load profile:', e);
        }
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
      if (track) {
        track.classList.toggle('on', this.isPublic);
      }
    },

    async save() {
      const isCompany = this.currentRole === 'fleet_owner';
      const saveBtn = document.getElementById('pe-save-btn');
      const el = (id) => document.getElementById(id);

      // Gather data
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

      // Save
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

      try {
        if (typeof dlProfileEngine !== 'undefined' && dlProfileEngine.saveProfile) {
          await dlProfileEngine.saveProfile(data);
        }

        // Update the visible profile page with new data
        this.updateProfileDisplay(data, isCompany);

        this.close();
        this.showToast('Profile updated!');
      } catch (error) {
        console.error('[ProfileEditor] Save error:', error);
        this.showToast('Failed to save. Please try again.', true);
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Save Changes';
      }
    },

    updateProfileDisplay(data, isCompany) {
      // Update the profile page header with new data
      const nameEl = document.querySelector('#profile .profile-name');
      const titleEl = document.querySelector('#profile .profile-title');

      if (isCompany) {
        if (nameEl) nameEl.textContent = data.company_name || 'My Company';
        if (titleEl) titleEl.textContent = (data.bio || 'Fleet Owner').substring(0, 60);
      } else {
        if (nameEl) nameEl.textContent = data.full_name || 'Driver';
        const parts = [];
        if (data.specialty) parts.push(data.specialty + ' Driver');
        if (data.address) parts.push(data.address);
        if (titleEl) titleEl.textContent = parts.join(' · ') || 'Driver';
      }

      // Update stats
      const statsEls = document.querySelectorAll('#profile .ps-n');
      if (!isCompany && statsEls.length >= 2) {
        statsEls[1].textContent = data.years_experience || '0';
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
  // 7. AUTO-INITIALIZE
  // =========================================================================

  function init() {
    injectEditButton();
    console.log('[ProfileEditor] Module loaded');
  }

  // Watch for profile screen becoming visible to inject button
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 200);
  }

  // Also re-inject when navigating to profile (in case of dynamic rendering)
  const origGo = window.go;
  if (typeof origGo === 'function') {
    window.go = function(s) {
      origGo(s);
      if (s === 'profile') {
        setTimeout(injectEditButton, 50);
      }
    };
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
