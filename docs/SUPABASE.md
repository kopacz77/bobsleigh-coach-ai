# Supabase Integration Guide

## Overview

Bobsleigh Coach AI uses Supabase as the backend-as-a-service platform for database management, authentication, and real-time features. This guide covers the complete setup and integration process.

## Project Setup

### 1. Create Supabase Project

1. **Sign up** at [supabase.com](https://supabase.com)
2. **Create new project**:
   - Name: `bobsleigh-coach-ai`
   - Database password: Choose a secure password
   - Region: Select closest to your users
3. **Wait for initialization** (~2 minutes)

### 2. Get API Credentials

Navigate to **Project Settings** → **API**:

```env
# Copy these values to your .env file
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

## Database Schema Setup

### Important: Use Fresh Clean Schema

**DO NOT** use the old `supabase_schema.sql`. Instead, follow this exact sequence:

#### Step 1: Reset Database (if needed)
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

#### Step 2: Apply Fresh Schema
Run `backend/sql/fresh_clean_schema.sql` in Supabase SQL Editor

#### Step 3: Fix Numeric Fields
Run `backend/sql/fix_numeric_fields.sql` in Supabase SQL Editor

#### Step 4: Insert Joshua's Data
Run `backend/sql/insert_joshua_data.sql` in Supabase SQL Editor

### Verification

After setup, you should see in **Table Editor**:
- ✅ 9 tables created
- ✅ 1 athlete (Joshua Hudson)
- ✅ 10 exercises
- ✅ 8 performance metrics
- ✅ 21 days training load data
- ✅ 21 days wellbeing assessments

## Authentication Configuration

### Row Level Security (RLS)

The schema includes basic RLS policies:

```sql
-- Athletes can manage their own data
CREATE POLICY "Athletes manage own data" ON athletes FOR ALL USING (true);

-- Public read access for reference data
CREATE POLICY "Public read" ON sports FOR SELECT USING (true);
CREATE POLICY "Public read" ON exercises FOR SELECT USING (is_active = true);
```

### Future Authentication

When ready to implement full auth:

1. **Enable authentication** in Supabase Dashboard
2. **Configure OAuth providers** (Google, GitHub, etc.)
3. **Update RLS policies** to use `auth.uid()`
4. **Connect frontend** auth components

## Frontend Integration

### Supabase Client Setup

```typescript
// frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Environment Variables

```env
# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### React Query Integration

```typescript
// Example data fetching with React Query
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useAthletes() {
  return useQuery({
    queryKey: ['athletes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .eq('is_active', true)
      
      if (error) throw error
      return data
    }
  })
}
```

## Backend Integration

### FastAPI + Supabase

```python
# backend/app/database.py
from supabase import create_client, Client
import os

def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")
    return create_client(url, key)
```

### Environment Configuration

```env
# backend/.env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

## Real-time Features

### Database Changes

```typescript
// Listen to training_loads changes
const subscription = supabase
  .channel('training-loads')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'training_loads'
  }, (payload) => {
    console.log('Training load updated:', payload)
  })
  .subscribe()
```

### Presence (Future)

```typescript
// Real-time coach-athlete collaboration
const channel = supabase.channel('workout-session')
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    console.log('Online users:', state)
  })
  .subscribe()
```

## Data Operations

### Query Examples

```typescript
// Get athlete's recent training loads
const { data: trainingLoads } = await supabase
  .from('training_loads')
  .select(`
    *,
    athletes!inner(first_name, last_name)
  `)
  .eq('athletes.email', 'joshua.hudson@bobsleigh.com')
  .order('date', { ascending: false })
  .limit(7)

// Get performance metrics with exercises
const { data: metrics } = await supabase
  .from('performance_metrics')
  .select(`
    *,
    exercises(name, category),
    athletes(first_name, last_name)
  `)
  .eq('is_personal_best', true)
```

### Bulk Operations

```typescript
// Insert multiple workout exercises
const { error } = await supabase
  .from('workout_exercises')
  .insert([
    { workout_id: 'xxx', exercise_id: 'yyy', sets: 5, reps: 3 },
    { workout_id: 'xxx', exercise_id: 'zzz', sets: 4, reps: 5 }
  ])
```

## Performance Optimization

### Indexes

The schema includes performance indexes:

```sql
-- Optimized for common queries
CREATE INDEX idx_training_loads_athlete_date ON training_loads(athlete_id, date);
CREATE INDEX idx_performance_athlete_date ON performance_metrics(athlete_id, test_date);
CREATE INDEX idx_workouts_athlete_date ON workouts(athlete_id, date);
```

### Connection Pooling

For production, consider connection pooling:

```typescript
// Use connection pooling for high-traffic apps
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
})
```

## Security Best Practices

### API Key Management

- ✅ **Use anon key** for frontend (public access)
- ✅ **Use service role key** for backend admin operations
- ✅ **Never commit keys** to version control
- ✅ **Rotate keys regularly** in production

### RLS Policies

```sql
-- Example: Secure athlete data access
CREATE POLICY "Users can only see own data" ON athletes
  FOR ALL USING (auth.uid() = user_id);

-- Example: Coaches can see assigned athletes
CREATE POLICY "Coaches see assigned athletes" ON athletes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_athletes 
      WHERE coach_id = auth.uid() 
      AND athlete_id = athletes.id
    )
  );
```

### Data Validation

```typescript
// Client-side validation before Supabase insert
const insertTrainingLoad = async (data: TrainingLoad) => {
  // Validate data structure
  if (!data.athlete_id || !data.date || !data.training_load) {
    throw new Error('Missing required fields')
  }
  
  // Insert with proper error handling
  const { data: result, error } = await supabase
    .from('training_loads')
    .insert(data)
    .select()
  
  if (error) throw error
  return result
}
```

## Monitoring & Analytics

### Dashboard Metrics

Monitor in Supabase Dashboard:
- **Database usage** (storage, queries)
- **Authentication metrics** (signups, logins)
- **Real-time connections**
- **API usage** (requests, errors)

### Custom Analytics

```sql
-- Example: Training load analytics
SELECT 
  DATE_TRUNC('week', date) as week,
  AVG(training_load) as avg_load,
  AVG(readiness_score) as avg_readiness
FROM training_loads 
WHERE athlete_id = 'joshua-id'
GROUP BY week
ORDER BY week DESC;
```

## Troubleshooting

### Common Issues

1. **RLS blocking queries**: Check policies match your auth setup
2. **Connection errors**: Verify URL and keys are correct
3. **Slow queries**: Add indexes for frequently queried columns
4. **Auth issues**: Ensure user is properly authenticated

### Debug Queries

```typescript
// Enable query debugging
const { data, error } = await supabase
  .from('athletes')
  .select('*')
  .eq('email', 'joshua.hudson@bobsleigh.com')

console.log('Query result:', { data, error })
```

## Migration Strategy

When schema changes are needed:

1. **Create migration SQL** in `backend/sql/migrations/`
2. **Test on staging** environment first
3. **Apply to production** during low-traffic periods
4. **Update application code** to match schema changes

This setup provides a robust, scalable foundation for the Bobsleigh Coach AI application with Joshua Hudson's real training data ready for ML model development.