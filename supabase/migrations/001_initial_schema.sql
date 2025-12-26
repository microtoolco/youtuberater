-- Tuborial Database Schema
-- Run this in Supabase SQL Editor

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'monthly', 'lifetime')),
  stripe_customer_id TEXT,
  lemon_squeezy_customer_id TEXT,
  credits_used_this_month INTEGER DEFAULT 0,
  last_credit_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guides table
CREATE TABLE IF NOT EXISTS public.guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  video_thumbnail TEXT,
  video_channel TEXT,
  guide_content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Guides policies
CREATE POLICY "Users can view own guides" ON public.guides
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own guides" ON public.guides
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own guides" ON public.guides
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_guides_user_id ON public.guides(user_id);
CREATE INDEX IF NOT EXISTS idx_guides_video_id ON public.guides(video_id);
CREATE INDEX IF NOT EXISTS idx_guides_created_at ON public.guides(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to reset monthly credits (run via cron)
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET
    credits_used_this_month = 0,
    last_credit_reset = NOW()
  WHERE last_credit_reset < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
