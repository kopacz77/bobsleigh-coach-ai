# Wellbeing Module

This module contains components for tracking and managing athlete wellbeing, recovery, and mental health.

## Components

### WellbeingAssessment

Daily wellbeing assessment for athletes to track metrics including:
- Sleep quality
- Stress levels
- Nutrition quality
- Physical readiness
- Mental clarity

**Usage:**
```jsx
import { WellbeingAssessment } from '@/components/wellbeing';

// Inside your component
<WellbeingAssessment userId={currentUser.id} date={new Date()} />
```

### MoodTracking

Mood and emotional state tracking with calendar visualization and insights.

**Usage:**
```jsx
import { MoodTracking } from '@/components/wellbeing';

// Inside your component
<MoodTracking userId={currentUser.id} />
```

### PhysicalMetrics

Tracking physical measurements like heart rate, weight, body fat, etc.

**Usage:**
```jsx
import { PhysicalMetrics } from '@/components/wellbeing';

// Inside your component
<PhysicalMetrics userId={currentUser.id} />
```

### Reflection

Journal feature for athletes to record thoughts about training and competition experiences.

**Usage:**
```jsx
import { Reflection } from '@/components/wellbeing';

// Inside your component
<Reflection userId={currentUser.id} />
```

### RecoveryHealth

Managing recovery methods and injury tracking for optimal athlete health.

**Usage:**
```jsx
import { RecoveryHealth } from '@/components/wellbeing';

// Inside your component
<RecoveryHealth userId={currentUser.id} />
```

## Database Requirements

This module requires the following tables in the Supabase database:

1. `wellbeing_assessments` - Daily wellbeing metrics
2. `mood_entries` - Mood and emotion tracking
3. `physical_metrics` - Physical measurement data
4. `reflections` - Athlete journal entries
5. `recovery_sessions` - Recovery method tracking
6. `injuries` - Injury and pain tracking

Refer to the component implementations for the specific schema requirements of each table.

## Integration

The wellbeing components are designed to work with the performance and training modules to provide a comprehensive athlete monitoring system. Data from this module informs training recommendations and performance predictions through the app's AI systems.
