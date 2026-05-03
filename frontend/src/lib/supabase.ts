import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication functions
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return { data, error };
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
  });

  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Database access functions
export async function getAthleteProfile(userId: string) {
  const { data, error } = await supabase
    .from("athletes")
    .select("*")
    .eq("user_id", userId)
    .single();

  return { data, error };
}

export async function updateAthleteProfile(athleteId: number, profileData: any) {
  const { data, error } = await supabase
    .from("athletes")
    .update(profileData)
    .eq("id", athleteId)
    .select()
    .single();

  return { data, error };
}

export async function createWorkout(workoutData: any) {
  // First, create the workout
  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      athlete_id: workoutData.athlete_id,
      name: workoutData.name,
      date: workoutData.date,
      duration: workoutData.duration,
      type: workoutData.type,
      notes: workoutData.notes,
    })
    .select()
    .single();

  if (workoutError || !workout) {
    return { data: null, error: workoutError };
  }

  // Then, create the workout exercises
  const workoutExercises = workoutData.exercises.map((exercise: any) => ({
    workout_id: workout.id,
    exercise_id: exercise.exercise_id,
    sets: exercise.sets,
    reps: exercise.reps,
    weight: exercise.weight,
    distance: exercise.distance,
    time: exercise.time,
    notes: exercise.notes,
  }));

  const { data: exercises, error: exercisesError } = await supabase
    .from("workout_exercises")
    .insert(workoutExercises)
    .select();

  return {
    data: { ...workout, exercises },
    error: exercisesError,
  };
}

export async function getRecentWorkouts(athleteId: number, limit = 5) {
  const { data, error } = await supabase
    .from("workouts")
    .select(`
      *,
      exercises:workout_exercises(*, exercise:exercises(*))
    `)
    .eq("athlete_id", athleteId)
    .order("date", { ascending: false })
    .limit(limit);

  return { data, error };
}

export async function getTrainingRecommendations(athleteId: number) {
  const { data, error } = await supabase
    .from("training_recommendations")
    .select("*")
    .eq("athlete_id", athleteId)
    .gte("recommendation_date", new Date().toISOString().split("T")[0])
    .order("recommendation_date", { ascending: true });

  return { data, error };
}
