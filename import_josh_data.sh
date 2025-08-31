#!/bin/bash
# Script to import Josh's training data from Excel

# Default values
EXCEL_FILE="Joshua Hudson Training Template.xlsx"
OUTPUT_FILE="josh_data_export.json"
START_WEEK=1
WEEKS_TO_IMPORT=8
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
    --start-week)
      START_WEEK="$2"
      shift 2
      ;;
    --weeks)
      WEEKS_TO_IMPORT="$2"
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
      echo "  --start-week N     First week to import (default: $START_WEEK)"
      echo "  --weeks N          Number of weeks to import (default: $WEEKS_TO_IMPORT)"
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

# Run the parser script
echo "Importing data from $EXCEL_FILE..."
python backend/scripts/parse_josh_training_data.py \
  --excel "$EXCEL_FILE" \
  --output "$OUTPUT_FILE" \
  --start-week "$START_WEEK" \
  --weeks "$WEEKS_TO_IMPORT" \
  --sheet "$SHEET_NAME" \
  --athlete-id "$ATHLETE_ID"

# Check if import was successful
if [ $? -eq 0 ]; then
  echo "Import completed successfully!"
  echo "Data saved to $OUTPUT_FILE"
else
  echo "Import failed."
  exit 1
fi

# Make the output file available for further processing
echo "To import this data into the database, run:"
echo "  python backend/scripts/import_training_data.py --input $OUTPUT_FILE"