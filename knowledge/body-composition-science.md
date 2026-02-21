# Body Composition Science Reference

Runtime-injectable knowledge for the SCIENTIST agent. Covers BMR derivation, activity factor calibration, surplus science, protein targets, body composition measurement, weight projection modeling, NEAT physiology, and myth-busting evidence.

---

## 1. BMR: Mifflin-St Jeor Derivation

### 1.1 The Equation

Women: BMR = 10 x weight(kg) + 6.25 x height(cm) - 5 x age(years) - 161
Men: BMR = 10 x weight(kg) + 6.25 x height(cm) - 5 x age(years) + 5

### 1.2 Why Mifflin-St Jeor Over Harris-Benedict

| Criterion | Mifflin-St Jeor (1990) | Harris-Benedict (1919) |
|---|---|---|
| Sample | 498 healthy adults (251 F, 247 M) | 136 men, 103 women |
| BMI range validated | 17-40 | 15-30 (extrapolation issues outside this) |
| Prediction accuracy | Within 10% for 82% of subjects | Within 10% for 69% of subjects |
| Overestimation bias | Minimal | Systematically overestimates by 5-15% in normal-weight women |
| ADA endorsement | Recommended by American Dietetic Association (Frankenfield 2005) | Superseded |

Frankenfield et al. 2005 compared 5 predictive equations across 9 validation studies (n=2,104). Mifflin-St Jeor had the lowest bias and highest accuracy across BMI categories, particularly for normal-weight and underweight individuals.

### 1.3 Limitations

- Lean mass not accounted for (Cunningham equation uses LBM but requires DEXA)
- Underweight populations (BMI <18.5) may have lower accuracy due to reduced organ mass
- Ethnic variation: may overestimate by 3-5% in East Asian populations (Song 2023)
- Does not account for adaptive thermogenesis from chronic under-eating

---

## 2. Activity Factor Calibration

### 2.1 Standard Multipliers

| Factor | Multiplier | Definition |
|---|---|---|
| Sedentary | 1.2 | Desk job, no structured exercise, <5,000 steps/day |
| Lightly active | 1.375 | Light exercise 1-3 days/week OR active occupation OR 7,000-9,000 steps/day |
| Moderately active | 1.55 | Structured training 3-5 days/week, moderate NEAT |
| Very active | 1.725 | Hard training 6-7 days/week OR physical occupation + training |
| Extremely active | 1.9 | Professional athlete, two-a-day training, high NEAT |

### 2.2 NEAT as Confounding Variable

Levine et al. 1999 demonstrated NEAT varies by up to 2,000 kcal/day between similar-sized individuals. NEAT includes all non-exercise movement: fidgeting, posture maintenance, standing, walking, gesticulating.

Levine et al. 2000 quantified fidgeting energy expenditure: +54% while seated, +94% while standing versus motionless baselines.

NEAT is the primary driver of inter-individual variation in energy expenditure. Two people with identical BMR and training schedules can differ by 500+ kcal/day in total expenditure due to NEAT alone.

### 2.3 Occupation-Based Adjustment

| Occupation Type | NEAT Modifier | Examples |
|---|---|---|
| Seated, low-movement | +0 | Office worker, programmer, student |
| Seated, moderate-movement | +0.05 | Teacher (seated + standing), sales |
| Standing/walking dominant | +0.1 | Retail, nursing, hospitality |
| Physical labor | +0.15-0.2 | Construction, agriculture, warehouse |

Apply modifier additively to the base activity factor. Example: structured training 4x/week (1.55) + nursing job (+0.1) = 1.65.

---

## 3. Surplus Calibration Science

### 3.1 Why Surplus is Required

Slater et al. 2019 reviewed energy surplus requirements for skeletal muscle hypertrophy:
- Muscle tissue is ~20% protein, ~75% water, ~5% minerals/glycogen
- Synthesizing 1 kg of muscle requires ~5,000-7,000 kcal above maintenance over time
- Surplus provides substrate availability that optimizes mTOR signaling and reduces muscle protein breakdown (MPB)

### 3.2 Surplus Magnitude and Partitioning

| Surplus Range | Classification | Best For | Muscle:Fat Ratio | Source |
|---|---|---|---|---|
| 200-300 kcal/day | Conservative | Trained individuals, slow recomp | Higher muscle proportion, slower progress | Garthe 2013 |
| 300-500 kcal/day | Moderate | Novice-intermediate trainees, standard lean bulk | Balanced muscle:fat gain | Slater 2019 |
| 500+ kcal/day | Aggressive | Severely underweight, appetite-limited, rapid restoration | Lower muscle proportion, faster total gain | Clinical practice |

Garthe et al. 2013 compared slow (+500 kcal/day) vs fast (+1,000 kcal/day) surplus in elite athletes over 8-12 weeks. Slow surplus group gained more lean mass relative to fat mass. However, the fast group gained more absolute lean mass.

### 3.3 Metabolic Adaptation and NEAT Upregulation

When caloric intake increases:
- BMR increases modestly (thermic effect of food, increased lean mass over time)
- NEAT may upregulate involuntarily — the body "wastes" excess energy through movement
- This can offset 200-500 kcal/day of intended surplus
- Bouchard et al. 1990 overfed 12 pairs of twins by 1,000 kcal/day for 84 days. All gained weight, but inter-individual variance was 3-fold (4.3-13.3 kg gained)

Management: if weight gain stalls despite verified intake, add 200-300 kcal rather than assuming non-compliance. NEAT upregulation is the most common explanation.

### 3.4 Ramp-Up Rationale

Gradual caloric ramp-up (vs immediate full surplus) serves three purposes:
1. GI adaptation: prevents bloating, nausea, and reflux from sudden volume increase
2. Psychological adjustment: prevents feeling overwhelmed by food volume
3. NEAT buffering: allows the body to adapt thermogenically in stages

Typical ramp: +200-300 kcal/week over 2-3 weeks to reach target surplus.

---

## 4. Protein Target Evidence

### 4.1 Dose-Response for Hypertrophy

Morton et al. 2018 meta-analysis (49 studies, 1,863 participants):
- Protein breakpoint for maximal lean mass gain: 1.62 g/kg/day (95% CI: 1.03-2.20)
- Benefits plateau beyond 2.2 g/kg/day
- No significant benefit from exceeding 1.6 g/kg in most populations

### 4.2 Range Justification: 1.6-2.2 g/kg

| Subgroup | Recommended Range | Rationale |
|---|---|---|
| Novice trainee in surplus | 1.6-1.8 g/kg | Surplus provides energy substrate; lower protein sufficient |
| Intermediate trainee | 1.8-2.0 g/kg | Higher training stress increases turnover |
| Underweight (BMI <18.5) | 1.8-2.2 g/kg | Higher per-kg target compensates for low absolute intake at low body weight |
| During caloric deficit | 2.0-2.4 g/kg | Higher protein preserves lean mass during restriction (Helms 2014) |

### 4.3 Leucine Threshold Connection

Each protein-containing meal must deliver ~2.5g leucine to trigger mTORC1 activation and MPS (Witard 2014). This translates to ~20-25g of quality protein per meal (whey) or ~25-35g from whole food sources with lower leucine density.

### 4.4 Protein and Body Weight Recalculation

Protein targets should be recalculated monthly as body weight increases. At +5 kg gained, the difference in absolute protein can be 8-11g/day (significant for macro distribution).

---

## 5. Body Composition Measurement Science

### 5.1 Method Comparison

| Method | Accuracy vs DEXA | Cost | Best Use | Limitations |
|---|---|---|---|---|
| DEXA | Gold standard (TE ~1.0-1.5%) | High | Baseline + quarterly assessments | Radiation exposure (minimal), hydration-sensitive |
| Bioelectrical impedance (BIA) | r = 0.85-0.95, underestimates BF% by 2-4% | Low | Monthly trend tracking | Hydration-sensitive, equation-dependent, poor at extremes |
| Skinfold calipers | TE ~3-4% vs DEXA | Low | Supplementary data point | Practitioner-dependent, poor reproducibility |
| Navy method (circumferences) | TE ~3-5% | Free | Self-monitoring | Only estimates total BF%, no regional data |

### 5.2 Practical Recommendations

- Use DEXA at baseline and every 3 months for ground truth
- Use BIA for monthly trend tracking (same time, same hydration state, same device)
- Never use a single method's absolute values for decisions — track trends
- Circumference measurements (waist, hip, limb) provide independent composition data

### 5.3 Menstrual Cycle Impact on Measurements

Luteal phase water retention (0.5-2.3 kg) affects all methods:
- BIA: most distorted (electrical conductivity changes with hydration)
- DEXA: moderately affected (water distributed across compartments)
- Skinfolds: least affected (subcutaneous water effect minimal)
- Weigh-ins: always compare same cycle phase month-over-month
- Optimal measurement window: days 7-10 (mid-follicular, lowest water retention)

---

## 6. Weight Projection Modeling

### 6.1 Expected Gain Rates

| Component | Rate | Timeframe | Source |
|---|---|---|---|
| Muscle (female, year 1) | 0.23-0.45 kg/month | Ongoing with training | Practitioner consensus; Roberts 2020 |
| Fat (in surplus) | Variable, depends on surplus magnitude | Ongoing | Slater 2019 |
| Water + glycogen (creatine) | 1-2 kg | First 1-3 weeks | Kreider 2017 |
| Water + glycogen (carb loading) | 0.5-1.5 kg | First 1-2 weeks of surplus | Olsson 1970 |

### 6.2 Initial Weight Jump

In the first 2-4 weeks of a surplus + creatine protocol, expect 1.5-3.5 kg of non-tissue weight gain (water + glycogen). This is functional weight, not fat, and should not trigger caloric adjustment.

### 6.3 Timeline Estimation

For a 10 kg total gain (e.g., 55 kg to 65 kg):
- Initial water/glycogen: 2-3 kg in weeks 1-4
- Remaining 7-8 kg at 0.25-0.5 kg/week: 14-32 weeks
- Total estimated timeline: 4-9 months (with consistent surplus and training)
- Conservative estimate accounting for stalls, holidays, illness: 8-14 months

### 6.4 Rate-of-Gain Guardrails

| Weekly Rate | Classification | Action |
|---|---|---|
| <0.25 kg/week (post-adaptation) | Insufficient gain | Add +200 kcal after 2 consecutive weeks |
| 0.25-0.5 kg/week | Target range | Maintain current intake |
| 0.5-0.75 kg/week | Elevated | Monitor — may include water fluctuation |
| >0.75 kg/week (post-adaptation) | Excessive | Reduce by 150 kcal, check waist:hip ratio |

---

## 7. Myth-Busting Evidence Base

### 7.1 "Fast/Slow Metabolism"

Johnstone et al. 2005 measured BMR in 150 adults:
- 63% of BMR variance explained by fat-free mass
- 11% by fat mass
- 26% unexplained (includes NEAT, fidgeting, hormonal variation)
- Between two similar-sized individuals, actual BMR differs by only 5-8% (~100-150 kcal/day)
- The perceived "fast metabolism" is almost always high NEAT, not elevated BMR

### 7.2 Somatotypes Are Pseudoscience

Sheldon's 1940s somatotype classification (ectomorph/mesomorph/endomorph) was developed from eugenics-linked body photography, not metabolic research.

Rafter 2007 documented the methodology as comparable to phrenology in scientific rigor.

Peeters et al. 2007 measured heritability of body composition traits:
- Endomorphy (tendency to store fat): h² = 28-32% (highly modifiable)
- Mesomorphy (muscularity): h² = 82-86% (more genetic, but still trainable)
- Current phenotype reflects habits + environment, not a fixed destiny

### 7.3 "I Eat a Lot But Cannot Gain Weight"

Two mechanisms explain this:
1. Intake overestimation: underweight individuals consistently overestimate consumption by 30-50% in self-report studies
2. NEAT upregulation: Levine 1999 showed the body increases unconscious movement when overfed, offsetting 500+ kcal/day

Bouchard et al. 1990: 100% of 24 participants gained weight when overfed by 1,000 kcal/day for 84 days under controlled conditions. Weight gain is thermodynamically inevitable under verified surplus.

### 7.4 "Toning" Is Not a Physiological Process

Muscles hypertrophy (grow) or atrophy (shrink). There is no mechanism for "toning" — the visual effect described as "toned" is the result of muscle hypertrophy combined with moderate body fat levels. Muscle shape (origin and insertion points) is genetically determined and cannot be altered through exercise selection.

### 7.5 Female Hypertrophy Rates

Roberts et al. 2020 meta-analysis: relative hypertrophy response is identical between men and women (effect size = 0.07, p = 0.31). Women gain muscle at similar rates relative to their starting mass. Absolute gains are smaller due to lower baseline muscle mass and testosterone, but the training response per unit of existing muscle is equivalent.

---

## 8. Menstrual Cycle-Aware Tracking

### 8.1 Water Retention by Phase

| Phase | Days | Weight Effect | Mechanism |
|---|---|---|---|
| Early follicular | 1-5 | Baseline (lowest) | Estrogen and progesterone both low |
| Mid-follicular | 6-13 | Stable | Rising estrogen, minimal retention |
| Ovulatory | 14 | Slight rise possible | Estrogen peak |
| Early luteal | 15-21 | +0.5-1.0 kg | Progesterone rises, aldosterone effect |
| Late luteal | 22-28 | +1.0-2.3 kg | Peak progesterone, sodium retention |

### 8.2 Tracking Protocol

- Compare weight only at same cycle phase, month-over-month
- Optimal weigh-in: days 7-10 (mid-follicular, lowest water retention)
- If cycle is irregular: use 4-week rolling average instead
- Never adjust calories based on luteal phase weight increases

---

## 9. References

| Reference | Year | Finding | Application |
|---|---|---|---|
| Mifflin et al. | 1990 | Most accurate BMR prediction equation | BMR calculation |
| Frankenfield et al. | 2005 | Mifflin-St Jeor validated as most accurate across 9 studies | BMR equation selection |
| Morton et al. | 2018 | Protein breakpoint at 1.62 g/kg | Protein targets |
| Garthe et al. | 2013 | Slow surplus produces better muscle:fat ratio | Surplus calibration |
| Slater et al. | 2019 | Moderate surplus (300-500 kcal) optimizes lean gain | Surplus calibration |
| Levine et al. | 1999 | NEAT varies up to 2,000 kcal/day | Non-responder identification |
| Levine et al. | 2000 | Fidgeting: +54% seated, +94% standing energy | NEAT monitoring |
| Bouchard et al. | 1990 | 100% gain under controlled surplus | Countering gain resistance claims |
| Johnstone et al. | 2005 | BMR CV 5-8%, 63% variance = lean mass | Debunking metabolism myths |
| Roberts et al. | 2020 | Identical relative hypertrophy men/women | Female muscle gain expectations |
| Peeters et al. | 2007 | Endomorphy h²=28-32% | Genetic influence framing |
| Rafter | 2007 | Somatotypes = pseudoscience | Debunking body type claims |
| Mumford et al. | 2016 | Dietary fat supports hormonal function | Fat intake minimums |
| Kreider et al. | 2017 | Creatine safety and efficacy | Creatine water weight expectations |
| Witard et al. | 2014 | Leucine threshold ~2.5g per meal | Protein per-meal minimums |
| Helms et al. | 2014 | Higher protein preserves lean mass in deficit | Protein range upper bound |
| Olsson & Saltin | 1970 | Glycogen supercompensation and water storage | Initial weight jump expectations |
