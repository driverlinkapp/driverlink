/**
 * DriverLink Backend Wiring Module
 *
 * This module acts as the "glue" connecting the existing DriverLink UI to the Supabase backend.
 * It provides real-time data loading, profile management, matching, and messaging while
 * gracefully falling back to demo mode when Supabase is not configured or user is a guest.
 *
 * Design principle: Demo mode is the default. Real backend only activates when:
 * 1. Supabase is configured (non-placeholder URLs)
 * 2. User is authenticated
 *
 * All functions use try/catch to ensure the UI never breaks, even if backend calls fail.
 */

// ============================================================================
// 1. SWIPE ENGINE - Real-time card loading and match detection
// ============================================================================

const dlSwipeEngine = {
  /**
   * Load swipeable cards from Supabase based on user role
   *
   * For drivers: Returns companies with active listings (not yet swiped by this driver)
   * For companies: Returns drivers with active profiles (not yet swiped by this company)
   * Falls back to hardcoded COMPANIES/DRIVERS arrays if not authenticated or Supabase fails
   *
   * @returns {Promise<Array>} Array of card objects with id, name, image, description, etc.
   */
  async loadCards() {
    try {
      // Exit early if demo mode is enabled
      if (window.DL_DEMO_MODE) {
        console.log('[dlSwipeEngine] Demo mode active, using hardcoded data');
        return null; // UI will use existing COMPANIES/DRIVERS
      }

      // Get current authenticated user
      const user = await dlAuth.getUser();
      if (!user) {
        console.log('[dlSwipeEngine] No authenticated user, falling back to demo data');
        return null;
      }

      // Determine user role (driver or company recruiter)
      const role = dlUtils.getCurrentRole();

      if (role === 'driver') {
        // Drivers see companies with active job listings
        console.log('[dlSwipeEngine] Loading companies for driver', user.id);

        const companies = await dlProfiles.getPublicCompanies();

        // Fetch user's swipe history to avoid showing already-swiped cards
        const history = await dlMatch.getSwipeHistory(user.id);
        const swipedIds = history.map(s => s.swiped_id);

        // Filter out already-swiped companies
        const filtered = companies.filter(c => !swipedIds.includes(c.user_id));
        console.log(`[dlSwipeEngine] Loaded ${filtered.length} new companies (${companies.length} total)`);

        return filtered;
      } else {
        // Companies see driver profiles
        console.log('[dlSwipeEngine] Loading drivers for company', user.id);

        const drivers = await dlProfiles.getPublicDrivers();

        // Fetch company's swipe history
        const history = await dlMatch.getSwipeHistory(user.id);
        const swipedIds = history.map(s => s.swiped_id);

        // Filter out already-swiped drivers
        const filtered = drivers.filter(d => !swipedIds.includes(d.user_id));
        console.log(`[dlSwipeEngine] Loaded ${filtered.length} new drivers (${drivers.length} total)`);

        return filtered;
      }
    } catch (error) {
      console.error('[dlSwipeEngine] Error loading cards:', error);
      // Fall back to demo mode - UI will use hardcoded arrays
      return null;
    }
  },

  /**
   * Record a swipe action and check for mutual matches
   *
   * This function:
   * 1. Records the swipe in Supabase (swipe_history table)
   * 2. If it's a "like", checks if the target user also liked this user back
   * 3. Creates a match if mutual
   * 4. Returns match status and data
   *
   * Guest/demo mode: Returns null without recording anything
   *
   * @param {string} targetId - The user_id of the swiped-on profile (company or driver)
   * @param {string} direction - 'right' (like) or 'left' (pass)
   * @returns {Promise<Object|null>} { matched: boolean, matchData?: Object }
   */
  async recordSwipe(targetId, direction) {
    try {
      // In demo mode, don't record anything
      if (window.DL_DEMO_MODE) {
        console.log('[dlSwipeEngine] Demo mode: swipe not recorded', { targetId, direction });
        return null;
      }

      // Get authenticated user
      const user = await dlAuth.getUser();
      if (!user) {
        console.log('[dlSwipeEngine] No authenticated user, swipe not recorded');
        return null;
      }

      // Convert direction to swipe type
      const swipeType = direction === 'right' ? 'like' : 'pass';

      // Determine context (who is swiping on whom)
      const role = dlUtils.getCurrentRole();
      const contextType = role === 'driver' ? 'driver_to_company' : 'company_to_driver';

      console.log(`[dlSwipeEngine] Recording swipe: ${user.id} -> ${targetId} (${swipeType})`);

      // Record the swipe in Supabase
      const swipeRecord = await dlMatch.swipe(
        user.id,
        targetId,
        swipeType,
        contextType
      );

      // Only check for mutual match if this was a "like"
      if (swipeType === 'like') {
        console.log('[dlSwipeEngine] Checking for mutual match...');
        const matchData = await dlMatch.checkMatch(user.id, targetId);

        if (matchData) {
          console.log('[dlSwipeEngine] MATCH FOUND!', matchData);

          // Trigger UI notifications and celebrations
          // These functions should exist in the main app
          if (typeof showNotif === 'function') {
            showNotif('It\'s a match! 🎉');
          }
          if (typeof confetti === 'function') {
            confetti();
          }

          return { matched: true, matchData };
        }
      }

      return { matched: false };
    } catch (error) {
      console.error('[dlSwipeEngine] Error recording swipe:', error);
      // Gracefully fail - don't break the UI
      return null;
    }
  },

  /**
   * Undo the last swipe (if undo button is available in UI)
   *
   * @returns {Promise<boolean>} True if undo was successful
   */
  async undoLastSwipe() {
    try {
      if (window.DL_DEMO_MODE) return false;

      const user = await dlAuth.getUser();
      if (!user) return false;

      // Get the most recent swipe
      const history = await dlMatch.getSwipeHistory(user.id, 1);
      if (!history || history.length === 0) return false;

      const lastSwipe = history[0];
      console.log('[dlSwipeEngine] Undoing swipe:', lastSwipe);

      return await dlMatch.deleteSwipe(lastSwipe.id);
    } catch (error) {
      console.error('[dlSwipeEngine] Error undoing swipe:', error);
      return false;
    }
  }
};

// ============================================================================
// 2. SALARY BENCHMARKING ENGINE - Real salary data with fallbacks
// ============================================================================

const dlSalaryEngine = {
  /**
   * Get salary benchmarks for a specific role
   *
   * Returns percentile data (p10, p25, p50, p75, p90) for salary comparison.
   * Falls back to hardcoded SALARY object if Supabase lookup fails or is not configured.
   *
   * @param {string} specialty - Job specialization (e.g., 'Long Haul', 'Local', 'Hazmat')
   * @param {string} experience - Experience level (e.g., 'entry', 'mid', 'senior')
   * @param {string} region - Geographic region (e.g., 'Northeast', 'Midwest', 'Southwest')
   * @returns {Promise<Object|null>} { p10, p25, p50, p75, p90 } or null
   */
  async getBenchmark(specialty, experience, region) {
    try {
      // Skip if demo mode
      if (window.DL_DEMO_MODE) {
        console.log('[dlSalaryEngine] Demo mode, using fallback SALARY data');
        return this._fallbackSalary(specialty);
      }

      console.log('[dlSalaryEngine] Fetching benchmark:', { specialty, experience, region });

      // Try to get real data from Supabase
      const data = await dlSalary.getBenchmark(specialty, experience, region);

      if (data) {
        console.log('[dlSalaryEngine] Found benchmark data:', data);
        return data;
      }
    } catch (error) {
      console.warn('[dlSalaryEngine] Error fetching benchmark, using fallback:', error);
    }

    // Fall back to hardcoded SALARY object
    console.log('[dlSalaryEngine] Falling back to hardcoded SALARY data');
    return this._fallbackSalary(specialty);
  },

  /**
   * Internal: Fall back to hardcoded salary data
   * Assumes global SALARY object exists in the main app
   *
   * @private
   * @param {string} specialty
   * @returns {Object|null}
   */
  _fallbackSalary(specialty) {
    // SALARY should be defined in main app as:
    // { 'Long Haul': { p10: 45000, p25: 55000, ... }, ... }
    if (typeof window.SALARY !== 'undefined' && window.SALARY[specialty]) {
      return window.SALARY[specialty];
    }
    return null;
  },

  /**
   * Get historical salary trends for a specialty
   * Useful for showing salary growth over time
   *
   * @param {string} specialty - Job specialization
   * @returns {Promise<Array>} Array of { year, median_salary }
   */
  async getTrends(specialty) {
    try {
      if (window.DL_DEMO_MODE) return [];
      return await dlSalary.getTrends(specialty);
    } catch (error) {
      console.error('[dlSalaryEngine] Error fetching trends:', error);
      return [];
    }
  }
};

// ============================================================================
// 3. PROFILE ENGINE - User profile management (driver or company)
// ============================================================================

const dlProfileEngine = {
  /**
   * Load the current user's profile based on their role
   *
   * Drivers see their driver profile (bio, certifications, preferences, etc.)
   * Companies see their company profile (fleet info, job listings, etc.)
   *
   * @returns {Promise<Object|null>} User's profile object or null if not authenticated
   */
  async loadMyProfile() {
    try {
      // In demo mode, don't load profile data
      if (window.DL_DEMO_MODE) {
        console.log('[dlProfileEngine] Demo mode, using hardcoded profile');
        return null;
      }

      // Get authenticated user
      const user = await dlAuth.getUser();
      if (!user) {
        console.log('[dlProfileEngine] No authenticated user');
        return null;
      }

      // Load appropriate profile based on role
      const role = dlUtils.getCurrentRole();
      console.log('[dlProfileEngine] Loading profile for', role, user.id);

      if (role === 'driver') {
        return await dlProfiles.getDriverProfile(user.id);
      } else {
        return await dlProfiles.getCompanyProfile(user.id);
      }
    } catch (error) {
      console.error('[dlProfileEngine] Error loading profile:', error);
      return null;
    }
  },

  /**
   * Update the current user's profile
   *
   * Intelligently updates only the fields that changed to minimize API calls.
   * Validates data before submission to catch errors early.
   *
   * @param {Object} data - Fields to update (name, bio, certifications, etc.)
   * @returns {Promise<Object|null>} Updated profile or null on error
   */
  async saveProfile(data) {
    try {
      // Don't allow profile saves in demo mode
      if (window.DL_DEMO_MODE) {
        console.log('[dlProfileEngine] Demo mode, profile not saved');
        return null;
      }

      // Get authenticated user
      const user = await dlAuth.getUser();
      if (!user) {
        console.error('[dlProfileEngine] No authenticated user for profile save');
        return null;
      }

      // Validate data before sending
      if (!data || Object.keys(data).length === 0) {
        console.warn('[dlProfileEngine] No data provided for profile update');
        return null;
      }

      const role = dlUtils.getCurrentRole();
      console.log('[dlProfileEngine] Saving profile for', role, user.id, data);

      if (role === 'driver') {
        return await dlProfiles.updateDriverProfile(user.id, data);
      } else {
        return await dlProfiles.updateCompanyProfile(user.id, data);
      }
    } catch (error) {
      console.error('[dlProfileEngine] Error saving profile:', error);
      return null;
    }
  },

  /**
   * Get a public profile view of any user (for card display)
   * This shows limited info, not sensitive data
   *
   * @param {string} userId - The user_id to look up
   * @param {string} type - 'driver' or 'company'
   * @returns {Promise<Object|null>} Public profile data
   */
  async getPublicProfile(userId, type) {
    try {
      if (window.DL_DEMO_MODE) return null;

      if (type === 'driver') {
        return await dlProfiles.getPublicDriverProfile(userId);
      } else {
        return await dlProfiles.getPublicCompanyProfile(userId);
      }
    } catch (error) {
      console.error('[dlProfileEngine] Error loading public profile:', error);
      return null;
    }
  },

  /**
   * Upload a profile photo
   *
   * @param {File} file - Image file to upload
   * @returns {Promise<string>} Public URL of uploaded image
   */
  async uploadProfilePhoto(file) {
    try {
      if (window.DL_DEMO_MODE) return null;

      const user = await dlAuth.getUser();
      if (!user) return null;

      console.log('[dlProfileEngine] Uploading profile photo...');
      return await dlProfiles.uploadPhoto(user.id, file);
    } catch (error) {
      console.error('[dlProfileEngine] Error uploading photo:', error);
      return null;
    }
  }
};

// ============================================================================
// 4. MATCH ENGINE - Display and manage matches
// ============================================================================

const dlMatchEngine = {
  /**
   * Load all mutual matches for the current user
   *
   * Returns only matches where both users swiped "right" on each other.
   * Includes basic info about the matched profile.
   *
   * @returns {Promise<Array>} Array of match objects with id, profile info, matched_at
   */
  async loadMatches() {
    try {
      // Demo mode shows hardcoded demo matches
      if (window.DL_DEMO_MODE) {
        console.log('[dlMatchEngine] Demo mode, using hardcoded matches');
        return null; // UI will use existing demo matches
      }

      // Get authenticated user
      const user = await dlAuth.getUser();
      if (!user) {
        console.log('[dlMatchEngine] No authenticated user, showing demo matches');
        return null;
      }

      console.log('[dlMatchEngine] Loading matches for', user.id);
      const matches = await dlMatch.getMatches(user.id);

      console.log(`[dlMatchEngine] Found ${matches.length} matches`);
      return matches;
    } catch (error) {
      console.error('[dlMatchEngine] Error loading matches:', error);
      // Fall back to demo matches
      return null;
    }
  },

  /**
   * Get detailed info about a specific match
   * Includes conversation history and profile details
   *
   * @param {string} matchId - The match record ID
   * @returns {Promise<Object|null>} Complete match data
   */
  async getMatchDetails(matchId) {
    try {
      if (window.DL_DEMO_MODE) return null;

      console.log('[dlMatchEngine] Loading match details for', matchId);
      return await dlMatch.getMatchDetails(matchId);
    } catch (error) {
      console.error('[dlMatchEngine] Error loading match details:', error);
      return null;
    }
  },

  /**
   * Unmatch (delete) a connection
   * This is a permanent action that removes the match
   *
   * @param {string} matchId - The match record ID
   * @returns {Promise<boolean>} True if successful
   */
  async unmatch(matchId) {
    try {
      if (window.DL_DEMO_MODE) return false;

      const user = await dlAuth.getUser();
      if (!user) return false;

      console.log('[dlMatchEngine] Unmatching:', matchId);
      return await dlMatch.unmatch(matchId);
    } catch (error) {
      console.error('[dlMatchEngine] Error unmatching:', error);
      return false;
    }
  },

  /**
   * Get all matches where conversation has at least one message
   * Useful for a "Messages" tab showing active conversations
   *
   * @returns {Promise<Array>} Array of active conversation matches
   */
  async getActiveConversations() {
    try {
      if (window.DL_DEMO_MODE) return [];

      const user = await dlAuth.getUser();
      if (!user) return [];

      console.log('[dlMatchEngine] Loading active conversations for', user.id);
      return await dlMatch.getActiveConversations(user.id);
    } catch (error) {
      console.error('[dlMatchEngine] Error loading conversations:', error);
      return [];
    }
  }
};

// ============================================================================
// 5. MESSAGE ENGINE - Real-time messaging between matches
// ============================================================================

const dlMessageEngine = {
  /**
   * Load all messages in a specific match conversation
   *
   * Messages are ordered by timestamp (oldest first).
   * Includes sender info for proper rendering.
   *
   * @param {string} matchId - The match record ID
   * @returns {Promise<Array>} Array of message objects
   */
  async loadMessages(matchId) {
    try {
      if (window.DL_DEMO_MODE) return [];

      console.log('[dlMessageEngine] Loading messages for match', matchId);
      const messages = await dlMessages.getByMatch(matchId);

      console.log(`[dlMessageEngine] Loaded ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error('[dlMessageEngine] Error loading messages:', error);
      return [];
    }
  },

  /**
   * Send a message to a matched user
   *
   * Validates message content before sending.
   * Returns the sent message object with timestamp.
   *
   * @param {string} matchId - The match record ID
   * @param {string} content - Message text
   * @returns {Promise<Object|null>} Sent message object or null on error
   */
  async sendMessage(matchId, content) {
    try {
      if (window.DL_DEMO_MODE) {
        console.log('[dlMessageEngine] Demo mode: message not sent', { matchId, content });
        return null;
      }

      // Get authenticated user
      const user = await dlAuth.getUser();
      if (!user) {
        console.error('[dlMessageEngine] No authenticated user for message send');
        return null;
      }

      // Validate message
      if (!content || content.trim().length === 0) {
        console.warn('[dlMessageEngine] Empty message rejected');
        return null;
      }

      if (content.length > 5000) {
        console.warn('[dlMessageEngine] Message too long (max 5000 chars)');
        return null;
      }

      console.log('[dlMessageEngine] Sending message to match', matchId);
      const message = await dlMessages.send(matchId, user.id, content);

      console.log('[dlMessageEngine] Message sent:', message);
      return message;
    } catch (error) {
      console.error('[dlMessageEngine] Error sending message:', error);
      return null;
    }
  },

  /**
   * Get total unread message count for the current user
   * Useful for updating nav badges
   *
   * @returns {Promise<number>} Number of unread messages
   */
  async getUnreadCount() {
    try {
      if (window.DL_DEMO_MODE) return 0;

      const user = await dlAuth.getUser();
      if (!user) return 0;

      const count = await dlMessages.getUnreadCount(user.id);
      console.log('[dlMessageEngine] Unread messages:', count);
      return count;
    } catch (error) {
      console.error('[dlMessageEngine] Error getting unread count:', error);
      return 0;
    }
  },

  /**
   * Mark messages as read
   *
   * @param {Array<string>} messageIds - Array of message IDs to mark as read
   * @returns {Promise<boolean>} True if successful
   */
  async markAsRead(messageIds) {
    try {
      if (window.DL_DEMO_MODE) return false;

      if (!messageIds || messageIds.length === 0) return false;

      console.log('[dlMessageEngine] Marking messages as read:', messageIds);
      return await dlMessages.markAsRead(messageIds);
    } catch (error) {
      console.error('[dlMessageEngine] Error marking as read:', error);
      return false;
    }
  },

  /**
   * Set up real-time subscription to new messages (if Supabase supports it)
   * This allows the UI to update without polling
   *
   * @param {string} matchId - The match record ID
   * @param {Function} callback - Called when new message arrives
   * @returns {Function|null} Unsubscribe function or null
   */
  subscribeToMessages(matchId, callback) {
    try {
      if (window.DL_DEMO_MODE) return null;

      console.log('[dlMessageEngine] Setting up real-time subscription for match', matchId);
      return dlMessages.subscribe(matchId, callback);
    } catch (error) {
      console.error('[dlMessageEngine] Error setting up subscription:', error);
      return null;
    }
  }
};

// ============================================================================
// 6. FEEDBACK ENGINE - User feedback collection
// ============================================================================

const dlFeedbackEngine = {
  /**
   * Submit user feedback/reviews
   *
   * Authenticated users' feedback is linked to their profile.
   * Guest feedback is logged but not persistent.
   *
   * @param {number} rating - Star rating (1-5)
   * @param {string} message - Feedback text
   * @param {string} category - Feedback type (e.g., 'app', 'match_quality', 'safety')
   * @returns {Promise<Object|null>} Feedback record or null
   */
  async submit(rating, message, category = 'general') {
    try {
      // Validate input
      if (!rating || rating < 1 || rating > 5) {
        console.warn('[dlFeedbackEngine] Invalid rating:', rating);
        return null;
      }

      if (!message || message.trim().length === 0) {
        console.warn('[dlFeedbackEngine] Feedback message is empty');
        return null;
      }

      // Demo mode: log feedback locally
      if (window.DL_DEMO_MODE) {
        console.log('[dlFeedbackEngine] Demo mode feedback:', {
          rating,
          message,
          category,
          timestamp: new Date().toISOString()
        });
        return { stored_locally: true };
      }

      // Get user if authenticated
      const user = await dlAuth.getUser();

      if (user) {
        // Store authenticated feedback in Supabase
        console.log('[dlFeedbackEngine] Submitting feedback from', user.id);
        return await dlFeedback.submit(user.id, rating, message, category);
      } else {
        // Guest feedback - log locally
        console.log('[dlFeedbackEngine] Guest feedback:', {
          rating,
          message,
          category
        });
        return { stored_locally: true, guest: true };
      }
    } catch (error) {
      console.error('[dlFeedbackEngine] Error submitting feedback:', error);
      return null;
    }
  },

  /**
   * Get feedback summary/statistics (admin only)
   *
   * @returns {Promise<Object|null>} Feedback stats
   */
  async getStats() {
    try {
      if (window.DL_DEMO_MODE) return null;

      const user = await dlAuth.getUser();
      if (!user) return null;

      // Check if user has admin/company role to see stats
      const role = dlUtils.getCurrentRole();
      if (role !== 'company' && role !== 'admin') {
        console.warn('[dlFeedbackEngine] User not authorized to view feedback stats');
        return null;
      }

      return await dlFeedback.getStats();
    } catch (error) {
      console.error('[dlFeedbackEngine] Error getting feedback stats:', error);
      return null;
    }
  }
};

// ============================================================================
// 7. NOTIFICATION ENGINE - Real-time notifications and alerts
// ============================================================================

const dlNotificationEngine = {
  /**
   * Get all unread notifications for the user
   *
   * @returns {Promise<Array>} Array of notification objects
   */
  async loadNotifications() {
    try {
      if (window.DL_DEMO_MODE) return [];

      const user = await dlAuth.getUser();
      if (!user) return [];

      console.log('[dlNotificationEngine] Loading notifications for', user.id);
      return await dlNotifications.getUnread(user.id);
    } catch (error) {
      console.error('[dlNotificationEngine] Error loading notifications:', error);
      return [];
    }
  },

  /**
   * Mark notification as read
   *
   * @param {string} notificationId - Notification ID
   * @returns {Promise<boolean>} True if successful
   */
  async markAsRead(notificationId) {
    try {
      if (window.DL_DEMO_MODE) return false;

      console.log('[dlNotificationEngine] Marking notification as read:', notificationId);
      return await dlNotifications.markAsRead(notificationId);
    } catch (error) {
      console.error('[dlNotificationEngine] Error marking notification as read:', error);
      return false;
    }
  },

  /**
   * Subscribe to real-time notifications for current user
   *
   * @param {Function} callback - Called when new notification arrives
   * @returns {Function|null} Unsubscribe function or null
   */
  subscribeToNotifications(callback) {
    try {
      if (window.DL_DEMO_MODE) return null;

      const user = dlAuth.getUser();
      if (!user) return null;

      console.log('[dlNotificationEngine] Setting up notification subscription');
      return dlNotifications.subscribe(user.id, callback);
    } catch (error) {
      console.error('[dlNotificationEngine] Error setting up notification subscription:', error);
      return null;
    }
  }
};

// ============================================================================
// 8. INITIALIZATION FUNCTION - Boot sequence
// ============================================================================

/**
 * Initialize the backend wiring system
 *
 * This function runs on page load and:
 * 1. Detects if Supabase is configured (not placeholder values)
 * 2. Sets demo mode flag if not configured
 * 3. Initializes authentication UI
 * 4. Loads real data if user is authenticated
 * 5. Sets up real-time subscriptions
 *
 * The app works in either mode - demo (hardcoded data) or real (Supabase-backed).
 */
async function initBackend() {
  try {
    console.log('='.repeat(60));
    console.log('DriverLink Backend Initialization');
    console.log('='.repeat(60));

    // ========================================================================
    // Step 1: Check if Supabase is properly configured
    // ========================================================================

    // These constants should be defined in the main app or environment
    const SUPABASE_URL = window.SUPABASE_URL || 'YOUR_SUPABASE_URL';
    const SUPABASE_KEY = window.SUPABASE_KEY || 'YOUR_SUPABASE_KEY';

    if (
      SUPABASE_URL === 'YOUR_SUPABASE_URL' ||
      SUPABASE_KEY === 'YOUR_SUPABASE_KEY'
    ) {
      console.log('⚠️  Supabase not configured - running in DEMO MODE');
      console.log('   (Using hardcoded COMPANIES, DRIVERS, SALARY, and demo matches)');
      window.DL_DEMO_MODE = true;
    } else {
      console.log('✓ Supabase configured - initializing real backend');
      window.DL_DEMO_MODE = false;

      // Initialize authentication UI
      console.log('→ Initializing authentication UI...');
      if (typeof authUI !== 'undefined' && authUI.init) {
        authUI.init();
      }
    }

    // ========================================================================
    // Step 2: Check if user is authenticated
    // ========================================================================

    const user = await dlAuth.getUser();

    if (!user) {
      console.log('→ No authenticated user (guest/anonymous mode)');
      console.log('→ App will show demo content and allow test swipes');
      return;
    }

    console.log('✓ User authenticated:', user.id);

    // ========================================================================
    // Step 3: Load real swipe cards
    // ========================================================================

    console.log('→ Loading swipeable cards...');
    const cards = await dlSwipeEngine.loadCards();

    if (cards && cards.length > 0) {
      console.log(`✓ Loaded ${cards.length} cards from backend`);
      // The UI's card rendering logic should check for this
      window.DL_REAL_CARDS = cards;

      // Dispatch custom event so UI can react to new cards
      document.dispatchEvent(new CustomEvent('dlCardsLoaded', { detail: { cards } }));
    } else {
      console.log('→ No new cards available, or backend not accessible');
    }

    // ========================================================================
    // Step 4: Load real matches
    // ========================================================================

    console.log('→ Loading matches...');
    const matches = await dlMatchEngine.loadMatches();

    if (matches && matches.length > 0) {
      console.log(`✓ Loaded ${matches.length} matches from backend`);
      window.DL_REAL_MATCHES = matches;

      document.dispatchEvent(new CustomEvent('dlMatchesLoaded', { detail: { matches } }));
    }

    // ========================================================================
    // Step 5: Load user's profile
    // ========================================================================

    console.log('→ Loading user profile...');
    const profile = await dlProfileEngine.loadMyProfile();

    if (profile) {
      console.log('✓ Loaded user profile:', profile.name || profile.company_name);
      window.DL_USER_PROFILE = profile;

      document.dispatchEvent(new CustomEvent('dlProfileLoaded', { detail: { profile } }));
    }

    // ========================================================================
    // Step 6: Check for unread messages
    // ========================================================================

    console.log('→ Checking for unread messages...');
    const unreadCount = await dlMessageEngine.getUnreadCount();

    if (unreadCount > 0) {
      console.log(`✓ ${unreadCount} unread messages`);
      window.DL_UNREAD_MESSAGES = unreadCount;

      // Update nav badge if it exists
      const badge = document.querySelector('[data-unread-messages]');
      if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = 'block';
      }

      document.dispatchEvent(new CustomEvent('dlUnreadMessagesUpdated', { detail: { count: unreadCount } }));
    }

    // ========================================================================
    // Step 7: Load notifications
    // ========================================================================

    console.log('→ Loading notifications...');
    const notifications = await dlNotificationEngine.loadNotifications();

    if (notifications && notifications.length > 0) {
      console.log(`✓ Loaded ${notifications.length} notifications`);
      window.DL_NOTIFICATIONS = notifications;
    }

    // ========================================================================
    // Step 8: Set up real-time subscriptions
    // ========================================================================

    console.log('→ Setting up real-time subscriptions...');

    // Subscribe to new messages
    const messageUnsubscribe = dlMessageEngine.subscribeToMessages('*', (message) => {
      console.log('[real-time] New message:', message);
      document.dispatchEvent(new CustomEvent('dlNewMessage', { detail: message }));
    });

    // Subscribe to notifications
    const notificationUnsubscribe = dlNotificationEngine.subscribeToNotifications((notification) => {
      console.log('[real-time] New notification:', notification);
      document.dispatchEvent(new CustomEvent('dlNewNotification', { detail: notification }));
    });

    // Store unsubscribe functions globally so they can be called on logout
    window.DL_UNSUBSCRIBE = {
      messages: messageUnsubscribe,
      notifications: notificationUnsubscribe
    };

    console.log('='.repeat(60));
    console.log('✓ Backend initialization complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error during backend initialization:', error);
    console.error('   App will fall back to demo mode');
    window.DL_DEMO_MODE = true;
  }
}

/**
 * Cleanup function to call on logout
 * Unsubscribes from real-time updates and clears user data
 */
async function cleanupBackend() {
  try {
    console.log('Cleaning up backend connections...');

    // Unsubscribe from real-time updates
    if (window.DL_UNSUBSCRIBE) {
      if (window.DL_UNSUBSCRIBE.messages) {
        window.DL_UNSUBSCRIBE.messages();
      }
      if (window.DL_UNSUBSCRIBE.notifications) {
        window.DL_UNSUBSCRIBE.notifications();
      }
    }

    // Clear user-specific data
    window.DL_REAL_CARDS = null;
    window.DL_REAL_MATCHES = null;
    window.DL_USER_PROFILE = null;
    window.DL_UNREAD_MESSAGES = 0;
    window.DL_NOTIFICATIONS = [];

    console.log('✓ Backend cleanup complete');
  } catch (error) {
    console.error('Error during backend cleanup:', error);
  }
}

// ============================================================================
// AUTO-INITIALIZATION ON PAGE LOAD
// ============================================================================

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBackend);
} else {
  // DOM already ready (if this script was loaded late)
  initBackend();
}

// Also set up cleanup on beforeunload to gracefully disconnect
window.addEventListener('beforeunload', cleanupBackend);

// ============================================================================
// EXPORTS (if using ES6 modules)
// ============================================================================

// If this file is imported as an ES6 module, export all engines
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    dlSwipeEngine,
    dlSalaryEngine,
    dlProfileEngine,
    dlMatchEngine,
    dlMessageEngine,
    dlFeedbackEngine,
    dlNotificationEngine,
    initBackend,
    cleanupBackend
  };
}
