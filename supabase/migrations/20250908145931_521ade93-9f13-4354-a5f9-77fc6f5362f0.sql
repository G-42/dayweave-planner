-- Fix critical security vulnerability in subscribers table RLS policies
-- Remove the overly permissive policy that allows public access to all data
DROP POLICY IF EXISTS "Edge functions can manage subscriptions" ON public.subscribers;

-- Create specific policies for edge functions using service role key
-- This policy allows service role (used by edge functions) to perform all operations
CREATE POLICY "Service role can manage all subscriptions" 
ON public.subscribers 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Policy for authenticated users to insert their own subscription record
CREATE POLICY "Users can insert own subscription" 
ON public.subscribers 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to update their own subscription record  
CREATE POLICY "Users can update own subscription" 
ON public.subscribers 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);