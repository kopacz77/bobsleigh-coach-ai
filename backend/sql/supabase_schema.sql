-- Updated Supabase Schema for Bobsleigh Coach AI

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin users can manage roles" ON roles FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Any user can view roles" ON roles FOR SELECT USING (true);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
('admin', 'Administrator with full system access'),
('coach', 'Coach with access to manage athletes and training plans'),
('athlete', 'Regular athlete user'),
('guest', 'Limited access user');

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin users can manage permissions" ON permissions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Any user can view permissions" ON permissions FOR SELECT USING (true);

-- Role permissions junction table
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin users can manage role permissions" ON role_permissions FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Any user can view role permissions" ON role_permissions FOR SELECT USING (true);

-- User roles junction table
CREATE TABLE user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin users can manage user roles" ON user_roles FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Users can view their own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    device_info JSONB,
    location_info JSONB,
    ip_address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON sessions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all sessions" ON sessions FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Sports table
CREATE TABLE sports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    training_focus TEXT[],
    has_ice_training BOOLEAN DEFAULT FALSE,
    has_off_ice_training BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sports" ON sports FOR SELECT USING (true);

-- Athletes table (enhanced from original)
CREATE TABLE athletes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    sport_id UUID REFERENCES sports(id),
    height FLOAT,
    weight FLOAT,
    birth_date DATE,
    physical_profile JSONB,
    training_preferences JSONB,
    settings JSONB,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profiles" ON athletes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profiles" ON athletes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Coaches can view their athletes" ON athletes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM coach_athletes
        JOIN coaches ON coach_athletes.coach_id = coaches.id
        WHERE coach_athletes.athlete_id = athletes.id
        AND coaches.user_id = auth.uid()
    )
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    sport_id UUID REFERENCES sports(id),
    captain_id UUID REFERENCES athletes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Team captains can update their teams" ON teams FOR UPDATE USING (auth.uid() IN (
    SELECT user_id FROM athletes WHERE id = teams.captain_id
));

-- Team members junction table
CREATE TABLE team_members (
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
    athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,
    role TEXT,
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (team_id, athlete_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view team members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Team captains can manage team members" ON team_members FOR ALL USING (
    EXISTS (
        SELECT 1 FROM teams 
        JOIN athletes ON teams.captain_id = athletes.id 
        WHERE teams.id = team_members.team_id
        AND athletes.user_id = auth.uid()
    )
);

-- Coaches table
CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    specialization TEXT[],
    bio TEXT,
    certification TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view coaches" ON coaches FOR SELECT USING (true);
CREATE POLICY "Coaches can update their own profile" ON coaches FOR UPDATE USING (auth.uid() = user_id);

-- Coach-athlete relationship
CREATE TABLE coach_athletes (
    coach_id UUID REFERENCES coaches(id) ON DELETE CASCADE NOT NULL,
    athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE NOT NULL,
    relationship_type TEXT,
    access_level TEXT,
    started_at DATE NOT NULL DEFAULT CURRENT_DATE,
    ended_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (coach_id, athlete_id)
);

ALTER TABLE coach_athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches can see their athletes" ON coach_athletes FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM coaches WHERE id = coach_athletes.coach_id)
);
CREATE POLICY "Athletes can see their coaches" ON coach_athletes FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM athletes WHERE id = coach_athletes.athlete_id)
);

-- Training components table
CREATE TABLE training_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    importance_level INTEGER,
    progression_path JSONB,
    sport_id UUID REFERENCES sports(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE training_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view training components" ON training_components FOR SELECT USING (true);

-- Training phases table
CREATE TABLE training_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    sport_id UUID REFERENCES sports(id),
    duration_weeks INTEGER,
    sequence_order INTEGER,
    focus_areas TEXT[],
    mhg_target_range JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE training_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view training phases" ON training_phases FOR SELECT USING (true);

-- User settings table
CREATE TABLE user_settings (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    theme TEXT DEFAULT 'light',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
    dashboard_layout JSONB,
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- Daily metrics table
CREATE TABLE daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    athlete_id UUID REFERENCES athletes(id),
    date DATE NOT NULL,
    metrics JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own daily metrics" ON daily_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own daily metrics" ON daily_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily metrics" ON daily_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Coaches can view their athletes' metrics" ON daily_metrics FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM coach_athletes
        JOIN coaches ON coach_athletes.coach_id = coaches.id
        JOIN athletes ON coach_athletes.athlete_id = athletes.id
        WHERE athletes.id = daily_metrics.athlete_id
        AND coaches.user_id = auth.uid()
    )
);

-- Wellbeing assessments table
CREATE TABLE wellbeing_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE NOT NULL,
    sleep_quality INTEGER,
    stress_level INTEGER,
    nutrition_quality INTEGER,
    physical_readiness INTEGER,
    mental_clarity INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE wellbeing_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own wellbeing assessments" ON wellbeing_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wellbeing assessments" ON wellbeing_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wellbeing assessments" ON wellbeing_assessments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Coaches can view their athletes' wellbeing" ON wellbeing_assessments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM coach_athletes
        JOIN coaches ON coach_athletes.coach_id = coaches.id
        JOIN athletes ON coach_athletes.athlete_id = athletes.id
        WHERE athletes.user_id = wellbeing_assessments.user_id
        AND coaches.user_id = auth.uid()
    )
);

-- Exercises table
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    measurement_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view exercises" ON exercises FOR SELECT USING (true);

-- Workouts table (enhanced from original)
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID REFERENCES athletes(id) NOT NULL,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    duration INTEGER,
    type TEXT NOT NULL,
    notes TEXT,
    phase TEXT,
    intensity_level INTEGER,
    effectiveness_score FLOAT,
    recovery_metrics JSONB,
    performance_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own workouts" ON workouts FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM athletes 
        WHERE athletes.id = workouts.athlete_id 
        AND athletes.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert their own workouts" ON workouts FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM athletes 
        WHERE athletes.id = workouts.athlete_id 
        AND athletes.user_id = auth.uid()
    )
);
CREATE POLICY "Users can update their own workouts" ON workouts FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM athletes 
        WHERE athletes.id = workouts.athlete_id 
        AND athletes.user_id = auth.uid()
    )
);
CREATE POLICY "Coaches can view their athletes' workouts" ON workouts FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM coach_athletes
        JOIN coaches ON coach_athletes.coach_id = coaches.id
        WHERE coach_athletes.athlete_id = workouts.athlete_id
        AND coaches.user_id = auth.uid()
    )
);

-- Workout exercises table
CREATE TABLE workout_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID REFERENCES workouts(id) NOT NULL,
    exercise_id UUID REFERENCES exercises(id) NOT NULL,
    sets INTEGER,
    reps INTEGER,
    weight FLOAT,
    distance FLOAT,
    time FLOAT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own workout exercises" ON workout_exercises FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM workouts 
        JOIN athletes ON workouts.athlete_id = athletes.id 
        WHERE workout_exercises.workout_id = workouts.id 
        AND athletes.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert their own workout exercises" ON workout_exercises FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM workouts 
        JOIN athletes ON workouts.athlete_id = athletes.id 
        WHERE workout_exercises.workout_id = workouts.id 
        AND athletes.user_id = auth.uid()
    )
);
CREATE POLICY "Coaches can view their athletes' exercises" ON workout_exercises FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM workouts
        JOIN coach_athletes ON workouts.athlete_id = coach_athletes.athlete_id
        JOIN coaches ON coach_athletes.coach_id = coaches.id
        WHERE workout_exercises.workout_id = workouts.id
        AND coaches.user_id = auth.uid()
    )
);

-- Performance metrics table (enhanced from original)
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID REFERENCES athletes(id) NOT NULL,
    date DATE NOT NULL,
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value FLOAT NOT NULL,
    unit TEXT,
    confidence_interval JSONB,
    progression_rate FLOAT,
    comparison_to_baseline FLOAT,
    phase TEXT,
    contributing_factors TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own performance metrics" ON performance_metrics FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM athletes 
        WHERE athletes.id = performance_metrics.athlete_id 
        AND athletes.user_id = auth.uid()
    )
);
CREATE POLICY "Coaches can view their athletes' metrics" ON performance_metrics FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM coach_athletes
        JOIN coaches ON coach_athletes.coach_id = coaches.id
        WHERE coach_athletes.athlete_id = performance_metrics.athlete_id
        AND coaches.user_id = auth.uid()
    )
);

-- Competitions table
CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID REFERENCES athletes(id) NOT NULL,
    sport_id UUID REFERENCES sports(id),
    competition_name TEXT NOT NULL,
    competition_date DATE NOT NULL,
    level TEXT,
    result JSONB,
    performance_metrics JSONB,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own competitions" ON competitions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM athletes 
        WHERE athletes.id = competitions.athlete_id 
        AND athletes.user_id = auth.uid()
    )
);
CREATE POLICY "Coaches can view their athletes' competitions" ON competitions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM coach_athletes
        JOIN coaches ON coach_athletes.coach_id = coaches.id
        WHERE coach_athletes.athlete_id = competitions.athlete_id
        AND coaches.user_id = auth.uid()
    )
);

-- Training loads table
CREATE TABLE training_loads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID REFERENCES athletes(id) NOT NULL,
    date DATE NOT NULL,
    training_load FLOAT NOT NULL,
    ctl FLOAT,
    atl FLOAT,
    tsb FLOAT,
    rpe FLOAT,
    fatigue FLOAT,
    soreness FLOAT,
    sleep_quality FLOAT,
    sleep_hours FLOAT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE training_loads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own training loads" ON training_loads FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM athletes 
        WHERE athletes.id = training_loads.athlete_id 
        AND athletes.user_id = auth.uid()
    )
);
CREATE POLICY "Coaches can view their athletes' training loads" ON training_loads FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM coach_athletes
        JOIN coaches ON coach_athletes.coach_id = coaches.id
        WHERE coach_athletes.athlete_id = training_loads.athlete_id
        AND coaches.user_id = auth.uid()
    )
);

-- Training recommendations table (enhanced from original)
CREATE TABLE training_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID REFERENCES athletes(id) NOT NULL,
    sport_id UUID REFERENCES sports(id),
    date DATE NOT NULL,
    recommendation_date DATE NOT NULL,
    workout_type TEXT NOT NULL,
    focus TEXT NOT NULL,
    duration INTEGER,
    intensity TEXT,
    exercises JSONB,
    content TEXT,
    basis TEXT[],
    recommendation_type TEXT,
    priority INTEGER,
    confidence_score FLOAT,
    effectiveness_feedback JSONB,
    phase TEXT,
    notes TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE training_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own training recommendations" ON training_recommendations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM athletes 
        WHERE athletes.id = training_recommendations.athlete_id 
        AND athletes.user_id = auth.uid()
    )
);
CREATE POLICY "Coaches can view and create recommendations" ON training_recommendations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM coach_athletes
        JOIN coaches ON coach_athletes.coach_id = coaches.id
        WHERE coach_athletes.athlete_id = training_recommendations.athlete_id
        AND coaches.user_id = auth.uid()
    )
);

-- Training locations table
CREATE TABLE training_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    coordinates JSONB,
    facilities JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE training_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view training locations" ON training_locations FOR SELECT USING (true);

-- User-location relationship
CREATE TABLE user_locations (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    location_id UUID REFERENCES training_locations(id) ON DELETE CASCADE NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, location_id)
);

ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own locations" ON user_locations FOR ALL USING (auth.uid() = user_id);

-- Sport knowledge base table
CREATE TABLE sport_knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id UUID REFERENCES sports(id),
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    source_type TEXT,
    source_reference TEXT,
    confidence_score FLOAT,
    validated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE sport_knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sport knowledge" ON sport_knowledge_base FOR SELECT USING (true);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    title TEXT,
    message TEXT,
    type TEXT,
    content JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- Activity log for audit purposes
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own activity" ON activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all activity" ON activity_log FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at columns
CREATE TRIGGER update_athletes_updated_at
    BEFORE UPDATE ON athletes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_metrics_updated_at
    BEFORE UPDATE ON daily_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wellbeing_assessments_updated_at
    BEFORE UPDATE ON wellbeing_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at
    BEFORE UPDATE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_exercises_updated_at
    BEFORE UPDATE ON workout_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_metrics_updated_at
    BEFORE UPDATE ON performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitions_updated_at
    BEFORE UPDATE ON competitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_loads_updated_at
    BEFORE UPDATE ON training_loads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_recommendations_updated_at
    BEFORE UPDATE ON training_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaches_updated_at
    BEFORE UPDATE ON coaches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_athletes_updated_at
    BEFORE UPDATE ON coach_athletes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_locations_updated_at
    BEFORE UPDATE ON training_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function for logging activities
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_log (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        json_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)),
        inet_client_addr()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add activity logging triggers to key tables
CREATE TRIGGER log_athlete_activity
    AFTER INSERT OR UPDATE OR DELETE ON athletes
    FOR EACH ROW
    EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_workouts_activity
    AFTER INSERT OR UPDATE OR DELETE ON workouts
    FOR EACH ROW
    EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_performance_metrics_activity
    AFTER INSERT OR UPDATE OR DELETE ON performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_competitions_activity
    AFTER INSERT OR UPDATE OR DELETE ON competitions
    FOR EACH ROW
    EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_training_recommendations_activity
    AFTER INSERT OR UPDATE OR DELETE ON training_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION log_activity();

-- Create a function to handle user registration and setup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    -- Create athlete profile
    INSERT INTO athletes (user_id, first_name, last_name, email)
    VALUES (NEW.id, '', '', NEW.email);
    
    -- Create default user settings
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id);
    
    -- Assign default role (athlete)
    INSERT INTO user_roles (user_id, role_id)
    VALUES (NEW.id, (SELECT id FROM roles WHERE name = 'athlete' LIMIT 1));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to setup new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Insert sample data for sports
INSERT INTO sports (name, category, description, training_focus, has_ice_training, has_off_ice_training) VALUES
('Bobsleigh', 'Winter Sport', 'A winter sport in which teams make timed runs down narrow, twisting, banked, iced tracks in a gravity-powered sleigh.', ARRAY['Speed', 'Power', 'Technique', 'Teamwork'], TRUE, TRUE),
('Skeleton', 'Winter Sport', 'A winter sliding sport in which a person rides a small sled, known as a skeleton bobsled down a frozen track while lying face down.', ARRAY['Speed', 'Technique', 'Body Control'], TRUE, TRUE),
('Luge', 'Winter Sport', 'A winter sport that involves competitors riding a flat sled while lying on their backs and feet-first.', ARRAY['Speed', 'Technique', 'Body Control'], TRUE, TRUE);

-- Insert sample exercises
INSERT INTO exercises (name, description, category, measurement_type) VALUES
('Back Squat', 'Barbell squat with weight on upper back', 'Strength', 'Weight'),
('Bench Press', 'Horizontal press with barbell', 'Strength', 'Weight'),
('Deadlift', 'Barbell lift from floor', 'Strength', 'Weight'),
('Power Clean', 'Olympic lift from floor to shoulders', 'Power', 'Weight'),
('30m Sprint', '30 meter sprint', 'Speed', 'Time'),
('60m Sprint', '60 meter sprint', 'Speed', 'Time'),
('Box Jump', 'Jumping onto elevated platform', 'Power', 'Height'),
('Vertical Jump', 'Jump test for vertical height', 'Power', 'Height'),
('Pull-ups', 'Bodyweight pull-up exercise', 'Strength', 'Reps'),
('Push-ups', 'Bodyweight pushing exercise', 'Strength', 'Reps'),
('Romanian Deadlift', 'Hip-hinge deadlift variation', 'Strength', 'Weight'),
('Split Squat', 'Single-leg squat variation', 'Strength', 'Weight'),
('Medicine Ball Throw', 'Explosive throw with medicine ball', 'Power', 'Distance'),
('Broad Jump', 'Horizontal jump test', 'Power', 'Distance'),
('Hill Sprints', 'Sprints performed on an incline', 'Speed', 'Time/Distance'),
('Flying Sprints', 'Sprint with running start', 'Speed', 'Time/Distance'),
('Resisted Sprints', 'Sprints with added resistance', 'Speed', 'Time/Distance');

-- Insert sample permissions
INSERT INTO permissions (name, description, resource, action) VALUES
('view_athletes', 'View athlete profiles', 'athletes', 'read'),
('manage_athletes', 'Create and update athlete profiles', 'athletes', 'write'),
('view_workouts', 'View workout data', 'workouts', 'read'),
('manage_workouts', 'Create and update workouts', 'workouts', 'write'),
('view_performance', 'View performance metrics', 'performance_metrics', 'read'),
('manage_performance', 'Create and update performance metrics', 'performance_metrics', 'write'),
('view_recommendations', 'View training recommendations', 'training_recommendations', 'read'),
('manage_recommendations', 'Create and modify training recommendations', 'training_recommendations', 'write'),
('view_teams', 'View team information', 'teams', 'read'),
('manage_teams', 'Create and update teams', 'teams', 'write'),
('view_competitions', 'View competition data', 'competitions', 'read'),
('manage_competitions', 'Create and update competition records', 'competitions', 'write'),
('manage_users', 'Create and update user accounts', 'users', 'write'),
('view_analytics', 'View analytics dashboard', 'analytics', 'read'),
('manage_knowledge_base', 'Manage sport knowledge base', 'sport_knowledge_base', 'write');

-- Assign permissions to roles
-- Admin role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'admin' LIMIT 1),
    id
FROM permissions;

-- Coach role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'coach' LIMIT 1),
    id
FROM permissions 
WHERE name IN (
    'view_athletes', 'manage_athletes', 
    'view_workouts', 'manage_workouts',
    'view_performance', 'manage_performance',
    'view_recommendations', 'manage_recommendations',
    'view_teams', 'manage_teams',
    'view_competitions', 'manage_competitions',
    'view_analytics'
);

-- Athlete role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'athlete' LIMIT 1),
    id
FROM permissions 
WHERE name IN (
    'view_athletes',
    'view_workouts', 'manage_workouts',
    'view_performance',
    'view_recommendations',
    'view_teams',
    'view_competitions'
);

-- Guest role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'guest' LIMIT 1),
    id
FROM permissions 
WHERE name IN (
    'view_athletes',
    'view_teams'
);

-- Insert sample training phases
INSERT INTO training_phases (name, description, sport_id, duration_weeks, sequence_order, focus_areas) VALUES
('General Preparation', 'Building base fitness and strength', (SELECT id FROM sports WHERE name = 'Bobsleigh' LIMIT 1), 8, 1, ARRAY['General Strength', 'General Conditioning', 'Technique Development']),
('Specific Preparation', 'Developing sport-specific attributes', (SELECT id FROM sports WHERE name = 'Bobsleigh' LIMIT 1), 8, 2, ARRAY['Specific Strength', 'Power Development', 'Speed', 'Technical Refinement']),
('Pre-Competition', 'Fine-tuning for competitive performance', (SELECT id FROM sports WHERE name = 'Bobsleigh' LIMIT 1), 4, 3, ARRAY['Speed', 'Power', 'Technical Mastery', 'Tapering']),
('Competition', 'Peak performance during competition season', (SELECT id FROM sports WHERE name = 'Bobsleigh' LIMIT 1), 12, 4, ARRAY['Performance', 'Recovery', 'Maintenance']),
('Transition', 'Active recovery and preparation for next cycle', (SELECT id FROM sports WHERE name = 'Bobsleigh' LIMIT 1), 4, 5, ARRAY['Active Recovery', 'Mental Refresh', 'Injury Prevention']);