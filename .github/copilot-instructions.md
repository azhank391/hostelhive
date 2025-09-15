# Copilot Instructions for HostelHive

## Big Picture Architecture
- **Monorepo**: Two main apps—`client` (Next.js 14, TypeScript, Tailwind CSS) and `server` (Node.js, Express, RBAC, migrations).
- **Client**: Uses Next.js App Router. Key folders: `app/` (pages/layouts), `components/`, `contexts/`, `lib/`, `services/`, `types/`, `utils/`. Global styles in `index.css`.
- **Server**: Express API with modular controllers, middleware, and RBAC. Key folders: `controllers/`, `middleware/`, `migrations/`, `models/`, `routes/`.
- **RBAC**: Permission system is defined in `RBAC_IMPLEMENTATION.md` and enforced via middleware. Permissions are snake_case, grouped by domain, and mapped in migrations.
- **Exports**: Data export endpoints are permission-gated (`export_*` permissions) and support CSV/JSON. See `EXPORT_FEATURES_UPDATE.md` for details.

## Developer Workflows
- **Client**:
  - Install: `npm install` in `client/`
  - Dev server: `npm run dev` (Next.js)
  - Build: `npm run build`
  - Lint: `npm run lint`
- **Server**:
  - Install: `npm install` in `server/`
  - Start: `npm start` (runs `server.js`)
  - Migrations: Sequelize-style JS files in `migrations/`. Run with project-specific migration tool (see migration scripts).

## Project-Specific Conventions
- **Permissions**: Always use canonical snake_case names. Legacy permissions only in `rbacService.js`.
- **Controllers**: Each entity (admin, hostel, student, etc.) has a dedicated controller. Exports handled in respective controller (e.g., `adminController.exportComplaints`).
- **Middleware**: Auth, permission, and rate limiting are enforced via dedicated middleware in `middleware/`.
- **Exports**: Use shared client utility `client/src/lib/download.ts` for file downloads. All export endpoints require both read and export permissions.
- **RBAC Migrations**: Chronological migration files update roles/permissions. See `RBAC_IMPLEMENTATION.md` for migration history and rationale.

## Integration Points & Patterns
- **Client ↔ Server**: REST API endpoints, permission-aware UI (export buttons gated by `PermissionGate`/`hasPermission`).
- **Data Export**: Endpoints return CSV/JSON, with headers for file download. See `EXPORT_FEATURES_UPDATE.md` for endpoint specs and permission requirements.
- **Role Consistency**: Warden role intentionally excludes staff export permissions (see RBAC docs).

## Key References
- `client/README.md`: Client setup, structure, and conventions
- `server/README.md`: Server overview
- `server/RBAC_IMPLEMENTATION.md`: Permission taxonomy, role matrices, migration history
- `server/EXPORT_FEATURES_UPDATE.md`: Export endpoints, permissions, client integration
- `server/controllers/`, `server/middleware/`, `server/migrations/`: Main backend logic
- `client/src/lib/download.ts`: Shared export/download logic

---
For unclear or missing conventions, consult the above docs or ask for clarification. Update this file as new patterns emerge.