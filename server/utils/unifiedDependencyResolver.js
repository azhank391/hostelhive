/**
 * 🎯 UNIFIED DEPENDENCY RESOLVER
 *
 * Single, fine-tuned resolver that ensures any action permission automatically
 * gets the corresponding view permission for sidebar visibility.
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
   * 🎯 ACTION TO VIEW PERMISSION MAPPING
   * Maps action permissions to their corresponding view permissions for sidebar visibility
   */
  static ACTION_TO_VIEW_MAPPING = {
    // Room Management Actions
    room_create: "room_read",
    room_update: "room_read",
    room_delete: "room_read",
    room_update: "room_read",
    room_allocate: "room_read",
    room_allocate: "room_read",
    room_deallocate: "room_read",
    room_deallocate: "room_read",
    room_allocation_read: "room_read",

    // Student Management Actions
    student_create: "student_read",
    student_update: "student_read",
    student_delete: "student_read",
    student_update: "student_read",
    student_export: "student_read",
    student_room_assign: "student_read",
    student_room_read: "student_read",

    // Complaint Management Actions
    complaint_create: "complaint_read",
    complaint_update: "complaint_read",
    complaint_delete: "complaint_read",
    complaint_create: "complaint_read",
    complaint_update: "complaint_read",
    complaint_update: "complaint_read",
    complaint_stats_read: "complaint_read",

    // Visitor Management Actions
    visitor_create: "visitor_read",
    visitor_update: "visitor_read",
    visitor_delete: "visitor_read",
    visitor_create: "visitor_read",
    visitor_update: "visitor_read",
    visitor_checkout: "visitor_read",
    visitor_checkout: "visitor_read",
    visitor_export: "visitor_read",
    visitor_stats_read: "visitor_read",

    // Warden Management Actions
    warden_create: "warden_read",
    warden_update: "warden_read",
    warden_delete: "warden_read",
    warden_role_assign: "warden_read",

    // Role/Staff Management Actions
    role_create: "role_read",
    role_update: "role_read",
    role_delete: "role_read",
    role_update: "role_read",
    role_assign: "role_read",
    permission_manage: "role_read",

    // Reports Actions
    analytics_read: "report_read",
    data_export: "report_read",
    export_data: "report_read",

    // Billing Actions
    billing_manage: "billing_read",

    // Hostel Management Actions
    hostel_create: "hostel_read",
    hostel_update: "hostel_read",
    hostel_delete: "hostel_read",
    hostel_update: "hostel_read",
    hostel_stats_read: "hostel_read",
    hostel_settings_update: "hostel_read",

    // Profile Management Actions
    profile_create: "profile_read",
    profile_update: "profile_read",
    profile_delete: "profile_read",

    // User Management Actions
    user_create: "user_read",
    user_update: "user_read",
    user_delete: "user_read",
  };

  /**
   * 🎯 CROSS-DEPENDENCY MAPPING
   * Maps permissions to other permissions they need to function properly
   */
  static CROSS_DEPENDENCIES = {
    // Room allocation needs to see students and rooms
    room_allocate: ["student_read", "room_read"],
    room_allocate: ["student_read", "room_read"],
    room_deallocate: ["student_read", "room_read"],
    room_deallocate: ["student_read", "room_read"],
    room_allocation_read: ["student_read", "room_read"],

    // Student room assignment needs to see rooms
    student_room_assign: ["room_read"],
    student_room_read: ["room_read"],

    // Complaint handling needs to see students for context
    complaint_update: ["student_read"],
    complaint_update: ["student_read"],

    // Visitor management needs to see students for context
    visitor_update: ["student_read"],
    visitor_checkout: ["student_read"],
    visitor_checkout: ["student_read"],

    // Warden management needs to see roles
    warden_role_assign: ["role_read"],

    // Role management needs to see roles
    role_assign: ["role_read"],
  };

  /**
   * Get unified dependencies for a permission using API-driven analysis
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

      // Initialize dependencies - REMOVED universal hostel_read dependency
      const dependencies = new Set();

      // 1. Add view permission for sidebar visibility
      const viewPermission = this.ACTION_TO_VIEW_MAPPING[permissionName];
      if (viewPermission) {
        dependencies.add(viewPermission);
        console.log(
          `📋 [${context.requestId}] Added view permission: ${viewPermission}`
        );
      }

      // 2. Add cross-dependencies
      const crossDeps = this.CROSS_DEPENDENCIES[permissionName] || [];
      crossDeps.forEach((dep) => {
        dependencies.add(dep);
        console.log(`🔗 [${context.requestId}] Added cross-dependency: ${dep}`);
      });

      // 3. Add specific resource dependencies based on permission type
      const resourceDeps = this.getResourceDependencies(permissionName);
      resourceDeps.forEach((dep) => {
        dependencies.add(dep);
        console.log(
          `🏠 [${context.requestId}] Added resource dependency: ${dep}`
        );
      });

      // 4. 🆕 API-DRIVEN DEPENDENCY ANALYSIS
      const apiDeps = this.getApiDrivenDependencies(permissionName);
      apiDeps.forEach((dep) => {
        dependencies.add(dep);
        console.log(
          `🌐 [${context.requestId}] Added API-driven dependency: ${dep}`
        );
      });

      // 5. Validate all dependencies exist in database
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
   * 🆕 Get API-driven dependencies based on actual API usage patterns
   * @param {string} permissionName - The permission name
   * @returns {Array<string>} Array of API-driven dependencies
   */
  static getApiDrivenDependencies(permissionName) {
    const dependencies = [];

    // Get all APIs that use this permission
    const apis = getApisForPermission(permissionName);

    // Analyze each API to determine what other permissions might be needed
    apis.forEach((api) => {
      const [method, path] = api.split(" ");

      // Room allocation APIs need to see students and rooms
      if (
        path.includes("/room-allocations") ||
        path.includes("/allocate") ||
        path.includes("/deallocate")
      ) {
        dependencies.push("student_read", "room_read");
      }

      // Student management APIs need to see students
      if (path.includes("/students")) {
        dependencies.push("student_read");
      }

      // Room management APIs need to see rooms
      if (path.includes("/rooms") && !path.includes("/room-allocations")) {
        dependencies.push("room_read");
      }

      // Complaint APIs need to see students for context
      if (path.includes("/complaints")) {
        dependencies.push("student_read");
      }

      // Visitor APIs need to see students for context
      if (path.includes("/visitors")) {
        dependencies.push("student_read");
      }

      // Warden management APIs need to see wardens
      if (path.includes("/wardens")) {
        dependencies.push("warden_read");
      }

      // Staff management APIs need to see roles
      if (path.includes("/staff")) {
        dependencies.push("role_read");
      }
    });

    return [...new Set(dependencies)]; // Remove duplicates
  }

  /**
   * Get resource-specific dependencies
   * @param {string} permissionName - The permission name
   * @returns {Array<string>} Array of resource dependencies
   */
  static getResourceDependencies(permissionName) {
    const deps = [];

    // Room-related permissions need view_rooms
    if (
      permissionName.includes("room") ||
      permissionName.includes("allocate") ||
      permissionName.includes("deallocate")
    ) {
      deps.push("room_read");
    }

    // Student-related permissions need view_students
    if (
      permissionName.includes("student") ||
      permissionName.includes("complaint") ||
      permissionName.includes("visitor")
    ) {
      deps.push("student_read");
    }

    // Complaint-related permissions need view_complaints
    if (permissionName.includes("complaint")) {
      deps.push("complaint_read");
    }

    // Visitor-related permissions need view_visitors
    if (permissionName.includes("visitor")) {
      deps.push("visitor_read");
    }

    // Warden-related permissions need view_wardens
    if (permissionName.includes("warden")) {
      deps.push("warden_read");
    }

    // Role-related permissions need view_roles
    if (
      permissionName.includes("role") ||
      permissionName.includes("permission")
    ) {
      deps.push("role_read");
    }

    // Report-related permissions need view_reports
    if (
      permissionName.includes("report") ||
      permissionName.includes("analytics")
    ) {
      deps.push("view_reports");
    }

    // Billing-related permissions need view_billing
    if (permissionName.includes("billing")) {
      deps.push("billing_read");
    }

    return deps;
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
   * Test specific scenarios with unified resolver
   * @param {string} scenario - The scenario to test
   * @returns {Object} Test results
   */
  static async testScenario(scenario) {
    const scenarios = {
      "deallocate-students-only": ["room_deallocate"],
      "delete-warden-only": ["warden_delete"],
      "create-complaint-only": ["complaint_create"],
      "manage-visitors-only": ["visitor_update"],
      "room-manager": ["room_create", "room_update", "room_delete"],
      "student-manager": ["student_create", "student_update", "student_delete"],
    };

    const permissions = scenarios[scenario];
    if (!permissions) {
      throw new Error(`Unknown scenario: ${scenario}`);
    }

    console.log(`🧪 Testing unified scenario: ${scenario}`);
    console.log(`📋 Base permissions:`, permissions);

    // Get dependencies for each permission
    const allDependencies = new Set();
    for (const permission of permissions) {
      const deps = await this.getUnifiedDependencies(permission);
      deps.forEach((dep) => allDependencies.add(dep));
    }

    const finalPermissions = [...permissions, ...allDependencies];

    return {
      scenario,
      basePermissions: permissions,
      dependencies: [...allDependencies],
      finalPermissions,
      totalPermissions: finalPermissions.length,
    };
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

    for (const permissionName of permissionNames) {
      try {
        const dependencies = await this.getUnifiedDependencies(
          permissionName,
          context
        );
        dependencies.forEach((dep) => allDependencies.add(dep));
      } catch (error) {
        console.warn(
          `⚠️ [UnifiedResolver] Failed to resolve ${permissionName}:`,
          error.message
        );
        // Add the permission itself as fallback
        allDependencies.add(permissionName);
      }
    }

    const resolvedPermissions = Array.from(allDependencies).sort();

    console.log(
      `✅ [UnifiedResolver] Batch resolution complete: ${permissionNames.length} → ${resolvedPermissions.length} permissions`
    );

    return resolvedPermissions;
  }
}

module.exports = UnifiedDependencyResolver;
