# Export Features Update (September 2025)

This document summarizes the newly implemented unified data export capabilities across HostelHive entities after the RBAC refactor.

## Overview

Exports are now permission‑gated with fine‑grained `export_*` permissions. Each endpoint supports `format=csv|json` (CSV default where applicable) and returns either a downloadable CSV (with a `Content-Disposition` header) or structured JSON payload with `count` + data array.

| Entity     | Endpoint (Hostel Scoped)                                 | Permission                                                          | Filename Pattern        | Notes                       |
| ---------- | -------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------- | --------------------------- | --------------------------------------------------------- |
| Students   | `GET /api/hostels/:hostelId/students/export?format=csv   | json`                                                               | `export_student_data`   | `students-<hostelId>.csv`   | Includes room allocation (if any) in CSV.                 |
| Visitors   | `GET /api/admin/visitor-logs/export?format=csv           | json`(legacy) &`GET /api/hostels/:hostelId/visitors` mapping future | `export_visitor_data`   | `visitors-<hostelId>.csv`   | Hostel scoped route could be added later for symmetry.    |
| Complaints | `GET /api/hostels/:hostelId/complaints/export?format=csv | json`                                                               | `export_complaint_data` | `complaints-<hostelId>.csv` | Sanitizes commas & newlines in text fields.               |
| Rooms      | `GET /api/hostels/:hostelId/rooms/export?format=csv      | json`                                                               | `export_room_data`      | `rooms-<hostelId>.csv`      | Includes core room fields only.                           |
| Staff      | `GET /api/hostels/:hostelId/staff/export?format=csv      | json`                                                               | `export_staff_data`     | `staff-<hostelId>.csv`      | Excludes sensitive password hashes; filters out students. |

## Frontend Enhancements

- Added export buttons to: Students, Visitors, Complaints, Rooms, Staff pages (permission‑aware via `PermissionGate`/`hasPermission`).
- Introduced shared utility `client/src/lib/download.ts` providing `downloadExport(options)` for consistent fetch + file download logic.
- Refactored Rooms page to use the shared utility; other pages can be migrated incrementally.
- Staff page now displays CSV & JSON export buttons when the user has `export_staff_data`.

## RBAC / Permission Changes

Canonical export permissions added & enforced:

- `export_student_data`
- `export_visitor_data`
- `export_complaint_data`
- `export_room_data`
- `export_staff_data`

Each export permission depends on corresponding read permission (enforced in dependency resolver and definitions). Warden role intentionally excludes `export_staff_data` per policy.

## Backend Controller Additions

- `adminController.exportComplaints` – complaints CSV/JSON.
- `adminController.exportRooms` – rooms CSV/JSON.
- `adminController.exportStaff` – staff CSV/JSON (excludes students, minimal attributes).

All endpoints added to `server/routes/hostels.js` and mapped in `server/utils/apiPermissionMap.js`.

## CSV Formatting Rules

- Text fields (title/description) sanitized: commas & newlines stripped to preserve CSV integrity.
- Dates ISO formatted (`toISOString()`).
- Boolean active flags serialized as `YES`/`NO`.
- Missing/nullable values replaced with `N/A` for clarity.

## File Naming

Shared util composes `<base>-<YYYY-MM-DD>.<ext>` when `includeDate` true (default). Backend sets base pattern; frontend adds date suffix.

## Usage Example (Frontend)

```ts
await downloadExport({
  url: `/api/hostels/${hostelId}/rooms/export`,
  format: "csv",
  filename: `rooms-${hostelId}`,
});
```

## Future Improvement Ideas

1. Standardize all existing export handlers to use shared utility (remaining pages).
2. Add streaming for large datasets (e.g., Node streams + paginated fetch).
3. Support additional formats (XLSX) behind a feature flag.
4. Centralize audit logging for each export action (who exported what & when).
5. Add column selection UI before export (client-side customization).

## QA Checklist

- [x] Permissions present in `permissionDefinitions.js` & migrations.
- [x] API → permission mapping updated (`apiPermissionMap.js`).
- [x] Routes registered in `routes/hostels.js`.
- [x] Controllers return correct headers for CSV.
- [x] Staff export omits password hashes.
- [x] UI hides export buttons if permission absent.
- [x] Rooms page hides internal IDs from table display (still in export CSV for admin reference).

## Regression Considerations

- Ensure audit script includes new endpoints (already consumes `API_PERMISSION_MAP`).
- If adding caching/CDN later, mark export responses as `no-store` to avoid leaking private data.

---

Document generated as part of RBAC & export feature consolidation (Sep 2025).
