export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          subscription_status: 'free' | 'active' | 'canceled' | 'past_due';
          subscription_product_id: string | null;
          subscription_end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: 'free' | 'active' | 'canceled' | 'past_due';
          subscription_product_id?: string | null;
          subscription_end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: 'free' | 'active' | 'canceled' | 'past_due';
          subscription_product_id?: string | null;
          subscription_end_date?: string | null;
          updated_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'admin' | 'user';
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'admin' | 'user';
        };
        Update: {
          role?: 'admin' | 'user';
        };
      };
      students: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string;
          plan: 'monthly' | 'session' | 'long_term';
          value: number;
          weekly_frequency: number;
          selected_days: string[];
          selected_times: string[];
          is_consulting: boolean;
          is_active: boolean;
          billing_day: number | null;
          share_token: string | null;
          plan_duration: number | null;
          total_value: number | null;
          next_billing_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          phone?: string;
          plan?: 'monthly' | 'session' | 'long_term';
          value?: number;
          weekly_frequency?: number;
          selected_days?: string[];
          selected_times?: string[];
          is_consulting?: boolean;
          is_active?: boolean;
          billing_day?: number | null;
          share_token?: string | null;
          plan_duration?: number | null;
          total_value?: number | null;
          next_billing_date?: string | null;
        };
        Update: {
          name?: string;
          phone?: string;
          plan?: 'monthly' | 'session' | 'long_term';
          value?: number;
          weekly_frequency?: number;
          selected_days?: string[];
          selected_times?: string[];
          is_consulting?: boolean;
          is_active?: boolean;
          billing_day?: number | null;
          share_token?: string | null;
          plan_duration?: number | null;
          total_value?: number | null;
          next_billing_date?: string | null;
          updated_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          user_id: string;
          student_id: string;
          date: string;
          time: string;
          duration: number;
          session_done: boolean;
          muscle_groups: string[];
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          student_id: string;
          date: string;
          time: string;
          duration?: number;
          session_done?: boolean;
          muscle_groups?: string[];
          notes?: string | null;
        };
        Update: {
          student_id?: string;
          date?: string;
          time?: string;
          duration?: number;
          session_done?: boolean;
          muscle_groups?: string[];
          notes?: string | null;
          updated_at?: string;
        };
      };
      evolution_photos: {
        Row: {
          id: string;
          user_id: string;
          student_id: string;
          date: string;
          front_url: string | null;
          side_url: string | null;
          back_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          student_id: string;
          date: string;
          front_url?: string | null;
          side_url?: string | null;
          back_url?: string | null;
        };
        Update: {
          date?: string;
          front_url?: string | null;
          side_url?: string | null;
          back_url?: string | null;
        };
      };
      bioimpedance: {
        Row: {
          id: string;
          user_id: string;
          student_id: string;
          date: string;
          image_url: string | null;
          weight: number;
          body_fat_pct: number;
          body_fat_kg: number;
          muscle_mass: number;
          visceral_fat: number;
          lean_mass: number;
          muscle_pct: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          student_id: string;
          date: string;
          image_url?: string | null;
          weight: number;
          body_fat_pct: number;
          body_fat_kg: number;
          muscle_mass: number;
          visceral_fat: number;
          lean_mass: number;
          muscle_pct: number;
        };
        Update: {
          date?: string;
          image_url?: string | null;
          weight?: number;
          body_fat_pct?: number;
          body_fat_kg?: number;
          muscle_mass?: number;
          visceral_fat?: number;
          lean_mass?: number;
          muscle_pct?: number;
        };
      };
      measurements: {
        Row: {
          id: string;
          user_id: string;
          student_id: string;
          date: string;
          weight: number;
          height: number;
          chest: number;
          waist: number;
          hip: number;
          arm: number;
          thigh: number;
          calf: number;
          sf_triceps: number;
          sf_biceps: number;
          sf_subscapular: number;
          sf_suprailiac: number;
          sf_abdominal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          student_id: string;
          date: string;
          weight: number;
          height: number;
          chest?: number;
          waist?: number;
          hip?: number;
          arm?: number;
          thigh?: number;
          calf?: number;
          sf_triceps?: number;
          sf_biceps?: number;
          sf_subscapular?: number;
          sf_suprailiac?: number;
          sf_abdominal?: number;
        };
        Update: {
          date?: string;
          weight?: number;
          height?: number;
          chest?: number;
          waist?: number;
          hip?: number;
          arm?: number;
          thigh?: number;
          calf?: number;
          sf_triceps?: number;
          sf_biceps?: number;
          sf_subscapular?: number;
          sf_suprailiac?: number;
          sf_abdominal?: number;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          student_id: string;
          amount: number;
          due_date: string;
          paid_at: string | null;
          status: 'pending' | 'paid' | 'overdue';
          month_ref: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          student_id: string;
          amount: number;
          due_date: string;
          paid_at?: string | null;
          status?: 'pending' | 'paid' | 'overdue';
          month_ref: string;
        };
        Update: {
          amount?: number;
          due_date?: string;
          paid_at?: string | null;
          status?: 'pending' | 'paid' | 'overdue';
        };
      };
    };
    Views: {};
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: 'admin' | 'user' };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: 'admin' | 'user';
    };
  };
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type UserRole = Database['public']['Tables']['user_roles']['Row'];

export type DbStudent = Database['public']['Tables']['students']['Row'];
export type DbStudentInsert = Database['public']['Tables']['students']['Insert'];
export type DbStudentUpdate = Database['public']['Tables']['students']['Update'];

export type DbAppointment = Database['public']['Tables']['appointments']['Row'];
export type DbAppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type DbAppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

export type DbEvolutionPhoto = Database['public']['Tables']['evolution_photos']['Row'];
export type DbBioimpedance = Database['public']['Tables']['bioimpedance']['Row'];
export type DbMeasurement = Database['public']['Tables']['measurements']['Row'];
export type DbPayment = Database['public']['Tables']['payments']['Row'];
