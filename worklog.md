# Worklog — StsDev-Wiki

---

Task ID: 1
Agent: main
Task: Sidebar truncate → break-words, Anti-Monolith ESLint rules, full audit & decomposition, SKILL-zai-sandbox-rules, Superpowers-Z.ai submodule, PNG cleanup, fab-inspector install, push

Work Log:

- Replaced `truncate` with `break-words` in sidebar spans for line wrapping
- Created `eslint-rules/anti-monolith.js` with 4 custom rules (max-file-lines 250, max-component-lines 200, max-use-state 2, max-function-lines 50)
- Fixed ESLint 9 flat config crash: comma-separated selectors → dynamic visitors object
- Decomposed sidebar.tsx → 7 sub-modules (hooks, UI components, barrel export) — 0 errors
- Decomposed mdx-components.tsx → 8 sub-modules — fixed 3→0 useState in mermaid
- Extracted shared mdx-editor-config.tsx from edit + new pages
- Decomposed edit/page.tsx → 4 sub-modules (composer ~143 lines)
- Decomposed new/page.tsx → 2 sub-modules (composer ~182 lines)
- Extracted docs-api.ts, docs-actions.ts, section-order.ts
- Fixed circular import in sidebar.tsx shim (`./sidebar` → `./sidebar/sidebar`)
- Fixed `Plugin` type not exported from `@mdxeditor/editor` → used `any[]`
- Applied SKILL-zai-sandbox-rules: fixed Turbopack crash (added `turbopack.root`), restored node_modules (900 packages), removed stale `transpilePackages`
- Added `.superpowers-zai/` git submodule from `stsgs1980/Superpowers-Z.ai`
- Deleted all .png files from repo
- Verified `/download/` is empty
- Installed `@stsgs1980/fab-inspector@3.6.6` as devDependency
- Ran `npx @stsgs1980/fab-inspector init` — wired SelectElementFab into layout.tsx, created API route
- Installed missing peer dep `framer-motion@12.42.0`
- Force-pushed to remote (token from upload/StsDev-Wiki-Template.txt, remote had been force-pushed previously)

Stage Summary:

- ESLint audit: 13 issues → 0 errors, 0 warnings in prod code
- All files under ZAI-ARCH-002 thresholds
- FabInspector FAB button integrated (bottom-right, Esc to close)
- All changes pushed: `627252d main → main` (forced update)
- Pending: GitHub token rotation (expires periodically)

---

Task ID: 2
Agent: main
Task: Move docs/ to project root, fix Vercel deployments, add tests, fix CONTENT_DIR across codebase

Work Log:

- Moved `src/content/docs/` → `docs/` (project root) for accessibility
- Updated CONTENT_DIR in: mdx-utils.ts, reorder-section/route.ts, docs/route.ts, docs/[slug]/route.ts
- Removed empty `src/content/` directory
- Fixed 3 existing test files (api-docs, api-docs-slug, api-reorder-section) — CONTENT_DIR path
- Wrote mdx-utils.test.ts (24 tests): getAllSlugs, getDocBySlug, getAllDocs, getNavigation, extractHeadings, getAdjacentPages, getPageTitle, getSectionForPage, getAllPageIds
- Wrote section-order.test.ts (11 tests): calculateSectionOrder end/before/after, collisions, renumbering
- Wrote docs-actions.test.ts (12 tests): deleteDoc, saveDoc, createDoc, uploadDocs
- All 131 tests passing, 0 failures
- Installed `@stsgs1980/fab-inspector` in dependencies (was devDeps, needed at runtime)
- Added `packageManager: bun@1.3.14` to package.json for Vercel
- ROOT CAUSE: Vercel was connected to `StsDev-Wiki-Template` repo, we were pushing to `StsDev-Wiki` — fixes never reached Vercel
- Force-pushed to `StsDev-Wiki-Template` — Vercel should now deploy successfully
- Build passes locally: 0 errors, 0 TypeScript errors
- Remaining warnings (non-blocking): middleware deprecated → proxy, vercel transitive dep

Stage Summary:

- docs/ at project root — non-technical users can find content
- 3 new test files, 47 new tests — full coverage of content layer
- 4 API route files + 3 test files had hardcoded `src/content/docs` — all fixed
- Vercel root cause found: wrong repo. Pushed to correct repo (StsDev-Wiki-Template)
- `packageManager` added so Vercel uses bun + bun.lock
- Build: clean (0 errors)
- Tests: 131 passed, 0 failed

---

Task ID: 3
Agent: main
Task: Add version bumping rule to CONTRIBUTING.md

Work Log:
- Created `.github/CONTRIBUTING.md` with development rules
- Version bumping table: `feat:` → minor, `fix:` → patch, `BREAKING CHANGE:` → major, `docs:`/`chore:`/`style:` → skip
- Added commit message conventions (Conventional Commits), code style rules, content file rules, PR checklist
- Committed and pushed: `9042bed docs: add CONTRIBUTING.md with version bumping rules`

Stage Summary:
- `.github/CONTRIBUTING.md` created — GitHub shows it on PR/issue creation
- Version bumping rule is the first section, most prominent
- Rule: any functional change touching `src/`, `prisma/`, `mini-services/`, or `docs/` content MUST bump `package.json` version
