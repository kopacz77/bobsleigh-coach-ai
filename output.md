PS C:\Users\A_kop\bobsleigh-coach-ai> python backend/scripts/parse_josh_training_data.py --excel "Joshua Hudson Training Template.xlsx" --start-week 1 --weeks 8 --output "josh_data_export_v2.json"
Parsing training data from Joshua Hudson Training Template.xlsx, sheet 'Training Plan 2'...
First 5 rows of data:
Row 0, Col 0: 'Road to Italy 2024'
Row 1, Col 0: 'nan'
Row 2, Col 0: 'Week '
Row 3, Col 0: '1'
Row 4, Col 0: 'Notes: '
Found 48 weeks in the spreadsheet
Processing Week 1 (starting at row 2)
  Found 6 training days in Week 1
    Warning: Using generated date 2024-01-01 for Day 1 of Week 1
    Found 3 exercise groups
    Warning: Using generated date 2024-01-02 for Day 2 of Week 1
    Found 3 exercise groups
    Warning: Using generated date 2024-01-03 for Day 3 of Week 1
    Found 3 exercise groups
    Warning: Using generated date 2024-01-04 for Day 4 of Week 1
    Found 3 exercise groups
    Warning: Using generated date 2024-01-05 for Day 5 of Week 1
    Found 3 exercise groups
    Warning: Using generated date 2024-01-06 for Day 6 of Week 1
    Found 3 exercise groups
Processing Week 2 (starting at row 39)
  Found 6 training days in Week 2
    Warning: Using generated date 2024-01-08 for Day 1 of Week 2
    Found 3 exercise groups
    Warning: Using generated date 2024-01-09 for Day 2 of Week 2
    Found 3 exercise groups
    Warning: Using generated date 2024-01-10 for Day 3 of Week 2
    Found 3 exercise groups
    Warning: Using generated date 2024-01-11 for Day 4 of Week 2
    Found 3 exercise groups
    Warning: Using generated date 2024-01-12 for Day 5 of Week 2
    Found 3 exercise groups
    Warning: Using generated date 2024-01-13 for Day 6 of Week 2
    Found 3 exercise groups
Processing Week 3 (starting at row 76)
  Found 6 training days in Week 3
    Warning: Using generated date 2024-01-15 for Day 1 of Week 3
    Found 3 exercise groups
    Warning: Using generated date 2024-01-16 for Day 2 of Week 3
    Found 3 exercise groups
    Warning: Using generated date 2024-01-17 for Day 3 of Week 3
    Found 3 exercise groups
    Warning: Using generated date 2024-01-18 for Day 4 of Week 3
    Found 3 exercise groups
    Warning: Using generated date 2024-01-19 for Day 5 of Week 3
    Found 3 exercise groups
    Warning: Using generated date 2024-01-20 for Day 6 of Week 3
    Found 3 exercise groups
Processing Week 4 (starting at row 113)
  Found 6 training days in Week 4
    Warning: Using generated date 2024-01-22 for Day 1 of Week 4
    Found 3 exercise groups
    Warning: Using generated date 2024-01-23 for Day 2 of Week 4
    Found 3 exercise groups
    Warning: Using generated date 2024-01-24 for Day 3 of Week 4
    Found 3 exercise groups
    Warning: Using generated date 2024-01-25 for Day 4 of Week 4
    Found 3 exercise groups
    Warning: Using generated date 2024-01-26 for Day 5 of Week 4
    Found 3 exercise groups
    Warning: Using generated date 2024-01-27 for Day 6 of Week 4
    Found 3 exercise groups
Processing Week 5 (starting at row 150)
  Found 6 training days in Week 5
    Warning: Using generated date 2024-01-29 for Day 1 of Week 5
    Found 3 exercise groups
    Warning: Using generated date 2024-01-30 for Day 2 of Week 5
    Found 3 exercise groups
    Warning: Using generated date 2024-01-31 for Day 3 of Week 5
    Found 3 exercise groups
    Warning: Using generated date 2024-02-01 for Day 4 of Week 5
    Found 3 exercise groups
    Warning: Using generated date 2024-02-02 for Day 5 of Week 5
    Found 3 exercise groups
    Warning: Using generated date 2024-02-03 for Day 6 of Week 5
    Found 3 exercise groups
Processing Week 6 (starting at row 187)
  Found 6 training days in Week 6
    Warning: Using generated date 2024-02-05 for Day 1 of Week 6
    Found 3 exercise groups
    Warning: Using generated date 2024-02-06 for Day 2 of Week 6
    Found 3 exercise groups
    Warning: Using generated date 2024-02-07 for Day 3 of Week 6
    Found 3 exercise groups
    Warning: Using generated date 2024-02-08 for Day 4 of Week 6
    Found 3 exercise groups
    Warning: Using generated date 2024-02-09 for Day 5 of Week 6
    Found 3 exercise groups
    Warning: Using generated date 2024-02-10 for Day 6 of Week 6
    Found 3 exercise groups
Processing Week 7 (starting at row 224)
  Found 6 training days in Week 7
    Warning: Using generated date 2024-02-12 for Day 1 of Week 7
    Found 3 exercise groups
    Warning: Using generated date 2024-02-13 for Day 2 of Week 7
    Found 3 exercise groups
    Warning: Using generated date 2024-02-14 for Day 3 of Week 7
    Found 3 exercise groups
    Warning: Using generated date 2024-02-15 for Day 4 of Week 7
    Found 3 exercise groups
    Warning: Using generated date 2024-02-16 for Day 5 of Week 7
    Found 3 exercise groups
    Warning: Using generated date 2024-02-17 for Day 6 of Week 7
    Found 3 exercise groups
Processing Week 8 (starting at row 261)
  Found 6 training days in Week 8
    Warning: Using generated date 2024-02-19 for Day 1 of Week 8
    Found 123 exercise groups
    Warning: Using generated date 2024-02-20 for Day 2 of Week 8
    Found 123 exercise groups
Traceback (most recent call last):
  File "C:\Users\A_kop\bobsleigh-coach-ai\backend\scripts\parse_josh_training_data.py", line 611, in <module>
    main()
    ~~~~^^
  File "C:\Users\A_kop\bobsleigh-coach-ai\backend\scripts\parse_josh_training_data.py", line 591, in main
    data = parse_josh_hudson_data(
        args.excel,
    ...<3 lines>...
        args.weeks
    )
  File "C:\Users\A_kop\bobsleigh-coach-ai\backend\scripts\parse_josh_training_data.py", line 318, in parse_josh_hudson_data
    "mhg": float(mhg_value) if mhg_value is not None and not pd.isna(mhg_value) else None,
           ~~~~~^^^^^^^^^^^
ValueError: could not convert string to float: '#REF!'