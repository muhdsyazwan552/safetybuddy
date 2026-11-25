# Pages by role

| Role | Folder | Controller | URL |
|---|---|---|---|
| System Admin (1) | `Admin/System` | `SystemAdminController` | `/admin/...` |
| Company Admin (2) | `Admin/Company/Safety` (Safety workspace) and `Admin/Company/Account` (packages, billing, training provider) | `ContentController`, `InspectionController`, `ProjectController`, ... | `/dashboard`, `/inspection`, ... |
| Manager (3) / Supervisor (4) | `ManagerSupervisor` | `ReviewController` | `/review/...` |
| Inspector (7) | `Inspector` | `Inspector/DashboardController` | `/inspector/...` |
| Contractor (subcon staff / leader, public link) | `Contractor` | `SubconPublicController` | `/subcon/...` |

Shared by everyone: `Auth`, `Profile`, `Subscription`, `Reports`, `PublicWeb`, `Layouts_Admin`, `Dashboard.jsx`, `Module.jsx`.

The page name passed to `Inertia::render()` is the path under `Pages/`, e.g. `ManagerSupervisor/CaseShow`.
Manager and Supervisor share one folder because they use the same screens; the controller's `roleFlags()` decides which buttons each sees.
Inspector pages reuse some `ManagerSupervisor/*` and `Admin/Company/Safety/Layout` components.
