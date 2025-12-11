-- Migration: Extended gamification features
-- Run this in Supabase SQL editor

-- Add more badges
INSERT INTO public.badges (slug, name, description, icon, category, threshold_value) VALUES
  ('10k_club', '10K Club', 'Log 10km total distance', 'emoji_events', 'achievement', 10),
  ('25k_warrior', '25K Warrior', 'Log 25km total distance', 'military_tech', 'achievement', 25),
  ('500k_ultra', '500K Ultra', 'Log 500km total distance', 'diamond', 'achievement', 500),
  ('streak_2', 'Getting Started', 'Maintain a 2-week streak', 'whatshot', 'streak', 2),
  ('streak_8', 'Iron Will', 'Maintain an 8-week streak', 'shield', 'streak', 8),
  ('streak_12', 'Marathon Mind', 'Maintain a 12-week streak', 'psychology', 'streak', 12),
  ('triple_threat', 'Triple Threat', 'Log run, walk, and jog in one week', 'diversity_3', 'achievement', null),
  ('overachiever', 'Overachiever', 'Hit 150% of weekly target', 'trending_up', 'achievement', null),
  ('comeback_kid', 'Comeback Kid', 'Meet target after missing one', 'replay', 'achievement', null),
  ('team_player', 'Team Player', 'Give 10 cheers to teammates', 'volunteer_activism', 'social', 10),
  ('crowd_favorite', 'Crowd Favorite', 'Receive 20 cheers', 'favorite', 'social', 20),
  ('motivator', 'Motivator', 'Give 50 cheers to teammates', 'celebration', 'social', 50),
  ('photo_finish', 'Photo Finish', 'Complete target on last day of week', 'timer', 'achievement', null),
  ('perfect_week', 'Perfect Week', 'Log activity every day of the week', 'stars', 'achievement', 7)
ON CONFLICT (slug) DO NOTHING;

-- Personal bests tracking
CREATE TABLE IF NOT EXISTS public.personal_bests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) NOT NULL,
  challenge_id uuid REFERENCES public.challenges(id) NOT NULL,
  record_type text NOT NULL, -- 'longest_activity', 'fastest_pace', 'most_weekly_km', 'longest_streak'
  value numeric NOT NULL,
  achieved_at timestamptz DEFAULT now(),
  activity_id uuid REFERENCES public.activities(id), -- optional link to activity
  UNIQUE(user_id, challenge_id, record_type)
);

-- Weekly challenges (bonus goals)
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES public.challenges(id) NOT NULL,
  week_start_date date NOT NULL,
  challenge_type text NOT NULL, -- 'distance_boost', 'consistency', 'group_goal', 'beat_your_best'
  target_value numeric NOT NULL,
  description text NOT NULL,
  UNIQUE(challenge_id, week_start_date)
);

-- User weekly challenge completions
CREATE TABLE IF NOT EXISTS public.user_challenge_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) NOT NULL,
  weekly_challenge_id uuid REFERENCES public.weekly_challenges(id) NOT NULL,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, weekly_challenge_id)
);

-- Activity feed (denormalized for fast reads)
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES public.challenges(id) NOT NULL,
  user_id uuid REFERENCES public.users(id) NOT NULL,
  event_type text NOT NULL, -- 'activity', 'badge', 'streak', 'pb', 'challenge', 'cheer'
  event_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feed_challenge_created ON public.activity_feed(challenge_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_personal_bests_user ON public.personal_bests(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_challenge ON public.weekly_challenges(challenge_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_activity_cheers_user ON public.activity_cheers(user_id);

-- RLS
ALTER TABLE public.personal_bests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Policies for personal_bests
CREATE POLICY "Anyone can read personal bests" ON public.personal_bests FOR SELECT USING (true);
CREATE POLICY "Users can insert own personal bests" ON public.personal_bests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personal bests" ON public.personal_bests FOR UPDATE USING (auth.uid() = user_id);

-- Policies for weekly_challenges
CREATE POLICY "Anyone can read weekly challenges" ON public.weekly_challenges FOR SELECT USING (true);

-- Policies for user_challenge_completions
CREATE POLICY "Anyone can read challenge completions" ON public.user_challenge_completions FOR SELECT USING (true);
CREATE POLICY "Users can insert own challenge completions" ON public.user_challenge_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for activity_feed
CREATE POLICY "Anyone can read activity feed" ON public.activity_feed FOR SELECT USING (true);
CREATE POLICY "Users can insert own feed items" ON public.activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add constraint for unique cheer per user per activity
ALTER TABLE public.activity_cheers DROP CONSTRAINT IF EXISTS activity_cheers_unique_user_activity;
ALTER TABLE public.activity_cheers ADD CONSTRAINT activity_cheers_unique_user_activity UNIQUE (activity_id, user_id);
