# MVP Implementation Plan - Adaptive Training System

## 🎯 **Goal: Testable System in 2 Weeks**

Build a working prototype that demonstrates the adaptive training concept with real user interaction.

## **Phase 1: Core UI (Week 1) - START HERE**

### **Day 1-2: Daily Feedback Interface**
```typescript
// Priority 1: Create feedback collection form
components/feedback/DailyFeedbackForm.tsx
components/feedback/ExerciseFeedbackForm.tsx
components/feedback/FeedbackSummary.tsx
```

**Features:**
- Post-session RPE, soreness, energy collection
- Exercise-specific difficulty ratings
- Simple text feedback for "what felt good/difficult"
- Mobile-friendly form design

### **Day 3-4: Training Recommendations Display**
```typescript
// Priority 2: Show training recommendations
components/training/SessionRecommendations.tsx
components/training/ExerciseCard.tsx
components/training/LoadAdjustments.tsx
```

**Features:**
- Display recommended exercises with sets/reps/weight
- Show load adjustments ("20% easier than planned")
- Reasoning display ("Based on high soreness from yesterday")
- Simple accept/modify interface

### **Day 5-7: Adaptation Dashboard**
```typescript
// Priority 3: Visualization and overview
components/dashboard/AdaptationDashboard.tsx
components/charts/LoadTrendChart.tsx
components/dashboard/FeedbackTrends.tsx
```

**Features:**
- 7-day load trend visualization
- Feedback patterns (RPE, soreness over time)
- Current adaptation status ("Recovery Focus", "Normal Training")
- Simple color-coded health indicators

## **Phase 2: Mock Data & Logic (Week 2)**

### **Day 8-10: Mock Data System**
```typescript
// Create realistic mock data based on Joshua Hudson patterns
lib/mockData/trainingHistory.ts
lib/mockData/feedbackPatterns.ts
lib/mockData/exerciseDatabase.ts
```

**Mock Data Sources:**
- Joshua Hudson exercise catalog (208 exercises)
- Realistic load progressions (85-130kg weekly averages)
- Feedback patterns from analysis
- Seasonal periodization patterns

### **Day 11-12: Rule-Based Adaptation**
```typescript
// Simple adaptation logic (no ML yet)
lib/adaptation/ruleEngine.ts
lib/adaptation/loadCalculations.ts
lib/adaptation/exerciseSubstitutions.ts
```

**Rules Implementation:**
```typescript
// Example rule-based logic
function calculateLoadAdjustment(feedback: DailyFeedback): number {
  let adjustment = 1.0;
  
  // High RPE → reduce load
  if (feedback.rpe > 7) adjustment *= 0.85;
  
  // High soreness → reduce load  
  if (feedback.soreness > 7) adjustment *= 0.9;
  
  // Low energy → reduce load
  if (feedback.energy < 4) adjustment *= 0.8;
  
  return adjustment;
}
```

### **Day 13-14: Integration & Testing**
- Connect UI components with mock data
- Test user flow: feedback → recommendations → adjustments
- Validate adaptation logic with realistic scenarios
- Polish UI/UX based on testing

## **Development Setup Commands**

### **1. Start Development Environment**
```bash
# Install dependencies with pnpm
pnpm install

# Start frontend
pnpm dev

# Start backend (separate terminal)
cd backend && uvicorn app.main:app --reload

# Start database (if needed)
docker-compose up db
```

### **2. Create New Components**
```bash
# Daily feedback form
touch frontend/src/components/feedback/DailyFeedbackForm.tsx
touch frontend/src/components/feedback/ExerciseFeedbackForm.tsx
touch frontend/src/components/feedback/FeedbackSummary.tsx

# Training recommendations
touch frontend/src/components/training/SessionRecommendations.tsx
touch frontend/src/components/training/ExerciseCard.tsx
touch frontend/src/components/training/LoadAdjustments.tsx

# Dashboard
touch frontend/src/components/dashboard/AdaptationDashboard.tsx
touch frontend/src/components/charts/LoadTrendChart.tsx
touch frontend/src/components/dashboard/FeedbackTrends.tsx
```

### **3. Mock Data Structure**
```typescript
// lib/mockData/types.ts
interface MockTrainingSession {
  id: string;
  date: Date;
  exercises: MockExercise[];
  plannedLoad: number;
  actualLoad: number;
  feedback?: DailyFeedback;
}

interface MockExercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  rpe?: number;
  notes?: string;
}

interface DailyFeedback {
  rpe: number;           // 1-10
  soreness: number;      // 1-10  
  energy: number;        // 1-10
  motivation: number;    // 1-10
  notes: string;
}
```

## **Success Metrics for MVP**

### **Week 1 Success:**
- ✅ Feedback form captures all required data
- ✅ Recommendations display clearly
- ✅ Dashboard shows trends visually
- ✅ Navigation between screens works

### **Week 2 Success:**
- ✅ Mock data creates realistic scenarios
- ✅ Rule engine produces sensible adaptations
- ✅ Complete user flow: feedback → recommendation → adaptation
- ✅ System feels responsive and intelligent

## **Technical Stack**

### **Frontend:**
- **Next.js 14** with App Router
- **Mantine UI v7** for components
- **Recharts** for visualizations
- **React Query** for state management
- **TypeScript** for type safety

### **Mock Backend:**
- **Static JSON files** for initial data
- **Local Storage** for persistence
- **Client-side calculations** for adaptation logic

## **File Structure**
```
frontend/src/
├── components/
│   ├── feedback/          # NEW: Feedback collection
│   ├── training/          # NEW: Training recommendations  
│   ├── dashboard/         # ENHANCE: Adaptation dashboard
│   └── charts/            # NEW: Data visualizations
├── lib/
│   ├── mockData/          # NEW: Mock data system
│   ├── adaptation/        # NEW: Rule-based logic
│   └── types/             # NEW: TypeScript definitions
└── app/
    ├── feedback/          # NEW: Feedback pages
    ├── recommendations/   # NEW: Recommendation pages
    └── dashboard/         # ENHANCE: Main dashboard
```

## **Beyond MVP (Phase 3-4)**

Once MVP is validated:

1. **Database Integration** - Replace mock data with Supabase
2. **Real ML Models** - Train on Joshua Hudson data  
3. **API Development** - FastAPI endpoints for adaptation
4. **Advanced Features** - Weekly planning, exercise substitution
5. **Performance Optimization** - Caching, real-time updates

## **Getting Started Command**

```bash
# Start with the daily feedback form
cd frontend/src/components
mkdir -p feedback training dashboard charts
cd feedback
# Create DailyFeedbackForm.tsx first
```

**Recommendation: Start with the DailyFeedbackForm.tsx** - it's the foundation of the entire system and will give immediate visual feedback on the core concept.

Would you like me to create the first component (DailyFeedbackForm) to get started?