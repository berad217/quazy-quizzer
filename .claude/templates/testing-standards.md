# Testing Standards for AI-Human Collaboration Projects

**Version**: 1.0
**Purpose**: Standardize testing approach across all AI-implemented projects
**Audience**: AI coding agents and human project owners

---

## Core Philosophy

**Testing is not optional.** For projects implemented by AI agents:

1. **Tests prove the AI got it right** - Human can verify without deep code review
2. **Tests document behavior** - Show how the code is supposed to work
3. **Tests enable confidence** - Safe to iterate and refactor
4. **Tests catch regressions** - Future changes don't break existing features

**Rule**: Every sprint must include tests. No sprint is "complete" without passing tests.

---

## Testing Framework by Tech Stack

### JavaScript/TypeScript + React/Vue

**Recommended Stack:**
- **Vitest** (if using Vite) - Fast, modern, great DX
- **Jest** (if using webpack or older setup) - Mature, huge ecosystem
- **@testing-library/react** or **@testing-library/vue** - Component testing
- **happy-dom** or **jsdom** - DOM simulation
- **supertest** - API endpoint testing (if backend exists)

**Commands to add to `package.json`:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Install:**
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom happy-dom
```

---

### JavaScript/TypeScript + Node/Express (Backend)

**Recommended Stack:**
- **Vitest** or **Jest** - Test runner
- **supertest** - HTTP integration testing
- **@types/supertest** - TypeScript support

**Install:**
```bash
npm install --save-dev vitest supertest @types/supertest
```

**Pattern:** Separate app creation from server startup
```typescript
// server/app.ts - Testable
export function createApp(config) {
  const app = express();
  // ... setup routes
  return app;
}

// server/index.ts - Entry point
const app = createApp(config);
app.listen(PORT);

// server/app.test.ts - Tests
import { createApp } from './app';
const app = createApp(testConfig);
request(app).get('/api/health')...
```

---

### Python + Flask/Django

**Recommended Stack:**
- **pytest** - Test framework
- **pytest-flask** or **pytest-django** - Framework integration
- **requests-mock** or **responses** - HTTP mocking

**Install:**
```bash
pip install pytest pytest-flask pytest-cov
```

**Commands:**
```bash
pytest                    # Run all tests
pytest --cov=src         # With coverage
pytest -v                # Verbose
pytest --watch           # Watch mode
```

---

### Python CLI/Scripts

**Recommended Stack:**
- **pytest** - Test framework
- **unittest.mock** - Mocking (built-in)

**Pattern:** Separate logic from CLI interface
```python
# logic.py - Testable business logic
def process_data(input):
    return transformed_output

# cli.py - CLI interface
import click
@click.command()
def main():
    result = process_data(input)

# test_logic.py - Tests
from logic import process_data
def test_process_data():
    assert process_data(input) == expected
```

---

## Test Types & When to Use

### 1. Unit Tests

**What:** Test individual functions/classes in isolation

**When:**
- Business logic functions
- Utility functions
- Data transformations
- Validation logic
- Calculation functions

**Example:**
```typescript
// configLoader.test.ts
describe('mergeConfigWithDefaults', () => {
  it('should merge partial config with defaults', () => {
    const result = mergeConfigWithDefaults({ appName: 'Test' });
    expect(result.appName).toBe('Test');
    expect(result.defaultTheme).toBe(DEFAULT_CONFIG.defaultTheme);
  });
});
```

**Coverage Target:** 90-100% for business logic

---

### 2. Integration Tests

**What:** Test multiple components working together

**When:**
- API endpoints
- Database operations
- File I/O operations
- Module interactions

**Example:**
```typescript
// server/app.test.ts
describe('GET /api/config', () => {
  it('should return config as JSON', async () => {
    const response = await request(app).get('/api/config');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('appName');
  });
});
```

**Coverage Target:** All public APIs/endpoints tested

---

### 3. Component Tests (UI)

**What:** Test React/Vue components render correctly

**When:**
- All user-facing components
- User interactions
- State changes
- Conditional rendering

**Example:**
```typescript
// App.test.tsx
describe('App Component', () => {
  it('should display config when loaded', async () => {
    mockFetch.mockResolvedValue({ json: () => mockConfig });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Quiz Hub')).toBeInTheDocument();
    });
  });
});
```

**Coverage Target:** All components have basic rendering test, critical paths tested

---

### 4. End-to-End Tests (E2E)

**What:** Test complete user flows in real browser

**When:**
- Final polish sprint
- Critical user journeys
- Cross-browser compatibility needed

**Tools:**
- **Playwright** (recommended, modern)
- **Cypress** (popular, good DX)

**Example:**
```typescript
test('user can complete quiz', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('[data-testid="start-quiz"]');
  await page.click('[data-testid="answer-1"]');
  await expect(page.locator('[data-testid="score"]')).toContainText('1/10');
});
```

**Coverage Target:** Main user flows only (E2E is slow/expensive)

---

## Coverage Targets by Project Layer

| Layer | Target | Rationale |
|-------|--------|-----------|
| Business Logic (pure functions) | 90-100% | Core value, easy to test |
| API Endpoints | 100% | Critical integration points |
| UI Components | 70-80% | Cover main paths, not every edge case |
| Utility Functions | 90-100% | Used everywhere, must be reliable |
| Config/Setup | 80%+ | Important but sometimes hard to test |

**Don't chase 100% on everything** - Diminishing returns on trivial code.

---

## Sprint Testing Requirements

### Each Sprint Must Include:

- [ ] Tests for all new business logic (unit tests)
- [ ] Tests for all new API endpoints (integration tests)
- [ ] Tests for all new UI components (component tests)
- [ ] All tests passing before sprint marked complete
- [ ] Test coverage documented in DEVLOG

### Test File Organization:

**Option A: Co-located (Recommended)**
```
src/
  config/
    configLoader.ts
    configLoader.test.ts    # Tests next to implementation
  components/
    QuizCard.tsx
    QuizCard.test.tsx
```

**Option B: Separate `/tests` directory**
```
src/
  config/
    configLoader.ts
tests/
  config/
    configLoader.test.ts    # Mirrors src structure
```

Choose one approach and stick with it.

---

## Test Naming Conventions

### File Names:
- `*.test.ts` or `*.spec.ts` (pick one convention)
- Match the file being tested: `configLoader.test.ts` tests `configLoader.ts`

### Test Descriptions:

**Use "should" statements:**
```typescript
it('should merge partial config with defaults', () => { ... })
it('should return 404 for unknown routes', () => { ... })
it('should display error when fetch fails', () => { ... })
```

**Be specific:**
```typescript
// ❌ Vague
it('works correctly', () => { ... })

// ✅ Specific
it('should validate email format and reject invalid emails', () => { ... })
```

**Group related tests:**
```typescript
describe('configLoader', () => {
  describe('mergeConfigWithDefaults', () => {
    it('should handle empty config', () => { ... })
    it('should preserve unknown keys', () => { ... })
    it('should deep merge nested objects', () => { ... })
  });

  describe('getTheme', () => {
    it('should return default theme when not specified', () => { ... })
    it('should fall back when theme not found', () => { ... })
  });
});
```

---

## Mocking Best Practices

### When to Mock:

✅ **Mock external dependencies:**
- API calls (`fetch`, `axios`)
- File system operations
- Database calls
- External services

❌ **Don't mock internal logic:**
- Your own business logic functions
- Simple utilities
- Config objects

### Example: Mocking fetch in React

```typescript
import { vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

it('should handle API error', async () => {
  mockFetch.mockRejectedValueOnce(new Error('Network error'));
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText('Error loading config')).toBeInTheDocument();
  });
});
```

---

## Common Testing Patterns

### Pattern 1: Arrange-Act-Assert (AAA)

```typescript
it('should calculate total correctly', () => {
  // Arrange - Set up test data
  const items = [{ price: 10 }, { price: 20 }];

  // Act - Execute the code being tested
  const total = calculateTotal(items);

  // Assert - Verify the result
  expect(total).toBe(30);
});
```

### Pattern 2: Testing Async Code

```typescript
it('should load data from API', async () => {
  mockFetch.mockResolvedValueOnce({ json: async () => ({ data: 'test' }) });

  const result = await fetchData();

  expect(result.data).toBe('test');
});
```

### Pattern 3: Testing State Changes (React)

```typescript
it('should update count when button clicked', async () => {
  render(<Counter />);
  const button = screen.getByRole('button', { name: /increment/i });

  await userEvent.click(button);

  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

---

## DEVLOG Testing Section Template

After each sprint, document testing in DEVLOG:

```markdown
**Testing**
Added comprehensive tests for [sprint name]:
- **Unit tests ([X] tests)**: [What was tested]
  - [Module]: [Specific scenarios]
  - [Module]: [Specific scenarios]
- **Integration tests ([X] tests)**: [What was tested]
  - [API endpoint]: [Scenarios covered]
- **Component tests ([X] tests)**: [What was tested]
  - [Component]: [User interactions tested]

**Test Coverage**: [X] tests passing
- Total: [X] tests across [Y] test suites
- Coverage: [X]% of business logic

**Commands**:
- `npm test` - Run all tests
- `npm run test:watch` - Watch mode
```

---

## Red Flags: When Tests Are Missing

AI agents should flag these situations:

🚩 **No tests for new business logic**
- "I implemented X but didn't write tests for it"
- Should pause and add tests before continuing

🚩 **Tests skipped or commented out**
- Using `.skip()` or `// TODO: test this`
- Indicates incomplete work

🚩 **Tests not running in CI/CD**
- Tests exist but aren't automated
- Should be part of build process

🚩 **Hardcoded test data in production code**
- Test data leaking into actual code
- Separate test fixtures properly

---

## Quick Start: Adding Tests to New Project

### 1. Install testing dependencies

```bash
# For React/Vite projects
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom happy-dom

# Add if backend exists
npm install --save-dev supertest @types/supertest
```

### 2. Create `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

### 3. Create `src/test/setup.ts`

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
afterEach(() => cleanup());
```

### 4. Add scripts to `package.json`

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

### 5. Write your first test

```typescript
// src/utils.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './utils';

describe('myFunction', () => {
  it('should work correctly', () => {
    expect(myFunction('input')).toBe('expected output');
  });
});
```

### 6. Run tests

```bash
npm test
```

---

## Summary: Testing Checklist for AI Agents

Before marking any sprint complete:

- [ ] Unit tests written for all business logic
- [ ] Integration tests written for all APIs
- [ ] Component tests written for all UI
- [ ] All tests passing (`npm test` shows 100% pass rate)
- [ ] Test coverage documented in DEVLOG
- [ ] No tests skipped or commented out
- [ ] Mocks used appropriately (external deps only)
- [ ] Test files follow naming convention
- [ ] Tests use clear "should" statements
- [ ] Committed together with implementation

**Remember**: Tests are how you prove to the human that you got it right. Don't skip them!

---

**For more examples, see the Quazy Quizzer project which has 32 comprehensive tests across config, server, and UI layers.**
