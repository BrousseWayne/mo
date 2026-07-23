# User Frontend + Cook/Dev Dashboard — Implementation Plan

> **Status 2026-07-23**: `apps/client/` built in reduced scope (intake wizard,
> dashboard, check-in, meal plan, training logging) per ROADMAP_2026-07.md item
> 1.9. Program creation goes through `POST /programs/from-artifacts` (no LLM),
> not the pipeline flow described below. `apps/kitchen/`, the progress/photos/
> calendar/settings pages, and the "New API Endpoints" section remain unbuilt —
> deferred until one real usage cycle has happened.

## Context

The admin dashboard (`apps/web/`) is complete with 8 pages including System Map. Backend has ~68 endpoints across 28 route files. But there is **no user-facing frontend** and **no cook/dev dashboard**. The backend API is 95% complete — the frontend is 0%.

Two new apps needed:
- **`apps/client/`** — Mobile-first web app for the coached person (intake, dashboard, check-in, meals, training, progress)
- **`apps/kitchen/`** — Desktop-first dashboard for the cook/partner + developer (recipes, batch planner, ingredients, macro compliance)

## Architecture

### Three Separate Apps

| App | Port | Target | Theme |
|-----|------|--------|-------|
| `apps/web/` (exists) | 5173 | Admin/developer | Dark |
| `apps/client/` (new) | 5174 | Coached person | Light, warm |
| `apps/kitchen/` (new) | 5175 | Cook/partner + dev | Light, clean |

All share: React 19 + Vite + react-router v7 + `@mo/shared` types. No shared UI package — copy the small utility patterns (~5 files, <50 lines each) per app.

### New API Endpoints (4 new route files)

| Endpoint | File | Purpose |
|----------|------|---------|
| `GET /knowledge/cuisines` | `knowledge.ts` | 9 cuisine profiles for kitchen reference |
| `GET /knowledge/shakes` | `knowledge.ts` | 4 shake recipes for shake builder |
| `GET /foods/search?q=X` | `foods.ts` | USDA food search for ingredient lookup |
| `GET /foods/:fdcId` | `foods.ts` | Single food detail with macros/micros |
| `GET /programs/:id/notification-preferences` | `notification-prefs.ts` | Read notification prefs |
| `PATCH /programs/:id/notification-preferences` | `notification-prefs.ts` | Update notification prefs |
| Add `slot` + `protein` filters | `recipes.ts` (modify) | Extended recipe search |

---

## `apps/client/` — User Frontend

### Routes

```
/intake              → IntakeWizardPage (full-screen, no bottom nav)
/                    → DashboardPage
/checkin             → CheckinPage
/meals               → MealPlanPage
/meals/:recipeId     → RecipeDetailPage
/meals/shopping      → ShoppingListPage
/meals/batch         → BatchCookingPage
/training            → TrainingWeekPage
/training/:sessionId → TrainingSessionPage
/progress            → ProgressPage
/progress/photos     → PhotosPage
/calendar            → CalendarPage
/settings            → SettingsPage
```

### File Structure

```
apps/client/
  package.json, tsconfig.json, vite.config.ts, index.html
  src/
    main.tsx, App.tsx
    api/client.ts                     # apiFetch + apiMutate
    hooks/use-query.ts, use-mutation.ts, use-program.ts
    context/ProgramContext.tsx         # Active programId from localStorage
    layouts/ClientLayout.tsx           # Bottom nav (mobile) + sidebar (desktop)
    styles/global.css, intake.css
    components/
      BottomNav.tsx, ProgressRing.tsx, MacroBar.tsx, SliderInput.tsx,
      StepIndicator.tsx, MealSlotCard.tsx, ExerciseLogRow.tsx,
      MilestoneCard.tsx, WeightChart.tsx, MeasurementChart.tsx,
      PhotoUploader.tsx, DayCell.tsx
    pages/
      intake/
        IntakeWizardPage.tsx           # 8-section wizard orchestrator
        sections/                      # BasicInfo, Anthropometrics, Training,
          BasicInfoSection.tsx         # Nutrition, Cycle, Lifestyle, Medical,
          ...8 sections total          # Preferences
      DashboardPage.tsx, CheckinPage.tsx, MealPlanPage.tsx,
      RecipeDetailPage.tsx, ShoppingListPage.tsx, BatchCookingPage.tsx,
      TrainingWeekPage.tsx, TrainingSessionPage.tsx, ProgressPage.tsx,
      PhotosPage.tsx, CalendarPage.tsx, SettingsPage.tsx
```

### Key Pages

**Intake Wizard**: 69 questions across 8 sections. Multi-step form with progress indicator, per-section validation. POSTs to `/intake` then `/programs`. Full-screen (no bottom nav).

**Dashboard**: Progress ring (current vs target weight), KPI row (weekly rate, compliance %, days, phase, tier), recent adjustments with explanations, milestone celebrations, quick links.

**Check-in**: Weight (required) + optional waist/hip, cycle phase/day, training compliance, subjective markers (1-10 sliders), notes. Shows trigger results after submit.

**Meal Plan**: Day tabs + vertical meal slot list (mobile). Tap meal for recipe. Alternatives per slot. Shopping list + batch cooking links.

**Training Session**: Active workout mode — exercise list with set/rep/weight/RPE inputs. Progression arrows. Complete/skip buttons.

**Progress**: Weight chart (actual + projected + target), measurement charts, milestone timeline. Recharts.

### Design: Mobile-first, warm light theme

- Bottom nav: 5 tabs (Dashboard, Meals, Training, Progress, More)
- Touch targets: min 44px
- Cards: `border-radius: 12px`
- Macro colors: protein `#5b8def`, carbs `#e9c46a`, fat `#e76f51`
- Weight gain framed positively throughout

---

## `apps/kitchen/` — Cook/Dev Dashboard

### Routes

```
/                    → RecipeBrowserPage
/recipes/:id         → RecipeDetailPage
/batch               → BatchPlannerPage
/grid                → MealGridPage
/ingredients         → IngredientLookupPage
/compliance          → MacroCheckerPage
/reference           → TechniqueReferencePage
/shakes              → ShakeBuilderPage
```

### File Structure

```
apps/kitchen/
  package.json, tsconfig.json, vite.config.ts, index.html
  src/
    main.tsx, App.tsx
    api/client.ts
    hooks/use-query.ts, use-mutation.ts
    layouts/KitchenLayout.tsx          # 240px fixed sidebar (desktop)
    styles/global.css, print.css
    components/
      RecipeCard.tsx, MacroBadge.tsx, CuisineTag.tsx, ComplianceDot.tsx,
      TimelineBar.tsx, IngredientRow.tsx, ToleranceGauge.tsx,
      PrintButton.tsx, PantryTable.tsx, PriceChart.tsx, ShakeConfigurator.tsx
    pages/
      RecipeBrowserPage.tsx, RecipeDetailPage.tsx, BatchPlannerPage.tsx,
      MealGridPage.tsx, IngredientLookupPage.tsx, MacroCheckerPage.tsx,
      TechniqueReferencePage.tsx, ShakeBuilderPage.tsx
```

### Key Pages

**Recipe Browser**: Search/filter by cuisine (9), protein source, meal slot, prep time. Card grid with macro badges.

**Batch Planner**: Sunday Batch A + Wednesday Batch B. Visual horizontal timeline of parallel tasks (oven/stovetop/assembly). Protein weights, temps, cook times, sauce recipes, container labeling guide. **Print-friendly**.

**Meal Grid**: 7-day x 5-slot grid. Cuisine color stripes. Batch source labels. Compliance dots (green/yellow/red for +-10% macro match).

**Ingredient Lookup**: 3 tabs — USDA search, pantry inventory (CRUD), price tracking.

**Macro Checker**: Pick recipe or day → see macro breakdown vs slot spec or daily target. Tolerance visualization with +-10% shaded zone.

**Technique Reference**: Cooking techniques, 9 cuisine flavor kits (aromatics/fats/acids), seasoning stack builder.

**Shake Builder**: 4 base recipes, scale slider (0.5x-1x), booster add-ons with running macro total.

### Design: Desktop-first, clean light theme

- Fixed sidebar, `max-width: 1200px` content
- Cuisine colors: japanese `#c62828`, mexican `#ef6c00`, french `#1565c0`, korean `#d84315`, thai `#2e7d32`, indian `#f9a825`, mediterranean `#00838f`, chinese `#ad1457`, italian `#558b2f`
- Print stylesheet for batch planner
- `@media print` hides sidebar, black on white

---

## Implementation Sequence (10 Batches)

### Batch 1: Scaffold + New API Routes
- Scaffold both `apps/client/` and `apps/kitchen/` (package.json, vite, tsconfig, index.html)
- Create api/client.ts, hooks (use-query, use-mutation), layouts, global.css for both
- Add 4 new API route files (knowledge, foods, notification-prefs) + extend recipes filters
- Verify: both apps start, proxy works

### Batch 2: Client — Intake Wizard
- IntakeWizardPage + 8 section components + StepIndicator + SliderInput
- Maps 69 questions from intake-questionnaire.md
- POSTs intake data, creates program, redirects to dashboard

### Batch 3: Kitchen — Recipe Browser + Detail
- RecipeBrowserPage (filters + card grid) + RecipeDetailPage
- RecipeCard, MacroBadge, CuisineTag, IngredientRow components

### Batch 4: Client — Dashboard + Check-in
- ProgramContext (stores active programId)
- DashboardPage (progress ring, KPIs, adjustments, milestones)
- CheckinPage (form + trigger results)
- ProgressRing, MacroBar, MilestoneCard components

### Batch 5: Kitchen — Batch Planner + Meal Grid
- BatchPlannerPage (visual timeline + print)
- MealGridPage (7x5 grid + compliance dots)
- TimelineBar, ComplianceDot, PrintButton + print.css

### Batch 6: Client — Meal Plan + Training
- MealPlanPage, RecipeDetailPage, ShoppingListPage, BatchCookingPage
- TrainingWeekPage, TrainingSessionPage
- MealSlotCard, ExerciseLogRow components

### Batch 7: Kitchen — Ingredients + Compliance + Shakes
- IngredientLookupPage (USDA search, pantry CRUD, prices)
- MacroCheckerPage (recipe/day compliance)
- ShakeBuilderPage (4 recipes, scaling, boosters)
- PantryTable, ToleranceGauge, ShakeConfigurator

### Batch 8: Client — Progress + Photos + Calendar + Settings
- ProgressPage (weight/measurement charts, milestones)
- PhotosPage (upload, gallery, side-by-side)
- CalendarPage (week/month view, iCal export)
- SettingsPage (pause/resume, notifications, disruptions)
- WeightChart, MeasurementChart, PhotoUploader, DayCell

### Batch 9: Kitchen — Technique Reference + Polish
- TechniqueReferencePage (techniques, cuisine kits, seasoning builder)
- Polish pass: verify all routes, error/empty/loading states, mobile responsive, print

### Batch 10: Integration + Turbo Config
- Verify `pnpm dev` starts all 4 servers (API + 3 frontends)
- `pnpm build` compiles all
- Smoke test: intake → dashboard → check-in → meal plan
- Smoke test: recipe browse → detail → batch plan

### Dependency Graph

```
Batch 1 (Infrastructure)
  ├── Batch 2 (Client: Intake) → Batch 4 (Dashboard+Checkin) → Batch 6 (Meals+Training) → Batch 8 (Progress+Settings)
  ├── Batch 3 (Kitchen: Recipes) → Batch 5 (Batch+Grid) → Batch 7 (Ingredients+Compliance) → Batch 9 (Reference+Polish)
  └── Batch 10 (Integration) — after all above
```

Parallel pairs: 2+3, 4+5, 6+7, 8+9.

## Verification

After each batch:
- `pnpm build` compiles all packages
- `npx tsc --noEmit` for both apps
- `pnpm dev` starts all servers
- Manual navigation of new pages, verify API data loads

Final:
- Full intake wizard flow → program created → dashboard populated
- Check-in submission → triggers display
- Meal plan grid → recipe detail → shopping list
- Training week → session logging → mark complete
- Kitchen: recipe search → batch plan → print
- Kitchen: ingredient search → pantry CRUD → macro compliance check
