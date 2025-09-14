# HostelHive RBAC Implementation (2025-09-13)

## 1. Objectives

| Goal                                                                                 | Status |
| ------------------------------------------------------------------------------------ | ------ |
| Replace coarse legacy permissions with granular CRUD + export taxonomy               | ✅     |
| Remove owner access to system-level (global) controls                                | ✅     |
| Provide deterministic role→permission matrix (owner, warden, student, superadmin)    | ✅     |
| Add export\_\* permissions per domain (rooms, students, staff, complaints, visitors) | ✅     |
| Eliminate legacy composite/ambiguous permissions                                     | ✅     |
| Provide automated drift detection (audit script)                                     | ✅     |
| Document taxonomy & lifecycle                                                        | ✅     |

## 2. Canonical Permission Taxonomy

Grouped by domain. All permission names are lowercase snake_case.

### Hostel

- hostel_create
- hostel_read
- hostel_update
- hostel_delete
- hostel_settings_update
- view_hostel_stats

### Rooms

- room_read
- room_create
- room_update
- room_delete
- room_allocation_read
- room_allocation_create
- room_allocation_update
- room_allocation_delete
- export_room_data

### Students

- student_read
- student_create
- student_update
- student_delete
- manage_student_rooms
- view_student_rooms
- export_student_data

### Staff

- staff_read
- staff_create (not for warden)
- staff_update (not for warden)
- staff_delete (not for warden)
- role_assign (not for warden)
- export_staff_data (not for warden)

### Visitors

- visitor_read
- visitor_create
- visitor_update
- visitor_delete (warden allowed; student not)
- export_visitor_data

### Complaints

- complaint_read
- complaint_create (student + warden + owner + superadmin)
- complaint_update
- complaint_delete (not student)
- view_complaint_stats
- export_complaint_data (not student)

### Reporting & Analytics

- view_reports
- view_analytics
- view_billing (not warden / student)

### Profile / Self-Service

- manage_profile
- view_profile
- change_password
- view_own_data

### System (Superadmin only)

- manage_system
- manage_all_hostels
- view_system_stats
- manage_billing
- manage_owners

## 3. Role Matrices (Final Spec)

| Domain                                             | Owner | Warden                                              | Student                      | Superadmin |
| -------------------------------------------------- | ----- | --------------------------------------------------- | ---------------------------- | ---------- |
| Hostel CRUD / Settings                             | All   | read + stats only                                   | -                            | All        |
| Rooms CRUD                                         | Yes   | Yes                                                 | -                            | Yes        |
| Room Allocation CRUD                               | Yes   | Yes                                                 | -                            | Yes        |
| Students CRUD                                      | Yes   | Yes                                                 | -                            | Yes        |
| Manage Student Rooms                               | Yes   | Yes                                                 | -                            | Yes        |
| Staff CRUD / Role Assign                           | Yes   | Read only                                           | -                            | Yes        |
| Visitors CRUD                                      | Yes   | Yes                                                 | create+read only for student | Yes        |
| Complaints CRUD                                    | Yes   | Yes                                                 | create+read only             | Yes        |
| Exports (rooms/students/staff/visitors/complaints) | Yes   | All except staff exports removed (see staff policy) | -                            | Yes        |
| Reporting (reports / analytics)                    | Yes   | Yes                                                 | -                            | Yes        |
| Billing view                                       | Yes   | No                                                  | -                            | Yes        |
| System (manage\_\*, owners)                        | No    | No                                                  | No                           | Yes        |
| Profile / Self-Service                             | Yes   | Yes                                                 | Yes                          | Yes        |

### Explicit Warden Exclusions

- hostel_create, hostel_update, hostel_delete, hostel_settings_update
- staff_create, staff_update, staff_delete, role_assign, export_staff_data
- view_billing
- All system-level permissions

## 4. Legacy → Canonical Translation Map

Retained solely in `rbacService.js` for backward compatibility. None of these appear elsewhere.

```
room_allocate -> room_allocation_create
room_deallocate -> room_allocation_delete
visitor_checkout -> visitor_update
visitor_export -> export_visitor_data
student_export -> export_student_data
visitor_stats_read -> visitor_read
hostel_stats_read -> view_hostel_stats
complaint_resolve -> complaint_update
billing_manage -> manage_billing
hostel_global_manage -> manage_all_hostels
system_manage -> manage_system
system_stats_read -> view_system_stats
owner_manage -> manage_owners
```

Removal strategy: after 1–2 releases with zero audit hits, drop the translation layer.

## 5. Migrations Added (Chronology)

1. `20250913000000-align-permissions.js` – Seeds export permissions, removes legacy composites, rebuilds baseline role sets.
2. `20250913061500-add-missing-permissions.js` – Ensures allocation CRUD & missing export permissions exist; removes stray legacy entries.
3. `20250913063500-realign-role-permissions.js` – Broad CRUD/export assignment update (earlier interim spec including staff CRUD for warden before revision).
4. `20250913065000-warden-remove-staff-crud.js` – Final adjustment: strip staff CRUD, role_assign, export_staff_data from warden.

## 6. Automated Audit (`scripts/permission-audit.js`)

Outputs JSON with:

- summary
- missingInDB / orphanedInDB
- mismatches (frontend vs backend definitions)
- legacyTranslationStillReferenced
- roleMatrix (diffs + counts)
  Exit code 0 means fully consistent.

### Run Manually

```
npm run audit:permissions
```

### Suggested CI Integration (GitHub Actions sample)

```yaml
- name: Permission Audit
  run: npm run audit:permissions
  working-directory: server
```

## 7. Frontend Integration

- Canonical type union: `client/src/lib/permissionUtils.ts`
- Gates: `client/src/components/PermissionGate.tsx` (specialized gates use arrays of canonical names)
- Navigation & routing gating: `Sidebar.tsx`, `permission-routing.ts`, `intelligentLandingResolver.ts`

## 8. Backend Enforcement

- Route → permission mapping: `server/utils/apiPermissionMap.js`
- Canonical definitions + dependency metadata: `server/utils/permissionDefinitions.js`
- Legacy translation & fallback: `server/services/rbacService.js`
- Dependency resolution (view dependencies only): `server/utils/unifiedDependencyResolver.js`

## 9. Consistency Contract

| Layer           | Source of Truth                                                         |
| --------------- | ----------------------------------------------------------------------- |
| Canonical list  | `permissionDefinitions.js` & frontend union must match (audit enforced) |
| API guarding    | `apiPermissionMap.js`                                                   |
| Role assignment | Migrations + DB `RolePermissions`                                       |
| UI gating       | PermissionGate & derived helpers                                        |
| Drift detection | `scripts/permission-audit.js`                                           |

## 10. Adding a New Permission (Checklist)

1. Add to `permissionDefinitions.js` with display_name, category, dependencies.
2. Add to frontend `permissionUtils.ts` union & AVAILABLE_PERMISSIONS.
3. Map any route usage in `apiPermissionMap.js`.
4. Add to relevant role(s) via new migration (never edit old migrations).
5. Run `npm run audit:permissions` (must pass).
6. Update RBAC docs (this file).

## 11. Removing a Permission

1. Create a migration removing role associations then the permission row.
2. Remove from `permissionDefinitions.js`, frontend union, and any route map references.
3. Run audit (should show no orphaned or missing permissions).

## 12. Operational Guidelines

- Never modify historical migrations—append new ones for changes.
- Run audit locally before pushing schema changes.
- Keep translation map until certain no stale tokens reference legacy names.
- Use roleMatrix in audit to detect silent privilege expansion/regression.

## 13. Future Hardening Ideas

- Add Jest test invoking audit script and asserting exit code 0.
- Build a permissions diff PR bot (comment summary on each PR).
- Enforce descriptive commit messages when touching RBAC files.
- Scheduled audit (cron) posting results to Slack / email.

## 14. Current Audit Snapshot (Reference)

(Generate fresh via script.)

```
summary: all synchronized (owner 46, warden 36, student 8, superadmin 51)
roleMatrix.diffs: {}
exitCode: 0
```

## 15. Glossary

| Term                 | Meaning                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| Canonical Permission | Official, current identifier used across backend & frontend                       |
| Legacy Permission    | Deprecated identifier auto-translated for backward compatibility                  |
| System-Level         | Global actions restricted to superadmin (manage_system, manage_all_hostels, etc.) |
| Export Permission    | Explicit grant to extract domain data externally                                  |

---

Maintained: 2025-09-13
