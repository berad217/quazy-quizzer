# Working with [User Name] - AI Agent Onboarding

**Copy this template to `.claude/onboarding.md` in each project and customize it.**

---

## User Profile

**Coding Experience**: [Professional / Intermediate / Hobbyist / Non-coder]
**Primary Role**: [Software Engineer / Student / Entrepreneur / Hobbyist / etc.]
**Collaboration Style**: [How user works with AI - e.g., "Delegates implementation, provides vision" / "Pair programming style" / etc.]
**Learning Goals**: [What user wants to learn while building]

---

## Communication Preferences

### Tone & Style

**User prefers:**
- [Conversational / Formal / Technical]
- [Explain concepts / Just implement / Mix of both]
- [Detailed explanations / Concise summaries]
- [Use emojis / No emojis]

**Technical Level:**
- [Assume expertise in: X, Y, Z]
- [Explain from basics: A, B, C]
- [User knows: frameworks/languages they're familiar with]

**Decision Making:**
- User makes: [High-level architecture / Feature decisions / etc.]
- AI makes: [Implementation details / Tech choices / etc.]
- When ambiguous: [Propose options / Make choice and document / Ask user]

---

## Workflow Expectations

### Sprint-Based Development

**This user [does / does not] work in sprints.**

[If yes:]
- Sprint size: [Small (1-2 days) / Medium (3-5 days) / Large (1 week+)]
- Sprint boundaries: [Strict - complete before moving on / Flexible - can adjust]
- Sprint planning: [User defines / AI proposes, user approves / Collaborative]

### Documentation Requirements

**Always maintain:**
- [ ] **[DEVLOG.md / docs/log.md / etc.]**: [What to document]
  - [Format: Sprint-based / Daily / Feature-based]
  - [Detail level: Brief / Comprehensive / Detailed]
  - [Tone: Honest assessment / Neutral / Positive]

- [ ] **README.md**: [What to include]
  - [Keep updated: Always / End of project / As needed]

- [ ] **[Other docs]**: [Any other documentation requirements]

### Testing Philosophy

**User's testing approach:**
- [Wants comprehensive tests / Basic tests only / No tests needed]
- [AI writes all tests / User writes tests / Collaborative]
- [Test-first / Test-after implementation / Test as-needed]
- [Coverage target: X%]

**Testing requirements:**
- Framework: [Vitest / Jest / pytest / etc.]
- Types: [Unit / Integration / E2E / All]
- When: [Every sprint / Major features only / End of project]

### Spec Adherence

**How strictly to follow specs:**
- [Follow spec exactly / Spec is guideline / Flexible]
- [Document all deviations / Only major deviations / No need to document]
- [Propose improvements / Just implement as written]

---

## How to Handle Common Situations

### When Ambiguity Exists

1. [Assess if blocking: Yes → Ask user / No → Make choice and document]
2. [Provide options with tradeoffs]
3. [Make reasonable assumption and log it]
4. [Other approach]

**Example decisions AI can make:**
- [File naming conventions]
- [Code organization patterns]
- [Minor implementation details]
- [Add your own...]

**Example decisions to ask user about:**
- [Tech stack choices]
- [Major architecture decisions]
- [Feature priorities]
- [Add your own...]

### When Things Go Wrong

**User wants:**
- [Honest assessment / Optimistic framing / Just fix it]
- [Explain what went wrong / Just show the fix]
- [Propose solutions / Implement fix immediately]

**Technical debt handling:**
- [Flag it immediately / Only if significant / Don't mention]
- [Propose refactoring / Note it for later]

### When User Asks "Can you..."

**Response approach:**
- If straightforward: [Just do it / Explain approach first / Ask for confirmation]
- If complex: [Break into sprints / Ask for more details / Propose approach]
- If off-spec: [Flag and discuss / Implement and note deviation / Ask user]

### Context Window Management

**User's approach to context resets:**
- [Proactive handovers at X% tokens / Reactive when needed / Doesn't worry about it]
- [Update `.claude/current-handover.md` [frequency]]
- [User will request handover / AI should suggest]

**Handover format:**
- [Comprehensive / Brief summary / Bullet points]
- [Technical details included / High-level only]

---

## User's Typical Workflow

[Describe the user's usual process, e.g.:]

1. **Idea Phase**: [How user develops ideas - conversations, drawings, etc.]
2. **Spec Phase**: [How specs are created - templates, conversations, etc.]
3. **Implementation Phase**: [How user works with AI during coding]
4. **Iteration Phase**: [How user reviews and requests changes]
5. **[Other phases]**: [Add as needed]

---

## What This User Values

**User prioritizes:**

✅ [Clean code / Working features / Learning opportunities]
✅ [Speed / Quality / Understanding]
✅ [Industry standards / Practical solutions / Innovation]
✅ [Comprehensive testing / Minimal tests / No tests]
✅ [Detailed docs / Minimal docs / Self-documenting code]
✅ [Add your own...]

**User dislikes:**

❌ [Over-engineering / Under-engineering]
❌ [Too much explanation / Not enough explanation]
❌ [Assumptions without documentation / Too many questions]
❌ [Add your own...]

---

## Project Structure Preferences

**User's preferences:**
- Language: [TypeScript / JavaScript / Python / etc.]
- Framework: [React / Vue / Next.js / etc. / No preference]
- Build tools: [Vite / webpack / etc. / Whatever's best]
- Code style: [Functional / OOP / Mixed]
- File organization: [Feature-based / Type-based / Flat / Nested]

**Conventions:**
- File naming: [kebab-case / camelCase / PascalCase]
- Test files: [Co-located / Separate /tests folder]
- Imports: [Absolute paths / Relative / Mixed]

---

## End Goals & Distribution

**Most projects aim for:**
- [Web deployment / Desktop app / CLI tool / Library / etc.]
- [Specific platform: Electron / Browser / Mobile / etc.]
- [Audience: Personal use / Team / Public / etc.]

**Always consider:**
- [End-user deployment in technical decisions]
- [Cross-platform compatibility]
- [Performance requirements]
- [Add your own...]

---

## When Starting a New Session

**First things to do:**

1. Read `.claude/project-context.md` for current state
2. Read `DEVLOG.md` for latest sprint progress
3. Check for active sidequests
4. [Run tests / Check build / Verify environment]
5. Ask user: "[Standard opening question]"

**Standard opening:**
- [Ask: "Continue where we left off?"]
- [State: "I see we're on Sprint N, ready to continue?"]
- [Other approach]

---

## Special Notes

[Add any user-specific quirks, preferences, or important context]

**Examples:**
- User often has ideas late at night - be patient with typos
- User is building projects for their kids - keep it family-friendly
- User is learning [specific technology] - explain that area more
- User has [specific constraints - time / resources / etc.]

---

## Remember

[Add a reminder of the key philosophy for working with this user]

**Example:**
"This user is building real projects to learn and create value. Balance teaching with productivity. They appreciate both getting things done AND understanding how/why."

---

## Customization Notes

When using this template:

1. Replace [all bracketed sections] with actual user preferences
2. Remove sections that don't apply
3. Add sections specific to this user
4. Keep it concise but complete
5. Update as you learn more about user's preferences

This document should be relatively stable (unlike handover docs which change each session).

Update only when user's preferences or workflows actually change.
