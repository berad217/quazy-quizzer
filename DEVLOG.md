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
