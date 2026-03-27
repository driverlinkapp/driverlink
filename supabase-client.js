/**
 * DriverLink Supabase Client Module
 *
 * This module provides a complete integration layer for DriverLink with Supabase.
 * It wraps the Supabase JS v2 API with application-specific functions.
 *
 * SETUP REQUIRED:
 * 1. Add this to your HTML before this script:
 *    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *
 * 2. Fill in your Supabase credentials below:
 *    - SUPABASE_URL: Your Supabase project URL
 *    - SUPABASE_ANON_KEY: Your anonymous (public) API key
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = 'https://xnjbjfjvrosrowbhsyrl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuamJqZmp2cm9zcm93YmhzeXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NDE5MDIsImV4cCI6MjA5MDIxNzkwMn0.thEqj6Kd4UXmxMFyGRRz0lqu6cZhVBTff0jkan9GdAs';

// ============================================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================================

/**
 * Initialize the Supabase client using the global supabase object from CDN
 * The CDN script must be loaded before this script in your HTML
 */
let supabaseClient = null;

function initSupabaseClient() {
  if (!window.supabase) {
    console.error('Supabase JS library not loaded. Add the CDN script before this file.');
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return supabaseClient;
}

// Initialize on module load
const sb = initSupabaseClient();

// ============================================================================
// AUTH MODULE (dlAuth)
// ============================================================================

/**
 * Authentication functions for user sign up, sign in, sign out, and session management
 */
const dlAuth = {
  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password (min 6 chars)
   * @param {string} role - Either 'driver' or 'fleet_owner'
   * @param {string} fullName - User's full name
   * @returns {Promise<{user, session}>} User and session object
   */
  async signUp(email, password, role, fullName) {
    try {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName
          }
        }
      });

      if (error) throw error;
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Sign up error:', error.message);
      throw error;
    }
  },

  /**
   * Sign in an existing user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{user, session}>} User and session object
   */
  async signIn(email, password) {
    try {
      const { data, error } = await sb.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Sign in error:', error.message);
      throw error;
    }
  },

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      const { error } = await sb.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error.message);
      throw error;
    }
  },

  /**
   * Get the currently logged in user
   * @returns {Promise<user>} Current user object or null
   */
  async getUser() {
    try {
      const { data: { user } } = await sb.auth.getUser();
      return user;
    } catch (error) {
      console.error('Get user error:', error.message);
      return null;
    }
  },

  /**
   * Listen for auth state changes
   * @param {function} callback - Function called with (event, session)
   * @returns {function} Unsubscribe function
   */
  onAuthChange(callback) {
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });

    // Return unsubscribe function
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }
};

// ============================================================================
// PROFILES MODULE (dlProfiles)
// ============================================================================

/**
 * Functions for managing driver and company profiles
 */
const dlProfiles = {
  /**
   * Fetch a driver profile
   * @param {string} userId - The user ID
   * @returns {Promise<object>} Driver profile object
   */
  async getDriverProfile(userId) {
    try {
      const { data, error } = await sb
        .from('driver_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get driver profile error:', error.message);
      throw error;
    }
  },

  /**
   * Fetch a company profile
   * @param {string} userId - The user ID
   * @returns {Promise<object>} Company profile object
   */
  async getCompanyProfile(userId) {
    try {
      const { data, error } = await sb
        .from('company_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get company profile error:', error.message);
      throw error;
    }
  },

  /**
   * Update a driver profile
   * @param {string} userId - The user ID
   * @param {object} data - Fields to update (e.g., { license_number, specialty, endorsements, phone, address })
   * @returns {Promise<object>} Updated profile
   */
  async updateDriverProfile(userId, data) {
    try {
      const { data: updated, error } = await sb
        .from('driver_profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } catch (error) {
      console.error('Update driver profile error:', error.message);
      throw error;
    }
  },

  /**
   * Update a company profile
   * @param {string} userId - The user ID
   * @param {object} data - Fields to update (e.g., { company_name, fleet_size, phone, address, website })
   * @returns {Promise<object>} Updated profile
   */
  async updateCompanyProfile(userId, data) {
    try {
      const { data: updated, error } = await sb
        .from('company_profiles')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } catch (error) {
      console.error('Update company profile error:', error.message);
      throw error;
    }
  },

  /**
   * Get list of all public drivers with optional filtering
   * @param {object} filters - Optional filters { specialty, endorsement, location, limit }
   * @returns {Promise<array>} Array of driver profiles
   */
  async getPublicDrivers(filters = {}) {
    try {
      let query = sb.from('driver_profiles').select('*');

      if (filters.specialty) {
        query = query.eq('specialty', filters.specialty);
      }

      if (filters.endorsement) {
        query = query.contains('endorsements', [filters.endorsement]);
      }

      if (filters.location) {
        query = query.ilike('address', `%${filters.location}%`);
      }

      const limit = filters.limit || 50;
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get public drivers error:', error.message);
      throw error;
    }
  },

  /**
   * Get list of all public companies with optional filtering
   * @param {object} filters - Optional filters { location, min_fleet_size, limit }
   * @returns {Promise<array>} Array of company profiles
   */
  async getPublicCompanies(filters = {}) {
    try {
      let query = sb.from('company_profiles').select('*');

      if (filters.location) {
        query = query.ilike('address', `%${filters.location}%`);
      }

      if (filters.min_fleet_size) {
        query = query.gte('fleet_size', filters.min_fleet_size);
      }

      const limit = filters.limit || 50;
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get public companies error:', error.message);
      throw error;
    }
  }
};

// ============================================================================
// MATCH & SWIPE MODULE (dlMatch)
// ============================================================================

/**
 * Functions for managing swipes and matches between drivers and companies
 */
const dlMatch = {
  /**
   * Record a swipe and check for mutual match
   * @param {string} swiperId - User ID of the person swiping
   * @param {string} swipedId - User ID of the person being swiped on
   * @param {string} type - Either 'like' or 'pass'
   * @param {string} contextType - Either 'driver' or 'company'
   * @returns {Promise<{swiped: boolean, matched: boolean}>} Swipe result with match status
   */
  async swipe(swiperId, swipedId, type, contextType) {
    try {
      // Record the swipe
      const { error: swipeError } = await sb
        .from('swipes')
        .insert({
          swiper_id: swiperId,
          swiped_id: swipedId,
          type,
          context_type: contextType,
          created_at: new Date().toISOString()
        });

      if (swipeError) throw swipeError;

      // Check for mutual match (reverse swipe exists and is also 'like')
      let matched = false;
      if (type === 'like') {
        const { data: reverseSwipe, error: checkError } = await sb
          .from('swipes')
          .select('*')
          .eq('swiper_id', swipedId)
          .eq('swiped_id', swiperId)
          .eq('type', 'like')
          .eq('context_type', contextType)
          .single();

        if (!checkError && reverseSwipe) {
          matched = true;

          // Create match record
          await sb.from('matches').insert({
            user_1: swiperId,
            user_2: swipedId,
            context_type: contextType,
            matched_at: new Date().toISOString()
          });
        }
      }

      return { swiped: true, matched };
    } catch (error) {
      console.error('Swipe error:', error.message);
      throw error;
    }
  },

  /**
   * Get all matches for a user
   * @param {string} userId - The user ID
   * @returns {Promise<array>} Array of match objects
   */
  async getMatches(userId) {
    try {
      const { data, error } = await sb
        .from('matches')
        .select('*')
        .or(`user_1.eq.${userId},user_2.eq.${userId}`);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get matches error:', error.message);
      throw error;
    }
  },

  /**
   * Get swipe history for a user
   * @param {string} userId - The user ID
   * @returns {Promise<array>} Array of swipe objects
   */
  async getSwipeHistory(userId) {
    try {
      const { data, error } = await sb
        .from('swipes')
        .select('*')
        .eq('swiper_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get swipe history error:', error.message);
      throw error;
    }
  },

  /**
   * Check if a mutual match exists between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<boolean>} True if mutual match exists
   */
  async checkMatch(userId1, userId2) {
    try {
      const { data, error } = await sb
        .from('matches')
        .select('*')
        .or(`user_1.eq.${userId1}.user_2.eq.${userId2},user_1.eq.${userId2}.user_2.eq.${userId1}`)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return !!data;
    } catch (error) {
      console.error('Check match error:', error.message);
      return false;
    }
  }
};

// ============================================================================
// JOB LISTINGS MODULE (dlJobs)
// ============================================================================

/**
 * Functions for managing job listings
 */
const dlJobs = {
  /**
   * Create a new job listing
   * @param {string} companyId - Company user ID
   * @param {object} data - Job data { title, description, specialty, location, pay_rate, hours_per_week, start_date, contract_length }
   * @returns {Promise<object>} Created job object
   */
  async create(companyId, data) {
    try {
      const { data: job, error } = await sb
        .from('job_listings')
        .insert({
          company_id: companyId,
          ...data,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return job;
    } catch (error) {
      console.error('Create job error:', error.message);
      throw error;
    }
  },

  /**
   * Get all active job listings
   * @returns {Promise<array>} Array of active job objects
   */
  async getActive() {
    try {
      const { data, error } = await sb
        .from('job_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get active jobs error:', error.message);
      throw error;
    }
  },

  /**
   * Get all job listings for a specific company
   * @param {string} companyId - Company user ID
   * @returns {Promise<array>} Array of job objects
   */
  async getByCompany(companyId) {
    try {
      const { data, error } = await sb
        .from('job_listings')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get company jobs error:', error.message);
      throw error;
    }
  },

  /**
   * Update a job listing
   * @param {string} jobId - Job listing ID
   * @param {object} data - Fields to update
   * @returns {Promise<object>} Updated job object
   */
  async update(jobId, data) {
    try {
      const { data: job, error } = await sb
        .from('job_listings')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;
      return job;
    } catch (error) {
      console.error('Update job error:', error.message);
      throw error;
    }
  },

  /**
   * Deactivate a job listing
   * @param {string} jobId - Job listing ID
   * @returns {Promise<object>} Updated job object
   */
  async deactivate(jobId) {
    try {
      const { data: job, error } = await sb
        .from('job_listings')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;
      return job;
    } catch (error) {
      console.error('Deactivate job error:', error.message);
      throw error;
    }
  }
};

// ============================================================================
// MESSAGING MODULE (dlMessages)
// ============================================================================

/**
 * Functions for managing messages between matched users
 */
const dlMessages = {
  /**
   * Send a message in a match
   * @param {string} matchId - Match ID
   * @param {string} senderId - User ID of sender
   * @param {string} content - Message content
   * @returns {Promise<object>} Created message object
   */
  async send(matchId, senderId, content) {
    try {
      const { data: message, error } = await sb
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: senderId,
          content,
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return message;
    } catch (error) {
      console.error('Send message error:', error.message);
      throw error;
    }
  },

  /**
   * Get all messages for a match
   * @param {string} matchId - Match ID
   * @returns {Promise<array>} Array of message objects
   */
  async getByMatch(matchId) {
    try {
      const { data, error } = await sb
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get messages error:', error.message);
      throw error;
    }
  },

  /**
   * Mark a message as read
   * @param {string} messageId - Message ID
   * @returns {Promise<object>} Updated message object
   */
  async markRead(messageId) {
    try {
      const { data: message, error } = await sb
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return message;
    } catch (error) {
      console.error('Mark read error:', error.message);
      throw error;
    }
  },

  /**
   * Get count of unread messages for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Count of unread messages
   */
  async getUnreadCount(userId) {
    try {
      // Get all matches for this user
      const matches = await dlMatch.getMatches(userId);
      const matchIds = matches.map(m => m.id);

      if (matchIds.length === 0) return 0;

      // Count unread messages in those matches where user is not the sender
      const { count, error } = await sb
        .from('messages')
        .select('*', { count: 'exact' })
        .in('match_id', matchIds)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Get unread count error:', error.message);
      return 0;
    }
  }
};

// ============================================================================
// SALARY BENCHMARKS MODULE (dlSalary)
// ============================================================================

/**
 * Functions for accessing salary benchmark data
 */
const dlSalary = {
  /**
   * Get salary benchmark for a specific specialty, experience level, and region
   * @param {string} specialty - Job specialty (e.g., 'OTR', 'Local', 'Regional')
   * @param {string} experienceLevel - Level (e.g., 'entry', 'mid', 'senior')
   * @param {string} region - Geographic region (e.g., 'Northeast', 'Midwest')
   * @returns {Promise<object>} Salary benchmark object { low, mid, high }
   */
  async getBenchmark(specialty, experienceLevel, region) {
    try {
      const { data, error } = await sb
        .from('salary_benchmarks')
        .select('*')
        .eq('specialty', specialty)
        .eq('experience_level', experienceLevel)
        .eq('region', region)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get benchmark error:', error.message);
      throw error;
    }
  },

  /**
   * Get all salary benchmarks
   * @returns {Promise<array>} Array of all salary benchmark objects
   */
  async getAllBenchmarks() {
    try {
      const { data, error } = await sb
        .from('salary_benchmarks')
        .select('*')
        .order('specialty', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get all benchmarks error:', error.message);
      throw error;
    }
  }
};

// ============================================================================
// FEEDBACK MODULE (dlFeedback)
// ============================================================================

/**
 * Functions for collecting user feedback and alpha signups
 */
const dlFeedback = {
  /**
   * Submit feedback from a user
   * @param {string} userId - User ID
   * @param {number} rating - Rating 1-5
   * @param {string} message - Feedback message
   * @returns {Promise<object>} Created feedback object
   */
  async submit(userId, rating, message) {
    try {
      const { data: feedback, error } = await sb
        .from('feedback')
        .insert({
          user_id: userId,
          rating,
          message,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return feedback;
    } catch (error) {
      console.error('Submit feedback error:', error.message);
      throw error;
    }
  },

  /**
   * Submit an alpha signup request
   * @param {string} email - User email
   * @param {string} role - Role ('driver' or 'fleet_owner')
   * @param {string} specialty - Driver specialty or company type
   * @returns {Promise<object>} Created signup object
   */
  async submitAlphaSignup(email, role, specialty) {
    try {
      const { data: signup, error } = await sb
        .from('alpha_signups')
        .insert({
          email,
          role,
          specialty,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return signup;
    } catch (error) {
      console.error('Submit alpha signup error:', error.message);
      throw error;
    }
  }
};

// ============================================================================
// UTILITY MODULE (dlUtils)
// ============================================================================

/**
 * Utility functions for common app operations
 */
const dlUtils = {
  /**
   * Check if a user is currently logged in
   * @returns {Promise<boolean>} True if user is logged in
   */
  async isLoggedIn() {
    try {
      const user = await dlAuth.getUser();
      return !!user;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get the current user's role
   * @returns {Promise<string>} 'driver' or 'fleet_owner' or null
   */
  async getCurrentRole() {
    try {
      const user = await dlAuth.getUser();
      if (!user || !user.user_metadata) return null;
      return user.user_metadata.role || null;
    } catch (error) {
      console.error('Get current role error:', error.message);
      return null;
    }
  }
};

// ============================================================================
// MODULE EXPORTS
// ============================================================================

/**
 * Export all modules as global DriverLink objects
 * Usage: dlAuth.signIn(), dlProfiles.getDriverProfile(), etc.
 */
window.dlAuth = dlAuth;
window.dlProfiles = dlProfiles;
window.dlMatch = dlMatch;
window.dlJobs = dlJobs;
window.dlMessages = dlMessages;
window.dlSalary = dlSalary;
window.dlFeedback = dlFeedback;
window.dlUtils = dlUtils;

console.log('DriverLink Supabase Client initialized. Modules available: dlAuth, dlProfiles, dlMatch, dlJobs, dlMessages, dlSalary, dlFeedback, dlUtils');
