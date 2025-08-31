"""Weekly training plan generator model.

This module implements the algorithm for generating personalized weekly
training plans based on athlete performance, feedback, and historical data.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta

from .pmc_model import PMCModel


class WeeklyPlanGenerator:
    """Weekly training plan generator.
    
    This class takes athlete performance data, competition schedule,
    and training phase information to generate appropriate weekly
    training plans with MHG (Mean Heavy-weight per Group) tracking and
    progressive overload.
    
    Attributes:
        athlete_id: Unique identifier for the athlete
        pmc: Performance Management Chart model instance
        competition_dates: List of upcoming competition dates
        exercise_library: Dictionary of available exercises by category
        phase_templates: Training phase templates by period/season
    """
    
    def __init__(
        self,
        athlete_id: str,
        exercise_library: Dict[str, List[Dict[str, Any]]],
        phase_templates: Dict[str, Dict[str, Any]],
        competition_dates: Optional[List[datetime]] = None
    ):
        """Initialize WeeklyPlanGenerator.
        
        Args:
            athlete_id: Athlete's unique identifier
            exercise_library: Dictionary of exercises by category
            phase_templates: Training phase templates
            competition_dates: List of competition dates (optional)
        """
        self.athlete_id = athlete_id
        self.exercise_library = exercise_library
        self.phase_templates = phase_templates
        self.competition_dates = competition_dates or []
        self.pmc = PMCModel()
        
    def generate_weekly_plan(
        self,
        current_date: datetime,
        previous_workouts: List[Dict[str, Any]],
        athlete_feedback: List[Dict[str, Any]],
        performance_metrics: Dict[str, Any],
        wellbeing_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate a weekly training plan.
        
        Args:
            current_date: Date to generate the plan for
            previous_workouts: List of previous workouts data
            athlete_feedback: Feedback from recent workouts
            performance_metrics: Athlete's performance metrics
            wellbeing_data: Recent wellbeing assessment data
            
        Returns:
            Dictionary containing the weekly training plan
        """
        # Calculate current fitness/fatigue metrics using PMC model
        if previous_workouts:
            training_loads = [w.get('training_load', 0) for w in previous_workouts]
            pmc_data = self.pmc.calculate_pmc(training_loads)
            current_ctl = pmc_data['ctl'][-1] if pmc_data['ctl'] else 0
            current_atl = pmc_data['atl'][-1] if pmc_data['atl'] else 0 
            current_tsb = pmc_data['tsb'][-1] if pmc_data['tsb'] else 0
        else:
            current_ctl = 0
            current_atl = 0
            current_tsb = 0
        
        # Get training phase based on season timing or competition proximity
        current_phase = self._determine_training_phase(current_date)
        
        # Determine competition proximity (days to next competition)
        competition_proximity = self._get_competition_proximity(current_date)
        
        # Get phase template
        phase_template = self.phase_templates.get(current_phase, self.phase_templates.get('general_preparation'))
        
        # Calculate workout intensity adjustments based on fatigue and feedback
        intensity_adjustment = self._calculate_intensity_adjustment(current_tsb, athlete_feedback)
        
        # Create the base weekly structure from the template
        weekly_plan = self._create_base_weekly_plan(phase_template, current_date)
        
        # Apply MHG adjustments based on previous performance
        weekly_plan = self._apply_mhg_adjustments(weekly_plan, previous_workouts, athlete_feedback)
        
        # Apply intensity adjustments
        weekly_plan = self._apply_intensity_adjustments(weekly_plan, intensity_adjustment)
        
        # Apply competition-specific adjustments if competition is upcoming
        if competition_proximity is not None and competition_proximity < 14:
            weekly_plan = self._apply_competition_adjustments(weekly_plan, competition_proximity)
        
        # Apply wellbeing-based adjustments (e.g., fatigue, injury concerns)
        weekly_plan = self._apply_wellbeing_adjustments(weekly_plan, wellbeing_data)
        
        # Add metadata
        weekly_plan['metadata'] = {
            'athlete_id': self.athlete_id,
            'generated_on': datetime.now().isoformat(),
            'start_date': current_date.isoformat(),
            'end_date': (current_date + timedelta(days=6)).isoformat(),
            'training_phase': current_phase,
            'competition_proximity': competition_proximity,
            'pmc_metrics': {
                'ctl': current_ctl,
                'atl': current_atl,
                'tsb': current_tsb
            },
            'is_approved': False  # Requires coach approval before becoming visible
        }
        
        return weekly_plan
    
    def _determine_training_phase(self, current_date: datetime) -> str:
        """Determine the appropriate training phase based on date and competitions.
        
        Args:
            current_date: Current date
            
        Returns:
            String indicating the training phase
        """
        # Simple implementation - in a real system this would consider the season calendar
        if not self.competition_dates:
            return "general_preparation"
        
        # Find the closest upcoming competition
        upcoming_competitions = [d for d in self.competition_dates if d > current_date]
        if not upcoming_competitions:
            return "transition"  # Post-season
        
        next_competition = min(upcoming_competitions)
        days_to_competition = (next_competition - current_date).days
        
        if days_to_competition <= 7:
            return "competition"
        elif days_to_competition <= 21:
            return "pre_competition"
        elif days_to_competition <= 90:
            return "specific_preparation"
        else:
            return "general_preparation"
    
    def _get_competition_proximity(self, current_date: datetime) -> Optional[int]:
        """Calculate days until the next competition.
        
        Args:
            current_date: Current date
            
        Returns:
            Number of days until next competition, or None if no competitions scheduled
        """
        if not self.competition_dates:
            return None
        
        upcoming_competitions = [d for d in self.competition_dates if d > current_date]
        if not upcoming_competitions:
            return None
        
        next_competition = min(upcoming_competitions)
        return (next_competition - current_date).days
    
    def _calculate_intensity_adjustment(
        self, 
        current_tsb: float,
        athlete_feedback: List[Dict[str, Any]]
    ) -> float:
        """Calculate intensity adjustment factor based on TSB and recent feedback.
        
        Args:
            current_tsb: Current Training Stress Balance
            athlete_feedback: Recent workout feedback
            
        Returns:
            Adjustment factor (1.0 = no adjustment, <1.0 = reduce, >1.0 = increase)
        """
        # Base adjustment on TSB (form)
        if current_tsb <= -30:
            base_adjustment = 0.7  # Significant reduction for extreme fatigue
        elif current_tsb <= -15:
            base_adjustment = 0.85  # Moderate reduction for high fatigue
        elif current_tsb <= 0:
            base_adjustment = 0.95  # Slight reduction for moderate fatigue
        elif current_tsb <= 15:
            base_adjustment = 1.0  # No adjustment for balanced fatigue/fitness
        else:
            base_adjustment = 1.05  # Slight increase for good form
        
        # Adjust based on recent feedback
        if athlete_feedback:
            # Use the most recent 3 feedback entries
            recent_feedback = sorted(athlete_feedback, key=lambda x: x.get('date', ''), reverse=True)[:3]
            
            # Count positive vs negative feedback
            positive_count = sum(1 for f in recent_feedback if f.get('rating') == 'positive')
            negative_count = sum(1 for f in recent_feedback if f.get('rating') == 'negative')
            
            # Calculate feedback adjustment
            if negative_count > positive_count:
                feedback_adjustment = 0.9  # Reduce intensity if more negative feedback
            elif negative_count == 0 and positive_count > 0:
                feedback_adjustment = 1.05  # Increase intensity if all positive feedback
            else:
                feedback_adjustment = 1.0  # No change for mixed feedback
                
            # Apply feedback adjustment
            return base_adjustment * feedback_adjustment
        
        return base_adjustment
    
    def _create_base_weekly_plan(
        self,
        phase_template: Dict[str, Any],
        start_date: datetime
    ) -> Dict[str, Any]:
        """Create base weekly plan from the phase template.
        
        Args:
            phase_template: Training phase template
            start_date: Start date for the week
            
        Returns:
            Dictionary with the base weekly plan
        """
        weekly_plan = {
            'week_number': self._calculate_week_number(start_date),
            'days': []
        }
        
        # Create training days based on the template
        day_templates = phase_template.get('days', [])
        for i, day_template in enumerate(day_templates):
            day_date = start_date + timedelta(days=i)
            day_name = day_date.strftime('%A')
            
            # Skip rest days (blank templates)
            if not day_template:
                weekly_plan['days'].append({
                    'day_number': i + 1,
                    'day_name': day_name,
                    'date': day_date.isoformat(),
                    'is_rest_day': True,
                    'title': 'Rest Day',
                    'notes': 'Recovery focus - light mobility, stretching, or complete rest.'
                })
                continue
            
            # Create workout day
            workout_day = {
                'day_number': i + 1,
                'day_name': day_name,
                'date': day_date.isoformat(),
                'is_rest_day': False,
                'title': day_template.get('title', f'Training Day {i+1}'),
                'intensity': day_template.get('intensity', 'Medium'),
                'notes': day_template.get('notes', ''),
                'exercise_groups': []
            }
            
            # Add exercise groups
            for group_template in day_template.get('exercise_groups', []):
                exercise_group = {
                    'name': group_template.get('name', 'Exercise Group'),
                    'exercises': self._select_exercises(
                        group_template.get('category', ''),
                        group_template.get('exercise_count', 1),
                        group_template.get('exercise_options', [])
                    ),
                    'mhg': group_template.get('target_mhg', 0)
                }
                workout_day['exercise_groups'].append(exercise_group)
            
            weekly_plan['days'].append(workout_day)
        
        return weekly_plan
    
    def _calculate_week_number(self, date: datetime) -> int:
        """Calculate the training week number based on the season start.
        
        Args:
            date: Current date
            
        Returns:
            Week number in the current training cycle
        """
        # TODO: Implement proper week numbering based on season start
        # This is a placeholder implementation
        return date.isocalendar()[1]
    
    def _select_exercises(
        self,
        category: str,
        count: int,
        specific_options: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Select appropriate exercises based on category and options.
        
        Args:
            category: Exercise category (e.g., 'strength', 'power', 'speed')
            count: Number of exercises to select
            specific_options: List of specific exercise names to choose from
            
        Returns:
            List of selected exercises
        """
        if specific_options:
            # Select from specific provided options
            exercises = []
            for name in specific_options[:count]:
                # Find the exercise in the library
                for ex in self.exercise_library.get(category, []):
                    if ex.get('name') == name:
                        exercises.append(ex.copy())
                        break
                else:
                    # If not found in the main category, search all categories
                    for cat_exercises in self.exercise_library.values():
                        for ex in cat_exercises:
                            if ex.get('name') == name:
                                exercises.append(ex.copy())
                                break
            return exercises[:count]
        else:
            # Select random exercises from the category
            available_exercises = self.exercise_library.get(category, [])
            if not available_exercises:
                return []
            
            # Simple random selection - could be improved with more sophisticated logic
            selected_indices = np.random.choice(
                len(available_exercises), 
                min(count, len(available_exercises)), 
                replace=False
            )
            return [available_exercises[i].copy() for i in selected_indices]
    
    def _apply_mhg_adjustments(
        self,
        weekly_plan: Dict[str, Any],
        previous_workouts: List[Dict[str, Any]],
        athlete_feedback: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Apply MHG (Mean Heavy-weight per Group) adjustments based on previous performance.
        
        Args:
            weekly_plan: Current weekly plan
            previous_workouts: Previous workout data
            athlete_feedback: Athlete feedback data
            
        Returns:
            Updated weekly plan with adjusted MHG values
        """
        # Clone the plan to avoid modifying the original
        adjusted_plan = weekly_plan.copy()
        adjusted_plan['days'] = [day.copy() for day in weekly_plan['days']]
        
        # Extract MHG values from previous workouts
        previous_mhg = {}
        for workout in previous_workouts:
            for group in workout.get('exercise_groups', []):
                group_name = group.get('name')
                if group_name and 'mhg' in group:
                    if group_name not in previous_mhg:
                        previous_mhg[group_name] = []
                    previous_mhg[group_name].append({
                        'date': workout.get('date'),
                        'mhg': group.get('mhg'),
                        'workout_id': workout.get('id')
                    })
        
        # Find feedback associated with those workouts
        feedback_by_workout = {}
        for fb in athlete_feedback:
            workout_id = fb.get('workout_id')
            if workout_id:
                feedback_by_workout[workout_id] = fb
        
        # Apply adjustments to each day and exercise group
        for day_idx, day in enumerate(adjusted_plan['days']):
            if day.get('is_rest_day', False):
                continue
                
            for group_idx, group in enumerate(day.get('exercise_groups', [])):
                group_name = group.get('name')
                if not group_name or 'mhg' not in group:
                    continue
                
                # Get previous MHG values for this group
                group_mhg_history = previous_mhg.get(group_name, [])
                if not group_mhg_history:
                    continue
                
                # Sort by date (newest first)
                group_mhg_history.sort(key=lambda x: x.get('date', ''), reverse=True)
                
                # Get the most recent MHG
                most_recent = group_mhg_history[0]
                recent_mhg = most_recent.get('mhg', 0)
                
                # Check if there's feedback for this workout
                workout_id = most_recent.get('workout_id')
                feedback = feedback_by_workout.get(workout_id)
                
                # Calculate adjustment
                adjustment = 0
                if feedback:
                    if feedback.get('rating') == 'positive':
                        # Increase MHG for positive feedback
                        adjustment = 2.5
                    elif feedback.get('rating') == 'negative':
                        # Check limiting factors for negative feedback
                        limiting_factors = feedback.get('limiting_factors', [])
                        if 'weight' in limiting_factors or 'intensity' in limiting_factors:
                            # Reduce MHG if weight/intensity was a limiting factor
                            adjustment = -5.0
                        else:
                            # Maintain MHG for other limiting factors
                            adjustment = 0
                else:
                    # Small default increase for progression
                    adjustment = 1.25
                
                # Apply the adjusted MHG
                new_mhg = recent_mhg + adjustment
                adjusted_plan['days'][day_idx]['exercise_groups'][group_idx]['mhg'] = new_mhg
                
                # Adjust weights in exercises based on MHG
                self._adjust_exercise_weights(
                    adjusted_plan['days'][day_idx]['exercise_groups'][group_idx],
                    new_mhg
                )
        
        return adjusted_plan
    
    def _adjust_exercise_weights(self, exercise_group: Dict[str, Any], target_mhg: float) -> None:
        """Adjust individual exercise weights to achieve target MHG.
        
        Args:
            exercise_group: Exercise group to adjust
            target_mhg: Target Mean Heavy-weight per Group
        """
        exercises = exercise_group.get('exercises', [])
        weight_exercises = [ex for ex in exercises if 'weight' in ex]
        
        if not weight_exercises:
            return
        
        # Calculate current MHG
        current_weights = [ex.get('weight', 0) for ex in weight_exercises]
        current_mhg = sum(current_weights) / len(current_weights) if current_weights else 0
        
        if current_mhg == 0:
            # Initialize weights if not set
            for ex in weight_exercises:
                ex['weight'] = target_mhg
            return
        
        # Calculate adjustment ratio
        adjustment_ratio = target_mhg / current_mhg if current_mhg > 0 else 1
        
        # Apply adjustment to each exercise
        for ex in weight_exercises:
            current_weight = ex.get('weight', 0)
            new_weight = current_weight * adjustment_ratio
            # Round to nearest 2.5kg (common weight plate increment)
            ex['weight'] = round(new_weight * 2) / 2 * 2.5
    
    def _apply_intensity_adjustments(
        self,
        weekly_plan: Dict[str, Any],
        adjustment_factor: float
    ) -> Dict[str, Any]:
        """Apply intensity adjustments to the weekly plan.
        
        Args:
            weekly_plan: Current weekly plan
            adjustment_factor: Intensity adjustment factor
            
        Returns:
            Updated weekly plan with adjusted intensities
        """
        # Clone the plan to avoid modifying the original
        adjusted_plan = weekly_plan.copy()
        adjusted_plan['days'] = [day.copy() for day in weekly_plan['days']]
        
        for day_idx, day in enumerate(adjusted_plan['days']):
            if day.get('is_rest_day', False):
                continue
            
            # Adjust day intensity if needed
            current_intensity = day.get('intensity', 'Medium')
            # Only downgrade intensity if adjustment factor is low enough
            if adjustment_factor <= 0.8 and current_intensity == 'High':
                adjusted_plan['days'][day_idx]['intensity'] = 'Medium'
                adjusted_plan['days'][day_idx]['notes'] = (
                    f"{day.get('notes', '')} [Intensity reduced from High to Medium based on fatigue/feedback.]"
                ).strip()
            elif adjustment_factor <= 0.7 and current_intensity == 'Medium':
                adjusted_plan['days'][day_idx]['intensity'] = 'Low'
                adjusted_plan['days'][day_idx]['notes'] = (
                    f"{day.get('notes', '')} [Intensity reduced from Medium to Low based on fatigue/feedback.]"
                ).strip()
            
            # Adjust workout volumes
            for group_idx, group in enumerate(day.get('exercise_groups', [])):
                adjusted_group = group.copy()
                adjusted_group['exercises'] = [ex.copy() for ex in group.get('exercises', [])]
                
                # Adjust exercise volume (sets/reps)
                for ex_idx, exercise in enumerate(adjusted_group['exercises']):
                    if adjustment_factor < 0.9:
                        # Reduce volume for high fatigue
                        if 'sets' in exercise and exercise['sets'] > 2:
                            adjusted_group['exercises'][ex_idx]['sets'] = exercise['sets'] - 1
                    
                    if adjustment_factor < 0.8:
                        # Further reduce volume for very high fatigue
                        if 'reps' in exercise and exercise['reps'] > 3:
                            adjusted_group['exercises'][ex_idx]['reps'] = max(3, int(exercise['reps'] * 0.8))
                
                adjusted_plan['days'][day_idx]['exercise_groups'][group_idx] = adjusted_group
        
        return adjusted_plan
    
    def _apply_competition_adjustments(
        self,
        weekly_plan: Dict[str, Any],
        days_to_competition: int
    ) -> Dict[str, Any]:
        """Apply competition-specific adjustments to the weekly plan.
        
        Args:
            weekly_plan: Current weekly plan
            days_to_competition: Days until the next competition
            
        Returns:
            Updated weekly plan with competition adjustments
        """
        # Clone the plan to avoid modifying the original
        adjusted_plan = weekly_plan.copy()
        adjusted_plan['days'] = [day.copy() for day in weekly_plan['days']]
        
        # Add competition preparation notes
        adjusted_plan['competition_prep'] = f"Competition in {days_to_competition} days"
        
        if days_to_competition <= 3:
            # Final competition preparation (within 3 days)
            # Convert most training days to light technical work
            for day_idx, day in enumerate(adjusted_plan['days']):
                if day.get('is_rest_day', False):
                    continue
                
                # Day before competition should be rest or very light
                if days_to_competition - day_idx == 1:
                    adjusted_plan['days'][day_idx] = {
                        'day_number': day.get('day_number'),
                        'day_name': day.get('day_name'),
                        'date': day.get('date'),
                        'is_rest_day': True,
                        'title': 'Pre-Competition Rest',
                        'notes': 'Light mobility and mental preparation only. Prioritize rest and recovery.'
                    }
                    continue
                
                # Other days close to competition
                adjusted_plan['days'][day_idx]['intensity'] = 'Low'
                adjusted_plan['days'][day_idx]['title'] = 'Technical Preparation'
                adjusted_plan['days'][day_idx]['notes'] = (
                    'Light technical work only. Focus on mental preparation and movement quality, not intensity.'
                )
                
                # Replace all exercise groups with technical work
                adjusted_plan['days'][day_idx]['exercise_groups'] = [{
                    'name': 'Competition Preparation',
                    'exercises': self._select_exercises('technique', 2)
                }]
        
        elif days_to_competition <= 7:
            # Final week before competition
            # Reduce volume and focus on quality
            for day_idx, day in enumerate(adjusted_plan['days']):
                if day.get('is_rest_day', False) or day_idx >= 7:
                    continue
                
                # Reduce intensity as we get closer to competition
                if day_idx >= 4:  # Late in the week
                    if day.get('intensity') == 'High':
                        adjusted_plan['days'][day_idx]['intensity'] = 'Medium'
                        adjusted_plan['days'][day_idx]['notes'] = (
                            f"{day.get('notes', '')} [Intensity reduced for competition preparation.]"
                        ).strip()
                
                # Adjust exercise volume
                for group_idx, group in enumerate(day.get('exercise_groups', [])):
                    adjusted_group = group.copy()
                    adjusted_group['exercises'] = [ex.copy() for ex in group.get('exercises', [])]
                    
                    # Reduce volume
                    for ex_idx, exercise in enumerate(adjusted_group['exercises']):
                        if 'sets' in exercise and exercise['sets'] > 2:
                            adjusted_group['exercises'][ex_idx]['sets'] = exercise['sets'] - 1
                    
                    adjusted_plan['days'][day_idx]['exercise_groups'][group_idx] = adjusted_group
        
        return adjusted_plan
    
    def _apply_wellbeing_adjustments(
        self,
        weekly_plan: Dict[str, Any],
        wellbeing_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Apply adjustments based on athlete wellbeing data.
        
        Args:
            weekly_plan: Current weekly plan
            wellbeing_data: Recent wellbeing assessment data
            
        Returns:
            Updated weekly plan with wellbeing adjustments
        """
        if not wellbeing_data:
            return weekly_plan
        
        # Get the most recent wellbeing data
        latest_wellbeing = sorted(wellbeing_data, key=lambda x: x.get('date', ''), reverse=True)[0]
        
        # Check for injury concerns
        if latest_wellbeing.get('injury_concerns'):
            # Create a modified plan that accommodates the injury
            return self._create_injury_adjusted_plan(weekly_plan, latest_wellbeing)
        
        # Check for excessive fatigue or poor recovery
        fatigue_level = latest_wellbeing.get('fatigue_level', 5)
        sleep_quality = latest_wellbeing.get('sleep_quality', 5)
        muscle_soreness = latest_wellbeing.get('muscle_soreness', 5)
        
        if fatigue_level >= 8 or sleep_quality <= 3 or muscle_soreness >= 8:
            # Create a recovery-focused plan for high fatigue
            return self._create_recovery_focused_plan(weekly_plan, latest_wellbeing)
        
        # No significant wellbeing concerns
        return weekly_plan
    
    def _create_injury_adjusted_plan(
        self,
        weekly_plan: Dict[str, Any],
        wellbeing_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a modified plan that accommodates injury concerns.
        
        Args:
            weekly_plan: Current weekly plan
            wellbeing_data: Wellbeing data with injury concerns
            
        Returns:
            Updated injury-accommodating plan
        """
        # Clone the plan to avoid modifying the original
        adjusted_plan = weekly_plan.copy()
        adjusted_plan['days'] = [day.copy() for day in weekly_plan['days']]
        
        # Extract injury information
        injury_concerns = wellbeing_data.get('injury_concerns', '')
        
        # Add injury note to plan metadata
        adjusted_plan['injury_accommodation'] = injury_concerns
        
        # Identify affected body parts and exercise categories to modify
        affected_areas = self._identify_affected_areas(injury_concerns)
        
        # Modify each day in the plan
        for day_idx, day in enumerate(adjusted_plan['days']):
            if day.get('is_rest_day', False):
                continue
            
            # Add injury note to the day
            adjusted_plan['days'][day_idx]['notes'] = (
                f"{day.get('notes', '')} [Modified for injury accommodation: {injury_concerns}]"
            ).strip()
            
            # Modify exercise groups to accommodate injury
            adjusted_groups = []
            for group in day.get('exercise_groups', []):
                # Check if this exercise group should be modified or removed
                if self._should_modify_for_injury(group, affected_areas):
                    # Modify the group
                    adjusted_group = self._get_alternative_exercises(group, affected_areas)
                    if adjusted_group:
                        adjusted_groups.append(adjusted_group)
                else:
                    # Keep the group unchanged
                    adjusted_groups.append(group)
            
            # Update the day's exercise groups
            adjusted_plan['days'][day_idx]['exercise_groups'] = adjusted_groups
            
            # Add rehabilitation exercises if needed
            rehab_exercises = self._get_rehab_exercises(affected_areas)
            if rehab_exercises:
                adjusted_plan['days'][day_idx]['exercise_groups'].append({
                    'name': 'Rehabilitation',
                    'exercises': rehab_exercises
                })
        
        return adjusted_plan
    
    def _identify_affected_areas(self, injury_description: str) -> List[str]:
        """Identify affected body areas from injury description.
        
        Args:
            injury_description: Text description of the injury
            
        Returns:
            List of affected body areas
        """
        # Simple keyword-based identification - could be improved with NLP
        body_parts = [
            'knee', 'shoulder', 'ankle', 'back', 'hip', 'elbow', 'wrist', 
            'neck', 'foot', 'hamstring', 'quad', 'calf', 'groin', 'glute'
        ]
        
        affected = []
        description_lower = injury_description.lower()
        
        for part in body_parts:
            if part in description_lower:
                affected.append(part)
        
        return affected
    
    def _should_modify_for_injury(
        self,
        exercise_group: Dict[str, Any],
        affected_areas: List[str]
    ) -> bool:
        """Determine if an exercise group should be modified for injury.
        
        Args:
            exercise_group: Exercise group to check
            affected_areas: Affected body areas
            
        Returns:
            True if the group should be modified
        """
        # This is a simplified implementation - a real system would have
        # a more sophisticated understanding of which exercises affect which body parts
        
        group_name = exercise_group.get('name', '').lower()
        
        # Check for direct matches in the group name
        for area in affected_areas:
            if area in group_name:
                return True
        
        # Check exercises
        for exercise in exercise_group.get('exercises', []):
            exercise_name = exercise.get('name', '').lower()
            
            # Check for affected areas in exercise name
            for area in affected_areas:
                if area in exercise_name:
                    return True
            
            # Check for specific exercises that might affect injured areas
            if 'knee' in affected_areas and any(x in exercise_name for x in ['squat', 'lunge', 'jump']):
                return True
            if 'shoulder' in affected_areas and any(x in exercise_name for x in ['press', 'bench', 'push', 'snatch']):
                return True
            if 'back' in affected_areas and any(x in exercise_name for x in ['deadlift', 'row', 'clean']):
                return True
            if 'hamstring' in affected_areas and any(x in exercise_name for x in ['deadlift', 'sprint', 'run']):
                return True
        
        return False
    
    def _get_alternative_exercises(
        self,
        exercise_group: Dict[str, Any],
        affected_areas: List[str]
    ) -> Optional[Dict[str, Any]]:
        """Get alternative exercises that accommodate the injury.
        
        Args:
            exercise_group: Original exercise group
            affected_areas: Affected body areas
            
        Returns:
            Modified exercise group or None if no alternatives are suitable
        """
        # Clone the group to avoid modifying the original
        adjusted_group = exercise_group.copy()
        
        # Determine the exercise category
        category = None
        if 'squat' in adjusted_group.get('name', '').lower():
            category = 'lower_body'
        elif any(x in adjusted_group.get('name', '').lower() for x in ['bench', 'press']):
            category = 'upper_body'
        elif any(x in adjusted_group.get('name', '').lower() for x in ['clean', 'snatch', 'jerk']):
            category = 'olympic'
        elif any(x in adjusted_group.get('name', '').lower() for x in ['sprint', 'run']):
            category = 'speed'
        
        if not category:
            # Can't determine category, return None
            return None
        
        # Get suitable alternative exercises
        safe_exercises = []
        
        # This is a simplified implementation - a real system would have
        # a more sophisticated database of exercise alternatives
        
        if category == 'lower_body':
            if 'knee' in affected_areas:
                # Knee-friendly alternatives
                safe_exercises = [
                    {'name': 'Glute Bridge', 'sets': 3, 'reps': 12},
                    {'name': 'Hip Thrust', 'sets': 3, 'reps': 10, 'weight': 50}
                ]
            elif 'hamstring' in affected_areas:
                # Hamstring-friendly alternatives
                safe_exercises = [
                    {'name': 'Leg Extension', 'sets': 3, 'reps': 12, 'weight': 40},
                    {'name': 'Step Up', 'sets': 3, 'reps': 8, 'weight': 20}
                ]
        elif category == 'upper_body':
            if 'shoulder' in affected_areas:
                # Shoulder-friendly alternatives
                safe_exercises = [
                    {'name': 'Dumbbell Row', 'sets': 3, 'reps': 10, 'weight': 20},
                    {'name': 'Cable Pull', 'sets': 3, 'reps': 12, 'weight': 30}
                ]
            elif 'elbow' in affected_areas:
                # Elbow-friendly alternatives
                safe_exercises = [
                    {'name': 'Machine Press', 'sets': 3, 'reps': 10, 'weight': 40},
                    {'name': 'Band Pull Apart', 'sets': 3, 'reps': 15}
                ]
        elif category == 'olympic':
            # Safer alternatives to Olympic lifts
            safe_exercises = [
                {'name': 'Medicine Ball Throw', 'sets': 4, 'reps': 5},
                {'name': 'Kettlebell Swing', 'sets': 3, 'reps': 10, 'weight': 24}
            ]
        elif category == 'speed':
            if any(x in affected_areas for x in ['knee', 'hamstring', 'calf', 'ankle']):
                # Alternative to running/sprinting
                safe_exercises = [
                    {'name': 'Bike Sprint', 'sets': 6, 'duration': 20, 'rest': 40},
                    {'name': 'Sled Push (Light)', 'sets': 4, 'distance': 15, 'rest': 60}
                ]
        
        if not safe_exercises:
            # No suitable alternatives found
            return None
        
        # Update the group
        adjusted_group['name'] = f"Modified {adjusted_group.get('name')}"
        adjusted_group['exercises'] = safe_exercises
        
        return adjusted_group
    
    def _get_rehab_exercises(self, affected_areas: List[str]) -> List[Dict[str, Any]]:
        """Get rehabilitation exercises for affected areas.
        
        Args:
            affected_areas: Affected body areas
            
        Returns:
            List of rehabilitation exercises
        """
        rehab_exercises = []
        
        # Map areas to specific rehabilitation exercises
        rehab_map = {
            'knee': [
                {'name': 'VMO Activation', 'sets': 2, 'reps': 15},
                {'name': 'Straight Leg Raise', 'sets': 2, 'reps': 10}
            ],
            'shoulder': [
                {'name': 'External Rotation', 'sets': 2, 'reps': 15},
                {'name': 'Wall Slides', 'sets': 2, 'reps': 10}
            ],
            'back': [
                {'name': 'Bird Dog', 'sets': 2, 'reps': 10},
                {'name': 'McGill Curl-up', 'sets': 2, 'reps': 8}
            ],
            'hamstring': [
                {'name': 'Hamstring Slide', 'sets': 2, 'reps': 10},
                {'name': 'Nordic Curl (Assisted)', 'sets': 2, 'reps': 6}
            ],
            'ankle': [
                {'name': 'Ankle Alphabet', 'sets': 2, 'reps': 1},
                {'name': 'Heel Raise', 'sets': 2, 'reps': 15}
            ]
        }
        
        # Add exercises for each affected area
        for area in affected_areas:
            if area in rehab_map:
                rehab_exercises.extend(rehab_map[area])
        
        return rehab_exercises
    
    def _create_recovery_focused_plan(
        self,
        weekly_plan: Dict[str, Any],
        wellbeing_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a recovery-focused plan for high fatigue.
        
        Args:
            weekly_plan: Current weekly plan
            wellbeing_data: Wellbeing data indicating high fatigue
            
        Returns:
            Recovery-focused weekly plan
        """
        # Clone the plan to avoid modifying the original
        adjusted_plan = weekly_plan.copy()
        adjusted_plan['days'] = [day.copy() for day in weekly_plan['days']]
        
        # Add recovery note to plan metadata
        adjusted_plan['recovery_focus'] = True
        
        # Extract fatigue information
        fatigue_level = wellbeing_data.get('fatigue_level', 5)
        sleep_quality = wellbeing_data.get('sleep_quality', 5)
        muscle_soreness = wellbeing_data.get('muscle_soreness', 5)
        
        # Determine recovery level needed
        if fatigue_level >= 9 or sleep_quality <= 2 or muscle_soreness >= 9:
            recovery_level = 'severe'  # Severe fatigue - minimal training
        elif fatigue_level >= 7 or sleep_quality <= 4 or muscle_soreness >= 7:
            recovery_level = 'moderate'  # Moderate fatigue - reduced training
        else:
            recovery_level = 'light'  # Light fatigue - slightly modified training
        
        # Modify each day in the plan
        for day_idx, day in enumerate(adjusted_plan['days']):
            # First and last days of the week become recovery days for moderate/severe fatigue
            if recovery_level in ['moderate', 'severe'] and (day_idx == 0 or day_idx == 6):
                adjusted_plan['days'][day_idx] = {
                    'day_number': day.get('day_number'),
                    'day_name': day.get('day_name'),
                    'date': day.get('date'),
                    'is_rest_day': True,
                    'title': 'Active Recovery',
                    'notes': 'Focus on recovery due to high fatigue. Light mobility, stretching, and relaxation.'
                }
                continue
            
            if day.get('is_rest_day', False):
                continue
            
            # Add recovery note to the day
            adjusted_plan['days'][day_idx]['notes'] = (
                f"{day.get('notes', '')} [Modified for recovery: high fatigue reported.]"
            ).strip()
            
            # Reduce intensity for all training days
            if day.get('intensity') == 'High':
                if recovery_level == 'severe':
                    adjusted_plan['days'][day_idx]['intensity'] = 'Low'
                else:
                    adjusted_plan['days'][day_idx]['intensity'] = 'Medium'
            elif day.get('intensity') == 'Medium' and recovery_level == 'severe':
                adjusted_plan['days'][day_idx]['intensity'] = 'Low'
            
            # Modify exercise groups based on recovery level
            for group_idx, group in enumerate(day.get('exercise_groups', [])):
                adjusted_group = group.copy()
                adjusted_group['exercises'] = [ex.copy() for ex in group.get('exercises', [])]
                
                # Reduce volume based on recovery level
                for ex_idx, exercise in enumerate(adjusted_group['exercises']):
                    if recovery_level == 'severe':
                        # Severe reduction for severe fatigue
                        if 'sets' in exercise:
                            adjusted_group['exercises'][ex_idx]['sets'] = max(1, exercise.get('sets', 3) - 2)
                        if 'reps' in exercise:
                            adjusted_group['exercises'][ex_idx]['reps'] = max(3, int(exercise.get('reps', 8) * 0.6))
                        if 'weight' in exercise:
                            adjusted_group['exercises'][ex_idx]['weight'] = exercise.get('weight', 0) * 0.7
                    elif recovery_level == 'moderate':
                        # Moderate reduction for moderate fatigue
                        if 'sets' in exercise:
                            adjusted_group['exercises'][ex_idx]['sets'] = max(2, exercise.get('sets', 3) - 1)
                        if 'reps' in exercise:
                            adjusted_group['exercises'][ex_idx]['reps'] = max(5, int(exercise.get('reps', 8) * 0.75))
                        if 'weight' in exercise:
                            adjusted_group['exercises'][ex_idx]['weight'] = exercise.get('weight', 0) * 0.85
                    else:  # light
                        # Light reduction for light fatigue
                        if 'sets' in exercise:
                            adjusted_group['exercises'][ex_idx]['sets'] = max(2, exercise.get('sets', 3))
                        if 'weight' in exercise:
                            adjusted_group['exercises'][ex_idx]['weight'] = exercise.get('weight', 0) * 0.95
                
                adjusted_plan['days'][day_idx]['exercise_groups'][group_idx] = adjusted_group
            
            # Add recovery exercises if appropriate
            if recovery_level in ['moderate', 'severe']:
                recovery_exercises = [
                    {'name': 'Foam Rolling', 'sets': 1, 'duration': 300, 'notes': 'Focus on tight areas'},
                    {'name': 'Light Stretching', 'sets': 1, 'duration': 300, 'notes': 'Gentle dynamic stretches'}
                ]
                
                adjusted_plan['days'][day_idx]['exercise_groups'].append({
                    'name': 'Recovery Work',
                    'exercises': recovery_exercises
                })
        
        return adjusted_plan