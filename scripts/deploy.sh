#!/bin/bash

# Deployment script for Google Cloud Run

set -e

# Check if required environment variables are set
if [ -z "$GCP_PROJECT_ID" ] || [ -z "$GCP_REGION" ]; then
    echo "Error: Required environment variables are not set."
    echo "Please set GCP_PROJECT_ID and GCP_REGION."
    exit 1
fi

# Set environment variables
PROJECT_ID="$GCP_PROJECT_ID"
REGION="$GCP_REGION"
BACKEND_SERVICE_NAME="bobsleigh-coach-ai-backend"
FRONTEND_SERVICE_NAME="bobsleigh-coach-ai-frontend"

echo "Deploying to project: $PROJECT_ID in region: $REGION"

# Go to the project root directory
cd "$(dirname "$0")/.." || exit

# Build the backend Docker image
echo "Building backend Docker image..."
cd backend || exit
docker build -t "gcr.io/$PROJECT_ID/$BACKEND_SERVICE_NAME:latest" .

# Push the image to Google Container Registry
echo "Pushing image to Google Container Registry..."
gcloud auth configure-docker --quiet
docker push "gcr.io/$PROJECT_ID/$BACKEND_SERVICE_NAME:latest"

# Deploy the backend service to Cloud Run
echo "Deploying backend to Cloud Run..."
gcloud run deploy "$BACKEND_SERVICE_NAME" \
    --image "gcr.io/$PROJECT_ID/$BACKEND_SERVICE_NAME:latest" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --set-env-vars "ENVIRONMENT=production" \
    --set-env-vars-from-file .env.yaml \
    --quiet

# Get the backend service URL
BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE_NAME" \
    --platform managed \
    --region "$REGION" \
    --format 'value(status.url)')

echo "Backend deployed at: $BACKEND_URL"

# Build the frontend
cd ../frontend || exit
echo "Building frontend..."
npm ci
NEXT_PUBLIC_API_URL="$BACKEND_URL" npm run build

# Build frontend Docker image
echo "Building frontend Docker image..."
docker build -t "gcr.io/$PROJECT_ID/$FRONTEND_SERVICE_NAME:latest" .

# Push frontend image to Google Container Registry
echo "Pushing frontend image to Google Container Registry..."
docker push "gcr.io/$PROJECT_ID/$FRONTEND_SERVICE_NAME:latest"

# Deploy the frontend service to Cloud Run
echo "Deploying frontend to Cloud Run..."
gcloud run deploy "$FRONTEND_SERVICE_NAME" \
    --image "gcr.io/$PROJECT_ID/$FRONTEND_SERVICE_NAME:latest" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --set-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL" \
    --quiet

# Get the frontend service URL
FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE_NAME" \
    --platform managed \
    --region "$REGION" \
    --format 'value(status.url)')

echo "Deployment completed successfully!"
echo "Frontend app is available at: $FRONTEND_URL"
echo "Backend API is available at: $BACKEND_URL"
