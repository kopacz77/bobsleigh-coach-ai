/**
 * Daily feedback submitted by an athlete about their training session.
 */
export interface DailyFeedback {
  id: string;
  athleteId: string;
  date: Date;
  sessionRpe: number;
  muscleSoreness: number;
  energyLevel: number;
  motivationLevel: number;
  whatFeltGood?: string;
  whatFeltDifficult?: string;
  suggestedChanges?: string;
  createdAt: Date;
}

/**
 * A single set within an exercise.
 */
export interface ExerciseSet {
  setNumber: number;
  reps: number;
  weight: number;
  restSeconds: number;
  completed: boolean;
}

/**
 * An exercise definition.
 */
export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups?: string[];
  equipment?: string;
  description?: string;
}

/**
 * An exercise within a training session, including its sets and adaptation info.
 */
export interface SessionExercise {
  id: string;
  exercise: Exercise;
  sets: ExerciseSet[];
  isMainExercise: boolean;
  adaptationReason?: string;
  substitutedFrom?: string;
}

/**
 * A training session.
 */
export interface TrainingSession {
  id: string;
  date: Date;
  sessionType: string;
  duration: number;
  plannedDuration?: number;
  exercises: SessionExercise[];
  notes?: string;
}

/**
 * A load adjustment recommended by the AI.
 */
export interface LoadAdjustment {
  type: "increase" | "decrease" | "maintain";
  percentage: number;
  reason: string;
  confidence: number;
}

/**
 * A full session recommendation from the AI.
 */
export interface SessionRecommendation {
  session: TrainingSession;
  loadAdjustments: LoadAdjustment[];
  reasoning: string[];
  confidence: number;
  createdAt?: Date;
  modelVersion?: string;
}
