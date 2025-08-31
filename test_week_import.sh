#!/bin/bash
# Script to test parsing a single week from Josh's training data

# Default values
EXCEL_FILE="Joshua Hudson Training Template.xlsx"
OUTPUT_FILE="test_week_export.json"
WEEK_NUMBER=1
SHEET_NAME="Training Plan 2"
ATHLETE_ID="22e457e7-b89b-12d3-a456-426614174000"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --excel)
      EXCEL_FILE="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --week)
      WEEK_NUMBER="$2"
      shift 2
      ;;
    --sheet)
      SHEET_NAME="$2"
      shift 2
      ;;
    --athlete-id)
      ATHLETE_ID="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --excel FILE       Excel file path (default: $EXCEL_FILE)"
      echo "  --output FILE      Output JSON file path (default: $OUTPUT_FILE)"
      echo "  --week N           Week number to test (default: $WEEK_NUMBER)"
      echo "  --sheet NAME       Excel sheet name (default: $SHEET_NAME)"
      echo "  --athlete-id ID    Athlete ID (default: $ATHLETE_ID)"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check if Excel file exists
if [ ! -f "$EXCEL_FILE" ]; then
  echo "Error: Excel file '$EXCEL_FILE' not found."
  exit 1
fi

# Run the parser script for just a single week
echo "Testing import of Week $WEEK_NUMBER from $EXCEL_FILE..."
python backend/scripts/parse_josh_training_data.py \
  --excel "$EXCEL_FILE" \
  --output "$OUTPUT_FILE" \
  --start-week "$WEEK_NUMBER" \
  --weeks 1 \
  --sheet "$SHEET_NAME" \
  --athlete-id "$ATHLETE_ID"

# Check if import was successful
if [ $? -eq 0 ]; then
  echo "Test import completed successfully!"
  echo "Data saved to $OUTPUT_FILE"
  
  # Count the number of exercise groups and exercises
  GROUP_COUNT=$(grep -o '"workout_id"' "$OUTPUT_FILE" | wc -l)
  EXERCISE_COUNT=$(grep -o '"group_id"' "$OUTPUT_FILE" | wc -l)
  
  echo "Statistics for Week $WEEK_NUMBER:"
  echo "- Exercise Groups: $GROUP_COUNT"
  echo "- Exercises: $EXERCISE_COUNT"
  
  # Display the first few lines of the JSON
  echo -e "\nPreview of output JSON:"
  head -20 "$OUTPUT_FILE"
  echo "..."
else
  echo "Test import failed."
  exit 1
fi