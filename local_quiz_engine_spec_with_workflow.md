# Local Quiz Engine — Specification & Workflow (v0.2)

A modular, file-driven quiz system that:

- Loads any number of quiz files from a folder
- Randomizes questions across one or more selected sets
- Tracks per-user progress and answers
- Supports multiple question types with a consistent schema
- Uses config-driven theming and behavior
- Exposes a clear development **workflow** for AI coding agents (sprint-based, logged, auditable)
- Is simple enough for an LLM agent to implement without gluing everything together "like a raccoon with epoxy"

---

## 1. High-Level Architecture

**Runtime assumptions (adjustable):**

- Runs as a web app served by a local server (e.g. Node/Express, Python + simple HTTP, etc.).
- Frontend: framework-agnostic; may use vanilla JS/TS or React/etc.
- File-based data model: quizzes, config, and user profiles as JSON.
- Clean separation between **engine**, **storage**, and **UI**.

**Core components:**

1. **Quiz Loader** — discovers, parses, and validates quiz files.
2. **Quiz Engine** — manages sessions, question selection, randomization, grading.
3. **User Profile Manager** — handles basic user data and progress.
4. **Config Manager** — reads theming and feature flags.
5. **UI Layer** — renders sidebar, question view, navigation, results.

All components communicate via well-defined interfaces to keep feature creep survivable.

---

## 2. Directory & File Layout

```text
/project-root
  /public
    index.html
  /config
    app.config.json
  /quizzes
    minecraft_basics.v1.json
    minecraft_mobs.v1.json
    math_grade2.v1.json
    ...
  /users
    users.json              // or one file per user if desired
  /src
    quiz-engine/            // core quiz/session logic
    ui/                     // UI components
    storage/                // file/localStorage abstractions
    main.js / main.tsx
```

The exact build system/framework is flexible; the contracts below are not.

---

## 3. App Config (`/config/app.config.json`)

Global settings for theming and behavior.

```json
{
  "appName": "Local Quiz Hub",
  "defaultTheme": "dark",
  "themes": {
    "dark": {
      "background": "#0f172a",
      "panel": "#111827",
      "accent": "#22c55e",
      "text": "#e5e7eb",
      "fontFamily": "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      "questionTextSize": 16,
      "sidebarWidth": 260
    },
    "light": {
      "background": "#f9fafb",
      "panel": "#ffffff",
      "accent": "#2563eb",
      "text": "#111827",
      "questionTextSize": 16,
      "sidebarWidth": 260
    }
  },
  "quizFolder": "./quizzes",
  "userDataFile": "./users/users.json",
  "features": {
    "allowQuestionJump": true,
    "allowReviewMode": true,
    "randomizeOrderByDefault": true,
    "showQuestionProgress": true,
    "allowMultipleProfiles": true,
    "trackPerQuestionStats": true,
    "showCorrectAnswersToggle": true
  }
}
```

Rules:
- Missing keys: use sensible defaults.
- Unknown keys: ignore, do not crash.

---

## 4. Quiz File Spec (`/quizzes/*.json`)

Each file = one **quiz set**.

```json
{
  "id": "minecraft_basics_v1",
  "title": "Minecraft Basics",
  "description": "Core Minecraft survival and mechanics questions.",
  "tags": ["minecraft", "basics", "kids"],
  "version": 1,
  "author": "local",
  "allowRandomSubset": true,
  "defaultQuestionCount": 10,
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice_single",
      "text": "Which of these animals can you tame?",
      "choices": ["Pig", "Cow", "Wolf", "Chicken"],
      "correct": [2],
      "explanation": "Classic starter question.",
      "meta": {
        "difficulty": 1,
        "category": "mobs"
      }
    },
    {
      "id": "q2",
      "type": "true_false",
      "text": "You can sleep safely in the Nether using a bed.",
      "correct": false,
      "explanation": "Enjoy the explosion.",
      "meta": {
        "difficulty": 1,
        "category": "nether"
      }
    },
    {
      "id": "q3",
      "type": "fill_in_blank",
      "text": "The green exploding mob that sneaks up on you is called a ________.",
      "acceptableAnswers": [
        "creeper",
        { "value": "a creeper", "normalize": true }
      ],
      "explanation": "",
      "meta": {
        "difficulty": 1,
        "category": "mobs"
      }
    }
  ]
}
```

### 4.1 Supported Question Types

1. `multiple_choice_single`
   - `choices: string[]`
   - `correct: number[]` (index-based; typically 1 item)
2. `multiple_choice_multi`
   - `choices: string[]`
   - `correct: number[]` (multiple indices)
3. `true_false`
   - `correct: true | false`
4. `fill_in_blank`
   - `acceptableAnswers: (string | { "value": string, "normalize"?: boolean })[]`
5. `short_answer`
   - Optional `correct` for reference; can be manually or fuzzily graded.

All questions extend:

```ts
BaseQuestion = {
  id: string;
  type: string;
  text: string;
  explanation?: string;
  meta?: {
    difficulty?: number;
    category?: string;
    [key: string]: any;
  };
}
```

Validation:
- `id` unique within a quiz file.
- Unknown `type` ⇒ skip with logged warning.
- Empty `questions` ⇒ skip the file.

---

## 5. User Profiles (`/users/users.json`)

```json
{
  "users": [
    {
      "id": "sawyer",
      "name": "Sawyer",
      "createdAt": "2025-11-07T00:00:00Z",
      "lastActiveAt": "2025-11-07T00:10:00Z",
      "completedSets": {
        "minecraft_basics_v1": {
          "attempts": 2,
          "lastScore": 8,
          "bestScore": 10,
          "lastCompletedAt": "2025-11-07T00:09:00Z"
        }
      },
      "questionHistory": {
        "minecraft_basics_v1::q1": {
          "timesSeen": 3,
          "timesCorrect": 3,
          "lastAnswer": "Wolf",
          "lastResult": "correct"
        },
        "minecraft_basics_v1::q2": {
          "timesSeen": 2,
          "timesCorrect": 0,
          "lastAnswer": "True",
          "lastResult": "incorrect"
        }
      },
      "settings": {
        "theme": "dark",
        "fontScale": 1.0
      }
    }
  ]
}
```

Behavior:
- Create new profiles cheaply (just `id` + `name`).
- Track basic completion stats per quiz set.
- Track per-question performance for future adaptive modes.

Implementation detail (flexible):
- For local prototype: store as JSON file or in `localStorage`.
- Keep IO logic abstracted behind a storage module.

---

## 6. Core Behaviors

### 6.1 Quiz Discovery

- On app init:
  - Read `quizFolder` from config.
  - Load all `*.json` quiz files.
  - Validate against schema.
  - Build registry:

```ts
QuizRegistry = {
  byId: { [quizId: string]: QuizSet },
  all: QuizSet[]
}
```

- Invalid files: logged and skipped, no crash.

### 6.2 Session Creation

A **session** = specific run of one or more quiz sets for a user.

Inputs:
- `userId`
- `selectedQuizIds: string[]`
- `randomize?: boolean` (default from config)
- `limit?: number` (cap total questions)

Process:
1. Collect all questions from selected sets.
2. Tag each with `quizId` and a composite key `quizId::questionId`.
3. Deduplicate by composite key.
4. Optionally shuffle if `randomize`.
5. Apply `limit` if provided.

Representation:

```ts
Session = {
  id: string;
  userId: string;
  quizIds: string[];
  questions: SessionQuestion[]; // includes quizId + questionId + index
  answers: {
    [sessionQuestionKey: string]: {
      value: any;
      isCorrect?: boolean;
      answeredAt?: string;
    };
  };
  createdAt: string;
  completedAt?: string;
};
```

### 6.3 Navigation & Sidebar

- Sidebar lists all questions in order:
  - show index + status: unanswered / answered-correct / answered-incorrect.
- Clicking an entry jumps to that question (if `allowQuestionJump` is true).
- Prev/Next buttons support linear navigation.
- Main view renders according to question `type`.

### 6.4 Answer Handling & Grading

Per type:
- `multiple_choice_single`: store selected index.
- `multiple_choice_multi`: store array of indices.
- `true_false`: store boolean.
- `fill_in_blank` / `short_answer`: store string.

`gradeSession(session, registry)` should:
- Compute correctness where `correct`/`acceptableAnswers` exists.
- Apply normalization rules for text answers.
- Return:
  - total correct / total questions
  - per-question result
  - optionally updated `Session.answers[...].isCorrect`.

Visibility of correct answers controlled by `showCorrectAnswersToggle` and explicit user action.

---

## 7. Module Boundaries

To avoid epoxy incidents, enforce:

1. `quiz-engine/schema` — types + validators
2. `quiz-engine/loader` — file loading + schema validation
3. `quiz-engine/session` — session creation, answer updates, grading
4. `storage/userStore` — persistence for user data & sessions
5. `config/config` — config loading + defaults
6. `ui/*` — purely presentation, uses the APIs above; no direct filesystem assumptions

Each module should have a single responsibility and be replaceable.

---

## 8. Extensibility Hooks

Supported directions that **must not** require breaking changes:

- Image/media support on questions:
  ```json
  "media": { "image": "./assets/mob_creeper.png", "alt": "Pixel creeper" }
  ```
- Timers and time limits.
- Difficulty-based weighting using `meta.difficulty`.
- Category/tag filters when starting a session.
- Spaced repetition using `questionHistory`.
- Localization (e.g. `text_i18n` maps).

---

## 9. Development Workflow & AI Agent Instructions

This section is for any coding agent (or human) implementing the system. The goal is **controlled iteration** instead of "surprise monolith."

### 9.1 Workflow Overview

Work in **discrete sprints**, each producing:
- Small, testable increments.
- A clear update to a `DEVLOG.md`.
- No speculative features unless grounded in this spec.

### 9.2 DEVLOG Rules

Maintain `/DEVLOG.md` at the project root.

Each sprint append an entry:

```md
## Sprint N - <short title>

**Summary**
- What was implemented.

**Decisions**
- List any architectural or behavioral choices made.

**Questions**
- Clarifications needed from the user/spec owner.

**Concerns / Risks**
- Any way the current direction might cause trouble later.
```

If you (the agent) must choose between options not specified here, **log the decision** and explain briefly.

### 9.3 Sprint Plan (Minimum)

Suggested baseline sequence for an AI agent:

1. **Sprint 1 — Skeleton & Config**
   - Create project structure.
   - Implement config loader with defaults.
   - Add DEVLOG entry.

2. **Sprint 2 — Quiz Schema & Loader**
   - Implement quiz types & validators.
   - Implement quiz discovery and registry.
   - Add DEVLOG entry with any validation choices.

3. **Sprint 3 — Session Engine**
   - Implement session creation, randomization, answer storage.
   - Implement grading logic.
   - Add DEVLOG entry.

4. **Sprint 4 — Basic UI**
   - Implement sidebar, question view, navigation.
   - Wire UI → session engine.
   - No advanced styling yet.
   - Add DEVLOG entry.

5. **Sprint 5 — User Profiles & Persistence**
   - Implement user selection/creation.
   - Persist session results → `users.json` or localStorage.
   - Display simple stats.
   - Add DEVLOG entry.

6. **Sprint 6 — Polish & Extensibility Hooks**
   - Apply theming from config.
   - Add optional features (review mode, show answers toggle).
   - Refactor any epoxy.
   - Add DEVLOG entry including refactor notes.

Each sprint should be small enough to review quickly.

### 9.4 Constraints for Coding Agents

- **Do not** bundle unrelated features in one sprint.
- **Do not** silently change the schema or config format.
- **Do not** hardcode quiz data or themes directly in UI components when a file/config exists.
- **If something is ambiguous**, pick the safest option, implement it, and record:
  - what you assumed
  - why you assumed it
  - how to change it later

### 9.5 Truth Handling

If implementation reveals contradictions or design hazards:
- Note in DEVLOG under **Concerns / Risks**.
- Example: "Current user data format will not scale beyond X," or "Grading logic ambiguous for short_answer."
- Do not sugarcoat; the spec owner explicitly **can handle the truth.**

---

This spec + workflow is the contract. Any agent working on this project should follow it unless explicitly instructed otherwise, and must document every deviation.

