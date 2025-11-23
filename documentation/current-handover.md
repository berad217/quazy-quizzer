# Handover - Quazy Quizzer

## Quick Start
New AI: Start by reading documentation/onboarding.md first, then documentation/global-preferences.md, then come back here.

## Project Context
**Project**: Quazy Quizzer (quiz app for kids)
**Spec**: documentation/spec.md (Sprints 1-6) + documentation/advanced-features-spec.md (Sprints 7-9)
**Phase**: Implementation - Sprint-based workflow

## Where We Are
**Implementation progress**: See DEVLOG.md for detailed sprint notes

**Completed**:
- Sprint 1: Skeleton & Config ✓ (32 tests)
- Sprint 2: Quiz Schema & Loader ✓ (79 tests total)
- Sprint 3: Session Engine ✓ (134 tests total)
- Sprint 4: Basic UI ✓ (134 tests total)
- Sprint 5: User Profiles & Persistence ✓ (135 tests total)
- Sprint 6: Polish & Extensibility Hooks ✓ (135 tests total)
- Sprint 7: Fuzzy Matching & Enhanced Grading ✓ (172 tests total)
- Sprint 8: Adaptive Difficulty System ✓ (236 tests total)

**Current Sprint**: Sprint 9 - Quiz Authoring UI (not started)

**What's Working**:
- **Config system**: Loads from `/config/app.config.json` with deep merge and defaults
- **Quiz system**: Loads from `/quizzes` folder, validates all 5 question types
- **Session engine**: Creates sessions from multiple quizzes with deduplication, randomization, answer storage, and grading
- **Fuzzy matching**: Levenshtein distance algorithm accepts answers with minor typos (configurable)
- **Partial credit**: Configurable partial credit for close answers (default: disabled)
- **Adaptive difficulty**: Elo-based skill estimation, weighted question selection, real-time skill updates
- **User profiles**: File-based persistence in `/users/users.json` tracking completion stats, question history, and skill levels
- **Theme system**: React Context provider with user-selectable themes (dark/light)
- **Review mode**: Read-only navigation of completed sessions
- **UI**: Full React UI with theme provider, session start, quiz session, question navigation, and answer input
- **Express server** with complete API:
  - `/api/config` - returns app configuration
  - `/api/quizzes` - lists all loaded quizzes
  - `/api/quizzes/:id` - returns specific quiz
  - `/api/sessions` - create, get, update answers, grade (with fuzzy matching), complete sessions with adaptive mode
  - `/api/users` - CRUD operations for user profiles
- All 236 tests passing (64 new tests for adaptive system)
- Two sample quiz files exist demonstrating all question types

## Recent Sprint: Sprint 8 - Adaptive Difficulty System

**What was implemented**:
1. **Elo Rating Module** (`src/adaptive/eloRating.ts`):
   - Skill estimation using Elo rating algorithm (1-5 scale)
   - Expected score calculation: `P = 1 / (1 + 10^((difficulty - skill) / 4))`
   - Skill updates with K-factor adjustment (configurable speed)
   - Confidence calculation based on performance variance
   - Support for partial credit (0-1 scores, not just binary)

2. **Question Selector** (`src/adaptive/questionSelector.ts`):
   - Weighted random sampling based on skill-difficulty gap
   - Weight calculation: `w = e^(-gap * 0.7)`
   - Target accuracy adjustment (boost easier/harder questions)
   - Category-specific skill tracking
   - Validation for question metadata completeness

3. **Skill Analytics** (`src/adaptive/skillAnalytics.ts`):
   - Skill progression trend detection
   - Category performance summaries
   - Insight generation for users

4. **Adaptive Configuration** (in `config/app.config.json`):
   ```json
   "adaptive": {
     "enabled": true,
     "defaultTargetAccuracy": 0.7,
     "adjustmentSpeed": 0.5,
     "minQuestionsForAdaptation": 5,
     "categoryDetection": "auto"
   }
   ```

5. **Enhanced User Profiles**:
   - `skillLevels: { [category]: SkillLevel }` - Elo ratings per category
   - `SkillLevel` includes: estimatedLevel (1-5), confidence (0-1), recentPerformance, questionsAttempted
   - Auto-initialized on first use per category
   - Updated in real-time after quiz completion

6. **Adaptive Session UI** (`src/ui/SessionStart.tsx`):
   - "Adaptive Difficulty" toggle checkbox
   - Skill level display per category with confidence percentages
   - Target accuracy slider (50%-90%)
   - Informative message for new users without skill data

7. **Visual Difficulty Indicators** (`src/ui/QuestionView.tsx`):
   - 5-circle difficulty display (filled circles = difficulty level)
   - Visible when questions have difficulty metadata

8. **Comprehensive Testing**:
   - 40 tests in `src/adaptive/eloRating.test.ts`
   - 24 tests in `src/adaptive/questionSelector.test.ts`
   - All 236 tests passing (172 pre-Sprint-8 + 64 new)

**Key technical decisions**:
- Elo algorithm chosen for established skill estimation (used in chess, gaming)
- 1-5 difficulty scale matches common educational standards
- Exponential decay weighting peaks at user's skill level
- Adaptive mode is opt-in per-session (backward compatible)
- Category detection from question metadata (defaults to "general")
- K-factor scaled by adjustmentSpeed config (default: 0.5 → K=32)
- Skill confidence prevents overconfidence (capped at 0.95)
- Questions without metadata use defaults (difficulty: 3, category: "general")

**Files created**:
- `src/adaptive/eloRating.ts` - Elo rating calculations
- `src/adaptive/eloRating.test.ts` - 40 comprehensive tests
- `src/adaptive/questionSelector.ts` - Adaptive selection logic
- `src/adaptive/questionSelector.test.ts` - 24 tests
- `src/adaptive/skillAnalytics.ts` - Performance analytics

**Files modified**:
- `src/config/types.ts` - Added AdaptiveConfig interface
- `src/config/defaults.ts` - Added adaptive defaults
- `config/app.config.json` - Added adaptive configuration
- `src/storage/userProfile.ts` - Added SkillLevel, AdaptivePreferences
- `src/quiz-engine/session.ts` - Adaptive question selection
- `server/app.ts` - Skill updates on session completion
- `server/userService.ts` - updateUserSkills function
- `src/ui/SessionStart.tsx` - Adaptive mode UI
- `src/ui/QuestionView.tsx` - Difficulty indicators
- `DEVLOG.md` - Comprehensive Sprint 8 documentation

## Previous Sprint: Sprint 7 - Fuzzy Matching & Enhanced Grading

**What was implemented**:
1. **Fuzzy Matching Module** (`src/grading/fuzzyMatch.ts`):
   - Levenshtein distance algorithm for edit distance calculation
   - Similarity scoring (0-1 scale)
   - Text normalization (lowercase, trim, article removal, punctuation)
   - Configurable thresholds (default: 80% fuzzy, 60% partial)

2. **Grading Configuration** (in `config/app.config.json`):
   ```json
   "grading": {
     "enableFuzzyMatching": true,
     "fuzzyMatchThreshold": 0.8,
     "enablePartialCredit": false,
     "partialCreditThreshold": 0.6,
     "partialCreditValue": 0.5
   }
   ```

3. **Enhanced Answer Metadata**:
   - `score` (0-1, supports partial credit)
   - `matchType` ('exact' | 'fuzzy' | 'partial' | 'none')
   - `similarity` (0-1 similarity score)
   - `matchedAnswer` (which acceptable answer variant matched)
   - `feedback` (custom feedback message)

4. **UI Feedback Badges** (`src/ui/QuestionView.tsx`):
   - Yellow badge for fuzzy matches: "⚠️ Minor typo detected. Answer accepted (94% match)"
   - Orange badge for partial credit: "⭐ Partial credit awarded (50% credit)"
   - Displays similarity percentage and custom feedback

5. **Comprehensive Testing**:
   - 37 new tests in `src/grading/fuzzyMatch.test.ts`
   - All 172 tests passing (up from 135)
   - Full coverage of algorithm edge cases

**Key technical decisions**:
- Levenshtein distance chosen for industry-standard typo detection
- Default thresholds: 80% for fuzzy match, 60% for partial credit
- Partial credit disabled by default (can enable per config)
- Backward compatible: all existing tests pass, fuzzy matching enhances existing quizzes
- Per-answer customization via `AnswerVariant` type (caseSensitive, exactMatch, feedback)

**Files created**:
- `src/grading/fuzzyMatch.ts` - Fuzzy matching module
- `src/grading/fuzzyMatch.test.ts` - 37 comprehensive tests

**Files modified**:
- `src/config/types.ts` - Added GradingConfig interface
- `src/config/defaults.ts` - Added grading defaults
- `config/app.config.json` - Added grading configuration
- `src/quiz-engine/session.ts` - Enhanced grading with fuzzy matching
- `src/quiz-engine/session.test.ts` - Updated all grading calls
- `server/sessionService.ts` - Pass grading config
- `server/app.ts` - Grade endpoints pass config.grading
- `src/ui/QuestionView.tsx` - Display match feedback badges
- `src/ui/QuizSession.tsx` - Pass grading metadata to QuestionView
- `DEVLOG.md` - Comprehensive Sprint 7 documentation

## Conversation Context

**Recent Activity**:
- Completed Sprint 8 implementation (adaptive difficulty system with Elo rating)
- All 236 tests passing (64 new tests for adaptive system)
- Code committed and pushed to branch `claude/review-handover-onboarding-01WYrLmSyehKq5A7ZyLvkBKP`
- DEVLOG.md updated with comprehensive Sprint 8 documentation

**No Active Discussions**: Sprint 8 complete and documented.

**No Decisions in Flight**: Everything implemented cleanly per spec.

**Clean State**: All changes committed to branch `claude/review-handover-onboarding-01WYrLmSyehKq5A7ZyLvkBKP` and pushed.

## Key Technical Decisions from Recent Sprints

**Sprint 6 - Theme System**:
- Created ThemeContext using React Context API
- Eliminated config prop drilling from 6 UI components
- User-selectable theme with persistence to user profile
- Review mode implemented as read-only session navigation
- Show Correct Answers toggle added to graded sessions

**Sprint 7 - Fuzzy Matching**:
- Levenshtein distance for edit distance (O(n*m) complexity, acceptable for short answers)
- Similarity = 1 - (distance / maxLength)
- Match types: exact (normalized), fuzzy (≥80%), partial (≥60%), none (<60%)
- Normalization when fuzzy enabled: lowercase, trim, articles, punctuation
- Legacy support: `normalize?: boolean` from old schema mapped to new system
- Case-sensitive mode: when fuzzy disabled OR `caseSensitive: true` set

**Sprint 8 - Adaptive Difficulty**:
- Elo rating algorithm: `P = 1 / (1 + 10^((difficulty - skill) / 4))`
- 1-5 skill scale (matches difficulty scale, easier interpretation than Elo's 0-3000)
- K-factor = adjustmentSpeed × 64 (default: 0.5 × 64 = 32)
- Weighted selection: `weight = e^(-gap * 0.7)` (exponential decay, peaks at user level)
- Confidence from variance: `1 - variance + bonuses`, capped at 0.95
- Category-specific tracking (not global skill level)
- Opt-in per session (not forced on all users)
- Graceful degradation: questions without metadata use defaults
- Skills update after completion, not during session (prevents mid-session adjustment)

## Red Flags / Warnings

**Known Issues from Sprint 7** (Fuzzy Matching):
- **Performance**: Levenshtein O(n*m) could be slow for 100+ char answers (rare in quizzes)
- **Threshold Tuning**: 80% default may need adjustment per context (spelling tests vs. comprehension)
- **Language Assumptions**: Normalization only supports English articles (a/an/the)
- **No Synonym Detection**: "car" vs "automobile" won't match (Levenshtein only catches typos)
- **No Spell Suggestions**: Close wrong answers don't suggest correct spelling
- **Grading Config Changes**: Score consistency depends on config staying constant

**Known Issues from Sprint 8** (Adaptive Difficulty):
- **Cold Start Problem**: New users start at 2.5 skill (middle), may get inappropriate questions initially
- **Category Detection**: Relies on quiz authors setting `meta.category` correctly
- **Small Sample Bias**: Skill estimates unstable with <5 questions per category
- **No Skill Decay**: Skills don't decrease over time (dormant knowledge assumed retained)
- **Weighted Sampling Variance**: Small question pools may not have good matches for extreme skill levels
- **Config Sensitivity**: Changing adjustmentSpeed or thresholds affects all future sessions
- **No Cross-Category Learning**: Math skill doesn't inform science skill (could use transfer learning)

**Architecture Concerns**:
- **In-Memory Sessions**: Lost on server restart (acceptable for MVP)
- **File Locking**: No locking on users.json (acceptable for single-user, need DB for multi-user)
- **Session Cleanup**: No automatic cleanup of old sessions (memory grows unbounded)

**None are blockers** - documented for future enhancement.

## Next Steps

**Immediate actions for next session**:

1. **Sprint 9 - Quiz Authoring UI** from `documentation/advanced-features-spec.md`:
   - Visual quiz editor with drag-drop question reordering
   - Live preview panel
   - Metadata editor (title, description, difficulty, category)
   - Question type selector with templates
   - Validation UI with inline error messages
   - Import/Export functionality
   - **Note**: This is the largest remaining sprint, consider breaking into sub-tasks

2. **OR: Manual Testing & Polish**:
   - Test adaptive difficulty with real quiz sessions
   - Verify skill progression over multiple sessions
   - Test edge cases (new user, extreme skills, missing metadata)
   - UI/UX improvements based on usage
   - Mobile responsiveness testing

3. **OR: Additional Features** (not in spec):
   - Skill decay over time
   - Cross-category learning transfer
   - Better cold start handling (diagnostic quiz)
   - Skill analytics dashboard (from Sprint 8 spec but deferred)
   - Session persistence (save in-progress sessions)

4. **When next sprint complete**:
   - Write sprint section in DEVLOG.md
   - Run all tests (`npm test`)
   - Commit and push to branch
   - Update this handover document

## Files Changed in Sprint 8

**Commit**: f8a417c "Complete Sprint 8 - Adaptive Difficulty System"

**New files**:
- src/adaptive/eloRating.ts
- src/adaptive/eloRating.test.ts
- src/adaptive/questionSelector.ts
- src/adaptive/questionSelector.test.ts
- src/adaptive/skillAnalytics.ts

**Modified files**:
- DEVLOG.md (Sprint 8 section)
- config/app.config.json
- server/app.ts
- server/userService.ts
- src/config/defaults.ts
- src/config/types.ts
- src/storage/userProfile.ts
- src/quiz-engine/session.ts
- src/ui/SessionStart.tsx
- src/ui/QuestionView.tsx

## Files Changed in Sprint 7

**Commit**: ba4f96c "Complete Sprint 7 - Fuzzy Matching & Enhanced Grading"

**New files**:
- src/grading/fuzzyMatch.ts
- src/grading/fuzzyMatch.test.ts

**Modified files**:
- DEVLOG.md (Sprint 7 section)
- config/app.config.json
- server/app.ts
- server/sessionService.ts
- src/config/defaults.ts
- src/config/types.ts
- src/quiz-engine/session.test.ts
- src/quiz-engine/session.ts
- src/ui/QuestionView.tsx
- src/ui/QuizSession.tsx

## Repository State

**Branch**: `claude/review-handover-onboarding-01WYrLmSyehKq5A7ZyLvkBKP`
**Status**: Clean (all changes committed and pushed)
**Tests**: 236 passing (0 failing)
**Last commit**: f8a417c "Complete Sprint 8 - Adaptive Difficulty System"

## Key Architecture & Files

**Core Quiz Engine** (`src/quiz-engine/`):
- `schema.ts` - TypeScript types for all 5 question types
- `validator.ts` - Quiz validation with non-blocking error collection
- `session.ts` - Session creation, answer storage, grading logic with fuzzy matching, adaptive selection

**Fuzzy Matching** (`src/grading/`):
- `fuzzyMatch.ts` - Levenshtein distance, similarity scoring, text normalization
- `fuzzyMatch.test.ts` - 37 comprehensive tests

**Adaptive Difficulty** (`src/adaptive/`):
- `eloRating.ts` - Elo rating calculations, skill updates, confidence
- `eloRating.test.ts` - 40 comprehensive tests
- `questionSelector.ts` - Weighted question selection, validation
- `questionSelector.test.ts` - 24 comprehensive tests
- `skillAnalytics.ts` - Skill progression analytics and insights

**Server** (`server/`):
- `app.ts` - Express app with all API endpoints, adaptive mode support
- `quizService.ts` - Quiz loading and registry
- `sessionService.ts` - In-memory session storage, passes grading config
- `userService.ts` - File-based user persistence, skill updates
- `index.ts` - Server startup

**UI Components** (`src/ui/`):
- `ThemeContext.tsx` - Theme provider (Sprint 6)
- `SessionStart.tsx` - User selection, theme selection, quiz configuration, adaptive mode toggle
- `QuizSession.tsx` - Main session container with review mode
- `Sidebar.tsx` - Question list with status indicators
- `QuestionView.tsx` - Question display with fuzzy match feedback badges, difficulty indicators
- `AnswerInput.tsx` - Type-specific input components
- `Navigation.tsx` - Session controls

**Data Storage**:
- `/config/app.config.json` - App configuration (includes grading and adaptive config)
- `/quizzes/*.v1.json` - Quiz files (loaded on startup)
- `/users/users.json` - User profiles with skill levels (file-based persistence)

**Testing**:
- All `*.test.ts` files use Vitest
- 236 tests total across all modules
- Coverage: config (16), validator (22), quizService (20), session (36), fuzzyMatch (37), eloRating (40), questionSelector (24), app API (32), App UI (9)

## Sprint 8 Implementation Details

### Elo Rating Algorithm
```typescript
// Expected score calculation (logistic function)
function calculateExpectedScore(userLevel: number, questionDifficulty: number): number {
  const exponent = (questionDifficulty - userLevel) / 4;
  return 1 / (1 + Math.pow(10, exponent));
}

// Skill update with K-factor
function updateSkillLevel(currentLevel: number, questionDifficulty: number,
                         isCorrect: boolean, K: number = 32): number {
  const expected = calculateExpectedScore(currentLevel, questionDifficulty);
  const actual = isCorrect ? 1 : 0;
  const delta = K * (actual - expected);
  return Math.max(1, Math.min(5, currentLevel + delta)); // Clamp to 1-5
}

// Confidence calculation
function calculateConfidence(recentPerformance: number[]): number {
  // Based on variance of last 10 scores
  // Lower variance = higher confidence
  // Bonus for more data points
  // Capped at 0.95
}
```

### Weighted Question Selection
```
For each question:
  1. Get user skill level for question's category (default: 2.5)
  2. Calculate difficulty gap: |userLevel - questionDifficulty|
  3. Calculate base weight: w = e^(-gap * 0.7)
  4. Adjust for target accuracy:
     - If target > 0.7 and question easier: boost weight
     - If target < 0.7 and question harder: boost weight
  5. Collect all weighted questions
  6. Perform weighted random sampling (no duplicates)
  7. Optionally randomize final order
```

### Skill Update Flow
```
User completes quiz session
  ↓
POST /api/sessions/:id/complete
  ↓
For each question:
  - Get question object and user's score (0-1)
  - Extract difficulty and category from metadata
  - Get/create skill level for category
  - Update skill using Elo algorithm
  - Track recent performance (last 10)
  - Recalculate confidence
  ↓
Save updated user profile to users.json
  ↓
Return completion data
```

### Configuration Options

**Adaptive Config** (in `app.config.json`):
```json
{
  "adaptive": {
    "enabled": true,                    // Global toggle
    "defaultTargetAccuracy": 0.7,       // 70% target success rate
    "adjustmentSpeed": 0.5,             // K-factor multiplier (0.5 × 64 = 32)
    "minQuestionsForAdaptation": 5,     // Minimum questions before adaptive kicks in
    "categoryDetection": "auto"         // Auto-detect from meta.category
  }
}
```

## Sprint 7 Implementation Details

### Fuzzy Matching Algorithm
```typescript
// Levenshtein distance - O(n*m) dynamic programming
function levenshteinDistance(str1: string, str2: string): number {
  // Creates 2D matrix, calculates minimum edits
  // Returns edit distance
}

// Similarity score 0-1
function calculateSimilarity(str1: string, str2: string): number {
  return 1 - (distance / maxLength);
}

// Match logic
function findBestMatch(userAnswer, acceptableAnswers, config): MatchResult {
  // 1. Try exact match (with normalization if enabled)
  // 2. If fuzzy enabled, calculate similarity for all variants
  // 3. Apply thresholds: ≥80% = fuzzy, ≥60% = partial
  // 4. Return best match
}
```

### Enhanced Grading Flow
```
User submits answer
  ↓
gradeAnswer(question, answer, gradingConfig)
  ↓
gradeTextAnswer(userAnswer, acceptableAnswers, config)
  ↓
findBestMatch(userAnswer, acceptableAnswers, config)
  ↓
Returns: {
  matched: boolean,
  score: 0-1,
  matchType: 'exact' | 'fuzzy' | 'partial' | 'none',
  similarity: 0-1,
  matchedAnswer: string,
  feedback?: string
}
  ↓
UI displays feedback badge based on matchType
```

### Configuration Options

**Grading Config** (in `app.config.json`):
```json
{
  "grading": {
    "enableFuzzyMatching": true,      // Global toggle
    "fuzzyMatchThreshold": 0.8,        // 80% similarity for full credit
    "enablePartialCredit": false,      // Default: disabled
    "partialCreditThreshold": 0.6,     // 60% similarity for partial
    "partialCreditValue": 0.5          // 50% credit when partial
  }
}
```

**Per-Answer Customization** (in quiz JSON):
```json
{
  "acceptableAnswers": [
    "photosynthesis",                           // Simple string
    { "value": "exact only", "exactMatch": true },  // Skip fuzzy
    { "value": "CaseSensitive", "caseSensitive": true }, // Require case match
    { "value": "custom", "feedback": "Great job!", "partialCredit": 0.75 }
  ]
}
```

## Development Environment Notes

- Run `npm install` if dependencies missing
- Run `npm test` to verify all tests pass (should show 236 passing)
- Run `npm run dev` to start server (port 3001) and frontend (port 3000)
- Quiz files in `/quizzes` are loaded on server startup
- Invalid quiz files are logged but don't crash the server
- User data auto-creates `/users/users.json` on first user creation
- Grading and adaptive config loaded from `app.config.json` on server startup

## Testing Adaptive Difficulty Manually

1. **Enable Adaptive Mode**:
   - Create a new user or select existing user
   - Check "Adaptive Difficulty" toggle on session start screen
   - Adjust target accuracy slider (default: 70%)
   - Start quiz session

2. **First Session (Cold Start)**:
   - New user starts at skill level 2.5 (middle)
   - Questions selected with some randomness around difficulty 2-3
   - Complete quiz and check results
   - User profile updated with initial skill estimates

3. **View Skill Levels**:
   - Return to session start screen
   - Expand adaptive mode section
   - Should see skill levels per category (e.g., "math: 3.2 / 5.0 (45% confidence)")
   - More questions = higher confidence

4. **Test Skill Progression**:
   - Complete same quiz multiple times with high accuracy
   - Skill level should increase (e.g., 2.5 → 3.2 → 3.8)
   - Questions should get progressively harder
   - Confidence should increase with more data

5. **Test Target Accuracy**:
   - Set target to 90% (easier questions)
   - Should see more questions below current skill level
   - Set target to 50% (harder questions)
   - Should see more questions above current skill level

6. **Questions Without Metadata**:
   - Create quiz without difficulty/category metadata
   - Adaptive mode should still work (defaults: difficulty 3, category "general")

## Testing Fuzzy Matching Manually

1. **Basic Fuzzy Match**:
   - Start a quiz with fill-in-blank questions
   - Answer "photosynthesiss" (typo with extra 's')
   - Grade quiz
   - Should see yellow badge: "⚠️ Minor typo detected. Answer accepted (93% match)"

2. **Partial Credit** (requires config change):
   - Edit `config/app.config.json`: set `"enablePartialCredit": true`
   - Restart server
   - Answer with moderate difference (e.g., "helo" for "hello")
   - Grade quiz
   - Should see orange badge: "⭐ Partial credit awarded (50% credit)"
   - Score shows partial (e.g., 1.5/3 instead of 1/3)

3. **Case Sensitivity**:
   - Edit config: set `"enableFuzzyMatching": false`
   - Restart server
   - Answer "PHOTOSYNTHESIS" (all caps)
   - Grade quiz
   - Should be marked incorrect (no normalization when fuzzy disabled)

## Remember

User communication preferences (from global-preferences.md):
- Direct, concise feedback - skip pleasantries
- Intellectual honesty valued - flag problems directly
- Struggles with mission creep - keep scope tight
- Learns by building - modular design important
- "avoid coupling like a raccoon with epoxy"

This project uses sprint-based workflow:
- One sprint at a time
- Update DEVLOG after each sprint
- Commit code + tests + docs together
- Don't bundle unrelated features

## Quick Reference: What Changed in Sprint 7

**Before Sprint 7**:
- Text answers required exact match (after normalization)
- No typo tolerance
- No partial credit
- Binary grading: correct or incorrect

**After Sprint 7**:
- Text answers accept minor typos via fuzzy matching
- Configurable similarity thresholds (default: 80% fuzzy, 60% partial)
- Partial credit support (disabled by default)
- Match type tracking: exact, fuzzy, partial, none
- UI shows feedback badges for fuzzy matches and partial credit
- Per-answer customization (caseSensitive, exactMatch, feedback)

**Backward Compatibility**:
- All existing quizzes work without modification
- All 135 pre-Sprint-7 tests still pass
- Fuzzy matching enhances grading, doesn't break it
- Can disable fuzzy matching globally if needed

## Quick Reference: What Changed in Sprint 8

**Before Sprint 8**:
- Questions selected randomly or in order
- No skill tracking or personalization
- Same difficulty for all users
- No performance-based adaptation

**After Sprint 8**:
- Elo-based skill tracking per category (1-5 scale)
- Weighted question selection prioritizes user's skill level
- Adaptive mode opt-in via UI toggle
- Real-time skill updates after quiz completion
- Confidence tracking (0-95% based on performance variance)
- Target accuracy slider (50%-90%)
- Visual difficulty indicators (5-circle display)
- Skill level display on session start screen
- Category-specific tracking (math, science, general, etc.)

**Backward Compatibility**:
- All existing quizzes work without modification (adaptive uses defaults)
- All 172 pre-Sprint-8 tests still pass
- Adaptive mode is opt-in (doesn't affect normal quiz sessions)
- Can disable globally via `adaptive.enabled: false` in config
- Questions without metadata gracefully handled (difficulty: 3, category: "general")
