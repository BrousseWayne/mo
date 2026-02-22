import { RE_EXECUTION_MAP, AGENTS } from "@mo/shared";
import type { TriggerResult } from "@mo/shared";

export function getAgentsToRerun(triggers: TriggerResult[]): {
  rerun: string[];
  skip: string[];
} {
  const rerunSet = new Set<string>();
  const allAgents = new Set(AGENTS);

  for (const trigger of triggers) {
    const mapping = RE_EXECUTION_MAP[trigger.trigger_type];
    if (mapping) {
      for (const agent of mapping.rerun) {
        rerunSet.add(agent);
      }
    }
  }

  const rerun = [...allAgents].filter((a) => rerunSet.has(a));
  const skip = [...allAgents].filter((a) => !rerunSet.has(a));

  return { rerun, skip };
}
