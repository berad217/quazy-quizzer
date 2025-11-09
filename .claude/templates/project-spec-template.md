# [Project Name] — Specification

**Version**: 0.1
**Date**: [Date]
**Author**: [Your name]

[Brief 1-2 sentence description of what this project does]

---

## 1. High-Level Architecture

**Runtime assumptions:**

- Runs as: [web app / desktop app / CLI / mobile app / etc.]
- Platform: [Node, Python, browser, etc.]
- Framework: [React, Vue, Flask, etc. - or "framework-agnostic"]
- Data model: [file-based / database / API / etc.]

**Core components:**

1. **[Component Name]** — [Single responsibility description]
2. **[Component Name]** — [Single responsibility description]
3. **[Component Name]** — [Single responsibility description]
4. **[Component Name]** — [Single responsibility description]

All components communicate via well-defined interfaces to keep feature creep survivable.

---

## 2. Directory & File Layout

```text
/project-root
  /[folder-name]
    [file.ext]
  /[folder-name]
    [file.ext]
  /src
    /[module-name]       // [purpose]
    /[module-name]       // [purpose]
    main.js
```

[Notes about build system/framework flexibility if any]

---

## 3. Configuration / Settings

[If your project has config files, show the actual JSON/YAML structure here]

**Example: `/config/app.config.json`**

```json
{
  "key": "value",
  "nested": {
    "setting": "value"
  }
}
```

**Rules:**
- Missing keys: [what happens - use defaults? error?]
- Unknown keys: [ignore? warn? error?]
- Validation: [when and how config is validated]

---

## 4. Data Schemas

[Show the structure of your main data types with actual examples]

### 4.1 [Data Type Name]

**Example: `[filename].json`**

```json
{
  "id": "unique-id",
  "property": "value",
  "nested": {
    "key": "value"
  }
}
```

**Schema rules:**
- `id`: [requirements, uniqueness, format]
- `property`: [type, constraints, validation]
- Unknown fields: [behavior]
- Validation: [when/how data is validated]

---

## 5. Core Behaviors

### 5.1 [Feature/Behavior Name]

**Description:** [What this behavior does]

**Inputs:**
- `param1`: [type, purpose]
- `param2`: [type, purpose]

**Process:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Outputs:**
- [What is returned/changed]

**Error handling:**
- [How errors are handled]

---

## 6. Module Boundaries

To avoid coupling and enable maintainability:

1. `[module-name]/` — [Single responsibility]
2. `[module-name]/` — [Single responsibility]
3. `[module-name]/` — [Single responsibility]

**Rules:**
- Each module has a single responsibility
- Modules should be replaceable
- File I/O centralized in [specific module(s)]
- UI components should not make direct file system assumptions

---

## 7. Testing Requirements

**Framework**:
- [Framework name] for unit/integration tests
- [Framework name] for component tests (if applicable)
- [Framework name] for API tests (if applicable)

**Coverage Requirements:**
- Minimum [X]% coverage on business logic modules
- All [API endpoints / core functions / etc.] must have tests
- All [UI components / etc.] must have basic rendering tests

**Sprint Requirement:**
- Each sprint must include tests for implemented features
- All tests must pass before sprint is considered complete
- Tests should be committed alongside implementation code

**Test Types by Layer:**
1. **Business Logic**: Unit tests with full coverage
2. **API/Backend**: Integration tests for all endpoints
3. **UI**: Component tests for user interactions
4. **End-to-End**: (Optional) Critical user flows in final sprint

**Test Files:**
- Co-locate with code: `module.test.ts` next to `module.ts`
- OR separate test directory: `/tests` mirroring `/src`

---

## 8. Sprint Plan (Minimum)

Suggested baseline sequence for implementation:

### Sprint 1 — [Title]
**Goal:** [What should be working]

**Deliverables:**
- [Specific item]
- [Specific item]
- DEVLOG entry

**Testing:** [What tests are needed]

---

### Sprint 2 — [Title]
**Goal:** [What should be working]

**Deliverables:**
- [Specific item]
- [Specific item]
- DEVLOG entry

**Testing:** [What tests are needed]

---

### Sprint 3 — [Title]
[Continue pattern...]

---

[Add as many sprints as needed for your project]

---

## 9. AI Agent Constraints

When implementing this project, AI agents should:

**Do:**
- ✅ Work in discrete sprints
- ✅ Write tests for each sprint before moving on
- ✅ Update DEVLOG.md after each sprint
- ✅ Document all architectural decisions
- ✅ Flag concerns and risks honestly
- ✅ Ask for clarification when ambiguous

**Do Not:**
- ❌ Bundle unrelated features in one sprint
- ❌ Skip tests or defer them to "later"
- ❌ Silently change the schema or config format
- ❌ Hardcode data when a config/file system exists
- ❌ Make speculative features outside the spec

**When Ambiguous:**
1. Assess if it's a blocking decision
2. If blocking: Propose 2-3 options with tradeoffs
3. If not blocking: Make reasonable choice and document in DEVLOG
4. Always explain reasoning

---

## 10. DEVLOG Format

Maintain `/DEVLOG.md` at the project root.

After each sprint, append an entry:

```markdown
## Sprint N - [short title]

**Summary**
- What was implemented

**Decisions**
- List architectural or behavioral choices made
- Format: **[Topic]**: Chose X over Y because Z

**Testing**
- Test coverage details
- [X] tests passing

**Questions**
- Clarifications needed from the user/spec owner

**Concerns / Risks**
- Any way the current direction might cause trouble later
- Be honest, no sugarcoating

**Next Sprint Preview**
[What's coming next]
```

---

## 11. Extensibility Hooks

Supported future directions that **must not** require breaking changes:

- [Feature direction]: [How it would be added]
- [Feature direction]: [How it would be added]

Examples:
- Image/media support: Add `media` property to schema
- Localization: Add `text_i18n` maps
- Timers: Add `timeLimit` property

---

## 12. Out of Scope

[Explicitly list what this project does NOT do]

This helps prevent scope creep and keeps the project focused.

---

## Usage Notes

**For AI Agents:**
1. Read this spec completely before starting
2. Follow the sprint plan sequentially
3. Update DEVLOG after each sprint
4. Flag any conflicts or ambiguities

**For Humans:**
1. This spec is the contract for what gets built
2. All deviations should be documented
3. Update this spec if requirements change
4. Keep it as a living document

---

**This specification + workflow is the contract. Any agent working on this project should follow it unless explicitly instructed otherwise, and must document every deviation.**
