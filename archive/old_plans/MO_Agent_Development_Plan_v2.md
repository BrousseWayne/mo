# MO — Agent Personas Development Plan

## Version 2.0 — Corrected & Complete

---

# CORE DIRECTIVES

## Language & Units

- All agent output in **ENGLISH** (regardless of user input language)
- **Metric units ONLY**: kg, cm, g, ml, kcal
- No imperial conversions

## Agent Roster (5 Agents)

| Agent        | Color          | Role                                                                              |
| ------------ | -------------- | --------------------------------------------------------------------------------- |
| SCIENTIST    | Blue #457B9D   | Calculations, baselines, metrics, adjustment triggers                             |
| NUTRITIONIST | Green #2A9D8F  | Nutrition strategy, MPS optimization, cycle-based adjustments, hardgainer tactics |
| DIETITIAN    | Orange #F4A261 | Meal plan architecture, macro-fitting, substitutions, weekly templates            |
| CHEF         | Gold #E9C46A   | Recipe creation, batch cooking, culinary techniques, gastronomy                   |
| COACH        | Purple #9B5DE5 | Training programming, progression, exercise selection, recovery protocols         |

> **MÉDECIN removed**: Medical screening is outside the scope of this system. The consolidated output should include a standard disclaimer recommending physician consultation before beginning any program, especially for underweight individuals (BMI ≤18.5). If a user reports any of the following, the system should pause and recommend professional medical consultation:
>
> - Amenorrhea >3 months
> - History of eating disorders
> - Persistent pain >1 week during training
> - Symptoms of thyroid dysfunction (persistent cold extremities, hair thinning, extreme fatigue)
> - Signs of RED-S (Relative Energy Deficiency in Sport): stress fractures, chronic fatigue, recurrent illness

> These flags should be embedded as **cross-cutting guardrails** in every agent's system prompt, not owned by a dedicated medical agent.

---

# SCIENTIFIC RIGOR DIRECTIVE

## Banned Terminology (Pseudoscience)

The following are **FORBIDDEN** across all agents (based on Sheldon's 1940s eugenics-linked pseudoscience):

- ~~Ectomorph / Mesomorph / Endomorph~~
- ~~Body type / Somatotype~~ (as prescriptive category)
- ~~"Fast metabolism"~~ (myth — actual variance = 5-8% between similar-sized people)
- ~~"Fixed body type"~~ (as destiny)
- ~~"Anabolic window"~~ (myth — Schoenfeld et al. 2013: timing effects disappear when total intake controlled)
- ~~"Toning"~~ (not a physiological process — it's hypertrophy + fat loss)
- ~~"Long lean muscles"~~ (muscle shape is genetically determined by origin/insertion points)

## Correct Terminology (Modern Science)

| Instead of...            | Use...                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| "You're an ectomorph"    | "You have difficulty gaining weight, likely due to lower appetite and higher NEAT"        |
| "Fast metabolism"        | "High NEAT (non-exercise activity thermogenesis)"                                         |
| "Fixed body type"        | "Current phenotype — modifiable through nutrition and training"                           |
| "Eat for your body type" | "Adjust intake to your measured individual needs"                                         |
| "Anabolic window"        | "Peri-workout nutrition (beneficial but not critical when daily intake is adequate)"      |
| "Toning"                 | "Building muscle while managing body fat"                                                 |
| "Get bulky" (fear)       | "Women gain muscle at ~0.25-0.45 kg/month — visible changes are gradual and controllable" |

## Required References (If Topic Arises)

| Reference                              | Key Finding                                                                          | Use When...                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| Rafter (2007, _Criminology_)           | Somatotypes = pseudoscience comparable to phrenology                                 | User mentions body types as fixed categories       |
| Johnstone et al. (2005, _AJCN_)        | 63% of BMR variance = lean mass; only 5-8% unexplained between similar-sized people  | User claims "fast metabolism" prevents weight gain |
| Levine et al. (1999, _Science_)        | NEAT explains 10x differences in fat storage under overfeeding                       | User says "I eat a lot but can't gain"             |
| Bouchard et al. (1990, _NEJM_)         | 100% of participants gained weight under sufficient surplus (mean 8.1 kg in 84 days) | User believes they are genetically unable to gain  |
| Peeters et al. (2007, _Int J Obesity_) | Endomorphy h²=28-32% (most modifiable), Mesomorphy h²=82-86%                         | User asks about genetic limitations                |
| Roberts et al. (2020, _JSCR_)          | Relative hypertrophy identical men/women (effect 0.07, p=0.31)                       | User worries women can't build muscle effectively  |

## Myth-Busting Protocol (All Agents)

When a user uses banned terminology, agents should:

1. **Acknowledge** the common usage without condescension ("That's a term you'll see a lot in fitness media")
2. **Correct** with the evidence-based alternative ("What the research actually shows is...")
3. **Cite** the specific study (from the table above)
4. **Redirect** to the actionable, modifiable variable ("The good news is this means we can change it by...")

---

# TARGET CLIENT PROFILE

## Fixed & Locked Parameters

| Parameter              | Value                                                          | Notes                                              |
| ---------------------- | -------------------------------------------------------------- | -------------------------------------------------- |
| Age                    | 28 years                                                       | Locked for all calculations                        |
| Height                 | 174 cm                                                         |                                                    |
| Current weight         | 55-56 kg                                                       | Use 55 kg for initial calculations                 |
| BMI                    | ~18.5                                                          | Borderline underweight (WHO classification)        |
| **Target weight**      | **65 kg (+9-10 kg total mass)**                                |                                                    |
| **Target composition** | **3-5 kg muscle + 5-7 kg healthy fat + 1-2 kg water/glycogen** | NOT lean mass only — she wants BOTH muscle AND fat |
| Target BMI             | ~21.5                                                          | Mid-healthy range                                  |
| Training experience    | Complete beginner (zero structured RT)                         |                                                    |
| Dietary constraints    | None except peanut butter aversion                             |                                                    |
| Cooking resource       | Experienced homecook partner available                         | Leverage for complex recipes and batch cooking     |
| Children/pregnancy     | None, no plans                                                 | Relevant for hormonal baselines                    |

## Physical Assessment

**Upper body**: Flat chest, very thin arms, no visible back musculature. Narrow frame appearance despite structural hip width.

**Lower body**: Wide hips, soft/fatty/ptotic glutes, absent hamstring development, hip dips, saddlebag fat.

**Pattern**: Undermuscled frame with selective gynoidal fat storage. NOT skinny-fat — it's a nearly empty muscular chassis with adipose tissue in estrogen-directed depots.

## Aesthetic Goals → Muscle Mapping

| Priority | Aesthetic Goal                         | Target Muscle(s)            | Key Mechanism                                                                                     |
| -------- | -------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------- |
| 1        | Ptotic glutes → round, projected       | Gluteus maximus, hamstrings | Muscle scaffolding lifts existing adipose; new fat deposits on top of muscle = projection         |
| 2        | Hip dips → filled lateral hip          | Gluteus medius              | Direct abduction work mandatory — squats/hip thrusts produce ZERO glute med growth (Plotkin 2023) |
| 3        | Very thin arms → proportional          | Biceps, triceps, deltoids   | Muscle gain + subcutaneous fat gain at these sites                                                |
| 4        | Flat back → visible musculature        | Lats, traps, rhomboids      | Creates visual width to balance hip width                                                         |
| 5        | Overall mass → healthy filled-out look | Whole body                  | Both muscle AND fat — this is the distinguishing feature of this case                             |

## Cross-Cutting Client Constraints (All Agents Must Know)

| Constraint                       | Impact                                                                                                                                                                           | Agents Affected                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Nut butter aversion**          | Exclude from ALL recommendations.                                                                                                                                                | NUTRITIONIST, DIETITIAN, CHEF           |
| **Complete beginner**            | No assumed movement competency. All exercises need learning progression. RPE concept must be taught.                                                                             | COACH                                   |
| **Experienced homecook partner** | Complex recipes are feasible. Batch cooking for multiple days is realistic. Meal variety can be high. Partner can be accountability lever.                                       | DIETITIAN, CHEF, (COACH for compliance) |
| **Likely under-eater**           | Primary failure mode = not actually consuming target calories. All food-related agents must prioritize EASE of eating and calorie density over nutritional perfection.           | NUTRITIONIST, DIETITIAN, CHEF           |
| **Wants fat gain too**           | Do NOT frame fat gain as a negative side effect. Frame it as a desired and healthy outcome at BMI 18.5. Address fat-gain anxiety proactively with estrogen distribution science. | ALL AGENTS                              |

---

# KNOWLEDGE SYNTHESIS BY AGENT

## SCIENTIST (Blue #457B9D)

### Role Boundary

**Owns**: All calculations, all numeric baselines, all progress metrics, all adjustment triggers, projected timelines. The SCIENTIST is the system's engine — it produces numbers that other agents consume.

**Does NOT own**: What to eat (NUTRITIONIST), what meals to prepare (DIETITIAN), how to cook (CHEF), how to train (COACH).

### Core Knowledge

**Calculations:**

- Mifflin-St Jeor BMR (women): 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
- At 55 kg, 174 cm, 28 yrs: BMR = 10(55) + 6.25(174) - 5(28) - 161 = **~1,336.5 kcal/day**
- TDEE = BMR × activity factor (1.55 for 3-4 training sessions/week) = **~2,057 kcal/day**
- Optimal surplus: +400-500 kcal/day → **Target intake: ~2,450-2,550 kcal/day**
- Surplus rationale: Garthe et al. (2013, _EJSS_): surplus >544 kcal in elite athletes = 5x more fat with no extra lean mass. BUT Slater et al. (2019): novices partition energy more favorably than trained individuals. +400-500 kcal appropriate for underweight beginners.

**Macronutrient targets (calculated, not strategic):**

| Macro         | Target           | Daily Amount               | Evidence                                                                                        |
| ------------- | ---------------- | -------------------------- | ----------------------------------------------------------------------------------------------- |
| Protein       | 1.6-2.0 g/kg/day | 88-110 g (352-440 kcal)    | Morton et al. 2018: breakpoint at 1.62 g/kg (49 studies, 1,863 participants)                    |
| Fat           | ≥25% of calories | ~69 g (621 kcal)           | Mumford et al. 2016: +4% testosterone, -58% anovulation risk. Below 20% → menstrual disruption  |
| Carbohydrates | Remainder        | ~220-275 g (880-1100 kcal) | Glycogen adequacy supports mTOR; Henselmans 2022: CHO unlikely to limit RT performance when fed |

**Progress metrics:**

- Target weight gain rate: 0.25-0.5 kg/week
- Beginner female muscle gain rate: ~0.23-0.45 kg/month in year 1 (McMaster 2025 review: ~1 kg lean mass per 10 weeks)
- Roberts et al. (2020): Relative hypertrophy identical between sexes (effect 0.07, p=0.31)
- Projected timeline: 8-14 months to reach 65 kg

**Adjustment trigger rules (SCIENTIST detects, other agents execute):**

| Trigger                                      | Detection                                                                          | Action Owner                                                                       |
| -------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Gain < 0.25 kg/week × 2 consecutive weeks    | SCIENTIST (weekly average)                                                         | SCIENTIST recalculates (+200 kcal) → DIETITIAN adjusts plan → CHEF adjusts recipes |
| Gain > 0.75 kg/week                          | SCIENTIST (weekly average)                                                         | SCIENTIST recalculates (-150 kcal) → DIETITIAN adjusts plan                        |
| Waist growing faster than hips (ratio check) | SCIENTIST (biweekly measurements)                                                  | Flag for review — may indicate excessive surplus or stress-cortisol issue          |
| Training stall ≥3 sessions on ≥2 lifts       | SCIENTIST (training log)                                                           | COACH modifies program                                                             |
| Phase transition trigger                     | SCIENTIST (≥16 weeks on current program OR stall despite adequate nutrition/sleep) | COACH transitions program                                                          |
| TDEE recalculation needed                    | SCIENTIST (every 5 kg gained)                                                      | SCIENTIST recalculates → NUTRITIONIST/DIETITIAN adjust                             |

**NEAT monitoring:**

- Levine et al. (1999, _Science_): NEAT varies up to 2,000 kcal/day; explains 10x differences in fat storage
- Levine (2004): NEAT is the primary mechanism of weight-gain resistance in "hardgainers"
- Bouchard et al. (1990, _NEJM_): ALL participants gained weight under sufficient surplus (mean 8.1 kg, 84 days)
- If no weight gain despite hitting calorie target → most likely NEAT upregulation → add 200-300 kcal

---

## NUTRITIONIST (Green #2A9D8F)

### Role Boundary

**Owns**: Nutrition STRATEGY — how to distribute macros, how to optimize MPS, how to handle the menstrual cycle, hardgainer-specific tactics, supplement protocol, what categories of food to prioritize. The NUTRITIONIST receives numeric targets from the SCIENTIST and translates them into qualitative guidance.

**Does NOT own**: Specific meal plans (DIETITIAN), specific recipes (CHEF), calorie calculations (SCIENTIST).

**Interface**: Receives macro targets from SCIENTIST → Produces nutrition strategy → Hands strategic framework to DIETITIAN.

### Core Knowledge

**Protein distribution (MPS optimization):**

- Areta et al. (2013, _J Physiol_): 4×20g every 3h > 2×40g or 8×10g for muscle protein synthesis
- Mamerow et al. (2014, _J Nutr_): Even distribution (30/30/30g) = +25% 24h MPS vs skewed distribution in women
- Leucine threshold: ~2.5g per meal (Witard et al., 2014) — achieved with ~25-30g quality protein
- Pre-sleep protein: Res et al. (2012): 40g casein pre-sleep = +22% overnight MPS. Snijders et al. (2015): greater fiber CSA over 12 weeks.

**Recommended distribution framework:**

- 5 protein feedings: ~25-30g at breakfast, lunch, snack, dinner + 30-40g pre-sleep (casein/cottage cheese)
- Total: 88-110g/day across 5 meals

**Nutrient timing:**

- Schoenfeld, Aragon & Krieger (2013, meta-analysis, 23 studies): Post-workout "anabolic window" effects disappear when total daily intake is adequate
- Practical: protein source within 2-3h around training is fine; don't stress exact timing

**Hardgainer-specific strategies:**

- Liquid calories: DiMeglio & Mattes (2000): liquid calories produce less satiety than solid foods → daily shake = 600-800 kcal
- Calorie density: whole milk over skim, olive oil on everything (+100-200 kcal), nuts and dried fruit, full-fat dairy, granola
- Schedule eating: 5 meals at fixed times — do NOT rely on hunger signals (likely miscalibrated)
- Drink AFTER meals: prevent stomach volume displacement
- Dense foods first: protein/starch before vegetables

**Menstrual cycle considerations:**

- Follicular phase (days 1-14): Higher carb tolerance, potentially better MPS response
- Luteal phase (days 15-28): TDEE increases ~5-10%, possible appetite increase
- Colenso-Semple et al. (2023, umbrella review): Evidence quality is low
- Strategy: Train consistently. Optionally increase volume in follicular phase. Allow more recovery in late luteal.

**Supplement protocol (NUTRITIONIST owns strategy, DIETITIAN integrates into meal plan):**

| Tier            | Supplement           | Dose                                        | Key Evidence                                                                                                                        |
| --------------- | -------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1 - Essential   | Creatine monohydrate | 3-5g/day, every day                         | Kreider et al. 2017 (ISSN): >680 trials, 12,800+ participants. Safe for women. Lower baseline stores → potentially more beneficial. |
| 1 - Essential   | Vitamin D3           | 2,000-4,000 IU/day                          | Tomlinson 2015: strength improvement if deficient. Target 40-60 ng/mL.                                                              |
| 1 - Essential   | Magnesium glycinate  | 200-400mg at bedtime                        | GABA pathway → sleep quality. Commonly deficient.                                                                                   |
| 2 - Recommended | Omega-3 (EPA+DHA)    | 2-4g/day combined                           | Smith et al. 2011: ~3x MPS augmentation. Anti-inflammatory.                                                                         |
| 2 - Recommended | Ashwagandha KSM-66   | 300-600mg/day (8-12 wk cycles)              | Wankhede 2015: strength/size increase. Chandrasekhar 2012: cortisol -27.9%.                                                         |
| 2 - Recommended | Collagen peptides    | 10-15g + 50mg vit C, 30-60 min pre-training | Shaw 2017: doubled collagen synthesis. Joint protection as loads increase.                                                          |
| 3 - Optional    | Zinc                 | 15-30mg/day if deficient                    | Deficiency-dependent benefit only                                                                                                   |
| 3 - Optional    | HMB                  | 3g/day                                      | Modest benefit for untrained                                                                                                        |

**Peanut butter aversion — substitution map:**

| Instead of peanut butter | Use            | Calorie density        |
| ------------------------ | -------------- | ---------------------- |
| Almond butter            | ~98 kcal/tbsp  | Comparable             |
| Cashew butter            | ~94 kcal/tbsp  | Slightly lower protein |
| Tahini (sesame)          | ~89 kcal/tbsp  | Higher in calcium      |
| Sunflower seed butter    | ~99 kcal/tbsp  | Nut-free alternative   |
| Hazelnut butter          | ~100 kcal/tbsp | Rich flavor            |

---

## DIETITIAN (Orange #F4A261)

### Role Boundary

**Owns**: Weekly meal plan ARCHITECTURE — the template that maps every meal slot to macro targets, handles substitutions, manages variety/rotation, prevents boredom, adapts to schedule constraints. The DIETITIAN is the architect who designs the blueprint.

**Does NOT own**: Nutrition strategy (NUTRITIONIST), specific recipes (CHEF), calorie calculations (SCIENTIST).

**Interface**: Receives macro targets from SCIENTIST + strategy from NUTRITIONIST → Produces weekly meal template with per-slot specifications → Hands slots to CHEF for recipe execution.

### Core Knowledge

**Meal template structure (5 daily meals):**

| Slot      | Time      | Protein Target | Calorie Target | Notes                                        |
| --------- | --------- | -------------- | -------------- | -------------------------------------------- |
| Breakfast | ~8:00 AM  | 25-30g         | ~500-550 kcal  | Must be fast to prepare OR batch-preppable   |
| Lunch     | ~12:00 PM | 25-30g         | ~600-650 kcal  | Largest carb portion; partner can batch-cook |
| Snack     | ~4:00 PM  | 20-25g         | ~400-450 kcal  | Portable; can be a shake                     |
| Dinner    | ~8:00 PM  | 25-30g         | ~600-650 kcal  | Partner-cooked; most variety here            |
| Pre-sleep | ~10:30 PM | 30-40g         | ~300-350 kcal  | Casein-based; simple and consistent          |

**Total**: ~2,400-2,650 kcal/day, ~105-155g protein (intentionally overshoots slightly to account for tracking imprecision)

**Substitution rules:**

- Every meal slot must have 2-3 alternatives to prevent monotony
- Rotate weekly: prevent the same dinner more than 2x/week
- **ABSOLUTE RULE**: No peanut butter in any recipe, any slot, any alternative. Substitutes: almond butter, cashew butter, tahini, sunflower seed butter, hazelnut butter.
- If user reports difficulty eating a specific meal → replace with liquid calories (shake) before reducing total intake

**Batch cooking integration:**

- Partner cooks 2x/week (e.g., Sunday + Wednesday)
- Each batch session produces 3-4 days of lunches AND dinners
- Breakfast and snacks designed for minimal daily prep (≤10 min)
- Pre-sleep meal is always the same rotation of 2-3 options (simplicity = compliance)

**Protein source rotation (for variety and micronutrient coverage):**

| Source                  | Protein per 100g cooked | Best for                  |
| ----------------------- | ----------------------- | ------------------------- |
| Chicken thigh (skin-on) | ~26g                    | Calorie density + protein |
| Salmon                  | ~25g                    | Omega-3 + protein         |
| Beef (80/20 ground)     | ~26g                    | Iron + calorie density    |
| Eggs (whole)            | ~13g (per 2 eggs)       | Breakfast staple          |
| Greek yogurt (full-fat) | ~9g per 100g            | Snack/pre-sleep base      |
| Cottage cheese / quark  | ~11g per 100g           | Pre-sleep casein source   |
| Whey protein powder     | ~24g per scoop          | Shake convenience         |
| Casein protein powder   | ~24g per scoop          | Pre-sleep optimal         |

**Schedule adaptation rules:**

- If user can't eat 5 meals → merge snack into larger lunch/dinner but ADD a liquid calorie shake to compensate
- If user skips a meal → next meal must be calorie-dense to recover daily target
- If user travels → provide "emergency" high-calorie portable options (nuts, protein bars, dried fruit)

---

## CHEF (Gold #E9C46A)

### Role Boundary

**Owns**: Recipe creation and culinary execution — takes each slot from the DIETITIAN's template and produces an actual, appetizing, technically sound recipe with precise quantities, cooking steps, batch-cooking instructions, and time estimates. The CHEF is the executor who makes the blueprint delicious and feasible.

**Does NOT own**: Macro targets (SCIENTIST), nutrition strategy (NUTRITIONIST), meal template architecture (DIETITIAN).

**Interface**: Receives per-slot specifications from DIETITIAN (e.g., "Tuesday lunch: 30g protein, 60g carbs, 20g fat, batch-cookable, no peanut butter") → Produces complete recipe → Returns to DIETITIAN for validation.

### Core Knowledge

**GAPS TO FILL (Phase 1 research needed):**

1. **High-protein multi-cuisine recipes** — leverage the partner's cooking skills across cuisines

   - Mediterranean (olive oil-heavy = calorie-dense)
   - Asian (rice-based = easy carb loading)
   - Latin American (bean/rice combos = complete proteins)
   - French/European (cream, butter, cheese sauces = calorie density)

2. **Batch cooking techniques**

   - Protein batch: Cook 1.5-2 kg protein (chicken thighs, ground beef, salmon) in one session
   - Carb batch: Rice cooker loads, pasta prep, potato roasting
   - Sauce batch: 2-3 sauces per week that transform the same protein into different meals
   - Container/portioning strategy for 3-4 days

3. **Calorie-dense cooking techniques (without peanut butter)**

   - Olive oil finishing (drizzle on everything post-cooking: +100-200 kcal)
   - Full-fat dairy sauces (cream, cheese, butter)
   - Nut/seed toppings and crusts (almond, cashew, sesame)
   - Dried fruit additions (dates in smoothies, raisins in rice)
   - Coconut milk/cream in curries and shakes
   - Avocado as a calorie-dense addition

4. **Shake recipes (600-800 kcal per shake, no peanut butter)**

   - Base: banana + oats + whey + whole milk
   - Variants: add almond butter / tahini / coconut cream / dates / cacao
   - Frozen fruit versions for palatability
   - Overnight oats (liquid meal prep)

5. **Pre-sleep meal options (30-40g casein, ~300 kcal, simple)**
   - Cottage cheese + honey + walnuts
   - Greek yogurt parfait with granola
   - Casein shake + banana
   - Quark with berries and almond butter

**Culinary principles for hardgainers:**

- Calorie density > volume: Never serve low-calorie fillers (salad) as a significant portion
- Fat = flavor = calories: Olive oil, butter, cream, cheese are tools not enemies
- Texture variety prevents boredom: Alternate crunchy/creamy/chewy across the week
- Presentation matters: An appealing plate is eaten more completely than a functional one
- Batch cooking must not sacrifice taste: Use sauce rotation and finishing techniques

---

## COACH (Purple #9B5DE5)

### Role Boundary

**Owns**: Training programming, exercise selection, progressive overload strategy, recovery protocols, training-specific menstrual cycle adjustments, deload scheduling, phase transitions. The COACH is autonomous on training decisions but defers to the SCIENTIST on recovery metrics and adjustment triggers.

**Does NOT own**: Calorie calculations (SCIENTIST), nutrition strategy (NUTRITIONIST), meal plans (DIETITIAN).

**Interface**: Receives progress metrics and adjustment triggers from SCIENTIST → Programs training accordingly.

### Core Knowledge

**Frequency and structure:**

- Schoenfeld et al. (2016, _Sports Med_): Training each muscle ≥2x/week > 1x/week for hypertrophy
- Schoenfeld et al. (2019, 25 studies): No significant difference 2x vs 3x when volume equated
- Recommended: Full body 3x/week months 1-4 → Upper/Lower 4x/week months 5+

**Volume:**

- Schoenfeld et al. (2017, _J Sports Sciences_): Dose-response — each set adds +0.023 effect size
- Starting point: ~10 sets/muscle/week
- Barbalho et al. (2019, 40 trained women): 5-10 sets = equal or superior to 15-20 sets
- Progress to 12-16 sets/week for priority muscles after month 4

**Intensity and effort:**

- Schoenfeld et al. (2017, 2021): Hypertrophy occurs from ~30% to 85% 1RM. 8-15 reps most practical.
- Refalo et al. (2022, _Sports Med_): 1-3 RIR = same hypertrophy as failure, less fatigue
- Start at RPE 7 (3 RIR), progress to RPE 8 (2 RIR)
- Teach RPE concept from session 1: "Could you have done 2-3 more reps with good form? That's the target."

**Progressive overload — Double Progression:**

1. Work within rep range (e.g., 8-12)
2. When top of range achieved on ALL sets with good form → increase weight (+2.5 kg upper, +5 kg lower)
3. Drop to bottom of range with new weight
4. Repeat

**Glute-specific science:**

- Contreras et al. (2015): Hip thrust = 69-87% MVIC glute max vs 29-45% squat
- Plotkin et al. (2023, first MRI RCT): Gluteal hypertrophy similar between hip thrust and squat. BUT gluteus medius = virtually ZERO growth from either.
- Krause Neto et al. (2025 meta-analysis): SMD 0.71 for glute hypertrophy; recommend combining hip extension exercises
- **MANDATORY for hip dips**: Direct abduction work every lower-body session (Moore et al. 2020: side-lying abduction, cable hip abduction, banded lateral walks)

**Upper body for thin frames:**

- Mind-muscle connection: Schoenfeld et al. (2018): Internal focus = +12.4% biceps hypertrophy vs 6.9% external focus (isolation exercises only)
- Visual width priority: lateral raises + lat pulldowns to balance wide hips
- Arms: direct bicep/tricep work 2-4 sets/week minimum

**Recovery science:**

- Roberts et al. (2015, _J Physiol_): 12 weeks cold water immersion post-training = -13 percentage points quad mass gain. Piñero et al. (2024 meta-analysis) confirms. **NO cold baths post-training.**
- Lamon et al. (2021): 1 night sleep deprivation → MPS -18%, cortisol +21%, testosterone -24%
- Born et al. (1988): ~70% of daily GH during first slow-wave sleep bout
- **Non-negotiable**: 7-9h sleep/night, ±30 min consistency, 18-20°C bedroom

**Menstrual cycle — training adjustments:**

- Sung et al. (2014), Wikström-Frisén et al. (2017): Follicular phase volume emphasis → superior hypertrophy
- Colenso-Semple et al. (2023): Evidence quality low
- **Pragmatic approach**: Train consistently. Optionally push harder in follicular. Allow extra rest between sets in late luteal if symptomatic. **Consistency always beats cycle optimization.**

**NEAT management (training-related):**

- Target: 5,000-7,000 steps/day maximum
- Dedicated cardio: max 1-2 sessions of 15-20 min low intensity per week
- If high-movement job → flag to SCIENTIST for TDEE adjustment

**Phase transition criteria (concrete triggers):**

| Trigger                                                                                            | Action                                                                                        |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| ≥3 consecutive sessions with no progression on ≥2 compound lifts, despite adequate sleep/nutrition | Evaluate: deload first, then consider program change                                          |
| ≥16 weeks completed on current program phase                                                       | Mandatory program evolution regardless of progress                                            |
| All main lifts progressing but user requests more frequency                                        | Optional early transition                                                                     |
| Deload protocol                                                                                    | 1 week at 50% volume, same intensity. Every 6-8 weeks or when accumulated fatigue is evident. |

**Programs:**

### Phase 1: Months 1-4 (Full Body 3x/Week)

**Day A (Monday) — Glute & Back Focus**

| Exercise                     | Sets × Reps    | Rest  | Purpose                                            |
| ---------------------------- | -------------- | ----- | -------------------------------------------------- |
| Barbell Hip Thrust           | 3 × 10-15      | 2 min | Primary glute max. Start bar only. Squeeze at top. |
| Goblet Squat → Barbell Squat | 3 × 8-12       | 2 min | Goblet first 4 weeks. Thigh parallel minimum.      |
| Lat Pulldown                 | 3 × 8-12       | 90s   | Back development. Elbows to hips.                  |
| Side-lying Hip Abduction     | 2 × 15-20/side | 60s   | Hip dip correction. Slow, controlled.              |
| Face Pulls                   | 2 × 15-20      | 60s   | Posture + rear delts.                              |

**Day B (Wednesday) — Posterior Chain & Arms**

| Exercise                     | Sets × Reps    | Rest  | Purpose                              |
| ---------------------------- | -------------- | ----- | ------------------------------------ |
| Romanian Deadlift (RDL)      | 3 × 8-12       | 2 min | Hamstrings + glutes. DBs initially.  |
| Bulgarian Split Squat        | 3 × 10-12/leg  | 90s   | Unilateral maximal stimulation.      |
| Seated Cable Row             | 3 × 8-12       | 90s   | Back thickness.                      |
| Dumbbell Curls (mind-muscle) | 2 × 10-12      | 60s   | Arm thickness. Focus on contraction. |
| Cable Hip Abduction          | 2 × 15-20/side | 60s   | Hip dips.                            |

**Day C (Friday) — Full Body Hypertrophy**

| Exercise                              | Sets × Reps | Rest  | Purpose                              |
| ------------------------------------- | ----------- | ----- | ------------------------------------ |
| Leg Press (feet high & wide)          | 3 × 10-15   | 2 min | Glute/hamstring emphasis.            |
| Hip Thrust (banded or barbell)        | 3 × 10-15   | 90s   | 2nd weekly glute dose.               |
| Assisted Pull-ups / Wide Lat Pulldown | 3 × 8-12    | 90s   | Progress toward unassisted pull-ups. |
| Lateral Raises                        | 3 × 12-15   | 60s   | Visual width.                        |
| Seated/Lying Leg Curl                 | 2 × 10-15   | 60s   | Hamstring isolation.                 |

**Weekly Volume (Phase 1):**

| Muscle Group    | Sets/Week      | Priority       |
| --------------- | -------------- | -------------- |
| Gluteus maximus | 12-15          | ★★★            |
| Gluteus medius  | 4-6            | ★★★ (hip dips) |
| Hamstrings      | 8-10           | ★★             |
| Back            | 9              | ★★             |
| Shoulders       | 5              | ★              |
| Arms            | 2-4 direct     | ★              |
| Quadriceps      | 6-9 (indirect) | Adequate       |

### Phase 2: Months 5-12 (Upper/Lower 4x/Week)

| Day      | Focus                     | Key Exercises                                                 |
| -------- | ------------------------- | ------------------------------------------------------------- |
| Monday   | Lower — glute/hamstring   | Hip thrust, RDL, walking lunges, side-lying abduction         |
| Tuesday  | Upper — back/shoulders    | Lat pulldown, rows, OHP, lateral raises, face pulls           |
| Thursday | Lower — quad/glute medius | Squat, leg press, leg curl, cable hip abduction, banded walks |
| Friday   | Upper — back/arms         | Pull-ups/pulldown, rows, curls, tricep work, rear delts       |

Volume: 14-20 sets/week for priority muscles.

---

# CROSS-CUTTING KNOWLEDGE (ALL AGENTS)

## Female Physiology

| Fact                                         | Source                                                      | Agent Use                                  |
| -------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------ |
| Relative hypertrophy identical men/women     | Roberts et al. 2020 (effect 0.07, p=0.31)                   | Counter "women can't build muscle" fears   |
| Women produce ~3x more GH than men           | Burman et al. 2000, _JCEM_                                  | Explain compensatory anabolic pathways     |
| Estrogen = directly anabolic                 | Lowe et al. 2010, _ESSR_: +5% strength, +10% specific force | Reframe estrogen as an asset               |
| Unique IGF-1 isoforms in women post-exercise | Nindl et al. 2019, _Front Endocrinol_                       | Further compensatory mechanism             |
| Circulating hormones not necessary for MPS   | Colenso-Semple et al. 2024, _ESSR_                          | Don't over-emphasize hormonal optimization |

## Fat Distribution

| Fact                                                                  | Source                                   | Agent Use                                           |
| --------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------- |
| Estradiol → α2A antilipolytic receptors → gluteofemoral fat retention | Pedersen et al. 2004, _JCEM_             | Explain why surplus = fat to hips/glutes (desired)  |
| Estrogen reduces visceral adipogenesis                                | Steiner & Berry 2022, _Front Endocrinol_ | Reassure: fat goes to the RIGHT places              |
| Pattern shifts post-menopause (android storage)                       | Multiple sources                         | Not relevant for 28-year-old; mention only if asked |

## Hormonal Optimization (Natural)

The caloric surplus IS the primary hormonal intervention for an underweight woman:

- Chronic energy insufficiency → suppressed HPG axis, reduced T3, elevated cortisol, suppressed leptin
- Mallinson et al. (2013): Increased calories → restored T3, leptin, menses within 23-74 days

Natural optimization levers:

- Compound RT (largest acute GH/T response)
- Sleep 7-9h (GH pulsatility)
- Stress management (10-20 min daily meditation → cortisol reduction)
- Sauna if available (Leppäluoto: acute GH increase 2-16x, habituates)
- **AVOID cold water immersion post-training** (Roberts 2015: -13 pp quad mass; Piñero 2024 meta-analysis confirms)

## Health Guardrails (Replaces MÉDECIN)

**Embedded in ALL agents. If ANY of the following are detected, system pauses and recommends professional medical consultation:**

| Red Flag                                                      | Detection Method                                                                                                           | Response                                                                                              |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Amenorrhea > 3 months                                         | User self-report during intake or check-ins                                                                                | Pause plan. Recommend physician visit. Caloric surplus may help but medical evaluation needed first.  |
| History of eating disorders                                   | User self-report                                                                                                           | Do not proceed without medical clearance.                                                             |
| Persistent pain > 1 week during training                      | User self-report                                                                                                           | COACH pauses affected exercises. Recommend physiotherapist.                                           |
| Signs of thyroid dysfunction                                  | User reports: persistent cold extremities, hair thinning, extreme fatigue despite adequate sleep/nutrition                 | Recommend blood panel (TSH, free T3/T4).                                                              |
| Signs of RED-S                                                | Stress fractures, chronic fatigue, recurrent illness despite good habits                                                   | Recommend sports medicine physician.                                                                  |
| Body dysmorphia / fat-gain panic                              | User expresses intense distress about gaining fat, compulsive exercise urges, desire to restrict despite being underweight | Address with empathy + fat distribution science. If persistent, recommend mental health professional. |
| No weight gain after 4 weeks despite verified caloric surplus | SCIENTIST monitoring                                                                                                       | Rule out medical causes (thyroid, GI absorption, etc.) before further caloric increases.              |

---

# INTER-AGENT ARCHITECTURE

## Execution Pipeline

```
[INTAKE QUESTIONNAIRE]
       ↓
[HEALTH GUARDRAILS CHECK] — cross-cutting, not a dedicated agent
       ↓ (if clear)
[SCIENTIST] → calculates TDEE, macros, targets, timeline, metrics
       ↓
[NUTRITIONIST] → nutrition strategy, MPS distribution, supplements, hardgainer tactics
       ↓
[DIETITIAN] → weekly meal template, per-slot specs, substitution rules
       ↓
[CHEF] → recipes for each slot, batch cooking plan, shake recipes
       ↓
[COACH] → training program, progression scheme, recovery protocol
       ↓
[CONSOLIDATED OUTPUT] — unified plan document
```

## Feedback Loop (Post-Initial Generation)

```
Weekly cycle:
[USER DATA] (weight, measurements, training log, subjective markers)
       ↓
[SCIENTIST] — evaluates metrics against targets
       ↓
  ┌─── Calorie adjustment needed? → SCIENTIST recalculates → DIETITIAN adjusts → CHEF adjusts
  ├─── Training stall detected? → COACH modifies program
  ├─── Red flag detected? → SYSTEM PAUSE → recommend professional
  └─── On track? → No changes, positive reinforcement
```

## Conflict Resolution Hierarchy

When agents produce conflicting recommendations:

| Priority    | Rule                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 (highest) | **Health guardrails** always override everything. If a red flag is detected, ALL other agents pause.                                       |
| 2           | **SCIENTIST** overrides on all numeric matters (calories, macros, progression metrics, timelines). Other agents do not adjust numbers.     |
| 3           | **NUTRITIONIST** overrides DIETITIAN and CHEF on nutritional strategy (e.g., "more fat needed" overrides a DIETITIAN's low-fat meal slot). |
| 4           | **DIETITIAN** overrides CHEF on macro compliance (CHEF's recipe must fit the DIETITIAN's macro spec for that slot).                        |
| 5           | **COACH** is autonomous on training but defers to SCIENTIST on recovery metrics and phase transitions.                                     |
| 6           | **CHEF** has creative freedom within the constraints set by DIETITIAN.                                                                     |

## Standardized Data Exchange Format

All inter-agent communication uses this structure:

```json
{
  "from_agent": "SCIENTIST",
  "to_agent": "NUTRITIONIST",
  "data_type": "macro_targets",
  "payload": {
    "daily_calories": 2500,
    "protein_g": 100,
    "fat_g": 69,
    "carbs_g": 250,
    "protein_distribution": "5 meals, 25-30g each + 30-40g pre-sleep",
    "adjustment_note": null
  },
  "timestamp": "2026-02-08",
  "version": "1.0"
}
```

```json
{
  "from_agent": "DIETITIAN",
  "to_agent": "CHEF",
  "data_type": "meal_slot_spec",
  "payload": {
    "slot": "lunch",
    "day": "Tuesday",
    "protein_g": 30,
    "carbs_g": 60,
    "fat_g": 20,
    "calories": 540,
    "constraints": ["no_peanut_butter", "batch_cookable"],
    "cuisine_preference": null
  },
  "timestamp": "2026-02-08",
  "version": "1.0"
}
```

```json
{
  "from_agent": "SCIENTIST",
  "to_agent": "ALL",
  "data_type": "adjustment_trigger",
  "payload": {
    "trigger": "insufficient_weight_gain",
    "detail": "Weekly average gain = 0.15 kg/week for 2 consecutive weeks",
    "action": "increase_daily_calories_by_200",
    "new_daily_target": 2700
  },
  "timestamp": "2026-02-08",
  "version": "1.0"
}
```

## Adjustment Ownership Matrix

| Situation                | Detects                                   | Diagnoses                                                         | Prescribes                                   | Executes                                           |
| ------------------------ | ----------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------- |
| Insufficient weight gain | SCIENTIST                                 | NUTRITIONIST (is intake being hit?) + COACH (has NEAT increased?) | SCIENTIST (+200 kcal)                        | DIETITIAN adjusts meal plan → CHEF adjusts recipes |
| Excessive weight gain    | SCIENTIST                                 | SCIENTIST (surplus too high)                                      | SCIENTIST (-150 kcal)                        | DIETITIAN adjusts → CHEF adjusts                   |
| Training plateau         | SCIENTIST (log data)                      | COACH (is it recovery? volume? exercise selection?)               | COACH                                        | COACH modifies program                             |
| Phase transition         | SCIENTIST (≥16 wks or stall criteria met) | COACH (readiness assessment)                                      | COACH (new program)                          | COACH implements new phase                         |
| Meal compliance failure  | DIETITIAN (user reports skipping meals)   | NUTRITIONIST (is the meal plan realistic?)                        | DIETITIAN (simplify) + CHEF (easier recipes) | CHEF provides alternatives                         |
| User dislikes food       | CHEF (user feedback)                      | DIETITIAN (is it a macro issue or taste issue?)                   | CHEF (new recipe for same slot spec)         | CHEF                                               |
| Red flag detected        | ANY AGENT                                 | —                                                                 | SYSTEM PAUSE                                 | Recommend professional consultation                |

---

# LEXICON

## Purpose

Three functions: (1) Standardized vocabulary for inter-agent communication. (2) User-facing glossary for when agents need to explain terms. (3) Mapping of banned terms to correct alternatives.

## Sport Science Terms

| Term                 | Definition                                                                                                                                                                            | Agent Context                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| MPS                  | Muscle Protein Synthesis — the process of building new muscle proteins. The primary driver of hypertrophy.                                                                            | NUTRITIONIST (protein distribution optimizes MPS) |
| Hypertrophy          | Increase in muscle fiber cross-sectional area. The result of progressive overload + adequate nutrition + recovery.                                                                    | COACH, SCIENTIST                                  |
| Progressive overload | Systematically increasing training demand over time (more weight, more reps, or more sets). The single most important training variable.                                              | COACH                                             |
| RPE                  | Rate of Perceived Exertion (1-10 scale). RPE 7 = could do 3 more reps. RPE 8 = could do 2 more. RPE 10 = failure.                                                                     | COACH                                             |
| RIR                  | Reps In Reserve — how many more reps you could have done. 3 RIR ≈ RPE 7. 2 RIR ≈ RPE 8.                                                                                               | COACH                                             |
| 1RM                  | One Repetition Maximum — the heaviest weight you can lift once with good form.                                                                                                        | COACH                                             |
| MVIC                 | Maximum Voluntary Isometric Contraction — used in EMG studies to express muscle activation as a percentage.                                                                           | COACH (when citing EMG research)                  |
| Deload               | Planned reduction in training volume (~50%) while maintaining intensity, to allow recovery. Every 6-8 weeks.                                                                          | COACH                                             |
| Compound movement    | Exercise involving multiple joints and muscle groups (squat, deadlift, row, press).                                                                                                   | COACH                                             |
| Isolation movement   | Exercise targeting a single muscle group (curl, leg extension, lateral raise).                                                                                                        | COACH                                             |
| NEAT                 | Non-Exercise Activity Thermogenesis — all energy expended through movement that isn't deliberate exercise (fidgeting, walking, standing). Varies up to 2,000 kcal/day between people. | SCIENTIST, NUTRITIONIST                           |
| TDEE                 | Total Daily Energy Expenditure = BMR + NEAT + TEF + exercise. The total calories you burn per day.                                                                                    | SCIENTIST                                         |
| BMR                  | Basal Metabolic Rate — calories burned at complete rest. ~60-70% of TDEE.                                                                                                             | SCIENTIST                                         |
| TEF                  | Thermic Effect of Food — energy used to digest food. ~10% of total intake. Higher for protein (~20-30%) than fat (~0-3%).                                                             | SCIENTIST                                         |
| CSA                  | Cross-Sectional Area — the measurement used to quantify muscle hypertrophy in research (usually via MRI or ultrasound).                                                               | SCIENTIST (when citing studies)                   |

## Nutrition Terms

| Term                    | Definition                                                                                                                        | Agent Context                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Macronutrients (macros) | Protein, carbohydrates, and fat — the three categories of energy-providing nutrients.                                             | NUTRITIONIST, DIETITIAN                            |
| Leucine threshold       | The minimum leucine content (~2.5g) per meal needed to maximally stimulate MPS. Achieved with ~25-30g quality protein.            | NUTRITIONIST                                       |
| Casein                  | Slow-digesting milk protein. Optimal for pre-sleep consumption due to sustained amino acid release.                               | NUTRITIONIST, DIETITIAN                            |
| Whey                    | Fast-digesting milk protein. Common in shakes for rapid MPS stimulation.                                                          | NUTRITIONIST, DIETITIAN                            |
| Caloric surplus         | Consuming more calories than TDEE. Required for weight gain.                                                                      | SCIENTIST (calculates), NUTRITIONIST (strategizes) |
| Calorie density         | Calories per gram of food. High-density foods (nuts, oils, cheese) help hardgainers hit caloric targets without excessive volume. | NUTRITIONIST, DIETITIAN, CHEF                      |
| MPS response            | The measurable increase in muscle protein synthesis following a meal or training session. Duration: ~24-48h post-training.        | NUTRITIONIST                                       |

## Menstrual Cycle Terms

| Term             | Definition                                                                                                                                                  | Agent Context                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Follicular phase | Days 1-14 of cycle (day 1 = first day of menstruation). Estrogen rises, progesterone low. Potentially better MPS response.                                  | NUTRITIONIST (carb tolerance ↑), COACH (volume ↑)       |
| Luteal phase     | Days 15-28. Progesterone rises, estrogen secondary peak then drops. TDEE increases ~5-10%.                                                                  | SCIENTIST (account for TDEE change), COACH (recovery ↑) |
| Eumenorrheic     | Having regular menstrual cycles. Indicates healthy energy availability.                                                                                     | Health guardrails (absence = red flag)                  |
| Amenorrhea       | Absence of menstruation for ≥3 months. Red flag for energy deficiency.                                                                                      | Health guardrails                                       |
| RED-S            | Relative Energy Deficiency in Sport (Mountjoy et al. 2018, IOC consensus). Syndrome caused by insufficient caloric intake relative to exercise expenditure. | Health guardrails                                       |

## Body Composition Terms

| Term                      | Definition                                                                                                                                       | Agent Context                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Gynoidal fat distribution | Fat storage pattern directed by estrogen to hips, thighs, and buttocks. Premenopausal women. Metabolically protective.                           | ALL (reassure about fat distribution)        |
| Ptosis (gluteal)          | Sagging of the gluteal tissue due to insufficient muscle scaffolding underneath adipose. Corrected by glute hypertrophy.                         | COACH (explains why hip thrusts help)        |
| Hip dips                  | Visual indentation between iliac crest and greater trochanter caused by gluteus medius underdevelopment. Corrected by direct abduction training. | COACH (mandatory abduction work)             |
| DEXA                      | Dual-Energy X-ray Absorptiometry — gold standard measurement for body composition (muscle mass, fat mass, bone density by region).               | SCIENTIST (recommended every 3-6 months)     |
| Lean mass                 | All non-fat body tissue (muscle, bone, organs, water). Not synonymous with "muscle mass."                                                        | SCIENTIST (avoid confusing with muscle-only) |

## Banned → Correct Mapping (Quick Reference)

| ❌ BANNED         | ✅ CORRECT                                                    | Why                                                                 |
| ----------------- | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| Ectomorph         | "Difficulty gaining weight" or "lower appetite + higher NEAT" | Sheldon's eugenics-based pseudoscience (Rafter 2007)                |
| Mesomorph         | "Favorable muscle-building response"                          | Same origin                                                         |
| Endomorph         | "Higher propensity for fat storage"                           | Same origin                                                         |
| Fast metabolism   | "High NEAT"                                                   | 96% of people within 200-300 kcal of predicted BMR (Johnstone 2005) |
| Body type diet    | "Individualized nutrition based on measured needs"            | No RCT has ever validated body-type eating                          |
| Anabolic window   | "Peri-workout nutrition"                                      | Schoenfeld 2013: effect disappears when daily intake controlled     |
| Toning            | "Hypertrophy + fat management"                                | Toning is not a distinct physiological process                      |
| Long lean muscles | "Muscle hypertrophy"                                          | Muscle shape = genetics (origin/insertion), not training style      |
| Bulky (as fear)   | "Gradual, controllable muscle gain (~0.3 kg/month for women)" | Reframe with actual rates                                           |

---

# CURRENT STATE & GAPS

## Coverage Audit

| Agent        | Knowledge Status | Source Files                                                              |
| ------------ | ---------------- | ------------------------------------------------------------------------- |
| SCIENTIST    | ✅ Complete      | KNOWLEDGE_BASE_training_agent.md (Sections 3, 5, 10, 11)                  |
| NUTRITIONIST | ✅ Complete      | KNOWLEDGE_BASE (Sections 4, 5, 7), Protocol_Biohacking (Parts 1, 3)       |
| DIETITIAN    | ⚠️ Partial       | Principles complete, no concrete weekly template with alternatives        |
| CHEF         | ❌ Missing       | No recipes, no batch cooking protocols, no culinary techniques documented |
| COACH        | ✅ Complete      | KNOWLEDGE_BASE (Section 6), Protocol_Biohacking (Part 2)                  |

## Gaps to Fill

### Gap 1: CHEF — Needs Research (Phase 1)

- High-protein multi-cuisine recipes (Mediterranean, Asian, Latin, European)
- Batch cooking protocols (2 sessions/week → 3-4 days of meals)
- Calorie-dense cooking techniques (without peanut butter)
- Shake variants (600-800 kcal, varied flavors)
- Pre-sleep meal options (simple, casein-based)

### Gap 2: DIETITIAN — Needs Template

- Concrete 7-day meal template with per-slot macro specs
- 2-3 alternatives per slot
- Rotation schedule (prevent same dinner >2x/week)
- "Emergency" portable meal options for travel/busy days

### Gap 3: Inter-Agent — Now Formalized ✅

- Data flow: defined above
- Conflict resolution: hierarchy defined above
- JSON format: schema defined above
- Adjustment ownership: matrix defined above

### Gap 4: Lexicon — Now Complete ✅

- Sport science terms ✅
- Nutrition terms ✅
- Menstrual cycle terms ✅
- Body composition terms ✅
- Banned → correct mapping ✅

---

# ACTION PLAN

## Phase 1: Fill CHEF Gap (Research)

- Research high-protein multi-cuisine recipes suitable for batch cooking
- Develop 3-4 shake recipes (600-800 kcal, no peanut butter)
- Create batch cooking protocols for partner execution
- Document calorie-dense cooking techniques

## Phase 2: Fill DIETITIAN Gap (Template)

- Build concrete 7-day meal template
- Per-slot macro specifications
- 2-3 alternatives per slot
- Emergency/travel options

## Phase 3: Create Agent Persona Files

For each of the 5 agents, produce a complete persona file containing:

1. Credible fictional background (name, credentials, philosophy)
2. Personality and communication tone
3. Complete system prompt (with all knowledge embedded)
4. Input/output JSON schema
5. Intake questions specific to their domain
6. Red flags they watch for
7. Myth-busting responses (how to handle banned terminology)

## Phase 4: Integration Testing

- Simulate a full pipeline run with the target client profile
- Verify inter-agent data flow works
- Test conflict resolution on edge cases
- Validate all outputs against knowledge base

---

# FINAL DELIVERABLES

```
agents/
├── SCIENTIST.md        — Full persona + system prompt + JSON schema
├── NUTRITIONIST.md     — Full persona + system prompt + JSON schema
├── DIETITIAN.md        — Full persona + system prompt + JSON schema + meal templates
├── CHEF.md             — Full persona + system prompt + JSON schema + recipes
├── COACH.md            — Full persona + system prompt + JSON schema + programs
├── INTER_AGENTS.md     — Pipeline, feedback loops, conflict resolution, JSON schemas
└── LEXICON.md          — Complete terminology reference
```
