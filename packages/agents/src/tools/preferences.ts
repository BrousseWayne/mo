interface TrainingSession {
  status: string;
  exercises?: unknown;
}

interface InteractionEvent {
  event_type: string;
  metadata?: Record<string, unknown> | null;
}

export interface ImplicitPreferences {
  avoided_foods: string[];
  preferred_foods: string[];
  skipped_meals: { slot: string; frequency: number }[];
}

export function detectImplicitPreferences(
  sessions: TrainingSession[],
  events: InteractionEvent[]
): ImplicitPreferences {
  const avoided: Set<string> = new Set();
  const preferred: Set<string> = new Set();
  const skippedSlots = new Map<string, number>();

  for (const event of events) {
    if (event.event_type === "meal_swap" && event.metadata) {
      const original = event.metadata.original_food as string | undefined;
      const replacement = event.metadata.replacement_food as string | undefined;
      if (original) avoided.add(original.toLowerCase());
      if (replacement) preferred.add(replacement.toLowerCase());
    }

    if (event.event_type === "recipe_rating" && event.metadata) {
      const rating = event.metadata.rating as number | undefined;
      const recipeName = event.metadata.recipe_name as string | undefined;
      if (rating && rating >= 4 && recipeName) preferred.add(recipeName.toLowerCase());
      if (rating && rating <= 2 && recipeName) avoided.add(recipeName.toLowerCase());
    }

    if (event.event_type === "meal_log" && event.metadata) {
      const slot = event.metadata.slot as string | undefined;
      const skipped = event.metadata.skipped as boolean | undefined;
      if (slot && skipped) {
        skippedSlots.set(slot, (skippedSlots.get(slot) ?? 0) + 1);
      }
    }
  }

  return {
    avoided_foods: [...avoided],
    preferred_foods: [...preferred],
    skipped_meals: [...skippedSlots.entries()]
      .map(([slot, frequency]) => ({ slot, frequency }))
      .sort((a, b) => b.frequency - a.frequency),
  };
}
