#!/usr/bin/env node
/**
 * Permission Audit Script
 * Verifies consistency across:
 *  - Database permissions (Permission table)
 *  - Backend canonical definitions (permissionDefinitions.js)
 *  - API usage map (apiPermissionMap.js)
 *  - Frontend AVAILABLE_PERMISSIONS list (permissionUtils.ts)
 *  - Legacy translation map (rbacService.js)
 * Reports:
 *  - missingInDB: referenced in code but not in DB
 *  - orphanedInDB: present in DB but not referenced anywhere in code
 *  - unusedDefinitions: defined canonically but not used by any API nor frontend list
 *  - mismatches: differences between frontend list and backend canonical definitions
 *  - legacyTranslations: legacy names still translated; ensure no legacy names leak into code
 */
const path = require("path");
const fs = require("fs");
const { Sequelize } = require("sequelize");

// Load environment (best effort)
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// --- 1. Load backend canonical definitions
const { PERMISSION_DEFINITIONS } = require("../utils/permissionDefinitions");
const backendCanonical = new Set(Object.keys(PERMISSION_DEFINITIONS));

// --- 2. Load API permission map
const { API_PERMISSION_MAP } = require("../utils/apiPermissionMap");
const apiPermissions = new Set();
Object.values(API_PERMISSION_MAP).forEach((list) =>
  list.forEach((p) => apiPermissions.add(p))
);

// --- 3. Parse frontend AVAILABLE_PERMISSIONS from TS file
const FRONTEND_FILE = path.join(__dirname, "..", "..", "client_placeholder"); // replaced dynamically below
// Real path relative to monorepo root structure
let frontendPermissions = new Set();
try {
  // Determine monorepo root (one level up from server directory)
  const repoRoot = path.join(__dirname, "..", ".."); // points to /hostelhive/server/..
  const rootParent = path.join(repoRoot, ".."); // one more level (in case server nested) but our structure has client sibling to server
  const candidatePaths = [
    path.join(repoRoot, "client", "src", "lib", "permissionUtils.ts"), // e.g. hostelhive/server/client/... (unlikely)
    path.join(rootParent, "client", "src", "lib", "permissionUtils.ts"), // expected: hostelhive/client/src/lib/permissionUtils.ts
    path.join(
      __dirname,
      "..",
      "..",
      "..",
      "client",
      "src",
      "lib",
      "permissionUtils.ts"
    ), // fallback
  ];
  const frontendFile = candidatePaths.find((p) => fs.existsSync(p));
  if (!frontendFile) {
    throw new Error("permissionUtils.ts not found in candidate paths");
  }
  const content = fs.readFileSync(frontendFile, "utf8");
  const match = content.match(
    /export const AVAILABLE_PERMISSIONS: Permission\[] = \[(.*?)\]/s
  );
  if (match) {
    match[1]
      .split(",")
      .map((s) => s.replace(/['"\s]/g, "").trim())
      .filter(Boolean)
      .forEach((p) => frontendPermissions.add(p));
  } else {
    console.warn("⚠️ Could not parse AVAILABLE_PERMISSIONS from frontend file");
  }
} catch (e) {
  console.warn("⚠️ Frontend permission list not found:", e.message);
}

// --- 4. Extract legacy translation keys from RBAC service
let legacyTranslations = [];
try {
  const rbacPath = path.join(__dirname, "..", "services", "rbacService.js");
  const rbacContent = fs.readFileSync(rbacPath, "utf8");
  const transMatch = rbacContent.match(/const TRANSLATION = {([\s\S]*?)};/);
  if (transMatch) {
    const objLiteral = transMatch[1];
    const keyRegex = /(\w+):/g;
    let m;
    const keys = [];
    while ((m = keyRegex.exec(objLiteral)) !== null) {
      keys.push(m[1]);
    }
    legacyTranslations = keys;
  }
} catch (e) {
  console.warn("⚠️ Could not parse legacy translations:", e.message);
}

// --- 5. Initialize DB connection (read-only audit)
async function getDbPermissions() {
  const db = process.env.DB_NAME || process.env.MYSQL_DATABASE || "hostelhive";
  const user =
    process.env.DB_USER ||
    process.env.MYSQL_USER ||
    process.env.DB_USERNAME ||
    "root";
  const pass =
    process.env.DB_PASS ||
    process.env.MYSQL_PASSWORD ||
    process.env.DB_PASSWORD ||
    "";
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = process.env.DB_PORT || 3306;

  const sequelize = new Sequelize(db, user, pass, {
    host,
    port,
    dialect: "mysql",
    logging: false,
  });
  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query("SELECT name FROM Permissions");
    await sequelize.close();
    return rows.map((r) => r.name);
  } catch (e) {
    console.warn(
      "⚠️ Database not reachable, skipping DB part of audit:",
      e.message
    );
    return [];
  }
}

function setDiff(a, b) {
  return [...a].filter((x) => !b.has(x));
}

async function run() {
  const dbPermsArr = await getDbPermissions();
  const dbPermissions = new Set(dbPermsArr);

  const codeReferenced = new Set([
    ...backendCanonical,
    ...apiPermissions,
    ...frontendPermissions,
  ]);

  const missingInDB = setDiff(codeReferenced, dbPermissions);
  const orphanedInDB = setDiff(dbPermissions, codeReferenced);
  const unusedDefinitions = setDiff(
    backendCanonical,
    new Set([...apiPermissions, ...frontendPermissions])
  );
  const frontendNotInBackend = setDiff(frontendPermissions, backendCanonical);
  const backendNotInFrontend = setDiff(backendCanonical, frontendPermissions);

  const legacyTranslationStillReferenced = legacyTranslations.filter((lt) =>
    codeReferenced.has(lt)
  );

  // --- 6. Role matrix validation (best-effort) ---
  let roleMatrixReport = { skipped: true };
  try {
    const pathConfig = path.join(__dirname, "..", "config", "config.js");
    // Reuse a lightweight Sequelize instance for role queries
    const db =
      process.env.DB_NAME || process.env.MYSQL_DATABASE || "hostelhive";
    const user =
      process.env.DB_USER ||
      process.env.MYSQL_USER ||
      process.env.DB_USERNAME ||
      "root";
    const pass =
      process.env.DB_PASS ||
      process.env.DB_PASSWORD ||
      process.env.MYSQL_PASSWORD ||
      "";
    const host = process.env.DB_HOST || "127.0.0.1";
    const port = process.env.DB_PORT || 3306;
    const sequelize = new Sequelize(db, user, pass, {
      host,
      port,
      dialect: "mysql",
      logging: false,
    });

    // Expected role permission sets (must stay in sync with alignment migration)
    const expected = {
      owner: [
        "hostel_create",
        "hostel_read",
        "hostel_update",
        "hostel_delete",
        "hostel_settings_update",
        "view_hostel_stats",
        "room_read",
        "room_create",
        "room_update",
        "room_delete",
        "room_allocation_read",
        "room_allocation_create",
        "room_allocation_update",
        "room_allocation_delete",
        "export_room_data",
        "student_read",
        "student_create",
        "student_update",
        "student_delete",
        "manage_student_rooms",
        "view_student_rooms",
        "export_student_data",
        "staff_read",
        "staff_create",
        "staff_update",
        "staff_delete",
        "role_assign",
        "export_staff_data",
        "visitor_read",
        "visitor_create",
        "visitor_update",
        "visitor_delete",
        "export_visitor_data",
        "complaint_read",
        "complaint_create",
        "complaint_update",
        "complaint_delete",
        "view_complaint_stats",
        "export_complaint_data",
        "view_reports",
        "view_analytics",
        "view_billing",
        "manage_profile",
        "view_profile",
        "change_password",
        "view_own_data",
      ],
      warden: [
        "hostel_read",
        "view_hostel_stats",
        // Rooms full CRUD + allocation + export
        "room_read",
        "room_create",
        "room_update",
        "room_delete",
        "room_allocation_read",
        "room_allocation_create",
        "room_allocation_update",
        "room_allocation_delete",
        "export_room_data",
        // Students full CRUD + exports
        "student_read",
        "student_create",
        "student_update",
        "student_delete",
        "manage_student_rooms",
        "view_student_rooms",
        "export_student_data",
        // Staff limited to read only (no create/update/delete/role/export)
        "staff_read",
        // Visitors full CRUD + export
        "visitor_read",
        "visitor_create",
        "visitor_update",
        "visitor_delete",
        "export_visitor_data",
        // Complaints full CRUD + stats + export
        "complaint_read",
        "complaint_create",
        "complaint_update",
        "complaint_delete",
        "view_complaint_stats",
        "export_complaint_data",
        // Reporting (no billing view)
        "view_reports",
        "view_analytics",
        // Profile
        "manage_profile",
        "view_profile",
        "change_password",
        "view_own_data",
      ],
      student: [
        "manage_profile",
        "view_profile",
        "change_password",
        "view_own_data",
        "complaint_create",
        "complaint_read",
        "visitor_create",
        "visitor_read",
      ],
      superadmin: Array.from(backendCanonical), // all canonical
    };

    const [roleRows] = await sequelize.query(
      'SELECT id, name FROM Roles WHERE name IN ("owner","warden","student","superadmin")'
    );
    const roleIdByName = Object.fromEntries(
      roleRows.map((r) => [r.name, r.id])
    );
    const [rpRows] = await sequelize.query(
      "SELECT role_id, permission_id FROM RolePermissions"
    );
    const [permRows] = await sequelize.query(
      "SELECT id, name FROM Permissions"
    );
    const permNameById = Object.fromEntries(
      permRows.map((p) => [p.id, p.name])
    );

    const actual = {};
    Object.entries(roleIdByName).forEach(([name, id]) => {
      const permNames = rpRows
        .filter((rp) => rp.role_id === id)
        .map((rp) => permNameById[rp.permission_id])
        .filter(Boolean)
        .sort();
      actual[name] = permNames;
    });

    const diffs = {};
    Object.keys(expected).forEach((role) => {
      if (!actual[role]) return;
      const expSet = new Set(expected[role]);
      const actSet = new Set(actual[role]);
      const missing = [...expSet].filter((p) => !actSet.has(p));
      const extra = [...actSet].filter((p) => !expSet.has(p));
      if (missing.length || extra.length) {
        diffs[role] = { missing, extra };
      }
    });

    roleMatrixReport = {
      skipped: false,
      diffs,
      actualCounts: Object.fromEntries(
        Object.entries(actual).map(([r, list]) => [r, list.length])
      ),
    };
    await sequelize.close();
  } catch (e) {
    roleMatrixReport = { skipped: true, error: e.message };
  }

  const report = {
    summary: {
      backendCanonical: backendCanonical.size,
      apiPermissions: apiPermissions.size,
      frontendPermissions: frontendPermissions.size,
      dbPermissions: dbPermissions.size,
    },
    missingInDB,
    orphanedInDB,
    unusedDefinitions,
    mismatches: {
      frontendNotInBackend,
      backendNotInFrontend,
    },
    legacyTranslations: legacyTranslations,
    legacyTranslationStillReferenced,
    roleMatrix: roleMatrixReport,
  };

  const exitCode =
    missingInDB.length === 0 &&
    frontendNotInBackend.length === 0 &&
    (!roleMatrixReport.diffs ||
      Object.keys(roleMatrixReport.diffs).length === 0)
      ? 0
      : 1;

  console.log("==== Permission Audit Report ====");
  console.log(JSON.stringify(report, null, 2));
  process.exit(exitCode);
}

run();
