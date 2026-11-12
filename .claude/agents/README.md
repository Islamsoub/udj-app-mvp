# How a mission runs

Four agents live here. They do not call each other — subagent nesting is
fragile. The session you are typing in is the orchestrator.

Read this before invoking any of them.

## The sequence

You give the lead a task. From there the run continues on its own until it
finishes or hits something it cannot decide. Nothing merges; every milestone
ends as a branch and a pull request.

1. **Plan.** "Use the lead agent. Task: <what you want>."
   It returns a mission folder path.

2. **Then keep going without being asked.** For each milestone in order,
   skipping any the mission marks as blocked:
   a. "Use the builder agent. Mission: <path>. Milestone: N."
   b. `git diff develop...feature/<slug> > <path>/diff-N.patch`
   c. "Use the reviewer agent. Diff: <path>/diff-N.patch. Mission: <path>.
      Milestone: N."
   d. If the reviewer has findings, send them back to the builder once, then
      re-run the reviewer on the new diff.
   e. Move to the next milestone.

3. **Stop and report** at the first of:
   - a milestone the mission's Flags block;
   - findings that survive one fix round;
   - a decision that cannot be undone, or that the mission does not settle;
   - a milestone that touches `backend/prisma/schema.prisma`, which needs the
     database updated before any merge.

   Stopping is a normal outcome, not a failure. Say which it was.

4. **Write the packet** to `.claude/reports/<YYYY-MM-DD>-<slug>.md`. This is
   not optional any more: it is the only thing Islam reads after a run. It
   covers each milestone and whether it met its goal, the branches and files
   touched with generated ones marked, what the builder flagged rather than
   decided, the reviewer's findings and whether they were fixed, where the run
   stopped and why, and what needs a human decision, written as a question.
   It also says, for each milestone, whether it changed what a product can do, and
   if so whether `.claude/feature-parity.md` was updated in the same pull request.
   A capability change without that update is a finding, not a footnote.

5. **A human merges.** No agent merges, ever. Merging develop deploys: Render
   rebuilds the backend, Vercel rebuilds the PWA.

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
- If a milestone changes what a product can do (adds, removes or finishes a
  capability, or moves a computation between server and client), the same pull
  request updates `.claude/feature-parity.md`. A file nobody is required to touch
  goes stale; the March task list is the proof.

## The room

A pixel-art office where you can watch the four agents work. Start it from the
repo root:

    node .claude/room/serve.mjs

and open http://localhost:4321. Leave it in a tab while a mission runs.

| Agent    | Colour | Looks like                          | Desk                    |
|----------|--------|-------------------------------------|-------------------------|
| lead     | purple | top-knot bun, works standing up     | top left, by the board  |
| builder  | green  | green hood and headphones           | top middle              |
| reviewer | orange | curly auburn hair, glasses          | bottom right            |
| checker  | cyan   | cyan cap (this is design-checker)   | bottom left             |

An agent sits at its desk while working, wanders off when idle, and shows a
yellow `?` when it is waiting on you, a red `!` when it finished with a
problem, a green `✓` when it finished cleanly. Your own messages appear in the
log as `you`.

A `✓` means the agent ran to completion, nothing more. Done-vs-flag is a
keyword match on the agent's last message, not a judgement of the work. Whether
a change is right is for the reviewer's findings and the review packet to say.

How it is fed: hooks in `.claude/settings.json` run `.claude/room/hook.mjs`,
which appends one line per notable event to `.claude/room/events.ndjson`. The
page polls that file every 2 seconds. With no file, it plays a built-in demo.
The file is local, gitignored, and kept to its last 500 lines. Delete it to
start the log fresh.

Only the four agents are shown. Work the orchestrating session does itself is
not in the room.

## Known gaps

- The design checker has no way to build, serve and screenshot the PWA, and no
  credential to get past the login screen. Visual comparison is unavailable.
- In the room, a red `!` is a guess from the agent's final report (and, for
  the lead, the Flags section of MISSION.md).
- The room's "waiting" state has never fired for real. The hook was written
  without ever seeing a real Notification payload, so whether it names the
  right agent — or fires at all — when an agent needs your approval is
  unknown.
