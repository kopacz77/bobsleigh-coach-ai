from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel, Field

from ...services.auth import get_current_user
from ...services.database import supabase_client
from ...models.user import User
from ...ml.models.weekly_plan_generator import WeeklyPlanGenerator
from ...ml.models.pmc_model import PMCModel
from ...services.exercise_library import get_exercise_library
from ...services.training_templates import get_phase_templates

router = APIRouter()

class GenerateWeeklyPlanRequest(BaseModel):
    athlete_id: str = Field(..., description="ID of the athlete")
    start_date: datetime = Field(..., description="Start date for the weekly plan")
    override_phase: Optional[str] = Field(None, description="Override the training phase determination")
    
class GenerateWeeklyPlanResponse(BaseModel):
    plan_id: str = Field(..., description="ID of the generated plan")
    athlete_id: str = Field(..., description="ID of the athlete")
    week_number: int = Field(..., description="Week number in the training cycle")
    start_date: datetime = Field(..., description="Start date of the plan")
    end_date: datetime = Field(..., description="End date of the plan")
    days: List[Dict[str, Any]] = Field(..., description="Daily training plans")
    metadata: Dict[str, Any] = Field(..., description="Plan metadata")

@router.post("/generate_weekly_plan", response_model=GenerateWeeklyPlanResponse)
async def generate_weekly_plan(
    request: GenerateWeeklyPlanRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate a weekly training plan for an athlete.
    
    This endpoint uses machine learning models to generate a personalized
    weekly training plan based on the athlete's historical performance,
    feedback, and current fitness level.
    """
    try:
        # Check if user has permission to generate plans for this athlete
        if not await _has_coach_permission(current_user.id, request.athlete_id):
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to generate plans for this athlete"
            )
        
        # Get athlete data
        athlete = await _get_athlete_data(request.athlete_id)
        if not athlete:
            raise HTTPException(
                status_code=404,
                detail="Athlete not found"
            )
        
        # Get upcoming competitions
        competitions = await _get_upcoming_competitions(request.athlete_id)
        competition_dates = [datetime.fromisoformat(comp['date']) for comp in competitions]
        
        # Get exercise library and phase templates
        exercise_library = get_exercise_library()
        phase_templates = get_phase_templates()
        
        # Get previous workouts (last 12 weeks)
        end_date = request.start_date
        start_date = end_date - timedelta(days=84)  # 12 weeks
        previous_workouts = await _get_previous_workouts(
            request.athlete_id, 
            start_date.isoformat(), 
            end_date.isoformat()
        )
        
        # Get athlete feedback (last 4 weeks)
        feedback_start_date = end_date - timedelta(days=28)  # 4 weeks
        athlete_feedback = await _get_athlete_feedback(
            request.athlete_id,
            feedback_start_date.isoformat(),
            end_date.isoformat()
        )
        
        # Get performance metrics
        performance_metrics = await _get_performance_metrics(request.athlete_id)
        
        # Get wellbeing data (last 7 days)
        wellbeing_start_date = end_date - timedelta(days=7)
        wellbeing_data = await _get_wellbeing_data(
            request.athlete_id,
            wellbeing_start_date.isoformat(),
            end_date.isoformat()
        )
        
        # Initialize WeeklyPlanGenerator
        plan_generator = WeeklyPlanGenerator(
            athlete_id=request.athlete_id,
            exercise_library=exercise_library,
            phase_templates=phase_templates,
            competition_dates=competition_dates
        )
        
        # Generate weekly plan
        weekly_plan = plan_generator.generate_weekly_plan(
            current_date=request.start_date,
            previous_workouts=previous_workouts,
            athlete_feedback=athlete_feedback,
            performance_metrics=performance_metrics,
            wellbeing_data=wellbeing_data
        )
        
        # Override phase if specified
        if request.override_phase:
            weekly_plan['metadata']['training_phase'] = request.override_phase
        
        # Save the generated plan
        plan_id = await _save_weekly_plan(
            athlete_id=request.athlete_id,
            coach_id=current_user.id,
            weekly_plan=weekly_plan
        )
        
        # Add plan_id to the response
        response = weekly_plan.copy()
        response['plan_id'] = plan_id
        response['athlete_id'] = request.athlete_id
        
        return response
    
    except Exception as e:
        # Log the error
        print(f"Error generating weekly plan: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate weekly plan: {str(e)}"
        )

async def _has_coach_permission(coach_id: str, athlete_id: str) -> bool:
    """Check if the coach has permission to generate plans for the athlete."""
    result = await supabase_client.table('coach_athletes').select('*').eq('coach_id', coach_id).eq('athlete_id', athlete_id).execute()
    return len(result.data) > 0

async def _get_athlete_data(athlete_id: str) -> Dict[str, Any]:
    """Get athlete data."""
    result = await supabase_client.table('athletes').select('*').eq('id', athlete_id).execute()
    return result.data[0] if result.data else None

async def _get_upcoming_competitions(athlete_id: str) -> List[Dict[str, Any]]:
    """Get upcoming competitions for the athlete."""
    today = datetime.now().date().isoformat()
    result = await supabase_client.table('competitions').select('*').eq('athlete_id', athlete_id).gte('competition_date', today).order('competition_date').execute()
    return result.data

async def _get_previous_workouts(athlete_id: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """Get previous workouts for the athlete."""
    result = await supabase_client.table('workouts').select('*').eq('athlete_id', athlete_id).gte('date', start_date).lt('date', end_date).order('date').execute()
    
    # Get exercise groups for each workout
    workouts = result.data
    for workout in workouts:
        # Get exercise groups
        groups_result = await supabase_client.table('workout_exercise_groups').select('*').eq('workout_id', workout['id']).execute()
        workout['exercise_groups'] = groups_result.data
        
        # Get exercises for each group
        for group in workout['exercise_groups']:
            exercises_result = await supabase_client.table('workout_exercises').select('*').eq('group_id', group['id']).execute()
            group['exercises'] = exercises_result.data
    
    return workouts

async def _get_athlete_feedback(athlete_id: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """Get athlete feedback on previous workouts."""
    result = await supabase_client.table('workout_feedback').select('*').eq('athlete_id', athlete_id).gte('date', start_date).lt('date', end_date).order('date').execute()
    return result.data

async def _get_performance_metrics(athlete_id: str) -> Dict[str, Any]:
    """Get performance metrics for the athlete."""
    # Get the latest metrics
    result = await supabase_client.table('performance_metrics').select('*').eq('athlete_id', athlete_id).order('date', ascending=False).limit(10).execute()
    
    # Organize by metric type
    metrics = {}
    for metric in result.data:
        metric_type = metric['metric_type']
        if metric_type not in metrics:
            metrics[metric_type] = []
        metrics[metric_type].append(metric)
    
    return metrics

async def _get_wellbeing_data(athlete_id: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """Get wellbeing assessment data for the athlete."""
    result = await supabase_client.table('wellbeing_assessments').select('*').eq('user_id', athlete_id).gte('date', start_date).lt('date', end_date).order('date').execute()
    return result.data

async def _save_weekly_plan(athlete_id: str, coach_id: str, weekly_plan: Dict[str, Any]) -> str:
    """Save the generated weekly plan to the database."""
    # Create a new training plan record
    plan_data = {
        'athlete_id': athlete_id,
        'coach_id': coach_id,
        'week_number': weekly_plan['week_number'],
        'start_date': weekly_plan['days'][0]['date'],
        'end_date': weekly_plan['days'][-1]['date'],
        'is_approved': False,
        'plan_data': weekly_plan,
        'metadata': weekly_plan['metadata']
    }
    
    result = await supabase_client.table('training_plans').insert(plan_data).execute()
    return result.data[0]['id']

@router.post("/approve_weekly_plan/{plan_id}")
async def approve_weekly_plan(
    plan_id: str,
    modifications: Optional[Dict[str, Any]] = Body(None),
    current_user: User = Depends(get_current_user)
):
    """Approve a generated weekly training plan."""
    try:
        # Get the plan
        result = await supabase_client.table('training_plans').select('*').eq('id', plan_id).execute()
        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Training plan not found"
            )
        
        plan = result.data[0]
        
        # Check if user has permission to approve plans for this athlete
        if not await _has_coach_permission(current_user.id, plan['athlete_id']):
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to approve plans for this athlete"
            )
        
        # Apply modifications if provided
        if modifications:
            plan_data = plan['plan_data']
            # Apply modifications to the plan_data
            # This would depend on the structure of modifications
            # For now, just use the provided modifications
            plan_data = modifications
        else:
            plan_data = plan['plan_data']
        
        # Update the plan
        update_data = {
            'is_approved': True,
            'approved_by': current_user.id,
            'approved_at': datetime.now().isoformat(),
            'plan_data': plan_data
        }
        
        await supabase_client.table('training_plans').update(update_data).eq('id', plan_id).execute()
        
        return {"message": "Training plan approved successfully"}
    
    except Exception as e:
        # Log the error
        print(f"Error approving weekly plan: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to approve weekly plan: {str(e)}"
        )

@router.post("/reject_weekly_plan/{plan_id}")
async def reject_weekly_plan(
    plan_id: str,
    reason: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user)
):
    """Reject a generated weekly training plan."""
    try:
        # Get the plan
        result = await supabase_client.table('training_plans').select('*').eq('id', plan_id).execute()
        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Training plan not found"
            )
        
        plan = result.data[0]
        
        # Check if user has permission to reject plans for this athlete
        if not await _has_coach_permission(current_user.id, plan['athlete_id']):
            raise HTTPException(
                status_code=403,
                detail="You don't have permission to reject plans for this athlete"
            )
        
        # Update the plan
        update_data = {
            'is_rejected': True,
            'rejected_by': current_user.id,
            'rejected_at': datetime.now().isoformat(),
            'rejection_reason': reason
        }
        
        await supabase_client.table('training_plans').update(update_data).eq('id', plan_id).execute()
        
        return {"message": "Training plan rejected successfully"}
    
    except Exception as e:
        # Log the error
        print(f"Error rejecting weekly plan: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reject weekly plan: {str(e)}"
        )