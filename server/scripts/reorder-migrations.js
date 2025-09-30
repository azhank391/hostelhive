#!/usr/bin/env node
/*
  Reorder Sequelize migrations by renaming files with new timestamp prefixes,
  so dependent migrations run after their prerequisites.

  Usage:
    node scripts/reorder-migrations.js --dry-run     # show the plan only
    node scripts/reorder-migrations.js --apply       # perform the renames

  Notes:
  - This script does NOT touch your database. If you have already applied
    some migrations, renaming files will desync SequelizeMeta. Do this only
    on a fresh DB or after resetting. Otherwise you must update SequelizeMeta
    to match the new filenames (not recommended unless you know what you're doing).
  - Adjust the classification rules below if you add new migration types.
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.join(ROOT, 'migrations');

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run') || !args.has('--apply');
const APPLY = args.has('--apply');

function listMigrationFiles() {
  const entries = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.js'));
  return entries.map(name => ({ name, abs: path.join(MIGRATIONS_DIR, name) }));
}

function parsePrefix(name) {
  // Expect format: 14-digit timestamp prefix + '-' + slug
  const m = name.match(/^(\d{14})-(.+)$/);
  if (!m) return { ts: null, slug: name };
  return { ts: m[1], slug: m[2] };
}

// Helpers for quick classification by filename
function hasAny(name, parts) {
  const lower = name.toLowerCase();
  return parts.some(p => lower.includes(p.toLowerCase()));
}

// Very simple content probe when needed
function readFileSafe(abs) {
  try {
    return fs.readFileSync(abs, 'utf8');
  } catch {}
  return '';
}

// Classification groups in desired execution order
// Lower number => earlier migration
const GROUP = {
  baseCreate: 10,
  rbacSchema: 20,
  rbacSeed: 30,
  usersAlters: 40,
  rbacAdjustments: 50,
  domainIndexes: 60,
  permissionTweaksLate: 70,
  other: 90,
};

function classify(file) {
  const { name, abs } = file;
  const lower = name.toLowerCase();
  const { ts } = parsePrefix(name);
  const content = readFileSafe(abs);

  // 1) Base domain table creates
  if (hasAny(lower, [
    'create-hostel',
    'create-user',
    'create-room-allocation',
    'create-room',
    'create-complaint',
    'create-visitor-log',
    'create-superadmin',
    'create-tenant-location',
  ]) || /createTable\(["'`](Users|Hostels|Rooms|RoomAllocations|Complaints|VisitorLogs|Superadmins|TenantLocations)["'`]/.test(content)) {
    return { group: GROUP.baseCreate, score: 1, ts };
  }

  // 2) RBAC schema
  if (hasAny(lower, [
    'create-roles-table',
    'create-permissions-table',
    'create-role-permissions-table',
    // include a future create-permission-dependencies if present
    'create-permission-dependencies',
  ])) {
    return { group: GROUP.rbacSchema, score: 1, ts };
  }

  // 3) RBAC seed
  if (hasAny(lower, ['seed-rbac-data'])) {
    return { group: GROUP.rbacSeed, score: 1, ts };
  }

  // 4) Users-related alters for RBAC
  if (hasAny(lower, [
    'update-users-role-column',
    'update-users-table-rbac',
  ])) {
    return { group: GROUP.usersAlters, score: 1, ts };
  }

  // 5) RBAC adjustments/fixes/alignments
  if (hasAny(lower, [
    'fix-system-roles-and-permissions',
    'add-comprehensive-dependencies',
    'fix-database-permission-issues',
    'remove-owner-system-permissions',
    'add-warden-stats-permission',
    'remove-redundant-permissions',
    'align-permissions',
    'realign-role-permissions',
    'add-missing-permissions',
    'warden-remove-staff-crud',
    'remove-forced-dashboard-permissions',
  ])) {
    return { group: GROUP.rbacAdjustments, score: 1, ts };
  }

  // 6) Domain indexes and performance tweaks
  if (hasAny(lower, [
    'add-comprehensive-indexes',
    'add-performance-indexes',
    'fix-email-uniqueness-constraints',
  ])) {
    return { group: GROUP.domainIndexes, score: 1, ts };
  }

  // 7) Other permission tweaks later (mostly 202509*)
  if (hasAny(lower, [
    'add-room-allocation-read-permission',
    'add-student-room-read-permission',
    'remove-student-room-read-permission',
    'update-complaint-create-permission',
    'add-complaint-delete-permission',
  ])) {
    return { group: GROUP.permissionTweaksLate, score: 1, ts };
  }

  return { group: GROUP.other, score: 1, ts };
}

function zeroPad(num, width) {
  const s = String(num);
  return s.length >= width ? s : '0'.repeat(width - s.length) + s;
}

function makeTimestampSequence(startDate) {
  // startDate format: YYYYMMDD
  let counter = 1;
  return () => `${startDate}${zeroPad(counter++, 6)}`; // HHMMSS as incremental counter
}

function sortFiles(files) {
  return files
    .map(f => ({ ...f, cls: classify(f) }))
    .sort((a, b) => {
      if (a.cls.group !== b.cls.group) return a.cls.group - b.cls.group;
      // within group, sort by original timestamp if present, else by name
      const ats = a.cls.ts || '';
      const bts = b.cls.ts || '';
      if (ats !== bts) return ats < bts ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

function proposeNewNames(sortedFiles, startDate) {
  const nextTs = makeTimestampSequence(startDate);
  const used = new Set();

  const plan = [];
  for (const f of sortedFiles) {
    const { slug } = parsePrefix(f.name);
    const baseSlug = slug || f.name; // fallback if no slug matched

    let ts;
    do {
      ts = nextTs();
    } while (used.has(ts));
    used.add(ts);

    const newName = `${ts}-${baseSlug}`;
    plan.push({ from: f.name, to: newName, absFrom: f.abs, absTo: path.join(MIGRATIONS_DIR, newName) });
  }
  return plan;
}

function printPlan(plan) {
  console.log(`\nProposed migration reorder (${plan.length} files):`);
  for (const { from, to } of plan) {
    const marker = from === to ? ' ' : '→';
    console.log(`  ${from} ${marker} ${to}`);
  }
  console.log('');
}

function applyPlan(plan) {
  // Rename sequentially to avoid collisions: use a temp suffix then final name
  for (const step of plan) {
    if (step.from === step.to) continue;
    const tmp = step.absTo + '.tmpmoving';
    if (fs.existsSync(step.absTo)) {
      throw new Error(`Target exists already: ${step.absTo}`);
    }
    fs.renameSync(step.absFrom, tmp);
    fs.renameSync(tmp, step.absTo);
    console.log(`Renamed: ${step.from} -> ${step.to}`);
  }
}

(function main() {
  // Safety banner
  console.log('=== Migration Reorder Tool ===');
  console.log('This will rename files in server/migrations to enforce a safe execution order.');
  console.log('Warning: If migrations were already applied to a DB, you must reset or update SequelizeMeta manually.');
  console.log('');

  // Choose a baseline date for new prefixes
  const baseline = '20250101';

  const files = listMigrationFiles();
  if (!files.length) {
    console.error('No migration files found.');
    process.exit(1);
  }

  const sorted = sortFiles(files);
  const plan = proposeNewNames(sorted, baseline);
  printPlan(plan);

  if (DRY_RUN) {
    console.log('Dry-run mode. No changes were made.');
    console.log('Run with --apply to perform the renames.');
    process.exit(0);
  }

  if (APPLY) {
    // Basic safeguard: ensure git working tree is clean (optional). Skipped here.
    applyPlan(plan);
    console.log('All done. Review changes, commit, and run migrations on a fresh DB.');
  }
})();
