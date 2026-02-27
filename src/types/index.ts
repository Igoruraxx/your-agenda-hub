export interface Student {
  id: string;
  name: string;
  phone: string;
  plan: 'monthly' | 'session' | 'long_term';
  value: number;
  weeklyFrequency: number;
  selectedDays: string[];
  selectedTimes: string[];
  isConsulting: boolean;
  isActive: boolean;
  billingDay?: number | null;
  shareToken?: string | null;
  planDuration?: number | null;
  totalValue?: number | null;
  nextBillingDate?: string | null;
}

export type MuscleGroup =
  | 'peito' | 'costas' | 'ombros' | 'biceps' | 'triceps'
  | 'quadriceps' | 'posterior' | 'gluteos' | 'panturrilha'
  | 'abdomen' | 'trapezio' | 'antebraco' | 'full_body' | 'cardio';

export interface Appointment {
  id: string;
  studentId: string;
  studentName: string;
  date: Date;
  time: string;
  duration: number;
  sessionDone?: boolean;
  muscleGroups?: MuscleGroup[];
  phone?: string;
}

export interface EvolutionPhoto {
  id: string;
  studentId: string;
  date: Date;
  front: string;
  side: string;
  back: string;
}

export interface Bioimpedance {
  id: string;
  studentId: string;
  date: Date;
  image: string;
  data: {
    weight: number;
    bodyFatPct: number;
    bodyFatKg: number;
    muscleMass: number;
    visceralFat: number;
    leanMass: number;
    musclePct: number;
  };
}

export interface Measurement {
  id: string;
  studentId: string;
  date: Date;
  weight: number;
  height: number;
  measurements: {
    chest: number;
    waist: number;
    hip: number;
    arm: number;
    thigh: number;
    calf: number;
  };
  skinfolds: {
    triceps: number;
    biceps: number;
    subscapular: number;
    suprailiac: number;
    abdominal: number;
  };
}

// Subscription is now managed via Stripe
export type SubscriptionStatus = 'free' | 'active' | 'canceled' | 'past_due';

export interface PlanLimits {
  maxStudents: number;
  hasFinanceModule: boolean;
  hasEvolutionModule: boolean;
  hasAdvancedSchedule: boolean;
  hasExport: boolean;
  hasPrioritySupport: boolean;
}

export const PLAN_LIMITS: Record<SubscriptionStatus, PlanLimits> = {
  free: {
    maxStudents: 5,
    hasFinanceModule: false,
    hasEvolutionModule: false,
    hasAdvancedSchedule: false,
    hasExport: false,
    hasPrioritySupport: false,
  },
  active: {
    maxStudents: Infinity,
    hasFinanceModule: true,
    hasEvolutionModule: true,
    hasAdvancedSchedule: true,
    hasExport: true,
    hasPrioritySupport: true,
  },
  canceled: {
    maxStudents: 5,
    hasFinanceModule: false,
    hasEvolutionModule: false,
    hasAdvancedSchedule: false,
    hasExport: false,
    hasPrioritySupport: false,
  },
  past_due: {
    maxStudents: 5,
    hasFinanceModule: false,
    hasEvolutionModule: false,
    hasAdvancedSchedule: false,
    hasExport: false,
    hasPrioritySupport: false,
  },
};

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionProductId?: string;
  subscriptionEndDate?: string;
  isAdmin: boolean;
}

// For admin panel
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionProductId?: string;
  subscriptionEndDate?: string;
  studentCount: number;
  createdAt: string;
  roles: string[];
}

// Legacy compat — keep UserPlan alias
export type UserPlan = 'free' | 'premium';
