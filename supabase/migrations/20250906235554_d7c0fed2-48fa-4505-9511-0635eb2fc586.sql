-- Add missing columns to habits table for comprehensive habit tracking
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS total_value INTEGER DEFAULT 0;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'minutes';
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS consecutive_days INTEGER DEFAULT 0;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS today_value INTEGER DEFAULT 0;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS daily_goal INTEGER DEFAULT 30;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS last_updated_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '{}'::jsonb;

-- Create index for better performance on user queries
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);

-- Create function to reset daily values when date changes
CREATE OR REPLACE FUNCTION public.reset_daily_habits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.habits 
  SET today_value = 0, 
      last_updated_date = CURRENT_DATE
  WHERE last_updated_date < CURRENT_DATE;
END;
$$;