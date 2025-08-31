#!/usr/bin/env python3
"""
Database Setup Script for Bobsleigh Coach AI
This script will:
1. Apply the multi-sport schema to your Supabase database
2. Import Joshua Hudson's training data
3. Verify the setup is working correctly
"""

import os
import json
import sys
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Create and return Supabase client"""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        print("❌ Missing Supabase credentials in .env file")
        print("Please update:")
        print("  SUPABASE_URL=https://your-project-ref.supabase.co")
        print("  SUPABASE_KEY=your-anon-key")
        print("  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional)")
        sys.exit(1)
    
    if url == "https://your-project.supabase.co" or key == "your_anon_key_here" or "your-project" in url or "your_anon_key" in key:
        print("❌ Please update .env file with your actual Supabase credentials")
        print("Current values:")
        print(f"  SUPABASE_URL: {url}")
        print(f"  SUPABASE_KEY: {key[:20]}..." if key and len(key) > 20 else f"  SUPABASE_KEY: {key}")
        
        # Prompt for manual entry
        print("\n🔧 Enter your Supabase credentials manually:")
        manual_url = input("Supabase URL (https://your-project-ref.supabase.co): ").strip()
        manual_key = input("Supabase Anon Key: ").strip()
        
        if manual_url and manual_key and "supabase.co" in manual_url:
            return create_client(manual_url, manual_key)
        else:
            print("❌ Invalid credentials provided")
            sys.exit(1)
        
    return create_client(url, key)

def read_sql_file(file_path: str) -> str:
    """Read SQL file content"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"❌ SQL file not found: {file_path}")
        return None

def apply_schema(supabase: Client) -> bool:
    """Apply the multi-sport schema to Supabase"""
    print("🗄️ Applying multi-sport schema...")
    
    schema_path = "backend/sql/multi_sport_schema.sql"
    schema_sql = read_sql_file(schema_path)
    
    if not schema_sql:
        return False
    
    try:
        # Split the schema into individual statements
        statements = [stmt.strip() for stmt in schema_sql.split(';') if stmt.strip()]
        
        for i, statement in enumerate(statements):
            try:
                if statement.upper().startswith(('CREATE', 'ALTER', 'INSERT', 'DROP')):
                    result = supabase.rpc('sql', {'query': statement}).execute()
                    print(f"✅ Executed statement {i+1}/{len(statements)}")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"⚠️ Statement {i+1} skipped (already exists)")
                else:
                    print(f"❌ Error in statement {i+1}: {e}")
                    
        print("✅ Schema applied successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error applying schema: {e}")
        return False

def load_json_data(file_path: str) -> list:
    """Load JSON data from file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ Data file not found: {file_path}")
        return []
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in {file_path}: {e}")
        return []

def import_joshua_data(supabase: Client) -> bool:
    """Import Joshua Hudson's training data"""
    print("👤 Importing Joshua Hudson's training data...")
    
    # Check if data directory exists
    data_dir = Path("backend/converted_data")
    if not data_dir.exists():
        print(f"❌ Data directory not found: {data_dir}")
        return False
    
    try:
        # Import athletes data
        athletes_data = load_json_data(data_dir / "athletes.json")
        if athletes_data:
            for athlete in athletes_data:
                try:
                    result = supabase.table('athletes').insert(athlete).execute()
                    print(f"✅ Imported athlete: {athlete.get('first_name', 'Unknown')}")
                except Exception as e:
                    if "duplicate" in str(e).lower():
                        print(f"⚠️ Athlete already exists: {athlete.get('first_name', 'Unknown')}")
                    else:
                        print(f"❌ Error importing athlete: {e}")
        
        # Import performance tests
        performance_data = load_json_data(data_dir / "performance_tests.json")
        if performance_data:
            for test in performance_data:
                try:
                    result = supabase.table('performance_metrics').insert(test).execute()
                except Exception as e:
                    print(f"⚠️ Performance test import issue: {e}")
            print(f"✅ Imported {len(performance_data)} performance tests")
        
        # Import workouts
        workouts_data = load_json_data(data_dir / "workouts.json")
        if workouts_data:
            imported_count = 0
            for workout in workouts_data:
                try:
                    result = supabase.table('workouts').insert(workout).execute()
                    imported_count += 1
                except Exception as e:
                    if "duplicate" not in str(e).lower():
                        print(f"⚠️ Workout import issue: {e}")
            print(f"✅ Imported {imported_count} workouts")
        
        # Import exercises (individual exercise records)
        exercises_data = load_json_data(data_dir / "exercises.json")
        if exercises_data:
            imported_count = 0
            for exercise in exercises_data:
                try:
                    result = supabase.table('workout_exercises').insert(exercise).execute()
                    imported_count += 1
                except Exception as e:
                    if "duplicate" not in str(e).lower():
                        print(f"⚠️ Exercise import issue: {e}")
            print(f"✅ Imported {imported_count} exercise records")
        
        # Import wellbeing data
        wellbeing_data = load_json_data(data_dir / "wellbeing_entries.json")
        if wellbeing_data:
            imported_count = 0
            for entry in wellbeing_data:
                try:
                    result = supabase.table('wellbeing_assessments').insert(entry).execute()
                    imported_count += 1
                except Exception as e:
                    if "duplicate" not in str(e).lower():
                        print(f"⚠️ Wellbeing import issue: {e}")
            print(f"✅ Imported {imported_count} wellbeing assessments")
        
        print("✅ Joshua's data imported successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error importing Joshua's data: {e}")
        return False

def verify_setup(supabase: Client) -> bool:
    """Verify the database setup is working"""
    print("🔍 Verifying database setup...")
    
    try:
        # Check if tables exist and have data
        tables_to_check = [
            'sports', 'roles', 'athletes', 'exercises', 
            'workouts', 'performance_metrics', 'wellbeing_assessments'
        ]
        
        for table in tables_to_check:
            try:
                result = supabase.table(table).select('*').limit(1).execute()
                count = len(result.data)
                print(f"✅ Table '{table}': {count} records found")
            except Exception as e:
                print(f"❌ Table '{table}': {e}")
                return False
        
        # Check if Joshua's data is there
        result = supabase.table('athletes').select('*').eq('first_name', 'Joshua').execute()
        if result.data:
            print(f"✅ Joshua Hudson found in database: {result.data[0]['email']}")
        else:
            print("⚠️ Joshua Hudson not found in athletes table")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verifying setup: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Bobsleigh Coach AI Database Setup")
    print("=" * 50)
    
    # Get Supabase client
    try:
        supabase = get_supabase_client()
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return
    
    # Apply schema
    if not apply_schema(supabase):
        print("❌ Failed to apply schema. Stopping setup.")
        return
    
    # Import Joshua's data
    if not import_joshua_data(supabase):
        print("❌ Failed to import Joshua's data. Stopping setup.")
        return
    
    # Verify setup
    if verify_setup(supabase):
        print("\n🎉 Database setup completed successfully!")
        print("\nNext steps:")
        print("1. Start the frontend: cd frontend && npm run dev")
        print("2. Start the backend: cd backend && python3 -m uvicorn app.main:app --reload")
        print("3. Begin ML model development with Joshua's data")
    else:
        print("\n❌ Setup verification failed. Please check the logs above.")

if __name__ == "__main__":
    main()