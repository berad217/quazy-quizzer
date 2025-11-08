# DEVLOG Entry Template

Copy this template for each sprint entry in your DEVLOG.md file.

---

## Sprint [N] - [Short Descriptive Title]

**Summary**
- [What was implemented - be specific and concrete]
- [Major feature completed]
- [Component/module added]
- [Infrastructure set up]

**Decisions**
- **[Decision Topic]**: Chose [Option X] over [Option Y] because [rationale]. Tradeoffs: [what was sacrificed].
- **[Another Decision]**: [Same format]
- **[Technical Choice]**: [Same format]

**File Structure Created/Modified**
```
/path
  /to
    file.ext          # Purpose
    another.ext       # Purpose
```
[Optional - include if significant structure changes]

**Testing**
Added comprehensive tests for [sprint name]:
- **Unit tests ([X] tests)**: [What modules were tested]
  - [Module name]: [Specific test scenarios]
  - [Module name]: [Specific test scenarios]
- **Integration tests ([X] tests)**: [What was tested]
  - [API/Service]: [Scenarios covered]
- **Component tests ([X] tests)**: [UI components tested]
  - [Component name]: [User interactions tested]

**Test Coverage**: [X] tests passing
- Total: [X] tests across [Y] test suites
- Coverage: [percentage]% of [business logic/all code]

**Commands**:
- `npm test` or `pytest` - Run all tests
- `npm run test:watch` - Watch mode (if applicable)

**Manual Testing** (if applicable)
[Steps to manually verify the feature works]
1. [Step]
2. [Step]
3. Expected outcome: [What should happen]

**Questions**
- [Any clarifications needed from user/spec owner]
- [Ambiguities encountered that need resolution]
- [None at this stage / None - spec was clear]

**Concerns / Risks**
- **[Concern Topic]**: [Honest assessment of potential issue]. [Impact]. [Deferred to Sprint N / Needs decision].
- **[Technical Debt]**: [What shortcuts were taken and why]. [Plan to address].
- **[Future Challenge]**: [Something that will need attention later].

[Or: "None identified at this stage"]

**Next Sprint Preview**
Sprint [N+1] will implement [brief description of what's next].

---

## Tips for Writing Good DEVLOG Entries

### Summary
- ✅ Be concrete: "Implemented config loader with deep merge logic"
- ❌ Be vague: "Worked on config stuff"

### Decisions
- ✅ Include rationale: "Chose Vitest over Jest for native Vite integration"
- ❌ Just state choice: "Using Vitest"
- Always include what alternatives were considered and why

### Questions
- ✅ Specific: "Should quiz timer pause when user switches tabs?"
- ❌ Vague: "Not sure about timers"
- Flag anything ambiguous, don't guess silently

### Concerns / Risks
- ✅ Honest: "Current path resolution won't work with Electron packaging"
- ❌ Sugarcoated: "Everything looks good!"
- User explicitly wants truth, not optimism

### Testing
- Include actual numbers: "32 tests passing"
- List what's covered, not just "added tests"
- Show test commands for future reference

---

## Example: Good DEVLOG Entry

```markdown
## Sprint 1 - Skeleton & Config

**Summary**
- Created project directory structure matching spec layout
- Initialized Node.js project with React + TypeScript + Vite
- Implemented config loader module with defaults and deep merge
- Created Express server with config API endpoint
- Built basic React frontend that loads and displays config
- Established dev workflow with concurrent server/client execution

**Decisions**
- **Build Tool**: Chose Vite over webpack for faster dev experience and simpler config
- **Module System**: Using ES modules (`"type": "module"`) for consistency between frontend and backend
- **Config Loading Strategy**: Server loads config from disk and serves via API; client fetches from API. This centralizes file I/O on the server side.
- **Testing Framework**: Vitest for unit/integration tests (integrates seamlessly with Vite), @testing-library/react for component testing

**Testing**
Added comprehensive testing setup:
- **Unit tests (16 tests)**: Config module (deep merge, theme selection, validation)
- **Integration tests (8 tests)**: API endpoints (GET /api/config, /api/health, CORS)
- **Component tests (8 tests)**: React App component (loading states, error states, theme application)

**Test Coverage**: 32 tests passing
- Total: 32 tests across 3 test suites
- All critical paths covered

**Questions**
- None at this stage; spec was clear on config requirements

**Concerns / Risks**
- **File paths in config**: Current implementation assumes paths like `./quizzes` are relative to project root. When packaged with Electron, we'll need to resolve paths differently (e.g., relative to app data folder or bundled resources). Deferred to Sprint 6.
- **Config hot-reloading**: Currently config is loaded once on server startup. For development, might want to add a reload endpoint or file watcher. Not critical for Sprint 1.

**Next Sprint Preview**
Sprint 2 will implement quiz file schema, loader, and registry system.
```

---

## Bad Example: Vague DEVLOG Entry

```markdown
## Sprint 1 - Setup

**Summary**
- Set up project
- Added some config stuff
- Got React working

**Decisions**
- Using React

**Testing**
- Tests added

**Questions**
- None

**Concerns**
- Looks good!
```

**Problems**:
- Summary too vague - "what config stuff?"
- Decisions lack rationale - "why React?"
- Testing details missing - "how many tests? what do they test?"
- No honest assessment of risks

---

Use this template for every sprint. Future you (and future AI agents) will thank you!
