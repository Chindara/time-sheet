# Local testing

Two loops, fastest first. Use the one that matches what you are changing.

## 1. UI preview — no Azure DevOps at all

```bash
npm run preview
```

Opens <http://localhost:3000> with mock data covering an
Epic > Feature > User Story > Task/Bug/Suggestion hierarchy, dated relative to
today so the date presets always have something to show.

Both surfaces render through the components the extension ships —
`ProjectTimesheetView` and `WorkItemTimesheetView` — so the layout, filters and
empty states are the real ones. Only the containers are replaced: `preview.tsx`
stands in for storage, work item metadata and the REST client.

The bar at the top is the only preview-only chrome. It switches surface and
drives the states that are otherwise hard to reach:

| Toggle | What it exercises |
| --- | --- |
| Project hub / Work item tab | The two surfaces |
| Empty project | The "no time logged yet" state |
| Other project's entry | Project scoping dropping a foreign entry |
| Unattributable entry | The disclosure banner for entries that match neither project |
| Work item lookup fails | The metadata error alert and the "cannot attribute" empty state |
| Field sync fails | The sync and state-transition warnings on the tab |
| Reset data | Back to the seed set |

On the tab, Log Time, edit and delete write to an in-memory list, so the panel,
the form's validation and the owner-only controls can be driven end to end.

**Good for:** layout, filters, charts, empty states, the entry form, totals
reconciliation.

**Cannot tell you anything about:** extension storage, work item metadata, the
REST client, permissions, or state transitions. None of that is exercised here —
both containers are bypassed. Every bug reported in this project so far lived in
the parts this loop does not reach, so do not treat a clean preview as a green
light.

## 2. Real Azure DevOps, served from localhost

Azure DevOps will not load an extension that has never been registered, but it
*will* load one whose content comes from your machine. Register a private dev
build once, point its `baseUri` at localhost, then iterate with a rebuild.

### One-time setup

`vss-extension.dev.json` overrides the manifest with a separate id and name, so
the dev build installs alongside the real extension instead of replacing it:

```json
{
  "id": "devops-timesheet-extension-dev",
  "name": "Time Sheet (dev)",
  "public": false,
  "baseUri": "https://localhost:3000"
}
```

Package and publish it privately, shared with your own organization only:

```bash
npm run package:dev
```

Then upload the resulting `.vsix` at
<https://marketplace.visualstudio.com/manage> — keep it private, share it with
your org, and install it into a test project.

### Each session

```bash
npm run serve:dev
```

Serves the real bundles over HTTPS on port 3000. The certificate is
self-signed, so **visit <https://localhost:3000/dist/project-timesheet.html>
once in the same browser and accept the warning** — otherwise Azure DevOps
silently fails to load the iframe and you get a blank hub with a mixed-content
or certificate error in the console.

Now open **Boards → Time Sheet** in your test project. Rebuilding is enough to
pick up a change; no republishing.

### Reading errors

The hub surfaces work item lookup failures in a red banner with the API's own
message. For anything else, the contribution runs in an iframe, so in DevTools
switch the console's context dropdown from `top` to the extension frame before
expecting to see its logs.

## What still needs a second project and a second user

These cannot be verified from one project with one account, and they are the
checks that matter most for the current release:

- Project A's hub and My Timesheet show nothing from project B
- A second user's entries appear in the hub
- A work item you cannot read appears as a Restricted row with hours but no title
- Moving a work item between projects moves its logged hours with it
- Suggestion transitions to In Development on first entry and back to New when
  the last entry is deleted
