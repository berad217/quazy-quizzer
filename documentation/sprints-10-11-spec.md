# Sprints 10-11 Specification

Additional features to complete the Quazy Quizzer implementation.

---

## Sprint 10 - Quiz Preview Mode

### Goals
Allow quiz authors to preview their quiz as learners would experience it, without recording results or affecting user profiles.

### Current State Problem
- Authors must publish quiz and take it as a learner to see how it looks
- Taking the quiz pollutes user stats and question history
- No way to test quiz flow without side effects
- Hard to verify question display, explanation formatting, etc.

### Feature Requirements

#### 1. Preview Session Creation
**New API endpoint**:
```typescript
POST /api/author/quizzes/:id/preview
Body: {
  randomize?: boolean,
  limit?: number,
  adaptive?: boolean,
  targetAccuracy?: number
}
Response: { sessionId: string, questions: [...] }
```

**Behavior**:
- Creates ephemeral session (not saved to sessionStore)
- Uses quiz data directly from draft or published version
- Validates quiz before creating preview
- Supports all session options (randomize, limit, adaptive)
- Returns session-like structure for UI consumption

#### 2. Preview Mode UI
**Integration points**:
- Add "Preview" button in QuizEditor (next to "Publish")
- Preview opens quiz in QuizSession component
- Visual indicator showing "PREVIEW MODE" (banner/badge)
- Navigation shows "Exit Preview" instead of completion flow

**Preview restrictions**:
- Cannot submit/grade answers (read-only or mock grading)
- No data written to user profiles
- No skill level updates
- Session auto-deleted when exiting
- Warning if quiz has validation errors

#### 3. Preview Session Component
**Option A - Reuse QuizSession**:
```typescript
<QuizSession
  sessionId={previewSessionId}
  onExit={handleExitPreview}
  previewMode={true}  // NEW PROP
/>
```

**Option B - Separate PreviewSession**:
```typescript
<PreviewSession
  quiz={quizData}
  onExit={handleExitPreview}
  previewOptions={{ randomize, limit, adaptive }}
/>
```

**Recommendation**: Option A (reuse existing component with preview flag)

#### 4. Preview Mode Indicators
**Visual cues**:
- Yellow banner at top: "⚠️ PREVIEW MODE - Results will not be saved"
- Different accent color for preview mode (e.g., orange instead of green)
- "Exit Preview" button returns to editor
- Grading shows results but doesn't save
- Completion screen shows preview summary, no stats update

### Implementation Plan

#### Files to Create
```
server/
  previewService.ts          // Ephemeral preview session management
```

#### Files to Modify
```
server/app.ts                // Add preview endpoint
src/ui/authoring/QuizEditor.tsx   // Add preview button
src/ui/QuizSession.tsx       // Add previewMode prop and UI indicators
```

#### API Additions
```typescript
// server/previewService.ts
export function createPreviewSession(
  quiz: RawQuizData,
  options: SessionOptions
): Session {
  // Validate quiz
  // Create session structure (no persistence)
  // Return session data
}

// server/app.ts
app.post('/api/author/quizzes/:id/preview', async (req, res) => {
  const quiz = await authoringService.getQuizForEditing(req.params.id);
  const validation = await authoringService.validateQuizData(quiz);

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Cannot preview quiz with validation errors',
      errors: validation.errors.filter(e => e.severity === 'error')
    });
  }

  const session = createPreviewSession(quiz, req.body);
  res.json(session);
});
```

#### UI Changes
```typescript
// QuizEditor.tsx - Add preview button
<button onClick={handlePreview}>Preview Quiz</button>

const handlePreview = async () => {
  const response = await fetch(`/api/author/quizzes/${quiz.id}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ randomize, limit, adaptive, targetAccuracy })
  });

  const previewSession = await response.json();
  onEnterPreview(previewSession.id);
};

// QuizSession.tsx - Add preview mode
if (previewMode) {
  return (
    <>
      <PreviewBanner />
      {/* Regular quiz UI with grading disabled */}
    </>
  );
}
```

### Testing Requirements

#### Unit Tests
- previewService: session creation without persistence
- Validation before preview
- Session structure matches regular sessions

#### Integration Tests
- POST /api/author/quizzes/:id/preview creates session
- Preview session not in sessionStore
- Grading works but doesn't save
- Exit preview doesn't affect user stats

#### Manual Testing
- [ ] Preview quiz with validation errors (should block)
- [ ] Preview valid quiz (should load)
- [ ] Answer questions in preview mode
- [ ] Grade quiz in preview (results shown, not saved)
- [ ] Exit preview (returns to editor)
- [ ] Verify no user stats updated after preview
- [ ] Preview with adaptive mode enabled
- [ ] Preview with randomization

### Edge Cases
1. **Quiz has errors**: Block preview, show validation panel
2. **No questions**: Allow preview, show empty state
3. **User navigates away**: Preview session auto-deleted
4. **Preview while editing**: Use current draft state, not published
5. **Multiple previews**: Each gets unique session ID, old ones garbage collected

### Concerns/Risks
- **Memory leaks**: Preview sessions not cleaned up (need TTL or GC)
- **Session ID collisions**: Preview IDs must not conflict with real sessions
- **User confusion**: Preview vs real mode distinction must be very clear
- **Grading complexity**: Preview grading needs fuzzy matching but no persistence

---

## Sprint 11 - Skill Analytics Dashboard

### Goals
Visualize user skill progression over time with charts, trends, and insights for both learners and parents.

### Current State Problem
- Skill data exists but not visualized
- Users can't see their progress over time
- No way to compare categories
- Analytics functions in skillAnalytics.ts are unused
- Skill levels shown as numbers, not meaningful visualization

### Feature Requirements

#### 1. User Analytics View
**New view in main app**:
```
Start Screen
  → [View My Progress]  ← NEW BUTTON
    → Skill Analytics Dashboard
```

**Access control**:
- Accessible from SessionStart for selected user
- Shows data for current user only (no cross-user comparison yet)
- "Back to Main Menu" returns to start screen

#### 2. Dashboard Components

**Overview Panel**:
- Overall progress summary
- Total quizzes completed
- Total questions attempted
- Average accuracy across all categories
- Most improved category
- Most practiced category

**Skill Level Chart (by Category)**:
- Horizontal bar chart showing skill level (1-5) per category
- Color-coded by level: 1=red, 3=yellow, 5=green
- Shows confidence percentage next to each bar
- Number of questions attempted per category
- Click category to see details

**Skill Progression Over Time**:
- Line chart showing skill level changes over time
- One line per category (up to 5 categories shown)
- X-axis: time (sessions or dates)
- Y-axis: skill level (1-5)
- Hover shows exact values and date
- Filter to show single category or all

**Recent Performance**:
- Last 10 quiz sessions with scores
- Date, quiz name, score, questions attempted
- Color-coded: >80% green, 50-80% yellow, <50% red
- Click to review session (links to review mode)

**Insights Panel**:
- Generated insights from skillAnalytics.ts
- "You're improving in Math!" (positive trend)
- "Science needs practice" (low skill or declining)
- "Try harder History questions" (skill plateaued)
- Personalized recommendations

#### 3. Data Visualization Library
**Options**:
- **Recharts**: React-native charting, good docs
- **Chart.js with react-chartjs-2**: Popular, flexible
- **Victory**: Fully-featured, accessible
- **D3.js**: Maximum control, steep learning curve

**Recommendation**: Recharts (good balance of features and simplicity)

#### 4. Analytics API Endpoints

```typescript
// Get user analytics summary
GET /api/users/:id/analytics
Response: {
  overall: {
    quizzesCompleted: number,
    questionsAttempted: number,
    averageAccuracy: number
  },
  byCategory: {
    [category]: {
      skillLevel: number,
      confidence: number,
      questionsAttempted: number,
      trend: 'improving' | 'stable' | 'declining'
    }
  },
  recentSessions: [...],
  insights: string[]
}

// Get skill progression over time
GET /api/users/:id/analytics/progression?category=math&limit=20
Response: [
  { timestamp: string, category: string, skillLevel: number, confidence: number },
  ...
]
```

### Implementation Plan

#### Dependencies to Add
```json
{
  "recharts": "^2.10.0"
}
```

#### Files to Create
```
server/
  analyticsService.ts       // Analytics data aggregation

src/ui/analytics/
  AnalyticsDashboard.tsx    // Main dashboard view
  OverviewPanel.tsx         // Summary statistics
  SkillLevelChart.tsx       // Horizontal bar chart
  ProgressionChart.tsx      // Line chart over time
  RecentSessions.tsx        // Session list
  InsightsPanel.tsx         // Generated insights
```

#### Files to Modify
```
server/app.ts               // Add analytics endpoints
src/App.tsx                 // Add analytics view
src/ui/SessionStart.tsx     // Add "View Progress" button
```

#### Backend Implementation

```typescript
// server/analyticsService.ts
export async function getUserAnalytics(userId: string) {
  const user = await userService.getUser(userId);
  const sessions = sessionStore.getByUser(userId);

  // Calculate overall stats
  const overall = {
    quizzesCompleted: user.quizzesCompleted,
    questionsAttempted: Object.values(user.questionHistory)
      .reduce((sum, q) => sum + q.timesSeen, 0),
    averageAccuracy: calculateAverageAccuracy(user.questionHistory)
  };

  // Analyze by category
  const byCategory = {};
  for (const [cat, skill] of Object.entries(user.skillLevels)) {
    byCategory[cat] = {
      skillLevel: skill.estimatedLevel,
      confidence: skill.confidence,
      questionsAttempted: skill.questionsAttempted,
      trend: analyzeTrend(skill.recentPerformance)
    };
  }

  // Generate insights using skillAnalytics
  const insights = generateInsights(user);

  return { overall, byCategory, recentSessions: sessions, insights };
}

// Use existing skillAnalytics functions
import {
  detectSkillTrend,
  summarizeCategoryPerformance,
  generateProgressInsights
} from '../src/adaptive/skillAnalytics.js';
```

#### UI Implementation

```typescript
// AnalyticsDashboard.tsx
export function AnalyticsDashboard({ userId, onExit }: Props) {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}/analytics`)
      .then(res => res.json())
      .then(data => setAnalytics(data));
  }, [userId]);

  return (
    <div>
      <Header onExit={onExit} />
      <OverviewPanel data={analytics.overall} />
      <SkillLevelChart data={analytics.byCategory} />
      <ProgressionChart userId={userId} />
      <RecentSessions sessions={analytics.recentSessions} />
      <InsightsPanel insights={analytics.insights} />
    </div>
  );
}

// SkillLevelChart.tsx (using Recharts)
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export function SkillLevelChart({ data }: Props) {
  const chartData = Object.entries(data).map(([cat, stats]) => ({
    category: cat,
    skillLevel: stats.skillLevel,
    confidence: stats.confidence,
    fill: getColorForLevel(stats.skillLevel)
  }));

  return (
    <BarChart data={chartData} layout="vertical">
      <XAxis type="number" domain={[0, 5]} />
      <YAxis type="category" dataKey="category" />
      <Tooltip />
      <Bar dataKey="skillLevel" />
    </BarChart>
  );
}

// ProgressionChart.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export function ProgressionChart({ userId }: Props) {
  const [data, setData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const query = selectedCategory === 'all'
      ? ''
      : `?category=${selectedCategory}`;

    fetch(`/api/users/${userId}/analytics/progression${query}`)
      .then(res => res.json())
      .then(setData);
  }, [userId, selectedCategory]);

  // Group data by category for multiple lines
  const categories = [...new Set(data.map(d => d.category))];

  return (
    <>
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onChange={setSelectedCategory}
      />
      <LineChart data={data}>
        <XAxis dataKey="timestamp" />
        <YAxis domain={[1, 5]} />
        <Tooltip />
        <Legend />
        {categories.map(cat => (
          <Line
            key={cat}
            type="monotone"
            dataKey="skillLevel"
            data={data.filter(d => d.category === cat)}
            stroke={getCategoryColor(cat)}
            name={cat}
          />
        ))}
      </LineChart>
    </>
  );
}
```

### Testing Requirements

#### Unit Tests
- analyticsService data aggregation
- Trend detection (improving/stable/declining)
- Average accuracy calculation
- Insight generation

#### Integration Tests
- GET /api/users/:id/analytics returns correct data
- GET /api/users/:id/analytics/progression filters by category
- Analytics with no history (empty state)
- Analytics with single category vs multiple

#### Manual Testing
- [ ] View analytics for new user (no data)
- [ ] View analytics after completing quizzes
- [ ] Verify skill levels match user profile
- [ ] Check progression chart shows trends
- [ ] Verify insights are relevant
- [ ] Test category filtering
- [ ] Click recent session (opens review mode)
- [ ] View analytics for multiple users

### Visual Design Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Menu          📊 My Progress - John             │
├─────────────────────────────────────────────────────────────┤
│ Overview                                                     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│ │   15     │ │   120    │ │   78%    │ │   Math   │       │
│ │ Quizzes  │ │Questions │ │ Accuracy │ │Most Used │       │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│ Skill Levels by Category                                    │
│ Math        ████████████░░░░░░ 4.2/5.0 (87% confidence)    │
│ Science     ██████░░░░░░░░░░░░ 2.8/5.0 (62% confidence)    │
│ Geography   ███████████░░░░░░░ 3.7/5.0 (75% confidence)    │
│ History     ████░░░░░░░░░░░░░░ 1.9/5.0 (45% confidence)    │
├─────────────────────────────────────────────────────────────┤
│ Skill Progression Over Time                [Filter: All ▾] │
│ 5.0 ┤                                        ╭─Math         │
│ 4.0 ┤                          ╭────────────╯              │
│ 3.0 ┤        ╭────────╮────────╯         Geography         │
│ 2.0 ┤   ╭────╯        ╰Science                             │
│ 1.0 ┤───╯  History                                         │
│     └─────────────────────────────────────────────────────→│
│     Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct       │
├─────────────────────────────────────────────────────────────┤
│ Recent Sessions                                             │
│ • Math Quiz 101       85%  (12 questions)  Oct 15, 2025    │
│ • Science Basics      72%  (10 questions)  Oct 14, 2025    │
│ • Geography World     91%  (8 questions)   Oct 13, 2025    │
├─────────────────────────────────────────────────────────────┤
│ Insights & Recommendations                                  │
│ 🎉 You're improving in Math! (+0.8 skill this month)       │
│ 📚 History needs practice (only 6 questions attempted)      │
│ 🚀 Ready for harder Geography questions (95% accuracy)     │
└─────────────────────────────────────────────────────────────┘
```

### Edge Cases
1. **No quiz history**: Show empty state with "Complete quizzes to see your progress"
2. **Single quiz**: Show basic stats, note more data needed for trends
3. **Single category**: Only show that category, hide comparison
4. **Skill level 1.0 or 5.0**: Handle edge of scale gracefully
5. **Very long category names**: Truncate or wrap in chart
6. **100+ sessions**: Paginate or limit to recent N

### Concerns/Risks
- **Chart library size**: Recharts adds ~400KB bundle (acceptable for feature)
- **Performance with large datasets**: 1000+ questions could slow rendering
- **Data privacy**: Ensure analytics only show own data (no user comparison)
- **Insight quality**: Generated insights might be generic or unhelpful
- **Mobile responsiveness**: Charts may not work well on small screens

---

## Sprint Sequence

**Recommended order**: Sprint 10 → Sprint 11

**Rationale**:
- Preview mode directly benefits authoring workflow (test before publish)
- Analytics dashboard is end-user facing (learners/parents)
- Preview is smaller scope (~1-2 days), Analytics is larger (~3-4 days)
- Both are independent, can be done in any order

**Total estimated time**:
- Sprint 10: 1-2 days
- Sprint 11: 3-4 days
- Total: 4-6 days

---

## Post-Sprint 11 Enhancements

Potential future features beyond the spec:
1. **Multi-user comparison**: Compare progress with siblings/classmates
2. **Export reports**: Download analytics as PDF/CSV
3. **Goal setting**: Set skill level targets, track progress
4. **Streak tracking**: Track daily quiz completion streaks
5. **Badges/achievements**: Gamification elements
6. **Parent dashboard**: Aggregate view of all children's progress
7. **Scheduled quizzes**: Reminder system for regular practice
8. **Performance alerts**: Email when skill drops significantly
