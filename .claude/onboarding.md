# Working with This User - AI Agent Onboarding

## User Profile

**Coding Experience**: Hobbyist, non-professional
**Collaboration Style**: Delegates implementation to AI, provides vision and decisions
**Learning Goals**: Understanding modern dev practices while building real projects

## Communication Preferences

**Tone & Style**:
- Conversational and educational
- Explain "why" not just "what"
- No need to oversimplify, but do explain jargon
- User appreciates learning industry standards

**Decision Making**:
- User makes high-level decisions (tech stack, features)
- AI makes implementation decisions (specific patterns, file structure)
- When ambiguous, AI should propose options with tradeoffs
- Log all significant decisions in DEVLOG

## Workflow Expectations

### Sprint-Based Development

This user works in **sprints**:
1. Implement feature
2. Write tests immediately
3. Update DEVLOG with decisions/concerns
4. Commit together
5. Only then move to next sprint

**Never bundle multiple sprints together.**

### Documentation Requirements

Always maintain:
- **DEVLOG.md**: Sprint-by-sprint implementation log
  - Summary of what was built
  - Decisions made
  - Questions/concerns
  - No sugarcoating - user "can handle the truth"

- **README.md**: User-facing quick start guide

### Testing Philosophy

- Write tests for every sprint
- User wants to delegate testing to AI
- Tests should be comprehensive but practical
- All tests must pass before sprint is complete
- Testing strategy: Vitest + @testing-library/react + supertest

### Spec Adherence

- Follow the spec closely
- Document any deviations in DEVLOG
- Propose alternatives if spec has issues
- Keep module boundaries clean (avoid "raccoon with epoxy")

## How to Handle Common Situations

### When Ambiguity Exists

1. Assess if it's a blocking decision
2. If blocking: Propose 2-3 options with tradeoffs
3. If not blocking: Make reasonable choice and document in DEVLOG
4. Always explain reasoning

### When Things Go Wrong

- Be honest about issues
- Explain what went wrong and why
- Propose fixes
- Don't hide technical debt

### When User Asks "Can you..."

- If it's straightforward: Just do it
- If it's complex: Break into sprints and explain approach
- If it's off-spec: Flag it and discuss implications

### Context Window Management

- User is aware of context limits
- Will occasionally request handover documents
- Update `.claude/current-handover.md` proactively
- Be concise but complete

## User's Typical Workflow

1. **Idea Phase**: Brainstorm with ChatGPT/Claude
2. **Spec Phase**: Formalize into technical spec
3. **Implementation Phase**: Coding agent (you) builds it
4. **Iteration Phase**: Testing, refinement, feature discussions
5. **Context Reset**: Handover docs when window fills

## What This User Values

✅ **Clean architecture** - Module boundaries, separation of concerns
✅ **Learning opportunities** - Explain new concepts and why they matter
✅ **Comprehensive testing** - Let AI handle test writing
✅ **Honest assessment** - Flag risks and technical debt
✅ **Industry standards** - Teach best practices

❌ **Over-engineering** - Keep it practical
❌ **Bundled work** - Respect sprint boundaries
❌ **Sugarcoating** - User wants real assessment
❌ **Assumptions** - Document your decisions

## Project Structure Preferences

- Use TypeScript for type safety
- Modern tooling (Vite > webpack)
- Clear folder organization matching spec
- Tests co-located with code (`*.test.ts` files)

## End Goal Context

Most projects have a distribution/deployment goal:
- This project: Electron app for kids
- Future projects: May vary
- Always consider end-user deployment in technical decisions

## When Starting a New Session

1. Read `.claude/project-context.md` for current state
2. Read `DEVLOG.md` for latest sprint progress
3. Check for active sidequests
4. Ask user: "Continue where we left off or different direction?"

## Remember

This user is building real projects to learn and create value (e.g., for their kids). Balance teaching with productivity. They appreciate both getting things done AND understanding how/why.
