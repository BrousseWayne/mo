export { runPipeline } from "./pipeline.js";
export { runScientist } from "./agents/scientist.js";
export { runCoach } from "./agents/coach.js";
export { runNutritionist } from "./agents/nutritionist.js";
export { runDietitian } from "./agents/dietitian.js";
export {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
  calculateRampUp,
  calculateWeightProjection,
} from "./tools/scientist.js";
export {
  assignPhase,
  calculateWeeklyVolume,
  checkProgressiveOverload,
  scheduleDeload,
} from "./tools/coach.js";
export {
  distributeProtein,
  buildSupplementProtocol,
  calculateHydration,
  applyCycleAdjustments,
} from "./tools/nutritionist.js";
export {
  allocateMealSlots,
  applyCalorieTier,
  buildEmergencyProtocol,
} from "./tools/dietitian.js";
export { runPhysician, runPhysicianProactiveReview, detectProactiveConcerns } from "./agents/physician.js";
export {
  classifyRedFlag,
  lookupSupplementSafety,
  assessRefeedingRisk,
} from "./tools/physician.js";
export { runChef } from "./agents/chef.js";
export {
  calculateRecipeMacros,
  scaleBatch,
  composeShake,
} from "./tools/chef.js";
export { lookupIngredient, INGREDIENT_TABLE } from "./tools/ingredients.js";
export {
  nutritionTools,
  executeNutritionTool,
  isNutritionTool,
} from "./tools/nutrition.js";
export type { NutritionToolName } from "./tools/nutrition.js";
export { UsdaFdcClient, createUsdaFdcClient } from "./clients/usda-fdc.js";
export { NutritionCache, createNutritionCache } from "./clients/nutrition-cache.js";
export type { AgentContext, PipelineResult } from "./types.js";
export { createTraceCollector } from "./agents/trace.js";
export type { LlmTrace, TraceCollector } from "./agents/trace.js";
export { computeCompliance } from "./tools/compliance.js";
export type { ComplianceReport } from "./tools/compliance.js";
export { evaluateAllTriggers } from "./triggers/engine.js";
export { getAgentsToRerun } from "./triggers/reexecution-map.js";
export * from "./triggers/evaluators.js";
export { executeAdjustments } from "./triggers/executor.js";
export type { ProgramAdjustmentUpdates, ClientProfile } from "./triggers/executor.js";
export { processCheckin } from "./checkin/process-checkin.js";
export type { CheckinResult } from "./checkin/process-checkin.js";
export { generateWeekSessions } from "./training/generate-week.js";
export type { LoggedSession, LoggedExercise } from "./training/generate-week.js";
export { createLlmClient, HeadlessLlmClient, ApiLlmClient, extractJson } from "./llm/index.js";
export type { LlmJsonClient, LlmJsonRequest, LlmMode } from "./llm/index.js";
export { generateShoppingList } from "./tools/shopping.js";
export { scaleRecipe } from "./tools/recipe-utils.js";
export { detectNewMilestones } from "./tools/milestones.js";
export { generateExplanation } from "./tools/explanations.js";
export { generateInsights } from "./insights/engine.js";
export { checkCompletionCriteria, generateCompletionSummary } from "./tools/completion.js";
export { detectImplicitPreferences } from "./tools/preferences.js";
export type { ImplicitPreferences } from "./tools/preferences.js";
export { detectTimingPatterns } from "./insights/timing.js";
export { generateCuriosityHook, generatePipelineHook } from "./insights/hooks.js";
export { generateReengagementPrompt } from "./insights/reengagement.js";
export { lookupTechnique, listTechniques } from "./tools/techniques.js";
export { detectRepetition } from "./insights/variety.js";
export { detectWeightAnomaly, detectMeasurementInconsistency } from "./tools/anomaly.js";
export { detrendWeight, rollingAverage } from "./tools/detrending.js";
export { projectTrajectory, getTrajectoryDeviation } from "./tools/trajectory.js";
export { detectScientistHallucinations, detectChefHallucinations } from "./validation/hallucination.js";
export type { Insight } from "./insights/generators.js";
export type { Milestone } from "./tools/milestones.js";
export { formatAgentOutput, formatScientistOutput, formatCoachOutput, formatChefOutput, formatNutritionistOutput, formatDietitianOutput, formatPhysicianOutput } from "./formatting/user-messages.js";
export { generateAdjustmentNarrative } from "./formatting/adjustment-narrative.js";
export { generateWeeklyReport } from "./formatting/weekly-report.js";
export { parseMealTemplate } from "./artifacts/parse-meal-template.js";
export { parseTrainingProgram } from "./artifacts/parse-training-program.js";
export { buildScientistPayload } from "./artifacts/scientist-payload.js";
export { createProgramFromArtifacts, buildEnvelope } from "./artifacts/create-program.js";
export { PHASE_TRAINING_ARTIFACTS } from "./artifacts/phase-artifacts.js";
export { autoregulateSession } from "./tools/autoregulation.js";
export { detectCrossAgentSignals } from "./tools/signals.js";
export type { CrossAgentSignal } from "./tools/signals.js";
