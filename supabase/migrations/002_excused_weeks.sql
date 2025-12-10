-- Add excused week and rollover support to weekly_results
ALTER TABLE weekly_results
ADD COLUMN IF NOT EXISTS excused boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rollover_km numeric(6,2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN weekly_results.excused IS 'If true, this week is excused and does not break streak';
COMMENT ON COLUMN weekly_results.rollover_km IS 'Deficit km that rolls over to next week (target - actual when excused)';
