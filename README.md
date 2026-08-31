# Azure DevOps Time Sheet Extension

Track time against work items inside Azure DevOps Boards, keep the built-in
scheduling fields in sync, and read the whole project's time back in one report.

The extension ships two surfaces:

| Surface | Where it appears | What it is for |
| --- | --- | --- |
| **Time Sheet tab** | On every work item form | Logging time, and the logger's own timesheet |
| **Time Sheet hub** | Boards → Time Sheet | The project-wide report across every work item and contributor |

## Getting started

1. Install **Time Sheet** from the Azure DevOps Marketplace into your organization.
2. Open any work item and select the **Time Sheet** tab.
3. Click **Log Time**, pick the date and the start and end times, choose an
   activity type, and save. The work item's `Completed Work` and `Remaining Work`
   update on their own.
4. For the project-wide picture, go to **Boards → Time Sheet**.

Nothing else needs configuring — there are no settings, and time entries are
stored in the extension's own storage inside your organization.

## Features

### Logging time

- **Slide-in panel** on the work item's Time Sheet tab — the work item stays on screen behind it.
- **Start and end time**, picked as hour + quarter-hour, with the duration derived from
  the range and shown back as you pick (`2 h 15 min`). Entries store both the range
  and the decimal hours.
- **Eight activity types**: Development, Code Review, Testing, Bug Fixing,
  Documentation, Design, Requirements, Deployment.
- **Optional description**, up to 500 characters.
- **Edit and delete your own entries only** — ownership is enforced in the data
  layer, not just hidden in the UI. Deletes are confirmed.

### The work item tab

- **This work item** — every contributor's entries on the work item being viewed,
  newest first, with the entry count and total hours in the header.
- **My Timesheet** — the viewer's own entries across every work item in the
  current project, grouped by work item, with per-work-item totals and an
  activity donut chart. Entries can be edited and deleted inline.
- A view switch moves between the two; **Log Time** is available from both.

### Work item field sync

After any entry is created, edited or deleted, the work item is updated:

- `Completed Work` ← the sum of all logged hours on that work item, across all users.
- `Remaining Work` ← `max(0, Original Estimate − Completed Work)`.
- `Original Estimate` is read only — the extension never writes it.
- **State transitions** for `Task`, `Bug` and `Suggestion` work items: the first
  entry moves the item to **In Development**; deleting the last entry moves it
  back to **New**.

Sync is non-blocking. If a field write or state change fails — permissions, a
network error, a process template without those states — the time entry is still
saved and a dismissible warning explains what did not happen.

### The project hub

Boards → **Time Sheet** opens the project-wide report:

- **KPI tiles** — total hours, contributors (with the average each), hours per
  working day with a sparkline, and logged-vs-estimate as a percentage of the
  summed Original Estimate with the over/under difference.
- **Time by feature** — every leaf work item is walked up its parent chain to the
  Feature (or Epic) it rolls up to, so a Task under a User Story under a Feature
  is counted against that Feature. Rows carry hours, share of total, contributor
  and work item counts, closed-item progress, and an activity mix strip. Work
  items with no such ancestor collect in **No parent feature**; unreadable ones
  collect in **Restricted**, which discloses nothing but its hours.
- **Hours per day** — a daily bar chart, stacked by contributor, with a legend
  and a per-day breakdown on hover.
- **Hours by activity** — donut chart over the eight activity types.
- **Hours by contributor** — labelled bar list with each person's share.
- **Filters** — date range (All time, This Month, Last Month, This Quarter, or a
  custom range), contributors, activity types and area path. Everything on the
  page responds, and active filters are summarised with a **Clear all**.
- **Export CSV** — the filtered entries, with work item title and rolled-up
  feature resolved, preceded by a summary block and per-contributor totals.

### Project scoping

Extension storage is account-wide and has no project dimension, so which project
an entry belongs to is reconstructed rather than queried:

1. The work item's `System.TeamProject` — the authority, and correct even for
   entries written before project stamping existed, or for work items that were
   moved between projects.
2. The `projectId` / `projectName` stamped on the entry when it was created —
   used only when the work item cannot be read, so a restricted work item in this
   project still counts toward its totals.

Entries matching neither are excluded from the report and the count is disclosed
on screen, rather than being folded into the current project's totals.

Work item metadata is fetched in batches, and the request shape degrades
gracefully across API versions: `System.Parent` in a field list first, the parent
hierarchy relation next, and finally core fields with no parent at all — in which
case titles, states and scoping still work and feature grouping falls back to
"No parent feature".

## Project structure

```
time-sheet/
├── src/
│   ├── TimeSheetTab.tsx               # Work item tab entry point
│   ├── project-timesheet.tsx          # Project hub entry point
│   ├── preview.tsx                    # Local preview harness (mock data, no SDK)
│   ├── components/
│   │   ├── TimeEntryForm/             # Date, start/end time, activity, description
│   │   ├── TimeEntryPanel/            # Slide-in wrapper around the form
│   │   ├── TimeEntryList/             # Entries on one work item
│   │   ├── TimesheetReport/           # "My Timesheet" + ActivityDonutChart
│   │   ├── ProjectTimesheet/          # The hub: KPIs, filters, breakdown, charts
│   │   └── ui/                        # shadcn/ui primitives
│   ├── services/
│   │   ├── DataService.ts             # CRUD over Extension Data Storage, field sync
│   │   ├── WorkItemService.ts         # Work item form service access
│   │   ├── WorkItemMetadataService.ts # Batched REST lookup + rollup resolution
│   │   └── ExportService.ts           # CSV generation
│   ├── models/TimeEntry.ts
│   └── utils/                         # aggregate, breakdown, rollup, projectScope,
│                                      # dateUtils, validation, colour palettes
├── docs/                              # User, testing, deployment, local testing guides
├── openspec/                          # Specs and change proposals
├── vss-extension.json                 # Extension manifest (contributions, scopes, version)
├── webpack.config.js                  # Two bundles: timesheet-tab, project-timesheet
└── package.json
```

## Development

```bash
# Install
npm install --legacy-peer-deps

# UI preview with mock data — no Azure DevOps required (http://localhost:3000)
npm run preview

# Watch build
npm run dev

# Production build
npm run build

# Build and package into a .vsix
npm run package

# Package with the dev overrides (private publisher/id)
npm run package:dev

# Serve dist/ over HTTPS for a locally-hosted extension
npm run serve:dev
```

The manifest version in `vss-extension.json` is stamped into the bundle at build
time and logged at startup, so you can confirm from the browser console which
build a project is running.

There is no automated test suite; `npm test` is a placeholder. Verification is
the preview harness plus the manual passes in
[docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md).

### Documentation

- [docs/USER_GUIDE.md](docs/USER_GUIDE.md) — using the extension
- [docs/LOCAL_TESTING.md](docs/LOCAL_TESTING.md) — the two local loops and what each can prove
- [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) — manual test passes against a real organization
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — packaging and marketplace publishing
- [overview.md](overview.md) — the marketplace listing content
- [openspec/](openspec/) — capability specs and change proposals

## Technologies

- **Frontend:** React 19, TypeScript 5
- **UI:** Tailwind CSS with shadcn/ui primitives, lucide-react icons
- **Charts:** Recharts
- **Build:** Webpack 5, ts-loader, PostCSS
- **Platform:** Azure DevOps Extension SDK 4.x, Extension Data Service for storage,
  Work Item Tracking REST client for metadata
- **Packaging:** tfx-cli

## Permissions

The extension requests a single scope, `vso.work_write`, which it needs to read
work item metadata and to write `Completed Work`, `Remaining Work` and state
transitions back to work items. Time entries themselves are stored in the
extension's own data storage — no data leaves the Azure DevOps organization.

## License

MIT — see [LICENSE.txt](LICENSE.txt).
