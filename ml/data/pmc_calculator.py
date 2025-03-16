"""Performance Management Chart (PMC) calculator.

This module implements the PMC calculation for athletic performance tracking.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
import matplotlib.pyplot as plt
from datetime import datetime, timedelta


def calculate_pmc(training_loads: List[float], ctl_days: int = 42, atl_days: int = 7) -> Dict[str, List[float]]:
    """Calculate PMC metrics from a series of daily training loads.

    Args:
        training_loads: List of daily training load values
        ctl_days: Days constant for CTL/fitness (default: 42)
        atl_days: Days constant for ATL/fatigue (default: 7)

    Returns:
        Dictionary containing CTL, ATL, and TSB lists
    """
    # Calculate decay constants
    ctl_decay = np.exp(-1 / ctl_days)
    atl_decay = np.exp(-1 / atl_days)
    
    ctl = [0.0] * len(training_loads)  # Chronic Training Load (fitness)
    atl = [0.0] * len(training_loads)  # Acute Training Load (fatigue)
    tsb = [0.0] * len(training_loads)  # Training Stress Balance (form)

    # Set initial values if available
    if len(training_loads) > 0:
        ctl[0] = training_loads[0]
        atl[0] = training_loads[0]
        tsb[0] = 0.0  # Initially, fitness and fatigue are equal

    # Calculate CTL, ATL, and TSB for each day
    for i in range(1, len(training_loads)):
        # CTL calculation (fitness): Yesterday's CTL * decay + today's load * (1 - decay)
        ctl[i] = ctl[i-1] * ctl_decay + training_loads[i] * (1 - ctl_decay)
        
        # ATL calculation (fatigue): Yesterday's ATL * decay + today's load * (1 - decay)
        atl[i] = atl[i-1] * atl_decay + training_loads[i] * (1 - atl_decay)
        
        # TSB calculation (form): Fitness - Fatigue
        tsb[i] = ctl[i] - atl[i]

    return {
        'ctl': ctl,
        'atl': atl,
        'tsb': tsb
    }


def calculate_load_from_rpe_and_duration(rpe: float, duration: float) -> float:
    """Calculate training load from RPE and duration.

    This uses Foster's session RPE method where Load = RPE (0-10) * Duration (minutes).

    Args:
        rpe: Rate of Perceived Exertion (0-10)
        duration: Duration of the workout in minutes

    Returns:
        Training load value
    """
    return rpe * duration


def generate_training_recommendations(ctl: float, atl: float, tsb: float) -> Dict:
    """Generate training recommendations based on PMC metrics.

    Args:
        ctl: Current CTL (fitness) value
        atl: Current ATL (fatigue) value
        tsb: Current TSB (form) value

    Returns:
        Dictionary with training recommendations
    """
    # Define recommendation thresholds
    tsb_high_threshold = 20
    tsb_low_threshold = -10
    tsb_very_low_threshold = -30
    
    # Initialize recommendations
    recommendations = {
        'status': '',
        'message': '',
        'load_adjustment': 0,
        'focus_areas': []
    }
    
    # Generate recommendations based on TSB
    if tsb > tsb_high_threshold:
        # High form (well-recovered)
        recommendations['status'] = 'Peak Form'
        recommendations['message'] = 'You are well-recovered and in peak form. Ideal time for high-intensity training or competition.'
        recommendations['load_adjustment'] = 10
        recommendations['focus_areas'] = ['High intensity', 'Race-specific', 'Technical skills']
        
    elif tsb <= tsb_high_threshold and tsb > 0:
        # Moderate form (balanced fitness/fatigue)
        recommendations['status'] = 'Good Form'
        recommendations['message'] = 'You have good form with balanced fitness and fatigue. Suitable for moderate to high training loads.'
        recommendations['load_adjustment'] = 0
        recommendations['focus_areas'] = ['Mixed intensity', 'Strength', 'Technical work']
        
    elif tsb <= 0 and tsb > tsb_low_threshold:
        # Slight fatigue
        recommendations['status'] = 'Slight Fatigue'
        recommendations['message'] = 'You are showing signs of fatigue. Consider moderate training with recovery emphasis.'
        recommendations['load_adjustment'] = -15
        recommendations['focus_areas'] = ['Technique', 'Recovery', 'Moderate volume']
        
    elif tsb <= tsb_low_threshold and tsb > tsb_very_low_threshold:
        # Significant fatigue
        recommendations['status'] = 'Significant Fatigue'
        recommendations['message'] = 'You have accumulated significant fatigue. Focus on recovery with reduced training load.'
        recommendations['load_adjustment'] = -30
        recommendations['focus_areas'] = ['Active recovery', 'Mobility', 'Low intensity']
        
    else:  # tsb <= tsb_very_low_threshold
        # Extreme fatigue (overtraining risk)
        recommendations['status'] = 'Extreme Fatigue'
        recommendations['message'] = 'Warning: You are at risk of overtraining. Prioritize recovery and significantly reduce training load.'
        recommendations['load_adjustment'] = -50
        recommendations['focus_areas'] = ['Rest', 'Recovery', 'Rehabilitation']
    
    # Add context about fitness level
    if ctl < 30:
        recommendations['fitness_status'] = 'Building base fitness'
    elif ctl < 60:
        recommendations['fitness_status'] = 'Moderate fitness level'
    elif ctl < 90:
        recommendations['fitness_status'] = 'Good fitness level'
    else:
        recommendations['fitness_status'] = 'Excellent fitness level'
        
    return recommendations


def plot_pmc(dates: List, training_loads: List[float], pmc_data: Dict) -> plt.Figure:
    """Plot the Performance Management Chart.

    Args:
        dates: List of dates corresponding to training loads
        training_loads: List of daily training load values
        pmc_data: Dictionary of pre-calculated PMC data

    Returns:
        Matplotlib figure object
    """
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10), sharex=True, gridspec_kw={'height_ratios': [1, 3]})

    # Plot daily training load
    ax1.bar(dates, training_loads, alpha=0.6, label='Daily Load')
    ax1.set_ylabel('Training Load')
    ax1.set_title('Daily Training Load')
    ax1.legend()

    # Plot PMC metrics
    ax2.plot(dates, pmc_data['ctl'], 'b-', label='CTL (Fitness)')
    ax2.plot(dates, pmc_data['atl'], 'r-', label='ATL (Fatigue)')
    ax2.plot(dates, pmc_data['tsb'], 'g-', label='TSB (Form)')
    
    # Add a horizontal line at TSB = 0
    ax2.axhline(y=0, color='k', linestyle='-', alpha=0.2)
    
    # Customize the plot
    ax2.set_ylabel('Training Load Units')
    ax2.set_xlabel('Date')
    ax2.set_title('Performance Management Chart')
    ax2.legend()
    
    # Color the TSB area
    ax2.fill_between(dates, pmc_data['tsb'], 0, 
                    where=[tsb > 0 for tsb in pmc_data['tsb']], 
                    color='green', alpha=0.1)
    ax2.fill_between(dates, pmc_data['tsb'], 0, 
                    where=[tsb <= 0 for tsb in pmc_data['tsb']], 
                    color='red', alpha=0.1)
    
    plt.tight_layout()
    return fig


def generate_mock_training_data(days: int = 90, start_date: datetime = None) -> pd.DataFrame:
    """Generate mock training data for demonstration purposes.

    Args:
        days: Number of days to generate data for
        start_date: Start date for the data (defaults to days ago from today)

    Returns:
        DataFrame with date and training load columns
    """
    if start_date is None:
        start_date = datetime.now() - timedelta(days=days)
    
    dates = [start_date + timedelta(days=i) for i in range(days)]
    
    # Generate some realistic training load values with rest days
    np.random.seed(42)  # For reproducible results
    loads = []
    for i in range(days):
        # Create a weekly pattern with rest days
        day_of_week = dates[i].weekday()
        if day_of_week == 6:  # Sunday
            load = 0  # Rest day
        elif day_of_week == 3:  # Wednesday
            load = np.random.randint(30, 60)  # Light day
        else:
            load = np.random.randint(60, 120)  # Normal training day
        loads.append(load)
    
    # Create a DataFrame
    df = pd.DataFrame({
        'date': dates,
        'training_load': loads
    })
    
    return df


def analyze_training_data(df: pd.DataFrame, ctl_days: int = 42, atl_days: int = 7) -> Tuple[pd.DataFrame, Dict]:
    """Analyze training data to calculate PMC metrics and generate recommendations.

    Args:
        df: DataFrame with date and training_load columns
        ctl_days: Days constant for CTL/fitness (default: 42)
        atl_days: Days constant for ATL/fatigue (default: 7)

    Returns:
        Tuple of (DataFrame with PMC metrics, recommendations dictionary)
    """
    # Calculate PMC metrics
    training_loads = df['training_load'].tolist()
    pmc_data = calculate_pmc(training_loads, ctl_days, atl_days)
    
    # Add PMC metrics to the DataFrame
    df['ctl'] = pmc_data['ctl']
    df['atl'] = pmc_data['atl']
    df['tsb'] = pmc_data['tsb']
    
    # Get current PMC metrics (from the last row)
    current_ctl = pmc_data['ctl'][-1]
    current_atl = pmc_data['atl'][-1]
    current_tsb = pmc_data['tsb'][-1]
    
    # Generate recommendations
    recommendations = generate_training_recommendations(current_ctl, current_atl, current_tsb)
    
    return df, recommendations


if __name__ == "__main__":
    # Generate mock data
    data = generate_mock_training_data(days=90)
    
    # Analyze the data
    analyzed_data, recommendations = analyze_training_data(data)
    
    # Print the recommendations
    print(f"Current CTL (fitness): {analyzed_data['ctl'].iloc[-1]:.1f}")
    print(f"Current ATL (fatigue): {analyzed_data['atl'].iloc[-1]:.1f}")
    print(f"Current TSB (form): {analyzed_data['tsb'].iloc[-1]:.1f}")
    print(f"Status: {recommendations['status']}")
    print(f"Recommendation: {recommendations['message']}")
    print(f"Suggested load adjustment: {recommendations['load_adjustment']}%")
    print(f"Focus areas: {', '.join(recommendations['focus_areas'])}")
    
    # Plot the PMC
    fig = plot_pmc(
        dates=analyzed_data['date'],
        training_loads=analyzed_data['training_load'],
        pmc_data={
            'ctl': analyzed_data['ctl'],
            'atl': analyzed_data['atl'],
            'tsb': analyzed_data['tsb']
        }
    )
    plt.show()
