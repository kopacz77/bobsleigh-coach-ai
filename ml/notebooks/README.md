# Analysis Notebooks

This directory contains Jupyter notebooks for data exploration, model development, and visualization for the Bobsleigh Coach AI application.

## Overview

These notebooks provide:

1. Exploratory data analysis of athlete training data
2. Interactive model development and testing
3. Visualization of performance metrics and predictions
4. Documentation of research and methodology

## Notebooks

- `01_pmc_analysis.ipynb`: Analysis of the Performance Management Chart model and training load patterns
- `02_injury_risk_analysis.ipynb`: Development and evaluation of the injury risk prediction model
- `03_performance_prediction.ipynb`: Forecasting performance based on training history

## Usage

To run these notebooks:

```bash
# Navigate to the ml directory
cd ml

# Install dependencies
pip install -r requirements.txt

# Start Jupyter Lab or Notebook
jupyter lab
# or
jupyter notebook
```

## Adding New Notebooks

When creating new analysis notebooks, follow these guidelines:

1. Use a numbered prefix to indicate sequence (e.g., `04_feature_engineering.ipynb`)
2. Include markdown cells with clear explanations of the analysis
3. Organize code into logical sections
4. Document the methodology and results
5. Include visualizations to illustrate key findings

## Best Practices

### Data Loading

Load data from the `../data` directory or generate sample data within the notebook. Include code to handle missing or corrupted data.

### Reproducibility

Set random seeds for reproducible results:

```python
import numpy as np
import random
import torch

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
```

### Model Development

When developing models in notebooks:

1. Start with simple models and gradually increase complexity
2. Track and compare model performance
3. Document hyperparameter choices and their effects
4. Validate findings with cross-validation

### Visualization

Create clear and informative visualizations:

```python
import matplotlib.pyplot as plt
import seaborn as sns

# Set style
sns.set_style('whitegrid')
plt.rcParams['figure.figsize'] = (12, 8)

# Create visualization
# ...

# Add title and labels
plt.title('Performance Management Chart')
plt.xlabel('Date')
plt.ylabel('Training Load')
plt.legend()
```

### Moving to Production

When a notebook analysis is ready for production:

1. Refactor the code into proper Python modules
2. Move the core functionality to the `models/` directory
3. Create training scripts in the `training/` directory
4. Update the documentation

## Resources

### Sports Science References

- Banister, E. W. (1991). Modeling Elite Athletic Performance
- Gabbett, T. J. (2016). The training-injury prevention paradox
- Mujika, I., & Padilla, S. (2003). Scientific bases for precompetition tapering strategies

### Machine Learning Resources

- Time series forecasting techniques
- Classification models for injury prediction
- Feature importance and model interpretability
