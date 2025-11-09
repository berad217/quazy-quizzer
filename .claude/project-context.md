# Project Context: Quazy Quizzer

**Type**: Local quiz application for kids (ages 6-8)
**Tech Stack**: React + TypeScript + Vite + Express + Node
**Testing**: Vitest + @testing-library/react + supertest
**Development Model**: Sprint-based with DEVLOG

## Current Status

**Sprint**: Sprint 1 Complete ✓
**Branch**: `claude/initial-repo-setup-011CUuCmepjg9QWn7rawXtwt`
**Last Commit**: Testing infrastructure added

## Key Decisions Made

1. **Build Tool**: Vite (fast, modern)
2. **Module System**: ES modules throughout
3. **Config Strategy**: Server-side file loading, API for client
4. **Testing**: Vitest chosen for Vite integration
5. **Future Distribution**: Electron (Sprint 6)

## Sprint Progress

- [x] Sprint 1: Skeleton & Config
  - Project structure created
  - Config loader with deep merge
  - Express server with API
  - React frontend
  - 32 tests passing

- [ ] Sprint 2: Quiz Schema & Loader (NEXT)
- [ ] Sprint 3: Session Engine
- [ ] Sprint 4: Basic UI
- [ ] Sprint 5: User Profiles & Persistence
- [ ] Sprint 6: Polish & Extensibility

## Important Context

- **User's kids**: Ages 6 and 8 - will be end users
- **Distribution goal**: Standalone .exe/.app (no Node install needed)
- **Spec philosophy**: Avoid "raccoon with epoxy" - clean module boundaries
- **User's coding level**: Hobbyist, delegates implementation to AI

## Active Sidequest

Currently paused to work on formalizing AI-human collaboration workflow.
See: `.claude/sidequest-collaboration-stack.md`

## Files to Read for Onboarding

1. `local_quiz_engine_spec_with_workflow.md` - Full spec
2. `DEVLOG.md` - Implementation decisions and progress
3. `README.md` - Quick start guide
4. `.claude/sidequest-collaboration-stack.md` - Active sidequest

## Next Session Should

1. Check if resuming sidequest or continuing main project
2. Read DEVLOG.md for latest sprint status
3. Run `npm test` to verify all tests still pass
4. Ask user which direction to proceed
