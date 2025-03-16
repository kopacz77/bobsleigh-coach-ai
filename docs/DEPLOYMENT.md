# Deployment Guide

## Overview

This guide covers how to deploy the Bobsleigh Coach AI application to Google Cloud Platform (GCP) using Cloud Run, a fully managed container platform.

## Prerequisites

- A Google Cloud Platform account
- Google Cloud SDK installed locally
- Docker installed locally
- A Supabase project set up (see [SUPABASE.md](SUPABASE.md))

## Preparing for Deployment

### 1. Set Up Google Cloud Project

1. Create a new GCP project (or use an existing one)
2. Enable the following APIs:
   - Cloud Run API
   - Container Registry API
   - Cloud Build API

```bash
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com
```

### 2. Create Environment Files

Create a `.env.yaml` file for Google Cloud Run environment variables:

```yaml
SUPABASE_URL: "https://your-project.supabase.co"
SUPABASE_KEY: "your-supabase-anon-key"
SECRET_KEY: "your-secret-key"
ENVIRONMENT: "production"
# Add other environment variables as needed
```

Generate a secure SECRET_KEY with the provided script:

```bash
python backend/scripts/generate_secret_key.py
```

### 3. Configure Google Cloud SDK

```bash
# Authenticate with Google Cloud
gcloud auth login

# Set default project
gcloud config set project YOUR_PROJECT_ID

# Configure Docker to use GCP authentication
gcloud auth configure-docker
```

## Deployment Methods

### Automatic Deployment with Script

For convenience, we've provided a deployment script that handles building and deploying both frontend and backend:

```bash
# Set environment variables
export GCP_PROJECT_ID=your-project-id
export GCP_REGION=us-central1

# Run deployment script
bash scripts/deploy.sh
```

The script will:
1. Build backend Docker image
2. Push image to Google Container Registry
3. Deploy backend to Cloud Run
4. Build frontend with correct API URL
5. Deploy frontend to Cloud Run

### Manual Deployment

If you prefer to deploy manually, follow these steps:

#### Backend Deployment

```bash
# Navigate to backend directory
cd backend

# Build Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/bobsleigh-coach-ai-backend:latest .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/bobsleigh-coach-ai-backend:latest

# Deploy to Cloud Run
gcloud run deploy bobsleigh-coach-ai-backend \
  --image gcr.io/YOUR_PROJECT_ID/bobsleigh-coach-ai-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars "ENVIRONMENT=production" \
  --set-env-vars-from-file .env.yaml
```

#### Frontend Deployment

```bash
# Get backend URL
BACKEND_URL=$(gcloud run services describe bobsleigh-coach-ai-backend \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)')

# Navigate to frontend directory
cd ../frontend

# Build the frontend
npm ci
NEXT_PUBLIC_API_URL=$BACKEND_URL npm run build

# Build and deploy Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/bobsleigh-coach-ai-frontend:latest .
docker push gcr.io/YOUR_PROJECT_ID/bobsleigh-coach-ai-frontend:latest

gcloud run deploy bobsleigh-coach-ai-frontend \
  --image gcr.io/YOUR_PROJECT_ID/bobsleigh-coach-ai-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL"
```

## CI/CD with GitHub Actions

This project includes a GitHub Actions workflow file (`.github/workflows/ci.yml`) that automates testing, building, and deployment.

To enable automatic deployments:

1. Add the following secrets to your GitHub repository:
   - `GCP_PROJECT_ID`: Your Google Cloud project ID
   - `GCP_SA_KEY`: A service account key with Cloud Run and Container Registry permissions (JSON format, base64 encoded)
   - `GCP_REGION`: Your preferred GCP region (e.g., `us-central1`)

2. Uncomment the deployment section in the workflow file

## Post-Deployment Steps

### 1. Configure Domain Name (Optional)

To use a custom domain:

1. Go to Cloud Run service in GCP Console
2. Click on "Domain Mappings"
3. Follow the steps to map your domain

### 2. Set Up Monitoring

1. Go to Cloud Run service in GCP Console
2. Click on "Metrics" tab to view performance
3. Set up alerts for errors or high latency

### 3. Testing the Deployment

Test your deployment by navigating to the frontend URL. You should be able to:

1. Sign in with Google
2. View the dashboard
3. Create workouts
4. View performance metrics

## Cost Optimization

Cloud Run charges based on usage. To optimize costs:

1. Use the smallest container size that meets your needs
2. Take advantage of Cloud Run's scaling to zero when not in use
3. Set maximum instances to control costs during traffic spikes
4. Consider using GCP's free tier resources when possible

## Troubleshooting

### Common Issues

1. **Deployment Failures**:
   - Check build logs for errors
   - Verify that all services are enabled
   - Ensure proper service account permissions

2. **Connection Issues**:
   - Verify CORS settings in backend
   - Check environment variables
   - Ensure backend URL is correctly set in frontend

3. **Database Connection Problems**:
   - Verify Supabase credentials
   - Check network access rules

### Viewing Logs

```bash
# View backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bobsleigh-coach-ai-backend" --limit 50

# View frontend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=bobsleigh-coach-ai-frontend" --limit 50
```

## Rollback Procedure

To rollback to a previous version:

```bash
# List revisions
gcloud run revisions list --service=bobsleigh-coach-ai-backend --platform=managed --region=us-central1

# Traffic migration to a specific revision
gcloud run services update-traffic bobsleigh-coach-ai-backend --to-revisions=REVISION_NAME=100 --platform=managed --region=us-central1
```

## Next Steps

- Set up continuous monitoring
- Implement periodic database backups
- Create a staging environment for testing changes
- Develop a release management process
