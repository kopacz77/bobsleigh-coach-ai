"""Performance Management Chart (PMC) model.

This module implements a Performance Management Chart model for tracking
athletic fitness, fatigue, and form over time based on training load.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
import matplotlib.pyplot as plt


class PMCModel:
    """Performance Management Chart model.

    This class implements the fitness-fatigue model commonly used in endurance
    sports to track training load over time.

    Attributes:
        ctl_decay: Decay constant for Chronic Training Load (fitness)
        atl_decay: Decay constant for Acute Training Load (fatigue)
        ctl_days: Number of days for CTL time constant (typically 42)
        atl_days: Number of days for ATL time constant (typically 7)
    """

    def __init__(
        self,
        ctl_days: int = 42,
        atl_days: int = 7,
    ):
        """Initialize PMC model.

        Args:
            ctl_days: Days constant for CTL/fitness (default: 42)
            atl_days: Days constant for ATL/fatigue (default: 7)
        """
        self.ctl_days = ctl_days
        self.atl_days = atl_days
        
        # Calculate decay constants
        self.ctl_decay = np.exp(-1 / ctl_days)
        self.atl_decay = np.exp(-1 / atl_days)

    def calculate_pmc(self, training_loads: List[float]) -> Dict[str, List[float]]:
        """Calculate PMC metrics from a series of daily training loads.

        Args:
            training_loads: List of daily training load values

        Returns:
            Dictionary containing CTL, ATL, and TSB lists
        """
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
            ctl[i] = ctl[i-1] * self.ctl_decay + training_loads[i] * (1 - self.ctl_decay)
            
            # ATL calculation (fatigue): Yesterday's ATL * decay + today's load * (1 - decay)
            atl[i] = atl[i-1] * self.atl_decay + training_loads[i] * (1 - self.atl_decay)
            
            # TSB calculation (form): Fitness - Fatigue
            tsb[i] = ctl[i] - atl[i]

        return {
            'ctl': ctl,
            'atl': atl,
            'tsb': tsb
        }

    def plot_pmc(self, dates: List, training_loads: List[float], pmc_data: Optional[Dict] = None):
        """Plot the Performance Management Chart.

        Args:
            dates: List of dates corresponding to training loads
            training_loads: List of daily training load values
            pmc_data: Dictionary of pre-calculated PMC data (optional)
        """
        if pmc_data is None:
            pmc_data = self.calculate_pmc(training_loads)

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

    def get_training_recommendations(self, 
                                    current_ctl: float, 
                                    current_atl: float, 
                                    current_tsb: float) -> Dict:
        """Generate training recommendations based on PMC metrics.

        Args:
            current_ctl: Current CTL (fitness) value
            current_atl: Current ATL (fatigue) value
            current_tsb: Current TSB (form) value

        Returns:
            Dictionary with training recommendations
        """
        # Define recommendation thresholds
        tsb_high_threshold = 20
        tsb_low_threshold = -10
        tsb_very_low_threshold = -30
        
        # Calculate CTL ramp rate (rate of fitness increase)
        # Typically, we'd need historical CTL values for this
        # For now, we're using a placeholder
        ctl_ramp_rate = 5  # Placeholder
        
        # Initialize recommendations
        recommendations = {
            'status': '',
            'message': '',
            'load_adjustment': 0,
            'focus_areas': []
        }
        
        # Generate recommendations based on TSB
        if current_tsb > tsb_high_threshold:
            # High form (well-recovered)
            recommendations['status'] = 'Peak Form'
            recommendations['message'] = 'You are well-recovered and in peak form. Ideal time for high-intensity training or competition.'
            recommendations['load_adjustment'] = 10
            recommendations['focus_areas'] = ['High intensity', 'Race-specific', 'Technical skills']
            
        elif current_tsb <= tsb_high_threshold and current_tsb > 0:
            # Moderate form (balanced fitness/fatigue)
            recommendations['status'] = 'Good Form'
            recommendations['message'] = 'You have good form with balanced fitness and fatigue. Suitable for moderate to high training loads.'
            recommendations['load_adjustment'] = 0
            recommendations['focus_areas'] = ['Mixed intensity', 'Strength', 'Technical work']
            
        elif current_tsb <= 0 and current_tsb > tsb_low_threshold:
            # Slight fatigue
            recommendations['status'] = 'Slight Fatigue'
            recommendations['message'] = 'You are showing signs of fatigue. Consider moderate training with recovery emphasis.'
            recommendations['load_adjustment'] = -15
            recommendations['focus_areas'] = ['Technique', 'Recovery', 'Moderate volume']
            
        elif current_tsb <= tsb_low_threshold and current_tsb > tsb_very_low_threshold:
            # Significant fatigue
            recommendations['status'] = 'Significant Fatigue'
            recommendations['message'] = 'You have accumulated significant fatigue. Focus on recovery with reduced training load.'
            recommendations['load_adjustment'] = -30
            recommendations['focus_areas'] = ['Active recovery', 'Mobility', 'Low intensity']
            
        else:  # current_tsb <= tsb_very_low_threshold
            # Extreme fatigue (overtraining risk)
            recommendations['status'] = 'Extreme Fatigue'
            recommendations['message'] = 'Warning: You are at risk of overtraining. Prioritize recovery and significantly reduce training load.'
            recommendations['load_adjustment'] = -50
            recommendations['focus_areas'] = ['Rest', 'Recovery', 'Rehabilitation']
        
        # Add context about fitness level
        if current_ctl < 30:
            recommendations['fitness_status'] = 'Building base fitness'
        elif current_ctl < 60:
            recommendations['fitness_status'] = 'Moderate fitness level'
        elif current_ctl < 90:
            recommendations['fitness_status'] = 'Good fitness level'
        else:
            recommendations['fitness_status'] = 'Excellent fitness level'
            
        return recommendations


if __name__ == "__main__":
    # Example usage
    pmc = PMCModel()
    
    # Sample data (30 days of training)
    training_loads = [50, 0, 70, 80, 30, 0, 0, 90, 60, 40, 0, 75, 85, 20, 0, 
                     100, 110, 30, 0, 0, 90, 60, 40, 0, 75, 85, 20, 0, 120, 0]
    dates = pd.date_range(start='2025-01-01', periods=len(training_loads))
    
    # Calculate PMC metrics
    pmc_data = pmc.calculate_pmc(training_loads)
    
    # Get current metrics
    current_ctl = pmc_data['ctl'][-1]
    current_atl = pmc_data['atl'][-1]
    current_tsb = pmc_data['tsb'][-1]
    
    # Get recommendations
    recommendations = pmc.get_training_recommendations(current_ctl, current_atl, current_tsb)
    
    print(f"Current CTL (fitness): {current_ctl:.1f}")
    print(f"Current ATL (fatigue): {current_atl:.1f}")
    print(f"Current TSB (form): {current_tsb:.1f}")
    print(f"Status: {recommendations['status']}")
    print(f"Recommendation: {recommendations['message']}")
    print(f"Suggested load adjustment: {recommendations['load_adjustment']}%")
    print(f"Focus areas: {', '.join(recommendations['focus_areas'])}")
