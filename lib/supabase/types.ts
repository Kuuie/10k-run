export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: "admin" | "user";
          created_at: string;
          active: boolean;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: "admin" | "user";
          created_at?: string;
          active?: boolean;
        };
        Update: Partial<{
          id: string;
          email: string;
          name: string | null;
          role: "admin" | "user";
          created_at: string;
          active: boolean;
        }>;
      };
      challenges: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          start_date: string;
          week_start_day: number;
          weekly_distance_target_km: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          start_date: string;
          week_start_day?: number;
          weekly_distance_target_km?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<ChallengesRow>;
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          activity_date: string;
          distance_km: number;
          duration_minutes: number | null;
          activity_type: "run" | "walk" | "jog";
          proof_url: string | null;
          screenshot_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          activity_date: string;
          distance_km: number;
          duration_minutes?: number | null;
          activity_type: "run" | "walk" | "jog";
          proof_url?: string | null;
          screenshot_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ActivitiesRow>;
      };
      weekly_results: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          week_start_date: string;
          week_end_date: string;
          total_distance_km: number;
          met_target: boolean;
          overridden_by_admin: boolean;
          excused: boolean;
          rollover_km: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          week_start_date: string;
          week_end_date: string;
          total_distance_km?: number;
          met_target?: boolean;
          overridden_by_admin?: boolean;
          excused?: boolean;
          rollover_km?: number;
          updated_at?: string;
        };
        Update: Partial<WeeklyResultsRow>;
      };
    };
    Enums: {
      role: "admin" | "user";
      activity_type: "run" | "walk" | "jog";
    };
  };
};

export type ChallengesRow = Database["public"]["Tables"]["challenges"]["Row"];
export type ActivitiesRow = Database["public"]["Tables"]["activities"]["Row"];
export type WeeklyResultsRow = Database["public"]["Tables"]["weekly_results"]["Row"];
export type UserProfile = Database["public"]["Tables"]["users"]["Row"];

// New feature types
export type Badge = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: "achievement" | "milestone" | "streak";
  threshold_value: number | null;
  created_at: string;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
};

export type ActivityCheer = {
  id: string;
  activity_id: string;
  user_id: string;
  emoji: string | null;
  comment: string | null;
  created_at: string;
  user?: { name: string | null; email: string };
};

export type ActivityPreset = {
  id: string;
  user_id: string;
  name: string;
  distance_km: number;
  duration_minutes: number | null;
  activity_type: "run" | "walk" | "jog";
  created_at: string;
};

export type TeamGoal = {
  id: string;
  challenge_id: string;
  week_start_date: string;
  target_km: number;
  created_at: string;
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
