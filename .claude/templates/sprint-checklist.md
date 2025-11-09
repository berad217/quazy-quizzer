# Sprint Completion Checklist

Use this checklist to verify a sprint is truly complete before moving to the next one.

---

## Sprint [N]: [Name]

### Implementation
- [ ] All features from sprint plan implemented
- [ ] Code follows spec requirements
- [ ] Module boundaries respected (no "epoxy" coupling)
- [ ] Error handling included
- [ ] Edge cases considered

### Testing
- [ ] Unit tests written for all business logic
- [ ] Integration tests written for all APIs/services
- [ ] Component tests written for all UI components (if applicable)
- [ ] All tests passing (`npm test` shows 100% pass)
- [ ] No tests skipped or commented out (`.skip()` or `xit()`)
- [ ] Test coverage meets requirements (typically 80%+ for core logic)
- [ ] Tests use clear, descriptive names ("should ...")
- [ ] Mocks used appropriately (external deps only, not internal logic)

### Documentation
- [ ] DEVLOG.md updated with sprint entry
  - [ ] Summary section complete
  - [ ] Decisions documented with rationale
  - [ ] Testing section with numbers and coverage
  - [ ] Questions section (even if "none")
  - [ ] Concerns/risks honestly assessed (even if "none identified")
  - [ ] Next sprint preview included
- [ ] README.md updated if user-facing changes
- [ ] Code comments added for complex logic
- [ ] API documentation updated (if applicable)

### Code Quality
- [ ] No hardcoded values that should be in config
- [ ] No console.log() or debug code left in
- [ ] TypeScript types properly defined (if using TS)
- [ ] Linter passing (if project has linter)
- [ ] Build successful (`npm run build` works)

### Git
- [ ] All files staged (`git add`)
- [ ] Clear, descriptive commit message
- [ ] Commit includes both implementation AND tests
- [ ] Pushed to remote branch
- [ ] No untracked files left

### Review
- [ ] Re-read the spec section for this sprint
- [ ] Confirm all requirements met
- [ ] Manual testing performed (if applicable)
- [ ] No known bugs or issues

---

## Commit Message Template

Use this format for sprint completion commits:

```
Sprint [N] - [Title]

Implemented:
- [Feature/component description]
- [Feature/component description]
- [Infrastructure/setup description]

Technical decisions:
- [Decision]: [Brief rationale]
- [Decision]: [Brief rationale]

Testing:
- [X] unit tests for [modules]
- [X] integration tests for [APIs]
- [X] component tests for [UI]
All tests passing ✓

See DEVLOG.md Sprint [N] entry for detailed notes.
```

**Example:**
```
Sprint 1 - Skeleton & Config

Implemented:
- Project structure with React + TypeScript + Vite + Express
- Config module with types, defaults, and deep merge logic
- Express server with config API endpoint
- Basic React frontend that loads and displays config

Technical decisions:
- Using Vite for fast dev experience
- ES modules throughout for consistency
- Server-side config loading with API endpoint
- Vitest for testing (integrates with Vite)

Testing:
- 16 unit tests for config module
- 8 integration tests for Express API
- 8 component tests for React app
All tests passing ✓

See DEVLOG.md Sprint 1 entry for detailed notes.
```

---

## Red Flags: Sprint NOT Complete

❌ **Tests failing** - Don't move forward with broken tests
❌ **Tests missing** - "I'll add tests later" = technical debt
❌ **DEVLOG not updated** - Decisions will be forgotten
❌ **Concerns hidden** - Honesty now prevents problems later
❌ **Uncommitted files** - Work could be lost
❌ **Vague commit message** - Future you won't understand what was done
❌ **Features half-done** - Either finish or remove from this sprint
❌ **"It mostly works"** - Either it works or it doesn't
❌ **Hardcoded test data** - Proper fixtures needed
❌ **Skipped parts of spec** - Unless explicitly agreed with user

**If any red flags exist, the sprint is NOT complete!**

---

## Green Flags: Sprint IS Complete

✅ All tests passing
✅ DEVLOG entry thorough and honest
✅ Code committed and pushed
✅ Can demo the feature working
✅ User could take over from here
✅ No known bugs or issues
✅ Spec requirements met
✅ You're confident to move forward

**When all green flags present, sprint is complete!**

---

## Between Sprints

After completing checklist:

1. **Take a breath** - Don't rush into next sprint
2. **Review DEVLOG** - Does next sprint make sense given what you learned?
3. **Check concerns** - Do any Sprint N concerns affect Sprint N+1 plan?
4. **Update handover** - If context window getting full (>70%), update handover doc

---

## Special: Final Sprint Checklist

For the last sprint (usually polish/packaging):

Additional items:
- [ ] All previous sprint concerns addressed or documented
- [ ] E2E tests for critical user flows (if applicable)
- [ ] Performance acceptable
- [ ] Security review done (no secrets in code, input validation, etc.)
- [ ] README complete with installation and usage
- [ ] Build process documented
- [ ] Deployment/distribution steps documented (if applicable)
- [ ] Known limitations documented
- [ ] Future enhancements listed (parking lot)

---

## Using This Checklist

### As an AI Agent:
1. Copy this checklist at start of each sprint
2. Check items off as you go
3. Don't mark sprint complete until ALL items checked
4. If stuck on any item, ask user for clarification

### As a Human:
1. Review this checklist before telling AI to move to next sprint
2. Spot-check a few items (especially tests and DEVLOG)
3. Trust but verify - run `npm test` yourself occasionally

---

**Remember**: Sprints are complete when they're COMPLETE, not when you're tired of working on them.

Taking the time to finish properly saves time later!
