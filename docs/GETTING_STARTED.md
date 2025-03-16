# Getting Started Guide

## Introduction

This guide will help you set up and run the Bobsleigh Coach AI application locally for development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **Python** (v3.11 or later)
- **Docker** and **Docker Compose**
- **Git**

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/kopacz77/bobsleigh-coach-ai.git
cd bobsleigh-coach-ai
```

### 2. Set Up Supabase

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. Execute the SQL in `backend/sql/supabase_schema.sql` in the Supabase SQL Editor
3. Get your Supabase URL and anon key from the project settings

### 3. Create Environment Files

Create a `.env` file in the root directory:

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

Create a `.env.local` file in the `frontend` directory:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Create a `.env` file in the `backend` directory:

```
ENVIRONMENT=development
DATABASE_URL=postgresql://postgres:postgres@db:5432/bobsleigh
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
CORS_ORIGINS=http://localhost:3000
SECRET_KEY=your_secret_key
```

Generate a secure SECRET_KEY with the provided script:

```bash
python backend/scripts/generate_secret_key.py
```

## Running the Application

### Using Docker Compose (Recommended)

The easiest way to run the entire application stack is with Docker Compose:

```bash
docker-compose up
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:8000
- PostgreSQL database on port 5432

### Running Components Separately

If you prefer to run components individually for development:

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Database

You can use the database from Docker Compose while running the backend locally:

```bash
docker-compose up db
```

Or configure your backend to connect to Supabase directly by updating the `DATABASE_URL` in your backend `.env` file.

## Machine Learning Development

To work with the machine learning components:

```bash
cd ml
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Run Jupyter notebooks:

```bash
jupyter lab
```

Train models:

```bash
python -m ml.training.train_pmc_model --data_path sample --output_path models/checkpoints/pmc_model.pkl
```

## Testing

### Frontend Tests

```bash
cd frontend
npm test
```

### Backend Tests

```bash
cd backend
python -m pytest
```

## Development Workflow

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**:
   - Implement the feature or fix
   - Add tests for your changes

3. **Run Tests**:
   - Ensure all tests pass
   - Check for linting errors with `npm run lint` in frontend

4. **Commit Your Changes**:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. **Push Your Branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**:
   - Open a pull request on GitHub
   - Wait for CI checks to pass
   - Request code review

## Using the Application

### Initial Login

1. Open the frontend URL (http://localhost:3000)
2. Sign in with Google (requires Google OAuth configuration in Supabase)

### Sample Data

You can initialize the database with sample data using:

```bash
cd backend
python -m app.init_db
```

This creates a sample user, athlete, and training data for testing.

## Accessing the API Documentation

The API documentation is available at:

```
http://localhost:8000/docs
```

Use this to explore the available endpoints and test them directly.

## Common Issues

### Supabase Connection Issues

If you have trouble connecting to Supabase:

1. Verify your API credentials
2. Check that you've enabled the required Supabase services (Auth, Database)
3. Ensure your IP is allowed if you've enabled IP restrictions

### Docker Issues

If Docker Compose fails to start:

1. Check if ports 3000, 8000, or 5432 are already in use
2. Verify that Docker is running
3. Try rebuilding with `docker-compose build --no-cache`

### Database Migrations

If you need to modify the database schema:

1. Update the SQL in `backend/sql/supabase_schema.sql`
2. Apply the changes to your Supabase project using the SQL Editor

## Getting Help

If you encounter issues, check:

- The project documentation in the `docs` directory
- Open GitHub issues for known problems
- Create a new issue if you discover a bug or have a question
