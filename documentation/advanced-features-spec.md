# Advanced Features Specification

Detailed specifications for Sprints 7-9, extending the core quiz engine with fuzzy matching, adaptive difficulty, and authoring tools.

---

## Sprint 7 - Fuzzy Matching & Improved Grading

### Goals
Improve text answer grading to handle typos, alternate spellings, and partial credit scenarios.

### Current State Problem
Current grading for `fill_in_blank` and `short_answer`:
- Exact string match after basic normalization (lowercase, trim, remove articles)
- Fails on minor typos: "creeper" ✓ but "creeper!" or "creepr" ✗
- No partial credit for close answers
- No handling of alternate valid answers beyond pre-defined list

### Feature Requirements

#### 1. Fuzzy String Matching
**Algorithm**: Levenshtein distance (edit distance)
- Calculate minimum edits (insertions, deletions, substitutions) between strings
- Configurable similarity threshold (default: 80%)
- Applied after normalization (lowercase, trim, remove punctuation)

**Use cases**:
- Typos: "creepr" → "creeper" (1 char difference)
- Extra chars: "creeper!" → "creeper" (punctuation removed)
- Missing chars: "creper" → "creeper" (1 missing char)

**Thresholds**:
- 100% match = correct
- 80-99% match = correct with typo warning
- 60-79% match = partial credit (if enabled)
- <60% match = incorrect

#### 2. Partial Credit System
**Configuration** (per question or global):
```typescript
interface GradingConfig {
  enableFuzzyMatching: boolean;        // default: true
  fuzzyMatchThreshold: number;         // 0-1, default: 0.8
  enablePartialCredit: boolean;        // default: false
  partialCreditThreshold: number;      // 0-1, default: 0.6
  partialCreditValue: number;          // 0-1, default: 0.5 (50%)
}
```

**Scoring**:
- Exact match: 1.0 (100%)
- Fuzzy match (≥80%): 1.0 (100%, but flagged as typo)
- Partial match (60-79%): 0.5 (50%, if partial credit enabled)
- No match (<60%): 0.0 (0%)

#### 3. Multi-Answer Support Enhancement
**Current**: `acceptableAnswers` array with static strings
**Enhanced**: Support answer variants with metadata
```typescript
interface AnswerVariant {
  value: string;
  caseSensitive?: boolean;    // override normalization
  exactMatch?: boolean;        // skip fuzzy matching
  partialCredit?: number;      // 0-1, specific credit amount
  feedback?: string;           // custom feedback for this variant
}

type AcceptableAnswer = string | AnswerVariant;
```

**Example**:
```json
{
  "type": "fill_in_blank",
  "text": "The capital of France is ________.",
  "acceptableAnswers": [
    "Paris",
    { "value": "paris", "caseSensitive": false },
    { "value": "City of Light", "partialCredit": 0.8, "feedback": "That's a nickname for Paris!" }
  ]
}
```

### Data Structure Changes

#### Session Answer Storage
Add grading metadata:
```typescript
interface AnswerRecord {
  value: AnswerValue;
  isCorrect?: boolean;
  answeredAt?: string;
  // NEW:
  score?: number;                    // 0-1, supports partial credit
  matchType?: 'exact' | 'fuzzy' | 'partial' | 'none';
  similarity?: number;               // 0-1, for fuzzy matches
  matchedAnswer?: string;            // which acceptable answer matched
  feedback?: string;                 // custom feedback
}
```

#### Config Addition
Add to `app.config.json`:
```json
{
  "grading": {
    "enableFuzzyMatching": true,
    "fuzzyMatchThreshold": 0.8,
    "enablePartialCredit": false,
    "partialCreditThreshold": 0.6,
    "partialCreditValue": 0.5
  }
}
```

### Implementation Plan

#### 1. Core Fuzzy Matching Module
**File**: `src/grading/fuzzyMatch.ts`
```typescript
// Levenshtein distance implementation
function levenshteinDistance(str1: string, str2: string): number;

// Calculate similarity score (0-1)
function calculateSimilarity(str1: string, str2: string): number;

// Find best match from list of acceptable answers
function findBestMatch(
  userAnswer: string,
  acceptableAnswers: AcceptableAnswer[],
  config: GradingConfig
): {
  matched: boolean;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'partial' | 'none';
  similarity: number;
  matchedAnswer: string;
  feedback?: string;
};
```

#### 2. Enhanced Grading Function
**File**: `src/quiz-engine/session.ts` (update existing)
```typescript
function gradeTextAnswer(
  userAnswer: string,
  acceptableAnswers: AcceptableAnswer[],
  config: GradingConfig
): GradingResult {
  // 1. Normalize user answer
  const normalized = normalizeText(userAnswer);

  // 2. Try exact matches first
  for (const answer of acceptableAnswers) {
    if (isExactMatch(normalized, answer)) {
      return { score: 1.0, matchType: 'exact', ... };
    }
  }

  // 3. Try fuzzy matching (if enabled)
  if (config.enableFuzzyMatching) {
    const bestMatch = findBestMatch(normalized, acceptableAnswers, config);
    if (bestMatch.similarity >= config.fuzzyMatchThreshold) {
      return { score: 1.0, matchType: 'fuzzy', ... };
    }

    // 4. Try partial credit (if enabled)
    if (config.enablePartialCredit &&
        bestMatch.similarity >= config.partialCreditThreshold) {
      return { score: config.partialCreditValue, matchType: 'partial', ... };
    }
  }

  // 5. No match
  return { score: 0, matchType: 'none', ... };
}
```

#### 3. UI Updates

**QuestionView.tsx** - Show match feedback:
```tsx
{showCorrect && answerRecord && answerRecord.matchType === 'fuzzy' && (
  <div style={{ color: '#f59e0b', marginTop: '0.5rem' }}>
    ⚠️ Minor typo detected. Answer accepted.
  </div>
)}

{showCorrect && answerRecord && answerRecord.matchType === 'partial' && (
  <div style={{ color: '#f59e0b', marginTop: '0.5rem' }}>
    ⭐ Partial credit ({Math.round(answerRecord.score * 100)}%)
    {answerRecord.feedback && <div>{answerRecord.feedback}</div>}
  </div>
)}
```

**Grading Results** - Update score calculation:
```typescript
// Before: binary correct/incorrect count
// After: sum of scores for weighted total
const totalScore = Object.values(answers)
  .reduce((sum, answer) => sum + (answer.score || 0), 0);
const percentage = (totalScore / totalQuestions) * 100;
```

### Testing Requirements

#### Unit Tests (30+ new tests)
**File**: `src/grading/fuzzyMatch.test.ts`
- Levenshtein distance calculations
- Similarity score edge cases
- Best match selection logic
- Threshold boundary testing

**File**: `src/quiz-engine/session.test.ts` (extend existing)
- Exact match still works
- Fuzzy match with typos
- Partial credit scenarios
- Multi-variant answer selection
- Case sensitivity handling
- Config flag toggling

#### Integration Tests
- End-to-end grading with fuzzy matching
- Score calculations with partial credit
- User stats recording with weighted scores

### Migration Considerations

**Backward Compatibility**:
- Default config disables partial credit (existing behavior preserved)
- Fuzzy matching enabled by default (improves UX, no breaking changes)
- Existing `acceptableAnswers` strings still work
- New `AnswerVariant` objects optional

**Data Migration**:
- No migration needed for quiz files
- Existing sessions remain valid
- User stats can be recalculated if needed

### Concerns / Risks

1. **Performance**: Levenshtein algorithm is O(n*m). For short answers (<100 chars), negligible. Consider optimization for very long short_answer questions.

2. **False Positives**: Fuzzy matching might accept wrong answers that happen to be similar. Mitigated by 80% threshold, but needs testing.

3. **Partial Credit Complexity**: Teachers/parents might find it confusing. Keep disabled by default, clear documentation needed.

4. **User Expectations**: Users might expect spell-check suggestions, not just acceptance. Consider showing "Did you mean X?" messages.

5. **Language-Specific Issues**: Levenshtein works for English, but may need adaptation for other languages (accents, diacritics).

---

## Sprint 8 - Adaptive Difficulty System

### Goals
Dynamically adjust question difficulty based on user performance history to optimize learning.

### Feature Requirements

#### 1. Question Difficulty Metadata
**Enhancement to quiz schema** (already has `meta.difficulty`):
```json
{
  "id": "q1",
  "type": "multiple_choice_single",
  "meta": {
    "difficulty": 2,        // 1 (easy) to 5 (hard)
    "skillLevel": "basic",  // basic, intermediate, advanced
    "prerequisites": ["q0"] // question IDs that should be mastered first
  }
}
```

#### 2. User Skill Tracking
**Enhancement to user profile**:
```typescript
interface UserProfile {
  // ... existing fields ...
  skillLevels: {
    [category: string]: {
      estimatedLevel: number;      // 1-5, Elo-like rating
      confidence: number;           // 0-1, how sure we are
      lastUpdated: string;
      questionsAttempted: number;
      recentPerformance: number[];  // last 10 attempts (0 or 1)
    };
  };
  adaptiveDifficulty: {
    enabled: boolean;
    targetAccuracy: number;         // 0-1, default 0.7 (70%)
    adjustmentSpeed: number;        // 0-1, how fast to adapt
  };
}
```

#### 3. Adaptive Session Creation
**Algorithm**: Elo-based skill estimation + difficulty targeting

**Session creation flow**:
1. Load user's skill level for quiz category (or default: 2.5)
2. Select questions weighted by difficulty proximity to user level
3. Include mix: 60% at level, 20% easier, 20% harder
4. As user answers, update skill estimate in real-time
5. Subsequent question selection adjusts to updated estimate

**Implementation**:
```typescript
interface AdaptiveSessionConfig {
  userId: string;
  quizIds: string[];
  targetAccuracy?: number;    // override user default
  questionCount?: number;
  categories?: string[];      // filter by category
}

function createAdaptiveSession(config: AdaptiveSessionConfig): Session {
  // 1. Get user skill levels
  const userSkills = getUserSkillLevels(config.userId);

  // 2. Load questions from selected quizzes
  const allQuestions = loadQuestions(config.quizIds);

  // 3. Filter by category if specified
  const filtered = config.categories
    ? allQuestions.filter(q => config.categories.includes(q.meta.category))
    : allQuestions;

  // 4. Calculate question selection probabilities
  const weighted = filtered.map(q => ({
    question: q,
    weight: calculateSelectionWeight(q, userSkills, config.targetAccuracy)
  }));

  // 5. Sample questions based on weights
  const selected = weightedSample(weighted, config.questionCount);

  return createSession({ ...config, questions: selected });
}

function calculateSelectionWeight(
  question: Question,
  userSkills: SkillLevels,
  targetAccuracy: number
): number {
  const category = question.meta?.category || 'general';
  const userLevel = userSkills[category]?.estimatedLevel || 2.5;
  const questionDiff = question.meta?.difficulty || 3;

  // Probability based on difficulty gap
  const diffGap = Math.abs(userLevel - questionDiff);

  // Peak probability at user level, fall off with distance
  // 60% weight at exact match, 20% at ±1, 10% at ±2, etc.
  const baseWeight = Math.exp(-diffGap * 0.7);

  // Adjust for target accuracy (higher target = easier questions)
  const accuracyAdjustment = targetAccuracy > 0.7
    ? 1.0 - (questionDiff - userLevel) * 0.1
    : 1.0;

  return baseWeight * accuracyAdjustment;
}
```

#### 4. Real-Time Skill Updates
**After each answer**:
```typescript
function updateUserSkill(
  userId: string,
  question: Question,
  isCorrect: boolean
): void {
  const category = question.meta?.category || 'general';
  const questionDiff = question.meta?.difficulty || 3;
  const userSkill = getUserSkill(userId, category);

  // Elo-style update
  const K = 32; // adjustment speed
  const expected = 1 / (1 + Math.pow(10, (questionDiff - userSkill.level) / 4));
  const actual = isCorrect ? 1 : 0;
  const delta = K * (actual - expected);

  userSkill.estimatedLevel = Math.max(1, Math.min(5, userSkill.level + delta));
  userSkill.recentPerformance.push(actual);
  if (userSkill.recentPerformance.length > 10) {
    userSkill.recentPerformance.shift();
  }

  // Update confidence based on consistency
  const variance = calculateVariance(userSkill.recentPerformance);
  userSkill.confidence = 1 - Math.min(1, variance);

  saveUserSkill(userId, category, userSkill);
}
```

### UI Changes

#### 1. Session Start - Adaptive Mode Toggle
```tsx
<div style={{ marginBottom: '1rem' }}>
  <label>
    <input
      type="checkbox"
      checked={adaptiveMode}
      onChange={(e) => setAdaptiveMode(e.target.checked)}
    />
    Adaptive Difficulty (adjusts to your skill level)
  </label>
</div>

{adaptiveMode && (
  <div style={{ marginLeft: '1.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
    <div>Your current level: {userLevel.toFixed(1)} / 5.0</div>
    <div>Target accuracy: {(targetAccuracy * 100).toFixed(0)}%</div>
  </div>
)}
```

#### 2. Session View - Difficulty Indicator
```tsx
{question.meta?.difficulty && (
  <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
    {[1, 2, 3, 4, 5].map(level => (
      <div
        key={level}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: level <= question.meta.difficulty
            ? theme.accent
            : theme.text + '22'
        }}
      />
    ))}
  </div>
)}
```

#### 3. User Stats - Skill Progress View
```tsx
<div>
  <h3>Skill Levels by Category</h3>
  {Object.entries(user.skillLevels).map(([category, skill]) => (
    <div key={category} style={{ marginBottom: '1rem' }}>
      <div>{category}: Level {skill.estimatedLevel.toFixed(1)}</div>
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: theme.panel,
        borderRadius: '4px'
      }}>
        <div style={{
          width: `${(skill.estimatedLevel / 5) * 100}%`,
          height: '100%',
          backgroundColor: theme.accent,
          borderRadius: '4px'
        }} />
      </div>
      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
        {skill.questionsAttempted} questions attempted
        • Confidence: {(skill.confidence * 100).toFixed(0)}%
      </div>
    </div>
  ))}
</div>
```

### Testing Requirements

#### Unit Tests (25+ tests)
- Weight calculation for different skill gaps
- Elo update algorithm
- Weighted sampling distribution
- Confidence calculation
- Edge cases (no history, perfect performance, etc.)

#### Integration Tests
- Full adaptive session creation
- Real-time skill updates during session
- Multiple categories handling
- Target accuracy adjustments

### Configuration

Add to `app.config.json`:
```json
{
  "adaptive": {
    "enabled": true,
    "defaultTargetAccuracy": 0.7,
    "adjustmentSpeed": 0.5,
    "minQuestionsForAdaptation": 5,
    "categoryDetection": "auto"
  }
}
```

### Migration

**New users**: Start with default skill level 2.5 (middle)
**Existing users**: Calculate initial skill level from `questionHistory`:
```typescript
function estimateInitialSkill(user: UserProfile): SkillLevels {
  const skills: SkillLevels = {};

  for (const [compositeKey, history] of Object.entries(user.questionHistory)) {
    const question = findQuestion(compositeKey);
    if (!question?.meta?.category) continue;

    const category = question.meta.category;
    if (!skills[category]) {
      skills[category] = {
        estimatedLevel: 2.5,
        confidence: 0,
        lastUpdated: new Date().toISOString(),
        questionsAttempted: 0,
        recentPerformance: []
      };
    }

    // Use historical performance to estimate
    const accuracy = history.timesCorrect / history.timesSeen;
    const questionDiff = question.meta.difficulty || 3;

    // Rough estimate: if user gets 80% right at diff 3, they're ~level 3.5
    skills[category].estimatedLevel += (accuracy - 0.5) * 2;
    skills[category].questionsAttempted += history.timesSeen;
  }

  // Normalize to 1-5 range
  for (const skill of Object.values(skills)) {
    skill.estimatedLevel = Math.max(1, Math.min(5, skill.estimatedLevel));
  }

  return skills;
}
```

### Concerns / Risks

1. **Cold Start**: New users/categories have no history. Start at middle difficulty, may be too easy/hard initially.

2. **Category Detection**: Questions must have `meta.category`. Uncategorized questions default to "general" category.

3. **Gaming the System**: Users could intentionally fail to get easier questions. Mitigate with minimum difficulty floor.

4. **Over-Adaptation**: Rapid skill updates might cause whiplash. Use smoothing and confidence thresholds.

5. **Prerequisite Enforcement**: Current spec allows prerequisites but doesn't enforce them. Future enhancement.

---

## Sprint 9 - Quiz Authoring UI

### Goals
Enable non-technical users to create and edit quizzes through a web interface without editing JSON files.

### Feature Requirements

#### 1. Quiz Authoring Interface

**Views**:
1. **Quiz List** - Browse existing quizzes, create new, import/export
2. **Quiz Editor** - Edit quiz metadata (title, description, tags)
3. **Question Editor** - Add/edit/delete/reorder questions
4. **Question Form** - Type-specific forms for each question type
5. **Preview Mode** - Take quiz as learner would see it
6. **Validation View** - Show errors/warnings before saving

#### 2. Quiz List View

**Features**:
- Table/grid showing all quizzes
- Search/filter by title, tags, author
- Sort by name, date created, # questions
- Actions: Edit, Duplicate, Delete, Export JSON
- "Create New Quiz" button
- Import quiz from JSON file

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│ Quiz Authoring                    [+ Create New]     │
├─────────────────────────────────────────────────────┤
│ Search: [____________]  Tags: [All ▾]  Sort: [Name ▾]│
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📝 Minecraft Basics                    [Edit]   │ │
│ │ 5 questions • Updated 2 days ago                │ │
│ │ Tags: minecraft, basics, kids                   │ │
│ │ [Duplicate] [Export] [Delete]                   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📝 Math Grade 2                        [Edit]   │ │
│ │ 12 questions • Updated 1 week ago               │ │
│ │ Tags: math, grade2                              │ │
│ │ [Duplicate] [Export] [Delete]                   │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### 3. Quiz Editor View

**Form Fields**:
```tsx
<form>
  <label>Quiz ID: <input value={quiz.id} disabled /></label>
  <label>Title: <input value={quiz.title} onChange={...} /></label>
  <label>Description: <textarea value={quiz.description} /></label>
  <label>Tags: <input value={quiz.tags.join(', ')} /></label>
  <label>Author: <input value={quiz.author} /></label>
  <label>Version: <input type="number" value={quiz.version} /></label>

  <h3>Questions ({quiz.questions.length})</h3>
  <QuestionList questions={quiz.questions} onReorder={...} />
  <button onClick={addQuestion}>+ Add Question</button>

  <div style={{ marginTop: '2rem' }}>
    <button onClick={saveQuiz}>Save Quiz</button>
    <button onClick={previewQuiz}>Preview</button>
    <button onClick={cancel}>Cancel</button>
  </div>
</form>
```

#### 4. Question List Component

**Features**:
- Drag-and-drop reordering
- Expand/collapse question details
- Quick edit/delete
- Duplicate question
- Visual indication of question type

**UI**:
```
┌────────────────────────────────────────────────────┐
│ ☰ Q1 • Multiple Choice Single          [↕] [✏️] [🗑️]│
│   Which animal can you tame?                       │
│   ✓ Validation passed                              │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ ☰ Q2 • True/False                       [↕] [✏️] [🗑️]│
│   You can sleep safely in the Nether...            │
│   ⚠️ Missing explanation                           │
└────────────────────────────────────────────────────┘
```

#### 5. Question Form (Type-Specific)

**Multiple Choice Single**:
```tsx
<div>
  <select value={questionType} onChange={handleTypeChange}>
    <option value="multiple_choice_single">Multiple Choice (Single)</option>
    <option value="multiple_choice_multi">Multiple Choice (Multiple)</option>
    <option value="true_false">True/False</option>
    <option value="fill_in_blank">Fill in the Blank</option>
    <option value="short_answer">Short Answer</option>
  </select>

  <label>Question ID: <input value={question.id} /></label>
  <label>Question Text: <textarea value={question.text} /></label>

  <h4>Choices</h4>
  {choices.map((choice, idx) => (
    <div key={idx}>
      <input value={choice} onChange={e => updateChoice(idx, e.target.value)} />
      <input type="checkbox" checked={correct.includes(idx)}
             onChange={e => toggleCorrect(idx)} />
      <button onClick={() => removeChoice(idx)}>Remove</button>
    </div>
  ))}
  <button onClick={addChoice}>+ Add Choice</button>

  <label>Explanation: <textarea value={question.explanation} /></label>

  <h4>Metadata</h4>
  <label>Difficulty (1-5): <input type="number" value={meta.difficulty} /></label>
  <label>Category: <input value={meta.category} /></label>

  <button onClick={saveQuestion}>Save Question</button>
  <button onClick={cancel}>Cancel</button>
</div>
```

**Fill in the Blank**:
```tsx
<div>
  <label>Question Text (use ________ for blank):</label>
  <textarea value={question.text} />

  <h4>Acceptable Answers</h4>
  {acceptableAnswers.map((answer, idx) => (
    <div key={idx}>
      {typeof answer === 'string' ? (
        <input value={answer} onChange={e => updateAnswer(idx, e.target.value)} />
      ) : (
        <>
          <input value={answer.value} onChange={...} />
          <label>
            <input type="checkbox" checked={answer.normalize} />
            Auto-normalize
          </label>
          <label>
            <input type="checkbox" checked={answer.caseSensitive} />
            Case sensitive
          </label>
        </>
      )}
      <button onClick={() => removeAnswer(idx)}>Remove</button>
    </div>
  ))}
  <button onClick={addSimpleAnswer}>+ Add Simple Answer</button>
  <button onClick={addAdvancedAnswer}>+ Add Advanced Answer</button>
</div>
```

#### 6. Validation System

**Client-Side Validation**:
```typescript
interface ValidationError {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
}

function validateQuiz(quiz: QuizSet): ValidationError[] {
  const errors: ValidationError[] = [];

  // Quiz-level validation
  if (!quiz.id) errors.push({
    severity: 'error',
    field: 'id',
    message: 'Quiz ID is required'
  });

  if (!quiz.title) errors.push({
    severity: 'error',
    field: 'title',
    message: 'Title is required'
  });

  if (quiz.questions.length === 0) errors.push({
    severity: 'error',
    field: 'questions',
    message: 'Quiz must have at least one question'
  });

  // Question-level validation
  const questionIds = new Set();
  quiz.questions.forEach((q, idx) => {
    if (!q.id) errors.push({
      severity: 'error',
      field: `questions[${idx}].id`,
      message: `Question ${idx + 1}: ID is required`
    });

    if (questionIds.has(q.id)) errors.push({
      severity: 'error',
      field: `questions[${idx}].id`,
      message: `Question ${idx + 1}: Duplicate ID "${q.id}"`
    });
    questionIds.add(q.id);

    if (!q.text) errors.push({
      severity: 'error',
      field: `questions[${idx}].text`,
      message: `Question ${idx + 1}: Text is required`
    });

    // Type-specific validation
    if (q.type === 'multiple_choice_single') {
      const mcq = q as MultipleChoiceSingleQuestion;
      if (!mcq.choices || mcq.choices.length < 2) errors.push({
        severity: 'error',
        field: `questions[${idx}].choices`,
        message: `Question ${idx + 1}: Need at least 2 choices`
      });

      if (!mcq.correct || mcq.correct.length === 0) errors.push({
        severity: 'error',
        field: `questions[${idx}].correct`,
        message: `Question ${idx + 1}: Must mark correct answer`
      });
    }

    // Warnings
    if (!q.explanation) errors.push({
      severity: 'warning',
      field: `questions[${idx}].explanation`,
      message: `Question ${idx + 1}: Consider adding an explanation`
    });

    if (!q.meta?.difficulty) errors.push({
      severity: 'info',
      field: `questions[${idx}].meta.difficulty`,
      message: `Question ${idx + 1}: Difficulty not set (needed for adaptive mode)`
    });
  });

  return errors;
}
```

**Validation UI**:
```tsx
{errors.length > 0 && (
  <div style={{
    padding: '1rem',
    marginBottom: '1rem',
    backgroundColor: hasErrors ? '#fee2e2' : '#fef3c7',
    borderRadius: '4px'
  }}>
    <h4>Validation Results:</h4>
    {errors.map((err, idx) => (
      <div key={idx} style={{ marginBottom: '0.5rem' }}>
        <span style={{ fontWeight: 'bold', color:
          err.severity === 'error' ? '#dc2626' :
          err.severity === 'warning' ? '#f59e0b' : '#3b82f6'
        }}>
          {err.severity.toUpperCase()}:
        </span>
        {' '}{err.message}
      </div>
    ))}
  </div>
)}
```

### API Endpoints

```typescript
// Quiz CRUD
GET    /api/author/quizzes              // List all quizzes
GET    /api/author/quizzes/:id          // Get quiz for editing
POST   /api/author/quizzes              // Create new quiz
PUT    /api/author/quizzes/:id          // Update quiz
DELETE /api/author/quizzes/:id          // Delete quiz
POST   /api/author/quizzes/:id/validate // Validate quiz

// Import/Export
POST   /api/author/import               // Import quiz from JSON
GET    /api/author/quizzes/:id/export   // Export quiz as JSON download
```

### File Management

**Auto-Save**:
- Save to temporary location during editing
- Move to `/quizzes` folder on explicit save
- Keep backup of previous version

**File Naming**:
```
/quizzes/
  minecraft_basics.v1.json     (published)
  minecraft_basics.v2.json     (published)
/quizzes/.drafts/
  minecraft_basics.draft.json  (work in progress)
/quizzes/.backups/
  minecraft_basics.v1.backup.json
```

### Implementation Components

**New Files**:
```
/src/ui/authoring/
  QuizAuthoringApp.tsx         // Main authoring interface
  QuizList.tsx                 // Quiz browser/list
  QuizEditor.tsx               // Quiz metadata editor
  QuestionList.tsx             // Sortable question list
  QuestionEditor.tsx           // Question form router
  QuestionForms/
    MultipleChoiceForm.tsx     // MC question form
    TrueFalseForm.tsx          // T/F question form
    FillInBlankForm.tsx        // FIB question form
    ShortAnswerForm.tsx        // SA question form
  ValidationPanel.tsx          // Show validation errors
  PreviewMode.tsx              // Quiz preview
/server/
  authoringService.ts          // Quiz file CRUD operations
```

### Testing Requirements

#### Unit Tests (40+ tests)
- Validation logic for all question types
- Quiz ID generation
- Duplicate detection
- File operations (save, load, delete)
- JSON import/export

#### Integration Tests
- Full quiz creation workflow
- Edit existing quiz
- Question reordering
- Validation before save
- Import/export round-trip

#### E2E Tests (Playwright/Cypress)
- Create quiz from scratch
- Add multiple question types
- Preview quiz
- Save and verify file created
- Edit and update quiz

### UI/UX Considerations

1. **Auto-Save**: Save to draft every 30 seconds, show "saving..." indicator
2. **Undo/Redo**: Maintain edit history for undo operations
3. **Keyboard Shortcuts**: Ctrl+S to save, Ctrl+Enter to add question, etc.
4. **Drag-and-Drop**: For question reordering, choice reordering
5. **Templates**: Pre-filled templates for common quiz patterns
6. **Duplicate Detection**: Warn if question text looks very similar to existing
7. **Rich Text**: Consider adding markdown support for formatting

### Migration & Deployment

**Access Control**:
- Add "authoring mode" toggle in config
- Optionally password-protect authoring interface
- Read-only vs. edit permissions

**Config**:
```json
{
  "authoring": {
    "enabled": true,
    "requireAuth": false,
    "autoSaveDrafts": true,
    "keepBackups": true,
    "maxBackupsPerQuiz": 5
  }
}
```

### Concerns / Risks

1. **File Conflicts**: Multiple users editing same quiz simultaneously. Needs locking or conflict detection.

2. **Large Quizzes**: 100+ question quizzes might have performance issues. Consider pagination.

3. **Accidental Deletion**: Need confirmation dialogs and backup system.

4. **Invalid JSON**: Users might manually edit files. Need robust error recovery.

5. **Mobile Editing**: Current design assumes desktop. Mobile authoring would need different UI.

6. **Accessibility**: Form-heavy interface needs ARIA labels, keyboard nav.

---

## Sprint Sequence Summary

**Sprint 7** (1-2 weeks): Fuzzy Matching & Improved Grading
- Low risk, high value
- Improves existing functionality
- No UI changes required (enhancements only)

**Sprint 8** (2-3 weeks): Adaptive Difficulty
- Medium complexity
- Requires careful algorithm tuning
- Significant UI additions

**Sprint 9** (3-4 weeks): Quiz Authoring UI
- Highest complexity
- Largest scope
- Most user-facing changes
- Consider breaking into 9a (basic CRUD) and 9b (advanced features)

**Total estimated time**: 6-9 weeks for all three features
