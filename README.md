# Bobsleigh Coach AI

An AI-powered training application for bobsleigh athletes with personalized recommendations and performance tracking.

## Overview

This application uses advanced machine learning techniques to analyze athlete performance data and provide personalized training recommendations, performance tracking, and coaching insights specifically tailored for bobsleigh athletes with plans to expand to other sports.

## Tech Stack

### Frontend
- Next.js 14 (React framework)
- TypeScript
- Mantine UI v7 (Component library)
- React Query (Data fetching and caching)

### Backend
- Python 3.11
- FastAPI (API framework)
- PyTorch (ML framework)
- PostgreSQL via Supabase (Database)

### AI/ML
- Performance Management Charts (PMC) for training load analysis
- Fine-tuned LLM for personalized coaching recommendations
- PyTorch for custom model training and inference

### Deployment
- Google Cloud Run (Containerized deployment)
- Docker (Containerization)

## Repository Structure

```
/
├── frontend/              # Next.js application
│   ├── public/            # Static assets
│   └── src/               # Source code
│       ├── app/           # Next.js App Router
│       ├── components/    # React components
│       ├── hooks/         # Custom React hooks
│       ├── styles/        # Global styles
│       └── utils/         # Utility functions
│
├── backend/               # Python FastAPI application
│   ├── app/               # Application code
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core functionality
│   │   ├── db/            # Database models and utils
│   │   ├── models/        # ML models
│   │   └── services/      # Business logic
│   ├── tests/             # Test suite
│   └── Dockerfile         # Backend Dockerfile
│
├── ml/                    # Machine learning code
│   ├── data/              # Data processing scripts
│   ├── models/            # Model definitions
│   ├── notebooks/         # Jupyter notebooks
│   └── training/          # Training scripts
│
└── docker-compose.yml     # Development environment setup
```

## Getting Started

Instructions for setting up development environment will be added soon.

## License

MIT License