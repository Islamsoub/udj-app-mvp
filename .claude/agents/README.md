# How a mission runs

Four agents live here. They do not call each other — subagent nesting is
fragile. The session you are typing in is the orchestrator.

Read this before invoking any of them.

## The sequence

1. **Plan.** "Use the lead agent. Task: <what you want>."
   It returns a path like `.claude/missions/2026-11-09-hero-tokens/`.

2. **Check the plan yourself.** Open MISSION.md. Fix it if the milestones are
   wrong, and answer anything under Flags before going on. A bad mission
   produces three bad pull requests.

3. **Build, one milestone at a time.**
   "Use the builder agent. Mission: <path>. Milestone: 1."
   It branches `feature/<slug>` from develop, implements, typechecks and opens
   a PR. It never merges.

4. **Capture the diff as a file**, so the reviewer cannot touch the code:
   `git diff develop...feature/<slug> > <mission path>/diff-1.patch`

5. **Review.** "Use the reviewer agent. Diff: <mission path>/diff-1.patch.
   Mission: <mission path>. Milestone: 1."

6. **Design, only if the milestone changed something visual.**
   "Use the design-checker agent. Screen: <name>."
   Its value pass works today. Its visual pass does not yet — there is no
   build-and-screenshot step and no login credential for the agents. Until
   that exists, use it for token and value differences only.

7. **Write the packet** to `.claude/reports/<YYYY-MM-DD>-<slug>.md`:
   the milestone and whether it met its goal, the files touched with generated
   ones marked, what the builder flagged instead of deciding, the reviewer's
   findings, the design checker's differences, and what needs a human decision
   stated as a question.

8. **A human merges.** No agent merges, ever.

## Rules that outrank anything an agent says

- One milestone, one pull request. A PR touching paths outside the milestone's
  declared list is rejected, not negotiated.
- A mission spans one product. If it needs app and backend, that is two
  missions — their rules differ and so do their checks.
- Anything touching `backend/prisma/schema.prisma`: run `npx prisma db push`
  against the live database BEFORE merging to develop. Render auto-deploys
  develop, so the wrong order puts live code in front of columns that do not
  exist yet.
- The deny list in settings.json stops the obvious destructive commands and
  nothing more. Argument patterns are guidance, not a boundary. The real
  safeguard is that builders never merge and origin is the backup.

## Known gaps

- The design checker has no way to build, serve and screenshot the PWA, and no
  credential to get past the login screen. Visual comparison is unavailable.
- There is no event pipe and no room yet. Progress is visible only in the
  mission folder and the review packet.
