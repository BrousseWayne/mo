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
export { runPhysician } from "./agents/physician.js";
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
export type { AgentContext, PipelineResult } from "./types.js";
