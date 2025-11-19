Onboarding - Local Quiz Engine
Welcome! You're here to help build a modular, file-driven quiz system that loads quiz sets from JSON files, randomizes questions, tracks user progress, and supports multiple question types.
Project type: Learning tool / Personal utility
Human's level: Experienced (medical → electrical engineering → software background)
Current phase: Specification complete, ready for implementation

Getting Oriented
Look for these documents (locations may vary):
Spec/Specification:

Common locations: local_quiz_engine_spec_with_workflow.md, spec.md, SPEC.md, ./docs/spec.md
What it contains: Complete technical specification - architecture, data schemas, quiz file format, user profiles, session management
Note: Current spec is v0.2, predates standardized workflow (being updated to match template)

DEVLOG:

Common locations: DEVLOG.md, ./docs/devlog.md
What it contains: Sprint-by-sprint record of what was built and why
If it doesn't exist yet: You'll create it in Sprint 1 (see section below)

Handover:

Common locations: documentation/handover-guide.md, handover.md, ./docs/handover.md
What it contains: Current conversation context, where we are NOW
Note: User might have given you the handover directly in their message
If none exists: That's OK, start from spec

Global Preferences:

Location: documentation/global-preferences.md
What it contains: How this human communicates and works
Read this first before continuing here


About This Human
See documentation/global-preferences.md for detailed communication style.
Quick summary for this project:

Direct feedback preferred - "That won't work because X" beats hedging
Skip pleasantries - Get to the point
Intellectual honesty valued - Tell them if something is a bad idea
Struggles with mission creep - Help keep scope tight with clear "done" criteria
Learns by building - Prefers modular design that can be extended later

For this project specifically:

This is a learning/personal tool (for their kids likely)
Emphasis on modular architecture ("avoid coupling like a raccoon with epoxy")
Clean separation between engine, storage, and UI
Build it so components can be replaced/extended later


How We Work
Sprint-based development:

Implement a feature from the spec
Write tests immediately after implementation
Update DEVLOG with decisions, rationale, and concerns
Commit together (code + tests + docs in one commit)
One sprint at a time - complete current work before starting next

Testing approach:

Framework: Vitest (if using Vite) or Jest (if using webpack/older setup)
Additional: @testing-library for component tests, supertest for API tests if backend
Write tests for: Business logic 90-100%, APIs 100%, UI components 70-80%
Tests must pass before moving on
User may run tests, but you should verify they work

Tech stack (finalized in Sprint 1):

Runtime: Web app with local server (Node/Express)
Frontend: React + TypeScript + Vite
Data: File-based (JSON for quizzes, config, user profiles)
Testing: Vitest + @testing-library/react
Core principle: Clean module boundaries, no tight coupling

Documentation:

Update DEVLOG every sprint (while decisions are fresh)
Keep README current with setup instructions
Write handovers when context needs reset (see Handover section below)

Communication:

If ambiguous: Make reasonable choice, document in DEVLOG, explain briefly
If blocking decision: Propose 2-3 options with tradeoffs, ask user
Tone: Explain architectural choices clearly, this human wants to understand why
Be honest about concerns/risks - user values truth over politeness


If You're the First Agent (Sprint 1)
If documents don't exist yet, you'll create them in Sprint 1:
DEVLOG.md template:
markdown# Development Log - Local Quiz Engine

## Sprint 1 - Project Setup & Configuration

**Summary:**
- [What you built - project structure, config system, etc.]

**Decisions:**
- **Tech Stack**: Chose [framework] because [rationale]. Tradeoffs: [what was sacrificed]
- **Build System**: Using [Vite/webpack/etc.] because [reason]
- **Testing Framework**: [Vitest/Jest] because [reason]

**Testing:**
- Created test infrastructure
- [X] tests passing
- Commands: `npm test`, `npm run test:watch`

**Concerns/Risks:**
- [Honest assessment of potential issues]

**Next Sprint:**
- Sprint 2: Quiz Schema & Loader
