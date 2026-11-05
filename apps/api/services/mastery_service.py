from datetime import datetime, timedelta
from typing import Dict, Any

class MasteryService:
    @staticmethod
    def update_bkt(
        p_mastery_prior: float,
        is_correct: bool,
        p_transit: float = 0.2,
        p_guess: float = 0.2,
        p_slip: float = 0.1
    ) -> float:
        """
        Updates Bayesian Knowledge Tracing posterior probability of mastery.
        """
        p_l = min(max(p_mastery_prior, 0.01), 0.99)
        
        if is_correct:
            # P(L | correct)
            num = p_l * (1.0 - p_slip)
            denom = (p_l * (1.0 - p_slip)) + ((1.0 - p_l) * p_guess)
            p_posterior = num / denom if denom > 0 else p_l
        else:
            # P(L | incorrect)
            num = p_l * p_slip
            denom = (p_l * p_slip) + ((1.0 - p_l) * (1.0 - p_guess))
            p_posterior = num / denom if denom > 0 else p_l
            
        # Transit to learned state
        p_updated = p_posterior + ((1.0 - p_posterior) * p_transit)
        return round(min(max(p_updated, 0.01), 0.99), 3)

    @staticmethod
    def calculate_next_review(
        consecutive_correct: int,
        is_correct: bool,
        current_interval_days: int = 1
    ) -> Dict[str, Any]:
        """
        Computes next spaced repetition review date using SM-2 intervals.
        """
        now = datetime.utcnow()
        if not is_correct:
            new_consecutive = 0
            new_interval = 1
        else:
            new_consecutive = consecutive_correct + 1
            if new_consecutive == 1:
                new_interval = 1
            elif new_consecutive == 2:
                new_interval = 3
            elif new_consecutive == 3:
                new_interval = 7
            else:
                new_interval = min(current_interval_days * 2, 30)

        next_due = now + timedelta(days=new_interval)
        return {
            "consecutive_correct": new_consecutive,
            "interval_days": new_interval,
            "next_review_due": next_due
        }

    @staticmethod
    def calculate_effort_xp(
        is_correct: bool,
        hints_used: int,
        time_taken_seconds: int
    ) -> int:
        """
        Calculates healthy, effort-based XP.
        Rewards persistence and genuine effort rather than high-speed clicking.
        """
        base_xp = 20
        if is_correct:
            base_xp += 15
        
        # Reward effort when hints were used productively
        if hints_used > 0 and is_correct:
            base_xp += 10  # Persistence bonus!
            
        # Reasonable engagement time bonus (e.g. spent >= 15 seconds thinking)
        if time_taken_seconds >= 15:
            base_xp += 5

        return min(base_xp, 50)
