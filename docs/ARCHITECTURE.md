# System Architecture

## Overview

The Bobsleigh Coach AI application is designed as a modern, scalable web application with an AI-powered backend for personalized athlete training. The architecture follows a microservices approach with clear separation of concerns between frontend, backend, and machine learning components.

## High-Level Architecture

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│                │     │                │     │                │
│  React         │     │  FastAPI       │     │  Supabase      │
│  Frontend      │<───>│  Backend       │<───>│  Database      │
│                │     │                │     │                │
└────────────────┘     └───────┬────────┘     └────────────────┘
                               │                        ▲
                               ▼                        │
                        ┌────────────────┐              │
                        │                │              │
                        │  ML Models     │              │
                        │  (PyTorch)     │──────────────┘
                        │                │
                        └────────────────┘
```

## Component Breakdown

### Frontend (Next.js + React)

The frontend is a Next.js application that provides a responsive user interface for athletes and coaches. It communicates with the backend API for data and recommendations.

**Key Components:**
- **Pages**: Dashboard, Training, Performance, Profile, Settings
- **Components**: Reusable UI elements with Mantine UI
- **State Management**: React Query for server state, React hooks for client state
- **Authentication**: Supabase Auth with Google OAuth

**Technical Details:**
- Framework: Next.js 14 with React 18
- Styling: Mantine UI v7
- Data Fetching: React Query
- Routing: Next.js App Router
- TypeScript for type safety

### Backend (FastAPI)

The backend is a Python FastAPI application that handles business logic, data processing, and integration with ML models.

**Key Components:**
- **API Endpoints**: REST API for frontend communication
- **Service Layer**: Business logic encapsulation
- **Database Integration**: Supabase client for data access
- **ML Model Integration**: Loading and using trained models

**Technical Details:**
- Framework: FastAPI
- Database ORM: SQLAlchemy
- Authentication: JWT tokens via Supabase
- Documentation: OpenAPI/Swagger
- Containerization: Docker

### Machine Learning (PyTorch)

The ML component provides the intelligence behind personalized training recommendations and performance analysis.

**Key Components:**
- **PMC Model**: Performance Management Chart for training load analysis
- **Injury Risk Model**: Prediction of injury probability
- **Training Recommendation Engine**: Generation of personalized workout plans

**Technical Details:**
- Framework: PyTorch for custom models
- Libraries: scikit-learn, pandas, numpy
- Model Serving: FastAPI integration
- Training Pipeline: Separate scripts for model training

### Database (Supabase/PostgreSQL)

Supabase, built on PostgreSQL, provides a reliable and scalable database with built-in authentication and real-time capabilities.

**Key Components:**
- **Tables**: Athletes, Workouts, Exercises, Performance Metrics, etc.
- **Authentication**: User management and OAuth integration
- **Row-Level Security**: Data access control
- **Real-time Subscriptions**: Live updates for data changes

**Technical Details:**
- Database: PostgreSQL
- Access Control: Row-Level Security policies
- API: RESTful and real-time subscriptions
- Authentication: JWT-based with multiple providers

## Data Flow

### Authentication Flow

1. User initiates login with Google OAuth
2. Supabase handles OAuth redirect and token exchange
3. JWT token is returned to frontend
4. Frontend includes token in API requests
5. Backend validates token and authorizes access

### Workout Data Flow

1. Athlete logs workout in frontend
2. Data is sent to backend API
3. Backend validates and saves workout to Supabase
4. Backend calculates training load metrics
5. Updated metrics are stored in database
6. Frontend displays updated dashboard

### Recommendation Flow

1. Frontend requests training recommendations
2. Backend retrieves athlete's recent training data
3. PMC model analyzes training load and generates metrics
4. Recommendation engine creates personalized workout plan
5. Recommendations are returned to frontend and displayed

## Scalability Considerations

### Horizontal Scaling

- **Frontend**: Static files served via CDN, auto-scaling with Cloud Run
- **Backend**: Stateless design enables multiple instances
- **Database**: PostgreSQL with connection pooling

### Performance Optimization

- **Caching**: API responses cached where appropriate
- **Database Indexes**: Optimized for common queries
- **ML Model Optimization**: Quantized models for faster inference

### Security Measures

- **Authentication**: JWT-based with proper validation
- **Authorization**: Row-Level Security in database
- **API Security**: CORS, rate limiting, input validation
- **Data Protection**: Encryption at rest and in transit

## Monitoring and Observability

- **Application Metrics**: Request rates, errors, latencies
- **System Metrics**: CPU, memory, disk usage
- **ML Model Metrics**: Inference time, prediction accuracy
- **User Metrics**: Active users, feature usage

## Future Architecture Extensions

- **Real-time Notifications**: Push notifications for training reminders
- **Mobile App**: React Native application sharing code with web
- **Advanced Analytics**: Integration with additional ML models
- **Wearable Integration**: Direct data ingestion from fitness devices
- **Team Management**: Coach dashboard for managing multiple athletes
- **Video Analysis**: Computer vision for technique assessment

## Development Workflow

- **Local Development**: Docker Compose for full-stack environment
- **CI/CD**: GitHub Actions for testing and deployment
- **Testing**: Unit, integration, and end-to-end testing
- **Code Quality**: Linting, type checking, and code reviews
- **Documentation**: API docs, component docs, and architecture docs
