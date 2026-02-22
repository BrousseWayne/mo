import "dotenv/config";
import { createDb } from "./client.js";
import { users, intakeResponses, programs } from "./schema.js";

const profiles = [
  {
    label: "reference",
    intake: {
      age: 28,
      height_cm: 174,
      current_weight_kg: 55,
      target_weight_kg: 65,
      training_status: "beginner",
      training_frequency_per_week: 3,
      estimated_daily_calories: 1800,
      daily_step_count: "lightly_active",
      menstrual_cycle_length: "26_30",
      cycle_tracking: true,
      sleep_hours: 7,
      stress_level: 4,
      food_aversions: ["peanut_butter", "nut_butters"],
      appetite_level: "low",
      cooking_skill: "basic",
      partner_cooks: true,
      equipment_access: "commercial_gym",
      gym_anxiety_level: "moderate",
    },
    program: {
      target_weight_kg: 65,
      current_weight_kg: 55,
      target_intake_kcal: 2338,
      protein_g: 99,
      fat_g: 78,
      carbs_g: 282,
      surplus_kcal: 500,
    },
  },
  {
    label: "intermediate",
    intake: {
      age: 30,
      height_cm: 168,
      current_weight_kg: 62,
      target_weight_kg: 70,
      training_status: "intermediate",
      training_frequency_per_week: 4,
      estimated_daily_calories: 2200,
      daily_step_count: "moderately_active",
      menstrual_cycle_length: "26_30",
      cycle_tracking: false,
      sleep_hours: 7.5,
      stress_level: 5,
      food_aversions: ["peanut_butter", "nut_butters"],
      appetite_level: "moderate",
      cooking_skill: "intermediate",
      partner_cooks: false,
      equipment_access: "commercial_gym",
      gym_anxiety_level: "low",
    },
    program: {
      target_weight_kg: 70,
      current_weight_kg: 62,
      target_intake_kcal: 2650,
      protein_g: 112,
      fat_g: 88,
      carbs_g: 310,
      surplus_kcal: 450,
    },
  },
  {
    label: "underweight-anxious",
    intake: {
      age: 22,
      height_cm: 160,
      current_weight_kg: 48,
      target_weight_kg: 58,
      training_status: "none",
      training_frequency_per_week: 0,
      daily_step_count: "sedentary",
      menstrual_cycle_length: "irregular",
      cycle_tracking: false,
      sleep_hours: 6,
      stress_level: 7,
      food_aversions: ["peanut_butter", "nut_butters"],
      appetite_level: "low",
      cooking_skill: "none",
      partner_cooks: false,
      equipment_access: "home_minimal",
      gym_anxiety_level: "high",
    },
    program: {
      target_weight_kg: 58,
      current_weight_kg: 48,
      target_intake_kcal: 2100,
      protein_g: 86,
      fat_g: 70,
      carbs_g: 250,
      surplus_kcal: 400,
    },
  },
];

async function seed() {
  const db = createDb(process.env.DATABASE_URL!);

  for (const profile of profiles) {
    const [user] = await db.insert(users).values({}).returning();

    const [intake] = await db
      .insert(intakeResponses)
      .values({ user_id: user.id, data: profile.intake })
      .returning();

    await db.insert(programs).values({
      user_id: user.id,
      intake_response_id: intake.id,
      ...profile.program,
    });

    console.log(`Seeded ${profile.label}: user=${user.id}`);
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed();
