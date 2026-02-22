import { z } from "zod";

export const subjectiveMarkersSchema = z.object({
  energy: z.number().int().min(1).max(10),
  sleep_quality: z.number().int().min(1).max(10),
  mood: z.number().int().min(1).max(10),
  appetite: z.number().int().min(1).max(10),
});

export type SubjectiveMarkers = z.infer<typeof subjectiveMarkersSchema>;

export const trainingLogEntrySchema = z.object({
  name: z.string(),
  best_set: z.object({
    weight_kg: z.number(),
    reps: z.number().int(),
  }),
  progressed: z.boolean(),
});

export const trainingLogSchema = z.object({
  sessions_completed: z.number().int(),
  exercises: z.array(trainingLogEntrySchema),
});

export type TrainingLog = z.infer<typeof trainingLogSchema>;

export const weeklyCheckinSchema = z.object({
  weight_kg: z.number().positive(),
  waist_cm: z.number().positive().optional(),
  hip_cm: z.number().positive().optional(),
  cycle_phase: z.enum(["follicular", "luteal", "menstrual"]).optional(),
  cycle_day: z.number().int().min(1).optional(),
  training_log: trainingLogSchema.optional(),
  subjective_markers: subjectiveMarkersSchema.optional(),
  minimum_viable_days_count: z.number().int().min(0).max(7).optional(),
  notes: z.string().optional(),
});

export type WeeklyCheckin = z.infer<typeof weeklyCheckinSchema>;
