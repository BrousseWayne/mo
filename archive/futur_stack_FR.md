# MO - Multi-Agent Wellness Orchestrator

## VISION

Système de coaching premium pour femmes, architecture pipeline multi-agents où chaque spécialiste contribue séquentiellement à un plan personnalisé. Reconnaît explicitement la disparité de recherche homme/femme et optimise pour la physiologie féminine.

## PHILOSOPHIE CORE

- **Féminisation assumée**: Le gras n'est pas l'ennemi. Objectif = silhouette désirable, pas maigreur
- **Acceptation du gras stratégique**: OK si esthétique/sexy/désirable (hanches, fesses, poitrine)
- **Science female-first**: Prioriser études sur cohortes féminines, cycle menstruel, distribution adipocytaire femme

---

## ARCHITECTURE MULTI-AGENTS

### Pipeline d'exécution

```
[QUESTIONNAIRE]
    ↓
[MÉDECIN] → validation médicale, red flags, clearance
    ↓
[SCIENTIFIQUE] → analyse données, baselines, métriques objectives
    ↓
[NUTRITIONNISTE] → macro targets, timing, energy balance
    ↓
[DIÉTÉTICIEN] → plan alimentaire concret, adaptation préférences
    ↓
[CHEF ÉTOILÉ] → recettes, meal prep, gastronomie
    ↓
[COACH SPORTIF] → programme training, progression, périodisation
    ↓
[DERMATOLOGUE] (optionnel) → peau, cheveux, ongles, hydratation
    ↓
[OUTPUT CONSOLIDÉ]
```

### Agents & Couleurs

| Agent          | Couleur | Hex       | Responsabilité                                                      |
| -------------- | ------- | --------- | ------------------------------------------------------------------- |
| Médecin        | Rouge   | `#E63946` | Screening médical, contre-indications, red flags, clearance         |
| Scientifique   | Bleu    | `#457B9D` | Analyse data, calculs TDEE/macros, métriques, tracking stats        |
| Nutritionniste | Vert    | `#2A9D8F` | Stratégie nutritionnelle, energy balance, timing protéines          |
| Diététicien    | Orange  | `#F4A261` | Traduction en plan alimentaire, adaptation restrictions/préférences |
| Chef Étoilé    | Or      | `#E9C46A` | Recettes gourmandes, batch cooking, créativité culinaire            |
| Coach Sportif  | Violet  | `#9B5DE5` | Programmation training, exercices, progression, périodisation cycle |
| Dermatologue   | Rose    | `#F15BB5` | Santé peau/cheveux/ongles, hydratation, suppléments beauté          |

### Format Output Agent

Chaque agent produit un JSON structuré:

```json
{
  "agent": "NUTRITIONNISTE",
  "color": "#2A9D8F",
  "timestamp": "ISO8601",
  "status": "completed|blocked|needs_input",
  "input_received": {},
  "analysis": "string - raisonnement",
  "recommendations": [],
  "data_for_next_agent": {},
  "red_flags": [],
  "confidence": 0.0-1.0
}
```

---

## PERSISTENCE & DATA LAYER

### Base de données (PostgreSQL recommandé)

```sql
-- Tables principales
clients (id, profile_json, created_at, updated_at)
questionnaire_responses (id, client_id, responses_json, submitted_at)
agent_outputs (id, client_id, agent_name, output_json, created_at)
meal_plans (id, client_id, week_start, meals_json)
training_programs (id, client_id, phase, program_json)

-- Tracking courses & ingrédients
ingredients (id, name, category, unit, calories_per_unit, protein, carbs, fat)
inventory (id, client_id, ingredient_id, quantity, expiry_date, location)
shopping_list (id, client_id, ingredient_id, quantity, is_purchased, added_at)
shopping_trips (id, client_id, store, planned_date, completed_at, items_json)

-- Tracking progress
daily_logs (id, client_id, date, weight, sleep_hours, energy_level, cycle_day, notes)
workout_logs (id, client_id, date, exercises_json, rpe, duration, notes)
meal_logs (id, client_id, date, meals_json, calories, protein, adherence_score)

-- Alertes
alerts (id, client_id, type, message, trigger_condition, is_active, last_triggered)
```

### Fonctionnalités Tracking

1. **Inventory Management**

   - Ingrédients en stock (avec dates expiration)
   - Quantités restantes
   - Alertes stock bas

2. **Smart Shopping**

   - Génération liste courses depuis meal plan
   - Agrégation ingrédients multi-recettes
   - Optimisation par magasin/rayon

3. **Recettes Dynamiques**

   - Suggérer recettes avec ingrédients disponibles
   - Prioriser items proches expiration
   - Adapter portions au stock

4. **Alertes Push**
   - Courses à faire (stock bas)
   - Ingrédients à utiliser (expiration proche)
   - Rappels repas/training
   - Milestones atteints

---

## APPLICATION MOBILE (Android)

### Features Core

1. **Mode Courses**

   - Liste interactive (swipe to check)
   - Groupement par rayon
   - Scan code-barres pour ajouter
   - Mode offline avec sync

2. **Sync & Notifications**

   - Push alerts depuis serveur
   - Sync bidirectionnelle inventory
   - Rappels programmés

3. **Quick Log**
   - Log poids/sommeil/énergie
   - Photo repas (optionnel)
   - Check workout done

### Tech Stack Suggéré

- **Backend**: FastAPI + PostgreSQL + Redis (cache/queue)
- **Frontend Web**: Next.js ou SvelteKit
- **Mobile**: React Native ou Flutter
- **Orchestration Agents**: LangGraph ou CrewAI
- **Notifications**: Firebase Cloud Messaging

---

## SPÉCIFICATIONS AGENTS

### 1. MÉDECIN (Rouge #E63946)

**Input**: Questionnaire sections 5 (cycle), 7 (médical), 3 (injuries)

**Responsabilités**:

- Screening contre-indications absolues
- Identification red flags (aménorrhée, TCA, conditions chroniques)
- Clearance training (avec restrictions si applicable)
- Recommandations examens complémentaires

**Output critique**:

- `clearance_status`: approved | conditional | denied
- `restrictions`: liste limitations training/nutrition
- `referrals`: spécialistes à consulter
- `monitoring_flags`: points de vigilance

### 2. SCIENTIFIQUE (Bleu #457B9D)

**Input**: Questionnaire sections 1-4, output Médecin

**Responsabilités**:

- Calcul TDEE (Mifflin-St Jeor + multiplicateur activité)
- Définition surplus/déficit selon objectif
- Baselines métriques (poids, mensurations, force)
- Projection timeline réaliste
- Analyse profil métabolique et réponse attendue (NEAT, appetite pattern)

**Output critique**:

- `tdee_calculated`: nombre
- `caloric_target`: nombre (avec surplus/déficit)
- `macro_split`: {protein_g, carbs_g, fat_g}
- `timeline_projection`: {target_weight, weeks_estimated, rate_per_week}
- `tracking_metrics`: liste KPIs à suivre

### 3. NUTRITIONNISTE (Vert #2A9D8F)

**Input**: Output Scientifique, préférences alimentaires questionnaire

**Responsabilités**:

- Stratégie nutritionnelle globale
- Distribution protéines (MPS optimization)
- Timing nutrition peri-workout
- Stratégies appetite management (hardgainers)
- Intégration cycle menstruel (adaptation lutéale)

**Output critique**:

- `nutrition_strategy`: description approche
- `meal_frequency`: nombre repas/snacks
- `protein_distribution`: par repas
- `peri_workout_protocol`: pre/intra/post
- `cycle_adaptations`: folliculaire vs lutéale

### 4. DIÉTÉTICIEN (Orange #F4A261)

**Input**: Output Nutritionniste, restrictions/aversions questionnaire

**Responsabilités**:

- Plan alimentaire concret jour par jour
- Adaptation restrictions (allergies, culturel, préférences)
- Alternatives pour aversions
- Liste ingrédients standardisée
- Quantités précises

**Output critique**:

- `weekly_meal_plan`: structure 7 jours
- `daily_breakdown`: {meal: {foods, quantities, macros}}
- `ingredient_list`: ingrédients nécessaires avec quantités
- `substitution_guide`: alternatives par ingrédient
- `prep_notes`: batch cooking suggestions

### 5. CHEF ÉTOILÉ (Or #E9C46A)

**Input**: Output Diététicien, cuisine preferences questionnaire

**Responsabilités**:

- Transformation plan diététique en recettes gourmandes
- Créativité culinaire dans les contraintes
- Techniques de préparation
- Batch cooking optimisé
- Présentation/plaisir (l'oeil mange aussi)

**Output critique**:

- `recipes`: [{name, ingredients, steps, prep_time, cook_time, servings, macros_per_serving}]
- `weekly_prep_guide`: batch cooking plan
- `shopping_list_optimized`: agrégé par recette
- `flavor_notes`: suggestions épices/aromates
- `presentation_tips`: pour le plaisir visuel

### 6. COACH SPORTIF (Violet #9B5DE5)

**Input**: Output Scientifique, training history questionnaire, clearance Médecin

**Responsabilités**:

- Programme training périodisé
- Sélection exercices selon équipement/niveau
- Progression loads (principe Strong Curves / B2B)
- Intégration cycle menstruel (volume folliculaire vs lutéale)
- Form cues et technique

**Output critique**:

- `training_program`: structure par phase
- `weekly_schedule`: {day: {session_type, exercises, sets, reps, load, rest}}
- `progression_protocol`: règles d'augmentation
- `cycle_adjustments`: modifications par phase cycle
- `deload_protocol`: fréquence et structure

### 7. DERMATOLOGUE (Rose #F15BB5) [OPTIONNEL]

**Input**: Questionnaire (si questions peau ajoutées), outputs autres agents

**Responsabilités**:

- Impact nutrition sur peau/cheveux/ongles
- Hydratation recommandations
- Suppléments beauté (collagène, biotine, etc.)
- Alertes carences visibles

**Output critique**:

- `skin_nutrition_tips`: aliments bénéfiques
- `hydration_target`: litres/jour
- `supplement_suggestions`: si pertinent
- `warning_signs`: carences à surveiller

---

## QUESTIONNAIRE WEB

### Stack Technique

```
Frontend: Next.js / SvelteKit
- Multi-step form wizard
- Progress bar
- Validation temps réel
- Save & resume (localStorage + backend)
- Responsive mobile-first

Backend: FastAPI
- POST /api/questionnaire/submit
- GET /api/questionnaire/resume/{client_id}
- Validation Pydantic
- Stockage PostgreSQL

Auth:
- Magic link email (simple)
- Ou OAuth (Google/Apple)
```

### Flow Utilisateur

1. Landing page → CTA "Commencer mon bilan"
2. Email capture → Magic link envoyé
3. Questionnaire multi-step (8 sections)
4. Récapitulatif avant soumission
5. Confirmation → "Nos experts analysent votre profil"
6. Webhook trigger → Pipeline agents démarre
7. Notification email/push → "Votre programme est prêt"
8. Dashboard client → Accès programme complet

---

## ORCHESTRATION AGENTS

### Avec LangGraph

```python
from langgraph.graph import StateGraph, END

class WellnessState(TypedDict):
    questionnaire: dict
    medecin_output: dict | None
    scientifique_output: dict | None
    nutritionniste_output: dict | None
    dieteticien_output: dict | None
    chef_output: dict | None
    coach_output: dict | None
    dermatologue_output: dict | None
    final_program: dict | None

workflow = StateGraph(WellnessState)

workflow.add_node("medecin", medecin_agent)
workflow.add_node("scientifique", scientifique_agent)
workflow.add_node("nutritionniste", nutritionniste_agent)
workflow.add_node("dieteticien", dieteticien_agent)
workflow.add_node("chef", chef_agent)
workflow.add_node("coach", coach_agent)
workflow.add_node("dermatologue", dermatologue_agent)
workflow.add_node("consolidate", consolidate_outputs)

workflow.add_edge("medecin", "scientifique")
workflow.add_edge("scientifique", "nutritionniste")
workflow.add_edge("nutritionniste", "dieteticien")
workflow.add_edge("dieteticien", "chef")
workflow.add_edge("chef", "coach")

workflow.add_conditional_edges(
    "coach",
    lambda state: "dermatologue" if state.get("include_dermato") else "consolidate"
)
workflow.add_edge("dermatologue", "consolidate")
workflow.add_edge("consolidate", END)

workflow.set_entry_point("medecin")
app = workflow.compile()
```

### Logging Couleur (Terminal)

```python
AGENT_COLORS = {
    "MÉDECIN": "\033[38;2;230;57;70m",
    "SCIENTIFIQUE": "\033[38;2;69;123;157m",
    "NUTRITIONNISTE": "\033[38;2;42;157;143m",
    "DIÉTÉTICIEN": "\033[38;2;244;162;97m",
    "CHEF": "\033[38;2;233;196;106m",
    "COACH": "\033[38;2;155;93;229m",
    "DERMATOLOGUE": "\033[38;2;241;91;181m",
}
RESET = "\033[0m"

def log_agent(agent_name: str, message: str):
    color = AGENT_COLORS.get(agent_name, "")
    print(f"{color}[{agent_name}]{RESET} {message}")
```

---

## MVP ROADMAP

### Phase 1: Core Pipeline (Semaine 1-2)

- [ ] Setup projet (repo, env, deps)
- [ ] Questionnaire web basique (formulaire + API)
- [ ] Agents en mode script (sans orchestration)
- [ ] Output console coloré
- [ ] Stockage JSON/CSV

### Phase 2: Orchestration (Semaine 3-4)

- [ ] LangGraph pipeline complet
- [ ] PostgreSQL setup
- [ ] API endpoints CRUD
- [ ] Dashboard client basique

### Phase 3: Smart Features (Semaine 5-6)

- [ ] Gestion ingrédients/inventory
- [ ] Génération liste courses
- [ ] Recettes dynamiques

### Phase 4: Mobile (Semaine 7-8)

- [ ] App Android React Native
- [ ] Mode courses checklist
- [ ] Push notifications
- [ ] Sync offline

### Phase 5: Polish (Semaine 9+)

- [ ] Alertes intelligentes
- [ ] Historique/analytics
- [ ] Optimisations UX
- [ ] Tests utilisateurs

---

## EXEMPLE FLOW COMPLET

**Input**: Questionnaire Mo (56kg, 174cm, e, objectif 65kg, chicken thighs lover, home cook expérimenté, training 1j/2)

**Pipeline Execution**:

```
[MÉDECIN] ✓ Clearance approved, no restrictions
    → red_flags: none
    → clearance: approved

[SCIENTIFIQUE] ✓ Baselines calculated
    → TDEE: 1950 kcal
    → Target: 2700 kcal (+750 surplus aggressive hardgainer)
    → Macros: 115g P / 95g F / 340g C
    → Timeline: 36 weeks to 65kg @ 0.25kg/week

[NUTRITIONNISTE] ✓ Strategy defined
    → 5 meals/day (3 main + 2 snacks)
    → Protein: 25-30g per meal
    → Liquid calories strategy for appetite
    → Cycle: maintain volume follicular, flexible luteal

[DIÉTÉTICIEN] ✓ Meal plan created
    → 7-day rotating plan
    → Adapted: no peanut butter, chicken thighs focus
    → 47 unique meals planned

[CHEF ÉTOILÉ] ✓ Recipes crafted
    → 23 recettes gourmandes
    → Batch cooking: Sunday prep 2h
    → Shopping list: 67 ingrédients

[COACH SPORTIF] ✓ Program designed
    → 4x/week Upper/Lower split
    → Phase 1 (W1-4): Foundation
    → Progressive overload: +2.5% weekly
    → Cycle integration: -10% volume luteal

[CONSOLIDATION] ✓ Program ready
    → PDF exportable
    → Dashboard accessible
    → Tracking initialized
```

---

## NOTES TECHNIQUES

### Prompts Agents

Chaque agent a un system prompt dédié incluant:

1. Rôle et expertise spécifique
2. Input attendu (structure)
3. Output requis (structure JSON)
4. Références méthodologiques (Strong Curves, etc.)
5. Red flags spécifiques au domaine
6. Contraintes female-first

### Gestion Erreurs

- Agent bloqué → retry 3x puis escalade
- Red flag médical → pipeline stop, notification immédiate
- Conflits inter-agents → agent Scientifique arbitre
- Data manquante → questionnaire follow-up automatique

### Sécurité

- Données santé = sensibles → chiffrement at rest
- RGPD compliance → droit à l'oubli
- Pas de stockage passwords → magic links only
- API rate limiting

---

## À IMPLÉMENTER

1. **Structure projet** dans ~/Documents/mo
2. **System prompts** pour chaque agent
3. **Schéma DB** PostgreSQL
4. **API FastAPI** endpoints core
5. **Questionnaire frontend** Next.js
