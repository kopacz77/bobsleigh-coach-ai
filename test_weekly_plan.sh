#!/bin/bash
# Script to test the weekly plan generator with Josh Hudson's data

# Set environment variables
export SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5ZGZxeGJqa2xja3Bpdm1xbmNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM4OTQzNDgsImV4cCI6MjA0OTQ3MDM0OH0.PE7UTj219M5cVK7Rkm_BuJXbP5WMTmNZ6Ic28mECkIs
"  # Replace with your actual Supabase anon key

# Install required dependencies
pip install supabase pandas numpy

# Run the weekly plan generator test script
python backend/scripts/test_weekly_plan.py \
  --email "josh.hudson@example.com" \
  --week 9 \
  --output "josh_weekly_plan.json"

# Output success message
echo "Weekly plan generation complete!"