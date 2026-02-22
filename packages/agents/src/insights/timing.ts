interface InteractionEvent {
  event_type: string;
  created_at: Date | string;
}

export interface TimingPatterns {
  usual_checkin_day: number | null;
  usual_training_time: string | null;
  usual_meal_log_time: string | null;
  inactive_days: number[];
}

export function detectTimingPatterns(events: InteractionEvent[]): TimingPatterns {
  const checkinDays = new Map<number, number>();
  const trainingHours = new Map<number, number>();
  const mealLogHours = new Map<number, number>();
  const activeDays = new Set<number>();

  for (const event of events) {
    const date = new Date(event.created_at);
    const day = date.getDay();
    const hour = date.getHours();
    activeDays.add(day);

    if (event.event_type === "checkin") {
      checkinDays.set(day, (checkinDays.get(day) ?? 0) + 1);
    }
    if (event.event_type === "training_log") {
      trainingHours.set(hour, (trainingHours.get(hour) ?? 0) + 1);
    }
    if (event.event_type === "meal_log") {
      mealLogHours.set(hour, (mealLogHours.get(hour) ?? 0) + 1);
    }
  }

  const mostFrequent = (map: Map<number, number>) => {
    if (map.size === 0) return null;
    return [...map.entries()].sort((a, b) => b[1] - a[1])[0][0];
  };

  const inactive = [0, 1, 2, 3, 4, 5, 6].filter((d) => !activeDays.has(d));

  const trainingHour = mostFrequent(trainingHours);
  const mealHour = mostFrequent(mealLogHours);

  return {
    usual_checkin_day: mostFrequent(checkinDays),
    usual_training_time: trainingHour !== null ? `${trainingHour}:00` : null,
    usual_meal_log_time: mealHour !== null ? `${mealHour}:00` : null,
    inactive_days: inactive,
  };
}
