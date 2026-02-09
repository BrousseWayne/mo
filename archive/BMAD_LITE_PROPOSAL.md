# BMAD Lite — Proposition de simplification

_Analyse du framework BMAD v6.0.0-alpha.23 tel qu'installé sur Klox, et proposition d'une version allégée._

---

## Constat sur BMAD

### Ce qui a de la valeur

- **`project-context.md`** : 31 règles, stack, conventions, anti-patterns, templates. Rend le LLM immédiatement efficace.
- **Templates d'artifacts** : PRD, architecture, stories d'implémentation, sprint-status. Structure la progression.
- **Pipeline séquentiel** : Analysis → Planning → Solutioning → Implementation. Force la discipline.
- **Stories détaillées** : Tasks/subtasks, acceptance criteria, fichiers impactés, red-green-refactor.

### Ce qui est de l'overhead

- **9 agents personas** (Winston, John, Amelia...) : les prénoms et styles de communication n'améliorent pas la qualité des outputs.
- **5 niveaux d'indirection** : slash command → agent MD → XML activation → workflow.xml → workflow.yaml → template.
- **Système de menu numéroté** : transforme un LLM conversationnel en terminal interactif rigide.
- **Fichiers manifest** (agent-manifest.csv, workflow-manifest.csv, files-manifest.csv) : bureaucratie de configuration.
- **Module core** (brainstorming, party-mode, shard-doc, advanced-elicitation) : features rarement utilisées.
- **Coût en tokens** : 10-15k tokens de bootstrap avant de commencer à travailler.

---

## Proposition : BMAD Lite

### Principe

Garder les outputs et la discipline, virer la machinerie.

### Structure

```
CLAUDE.md                          # Inclut ou référence project-context.md
_templates/
  prd.md                           # Template PRD
  architecture.md                  # Template architecture
  story.md                         # Template story d'implémentation
  sprint-status.yaml               # Template suivi de sprint
.claude/commands/
  create-prd.md                    # Prompt direct : crée un PRD
  create-architecture.md           # Prompt direct : crée l'architecture
  create-story.md                  # Prompt direct : crée une story
  dev-story.md                     # Prompt direct : exécute une story (red-green-refactor)
  check-readiness.md               # Prompt direct : vérifie cohérence PRD/archi/stories
  code-review.md                   # Prompt direct : review de code
_output/
  planning-artifacts/              # PRD, architecture, epics, UX specs
  implementation-artifacts/        # Stories, sprint-status
```

### Slash commands simplifiés

| Commande | Action |
|----------|--------|
| `/create-prd` | Lit `_templates/prd.md`, crée un PRD dans `_output/planning-artifacts/` |
| `/create-architecture` | Lit `_templates/architecture.md`, crée le doc d'architecture |
| `/create-story` | Lit `_templates/story.md`, crée une story d'implémentation |
| `/dev-story` | Lit la story indiquée, exécute en red-green-refactor |
| `/check-readiness` | Vérifie que PRD + archi + stories existent et sont cohérents |
| `/code-review` | Review de code sur les changements récents |

### Ce qui est supprimé

- Les 9 agents personas
- Le workflow.xml engine
- Les fichiers manifest (CSV, YAML de config)
- Le système de menu numéroté
- Les activations XML multi-étapes
- Le module core (brainstorming, party-mode, shard-doc)
- Les handlers workflow/exec/tmpl/data/action
- La config multi-module (core + bmm)

### Ratio

Même discipline, ~90% moins de complexité. Un slash command = un fichier MD avec le prompt direct.

---

_Date : 2026-02-09_
