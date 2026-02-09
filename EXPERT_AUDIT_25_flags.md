# EXPERT AUDIT — 6-AGENT SPECIALIST REVIEW

## Issues Glossed Over in Current Protocol

### Each agent thinking from their own field

---

# 🔴 PHYSICIAN FLAGS

### 1. CALORIC RAMP-UP IS MISSING (CRITICAL)

**Problem**: Protocol says "target 2,500 kcal/day" from day one. Current intake is likely ~1,800-2,000 kcal. That's a +500-700 kcal jump overnight.

- GI distress: bloating, nausea, bowel changes in a gut adapted to low volume
- NEAT upregulation: sudden surplus triggers unconscious movement compensation (Levine 1999: up to 700 kcal/day)
- Psychological aversion: forcing food creates negative relationship from day one
- Refeeding risk: LOW but not zero. BMI 18.5 is a NICE secondary risk criterion. If she has been eating <50% of estimated needs for >5 days (possible during illness/stress), risk elevates.

**Fix**: 2-week ramp protocol:
| Week | Target | Surplus | How |
|---|---|---|---|
| Week 1 | ~2,100-2,200 kcal | +200-300 | Add 1 shake or calorie-dense snack |
| Week 2 | ~2,300-2,400 kcal | +400-500 | Increase portion sizes, add toppings |
| Week 3+ | ~2,450-2,550 kcal | +500-700 (full) | Full protocol. GI adapted. |

**Owner**: SCIENTIST (numbers) + NUTRITIONIST (strategy) + PHYSICIAN (safety context)

### 2. BASELINE BLOOD WORK NOT RECOMMENDED (IMPORTANT)

**Problem**: We say "no known health issues" but this subject is at BMI 18.5. Subclinical deficiencies are extremely common and would alter multiple agent recommendations.

- Iron/ferritin: women lose ~1mg iron/day via menses. Low ferritin is the #1 missed deficiency in underweight women. Symptoms overlap with "just being thin" (fatigue, cold, poor recovery).
- Vitamin D: supplement protocol says 2,000-4,000 IU but if she's severely deficient (<20 ng/mL), she may need loading dose (50,000 IU/week × 8 weeks).
- Thyroid: we list it as a red flag but a baseline TSH/free T3 would CATCH subclinical hypothyroidism before 4 weeks of frustrating no-gain.
- CBC: rules out anemia, which would explain poor exercise tolerance and recovery.

**Fix**: PHYSICIAN should recommend (not require) baseline blood panel at program start:

- CBC, Ferritin, 25-OH Vitamin D, TSH + free T3/T4, Basic metabolic panel
- Frame as: "Not mandatory to start, but highly recommended. Results may change supplement dosing and help us catch issues early."

**Owner**: PHYSICIAN (recommendation) + NUTRITIONIST (adjusts supplements based on results)

### 3. CREATINE WATER WEIGHT WILL CONFUSE SCALE TRACKING (IMPORTANT)

**Problem**: Creatine causes 1-2 kg water weight gain in the first 1-2 weeks. Protocol starts creatine AND caloric surplus simultaneously. The SCIENTIST's adjustment triggers (0.25-0.5 kg/week = optimal) will be completely useless for the first 3-4 weeks because the signal is drowned in creatine water noise.

- Week 1-2: scale jumps 1.5-2.5 kg → SCIENTIST thinks gain is >0.75/wk → triggers calorie REDUCTION → counterproductive
- OR: creatine water masks actual fat/muscle gain rate → wrong adjustments

**Fix**: Either (a) start creatine 2-3 weeks BEFORE the surplus begins so water weight stabilizes first, OR (b) exclude the first 3 weeks from the SCIENTIST's adjustment algorithm. Mark them as "adaptation period — data collection only, no adjustments."

**Owner**: SCIENTIST (metric interpretation) + NUTRITIONIST (supplement timing) + PHYSICIAN (explains mechanism)

### 4. NO MENSTRUAL STATUS BASELINE (IMPORTANT)

**Problem**: At BMI 18.5, there's a real chance she's already amenorrheic or oligomenorrheic (irregular cycles). We list amenorrhea >3 months as a red flag but never ask about it during INTAKE.

**Fix**: Add to intake questionnaire: "Are your menstrual cycles regular? When was your last period? Have you ever gone 3+ months without a period?" This data informs:

- PHYSICIAN: whether HPG axis is already suppressed
- SCIENTIST: baseline for tracking restoration (menses returning = positive sign)
- NUTRITIONIST: cycle-based adjustments only apply if she HAS a cycle

**Owner**: PHYSICIAN (clinical context) + SCIENTIST (baseline data)

---

# 🔵 SCIENTIST FLAGS

### 5. TDEE CALCULATION USES ACTIVITY FACTOR 1.55 BUT SHE ISN'T TRAINING YET (MODERATE)

**Problem**: Mifflin-St Jeor × 1.55 (moderate activity) gives TDEE ~2,057 kcal. But at program START, she's a sedentary person with zero training. Her actual starting TDEE is closer to 1,327 × 1.2 (sedentary) = ~1,593 kcal. Using 1.55 from day one means the "surplus" might actually be a surplus of +900 kcal in week 1, dropping to +500 once she's training 3x/week.

**Fix**: Use activity factor 1.3-1.4 for weeks 1-2 (light activity — she's just learning movements), transition to 1.55 by week 3-4 when she's actually training with meaningful loads. This also dovetails with the caloric ramp-up.

**Owner**: SCIENTIST (recalculation) + COACH (activity context)

### 6. NO BODY FAT PERCENTAGE ESTIMATE (MODERATE)

**Problem**: We have height, weight, BMI — but no body fat estimate. At 55 kg and 174 cm with "soft" lower body and "thin" upper body, she could be anywhere from 18% to 28% body fat. This matters because:

- Energy availability calculation (PHYSICIAN): uses FFM, which we estimated at ~44 kg (assuming ~20% BF). If she's actually 25% BF, FFM = 41.25 kg, threshold is lower.
- Muscle gain expectations change with starting body fat
- Fat distribution tracking needs a baseline

**Fix**: Recommend waist-to-hip ratio measurement at intake + optional DEXA or bioimpedance for baseline body fat. If unavailable, estimate using Navy method (neck + waist + hip circumferences).

**Owner**: SCIENTIST (calculation) + PHYSICIAN (energy availability)

### 7. WEIGHT FLUCTUATION FROM MENSTRUAL CYCLE NOT ACCOUNTED FOR (MODERATE)

**Problem**: Women can retain 0.5-2 kg of water during the luteal phase. The SCIENTIST's adjustment triggers use weekly averages, but a 2-week stall triggered by two consecutive luteal-phase weigh-in weeks could falsely trigger a +200 kcal adjustment when nothing is actually wrong.

**Fix**: If menstrual cycle is tracked, the SCIENTIST should compare weight from the same cycle phase (e.g., week 1 of follicular vs previous week 1 of follicular) rather than consecutive weeks. Alternatively, use 4-week rolling averages instead of 2-week triggers.

**Owner**: SCIENTIST (metric refinement) + PHYSICIAN (physiology context)

---

# 🟢 NUTRITIONIST FLAGS

### 8. PEANUT BUTTER STILL IN SOURCE DOCUMENTS (CRITICAL — COMPLIANCE)

**Problem**: The knowledge base (Section 5.5, line 283) still says "banana + oats + whey + peanut butter + whole milk = 600-800 kcal." The biohacking protocol (lines 56, 66) mentions "beurre de cacahuète" twice. While the plan v2.1 correctly propagates the aversion, the SOURCE DOCUMENTS that agents will reference still contain peanut butter.

**Fix**: When building agent prompts, ALL source references must be scrubbed. But more importantly: the KNOWLEDGE_BASE and Protocol need to be corrected NOW so they don't contaminate future work.

**Owner**: NUTRITIONIST (substitution) + system maintenance

### 9. PROTEIN TARGET MAY BE LOW FOR A BEGINNER IN SURPLUS (MINOR)

**Problem**: Morton 2018 breakpoint is 1.62 g/kg. We set 1.6-2.0 g/kg = 88-110g. But this is based on CURRENT weight (55 kg). As she gains, the target should scale. At 60 kg, 1.6 g/kg = 96g. At 65 kg = 104g. The protocol doesn't clearly state whether to use current or target weight.

**Fix**: Use current weight, recalculated monthly alongside the biweekly measurements. By the time she's 60 kg, protein target becomes 96-120g. This is a SCIENTIST-driven recalculation that NUTRITIONIST and DIETITIAN need to track.

**Owner**: SCIENTIST (recalc trigger) + NUTRITIONIST (strategy update)

### 10. FIBER INTAKE NOT ADDRESSED (MODERATE)

**Problem**: The "dense foods first, vegetables last" strategy for hardgainers, combined with calorie-dense foods (oils, cheese, nuts), could result in dangerously low fiber intake. Low fiber → constipation → bloating → less eating → failed surplus. It's a compliance spiral.

**Fix**: Set a minimum fiber target: 20-25g/day (lower than the general 25-30g recommendation because we're prioritizing calorie density, but enough to prevent GI issues). DIETITIAN ensures each day hits this through strategic vegetable placement (not as filler, but as a GI health requirement).

**Owner**: NUTRITIONIST (strategy) + DIETITIAN (implementation)

### 11. HYDRATION PROTOCOL MISSING (MODERATE)

**Problem**: We say "drink AFTER meals" but never quantify total daily fluid intake. Creatine supplementation requires adequate hydration (pulls water into muscles). Higher protein intake increases urea production requiring more water for excretion. Higher food volume needs more digestive fluid. Dehydration → constipation → bloating → less eating.

**Fix**: Target: ~2.0-2.5L water/day. Creatine: take with at least 250-300ml water. Practical: one glass on waking, one with each meal (after eating), one during training, one before bed.

**Owner**: NUTRITIONIST (strategy) + DIETITIAN (scheduling) + PHYSICIAN (creatine hydration)

---

# 🟠 DIETITIAN FLAGS

### 12. NO "WEEK ZERO" MEAL PLAN (IMPORTANT)

**Problem**: The meal template jumps to 2,400-2,650 kcal. But with the ramp-up protocol (Flag #1), we need a "Week Zero" template at ~2,100 kcal and a "Week One" template at ~2,300 kcal before the full template kicks in. The DIETITIAN needs to build transition plans, not just the final plan.

**Fix**: Three-tier meal template:

- Tier 1 (Week 1): Current meals + 1 daily shake (~300 kcal) = ~2,100-2,200 kcal
- Tier 2 (Week 2): Current meals + shake + calorie-dense additions = ~2,300-2,400 kcal
- Tier 3 (Week 3+): Full 5-meal protocol = ~2,450-2,650 kcal

**Owner**: DIETITIAN (templates) + SCIENTIST (calorie targets per tier)

### 13. NO EMERGENCY / LOW-APPETITE DAY PROTOCOL (IMPORTANT)

**Problem**: On days when she feels sick, stressed, exhausted, or simply can't face food — what happens? The current protocol assumes 100% compliance. Reality: there will be days where eating 2,500 kcal feels impossible. Without a fallback, she either forces it (negative association) or gives up (misses targets).

**Fix**: "Minimum viable day" protocol:

- MINIMUM: 1,800 kcal + 80g protein (no muscle loss, no caloric surplus)
- HOW: 2 shakes (600+600 kcal) + 1 small meal (600 kcal) = 1,800 kcal, ~80g protein
- RULE: Maximum 2 minimum-viable days per week. If >2, flag to SCIENTIST as a compliance issue.
- THIS IS NOT FAILURE. Frame as "maintenance mode — protecting your base."

**Owner**: DIETITIAN (emergency template) + NUTRITIONIST (minimum thresholds) + CHEF (easy liquid options)

### 14. NO FOOD TRACKING METHOD SPECIFIED (MODERATE)

**Problem**: We say "most hardgainers underestimate by 20-50%" but never specify HOW she should track. Calorie counting? Portion estimation? Food scale? App? Each has different accuracy and psychological load.

**Fix**: Recommend food scale + simple app (MyFitnessPal or similar) for the FIRST 4 WEEKS only. After that, transition to portion-based estimation (hand sizes: palm = protein, fist = carbs, thumb = fats). Full tracking is only re-engaged when the SCIENTIST detects a stall and needs to verify intake.

**Owner**: DIETITIAN (method) + SCIENTIST (when to re-engage tracking)

---

# 🟡 CHEF FLAGS

### 15. NO RECIPE DATABASE FRAMEWORK (CRITICAL — BIGGEST GAP)

**Problem**: The CHEF has zero recipes. The knowledge section says "GAPS TO FILL" but doesn't define what a recipe should contain, how many we need, or what format they take. When we build the CHEF agent, it will be generating content from scratch every time with no reference library.

**Fix**: Phase 1 research must produce a MINIMUM recipe library:

- 5 breakfasts (batch-preppable, 500-550 kcal, 25-30g protein)
- 7 lunches (batch-cookable, 600-650 kcal, 25-30g protein, multi-cuisine)
- 7 dinners (partner-cooked, 600-650 kcal, 25-30g protein, multi-cuisine)
- 3 pre-sleep options (simple, 300-350 kcal, 30-40g casein protein)
- 3 "emergency day" shakes (600+ kcal, high protein, drinkable when appetite is zero)

Each recipe must include: ingredients with gram quantities, macros, prep time, batch scaling, storage life, substitution notes, and NO NUT BUTTER.

**Owner**: CHEF (creation) + DIETITIAN (macro validation)

### 16. COOKING SKILL BASELINE NOT ASSESSED (MODERATE)

**Problem**: We know the partner is an "experienced homecook" but we don't know HER cooking skill level. If she needs to prep breakfast and snacks alone (while partner batch-cooks lunch/dinner), can she handle it? Are "3 eggs + toast + Greek yogurt" or "overnight oats" within her capability?

**Fix**: Intake questionnaire should include: "How comfortable are you in the kitchen? Can you make basic meals (eggs, rice, pasta)?" and "Does your partner cook FOR you or WITH you?" This determines whether CHEF recipes for self-prepared meals need to be ultra-simple (5 steps max) or can be moderate complexity.

**Owner**: CHEF (recipe complexity calibration) + DIETITIAN (template feasibility)

### 17. FOOD COST NOT CONSIDERED (MINOR BUT REAL)

**Problem**: Salmon, full-fat Greek yogurt, KSM-66 ashwagandha, quality whey — this adds up. 2,500 kcal/day of whole foods costs significantly more than 1,800 kcal/day. If budget is tight, compliance drops.

**Fix**: CHEF should provide cost tiers for protein sources:

- Budget: eggs, chicken thighs, ground beef, canned tuna, lentils, whole milk, bulk oats
- Mid: salmon (frozen), Greek yogurt, cottage cheese, whey protein
- Premium: fresh fish, grass-fed beef, specialty butters

DIETITIAN should be able to build a plan at any tier without compromising macro targets.

**Owner**: CHEF (cost-aware recipes) + DIETITIAN (budget flexibility)

---

# 🟣 COACH FLAGS

### 18. NO ANATOMICAL ADAPTATION / FORM LEARNING PHASE (CRITICAL)

**Problem**: The program starts with "Barbell Hip Thrust 3×10-15" and "Goblet → Barbell Squat 3×8-12" on Day A of Week 1. This subject has ZERO training experience. She doesn't know what a hip hinge is. She's never held a barbell. Starting with barbell movements — even at low weight — without a dedicated form-learning period risks:

- Injury from poor movement patterns
- Tendon/ligament stress (connective tissue adapts slower than muscle — Mersmann 2017)
- Discouragement from feeling incompetent
- Ingraining bad motor patterns that become harder to fix later

The research is clear: tendons and ligaments need a preparatory phase. Muscle strength gains outpace connective tissue adaptation, especially in beginners.

**Fix**: Add "Phase 0" — Anatomical Adaptation (Weeks 1-2):

- Bodyweight only or very light dumbbells
- Learn: hip hinge (RDL pattern with broomstick), squat (goblet with light KB), push (push-ups), pull (band pull-aparts), abduction (side-lying)
- Focus: movement quality, mind-muscle connection, breathing patterns, bracing
- Volume: 2 sets × 12-15 reps, RPE 5-6 (very submaximal)
- Purpose: tendon/ligament preparation, neural pathway establishment, confidence building
- No progressive overload — just pattern mastery

Phase 1 (current program) begins at Week 3, with goblet squats (not barbell), dumbbell RDLs (not barbell), and bodyweight or light hip thrusts.

**Owner**: COACH (programming) + PHYSICIAN (connective tissue safety)

### 19. WEIGHT INCREMENTS MAY BE TOO LARGE FOR AN UNTRAINED WOMAN (MODERATE)

**Problem**: Double progression says "+2.5 kg upper body, +5 kg lower body." For an untrained 55 kg woman:

- Many gyms don't have plates smaller than 2.5 kg (= 5 kg total on a barbell)
- Her starting weights will be very low (maybe 10-20 kg squat, 5-10 kg curl)
- A +2.5 kg jump on a 5 kg dumbbell curl is a 50% increase
- +5 kg on a 20 kg squat is 25% — way too aggressive for a beginner

**Fix**: Specify micro-loading:

- Upper body: +1 kg or +1.25 kg per side (recommend purchasing fractional plates)
- Lower body: +2.5 kg (not +5 kg) for the first 3-4 months
- Machine-based exercises: use the smallest increment available (usually 2.5-5 kg)
- If gym lacks fractional plates: use double progression by REPS ONLY until a full +2.5 kg jump becomes proportionally reasonable (i.e., when she's squatting 40+ kg)

**Owner**: COACH (progression scheme)

### 20. GYM ENVIRONMENT / EQUIPMENT ACCESS NOT ASSESSED (MODERATE)

**Problem**: The program requires: barbell, squat rack, hip thrust setup, cable machine, lat pulldown, leg press, leg curl, dumbbells, bands. This is a fully equipped commercial gym. But:

- Does she have a gym membership?
- Is she comfortable in a gym environment? (Gym anxiety is REAL for beginners, especially women)
- Does her gym have a hip thrust setup? (Many don't)
- Are fractional plates available?

**Fix**: Intake questionnaire should include: "Where will you train? (commercial gym / home / other)", "What equipment is available?", "How do you feel about training in a gym?" The COACH should have equipment-adapted program variants.

**Owner**: COACH (program adaptation) + intake questionnaire

### 21. NO WARM-UP OR COOL-DOWN PROTOCOL (MODERATE)

**Problem**: The training programs list exercises but no warm-up. A complete beginner needs guidance on:

- General warm-up (5 min light cardio to raise body temperature)
- Movement-specific warm-up (bodyweight versions of today's exercises)
- Activation work (glute bridges before hip thrusts, band pull-aparts before rows)
- Cool-down: light stretching (NOT static stretching before training)

**Fix**: Standardized warm-up template per session type:

- Lower body days: 5 min walk/bike → bodyweight squats × 10 → glute bridges × 15 → banded lateral walks × 10/side → RDL with empty bar × 8
- Upper body days: 5 min walk/bike → band pull-aparts × 15 → push-ups × 8 → arm circles → lat stretch

**Owner**: COACH (programming)

---

# 🔄 CROSS-CUTTING FLAGS (Multiple agents)

### 22. INTAKE QUESTIONNAIRE DOESN'T EXIST YET (CRITICAL)

**Problem**: Many of the flags above require information gathered at intake. But we have no intake questionnaire designed. Each agent needs specific data to function.

**Fix**: Consolidated intake questionnaire, organized by agent need:

**PHYSICIAN needs**: Menstrual regularity, last period date, medical history, current medications, supplement use, history of eating disorders, any chronic conditions, cold intolerance, hair thinning, energy levels, dizziness, recent blood work.

**SCIENTIST needs**: Current weight, height, age (LOCKED: 28), current typical daily food intake (3-day recall), activity level (job type, daily steps, exercise), sleep hours, previous weight history.

**NUTRITIONIST needs**: Food preferences, food aversions (PEANUT BUTTER), dietary restrictions, appetite rating (1-10), relationship with food, current supplement use.

**DIETITIAN needs**: Daily schedule (meal timing availability), who cooks (self vs partner), kitchen equipment, batch cooking willingness, budget constraints, eating location (home vs work vs mixed).

**CHEF needs**: Cooking skill level (self + partner), cuisine preferences, kitchen equipment available, time available for daily prep, time available for batch cooking.

**COACH needs**: Training history (ZERO), gym access/equipment, schedule availability, physical limitations/pain, exercise experience (any sports?), gym comfort level.

**Owner**: ALL AGENTS contribute questions → consolidated form

### 23. PSYCHOLOGICAL PREPARATION FOR FAT GAIN IS THIN (IMPORTANT)

**Problem**: We mention "fat distribution science" and "body dysmorphia" as a red flag, but this subject is going to gain 5-7 kg of fat. Even with estrogen-directed distribution, she WILL notice her belly, face, and thighs getting bigger before she sees muscle definition. There's no protocol for managing the psychological experience of intentional fat gain.

**Fix**: Add to NUTRITIONIST + PHYSICIAN shared knowledge:

- "Fat gain precedes visible muscle" — months 1-3 will feel wrong. This is NORMAL.
- "Mirror lies, tape doesn't" — body dysmorphia sensitivity increases during bulking. Rely on measurements, not mirror assessment.
- "Fat distribution takes time" — newly gained fat may sit differently initially before hormonal signals redistribute it.
- Frame fat gain positively: "This is your body restoring its hormonal environment. The surplus is literally healing your HPG axis."
- Warning signs vs. normal discomfort: feeling a bit soft = normal. Panic attacks about eating, purging behaviors, compulsive cardio = red flag for PHYSICIAN.

**Owner**: PHYSICIAN (mental health) + NUTRITIONIST (reframing) + COACH (preventing compensatory exercise)

### 24. NO PROTOCOL FOR WHEN PARTNER IS UNAVAILABLE (MODERATE)

**Problem**: The meal plan architecture is built around a partner cooking 2x/week. What happens when the partner is traveling, sick, or busy? The system has no fallback.

**Fix**: DIETITIAN must build a "solo week" variant: all meals achievable by the user alone with basic cooking skills. This means simpler recipes, more shakes, more pre-prepped components (rotisserie chicken, pre-cooked rice, canned tuna). The CHEF should provide a "survival recipe book" — 5-6 ultra-simple meals anyone can make.

**Owner**: DIETITIAN (template) + CHEF (simple recipes)

### 25. COLLAGEN + VIT C TIMING CONFLICTS WITH TRAINING TIMING (MINOR)

**Problem**: Supplement protocol says "Collagen 10-15g + 50mg vitamin C, 30-60 min PRE-training." But we also say protein timing doesn't matter. The collagen recommendation creates a timing obligation that may stress the user, and the evidence (Shaw 2017) showed increased collagen synthesis markers, not actual tendon hypertrophy in training populations.

**Fix**: Downgrade the timing specificity. "Take collagen + vitamin C daily. Ideally 30-60 min before training, but any time is fine. The benefit is cumulative, not acute." This reduces user cognitive load.

**Owner**: NUTRITIONIST (simplification)

---

# SUMMARY — PRIORITY RANKING

| #   | Flag                                  | Severity     | Agents Involved                    |
| --- | ------------------------------------- | ------------ | ---------------------------------- |
| 1   | Caloric ramp-up missing               | 🔴 CRITICAL  | PHYSICIAN, SCIENTIST, NUTRITIONIST |
| 18  | No form-learning phase                | 🔴 CRITICAL  | COACH, PHYSICIAN                   |
| 22  | No intake questionnaire               | 🔴 CRITICAL  | ALL                                |
| 15  | No recipe database                    | 🔴 CRITICAL  | CHEF, DIETITIAN                    |
| 8   | Peanut butter in source docs          | 🔴 CRITICAL  | NUTRITIONIST, system               |
| 3   | Creatine confounds scale tracking     | 🟠 IMPORTANT | SCIENTIST, NUTRITIONIST, PHYSICIAN |
| 2   | No baseline blood work recommendation | 🟠 IMPORTANT | PHYSICIAN, NUTRITIONIST            |
| 4   | No menstrual status baseline          | 🟠 IMPORTANT | PHYSICIAN, SCIENTIST               |
| 12  | No transitional meal plans            | 🟠 IMPORTANT | DIETITIAN, SCIENTIST               |
| 13  | No low-appetite emergency protocol    | 🟠 IMPORTANT | DIETITIAN, CHEF, NUTRITIONIST      |
| 23  | Psychological prep for fat gain thin  | 🟠 IMPORTANT | PHYSICIAN, NUTRITIONIST, COACH     |
| 5   | TDEE overestimated at start           | 🟡 MODERATE  | SCIENTIST, COACH                   |
| 6   | No body fat estimate                  | 🟡 MODERATE  | SCIENTIST, PHYSICIAN               |
| 7   | Menstrual cycle weight fluctuation    | 🟡 MODERATE  | SCIENTIST, PHYSICIAN               |
| 10  | Fiber intake not addressed            | 🟡 MODERATE  | NUTRITIONIST, DIETITIAN            |
| 11  | Hydration protocol missing            | 🟡 MODERATE  | NUTRITIONIST, DIETITIAN, PHYSICIAN |
| 14  | No tracking method specified          | 🟡 MODERATE  | DIETITIAN, SCIENTIST               |
| 16  | Cooking skill not assessed            | 🟡 MODERATE  | CHEF, DIETITIAN                    |
| 19  | Weight increments too large           | 🟡 MODERATE  | COACH                              |
| 20  | Gym environment not assessed          | 🟡 MODERATE  | COACH                              |
| 21  | No warm-up protocol                   | 🟡 MODERATE  | COACH                              |
| 24  | No partner-unavailable fallback       | 🟡 MODERATE  | DIETITIAN, CHEF                    |
| 9   | Protein target scaling unclear        | 🟢 MINOR     | SCIENTIST, NUTRITIONIST            |
| 17  | Food cost not considered              | 🟢 MINOR     | CHEF, DIETITIAN                    |
| 25  | Collagen timing over-specified        | 🟢 MINOR     | NUTRITIONIST                       |

---

# DEEP RESEARCH REQUIREMENTS PER AGENT

Each agent needs the same depth of evidence-based research we did for the COACH and NUTRITIONIST. Here's what's still missing:

### PHYSICIAN — Research Needed

1. **Subclinical deficiency prevalence in underweight women**: ferritin, vitamin D, B12, zinc — prevalence rates, symptom overlap, optimal levels for training
2. **Functional hypothalamic amenorrhea (FHA)**: diagnostic criteria, recovery timelines, when to refer, what questions to ask
3. **GI adaptation to caloric increase**: evidence on ramp-up protocols, gut microbiome changes, bloating management
4. **Psychology of intentional weight gain**: body image during bulking, evidence-based reframing techniques, when to refer
5. **Supplement-drug interaction database**: comprehensive safety matrix for all recommended supplements
6. **Female-specific exercise contraindications**: pelvic floor considerations, joint laxity during luteal phase, hypermobility screening

### SCIENTIST — Research Needed (mostly complete, gaps below)

1. **Menstrual cycle weight fluctuation**: quantified data on water retention patterns across the cycle for adjustment algorithm refinement
2. **NEAT measurement and prediction**: beyond Levine — practical indicators that NEAT has increased (step count correlation, etc.)
3. **Body composition estimation methods**: Navy method accuracy, bioimpedance reliability, when to recommend DEXA

### NUTRITIONIST — Research Needed (mostly complete, gaps below)

1. **Fiber optimization in calorie-dense diets**: minimum effective dose, best fiber sources that don't add volume
2. **Hydration requirements for creatine-supplementing women**: evidence-based targets
3. **Gut microbiome and caloric surplus**: does increased intake change gut flora? Probiotic considerations?
4. **Anti-nutrient interactions**: does high calcium (dairy-heavy diet) block iron absorption? Practical timing solutions.

### DIETITIAN — Research Needed (SIGNIFICANT GAPS)

1. **Concrete 7-day meal templates**: per-slot macros, alternatives, rotation schedule — this is the CORE GAP
2. **Batch cooking logistics**: food safety (storage times, reheating), container systems, portioning accuracy
3. **Portable high-calorie options**: for work, travel, gym bag — researched products and homemade options
4. **Food tracking methods comparison**: app accuracy, food scale necessity, portion estimation learning curve
5. **Budget optimization**: cost per gram of protein across common sources, seasonal substitutions

### CHEF — Research Needed (MAJOR GAPS — LEAST DEVELOPED AGENT)

1. **Recipe library creation**: 25+ recipes meeting macro specs across all meal slots and cuisines
2. **Batch cooking protocols**: tested workflows for 2 sessions/week, storage/reheating guidelines, sauce rotation
3. **Calorie-dense cooking techniques**: evidence-based techniques for maximizing kcal without increasing volume
4. **Shake formulations**: tested recipes with macro breakdowns, texture/palatability optimization
5. **Culinary science for protein**: optimal cooking methods to preserve protein bioavailability, Maillard reaction management
6. **Multi-cuisine high-protein recipe research**: Mediterranean, Asian, Latin, European traditions adapted for mass gain

### COACH — Research Needed (mostly complete, gaps below)

1. **Phase 0 anatomical adaptation**: evidence for form-learning duration, bodyweight progression, readiness criteria
2. **Warm-up protocols**: evidence-based warm-up templates for lower/upper body sessions
3. **Micro-loading evidence**: fractional plate effectiveness, rep-based progression alternatives
4. **Gym anxiety and female beginners**: evidence on environment barriers, practical solutions
5. **Home training alternative**: equipment-minimal program variant for days gym isn't accessible
