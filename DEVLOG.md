# Development Log

This log tracks the implementation of the Local Quiz Engine following the sprint-based workflow defined in the specification.

---

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
- **Deep Merge Implementation**: Config loader merges loaded config with defaults recursively, preserving unknown keys (per spec: "ignore, do not crash")
- **Validation Approach**: Non-blocking warnings for config issues rather than failing; always falls back to defaults
- **Testing Framework**: Vitest for unit/integration tests (integrates seamlessly with Vite), @testing-library/react for component testing
- **Server Architecture**: Refactored Express app creation into separate `createApp()` function (server/app.ts) to enable testing without starting the server

**File Structure Created**
```
/project-root
  /config
    app.config.json          # Application configuration
  /public
    index.html               # HTML entry point
  /server
    index.ts                 # Express server
    configService.ts         # Config file loading
  /src
    /config
      types.ts               # TypeScript interfaces
      defaults.ts            # Default config values
      configLoader.ts        # Merge and validation logic
      index.ts              # Module exports
    App.tsx                  # Root React component
    main.tsx                 # React entry point
  vite.config.ts            # Vite configuration
  tsconfig.json             # TypeScript config
  package.json              # Dependencies and scripts
```

**Testing Infrastructure**
Added comprehensive testing setup with Vitest:
- **Framework**: Vitest (chosen for native Vite integration and speed)
- **React Testing**: @testing-library/react + happy-dom for DOM simulation
- **API Testing**: supertest for Express endpoint testing
- **Test Coverage**: 32 tests across 3 test suites
  - Config module unit tests (16 tests): Deep merge, theme selection, validation
  - Server integration tests (8 tests): API endpoints, CORS, error handling
  - React component tests (8 tests): Loading states, error states, theme application

Test commands:
- `npm test` - Run all tests once
- `npm run test:watch` - Watch mode for development
- `npm run test:ui` - Visual test UI
- `npm run test:coverage` - Generate coverage report

**Manual Testing**
Run `npm run dev` to start both server (port 3001) and client (port 3000). The app should:
1. Load config from `/config/app.config.json`
2. Display app name and theme
3. Show loaded configuration details

**Questions**
- None at this stage; spec was clear on config requirements

**Concerns / Risks**
- **File paths in config**: Current implementation assumes paths like `./quizzes` are relative to project root. When packaged with Electron, we'll need to resolve paths differently (e.g., relative to app data folder or bundled resources).
- **Config hot-reloading**: Currently config is loaded once on server startup. For development, might want to add a reload endpoint or file watcher. Not critical for Sprint 1.
- **Type safety on config API**: Client fetches config as JSON; TypeScript types are trusted but not validated at runtime. Consider adding runtime validation (e.g., Zod) if user-edited configs cause issues.

**Next Sprint Preview**
Sprint 2 will implement quiz file schema, loader, and registry system.

---

## Sprint 2 - Quiz Schema & Loader

**Summary**
- Defined TypeScript types for all quiz question types and quiz sets
- Implemented comprehensive quiz validation logic
- Created quiz discovery and loading service
- Built quiz registry system with byId and tag-based lookups
- Added quiz API endpoints to Express server
- Created sample quiz files demonstrating all question types
- Wrote 47 new tests (79 total passing)

**Decisions**
- **Module Organization**: Placed quiz schema and validators in `/src/quiz-engine/` (shared types) and quiz loading service in `/server/` (filesystem access). This follows clean separation between business logic and I/O operations.
- **Validation Strategy**: Non-blocking validation that logs warnings and skips invalid questions/quizzes rather than crashing. Invalid quiz files are logged but don't prevent other quizzes from loading.
- **Question Type Support**: Implemented all 5 question types from spec:
  - `multiple_choice_single`: single correct answer from choices
  - `multiple_choice_multi`: multiple correct answers from choices
  - `true_false`: boolean answer
  - `fill_in_blank`: text answer with acceptable variations and normalization
  - `short_answer`: free text with optional reference answer
- **Registry Structure**: Two-way lookup (byId object and all array) for O(1) ID lookup and easy iteration. Added helper function for tag-based filtering.
- **API Design**: RESTful endpoints:
  - `GET /api/quizzes` - list all quizzes
  - `GET /api/quizzes/:id` - get specific quiz
- **Error Handling**: Graceful handling of missing quiz folder (creates it), invalid JSON, schema violations, and duplicate IDs.

**File Structure Created**
```
/src
  /quiz-engine
    schema.ts                  # TypeScript types and interfaces
    validator.ts               # Quiz validation logic
    validator.test.ts          # Validator tests (22 tests)
/server
  quizService.ts              # Quiz loading and registry
  quizService.test.ts         # Quiz service tests (20 tests)
  app.ts                      # Updated with quiz endpoints
  app.test.ts                 # Updated with quiz endpoint tests (13 tests)
/quizzes
  sample_basics.v1.json       # Sample quiz with all question types
  programming_basics.v1.json  # Sample programming quiz
```

**Testing**
- Added 47 new tests across 3 test files
- Total: 79 tests passing (up from 32)
- Coverage:
  - Validator: comprehensive tests for all question types and edge cases
  - Quiz Service: file loading, registry building, error handling
  - API endpoints: quiz listing and retrieval
- All tests passing on first run

**Manual Testing**
Run `npm run dev` and verify:
1. Server logs show quizzes being loaded on startup
2. `GET /api/quizzes` returns array of loaded quizzes
3. `GET /api/quizzes/sample_basics_v1` returns specific quiz data
4. Invalid quiz files are logged but don't crash the server

**Questions**
None - spec was clear about validation rules and question types.

**Concerns / Risks**
- **Duplicate Question IDs Across Quizzes**: Current validation only checks for duplicate question IDs within a single quiz file. When we build sessions that combine questions from multiple quizzes (Sprint 3), we'll need composite keys like `quizId::questionId` to avoid collisions. This is noted in the spec (section 6.2) and we'll handle it in the session engine.
- **Text Answer Normalization**: The `fill_in_blank` type supports normalization hints (`{ value: "answer", normalize: true }`), but we haven't implemented the actual normalization logic yet. This will be needed in Sprint 3 when we implement grading. Decision needed: what normalizations to support (lowercase, trim, remove articles, etc.)?
- **Short Answer Grading**: The `short_answer` type has an optional `correct` field, but the spec notes it "can be manually or fuzzily graded." We'll need to clarify grading strategy in Sprint 3. Options: exact match, fuzzy match (Levenshtein distance?), or manual grading only?
- **Quiz File Watching**: Currently quizzes are loaded once on server startup. For development, a file watcher or reload endpoint would be useful. Not critical for MVP but noted for Sprint 6 polish phase.
- **Large Quiz Sets**: Current implementation loads all quiz data into memory. This is fine for personal use (dozens of quizzes), but won't scale to thousands. If needed later, could implement lazy loading or pagination.

**Next Sprint Preview**
Sprint 3 will implement the session engine: session creation, question randomization, answer storage, and grading logic.

---
