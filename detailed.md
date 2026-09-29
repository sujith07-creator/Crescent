# Crescent Design — Design Module
### Detailed Business Requirements & Feature Specification,
### The single internal reference for this module

**Companion document:** `simple.md` in this same folder is the client-shareable functional
overview — features, fields and screens, no internal rules or roadmap. This document is the full
specification behind it, for the development team.

**Sources this document consolidates**
- `docs/crescent-core-prd.md` §4 (Module D — Design) and its Design touch-points elsewhere.
- `docs/core-openconstruction-comparison.md` — industry practice found by reading a shipped
  construction ERP's implementation of the same problems.
- Three prior iterations of this module's spec, converged: the original full-detail draft, the
  simplified board-only draft, and the client-lifecycle/scheduling/RFI expansion. Nothing from any
  of those is silently dropped — what didn't make must-have is in §16–§17, not deleted.
- Crescent's own `DRAWING LIST.xlsx` — the seed data in Appendix A and B is real, not invented.

---

## 0. How to read this document

| Audience | Read |
|---|---|
| **Screen generation (Stitch or similar)** | §14 — every screen, its purpose, sections, and actions |
| **Technical PRD & architecture** | §3 (objects + invariants), §4 (lifecycles), §5–§6 (scheduling & conflict logic), §8 (rules), §9 (guards), §10 (events), §11 (background processes), §13 (permissions) |
| **Business review / sign-off** | §1, §2, §7, §16, §17 |
| **New team member orientation** | Read top to bottom once; it's written to stand alone |

**Notation**
- Business rules are numbered `D-R-nn`, events `D-EV-nn`, screens `D-S-nn`, background processes
  `D-BP-nn` — cite these in tickets and tests.
- **[MUST]** marks this version's committed scope (everything in §1–§15). §16 and §17 are
  explicitly *not* committed — read their own headers before assuming anything there is planned.

---

## 1. Scope

### 1.1 What this module owns
1. The **enquiry-to-confirmation journey** — scheduled, calendar-blocking meetings and their
   minutes, site measurement, versioned mood board and scheme plan deliverables, a COO-approved
   quotation, and the gate that turns a signed deal into a project.
2. The **drawing production board** — one project management board per project, drawing tasks
   imported from a checklist template, assigned, scheduled, and tracked to completion.
3. **Formal revision history** — every file uploaded against a drawing task, numbered, described,
   and taken through a review step before it's buildable.
4. **Task sequencing** — dependencies between drawings, computed float, the critical path, and an
   always-current project finish date.
5. **Studio-wide workload awareness** — conflict and capacity warnings the moment the HOD plans a
   task, across every live project at once.
6. **RFIs** — site's or an architect's questions to design, with idle-cost tracking.
7. **Master data** that everything else depends on — the drawing type library, project-type
   templates, and hold reasons.

### 1.2 What this module explicitly does not own

| Not owned here | Owned by |
|---|---|
| Full project financial record (budget, contract value, WBS) | Masters (`docs/modules/masters/`) — owns the canonical Project record; this module creates it (`D-EV-01`) but reads/displays only the subset named in §3.6 |
| Purchase requisitions, vendor selection, POs | Procurement (not yet built) |
| Work orders, measurement, sub-contractor billing | Contracts (not yet built) |
| Client login, client-facing approval of drawings/selections | Nowhere — deliberately excluded, see §16 |
| Shop-drawing submittals from vendors | Deferred, see §16 |
| Material Selection Book, sample tracking | Deferred, see §16 |
| Drawing content — CAD/BIM authoring, markup, clash detection | Nothing, permanently. This module tracks drawing *state*, never drawing *geometry* |

---

## 2. Actors

| Actor | Their one number | May do | May never do |
|---|---|---|---|
| **COO** | How many quotations and project creations are sitting in my queue right now | Approve or return a quotation before it reaches the client; approve or hold a confirmed enquiry's project creation | Draft a quotation; do anything inside a project's board — the COO's involvement is at the two gates, not day-to-day production |
| **HOD** | How many drawings, right now, are either on the critical path or flagged At Risk | Everything in this module: create enquiries/projects, draft quotations, assign, schedule, set dependencies, review and approve revisions, answer/assign RFIs, maintain master data | Send a quotation the COO hasn't approved; unlock a project's board before the COO has approved its creation |
| **Architect** | What's due from me this week, and what's blocking me | Log meetings/measurements they attend, work their assigned tasks, move a task up to Under Review, upload revisions, comment, check off checklist items, raise RFIs, watch tasks they're not assigned to | Approve their own revision to Final (GFC); assign or reassign a task; set another architect's dates or dependencies |

No client role. No PM/Site Engineer role yet — those connect once Planning and Procurement exist.

---

## 3. Business objects

Each object states its fields and its **invariants** — the statements that must hold no matter
which screen touched the record. The invariants are the real specification.

### 3.1 Enquiry
A client interest, before there's a project — tracked on its own board (§14 `D-S-01`), the same
way drawing production is. **Deliberately not modelled as a rigid pipeline** — different enquiries
run different numbers of meetings, in different orders, with different deliverables. What's fixed
is not the shape of the journey but three specific facts about it (below).

**Fields:** enquiry number, client name and contact, property address, engagement type sought,
assigned architect or HOD, **stage** (a plain reference to an Enquiry Stage, §3.17 — HOD-set, not
computed), lost reason.

**Status badges (read-only, derived, independent of stage):** `quotation_status` (None / Draft /
Pending COO / Approved / Sent / Signed, from §3.5), `confirmation_status` (Not started / Pending /
Passed, from the confirmation gate in §3.5), `project_setup_status` (N/A / Pending COO / Approved,
from §3.6). These three are always visible on the card regardless of which stage the card sits in.

**Invariants**
- `D-R-01` A lost enquiry must carry a lost reason.
- `D-R-02` A converted enquiry keeps a permanent link to the project it became; its meetings and
  measurements remain reachable from that project forever.
- `D-R-45` Stage is a plain field the HOD sets directly (dragging the card, or picking from
  §3.17's list) — it carries no system logic, blocks nothing, and unlocks nothing. It is entirely
  independent of the three status badges above.
- `D-R-55` The three status badges are each derived from their own source of truth (the quotation
  object, the confirmation gate, the project's creation-approval field) and can never be set by
  moving a card between stages.

### 3.2 Meeting & MOM
Every meeting relevant to winning or scoping work — a scheduled event with real calendar
consequences, not just a log entry. **Type is a label from a managed list (§3.18), not a fixed
enum with an implied order** — an enquiry can use the same type five times in a row, skip types
entirely, or use them in whatever sequence the deal actually needs. Exactly two types carry
special, non-relabelable *behaviour* (not name) — see §3.18.

**Fields:** meeting number (sequential per enquiry — a running count, not a role indicator), linked
enquiry or project, **type** (references §3.18), **start time, end time**, mode (Site / Office /
Video, with a video link if remote), **invited internal users** (system users, not free text, at
least one — mandatory regardless of type), client attendees (names only, no login), agenda,
minutes text, decisions, action items (owner, due date, status), scope-impact flag, commercial
impact amount, **linked deliverable(s)** (optional, zero or more, any deliverable type — see §3.4),
**linked quotation** (present only when the meeting's type carries the Budget Planning or Client
Quotation role — see §3.18), **decision** (Approved / Returned — present only for the
Budget-Planning-flagged type), attachments, **reschedule history** (prior start/end times, if
moved).

**Invariants**
- `D-R-03` A meeting cannot reach Closed while scope-impact is flagged and no commercial impact
  amount is recorded.
- `D-R-04` A meeting cannot close while any action item lacks an owner or due date.
- `D-R-05` Minutes are editable only until sent; after that, corrections are a new, linked meeting
  record — never an in-place edit of what was already communicated.
- `D-R-46` A meeting of the Budget-Planning-flagged type, closed with decision = Approved, sets the
  same COO-approval fact on its linked quotation as approving it directly on `D-S-06` — two paths
  to one invariant (`D-R-42`), not two separate approvals required.
- `D-R-47` Scheduling a meeting with a start/end time runs the calendar-block, email and Zoho-sync
  side effects in §11 (`D-BP-06`) for every invited internal user. **Requires at least one invited
  internal user — a meeting cannot be scheduled with none.**
- `D-R-48` Rescheduling a meeting that hasn't been Held releases every invitee's calendar block at
  the old time, re-runs `D-BP-06` for the new time, sends a distinct "rescheduled" notice (not a
  fresh-invite notice) to existing invitees, and appends the old slot to reschedule history rather
  than discarding it. A meeting already Held cannot be rescheduled — a new meeting is created
  instead, referencing it.
- `D-R-49` A meeting type not flagged with a special role (§3.18) may be used any number of times,
  in any order, on any enquiry — there is no fixed count, no required sequence, and no required
  pairing to a deliverable type.

### 3.3 Site Measurement
The measured survey of a space. Commonly captured during or after a site-visit-purposed meeting,
but the link is optional, not enforced — a measurement can be logged standalone if the enquiry
never used a distinctly "site visit" type.

**Fields:** linked enquiry/project, **linked meeting** (optional), measured date, measured by,
room-wise dimensions, total area, photos, site condition notes.

**Invariant**
- `D-R-06` The total area produced here becomes the project's area figure on confirmation, and is
  changed afterward only with a recorded reason.

### 3.4 Design Deliverable
Anything produced and optionally presented along the way — a mood board, a scheme plan, a 3D
render, or any other type the studio defines (§3.19). **Not paired to any particular meeting type**
— a deliverable can be attached to any meeting, or none; a meeting can carry any number of
deliverables, or none.

**Fields:** deliverable type (references §3.19), linked enquiry, title, **version number**,
prepared by, **presented at** (linked meeting, optional — a deliverable can exist unpresented),
files, client response (Accepted / Accepted with changes / Rejected), client comments,
**supersedes** (link to the version before it, if any).

**Invariants**
- `D-R-50` A deliverable is never edited after it has been presented at a meeting (i.e., once
  `presented_at` is set) — a change is a new deliverable record at the next version number,
  `supersedes` pointing at the one it follows. The version actually shown to the client is
  preserved exactly as shown.
- `D-R-51` A deliverable's `deliverable_type` cannot change between versions of the same lineage —
  a Scheme Plan v2 supersedes only a Scheme Plan v1, never a Mood Board.
- `D-R-52` A deliverable does not require a linked meeting, and a meeting does not require a linked
  deliverable — the link exists only when it is actually true. No meeting type or deliverable type
  implies the other.

### 3.5 Quotation, Proposal & Confirmation
Three stages of the same commercial document, tracked as it moves from an internal draft to a
signed agreement.

**Quotation fields:** quotation number, linked enquiry, drafted by, priced value, scope summary,
validity, status (Draft / Pending COO approval / COO approved / Sent to client / Signed), COO
approved by, COO approved date, sent date. Once signed by the client, the same record is the
**proposal**.

**Confirmation fields:** proposal file (the signed quotation), advance amount, advance receipt
reference, HOD approval, COO approval, confirmed date.

**Invariants**
- `D-R-42` A quotation cannot move to Sent to client until it is COO approved. Drafting and
  internal revision are unrestricted; only the outbound step is gated.
- `D-R-07` A project cannot be created from an enquiry until all four confirmation checks are true:
  signed proposal on file, advance receipt tagged, HOD approved, COO approved. A project may still
  be created directly by the HOD, bypassing this gate, for a deal confirmed outside the system.
- `D-R-43` Passing the confirmation gate authorises the *project record* to be created; it does not
  by itself unlock the project's board — see `D-R-44` on the Project object below. The gate answers
  "is this deal real"; project creation approval answers "can the studio take it on now." They are
  deliberately separate decisions, both COO's, made at different moments for different reasons.

### 3.6 Project (minimal, for this module)
The subset of Masters' canonical Project record (`docs/modules/masters/detailed.md` §3.1) this
module creates and displays. `D-EV-01` is the trigger that creates the record there — this module
never keeps its own separate copy.

**Fields:** project name, project type (Masters' Project Type master, `docs/modules/masters/
detailed.md` §3.4 — distinct from this module's own Drawing Template pick, §3.8), project code,
area, client name — all Masters', read here — plus **COO creation-approval status, approved by,
approved date**, which is this module's own gate on its board, not a Masters field. A fuller
record (budget, contract value, planned dates, the WBS tree) lives entirely in Masters, out of
scope here.

**Invariants**
- `D-R-08` A project must have a drawing template before it can be created.
- `D-R-44` A project's board — drawing checklist import, task assignment, everything in §7 onward
  — is locked until the COO records creation approval, whether the project came from a confirmed
  enquiry or was created directly by the HOD.

### 3.7 Drawing Type (master)
**Fields:** name, discipline, active/retired.

**Invariant**
- `D-R-09` Retiring a drawing type does not affect any project that already used it — it only
  stops appearing as an option for new imports.

### 3.8 Drawing Template (master)
Picked directly by the HOD at project creation — not derived from Masters' Project Type (§3.4).

**Fields:** name, list of drawing types (with discipline), active/retired.

**Invariant**
- `D-R-10` A template must contain at least one drawing type before it can be used to create a
  project.

### 3.9 Hold Reason (master)
**Fields:** reason text (from a fixed starting list — Client decision pending / Site condition
mismatch / Technical clarification needed / Vendor or consultant input awaited / Internal
resourcing / Other), active/retired.

### 3.10 Drawing Task — the core object
One card on the board; one drawing to be produced.

**Fields**

| Field | Notes |
|---|---|
| Drawing name | From its drawing type, editable per project |
| Discipline | Fixed at creation |
| Assigned architect | — |
| Watchers | Zero or more users following the task without owning it |
| Status | To Do / In Progress / Under Review / Blocked / Final (GFC) |
| Priority | Low / Medium / High / Urgent — HOD's own triage signal, independent of the computed critical path |
| Labels | Free multi-select tags |
| Start date, duration, due date | Due date = start + duration by default, directly overridable |
| Overdue | Derived: due date passed and status ≠ Final |
| Percent complete | Derived from status (To Do 0 / In Progress 25 / Under Review 75 / Final 100; Blocked freezes its last value) |
| Depends on | Zero or more other tasks — see §5 |
| Delivery risk flag | Clear / At Risk — see §6 |
| Hold reason, hold owner | Required only while Blocked |
| Checklist | Free-form checkable sub-items |
| Reference attachments | Site photos, references — distinct from revisions |
| Comments | Timestamped, attributed thread |
| Activity history | Automatic, append-only log of every status/assignment/date change |
| Created by, created date | — |

**Invariants**
- `D-R-11` A drawing task belongs to exactly one project.
- `D-R-12` A task's discipline is fixed at creation, independent of later name edits.
- `D-R-13` Only the HOD assigns or reassigns a task.
- `D-R-14` An architect may move their own assigned tasks between To Do, In Progress, Under Review
  and Blocked — never to Final.
- `D-R-15` A task moved to Blocked must carry a hold reason (from §3.9) and a named owner.
- `D-R-16` Priority never changes any system-computed value (float, critical path, load). It is a
  display and triage aid only.
- `D-R-17` An incomplete checklist never blocks a status transition — it's a visible reminder, not
  a lock.
- `D-R-18` Comments and checklist edits may be made by the assignee, any watcher, or the HOD.

### 3.11 Revision
One numbered version of a task's uploaded file.

**Fields:** revision code (R0, R1, R2…), file, uploaded by, uploaded date, change description,
status (Draft / Under Review / GFC / Returned / Superseded), reviewed by, reviewed date, review
comment.

**Invariants**
- `D-R-19` Revision numbering is sequential per task, starting at R0.
- `D-R-20` Change description is mandatory from R1 onward.
- `D-R-21` Only one revision per task may hold GFC status at a time; a newly approved GFC revision
  automatically supersedes whichever revision previously held it.
- `D-R-22` A Returned or Superseded revision is never edited or deleted — the history is permanent.
- `D-R-23` A task's board status and its current revision's status move together: submitting for
  review, approving to GFC, and returning for rework are single actions that update both — there is
  no separate "revision status" screen to keep in sync by hand.
- `D-R-24` Uploading a new file against a task already at Final (GFC) creates a new Draft revision
  and drops the task to Under Review.

### 3.12 Dependency
A directed link: task A depends on task B (B should reach Final before A starts).

**Invariants**
- `D-R-25` A task cannot depend on itself.
- `D-R-26` A dependency that would create a loop (A → B → A) is rejected at entry.

### 3.13 RFI
A question from site, or from an architect, that design must answer.

**Fields:** RFI number, project, related drawing task, raised by, raised date, question, photos,
blocking-work flag, idle manpower estimate, assigned to, SLA due date (default: raised date + 3
working days), response, responded by, outcome (Clarified / New revision needed / Needs a meeting),
closed date.

**Invariants**
- `D-R-27` A blocking RFI must carry an idle manpower estimate.
- `D-R-28` An RFI cannot close without a stated outcome.
- `D-R-29` SLA breach escalates to the HOD, with the idle cost attached; it never auto-closes.

### 3.14 Comment
**Fields:** linked task, author, timestamp, text.
**Invariant:** `D-R-30` Comments are append-only; a correction is a new comment, not an edit of an
old one.

### 3.15 Checklist Item
**Fields:** linked task, text, checked (bool), checked by, checked date.

### 3.16 Activity Log Entry
**Fields:** linked task, actor, timestamp, field changed, from value, to value. Written
automatically by every status, assignment, or date change — never entered by hand.

### 3.17 Enquiry Stage (master)
The Enquiry Board's own, HOD-configurable columns — deliberately not hardcoded, because different
enquiries legitimately run different processes.

**Fields:** name, display order, active/retired.

**Invariants**
- `D-R-53` A stage carries no system logic — nothing about approvals, deliverables, or meetings is
  ever gated on which stage an enquiry is in. Compare `D-R-42`/`D-R-07`/`D-R-44`, none of which
  reference stage at all.
- `D-R-56` Retiring a stage does not affect enquiries already on it — the same retirement pattern
  as `D-R-09` for drawing types, given its own number since it governs a different object.
- At least one stage must exist for the board to function; seed data (Appendix B-equivalent for
  this object) ships a default set, editable from first use.

### 3.18 Meeting Type (master)
A reusable, HOD-managed list of meeting labels.

**Fields:** name, active/retired, **special role** (None / Budget Planning / Client Quotation).

**Invariants**
- `D-R-54` Exactly one active meeting type carries the Budget Planning role and exactly one carries
  the Client Quotation role at any time — assigning the role to a new type automatically clears it
  from whichever type held it before. The *name* of that type is entirely up to the HOD (it can be
  renamed at will); the *behaviour* in `D-R-46` and the quotation-linkage in §3.2 always follows the
  role flag, never the name.
- A type with no special role (the overwhelming majority) is a plain label with no attached
  behaviour — see `D-R-49`.

### 3.19 Deliverable Type (master)
A reusable, HOD-managed list of deliverable labels (Mood Board, Scheme Plan, 3D Render, or
anything else a project produces).

**Fields:** name, active/retired.

**Invariant**
- `D-R-57` Retiring a deliverable type does not affect deliverables that already used it — same
  retirement pattern as `D-R-09`/`D-R-56`, own number. Any deliverable type may be attached to any
  meeting, per `D-R-52`.

---

## 4. Lifecycles

### 4.1 Enquiry stage — the Enquiry Board's own columns (`D-S-01`), not a state machine
```
[ whatever stages exist in §3.17, in whatever order the HOD arranged them ]
    every stage ──▶ Lost is always reachable (reason required)
```
Stage has **no transition rules** — it's a plain field the HOD sets by moving a card, and any
stage can follow any other. What genuinely gates progress is tracked separately, as the three
status badges on the enquiry (§3.1), driven by their own sources of truth:

```
quotation_status:      None ─▶ Draft ─▶ Pending COO ─▶ Approved ─▶ Sent ─▶ Signed   (§3.5, D-R-42)
confirmation_status:   Not started ─▶ Pending ─▶ Passed                              (§3.5, D-R-07)
project_setup_status:  N/A ─▶ Pending COO ─▶ Approved                                (§3.6, D-R-44)
```
None of these three tracks is affected by which stage column the card sits in, and moving a card
never advances any of them (`D-R-55`).

### 4.2 Meeting
```
Scheduled (blocks calendars, emails, syncs Zoho — D-BP-06) ──▶ Held ──▶ Minutes drafted ──▶ Sent ──▶ Closed
        │                                                                    │
        │ reschedule, not yet Held (D-R-48)                    (scope impact + no commercial value)
        ▼                                                                    ▼
   Scheduled (new time; old block released, D-EV-21 fires)            close blocked

 Only for the type flagged Budget Planning (§3.18), at Closed:
   Decision = Approved ──▶ linked quotation's COO approval set (D-R-46)
   Decision = Returned ──▶ quotation stays in Draft, HOD notified

 Any meeting with a linked deliverable, on Held:
   that deliverable's presented_at is set (D-R-50) ──▶ deliverable locked, client response awaited
   (no meeting type requires this link to exist — D-R-52)
```

### 4.3 Drawing Task ↔ Revision (the core lifecycle — see §3.10/§3.11 invariants for the rules
behind each arrow)

```
   To Do ──▶ In Progress ──▶ Under Review ──▶ Final (GFC)
                  │                │
                  └──────┬─────────┘
                         ▼
                     Blocked ──▶ back to whichever column it left

 In parallel, per uploaded file:
   Draft ──▶ Under Review ──┬──▶ GFC (auto-supersedes the task's previous GFC revision, if any)
                             └──▶ Returned (terminal; next upload starts the next revision number)
```

### 4.4 RFI
```
Raised ──▶ Assigned ──▶ Answered ──▶ Closed (outcome required)
              │
        SLA breach ──▶ escalate to HOD (idle cost attached) — never auto-closes
```

### 4.5 Hold (a task sub-state, not a separate object)
```
Any status except Final ──▶ Blocked (reason + owner required) ──▶ back to prior status
```

---

## 5. Task Dependencies & Critical Path [MUST]

**Business purpose.** Out of fifty drawings on a project, only a handful actually control when it
finishes. Without this, every drawing looks equally urgent — which means none of them are, and the
HOD has no way to tell which slip actually matters.

**Mechanics**
- The HOD names zero or more **predecessor** tasks for any task (§3.12).
- **Earliest sensible start** = the latest due date among a task's predecessors. Entering an
  earlier start date shows a warning, never a block — prep work can legitimately start early.
- **Float** = days a task can slip without moving the project's overall finish date. Zero float =
  on the critical path.
- **Critical path** = the connected chain of zero-float tasks from the project's first task to its
  last.
- **Project finish date** = the due date of the last critical-path task. Never entered directly;
  always derived.

**Recompute trigger.** Float, the critical path, and the project finish date recompute for the
whole project whenever *any* task's dates or actual completion change — not just the task being
edited. A task finishing three days late recalculates every downstream task's earliest start, which
can move the critical path itself (a previously non-critical task can become critical, and vice
versa) and the finish date, immediately and visibly.

**Relationship to §6.** This section is about **sequencing** (what controls timing, regardless of
who's assigned). §6 is about **people** (whether the assigned architect can actually deliver on
time). They are independent flags on the same task — a task can be critical-path and Clear, or
non-critical and At Risk, or both at once, which is the HOD's highest-priority combination.

---

## 6. Planning Conflicts & Delivery Risk [MUST]

**Business purpose.** Several projects run at once from the same small pool of architects, reviewed
by one HOD. A date committed without visibility into the rest of the studio's plan is a promise
made blind.

**Trigger.** Every change to a task's start date, duration, or assigned architect re-runs this
check against every other drawing task in the system (not just this project).

**What it computes and shows**
1. The architect's other overlapping tasks in the resulting window (any project).
2. **Load**: Light (1–2 overlapping) / Busy (3–4) / Overloaded (5+).
3. **Studio clustering**: count of other projects with drawings due in the same window.

**Effect.** Saving is never blocked. Saving while Busy/Overloaded or heavily clustered sets
`delivery_risk = At Risk` on the task. This flag is recalculated — not just set once — every time a
later change anywhere in the system could affect it, including changes to *other* tasks that share
the same architect or window.

---

## 7. End-to-end flow

**This walkthrough is one plausible shape, not the enforced one.** Only step 6 (quotation via the
Budget-Planning-flagged path) and the mandatory attendee rule inside every meeting step are
structural. Everything else — how many meetings, which types, what order, which deliverables — is
whatever the HOD actually does for that enquiry; the system records it, it doesn't prescribe it.

1. An enquiry arrives on the Enquiry Board (`D-S-01`), in whichever stage is first on the HOD's own
   configured list (§3.17).
2. **Meeting 1** (type: whatever the HOD picks, commonly a discovery-purposed one). Scheduled with
   a start/end time and at least one internal invitee (`D-R-47` — mandatory, not optional), which
   runs `D-EV-18`/`D-BP-06`: calendars blocked, emails sent, Zoho synced where connected. Held,
   minuted, Closed — flagged and priced if it touched scope (`D-R-03`). HOD moves the card to
   whichever stage they use for "in progress" — that move has no side effects (`D-R-45`).
3. **Meeting 2**, of whatever type the HOD uses for site visits. A Site Measurement record (§3.3),
   optionally linked to it, captures room-wise dimensions and total area.
4. A deliverable (§3.4, e.g. a Mood Board type, v1) is optionally prepared and optionally attached
   to a later meeting; on that meeting's Held transition, `presented_at` is set (`D-R-50`) and the
   client response is captured against the deliverable itself. Rework produces v2, attached to a
   follow-up meeting of whatever type. None of this is required to happen, or to happen in this
   order (`D-R-52`).
5. Further meetings — any type, any number, in any order (`D-R-49`) — continue for as long as the
   deal needs, each its own MOM, optionally each attaching the next deliverable version, until
   whoever's running the deal decides it's ready to price.
6. **This part is not optional.** HOD drafts the **quotation** (§3.5) and takes it to a meeting of
   the type flagged Budget Planning (§3.18) with the COO, or a direct review for a simple one
   (`D-S-06`); either path sets the COO approval (`D-R-42`, `D-R-46`) — there is no other route. It's
   presented at a meeting of the type flagged Client Quotation, often with the COO attending, and
   sent.
7. The client signs, the advance lands, HOD and COO approve at the confirmation gate — the
   `confirmation_status` badge turns Passed. HOD creates the project — the record exists, but its
   board stays locked until the COO separately approves the project's creation, at which point
   `project_setup_status` turns Approved. None of this depends on, or changes, the enquiry's stage.
8. Once approved, HOD picks a drawing checklist template for the project, adjusts it, imports it —
   every checked item becomes a To Do drawing task.
9. HOD assigns each task to an architect, sets priority and labels, plans start date and duration,
   and sets dependencies. The conflict check (§6) and the critical-path recompute (§5) both run
   immediately and are shown before the HOD commits.
10. Architects work their tasks — checking off checklist items, uploading revisions, commenting,
    moving tasks to Under Review. HOD reviews each revision: approves it to Final (GFC), or returns
    it with a comment, restarting the revision count for the next attempt.
11. Blockers get marked Blocked with a reason and owner; open questions get raised as RFIs, flagged
    blocking if work has genuinely stopped, with the idle cost attached.
12. The project dashboard shows, continuously: progress, critical-path status, at-risk count, and
    the running list of Final (GFC) drawings — the register the rest of the business will eventually
    be pointed at.

---

## 8. Business rules — consolidated catalogue

All `D-R-nn` rules stated in §3–§6, gathered here for quick reference and test-case citation:
`D-R-01` through `D-R-30`, then `D-R-42` through `D-R-57` (numbers `D-R-31`–`D-R-41` belong to the
deferred features in Appendix C, not to committed scope). See the relevant object or section above
for the full statement — this list exists so a rule can be found by number without re-reading the
whole document.

`D-R-01` lost enquiry needs a reason · `D-R-02` enquiry history stays linked to its project ·
`D-R-03` meeting close blocked on unpriced scope impact · `D-R-04` meeting close needs every action
item owned and dated · `D-R-05` sent minutes are append-only · `D-R-06` measured area locks the
project's area figure · `D-R-07` the confirmation gate (or a direct HOD create) · `D-R-08` project
type required to create a project · `D-R-09` retiring a drawing type doesn't touch existing
projects · `D-R-10` a template needs at least one drawing type · `D-R-11` a task belongs to exactly
one project · `D-R-12` discipline fixed at creation · `D-R-13` HOD-only assignment · `D-R-14`
architect status ceiling is Under Review · `D-R-15` Blocked needs reason + owner · `D-R-16`
priority never affects computed values · `D-R-17` incomplete checklist never blocks · `D-R-18` who
may comment/checklist-edit · `D-R-19` sequential revision numbering from R0 · `D-R-20` change
description required from R1 · `D-R-21` one GFC revision per task, auto-supersede · `D-R-22`
Returned/Superseded revisions are permanent · `D-R-23` task status and revision status move
together · `D-R-24` re-upload on a Final task reopens it · `D-R-25`/`D-R-26` no self-dependency, no
loops · `D-R-27` blocking RFI needs an idle estimate · `D-R-28` RFI needs an outcome to close ·
`D-R-29` RFI SLA breach escalates, never auto-closes · `D-R-30` comments are append-only ·
`D-R-42` quotation needs COO approval before it can be sent · `D-R-43` confirmation gate approval
and project-creation approval are separate COO decisions · `D-R-44` a project's board is locked
until COO records creation approval · `D-R-45` enquiry stage is a plain, HOD-set field with no
system logic · `D-R-46` a Budget-Planning-flagged meeting's Approved decision satisfies `D-R-42`
the same as direct review · `D-R-47` scheduling a meeting runs the calendar/email/Zoho side effects
and requires at least one invitee · `D-R-48` rescheduling releases the old block, re-runs those
effects for the new time, and is only possible before the meeting is Held · `D-R-49` unflagged
meeting types are uncapped, unordered, and unpaired to any deliverable · `D-R-50` a presented
deliverable is never edited, only superseded by a new version · `D-R-51` a deliverable's type is
fixed across its version lineage · `D-R-52` no meeting-deliverable link is required in either
direction · `D-R-53` a stage carries no approval/deliverable/meeting logic · `D-R-54` exactly one
meeting type carries each of the two special roles at a time, independent of its display name ·
`D-R-55` the three enquiry status badges are derived from their own sources of truth, never from
stage · `D-R-56` retiring an enquiry stage doesn't touch enquiries already on it · `D-R-57`
retiring a deliverable type doesn't touch deliverables that already used it.

---

## 9. Guards — hard block vs warning

| Situation | Behaviour | Why |
|---|---|---|
| Dependency loop | **Hard block** | Would make float/critical-path computation meaningless |
| Two GFC revisions on one task | **Hard block** (auto-supersede instead) | The whole point of the register |
| Meeting close with unpriced scope impact | **Hard block** | Free work is caught here or not at all |
| RFI close without outcome | **Hard block** | — |
| Architect trying to approve their own revision to GFC | **Hard block** | Only the HOD approves, by design |
| Project creation without the confirmation gate | **Hard block**, unless the HOD uses the direct-create path | Verbal-agreement work is what the gate exists to stop |
| Sending a quotation the COO hasn't approved | **Hard block** | Crescent's pricing control — no off-the-record quotes |
| Scheduling a meeting with zero invited internal users | **Hard block** | Attendee management is mandatory on every meeting, not conditional on type |
| A meeting card sitting in a stage that "looks" further along than its actual quotation/gate/creation status | **Not a guard at all — by design** | Stage is purely organisational (`D-R-45`); the badges are the honest answer, not the column |
| Opening a project's board (import/assign) before COO's creation approval | **Hard block** | The confirmation gate proves the deal; this proves the studio can resource it — neither substitutes for the other |
| Start date earlier than earliest sensible start (predecessor not yet due) | **Warning** | Prep work can legitimately start early |
| Architect load Busy/Overloaded when scheduling | **Warning** (sets At Risk on save) | HOD's judgement may be better than the heuristic |
| Studio clustering heavy | **Warning** (sets At Risk on save) | Same reasoning |
| Checklist incomplete when moving to Under Review | **Warning only, never blocks** | A reminder, not a gate |
| Due date passed, task not Final | **Warning** (Overdue flag) | Visibility, not a lock |

---

## 10. Business events

| ID | Event | Fires when | Who/what reacts |
|---|---|---|---|
| `D-EV-01` | Enquiry converted | Confirmation gate passes | Project record created in Masters (`MA-EV-01`), whose WBS tree auto-seeds (`MA-EV-02`); board locked pending creation approval |
| `D-EV-02` | Meeting closed with scope impact | Close, flag = yes | Visible on enquiry/project timeline |
| `D-EV-14` | Quotation submitted for approval | HOD submits | COO notified |
| `D-EV-15` | Quotation approved / returned | COO decides | HOD notified; approved unlocks "send to client" |
| `D-EV-16` | Project creation submitted for approval | HOD initiates creation on a Confirmed enquiry | COO notified |
| `D-EV-17` | Project creation approved / held | COO decides | HOD notified; approved unlocks the board (`D-EV-03` onward becomes possible) |
| `D-EV-03` | Drawing checklist imported | Import confirmed (requires `D-EV-17`) | Tasks created in To Do |
| `D-EV-04` | Task assigned | HOD sets/changes architect | Notification; conflict check runs |
| `D-EV-05` | Task scheduled/rescheduled | Start/duration/due date set | Conflict check + critical-path recompute run |
| `D-EV-06` | Revision submitted for review | Task moved to Under Review | HOD notified |
| `D-EV-07` | Revision approved (GFC) | HOD approves | Previous GFC revision superseded; task → Final |
| `D-EV-08` | Revision returned | HOD returns with comment | Task → In Progress; architect notified |
| `D-EV-09` | Task flagged At Risk | Save while Busy/Overloaded/clustered | HOD notified; board/dashboard updated |
| `D-EV-10` | Task blocked / unblocked | Status → / ← Blocked | HOD notified |
| `D-EV-11` | RFI raised as blocking | Create, blocking = yes | HOD notified with idle cost |
| `D-EV-12` | RFI SLA breached | Clock expiry | HOD escalation |
| `D-EV-13` | Task completed late | Marked Final after its due date | Downstream tasks' earliest start recomputed; critical path and finish date recompute |
| `D-EV-18` | Meeting scheduled (first time) | Start/end time set on a new meeting | Runs `D-BP-06`: calendar block, email, Zoho sync for every invitee |
| `D-EV-19` | Meeting of the Budget-Planning-flagged type closed with a decision | Meeting Closed, decision set | Approved → quotation's COO approval set (`D-R-46`); Returned → HOD notified |
| `D-EV-20` | Enquiry status badge changes | Quotation, gate, or creation-approval state changes | Badge updates on the card, independent of stage (`D-R-55`) |
| `D-EV-21` | Meeting rescheduled | Start/end time changed on a not-yet-Held meeting (`D-R-48`) | Old calendar block released; `D-BP-06` re-runs for the new time; invitees get a "rescheduled" notice, not a fresh invite |
| `D-EV-22` | Deliverable presented | A meeting with a linked deliverable is Held | `presented_at` set (`D-R-50`); deliverable locked; client-response capture opens |
| `D-EV-23` | Enquiry moved to a different stage | HOD drags/selects a new stage | Purely organisational — no side effects, nothing else in the system reacts (`D-R-45`) |

---

## 11. Background processes

| ID | Process | Runs | Does |
|---|---|---|---|
| `D-BP-01` | RFI SLA clock | Continuously per RFI | Escalates to HOD on breach; never auto-closes |
| `D-BP-02` | Overdue watcher | Daily | Flags tasks past due date and not Final |
| `D-BP-03` | Critical-path recompute | On every date/completion change | Recalculates float, critical path, project finish date for the affected project |
| `D-BP-04` | Load & clustering recompute | On every schedule/assignment change | Recalculates architect load and studio clustering for the affected window; re-flags any task whose risk status changes as a result |
| `D-BP-05` | Studio Workload refresh | Daily, plus on-change | Feeds `D-S-19`'s per-architect calendar and At Risk list |
| `D-BP-06` | Meeting scheduling side effects | On `D-EV-18` or `D-EV-21` | For every invited internal user: block their calendar for the slot (surfaced on `D-S-19` alongside drawing-task load; a reschedule first releases the old slot's block), send an email with the meeting details (worded as a fresh invite on `D-EV-18`, as a reschedule notice on `D-EV-21`), and — if that user has a Zoho Calendar connection — create or update the matching Zoho event. A user without Zoho connected still gets the block and the email; the Zoho step is simply skipped for them, never a failure |

---

## 12. Notifications

| Trigger | Who's told |
|---|---|
| Meeting scheduled | Every invited internal user — in-app, email, and Zoho if connected |
| Meeting rescheduled | Every invited internal user — a distinct "rescheduled" notice, not a fresh invite |
| Meeting action item due | Owner |
| A deliverable I prepared gets a client response | Preparer (HOD/architect) |
| Budget Planning Meeting decides Returned | HOD |
| Quotation submitted for approval | COO |
| Quotation approved / returned | HOD |
| Project creation submitted for approval | COO |
| Project creation approved / held | HOD |
| Enquiry confirmed into a project | HOD |
| Task assigned to me | Architect |
| Revision submitted for review | HOD |
| Revision approved (Final/GFC) | Architect |
| Revision returned | Architect |
| Task marked Blocked | HOD |
| Final task gets a new revision, drops to Under Review | HOD |
| Task becomes At Risk | HOD |
| Architect's load crosses into Overloaded | HOD |
| Predecessor finishes late, pushing a dependent's earliest start | HOD, assigned architect |
| Project finish date moves | HOD |
| RFI assigned to me | Architect |
| RFI I raised is answered | Raiser |
| RFI breaches SLA | HOD |
| I'm watching a task that changes status | Watcher |

---

## 13. Permissions intent

| Capability | Who |
|---|---|
| Create/manage enquiries, meetings, measurements | HOD, architect running the deal |
| Schedule/reschedule a meeting (triggers calendar block, email, Zoho sync) | HOD, architect running the deal |
| Set a Budget Planning Meeting's decision | COO only |
| Prepare/version a Mood Board or Scheme Plan | HOD, architect running the deal |
| Record a deliverable's client response | HOD, architect running the deal |
| Draft a quotation | HOD, architect running the deal |
| Approve a quotation before it's sent to the client | COO only, via either the Budget Planning Meeting decision or direct review |
| Approve project confirmation (the gate) | HOD **and** COO, both required (or HOD direct-create) |
| Approve a confirmed project's creation (unlocks the board) | COO only |
| Create drawing tasks (via import) | HOD, once COO has approved project creation |
| Assign/reassign a task, set priority, labels, dependencies, dates | HOD only |
| Move own task To Do → In Progress → Under Review → Blocked | Assignee |
| Approve or return a revision | HOD only |
| Upload a revision | Assignee |
| Comment, edit checklist | Assignee, watchers, HOD |
| Add/remove a watcher | HOD, or the architect adding themselves |
| Raise an RFI | Anyone with project access |
| Answer / close an RFI | HOD, assigned architect |
| Manage master data (drawing types, templates, hold reasons, enquiry stages, meeting types, deliverable types) | HOD |
| Reassign the Budget Planning / Client Quotation role to a different meeting type | HOD |

---

## 14. Screens

`D-S-01` **Enquiry Board** — Kanban on the **HOD-configurable stage list** (§3.17), not a fixed set
— board settings let the HOD add/rename/reorder/retire columns. Each card: client, assigned
HOD/architect, next scheduled meeting, and the three always-visible status badges (Quotation /
Confirmation / Project Setup — §3.1) that never depend on the column. A list-view toggle.
"+ New Enquiry."
`D-S-02` **Enquiry Detail** — the three status badges pinned at the top, then one timeline mixing
every meeting, deliverable, measurement and the quotation in date order, each tagged by its own
type and sequence number (Meeting 1 — [type], Meeting 2 — [type], Mood Board v1, …) — whatever
actually happened, in the order it happened, with no assumed shape. Actions: schedule a meeting of
any type, add site measurement, upload a deliverable of any type, draft and submit the quotation,
mark it sent/signed, open the confirmation gate.
`D-S-03` **Meeting / MOM Editor** — type: a searchable dropdown sourced from `D-S-20`'s Meeting
Types tab, not a hardcoded list. Start/end time, mode, an internal-user invitee picker (**at least
one required to save** — `D-R-47`), an optional linked-deliverable panel (any deliverable, any
meeting — no type restriction), a linked-quotation panel shown only when the selected type carries
the Budget Planning or Client Quotation role flag, agenda/minutes/decisions/action items, the
scope-impact/commercial-impact guard, and — only for the type flagged Budget Planning — the
Approved/Returned decision control. A separate **Reschedule** action (only while not yet Held) that
shows the old and new time side by side and re-runs the schedule side effects (`D-R-48`). Saving a
schedule change fires `D-EV-18`; a reschedule fires `D-EV-21`.
`D-S-04` **Site Measurement** — room-wise entry with running area total.
`D-S-05` **Design Deliverable** — deliverable type: a dropdown sourced from `D-S-20`'s Deliverable
Types tab. Title, a version strip (every past version viewable, none editable), file upload, an
optional linked meeting it was/will be presented at, and — once `presented_at` is set — the
client-response selector (Accepted / Accepted with changes / Rejected) with a comments box. "New
version" is offered only against an existing deliverable's lineage, never as a silent overwrite.
`D-S-06` **Quotation Review (COO)** — COO's approval queue: enquiry, client, priced value, scope
summary, per quotation. Approve or return with a comment; approving is what unlocks "send to
client" on `D-S-02`.
`D-S-07` **Confirmation Gate** — three-row checklist (signed proposal / advance / HOD+COO
approval), single Confirm action.
`D-S-08` **Project Creation Approval (COO)** — COO's second approval queue: every Confirmed
enquiry whose HOD has initiated project creation, with project name, client, area and the linked
quotation value. Approve or hold with a comment; approving unlocks that project's board.
`D-S-09` **Projects** — list with progress, finish date, at-risk/critical counts, and a badge for
any project still awaiting `D-S-08`'s approval.
`D-S-10` **New Project** — name + type.
`D-S-11` **Import Drawing Checklist** — template as a pre-checked, adjustable list; reachable only
once `D-S-08`'s approval is recorded for that project.
`D-S-12` **Project Drawing Board** — the five-column Kanban, with priority, critical-path marker,
At Risk ribbon on every card; filters for all of the above.
`D-S-13` **Drawing Task Detail** — the richest screen: identity/priority/labels header, status
track, planning fields with live conflict panel, dependency picker with float shown, revision
history with approve/return, checklist, comments, reference attachments, activity history, hold
fields when Blocked.
`D-S-14` **Project Timeline** — Gantt-style bars with dependency lines and the critical path
highlighted.
`D-S-15` **RFI Log** — table with an idle-cost stat tile.
`D-S-16` **RFI Detail** — question/response/outcome.
`D-S-17` **My Tasks** — architect's personal cross-project view, with their own upcoming meetings
listed above the task groups.
`D-S-18` **Project Dashboard** — progress, discipline breakdown, at-risk count, critical-path
summary, Final (GFC) drawing list.
`D-S-19` **Studio Workload** — per-architect calendar across all projects, **drawing-task load and
scheduled meetings shown on the same calendar** (fed by `D-BP-05`/`D-BP-06`), load badges,
firm-wide At Risk list.
`D-S-20` **Manage Master Data** — six tabs: Drawing Types, Drawing Templates, Hold Reasons,
**Enquiry Stages** (§3.17 — reorderable, add/rename/retire), **Meeting Types** (§3.18 —
add/rename/retire, with a role selector that can be set to Budget Planning or Client Quotation on
exactly one entry each — `D-R-54`), **Deliverable Types** (§3.19 — add/rename/retire, unrestricted).

---

## 15. Reports & KPIs

| Metric | Formula | Owner | Signal |
|---|---|---|---|
| Drawings at risk | Count of tasks flagged At Risk, live | HOD | The single number that answers "is the studio overcommitted right now" |
| Critical-path adherence | Critical-path tasks finished on/before their due date ÷ total critical-path tasks closed | HOD | Falling adherence explains a slipping project before the client asks why |
| Architect load distribution | Count of architects currently Busy/Overloaded | HOD | Staffing/hiring signal |
| RFI idle cost, open | Sum of idle manpower estimates on open blocking RFIs | HOD | Cost of slow design answers, made visible weekly |
| Revision churn | Average revisions per task before GFC | HOD | A drawing type or architect with high churn is worth a process look |
| Meeting-to-confirmation cycle time | Days from first meeting to confirmed project | HOD, COO | Sales-side efficiency, distinct from design production |
| GFC throughput | Drawings reaching Final per week, by project | HOD | Raw production rate |

---

## 16. Later — good to have, not now

Not deleted, not forgotten — deliberately not in this version's committed scope.

| Feature | What it adds | Why it waits |
|---|---|---|
| Client approval portal | Client sees and signs off drawings/selections directly | Explicitly excluded — Crescent stays the only user of the system |
| Shop-drawing submittals from vendors — rule detail in **Appendix C** | Review vendor fabrication drawings before they build | Needs a Contracts/vendor module; formal revisions (§3.11) now exist, so only the vendor linkage is still missing |
| Material Selection Book, samples — rule detail in **Appendix C** | Track brand/finish selections and lead times | Needs a Procurement module — order-by dates need a purchase requisition to check against |
| As-built drawings & handover pack | What's assembled at project close | Revisit once a project actually reaches that stage |

---

## 17. Not planned — only if the client asks for it

Separated from §16 on purpose: these aren't on the roadmap at all right now, only worth building if
specifically requested by the business.

| Feature | What it adds | Why it's parked here |
|---|---|---|
| Design stages as billable milestones | Ties stage completion to Design-only fee invoicing | Needs a Finance module connected, and no one's asked for stage-wise billing yet |
| SLA clocks / auto-escalation beyond RFI | Automatic nagging when something sits too long | §3.13/§11's RFI SLA already covers the one case that's proven to matter; broader auto-escalation is an unproven need |
| Drawing ↔ WBS mapping and a GFC gate blocking procurement | A held/non-GFC drawing blocks purchasing against that scope | Needs both a WBS structure and a Procurement module that don't exist yet — build only when those are real and the connection is actually asked for |

---

## 18. Glossary

| Term | Meaning |
|---|---|
| **GFC** | Good For Construction — the approved, buildable revision |
| **Quotation** | The priced offer to a client; requires COO approval before it can be sent |
| **Budget Planning role** | The special flag on exactly one Meeting Type (§3.18) that carries mandatory COO-approval behaviour (`D-R-46`, `D-R-54`) — the type's display name is freely renamable, the role isn't |
| **Client Quotation role** | The special flag on exactly one Meeting Type for the client-facing quotation presentation — same renamable-label, fixed-role pattern |
| **Zoho sync** | The mirrored event created in an invitee's own Zoho Calendar when they've connected it (`D-BP-06`) |
| **Enquiry stage** | An HOD-configurable board column (§3.17) — a plain, hand-set field with no system logic (`D-R-45`) |
| **Status badge** | One of an enquiry's three derived facts — Quotation, Confirmation, Project Setup — shown independent of stage (`D-R-55`) |
| **Mood Board** | A common Deliverable Type (§3.19) — the first visual direction shown to a client, versioned |
| **Scheme Plan** | A common Deliverable Type — the layout proposal, refined across however many meetings a deal needs |
| **Reschedule** | Moving a not-yet-Held meeting's time; releases the old block and re-runs `D-BP-06`, distinct from a fresh invite (`D-R-48`) |
| **Revision** | One numbered version of a drawing task's file, with its own review step |
| **MOM** | Minutes of Meeting |
| **RFI** | Request For Information — a question to design, with idle-cost tracking |
| **Dependency / predecessor** | A task that should reach Final before another one starts |
| **Float** | Days a task can slip without pushing the project finish date |
| **Critical path** | The chain of zero-float tasks that controls the project finish date |
| **Window** | A task's date range, start to due date |
| **Load** | An architect's overlapping-task count in a window — Light / Busy / Overloaded |
| **At Risk** | A flag meaning a task's timeline is likely to slip, from overload or clustering |
| **Watcher** | Someone following a task's updates without owning it |

---

## Appendix A — Drawing Type Library (seed data)

**Architectural**
Site Layout · Setting-out Plan · Scheme layout · Furniture layout · Floor plan · Joinery Details ·
Openings Schedule · Staircase Plan · Staircase sections · Elevations · Elevation Sections ·
Elevation finishes · Sections · Material finishes · Flooring layout · Tile Layout & Specifications ·
Roof drawings · Compound wall drawings · MS/SS fabrication drawings

**Structural**
Pile Layout · Pile Details · Pilecap layout · Pilecap Details · Footing Layout · Footing Details ·
Column layout · Column Details · Plinth Beam Layout · Plinth Beam Details · Grade beam Layout ·
Grade beam Details · Sump Layout · Sump Details · Septic Tank Layout · Septic Tank Details ·
Lift pit layout · Lift pit Details · Staircase Details · Sill Layout/Details · Lintel
Layout/Details · Roof beam layout · Roof beam Details · Roof slab layout · Roof slab Details ·
OHT details · Structural sections

**Mechanical**
Elevators drawings · Escalators drawings · HVAC drawings · Ventilation drawings ·
Fire safety layout · Sprinkler layout · Smoke detector layout · AC layout

**Electrical**
Overall electrical layout · Roof slab Electrical Layout · Wall electrical layout · Wall electrical
conduits layout · Floor electrical layout · False Ceiling Electrical Layout · Electrical looping
layout · Earthing Layout · External electrical layout · DB schedule · CCTV layout · Voice and Data
layout · PA system layout · Automation layouts · Alarm layout · Interior electrical layout

**Plumbing**
External Drainage Layout · Rainwater Drainage Layout · Water supply Layout · Drainage Layout ·
Plumbing fixture Details · Terrace Drain Details · Plumbing chamber layout · Septic Tank/Soak Pit
Details

**Landscape**
Landscape layout · Hardscape layout · Paving layout · Driveway layout · Pathway/walkway layout ·
Retention wall layout · Irrigation drawings · Drainage drawings · Planting layout · Planting
Schedule · Landscape lighting layout · Potted plants layout · Water features layout · Water
features detail · Site furniture layout

**Interior Design**
RECEE — Site Measurements · Mood Board · Concept drawings · 3D Renders · Furniture Layout ·
False Ceiling Layout · False Ceiling sections · Flooring Layout · Glazing Details · Carpentry
Drawings · Factory production drawings · Material finishes · Wall elevations

**As-Built**
Floor plan · Electrical plans · Plumbing plans · External Drainage Layout · Structural layout

---

## Appendix B — Starter Drawing Templates (seed data)

**Template: "Full Design & Build"** — all eight disciplines from Appendix A in full.

**Template: "Structural + MEP + Floor Plan"** (a lighter checklist)

- *Floor Plan:* Scheme · Furniture Layouts · Working Drawings (GF Masonry Wall Layout, GF Above
  Lintel Wall Layout, FF Masonry Wall Layout, FF Above Lintel Wall Layout, Headroom Wall Layout) ·
  Elevation (3D, 2D Details, Estimate) · Sections (Floor Sections, Staircase Sections)
- *Structural:* same list as Appendix A's Structural discipline
- *MEP:* GF Roof Electrical · GF Wall Electrical · GF Flooring Electrical · GF Networking Layout ·
  FF Roof Electrical · FF Wall Electrical · FF Flooring Electrical · FF Networking Layout ·
  GF Plumbing Layout · FF Plumbing Layout · Rainwater Harvest
- *Details:* Door and Window Details · Window Grill Design · Flooring Tile Layout · Toilet Tile
  Layout · Toilet Plumbing Layout · Planter Box Details · Kitchen Details · Handrail Details ·
  Feature Wall Details

---

## Appendix C — Deferred rule detail (Shop Drawing Submittals, MSB & Samples)

Kept verbatim so the thinking isn't lost when §16 is picked back up.

**Shop drawing submittals** — a carpentry/MEP/joinery vendor's fabrication drawing, submitted for
Crescent's design team to approve before the vendor fabricates.

- `D-R-31` A submittal must reference the governing Crescent drawing revision it was produced
  against.
- `D-R-32` The reviewer and the approver of a submittal must be different people.
- `D-R-33` "Approved as noted" requires an attached markup.
- `D-R-34` When a governing revision is superseded, all open submittals against it are flagged for
  re-verification.

*Depends on:* a vendor/work-order record to link the submittal to. Formal drawing revisions (§3.11)
now exist, so that half of the original dependency is already satisfied.

**Material Selection Book & samples** — tracking exactly what material goes into each space (brand,
finish, colour), separate from the drawing that shows where it goes.

- `D-R-35` Order-by date is computed (WBS planned start − lead time − buffer), never entered.
- `D-R-36` A specification is locked on client approval; a change creates a new line version
  requiring fresh approval.
- `D-R-37` A spec change on an already-ordered line raises a change request.
- `D-R-38` A line moves to Ordered only when a purchase requisition is linked.
- `D-R-39` Every MSB line references an item in the procurement item master; no free text.
- `D-R-40` Where a sample was requested, the sample decision — not the specification text — is the
  client approval.
- `D-R-41` An MSB line whose order-by date passes with no linked purchase requisition raises a
  standing exception.

*Depends on:* a WBS structure with planned dates, a procurement item master, and purchase
requisitions to link against.
