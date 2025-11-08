# SIDEQUEST: Formalizing AI-Human Collaboration Stack

**Status**: PAUSED - Resume after context refresh
**Priority**: High - Will improve all future projects

---

## Context

This sidequest emerged during Sprint 1 of the Quazy Quizzer project. The user (a hobbyist developer working primarily with AI coding agents) wants to formalize their collaboration workflow into a reusable, best-practice system.

## The Problem

Current workflow is ad-hoc and evolving:
- Ideas start as "wouldn't it be cool if..."
- Refined through conversation with ChatGPT/Claude
- Specs are written
- Coding agents implement
- But no standardized process or templates

**Pain Points:**
1. Context window exhaustion requires frequent handovers
2. Important concepts/decisions can get lost
3. No standardized onboarding for new AI agent sessions
4. Testing requirements not standardized across projects
5. No template for specs that work optimally with AI agents

## Current Collaboration Stack Components

The user has identified these key elements:

1. **Spec Document** - Technical specification defining what to build
2. **DEVLOG** - Sprint-by-sprint implementation log
3. **Sprint Structure** - Discrete, testable increments
4. **Handover Specs** - Context reset documents for new sessions
5. **AI Agent Onboarding** - Instructions for how AI should work with the user

## The Goal

Create a formalized, reusable collaboration framework that:

1. **Standardizes specs** for AI-human projects
2. **Defines testing requirements** upfront
3. **Provides templates** for common document types
4. **Establishes handover protocols** for context management
5. **Creates onboarding guides** for AI agents
6. **Documents best practices** that work with AI limitations/strengths

## Proposed Deliverables

### 1. `.claude/` Folder Structure Template
```
.claude/
  ├── project-context.md          # High-level project overview
  ├── onboarding.md                # How AI agents should work with user
  ├── handover-template.md         # Template for context resets
  ├── current-handover.md          # Active handover doc (updated regularly)
  └── commands/                    # Custom slash commands (optional)
```

### 2. Project Spec Template
A reusable template that includes:
- Project overview
- Tech stack requirements
- Testing strategy (Vitest + @testing-library/react + supertest)
- Sprint structure
- Module boundaries
- AI agent constraints

### 3. Handover Document Standard
Clear format for:
- What's been completed
- Current state/decisions
- Active concerns/blockers
- Next steps
- Key context that must be preserved

### 4. AI Onboarding Document
Instructions for:
- User's coding level (hobbyist, non-coder)
- Preferred communication style
- How to handle ambiguity
- Testing expectations
- Documentation requirements
- Sprint workflow

### 5. Testing Standards Document
Standardized testing requirements:
- Framework choices by stack type
- Coverage targets
- Test-per-sprint requirements
- When to use unit vs integration vs e2e tests

## Work Breakdown

**Phase 1: Document Current State**
- Extract patterns from this Quazy Quizzer project
- Document what's working well
- Identify gaps

**Phase 2: Create Templates**
- Project spec template
- Handover document template
- Onboarding template
- DEVLOG template

**Phase 3: Write Best Practices Guide**
- AI-human collaboration patterns
- Context management strategies
- Testing workflows
- Sprint planning

**Phase 4: Create Example Project**
- Use templates on a small example project
- Validate and refine
- Document lessons learned

## Why This Matters

**For the User:**
- Faster project starts (templates ready)
- Less context lost between sessions
- Better outcomes from AI agents
- Reusable across all future projects

**For AI Agents:**
- Clear expectations and constraints
- Better context preservation
- Standardized handover process
- Consistent testing requirements

## Current Questions to Answer

1. What belongs in `.claude/` vs root-level docs?
2. How often should handover docs be updated?
3. Should testing requirements be in spec or separate?
4. What's the minimal viable onboarding doc?
5. How to balance flexibility vs standardization?

## Next Steps (After Context Refresh)

1. Review this document
2. Discuss and refine scope
3. Start with Phase 1: Document current patterns
4. Create initial templates
5. Test on a small project

## Meta Notes

This sidequest is itself an example of the workflow:
- Started with "wouldn't it be cool if..."
- Led to discussion about testing frameworks
- Revealed need for standardization
- Now formalizing into actionable project

This pattern should be captured in the final deliverables.

---

**Resume Point**: Read this document, discuss scope, then start Phase 1.
