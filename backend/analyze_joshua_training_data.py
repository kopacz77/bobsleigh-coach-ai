#!/usr/bin/env python3
"""
Joshua Hudson Training Data Analysis Script

This script analyzes the Joshua Hudson Training Template.xlsx file to extract
training data for ML model development.
"""

import pandas as pd
import numpy as np
import openpyxl
from datetime import datetime, timedelta
import json
from pathlib import Path
import warnings

warnings.filterwarnings('ignore', category=UserWarning)

def analyze_excel_structure(file_path):
    """Analyze the structure of the Excel file and identify all sheets."""
    print("=== EXCEL FILE STRUCTURE ANALYSIS ===\n")
    
    # Load workbook to get sheet names
    workbook = openpyxl.load_workbook(file_path, data_only=True)
    sheet_names = workbook.sheetnames
    
    print(f"Total sheets found: {len(sheet_names)}")
    print("Sheet names:")
    for i, name in enumerate(sheet_names, 1):
        print(f"  {i}. {name}")
    
    sheet_analysis = {}
    
    # Analyze each sheet
    for sheet_name in sheet_names:
        print(f"\n--- Analyzing Sheet: '{sheet_name}' ---")
        
        try:
            # Read the sheet
            df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
            
            # Basic info
            rows, cols = df.shape
            print(f"Dimensions: {rows} rows × {cols} columns")
            
            # Find potential headers (look for rows with many non-null values)
            header_candidates = []
            for idx in range(min(10, rows)):  # Check first 10 rows
                non_null_count = df.iloc[idx].notna().sum()
                if non_null_count >= cols * 0.3:  # At least 30% non-null
                    header_candidates.append((idx, non_null_count, df.iloc[idx].tolist()))
            
            print(f"Potential header rows: {len(header_candidates)}")
            for idx, count, row_data in header_candidates[:3]:  # Show first 3
                print(f"  Row {idx}: {count} non-null values")
                print(f"    Sample: {[str(x)[:30] for x in row_data[:5] if pd.notna(x)]}")
            
            # Sample data from different parts of the sheet
            print("\nSample data from different regions:")
            sample_rows = [0, rows//4, rows//2, 3*rows//4, rows-1] if rows > 5 else list(range(rows))
            for row_idx in sample_rows:
                if row_idx < rows:
                    sample_data = [str(x)[:20] for x in df.iloc[row_idx].tolist()[:5] if pd.notna(x)]
                    print(f"  Row {row_idx}: {sample_data}")
            
            sheet_analysis[sheet_name] = {
                'dimensions': (rows, cols),
                'header_candidates': header_candidates,
                'sample_data': df.head(10).to_dict() if rows > 0 else {}
            }
            
        except Exception as e:
            print(f"Error analyzing sheet '{sheet_name}': {e}")
            sheet_analysis[sheet_name] = {'error': str(e)}
    
    return sheet_analysis

def extract_training_data(file_path, sheet_analysis):
    """Extract and analyze training data from identified sheets."""
    print("\n\n=== TRAINING DATA EXTRACTION ===\n")
    
    extracted_data = {}
    
    for sheet_name, analysis in sheet_analysis.items():
        if 'error' in analysis:
            continue
            
        print(f"\n--- Extracting from Sheet: '{sheet_name}' ---")
        
        try:
            # Try different header row possibilities
            best_df = None
            best_score = 0
            
            for header_row, _, _ in analysis.get('header_candidates', [(0, 0, [])]):
                try:
                    df = pd.read_excel(file_path, sheet_name=sheet_name, header=header_row)
                    
                    # Score this configuration based on data quality
                    score = 0
                    
                    # Look for training-related columns
                    training_keywords = [
                        'date', 'exercise', 'sets', 'reps', 'weight', 'load', 'volume',
                        'rpe', 'intensity', 'time', 'duration', 'distance', 'speed',
                        'power', 'heart rate', 'recovery', 'sleep', 'fatigue',
                        'wellbeing', 'stress', 'mood', 'soreness', 'performance',
                        'test', 'max', '1rm', 'squat', 'deadlift', 'bench', 'clean',
                        'snatch', 'sprint', 'jump', 'throw'
                    ]
                    
                    for col in df.columns:
                        col_str = str(col).lower()
                        for keyword in training_keywords:
                            if keyword in col_str:
                                score += 1
                                break
                    
                    # Prefer configurations with more data
                    score += df.notna().sum().sum() / 1000  # Normalize
                    
                    if score > best_score:
                        best_score = score
                        best_df = df
                        
                except Exception as e:
                    continue
            
            if best_df is not None:
                print(f"Best configuration found (score: {best_score:.2f})")
                print(f"Columns ({len(best_df.columns)}): {list(best_df.columns)[:10]}")
                
                # Analyze the data structure
                data_analysis = analyze_dataframe_structure(best_df, sheet_name)
                extracted_data[sheet_name] = {
                    'dataframe': best_df,
                    'analysis': data_analysis
                }
                
            else:
                print("No suitable data structure found")
                
        except Exception as e:
            print(f"Error extracting from sheet '{sheet_name}': {e}")
    
    return extracted_data

def analyze_dataframe_structure(df, sheet_name):
    """Analyze the structure and content of a dataframe."""
    analysis = {
        'shape': df.shape,
        'columns': list(df.columns),
        'data_types': df.dtypes.to_dict(),
        'null_counts': df.isnull().sum().to_dict(),
        'unique_counts': df.nunique().to_dict(),
        'date_columns': [],
        'numeric_columns': [],
        'categorical_columns': [],
        'training_indicators': {},
        'sample_data': {}
    }
    
    print(f"  Shape: {df.shape}")
    print(f"  Columns: {len(df.columns)}")
    
    # Identify column types and training relevance
    for col in df.columns:
        col_str = str(col).lower()
        
        # Check for date columns
        if any(keyword in col_str for keyword in ['date', 'time', 'day', 'week', 'month']):
            analysis['date_columns'].append(col)
            # Try to parse dates
            try:
                date_sample = pd.to_datetime(df[col].dropna().head(5))
                print(f"  Date column '{col}': {date_sample.tolist()}")
            except:
                pass
        
        # Check for numeric training data
        if df[col].dtype in ['int64', 'float64'] or any(keyword in col_str for keyword in 
            ['sets', 'reps', 'weight', 'load', 'time', 'distance', 'speed', 'power', 'rpe']):
            analysis['numeric_columns'].append(col)
            
            # Get basic stats
            if df[col].dtype in ['int64', 'float64']:
                stats = df[col].describe()
                print(f"  Numeric column '{col}': mean={stats['mean']:.2f}, range=[{stats['min']:.1f}, {stats['max']:.1f}]")
        
        # Check for categorical data
        if df[col].dtype == 'object' and df[col].nunique() < 50:
            analysis['categorical_columns'].append(col)
            unique_vals = df[col].dropna().unique()[:10]
            print(f"  Categorical column '{col}': {len(df[col].unique())} unique values")
            print(f"    Sample values: {list(unique_vals)}")
        
        # Training-specific indicators
        training_keywords = {
            'exercise_type': ['exercise', 'movement', 'activity', 'drill'],
            'load_metrics': ['sets', 'reps', 'weight', 'load', 'volume'],
            'intensity': ['rpe', 'intensity', '%', 'percent', 'max'],
            'performance': ['time', 'distance', 'speed', 'power', 'height'],
            'recovery': ['sleep', 'recovery', 'fatigue', 'soreness', 'stress'],
            'wellbeing': ['mood', 'energy', 'motivation', 'readiness']
        }
        
        for category, keywords in training_keywords.items():
            if any(keyword in col_str for keyword in keywords):
                if category not in analysis['training_indicators']:
                    analysis['training_indicators'][category] = []
                analysis['training_indicators'][category].append(col)
    
    # Sample data for verification
    if len(df) > 0:
        analysis['sample_data'] = df.head(5).to_dict()
    
    return analysis

def identify_key_insights(extracted_data):
    """Identify key insights for ML model development."""
    print("\n\n=== KEY INSIGHTS FOR ML MODEL ===\n")
    
    insights = {
        'training_frequency_patterns': {},
        'exercise_categories': set(),
        'performance_metrics': set(),
        'periodization_indicators': [],
        'data_quality_assessment': {},
        'ml_features_potential': []
    }
    
    for sheet_name, data in extracted_data.items():
        df = data['dataframe']
        analysis = data['analysis']
        
        print(f"--- Insights from '{sheet_name}' ---")
        
        # Training frequency analysis
        date_cols = analysis['date_columns']
        if date_cols:
            for date_col in date_cols:
                try:
                    dates = pd.to_datetime(df[date_col].dropna())
                    if len(dates) > 1:
                        date_range = dates.max() - dates.min()
                        frequency = len(dates) / (date_range.days + 1) if date_range.days > 0 else 0
                        print(f"  Training frequency: {frequency:.2f} sessions/day over {date_range.days} days")
                        insights['training_frequency_patterns'][sheet_name] = {
                            'total_sessions': len(dates),
                            'date_range_days': date_range.days,
                            'frequency_per_day': frequency
                        }
                except Exception as e:
                    print(f"  Could not analyze dates: {e}")
        
        # Exercise categorization
        for col in analysis['categorical_columns']:
            if any(keyword in str(col).lower() for keyword in ['exercise', 'movement', 'activity']):
                unique_exercises = df[col].dropna().unique()
                insights['exercise_categories'].update(unique_exercises)
                print(f"  Exercise types found: {len(unique_exercises)} unique exercises")
        
        # Performance metrics identification
        for col in analysis['numeric_columns']:
            col_lower = str(col).lower()
            if any(keyword in col_lower for keyword in ['weight', 'time', 'distance', 'rpe', 'power']):
                insights['performance_metrics'].add(col)
        
        # Data quality assessment
        total_cells = df.shape[0] * df.shape[1]
        null_cells = df.isnull().sum().sum()
        completeness = 1 - (null_cells / total_cells) if total_cells > 0 else 0
        
        insights['data_quality_assessment'][sheet_name] = {
            'completeness': completeness,
            'total_cells': total_cells,
            'null_cells': null_cells,
            'usable_rows': len(df.dropna(thresh=len(df.columns)*0.3))
        }
        
        print(f"  Data completeness: {completeness:.1%}")
        print(f"  Usable rows (>30% complete): {insights['data_quality_assessment'][sheet_name]['usable_rows']}")
    
    # ML Features potential
    print("\n--- ML Features Potential ---")
    all_training_indicators = {}
    for data in extracted_data.values():
        for category, cols in data['analysis']['training_indicators'].items():
            if category not in all_training_indicators:
                all_training_indicators[category] = set()
            all_training_indicators[category].update(cols)
    
    for category, cols in all_training_indicators.items():
        insights['ml_features_potential'].append(f"{category}: {len(cols)} columns")
        print(f"  {category}: {len(cols)} potential features")
    
    insights['exercise_categories'] = list(insights['exercise_categories'])
    insights['performance_metrics'] = list(insights['performance_metrics'])
    
    return insights

def generate_ml_recommendations(insights, extracted_data):
    """Generate recommendations for ML model development."""
    print("\n\n=== ML MODEL RECOMMENDATIONS ===\n")
    
    recommendations = {
        'data_preprocessing': [],
        'feature_engineering': [],
        'model_architecture': [],
        'training_strategy': []
    }
    
    # Data preprocessing recommendations
    print("--- Data Preprocessing Recommendations ---")
    
    total_completeness = np.mean([qa['completeness'] for qa in insights['data_quality_assessment'].values()])
    print(f"Overall data completeness: {total_completeness:.1%}")
    
    if total_completeness < 0.8:
        recommendations['data_preprocessing'].append("Implement robust missing data imputation strategy")
        print("• Implement missing data imputation (completeness < 80%)")
    
    if len(insights['exercise_categories']) > 50:
        recommendations['data_preprocessing'].append("Group similar exercises into categories")
        print("• Group exercises into categories (many unique exercises found)")
    
    recommendations['data_preprocessing'].extend([
        "Normalize date formats and create time-based features",
        "Standardize exercise naming conventions",
        "Handle outliers in performance metrics"
    ])
    
    # Feature engineering recommendations  
    print("\n--- Feature Engineering Recommendations ---")
    
    if insights['training_frequency_patterns']:
        recommendations['feature_engineering'].append("Create rolling window features for training load")
        print("• Create rolling training load features (CTL, ATL, TSB)")
    
    if 'load_metrics' in [cat for data in extracted_data.values() for cat in data['analysis']['training_indicators']]:
        recommendations['feature_engineering'].append("Calculate volume and intensity metrics")
        print("• Calculate training volume and intensity metrics")
    
    recommendations['feature_engineering'].extend([
        "Create periodization phase indicators",
        "Generate exercise-specific progression features",
        "Develop recovery and adaptation indicators"
    ])
    
    # Model architecture recommendations
    print("\n--- Model Architecture Recommendations ---")
    
    if len(insights['exercise_categories']) > 20:
        recommendations['model_architecture'].append("Use embedding layers for exercise types")
        print("• Use embedding layers for exercise categorization")
    
    session_counts = sum([fp.get('total_sessions', 0) for fp in insights['training_frequency_patterns'].values()])
    if session_counts > 500:
        recommendations['model_architecture'].append("Consider LSTM/GRU for sequence modeling")
        print("• Consider sequential models (LSTM/GRU) for time series patterns")
    
    recommendations['model_architecture'].extend([
        "Multi-task learning for different training outcomes",
        "Attention mechanisms for exercise importance weighting"
    ])
    
    # Training strategy
    print("\n--- Training Strategy Recommendations ---")
    recommendations['training_strategy'].extend([
        "Use time-based train/validation splits",
        "Implement cross-validation by training blocks",
        "Monitor for temporal drift in training patterns"
    ])
    
    return recommendations

def create_database_conversion_script(extracted_data, insights):
    """Generate a script to convert Excel data to database schema format."""
    
    script_content = '''#!/usr/bin/env python3
"""
Database Conversion Script for Joshua Hudson Training Data

This script converts the Excel training data into the database schema format
used by the Bobsleigh Coach AI application.
"""

import pandas as pd
import numpy as np
from datetime import datetime
import json
import sys
from pathlib import Path

# Add the backend path to import our models
sys.path.append('/home/kopacz/Development/existing-projects/bobsleigh-coach-ai/backend')

def convert_excel_to_db_format(excel_file_path):
    """Convert Excel data to database-compatible format."""
    
    # This will be populated based on the analysis
    converted_data = {
        'athletes': [],
        'workouts': [],
        'exercises': [],
        'performance_tests': [],
        'wellbeing_entries': []
    }
    
    print("Converting Excel data to database format...")
    
    # TODO: Implement conversion logic based on specific sheet structure
    # This template will be customized based on the actual data found
    
    return converted_data

def save_converted_data(converted_data, output_dir):
    """Save converted data as JSON files for database import."""
    
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    for table_name, data in converted_data.items():
        file_path = output_path / f"{table_name}.json"
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        print(f"Saved {len(data)} records to {file_path}")

if __name__ == "__main__":
    excel_file = "/home/kopacz/Development/existing-projects/bobsleigh-coach-ai/Joshua Hudson Training Template.xlsx"
    output_dir = "/home/kopacz/Development/existing-projects/bobsleigh-coach-ai/backend/converted_data"
    
    converted_data = convert_excel_to_db_format(excel_file)
    save_converted_data(converted_data, output_dir)
    
    print("Conversion complete!")
'''
    
    return script_content

def main():
    """Main analysis function."""
    file_path = "/home/kopacz/Development/existing-projects/bobsleigh-coach-ai/Joshua Hudson Training Template.xlsx"
    
    print("Joshua Hudson Training Data Analysis")
    print("="*50)
    
    # Check if file exists
    if not Path(file_path).exists():
        print(f"Error: File not found at {file_path}")
        return
    
    try:
        # Step 1: Analyze Excel structure
        sheet_analysis = analyze_excel_structure(file_path)
        
        # Step 2: Extract training data
        extracted_data = extract_training_data(file_path, sheet_analysis)
        
        # Step 3: Identify key insights
        insights = identify_key_insights(extracted_data)
        
        # Step 4: Generate ML recommendations
        recommendations = generate_ml_recommendations(insights, extracted_data)
        
        # Step 5: Create database conversion script
        conversion_script = create_database_conversion_script(extracted_data, insights)
        
        # Save analysis results
        results = {
            'sheet_analysis': sheet_analysis,
            'insights': insights,
            'recommendations': recommendations,
            'analysis_timestamp': datetime.now().isoformat()
        }
        
        # Save results to JSON file
        with open('joshua_training_analysis_results.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        # Save conversion script
        with open('excel_to_db_converter.py', 'w') as f:
            f.write(conversion_script)
        
        print(f"\n\nAnalysis complete!")
        print(f"Results saved to: joshua_training_analysis_results.json")
        print(f"Conversion script saved to: excel_to_db_converter.py")
        
    except Exception as e:
        print(f"Error during analysis: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()