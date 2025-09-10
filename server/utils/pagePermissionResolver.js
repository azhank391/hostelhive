/**
 * 🎯 DYNAMIC PAGE PERMISSION RESOLVER
 * 
 * This class integrates all our RBAC analysis work:
 * - API Permission Mapping (Phase 1)
 * - Page API Mapping (Phase 2)
 * - Unified Dependency Resolution
 * 
 * It provides intelligent, dynamic permission resolution for pages and user access validation.
 */

const { getPageApis, getPagesForApi, getAllPageApis } = require('./pageApiMap');
const { getPagePermissions, getPagesForPermission, getAllPagePermissions } = require('./pagePermissionMap');
const { getApiPermissions, getApisForPermission } = require('./apiPermissionMap');
const UnifiedDependencyResolver = require('./unifiedDependencyResolver');

class PagePermissionResolver {
  constructor() {
    this.apiPermissionMap = require('./apiPermissionMap');
    this.pageApiMap = require('./pageApiMap');
    this.pagePermissionMap = require('./pagePermissionMap');
    this.unifiedResolver = UnifiedDependencyResolver;
    
    // Cache for performance
    this.permissionCache = new Map();
    this.accessCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get all permissions needed for a specific page (with intelligent dependency resolution)
   * @param {string} pageName - The page name (e.g., 'students', 'rooms', 'visitors')
   * @param {Object} options - Configuration options
   * @returns {Promise<Array<string>>} Array of resolved permission names
   */
  async getPageRequiredPermissions(pageName, options = {}) {
    const cacheKey = `page_permissions_${pageName}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.permissionCache.has(cacheKey)) {
      const cached = this.permissionCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`🎯 [PageResolver] Using cached permissions for page: ${pageName}`);
        return cached.permissions;
      }
    }

    console.log(`🎯 [PageResolver] Resolving permissions for page: ${pageName}`);
    
    try {
      // Step 1: Get base permissions from page mapping
      const basePermissions = getPagePermissions(pageName);
      console.log(`📋 [PageResolver] Base permissions for ${pageName}:`, basePermissions);

      // Step 2: Get APIs for this page
      const pageApis = getPageApis(pageName);
      console.log(`🔗 [PageResolver] APIs for ${pageName}:`, pageApis);

      // Step 3: Get permissions from API calls
      const apiPermissions = new Set();
      pageApis.forEach(api => {
        const [method, path] = api.split(' ');
        const permissions = getApiPermissions(method, path);
        permissions.forEach(perm => apiPermissions.add(perm));
      });
      
      const apiPermissionsArray = Array.from(apiPermissions);
      console.log(`🌐 [PageResolver] API-derived permissions for ${pageName}:`, apiPermissionsArray);

      // Step 4: Combine base and API permissions
      const allBasePermissions = [...new Set([...basePermissions, ...apiPermissionsArray])];
      console.log(`🔗 [PageResolver] Combined base permissions for ${pageName}:`, allBasePermissions);

      // Step 5: Use UnifiedDependencyResolver for intelligent dependency resolution
      const resolvedPermissions = new Set();
      
      for (const permission of allBasePermissions) {
        try {
          const dependencies = await this.unifiedResolver.getUnifiedDependencies(permission);
          dependencies.forEach(dep => resolvedPermissions.add(dep));
          console.log(`🧠 [PageResolver] Resolved dependencies for ${permission}:`, dependencies);
        } catch (error) {
          console.warn(`⚠️ [PageResolver] Failed to resolve dependencies for ${permission}:`, error.message);
          // Fallback: add the permission itself
          resolvedPermissions.add(permission);
        }
      }

      const finalPermissions = Array.from(resolvedPermissions).sort();
      console.log(`✅ [PageResolver] Final resolved permissions for ${pageName}:`, finalPermissions);

      // Cache the result
      this.permissionCache.set(cacheKey, {
        permissions: finalPermissions,
        timestamp: Date.now()
      });

      return finalPermissions;

    } catch (error) {
      console.error(`❌ [PageResolver] Error resolving permissions for ${pageName}:`, error);
      // Fallback to base permissions
      return basePermissions;
    }
  }

  /**
   * Check if user can access a specific page
   * @param {Array<string>} userPermissions - User's current permissions
   * @param {string} pageName - The page name
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} Access validation result
   */
  async canUserAccessPage(userPermissions, pageName, options = {}) {
    const cacheKey = `access_${pageName}_${userPermissions.sort().join(',')}`;
    
    // Check cache first
    if (this.accessCache.has(cacheKey)) {
      const cached = this.accessCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`🎯 [PageResolver] Using cached access result for page: ${pageName}`);
        return cached.result;
      }
    }

    console.log(`🎯 [PageResolver] Checking access for page: ${pageName}`);
    
    try {
      const requiredPermissions = await this.getPageRequiredPermissions(pageName, options);
      const userPermissionSet = new Set(userPermissions);
      
      const missingPermissions = requiredPermissions.filter(perm => !userPermissionSet.has(perm));
      const hasAccess = missingPermissions.length === 0;
      
      const result = {
        hasAccess,
        pageName,
        requiredPermissions,
        userPermissions,
        missingPermissions,
        accessLevel: this.calculateAccessLevel(userPermissions, requiredPermissions),
        timestamp: new Date().toISOString()
      };

      console.log(`🔍 [PageResolver] Access check result for ${pageName}:`, {
        hasAccess,
        missingPermissions: missingPermissions.length,
        accessLevel: result.accessLevel
      });

      // Cache the result
      this.accessCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error(`❌ [PageResolver] Error checking access for ${pageName}:`, error);
      return {
        hasAccess: false,
        pageName,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate access level based on user permissions vs required permissions
   * @param {Array<string>} userPermissions - User's permissions
   * @param {Array<string>} requiredPermissions - Required permissions
   * @returns {string} Access level
   */
  calculateAccessLevel(userPermissions, requiredPermissions) {
    const userSet = new Set(userPermissions);
    const requiredSet = new Set(requiredPermissions);
    
    const hasAllRequired = requiredPermissions.every(perm => userSet.has(perm));
    const hasExtraPermissions = userPermissions.some(perm => !requiredSet.has(perm));
    
    if (hasAllRequired && hasExtraPermissions) {
      return 'full_access';
    } else if (hasAllRequired) {
      return 'required_access';
    } else {
      const coverage = requiredPermissions.filter(perm => userSet.has(perm)).length / requiredPermissions.length;
      if (coverage >= 0.8) {
        return 'partial_access';
      } else if (coverage >= 0.5) {
        return 'limited_access';
      } else {
        return 'no_access';
      }
    }
  }

  /**
   * Get all pages a user can access
   * @param {Array<string>} userPermissions - User's permissions
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} Access summary for all pages
   */
  async getUserPageAccess(userPermissions, options = {}) {
    console.log(`🎯 [PageResolver] Analyzing page access for user with ${userPermissions.length} permissions`);
    
    const allPages = Object.keys(this.pagePermissionMap.PAGE_PERMISSION_MAP);
    const accessResults = {};
    
    for (const pageName of allPages) {
      try {
        const accessResult = await this.canUserAccessPage(userPermissions, pageName, options);
        accessResults[pageName] = accessResult;
      } catch (error) {
        console.error(`❌ [PageResolver] Error analyzing access for page ${pageName}:`, error);
        accessResults[pageName] = {
          hasAccess: false,
          pageName,
          error: error.message
        };
      }
    }

    const summary = {
      totalPages: allPages.length,
      accessiblePages: Object.values(accessResults).filter(result => result.hasAccess).length,
      accessLevels: this.summarizeAccessLevels(accessResults),
      accessiblePagesList: Object.entries(accessResults)
        .filter(([_, result]) => result.hasAccess)
        .map(([page, _]) => page),
      inaccessiblePagesList: Object.entries(accessResults)
        .filter(([_, result]) => !result.hasAccess)
        .map(([page, result]) => ({
          page,
          missingPermissions: result.missingPermissions || [],
          accessLevel: result.accessLevel || 'no_access'
        })),
      timestamp: new Date().toISOString()
    };

    console.log(`📊 [PageResolver] User page access summary:`, {
      accessible: summary.accessiblePages,
      total: summary.totalPages,
      accessLevels: summary.accessLevels
    });

    return {
      summary,
      details: accessResults
    };
  }

  /**
   * Summarize access levels across all pages
   * @param {Object} accessResults - Access results for all pages
   * @returns {Object} Access level summary
   */
  summarizeAccessLevels(accessResults) {
    const levels = {
      full_access: 0,
      required_access: 0,
      partial_access: 0,
      limited_access: 0,
      no_access: 0
    };

    Object.values(accessResults).forEach(result => {
      if (result.accessLevel) {
        levels[result.accessLevel] = (levels[result.accessLevel] || 0) + 1;
      } else {
        levels.no_access++;
      }
    });

    return levels;
  }

  /**
   * Get role permission requirements for specific pages
   * @param {Array<string>} pageNames - Array of page names
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} Role permission requirements
   */
  async getRolePermissionRequirements(pageNames, options = {}) {
    console.log(`🎯 [PageResolver] Calculating role requirements for pages:`, pageNames);
    
    const allPermissions = new Set();
    const pageRequirements = {};
    
    for (const pageName of pageNames) {
      try {
        const pagePermissions = await this.getPageRequiredPermissions(pageName, options);
        pageRequirements[pageName] = pagePermissions;
        pagePermissions.forEach(perm => allPermissions.add(perm));
      } catch (error) {
        console.error(`❌ [PageResolver] Error getting requirements for page ${pageName}:`, error);
        pageRequirements[pageName] = [];
      }
    }

    const uniquePermissions = Array.from(allPermissions).sort();
    
    const result = {
      requestedPages: pageNames,
      totalUniquePermissions: uniquePermissions.length,
      allPermissions: uniquePermissions,
      pageRequirements,
      permissionBreakdown: this.analyzePermissionBreakdown(uniquePermissions),
      timestamp: new Date().toISOString()
    };

    console.log(`📋 [PageResolver] Role requirements calculated:`, {
      pages: pageNames.length,
      totalPermissions: uniquePermissions.length,
      breakdown: result.permissionBreakdown
    });

    return result;
  }

  /**
   * Analyze permission breakdown by category
   * @param {Array<string>} permissions - Array of permissions
   * @returns {Object} Permission breakdown
   */
  analyzePermissionBreakdown(permissions) {
    const breakdown = {
      view_permissions: [],
      manage_permissions: [],
      action_permissions: [],
      system_permissions: [],
      other_permissions: []
    };

    permissions.forEach(permission => {
      if (permission.startsWith('view_')) {
        breakdown.view_permissions.push(permission);
      } else if (permission.startsWith('manage_')) {
        breakdown.manage_permissions.push(permission);
      } else if (permission.includes('_') && !permission.startsWith('view_') && !permission.startsWith('manage_')) {
        breakdown.action_permissions.push(permission);
      } else if (permission.includes('system') || permission.includes('admin')) {
        breakdown.system_permissions.push(permission);
      } else {
        breakdown.other_permissions.push(permission);
      }
    });

    return breakdown;
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.permissionCache.clear();
    this.accessCache.clear();
    console.log(`🧹 [PageResolver] All caches cleared`);
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      permissionCacheSize: this.permissionCache.size,
      accessCacheSize: this.accessCache.size,
      cacheExpiry: this.cacheExpiry
    };
  }
}

// Create singleton instance
const pagePermissionResolver = new PagePermissionResolver();

module.exports = {
  PagePermissionResolver,
  pagePermissionResolver
};
