# Best Practices for AI-Human Code Collaboration

**Version**: 1.0
**Purpose**: Guide successful collaboration between human project owners and AI coding agents
**Audience**: Both humans and AI agents

---

## Table of Contents

1. [The Collaboration Stack](#the-collaboration-stack)
2. [Phase 1: Idea to Spec](#phase-1-idea-to-spec)
3. [Phase 2: Implementation](#phase-2-implementation)
4. [Phase 3: Context Management](#phase-3-context-management)
5. [Phase 4: Iteration & Growth](#phase-4-iteration--growth)
6. [Common Pitfalls](#common-pitfalls)
7. [Success Metrics](#success-metrics)

---

## The Collaboration Stack

The foundation of successful AI-human collaboration:

```
┌─────────────────────────────────────────┐
│         IDEA / "Wouldn't it be cool if" │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    SPEC (Technical Specification)        │
│    - Architecture                        │
│    - Data models                         │
│    - Sprint plan                         │
│    - Testing requirements                │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    IMPLEMENTATION (Sprint-based)         │
│    - Code                                │
│    - Tests                               │
│    - DEVLOG updates                      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    ITERATION & HANDOVERS                 │
│    - Context resets                      │
│    - Feature additions                   │
│    - Refinements                         │
└─────────────────────────────────────────┘
```

---

## Phase 1: Idea to Spec

### Step 1.1: Refine the Idea

**Human's job:**
- Start with "Wouldn't it be cool if..."
- Discuss with AI (ChatGPT/Claude) to refine
- Ask questions:
  - What problem does this solve?
  - Who will use it?
  - What's the minimum viable version?
  - What are the must-haves vs nice-to-haves?

**AI's job:**
- Ask clarifying questions
- Propose similar existing solutions
- Identify technical requirements
- Surface potential challenges early

**Output**: Clear problem statement and high-level requirements

---

### Step 1.2: Choose Tech Stack

**Consider:**
- **User's familiarity**: What do they already know?
- **End goal**: Web app? Desktop? Mobile? CLI?
- **AI strengths**: AI is good with common stacks
- **Industry standards**: Use standard tools for better AI support

**Recommended stacks by goal:**

| Goal | Recommended Stack |
|------|------------------|
| Web app (modern) | React + TypeScript + Vite + Node/Express |
| Web app (simple) | HTML/CSS/JS + Python/Flask |
| Desktop app | Electron (package web app) |
| CLI tool | Node.js or Python |
| Mobile app | React Native or Flutter |

**Decision points:**
- TypeScript? (Yes for larger projects, optional for scripts)
- Testing from start? (Yes - define framework upfront)
- Database? (Start with files if possible, add DB later)

---

### Step 1.3: Write the Spec

**Use the spec template**: `.claude/templates/project-spec-template.md`

**Critical sections:**
1. **Architecture** - High-level components and their roles
2. **Directory Layout** - Show the actual file tree
3. **Data Schemas** - JSON examples, not just descriptions
4. **Module Boundaries** - Prevent spaghetti code
5. **Testing Requirements** - Framework and strategy defined upfront
6. **Sprint Plan** - Break into discrete, testable increments
7. **AI Constraints** - Rules for implementation

**Spec quality checklist:**
- [ ] Clear enough that someone else could implement it
- [ ] Concrete examples (JSON schemas, file paths)
- [ ] Sprint plan defines ALL work, not just first sprint
- [ ] Testing strategy included
- [ ] Module boundaries explicitly defined
- [ ] "Do not" rules listed (prevent known pitfalls)

**Time investment**: 1-3 hours for small project, 1-2 days for large

**Key insight**: Time spent on spec saves 10x time during implementation!

---

## Phase 2: Implementation

### Step 2.1: Set Up the Project

**First sprint should always be:**
- Project skeleton
- Basic configuration
- Development workflow (commands to run)
- Testing infrastructure
- Initial documentation (README, DEVLOG)

**Deliverables:**
- `npm test` or `pytest` works
- `npm run dev` or equivalent starts the app
- README explains how to run it
- DEVLOG has Sprint 1 entry
- All committed to git

---

### Step 2.2: Sprint Workflow

**For each sprint:**

```
┌────────────────────────────────────────┐
│ 1. Implement feature                   │
│    - Follow spec                       │
│    - Respect module boundaries         │
│    - Handle errors                     │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 2. Write tests IMMEDIATELY             │
│    - Unit tests for logic              │
│    - Integration tests for APIs        │
│    - Component tests for UI            │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 3. Update DEVLOG                       │
│    - What was built                    │
│    - Decisions made (with rationale)   │
│    - Concerns/risks                    │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 4. Commit together                     │
│    - Code + tests + docs in one commit│
│    - Clear commit message              │
│    - Push to remote                    │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ 5. STOP - Sprint complete              │
│    - Don't start next sprint yet       │
│    - Review what was learned           │
│    - User can test/verify              │
└────────────────────────────────────────┘
```

**Key rules:**
- ✅ One sprint at a time
- ✅ Tests BEFORE moving on
- ✅ DEVLOG updated while fresh
- ✅ Honest risk assessment
- ❌ No "just one more feature"
- ❌ No "I'll add tests later"
- ❌ No bundling multiple sprints

---

### Step 2.3: Testing Strategy

**Test as you go:**

```python
# Every new function/component:
1. Write implementation
2. Write test IMMEDIATELY
3. Run test to verify
4. Commit together
```

**Test coverage by layer:**
- Business logic: 90-100% (easy to test, critical)
- APIs: 100% (must work correctly)
- UI components: 70-80% (cover main paths)
- Integration: Critical flows only

**Use the right test type:**
- **Unit**: Pure functions, utilities, business logic
- **Integration**: API endpoints, database operations
- **Component**: React/Vue components
- **E2E**: Final sprint, critical user flows only

**See**: `.claude/templates/testing-standards.md` for details

---

### Step 2.4: Documentation as You Go

**Three living documents:**

**1. DEVLOG.md** (Sprint journal)
- Updated EVERY sprint
- Records decisions and rationale
- Captures concerns honestly
- Template: `.claude/templates/devlog-entry-template.md`

**2. README.md** (User guide)
- How to install
- How to run
- How to test
- Update when user-facing changes

**3. .claude/current-handover.md** (Session state)
- Update at 70-75% context window
- Or before long break
- Or after major milestone

**Don't:**
- ❌ Wait until end to document
- ❌ Keep decisions in your head
- ❌ Assume you'll remember why

---

## Phase 3: Context Management

### The Context Window Problem

**AI agents have limited "memory" (context window):**
- Claude Code: ~200k tokens
- Conversation uses tokens
- Code uses tokens
- At limit: Information gets compressed/lost

**Strategy: Proactive handovers**

---

### Step 3.1: Monitor Token Usage

**When to prepare handover:**
- 70-75% token usage (Claude Code shows this)
- Before long break (overnight, weekend)
- After completing major milestone
- When feeling context getting "fuzzy"

**Don't:**
- ❌ Wait for autocompaction (loses nuance)
- ❌ Let AI hit 100% tokens
- ❌ Assume AI will remember everything

---

### Step 3.2: Create Handover Document

**Update `.claude/current-handover.md` with:**
- What was accomplished this session
- Current state (which sprint, what's done)
- All decisions made (with rationale)
- Open questions and blockers
- Technical context (architecture, patterns)
- Exact next steps

**Template**: `.claude/handover-template.md`

**Quality test**: Could a brand new AI agent continue from this document alone?

---

### Step 3.3: Context Reset

**Process:**
1. Human starts new chat/session
2. New AI reads:
   - `.claude/project-context.md` (project overview)
   - `.claude/onboarding.md` (how to work with user)
   - `.claude/current-handover.md` (detailed state)
   - `DEVLOG.md` (all sprint notes)
3. AI confirms understanding
4. Work continues seamlessly

**Time cost**: ~10 minutes for AI to read and catch up

**Benefits:**
- Fresh context window
- No lost information
- Consistent quality
- Can switch AI models if needed

---

## Phase 4: Iteration & Growth

### Adding Features Post-MVP

**Process:**
1. Discuss new feature with AI
2. Add sprint to DEVLOG (plan phase)
3. Implement following same sprint workflow
4. Update spec if architecture changes

**Don't:**
- ❌ Just start coding new features
- ❌ Skip the planning discussion
- ❌ Break existing module boundaries

---

### Refactoring

**When to refactor:**
- When "epoxy" coupling appears
- When tests become hard to write
- When adding features gets harder
- When DEVLOG concerns accumulate

**How to refactor:**
1. Write tests for existing behavior FIRST
2. Refactor code
3. Tests should still pass
4. Document what changed in DEVLOG

**Refactoring IS a sprint:**
- Has clear goal
- Has tests
- Gets DEVLOG entry
- Gets committed

---

### Scaling Up

**When project grows:**
- Consider splitting into packages/modules
- Add integration tests between modules
- Document inter-module contracts
- Update spec with new architecture

**Signs you need better structure:**
- Files getting very long (>500 lines)
- Changing one thing breaks another
- Hard to find where to add features
- Tests becoming slow

---

## Common Pitfalls

### Pitfall 1: Vague Specs

**Problem**: "Build a quiz app"

**Better**:
- Show exact JSON structure of quiz files
- List all question types supported
- Define file paths
- Show example UI mockup

**Key**: Concrete examples > descriptions

---

### Pitfall 2: Bundled Sprints

**Problem**: "Let me add search, sorting, and filters while I'm here"

**Better**:
- Sprint N: Add search
- Sprint N+1: Add sorting
- Sprint N+2: Add filters

**Key**: One thing at a time, fully complete

---

### Pitfall 3: Testing Later

**Problem**: "I'll add tests after I get it working"

**Reality**: Tests never get written, or are superficial

**Better**:
- Write tests immediately after implementation
- Tests are part of "done"
- No sprint complete without tests

**Key**: Tests ARE part of implementation

---

### Pitfall 4: Undocumented Decisions

**Problem**: AI makes choice, doesn't record it

**Impact**: Future you/AI doesn't know why, refactors poorly

**Better**:
- Every significant decision in DEVLOG
- Include rationale and alternatives
- Record tradeoffs made

**Key**: Document the "why", not just the "what"

---

### Pitfall 5: Ignored Warnings

**Problem**: DEVLOG says "concern: X might break with Y", then Y happens

**Better**:
- Review concerns before related work
- Address or explicitly defer
- Update concerns as learned more

**Key**: Concerns are action items, not just notes

---

### Pitfall 6: Autocompaction Reliance

**Problem**: Let context window auto-compress

**Impact**: Nuance lost, quality degrades

**Better**:
- Proactive handover at 70-75%
- Manual control over what's preserved
- Fresh start with full context

**Key**: YOU control context, not auto-compression

---

## Success Metrics

### For a Sprint

**Sprint is successful when:**
- ✅ All features from plan implemented
- ✅ All tests passing
- ✅ DEVLOG entry complete and honest
- ✅ Code committed and pushed
- ✅ Could demo to someone
- ✅ No known bugs

**Metrics:**
- Test count: [X] new tests, all passing
- Coverage: Maintained or improved
- Commits: 1-2 clear commits
- DEVLOG: Updated with rationale

---

### For a Project

**Project is successful when:**
- ✅ User can actually use it
- ✅ Solves the original problem
- ✅ All sprints complete
- ✅ Tests cover critical paths
- ✅ Documentation exists
- ✅ Known limitations documented
- ✅ User learned something

**Metrics:**
- Feature completion: All must-haves done
- Quality: Tests passing, bugs minimal
- Usability: README clear, works as documented
- Maintainability: Can add features easily

---

### For the Collaboration

**Collaboration is successful when:**
- ✅ Human trusts AI's work
- ✅ AI understands user's preferences
- ✅ Communication is efficient
- ✅ Handovers work smoothly
- ✅ Both parties learning

**Continuous improvement:**
- Update onboarding.md as learn preferences
- Refine templates based on experience
- Capture lessons learned in DEVLOG

---

## Quick Reference

### Starting New Project

1. Use `project-spec-template.md`
2. Define testing requirements upfront
3. Plan sprints before coding
4. Set up `.claude/` folder structure

### During Implementation

1. One sprint at a time
2. Tests immediately after code
3. Update DEVLOG while fresh
4. Commit code + tests together
5. Use sprint checklist

### Context Management

1. Monitor token usage
2. Prepare handover at 70-75%
3. Update current-handover.md
4. New session reads .claude/ docs

### When Stuck

1. Review DEVLOG concerns
2. Re-read relevant spec section
3. Check if sprint too big (split it)
4. Ask user for clarification

---

## Templates Quick Links

All templates in `.claude/templates/`:

- `project-spec-template.md` - For starting new projects
- `testing-standards.md` - Testing approach reference
- `devlog-entry-template.md` - For each sprint
- `sprint-checklist.md` - Before marking sprint complete
- `ai-onboarding-template.md` - Customize per user
- `handover-template.md` - For context resets
- `best-practices-ai-human-collab.md` - This document

---

## Final Thoughts

**For Humans:**
- Good specs save 10x time later
- Trust but verify (run tests yourself sometimes)
- Honest feedback helps AI improve
- Templates are starting points, customize them

**For AI Agents:**
- Follow the spec but flag issues
- Test as you go, not later
- Document decisions while fresh
- Be honest about concerns
- User can handle the truth

**For Both:**
- This is a partnership
- Communication is key
- Iterate and improve the process
- Learn from each project

---

**Version History:**
- 1.0 (2025-11-08): Initial version based on Quazy Quizzer project patterns

**Contributing:**
Update this document as you discover new patterns or better approaches. The collaboration stack should evolve based on real experience.
