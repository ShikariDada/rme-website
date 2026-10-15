# Vercel Support Ticket — production deployment URLs return 404 NOT_FOUND (routing never created)

> Submit at: https://vercel.com/help → Submit a request (choose Account / Deployments issue).
> Copy the template below.

**Subject:** Production deployments READY but not routable at the edge on brand-new Hobby team (previews route correctly)

**Impact:** All production URLs of this team return `404` with `X-Vercel-Error: NOT_FOUND`. No visitor can reach any deployed site. Preview deployments on the same team route correctly.

**IDs**
- Team: `Shikaridada` — `team_fsRkm7cR7Xp2URHNN6GLLIfE` (Hobby, created `createdDirectToHobby`)
- User: `uditgoel47-3438` (`NcaPTru5H07PSiILkhrSWK4G`), email verified
- Project `rme-website`: `prj_IhPqfwlnIOpT1JrRc0c2fM5ccGWg` — Next.js 16.3.5 (Turbopack)
- Project `rme-showroom`: `prj_hqwhaxAfaka1QknCL0O5bDqwYivX` — same Next.js app (control test)
- Example production deployment (from GitHub): `rme-website-k4hl9mmee-shikaridada.vercel.app` (`dpl_k4hl9mmee…`), `readyState: READY`, `readySubstate: PROMOTED`, `aliasAssigned: true`, `aliasError: null`

**Evidence that builds/aliases/config are fine**
1. Builds complete cleanly (Next.js static+lambda outputs, "Deployment completed", no warnings).
2. GitHub integration works: repo `ShikariDada/rme-website` connected, Git-driven deployment is READY/PROMOTED.
3. Aliases `rme-website-beta.vercel.app`, `rme-website-shikaridada.vercel.app`, `rme-showroom.vercel.app` are verified domains on the projects; `/v4/aliases` lists them → current deployments; `/v13/deployments/{id}` shows `aliasAssigned=true`.
4. Preview deployments DO route at the edge (they 302 to "Vercel Authentication" login — expected, since project `ssoProtection.deploymentType = "preview"`), proving the team's edge routing pipeline works for previews.

**The failure**
- Every URL of every PRODUCTION deployment — the unique deployment URL itself, and all production aliases/domains — returns `404` (`X-Vercel-Error: NOT_FOUND`), from multiple networks/regions (India edge `bom1` and via a VPN/EU egress).
- The 404 is a bare, plain-text `NOT_FOUND` (79 bytes) — **not** the Vercel Authentication SSO flow, not a challenge page.
- Reproduces across 2 projects, 7+ production deployments over ~2 hours (both CLI `vercel deploy --prod` and GitHub push), and both after AND before changing Deployment Protection settings.
- A valid **Protection Bypass for Automation** token (generated in project settings, `protectionBypass` present on the project) applied via `?x-vercel-protection-bypass=…&x-vercel-set-bypass-cookie=…` still yields the bare `404 NOT_FOUND` — leading to my conclusion that the edge router never created the production routing entries for this team at all.
- `ssoProtection` was changed mid-investigation from `{"deploymentType":"all_except_custom_domains"}` to `{"deploymentType":"preview"}` via the API; regardless, production URLs were never routable.

**What I've tried (no edge change)**
- Re-pointed project aliases to the current deployment via `POST /v13/deployments/{dpl}/aliases` (success).
- Deleted stale alias targets that referenced a deleted deployment from 17 days ago (`dpl_DfsDkcR4CPrPVzmwDXZUuppvCjrA`).
- Attached the verified domains to projects via API (HTTP 200, `verified: true`).
- Fresh second project on the same team (identical behavior).
- `vercel redeploy` and a new GitHub-push deployment.

**Please check / fix**
1. Whether this team is stuck in a trust/verification or platform state that blocks **production** phase routing (while allowing previews) — restart/repair if so.
2. The routing tables for the deployment URLs above.

Expected result after fix: `https://rme-website-shikaridada.vercel.app/` (and production aliases) should serve the Next.js app (status 200, title "RME — Marble, Tiles & Granite").
