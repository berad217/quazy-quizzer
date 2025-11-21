# Quazy Quizzer

A modular, file-driven quiz system for local use. Built for kids to practice with custom quiz content.

## Project Status

Currently implementing according to sprint-based workflow. See [DEVLOG.md](./DEVLOG.md) for progress.

**Current Sprint**: Sprint 3 - Session Engine ✓

## Quick Start

### Prerequisites
- Node.js (v18 or higher)

### Installation & Running

```bash
# Install dependencies
npm install

# Run development server (starts both backend and frontend)
npm run dev
```

The app will open at `http://localhost:3000`

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Open visual test UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

**Test Coverage**: 134 tests across config, schema validation, quiz loading, session engine, server API, and UI components.

## Project Structure

```
/config           - Application configuration
/quizzes          - Quiz content files (JSON)
/users            - User profiles and progress data
/server           - Express backend
/src              - React frontend source
  /config         - Config types and loader
  /quiz-engine    - Quiz schema, validation, and engine logic
  /ui             - UI components (Sprint 4+)
  /storage        - Data persistence (Sprint 5+)
```

## Development Workflow

This project follows a structured sprint-based development process:

1. **Sprint 1**: Skeleton & Config ✓
2. **Sprint 2**: Quiz Schema & Loader ✓
3. **Sprint 3**: Session Engine ✓
4. **Sprint 4**: Basic UI
5. **Sprint 5**: User Profiles & Persistence
6. **Sprint 6**: Polish & Extensibility

See [DEVLOG.md](./DEVLOG.md) for detailed notes on each sprint.

## Documentation

- [Specification](./local_quiz_engine_spec_with_workflow.md) - Full technical specification
- [DEVLOG.md](./DEVLOG.md) - Implementation log with decisions and notes

## Future: Distribution

In Sprint 6, we'll package this with Electron to create a standalone desktop app that doesn't require Node.js installation.
