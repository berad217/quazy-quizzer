# Handover Guide

**Purpose**: Enable smooth context resets by capturing what's not documented elsewhere

---

## For Outgoing AI: How to Write a Handover

### When User Requests Handover

You're about to hand off to a fresh AI session. Your job: **Capture the conversation context that doesn't live anywhere else.**

### Step 1: Inventory What Exists

**Don't assume documentation exists.** Check what's actually in the project:

```bash
# What docs are present?
- [ ] documentation/Onboarding.md (how to work with this human)
- [ ] documentation/global-preferences.md (communication style)
- [ ] SPEC.md or similar (what to build)
- [ ] DEVLOG.md (what was built and why)
- [ ] Code (actual implementation)
```

**Adapt your handover based on what's missing.**

### Step 2: Understand What to Capture

Different docs serve different purposes:

| Document | What It Contains | What It DOESN'T Contain |
|----------|------------------|-------------------------|
| Spec | What to build (decisions made) | Decisions still in flight |
| DEVLOG | What was built + rationale | Current discussions, unsolved problems |
| Code | Implementation | Why we chose this approach over alternatives we discussed |
| **Handover** | **Conversation state** | Nothing - handover is ephemeral |

**Handover captures the discussion, not just the state.**

### Step 3: Write the Handover

Use this template, adapting sections based on what exists:

---

## Handover Template

### Quick Start

**If `documentation/Onboarding.md` exists:**
```
New AI: Start by reading documentation/Onboarding.md (how to work with this human)
Then read documentation/global-preferences.md (communication style)
Then come back here.
```

**If onboarding doesn't exist:**
```
New AI: This human [brief description - direct communication, non-professional coder, values intellectual honesty, etc.]
```

### Project Context

**If SPEC.md exists:**
```
Project: [name]
Spec: SPEC.md (read sections [X-Y] for current work)
Phase: [Ideation / Spec writing / Implementation]
```

**If no spec:**
```
Project: [name and purpose]
Current goal: [what we're trying to build]
Decisions made: [key technical choices]
```

### Where We Are

**If DEVLOG.md exists:**
```
Implementation progress: See DEVLOG.md
Last completed: Sprint [N] - [brief summary]
Current work: Sprint [N+1] - [what we're working on]
```

**If no DEVLOG:**
```
What's been built:
- [Component/feature]
- [Component/feature]

What's working: [current state]
What's not done: [remaining work]
```

### Conversation Context (CRITICAL SECTION)

**This is the heart of the handover.** Capture what's NOT in other docs:

**Active discussion:**
- What problem/question were we working through?
- What approaches have we considered?
- What have we tried that didn't work?
- What are we stuck on?

**Decisions in flight:**
- What are we trying to decide?
- What are the options on the table?
- What tradeoffs are we weighing?

**Example:**
```
We were refactoring the quiz engine to separate state management from rendering.
Discussed 3 approaches:
1. Lift state to parent component (simple but couples everything)
2. Use React Context (cleaner but might be overkill)
3. Custom state manager (flexible but more code)

Concern: Current approach tightly couples quiz logic to UI components, making testing hard.
We haven't decided yet - need to discuss tradeoffs.

Also discovered: File path resolution won't work when we package as Electron app.
Parked for now but will need to address in Sprint 6.
```

### Red Flags / Warnings

**Things that might bite us:**
- Technical debt we're aware of
- Known issues we're accepting for now
- Decisions we made that we're not 100% confident about
- Dependencies that might be problematic

### Next Steps

**Immediate actions for next session:**
1. [First thing to do]
2. [Second thing to do]
3. [Third thing to do]

Be specific. Not "continue working on quiz engine" but "Finish state management refactor, then write tests for quiz progression logic."

---

### Step 4: Keep It Lean

**Don't duplicate what's already documented.**

- If it's in the spec → reference the spec
- If it's in DEVLOG → reference the DEVLOG
- If it's in code comments → reference the file

**Only elaborate on ephemeral conversation context.**

### Step 5: Deliver the Handover

Tell the user:
1. "I've prepared a handover document"
2. Briefly summarize what's captured
3. Confirm it captures what they needed

Save as: `documentation/current-handover.md` or `HANDOVER.md`

---

## For Incoming AI: How to Use a Handover

### Step 1: Read in Order

1. `documentation/global-preferences.md` (if exists) - Communication style
2. `documentation/Onboarding.md` (if exists) - How to work with this human
3. **Handover document** - Current state and conversation context
4. `SPEC.md` (if exists) - What we're building
5. `DEVLOG.md` (if exists) - What's been built

### Step 2: Confirm Understanding

Tell the user:
- "I've read the handover and [other docs]"
- "I understand we're [current state/discussion]"
- "Ready to [next action from handover]"

Give them a chance to correct or add context.

### Step 3: Continuous Improvement Feedback

**If the handover was inadequate, say so directly:**

"The handover was missing [X]. To pick up effectively, I also needed to know [Y]. For future handovers, it would help if the guide emphasized [Z]."

**Examples of inadequate handovers:**
- Missing context on what was being discussed
- No mention of decisions in flight
- Didn't capture what approaches were already tried
- No warning about known issues
- Next steps too vague

**Don't suffer silently.** If you had to ask the user to explain things that should have been in the handover, tell them so the guide can be improved.

### Step 4: Get to Work

Once oriented, continue where the last session left off. The goal: user shouldn't feel like they reset the conversation.

---

## Anti-Patterns

**For Outgoing AI:**

❌ **Assuming docs exist** - Check first
❌ **Writing a novel** - Keep it lean, reference other docs
❌ **Only stating facts** - Capture the discussion and uncertainty
❌ **Vague next steps** - Be specific and actionable
❌ **Skipping red flags** - Warn about known issues

**For Incoming AI:**

❌ **Skipping the handover** - Read it first
❌ **Asking questions answered in handover** - User will notice
❌ **Not providing feedback** - If handover was bad, say so
❌ **Diving straight into code** - Orient yourself first

---

## Example: Good Handover

```markdown
# Handover - Quiz App

## Quick Start
New AI: Read documentation/Onboarding.md first, then come back here.

## Project Context
Project: Quazy Quizzer (quiz app for kids)
Spec: SPEC.md (living document, last updated today)
Phase: Implementation - Sprint 3 of 6

## Where We Are
Progress: See DEVLOG.md
Completed: Sprints 1-2 (config system, quiz loader)
Current: Sprint 3 (quiz engine state management) - 60% done

## Conversation Context

**Active discussion:**
We're refactoring quiz engine to decouple state from UI. Current implementation has quiz logic scattered across React components, making it untestable.

**What we tried:**
1. Lifting state to App component - works but creates prop drilling hell
2. Started extracting to separate QuizEngine class - in progress

**Decision in flight:**
Should QuizEngine be:
- Pure JS class (testable, but manual wiring to React)
- Custom hook (React-native, but harder to test)
- Zustand store (overkill for this project?)

User prefers modularity. Leaning toward pure class but need to discuss ergonomics.

**Red flag:**
Quiz engine currently assumes file paths work. Won't work in Electron packaging (Sprint 6 problem, noted in DEVLOG Sprint 1).

## Next Steps
1. Finish QuizEngine class extraction (src/quiz/engine.ts)
2. Write unit tests proving state transitions work
3. Wire to React components
4. Update DEVLOG Sprint 3 with refactor rationale

## Files Changed Today
- src/quiz/engine.ts (new, partial)
- src/components/QuizView.tsx (refactoring in progress)
```

**Why this is good:**
- Points to other docs without duplicating them
- Captures the refactoring discussion (not in docs yet)
- Shows what was tried (ephemeral context)
- Flags the decision that needs making
- Specific next steps
- Warns about known issue

---

## Remember

**Handover is about the conversation, not just the state.**

Capture what a new AI needs to pick up the discussion where you left off, not just know what's been done.

If incoming AI has to ask "why did we choose X?" or "what have we tried?", the handover failed.

---

**Continuous improvement:** Incoming AIs should provide feedback if handover was inadequate. This guide evolves based on what actually works.
