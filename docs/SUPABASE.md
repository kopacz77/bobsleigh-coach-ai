# Supabase Integration Guide

## Overview

This application uses Supabase for database management, authentication, and storage. This guide explains how to set up and configure Supabase for the Bobsleigh Coach AI application.

## Setting Up Supabase

### 1. Create a Supabase Project

1. Sign up or log in at [https://supabase.com](https://supabase.com)
2. Create a new project
3. Choose a name (e.g., `bobsleigh-coach-ai`)
4. Choose a password (for the database)
5. Select a region close to your users
6. Wait for the project to be created (this may take a few minutes)

### 2. Get API Credentials

1. Go to Project Settings > API
2. Copy the following credentials:
   - Project URL (e.g., `https://xyz.supabase.co`)
   - API Key (anon public key)

### 3. Set Up Environment Variables

Add these credentials to your environment variables:

```
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
```

## Database Schema Setup

### Create Tables and Policies

The database schema is defined in `backend/sql/supabase_schema.sql`. Execute this script in Supabase's SQL Editor to create all necessary tables and security policies.

```sql
-- Open SQL Editor in Supabase Dashboard
-- Paste the contents of backend/sql/supabase_schema.sql
-- Click Run
```

This will create the following tables:

- `athletes`
- `exercises`
- `workouts`
- `workout_exercises`
- `workout_exercise_sets`
- `performance_metrics`
- `training_loads`
- `training_recommendations`

## Authentication Setup

### Enable Google OAuth

1. Go to Authentication > Providers
2. Enable Google provider
3. Configure OAuth credentials:
   - Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/)
   - Add your Authorized redirect URL: `https://your-project-url.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret
   - Paste into Supabase settings

### User Management

Supabase Auth is used for user authentication. When a user signs up:

1. A record is created in Supabase's `auth.users` table
2. Your application should create a corresponding record in the `athletes` table

```javascript
// Example code to create an athlete record after signup
async function createAthlete(user) {
  const { data, error } = await supabase
    .from('athletes')
    .insert({
      user_id: user.id,
      first_name: '',
      last_name: '',
      email: user.email,
      sport: 'Bobsleigh',
    });
  
  if (error) console.error('Error creating athlete:', error);
  return data;
}
```

## Row-Level Security

The schema includes Row-Level Security (RLS) policies to ensure users can only access their own data:

```sql
-- Example: Policy for athletes table
CREATE POLICY "Users can view their own profiles" 
    ON athletes FOR SELECT 
    USING (auth.uid() = user_id);
```

These policies restrict data access based on the authenticated user's ID.

## Real-time Subscriptions

Supabase supports real-time updates through subscriptions. You can use this to keep the UI updated when data changes:

```javascript
// Example: Subscribe to workout changes
const workoutsSubscription = supabase
  .from('workouts')
  .on('*', (payload) => {
    console.log('Workout change received!', payload);
    // Update UI based on the change
  })
  .subscribe();
```

## Storage

Supabase Storage can be used for storing athlete-related files (e.g., profile pictures, workout videos):

```javascript
// Example: Upload a profile picture
async function uploadProfilePicture(userId, file) {
  const { data, error } = await supabase
    .storage
    .from('avatars')
    .upload(`${userId}.jpg`, file, {
      cacheControl: '3600',
      upsert: true
    });
  
  if (error) console.error('Error uploading image:', error);
  return data;
}
```

## Database Functions

Supabase allows creating PostgreSQL functions for complex operations:

```sql
-- Example: Function to calculate training load metrics
CREATE OR REPLACE FUNCTION calculate_training_load(athlete_id_param INT)
RETURNS TABLE (
    date DATE,
    training_load FLOAT,
    ctl FLOAT,
    atl FLOAT,
    tsb FLOAT
) AS $$
DECLARE
    ctl_decay FLOAT := 0.9763; -- exp(-1/42)
    atl_decay FLOAT := 0.8669; -- exp(-1/7)
    prev_ctl FLOAT := 0;
    prev_atl FLOAT := 0;
BEGIN
    -- Implementation details...
END;
$$ LANGUAGE plpgsql;
```

## Backup and Migration

To backup your Supabase database:

1. Go to Project Settings > Database
2. Click "Database Backups"
3. Download the latest backup or create a new one

For schema migrations, create SQL migration files and apply them through the SQL Editor.

## Best Practices

1. **Never expose your service role key** in client-side code
2. Always use Row-Level Security to protect data
3. Use prepared statements to prevent SQL injection
4. Create indexes for frequently queried columns
5. Use transactions for operations that modify multiple tables
6. Set up monitoring and alerts for database performance

## Troubleshooting

### Common Issues

1. **Authentication failures**: Check that your Supabase URL and API key are correct
2. **Permission denied errors**: Verify Row-Level Security policies
3. **Missing data**: Ensure queries include the correct conditions
4. **Performance issues**: Add indexes to frequently queried columns

### Debugging Tools

- SQL Editor in Supabase Dashboard
- Table Explorer to view and edit data
- Auth logs to track authentication issues
- Database logs for query performance
