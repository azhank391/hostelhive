"use strict";

/**
 * 🔄 ROLE SYNC UTILITIES
 * 
 * Prevents drift between legacy 'role' column and new 'role_id' column.
 * Ensures data consistency and prevents production issues.
 */

const { Role } = require('../models');

/**
 * Normalizes user roles to ensure consistency between 'role' and 'role_id'
 * @param {Object} user - User object with role and role_id
 * @returns {Object} - Normalized user object
 */
async function normalizeUserRoles(user) {
  if (!user) return user;

  try {
    // If user has role_id but no role, fetch role from database
    if (user.role_id && !user.role) {
      const role = await Role.findByPk(user.role_id);
      if (role) {
        user.role = role.name;
      }
    }

    // If user has role but no role_id, fetch role_id from database
    if (user.role && !user.role_id) {
      const role = await Role.findOne({ 
        where: { 
          name: user.role,
          isSystemRole: true 
        } 
      });
      if (role) {
        user.role_id = role.id;
      }
    }

    // Validate consistency between role and role_id
    if (user.role && user.role_id) {
      const role = await Role.findByPk(user.role_id);
      if (role && role.name !== user.role) {
        console.warn(`⚠️ Role mismatch detected: role='${user.role}' but role_id points to '${role.name}'`);
        // Auto-correct: prioritize role_id as source of truth
        user.role = role.name;
      }
    }

    return user;
  } catch (error) {
    console.error('Error normalizing user roles:', error);
    return user;
  }
}

/**
 * Validates role consistency for a user
 * @param {Object} user - User object to validate
 * @returns {Object} - Validation result
 */
async function validateRoleConsistency(user) {
  if (!user) {
    return { isValid: false, error: 'User is required' };
  }

  try {
    // Both role and role_id should be present for system roles
    if (!user.role && !user.role_id) {
      return { isValid: false, error: 'User must have either role or role_id' };
    }

    // If both are present, they should be consistent
    if (user.role && user.role_id) {
      const role = await Role.findByPk(user.role_id);
      if (!role) {
        return { isValid: false, error: `Invalid role_id: ${user.role_id}` };
      }
      
      if (role.name !== user.role) {
        return { 
          isValid: false, 
          error: `Role mismatch: role='${user.role}' but role_id points to '${role.name}'`,
          suggestedFix: { role: role.name, role_id: user.role_id }
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
}

/**
 * Syncs role_id based on role name for system roles
 * @param {Object} user - User object
 * @returns {Object} - Updated user object
 */
async function syncRoleIdFromRole(user) {
  if (!user || !user.role) return user;

  try {
    const role = await Role.findOne({ 
      where: { 
        name: user.role,
        isSystemRole: true 
      } 
    });
    
    if (role) {
      user.role_id = role.id;
    } else {
      console.warn(`⚠️ System role not found: ${user.role}`);
    }

    return user;
  } catch (error) {
    console.error('Error syncing role_id from role:', error);
    return user;
  }
}

/**
 * Syncs role based on role_id
 * @param {Object} user - User object
 * @returns {Object} - Updated user object
 */
async function syncRoleFromRoleId(user) {
  if (!user || !user.role_id) return user;

  try {
    const role = await Role.findByPk(user.role_id);
    
    if (role) {
      user.role = role.name;
    } else {
      console.warn(`⚠️ Role not found for role_id: ${user.role_id}`);
    }

    return user;
  } catch (error) {
    console.error('Error syncing role from role_id:', error);
    return user;
  }
}

/**
 * Bulk sync all users to ensure consistency
 * @param {Object} options - Sync options
 * @returns {Object} - Sync results
 */
async function bulkSyncUserRoles(options = {}) {
  const { dryRun = false, batchSize = 100 } = options;
  
  try {
    const { User } = require('../models');
    let processed = 0;
    let errors = 0;
    let fixed = 0;

    console.log(`🔄 Starting bulk role sync (dryRun: ${dryRun})...`);

    // Process users in batches
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const users = await User.findAll({
        limit: batchSize,
        offset: offset,
        include: [{
          model: Role,
          as: 'rbacRole',
          required: false
        }]
      });

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      for (const user of users) {
        try {
          const validation = await validateRoleConsistency(user);
          
          if (!validation.isValid) {
            errors++;
            console.warn(`⚠️ User ${user.id}: ${validation.error}`);
            
            if (validation.suggestedFix && !dryRun) {
              await user.update(validation.suggestedFix);
              fixed++;
            }
          }
          
          processed++;
        } catch (error) {
          errors++;
          console.error(`❌ Error processing user ${user.id}:`, error.message);
        }
      }

      offset += batchSize;
    }

    const result = {
      processed,
      errors,
      fixed,
      dryRun
    };

    console.log(`✅ Bulk role sync completed:`, result);
    return result;
  } catch (error) {
    console.error('❌ Bulk role sync failed:', error);
    throw error;
  }
}

module.exports = {
  normalizeUserRoles,
  validateRoleConsistency,
  syncRoleIdFromRole,
  syncRoleFromRoleId,
  bulkSyncUserRoles
};

