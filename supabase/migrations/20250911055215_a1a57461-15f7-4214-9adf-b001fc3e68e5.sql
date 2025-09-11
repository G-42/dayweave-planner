-- Drop existing service role policy and create more specific ones
DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.subscribers;

-- Create separate policies for service role operations
-- This policy allows service role to insert subscription data
CREATE POLICY "Service role can insert subscriptions" 
ON public.subscribers 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- This policy allows service role to update subscription data  
CREATE POLICY "Service role can update subscriptions" 
ON public.subscribers 
FOR UPDATE 
TO service_role 
USING (true) 
WITH CHECK (true);

-- This policy allows service role to read subscription data
CREATE POLICY "Service role can read subscriptions" 
ON public.subscribers 
FOR SELECT 
TO service_role 
USING (true);

-- Add additional security: Only allow authenticated users to access their own data
-- Update existing user policies to be more explicit about authentication requirement
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscribers;

-- Create more secure user policies that explicitly require authentication
CREATE POLICY "Authenticated users can view own subscription" 
ON public.subscribers 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own subscription" 
ON public.subscribers 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own subscription" 
ON public.subscribers 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Add constraint to ensure user_id cannot be null for security
ALTER TABLE public.subscribers 
ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint to prevent duplicate subscriptions per user
ALTER TABLE public.subscribers 
ADD CONSTRAINT unique_user_subscription UNIQUE (user_id);

-- Create function to validate subscription data integrity
CREATE OR REPLACE FUNCTION public.validate_subscription_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure email is properly formatted
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Ensure subscription_end is in the future if subscribed is true
  IF NEW.subscribed = true AND NEW.subscription_end IS NOT NULL AND NEW.subscription_end <= NOW() THEN
    RAISE EXCEPTION 'Subscription end date must be in the future for active subscriptions';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to validate data on insert/update
CREATE TRIGGER validate_subscription_trigger
  BEFORE INSERT OR UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_subscription_data();