/**
 * 🎯 UNIFIED DEPENDENCY RESOLVER - FIXED VERSION
 *
 * Single, fine-tuned resolver that ensures any action permission automatically
 * gets the corresponding view permission for sidebar visibility.
 *
 * FIXES:
 * - Removed overly broad cross-dependencies
 * - Made dependencies more specific and operation-focused
 * - Removed automatic hostel_read/view_dashboard for custom roles
 * - Only adds dependencies that are truly necessary for the operation
 */

const { Permission } = require("../models");
const {
  getApisForPermission,
  getApiPermissions,
} = require("./apiPermissionMap");

class UnifiedDependencyResolver {
  static permissionCache = new Map();
  static dependencyCache = new Map();
  static cacheExpiry = 5 * 60 * 1000; // 5 minutes
  static cacheTimestamps = new Map();

  /**
   * 🎯 ACTION TO VIEW PERMISSION MAPPING - REFINED
   * Maps action permissions to their corresponding view permissions for sidebar visibility
   * This is the ONLY cross-resource dependency that should be automatic
   */
  static ACTION_TO_VIEW_MAPPING = {
    // Room Management Actions - only need room_read for sidebar
    room_create: "room_read",
    room_update: "room_read",
    room_delete: "room_read",
    room_allocation_create: "room_read", // ONLY room_read, not student_read
    room_allocation_delete: "room_read", // ONLY room_read, not student_read

    // Student Management Actions - only need student_read for sidebar
    student_create: "student_read",
    student_update: "student_read",
    student_delete: "student_read",
    export_student_data: "student_read",
    manage_student_rooms: "student_read",

    // Complaint Management Actions
    complaint_create: "complaint_read",
    complaint_update: "complaint_read",
    complaint_delete: "complaint_read",
    view_complaint_stats: "complaint_read",
    export_complaint_data: "complaint_read",

    // Visitor Management Actions
    visitor_create: "visitor_read",
    visitor_update: "visitor_read",
    visitor_delete: "visitor_read",
    export_visitor_data: "visitor_read",

    // Staff Management Actions
    staff_create: "staff_read",
    staff_update: "staff_read",
    staff_delete: "staff_read",
    role_assign: "staff_read",
    export_staff_data: "staff_read",

    // Reports Actions
    view_reports: "view_reports",
    view_analytics: "view_reports",
    view_billing: "view_reports",

    // Billing Actions
    manage_billing: "view_reports",

    // Hostel Management Actions
    hostel_create: "hostel_read",
    hostel_update: "hostel_read",
    hostel_delete: "hostel_read",
    view_hostel_stats: "hostel_read",
    hostel_settings_update: "hostel_read",

    // Profile Management Actions
    manage_profile: "view_own_data",
    change_password: "view_own_data",
    view_own_data: "view_own_data",
  };

  /**
   * 🎯 REFINED CROSS-DEPENDENCIES - OPERATION-SPECIFIC ONLY
   * Only includes dependencies that are absolutely critical for the operation to function
   * REMOVED broad dependencies that were causing unwanted sidebar access
   */
  static CROSS_DEPENDENCIES = {
    // These are the ONLY operations that truly need cross-resource access
    // All others should be explicit choices by the admin

    // Room allocation APIs specifically need both resources
    "POST /hostels/:hostelId/room-allocations": ["student_read", "room_read"],
    "PUT /hostels/:hostelId/room-allocations/:id": [
      "student_read",
      "room_read",
    ],
    "DELETE /hostels/:hostelId/room-allocations/:id": [
      "student_read",
      "room_read",
    ],

    // Student room assignment API specifically needs room access
    "POST /hostels/:hostelId/students/:studentId/assign-room": ["room_read"],
    "DELETE /hostels/:hostelId/students/:studentId/assign-room": ["room_read"],
  };

  /**
   * Get unified dependencies for a permission using refined logic
   * @param {string} permissionName - The permission name
   * @returns {Array<string>} Array of all required dependencies
   */
  static async getUnifiedDependencies(permissionName) {
    const context = {
      permissionName,
      requestId: Math.random().toString(36).substr(2, 9),
      startTime: Date.now(),
    };

    try {
      console.log(
        `🎯 [${context.requestId}] Getting unified dependencies for: ${permissionName}`
      );

      // Check cache first
      const cacheKey = `unified_${permissionName}`;
      if (this.isCacheValid(cacheKey)) {
        const cached = this.dependencyCache.get(cacheKey);
        console.log(
          `⚡ [${context.requestId}] Cache hit for ${permissionName}`
        );
        return cached;
      }

      // Initialize dependencies - NO universal dependencies
      const dependencies = new Set();

      // 1. ONLY add view permission for sidebar visibility (most important fix)
      const viewPermission = this.ACTION_TO_VIEW_MAPPING[permissionName];
      if (viewPermission) {
        dependencies.add(viewPermission);
        console.log(
          `📋 [${context.requestId}] Added view permission: ${viewPermission}`
        );
      }

      // 2. REMOVED broad cross-dependencies - they were causing the issue
      // Cross-dependencies now only apply to specific API endpoints, not general permissions

      // 3. REMOVED universal hostel_read - let it be explicit
      // 4. REMOVED universal view_dashboard - let it be explicit
      // 5. REMOVED resource dependencies - they were too broad

      // 6. Only validate the minimal dependencies we actually added
      const allDeps = Array.from(dependencies);
      const validatedDeps = await this.validateDependenciesBatch(allDeps);

      // Cache the result
      this.dependencyCache.set(cacheKey, validatedDeps);
      this.cacheTimestamps.set(cacheKey, Date.now());

      const duration = Date.now() - context.startTime;
      console.log(
        `✅ [${context.requestId}] Completed in ${duration}ms - Dependencies:`,
        validatedDeps
      );

      return validatedDeps;
    } catch (error) {
      console.error(
        `❌ [${context.requestId}] Error in dependency detection:`,
        error.message
      );

      // Fallback to minimal dependencies - just the view permission if available
      const fallbackDeps = [];
      const viewPermission = this.ACTION_TO_VIEW_MAPPING[permissionName];
      if (viewPermission) {
        fallbackDeps.push(viewPermission);
      }
      console.log(
        `🔄 [${context.requestId}] Using fallback dependencies:`,
        fallbackDeps
      );

      return fallbackDeps;
    }
  }

  /**
   * Get API-specific dependencies (used only for specific endpoint analysis)
   * This replaces the broad cross-dependencies with endpoint-specific ones
   * @param {string} endpoint - The specific API endpoint
   * @returns {Array<string>} Array of endpoint-specific dependencies
   */
  static getEndpointSpecificDependencies(endpoint) {
    return this.CROSS_DEPENDENCIES[endpoint] || [];
  }

  /**
   * Validate that dependencies exist in the database
   * @param {Array<string>} dependencies - Array of permission names to validate
   * @returns {Array<string>} Array of valid permission names
   */
  static async validateDependenciesBatch(dependencies) {
    if (!dependencies || dependencies.length === 0) return [];

    try {
      const permissions = await Permission.findAll({
        where: { name: dependencies },
        attributes: ["name"],
      });

      const validPermissions = permissions.map((p) => p.name);
      const invalidPermissions = dependencies.filter(
        (dep) => !validPermissions.includes(dep)
      );

      if (invalidPermissions.length > 0) {
        console.warn(`⚠️ Invalid permissions found:`, invalidPermissions);
      }

      return validPermissions;
    } catch (error) {
      console.error("Error validating dependencies:", error.message);
      return []; // No fallback dependencies - let permissions be explicit
    }
  }

  /**
   * Check if cache is valid
   * @param {string} cacheKey - Cache key to check
   * @returns {boolean} True if cache is valid
   */
  static isCacheValid(cacheKey) {
    const timestamp = this.cacheTimestamps.get(cacheKey);
    if (!timestamp) return false;

    const now = Date.now();
    return now - timestamp < this.cacheExpiry;
  }

  /**
   * 🎯 PHASE 3 INTEGRATION: Resolve permissions for multiple permissions at once
   * This method is used by PagePermissionResolver for batch permission resolution
   * @param {Array<string>} permissionNames - Array of permission names to resolve
   * @param {Object} options - Configuration options
   * @returns {Promise<Array<string>>} Array of resolved permission names
   */
  static async resolvePermissions(permissionNames, options = {}) {
    const context = {
      requestId: `batch_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      startTime: Date.now(),
      ...options,
    };

    console.log(
      `🧠 [UnifiedResolver] Batch resolving ${permissionNames.length} permissions:`,
      permissionNames
    );

    const allDependencies = new Set();

    // Add the original permissions first
    permissionNames.forEach((permission) => allDependencies.add(permission));

    // Then add only their minimal dependencies
    for (const permissionName of permissionNames) {
      try {
        const dependencies = await this.getUnifiedDependencies(permissionName);
        dependencies.forEach((dep) => allDependencies.add(dep));
      } catch (error) {
        console.warn(
          `⚠️ [UnifiedResolver] Failed to resolve ${permissionName}:`,
          error.message
        );
      }
    }

    const resolvedPermissions = Array.from(allDependencies).sort();

    console.log(
      `✅ [UnifiedResolver] Batch resolution complete: ${permissionNames.length} → ${resolvedPermissions.length} permissions`
    );

    return resolvedPermissions;
  }

  /**
   * Test refined scenarios
   * @param {string} scenario - The scenario to test
   * @returns {Object} Test results
   */
  static async testScenario(scenario) {
    const scenarios = {
      "student-only": ["student_read", "student_create", "student_update"],
      "visitor-only": ["visitor_read", "visitor_create", "visitor_update"],
      "room-only": ["room_read", "room_create", "room_update"],
    };

    const permissions = scenarios[scenario];
    if (!permissions) {
      throw new Error(`Unknown scenario: ${scenario}`);
    }

    console.log(`� Testing refined scenario: ${scenario}`);
    console.log(`📋 Base permissions:`, permissions);

    const allDependencies = new Set();
    for (const permission of permissions) {
      const deps = await this.getUnifiedDependencies(permission);
      deps.forEach((dep) => allDependencies.add(dep));
    }

    const finalPermissions = [...new Set([...permissions, ...allDependencies])];

    return {
      scenario,
      basePermissions: permissions,
      dependencies: [...allDependencies],
      finalPermissions,
      totalPermissions: finalPermissions.length,
    };
  }
}

module.exports = UnifiedDependencyResolver;
