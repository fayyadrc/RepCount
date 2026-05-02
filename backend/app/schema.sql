-- SQL Schema for Gym Logs
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS gym_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- Optional: References auth.users(id) if you use Supabase Auth
    date DATE NOT NULL,
    exercise TEXT NOT NULL,
    weight NUMERIC NOT NULL,
    weight_unit TEXT DEFAULT 'kg',
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast queries since we will merge by date
CREATE INDEX IF NOT EXISTS idx_gym_logs_date ON gym_logs(date);

-- Disable Row Level Security (RLS) to allow inserts from the script
-- (If you are using an anon key in your .env)
ALTER TABLE gym_logs DISABLE ROW LEVEL SECURITY;
