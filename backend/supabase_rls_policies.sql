-- Enable Row Level Security (RLS) on both tables (if not already enabled)
ALTER TABLE gym_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE strava_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any exist to prevent duplication errors
DROP POLICY IF EXISTS "Allow anon select" ON gym_logs;
DROP POLICY IF EXISTS "Allow anon insert" ON gym_logs;
DROP POLICY IF EXISTS "Allow anon update" ON gym_logs;
DROP POLICY IF EXISTS "Allow anon delete" ON gym_logs;

DROP POLICY IF EXISTS "Allow anon select" ON strava_activities;
DROP POLICY IF EXISTS "Allow anon insert" ON strava_activities;
DROP POLICY IF EXISTS "Allow anon update" ON strava_activities;
DROP POLICY IF EXISTS "Allow anon delete" ON strava_activities;

-- Create RLS Policies for gym_logs (Allows the local backend anon client access)
CREATE POLICY "Allow anon select" ON gym_logs 
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert" ON gym_logs 
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update" ON gym_logs 
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete" ON gym_logs 
    FOR DELETE TO anon USING (true);


-- Create RLS Policies for strava_activities (Allows the local backend anon client access)
CREATE POLICY "Allow anon select" ON strava_activities 
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anon insert" ON strava_activities 
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon update" ON strava_activities 
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon delete" ON strava_activities 
    FOR DELETE TO anon USING (true);
