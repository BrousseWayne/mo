interface Recipe {
  recipe_name: string;
  cuisine: string;
  meal_pattern?: { protein?: string } | null;
}

interface TrainingSession {
  exercises?: { name: string }[];
}

export interface RepetitionReport {
  repeated_breakfasts: string[];
  same_cuisine_streak: number;
  stale_exercises: string[];
}

export function detectRepetition(
  recipes: Recipe[],
  sessions: TrainingSession[]
): RepetitionReport {
  const nameCount = new Map<string, number>();
  for (const r of recipes) {
    const key = r.recipe_name.toLowerCase();
    nameCount.set(key, (nameCount.get(key) ?? 0) + 1);
  }
  const repeated = [...nameCount.entries()]
    .filter(([, count]) => count >= 3)
    .map(([name]) => name);

  let maxCuisineStreak = 0;
  let currentStreak = 1;
  for (let i = 1; i < recipes.length; i++) {
    if (recipes[i].cuisine === recipes[i - 1].cuisine) {
      currentStreak++;
      maxCuisineStreak = Math.max(maxCuisineStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  const exerciseCount = new Map<string, number>();
  for (const s of sessions) {
    const exercises = s.exercises ?? [];
    for (const e of exercises) {
      exerciseCount.set(e.name, (exerciseCount.get(e.name) ?? 0) + 1);
    }
  }
  const totalSessions = sessions.length || 1;
  const stale = [...exerciseCount.entries()]
    .filter(([, count]) => count / totalSessions > 0.8)
    .map(([name]) => name);

  return {
    repeated_breakfasts: repeated,
    same_cuisine_streak: maxCuisineStreak,
    stale_exercises: stale,
  };
}
