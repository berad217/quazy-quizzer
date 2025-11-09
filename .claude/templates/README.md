# AI-Human Collaboration Templates

**Purpose**: Reusable templates for successful AI-human code collaboration
**Source**: Extracted from Quazy Quizzer project patterns
**Version**: 1.0

---

## What's Here

This folder contains templates and standards for working effectively with AI coding agents.

### Core Templates

| File | Purpose | When to Use |
|------|---------|-------------|
| `project-spec-template.md` | Technical specification template | Starting any new project |
| `testing-standards.md` | Testing framework guide | Reference during implementation |
| `devlog-entry-template.md` | Sprint journal entry format | After completing each sprint |
| `sprint-checklist.md` | Sprint completion checklist | Before marking sprint done |
| `ai-onboarding-template.md` | AI agent instructions | Once per project, customize for user |
| `handover-template.md` | Context reset document | When refreshing context window |
| `best-practices-ai-human-collab.md` | Complete workflow guide | Reference throughout project |

### Supporting Documents

| File | Purpose |
|------|---------|
| `README.md` | This file - template overview |

---

## How to Use These Templates

### Starting a New Project

**1. Write Your Spec**
- Copy `project-spec-template.md` to your project root as `SPEC.md` or `[project-name]-spec.md`
- Fill in all sections, especially:
  - Architecture
  - Data schemas (with JSON examples!)
  - Sprint plan
  - Testing requirements

**2. Set Up .claude/ Folder**
```bash
mkdir .claude
```

**3. Create Onboarding Doc**
- Copy `ai-onboarding-template.md` to `.claude/onboarding.md`
- Customize for your working style
- This is reusable across your projects (copy your customized version)

**4. Create Project Context**
- Create `.claude/project-context.md` with:
  - Project name and tech stack
  - Current sprint
  - Key decisions
  - What to read for onboarding

**5. Initialize DEVLOG**
- Create `DEVLOG.md` in project root
- Use `devlog-entry-template.md` format for each sprint

---

### During Implementation

**Each Sprint:**

1. **Implement** following spec
2. **Test** using `testing-standards.md` guidance
3. **Document** using `devlog-entry-template.md`
4. **Verify** using `sprint-checklist.md`
5. **Commit** everything together

**Reference:**
- `testing-standards.md` - Which framework? What type of test?
- `best-practices-ai-human-collab.md` - Workflow questions

---

### Managing Context

**When Approaching 70-75% Token Usage:**

1. Copy `handover-template.md` to `.claude/current-handover.md`
2. Fill in all sections:
   - What was accomplished
   - Current state
   - Decisions made
   - Next steps
3. Start new AI session
4. New AI reads `.claude/` docs to catch up

---

## Template Philosophy

These templates follow key principles:

**1. Concrete Over Abstract**
- Show JSON examples, not just describe
- Provide actual file trees
- Give specific commands

**2. Progressive Disclosure**
- Quick start info first
- Details available when needed
- Cross-reference related docs

**3. Honest Assessment**
- Document risks and concerns
- No sugarcoating
- "User can handle the truth"

**4. Separation of Concerns**
- Spec: What to build
- DEVLOG: How it was built
- Handover: Current state
- Onboarding: How to work together

**5. Test-Driven**
- Testing requirements defined upfront
- Tests part of "done"
- Framework selection standardized

---

## Customization

**You should customize:**
- `ai-onboarding-template.md` - Match your working style
- `project-spec-template.md` - Adjust sections for your domain
- `devlog-entry-template.md` - Add/remove sections as needed

**Don't change the core structure** - keep the sections, just adapt content.

---

## Real Example

See the Quazy Quizzer project (parent directory) for these templates in action:

- `../local_quiz_engine_spec_with_workflow.md` - Full spec following template
- `../DEVLOG.md` - Sprint entries using devlog template
- `../.claude/onboarding.md` - Customized AI onboarding
- `../.claude/current-handover.md` - Active handover doc

---

## Quick Start for Next Project

**Copy these to new project:**

```bash
# In your new project root:
mkdir .claude

# Copy and customize:
cp quazy-quizzer/.claude/templates/project-spec-template.md ./SPEC.md
cp quazy-quizzer/.claude/templates/ai-onboarding-template.md ./.claude/onboarding.md
cp quazy-quizzer/.claude/templates/handover-template.md ./.claude/handover-template.md

# Create empty DEVLOG:
touch DEVLOG.md

# Copy your customized onboarding (if you made one):
cp quazy-quizzer/.claude/onboarding.md ./.claude/onboarding.md
```

**Then:**
1. Fill in SPEC.md
2. Customize .claude/onboarding.md (or use your existing one)
3. Start first sprint
4. Use devlog-entry-template.md for Sprint 1 entry

---

## Template Evolution

**These templates should evolve based on experience.**

After each project:
1. Review what worked / didn't work
2. Update templates with learnings
3. Add examples of common patterns
4. Remove sections that weren't useful

**Version control your improvements** - keep templates in git.

---

## FAQ

**Q: Do I need all these templates for a small project?**
A: Minimum viable:
- Spec (even if brief)
- DEVLOG (even one entry)
- Testing approach (even if simple)

**Q: Can I modify the templates?**
A: Yes! Customize for your needs. Core structure is guidance, not rigid rules.

**Q: What if I'm not using sprints?**
A: Adapt DEVLOG to milestones or features instead. Keep the decision documentation pattern.

**Q: Do I need .claude/ folder if not using Claude?**
A: Useful for any AI. Just rename to `.ai/` or similar if preferred.

**Q: How often to update handover doc?**
A: At 70-75% context window, or before breaks, or after milestones.

---

## Success Stories

**Quazy Quizzer (First Project Using Templates):**
- Sprint 1 complete in single session
- 32 tests written alongside implementation
- All decisions documented in DEVLOG
- Clean module boundaries maintained
- Handover docs enabled smooth context reset

**Key learnings:**
- Spec examples (JSON) prevented ambiguity
- Testing standards saved decision time
- DEVLOG preserved rationale for decisions
- Sprint checklist caught missing work

---

## Contributing

Found a better pattern? Improve these templates!

**Process:**
1. Try improvement in real project
2. If it works better, update template
3. Document what changed and why
4. Update version number

**Share back:**
- Templates are for YOUR use
- But sharing improvements helps everyone
- Consider contributing to community resources

---

## License

These templates are extracted from real project experience. Use freely, modify as needed, share improvements.

No attribution needed, but appreciated!

---

## Credits

**Extracted from:** Quazy Quizzer project (Sprint 1)
**Patterns observed:** Nov 2025
**Collaboration:** Human (hobbyist) + Claude Code (AI agent)

**Philosophy:** "What worked well in practice" > "What sounds good in theory"

---

## Version History

- **1.0** (2025-11-08): Initial extraction from Quazy Quizzer
  - All core templates created
  - Testing standards documented
  - Best practices guide written
  - Based on successful Sprint 1 patterns

---

**Next:** Use these templates on your next project and refine based on experience!
