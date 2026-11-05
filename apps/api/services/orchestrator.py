import time
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from apps.api.config import settings
from apps.api.models.session import Session, Message, ToolCall, SafetyEvent
from apps.api.models.user import ChildProfile
from apps.api.models.curriculum import Activity, Skill, MasteryState
from apps.api.models.values import Mission, MissionReflection, CharacterGardenItem, ValueModule
from apps.api.services.safety_service import SafetyService
from apps.api.services.sympy_service import SymPyService
from apps.api.services.mastery_service import MasteryService
from apps.api.services.llm_provider import llm_provider

class MultiAgentOrchestrator:
    """
    Deterministic State Machine Coordinator governing Tutor, Planner, Assessor,
    Values Coach, and Safety agents.
    """
    def __init__(self, db: AsyncSession):
        self.db = db

    async def handle_turn(
        self,
        session_id: str,
        child: ChildProfile,
        user_message: str,
        image_base64: Optional[str] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        # 1. Load active session
        result = await self.db.execute(select(Session).where(Session.id == session_id))
        session = result.scalars().first()
        if not session or session.status != "ACTIVE":
            return {
                "reply": "This tutoring session has concluded. Please start a new session!",
                "agent_name": "System",
                "safety_verdict": {"is_safe": True},
                "tools_called": [],
                "is_session_ended": True
            }

        # 2. Check Global AI Kill Switch
        if settings.KILL_SWITCH_AI_ALL:
            return {
                "reply": "Ollie is currently resting for scheduled maintenance. You can practice with flashcards or review notes!",
                "agent_name": "System",
                "safety_verdict": {"is_safe": True},
                "tools_called": [],
                "is_session_ended": False
            }

        # 3. Layer 1 & 2: Input Safety Check
        safety_verdict = SafetyService.inspect_input(user_message)
        
        # Handle Crisis / Abuse escalation
        if safety_verdict.get("action") == "ESCALATE_CRISIS":
            safety_event = SafetyEvent(
                session_id=session.id,
                child_id=child.id,
                severity=safety_verdict["severity"],
                category=safety_verdict["category"],
                raw_trigger=SafetyService.redact_pii(user_message),
                sanitized_context="Crisis keyword identified in child input.",
                parent_notified=True
            )
            self.db.add(safety_event)
            
            # Record child message
            child_msg = Message(
                session_id=session.id,
                sender="CHILD",
                content=SafetyService.redact_pii(user_message),
                safety_verdict=safety_verdict
            )
            self.db.add(child_msg)
            
            # Record scripted compassionate response
            agent_msg = Message(
                session_id=session.id,
                sender="SAFETY",
                content=safety_verdict["scripted_reply"],
                agent_name="SafetyAgent",
                safety_verdict=safety_verdict
            )
            self.db.add(agent_msg)
            session.turn_count += 1
            await self.db.commit()

            return {
                "reply": safety_verdict["scripted_reply"],
                "agent_name": "SafetyAgent",
                "safety_verdict": safety_verdict,
                "tools_called": [],
                "is_session_ended": False,
                "emergency_phone": safety_verdict.get("emergency_phone")
            }

        # Handle Jailbreak attempt
        if safety_verdict.get("action") == "BLOCK_JAILBREAK":
            reply = safety_verdict["scripted_reply"]
            child_msg = Message(session_id=session.id, sender="CHILD", content=user_message, safety_verdict=safety_verdict)
            agent_msg = Message(session_id=session.id, sender="TUTOR", content=reply, agent_name="TutorAgent", safety_verdict=safety_verdict)
            self.db.add(child_msg)
            self.db.add(agent_msg)
            await self.db.commit()
            return {
                "reply": reply,
                "agent_name": "TutorAgent",
                "safety_verdict": safety_verdict,
                "tools_called": []
            }

        # Handle AI Identity inquiry
        if safety_verdict.get("action") == "HONEST_AI_IDENTITY":
            reply = safety_verdict["scripted_reply"]
            child_msg = Message(session_id=session.id, sender="CHILD", content=user_message, safety_verdict=safety_verdict)
            agent_msg = Message(session_id=session.id, sender="TUTOR", content=reply, agent_name="TutorAgent", safety_verdict=safety_verdict)
            self.db.add(child_msg)
            self.db.add(agent_msg)
            await self.db.commit()
            return {
                "reply": reply,
                "agent_name": "TutorAgent",
                "safety_verdict": safety_verdict,
                "tools_called": []
            }

        # 4. Route Turn by Session Type
        sanitized_input = safety_verdict.get("sanitized_text", user_message)
        
        # Save child message
        child_msg = Message(
            session_id=session.id,
            sender="CHILD",
            content=sanitized_input,
            safety_verdict=safety_verdict
        )
        self.db.add(child_msg)
        await self.db.flush()

        tools_called = []
        xp_earned_turn = 0

        # Construct Agent Persona Prompt based on Age Band
        age_instructions = {
            "6-8": "Keep sentences very short, enthusiastic, and playful. Use friendly animal analogies. Use no complex jargon.",
            "9-12": "Be encouraging, curious, and Socratic. Ask one guiding question at a time. Connect to cricket, games, or daily life.",
            "13-16": "Be respectful and intellectually engaging. Guide deeper conceptual reasoning. Treat them as capable young scholars."
        }.get(child.age_band, "Be warm, encouraging, and clear.")

        system_prompt = (
            f"You are Ollie the Owl, a warm and encouraging AI Tutor for {child.nickname} (Age band: {child.age_band}, Grade: {child.grade}).\n"
            f"Honest Identity Rules:\n"
            f"- You are strictly an AI tutor. You do NOT have a body, family, feelings, or childhood memories.\n"
            f"- Never claim to be the child's best friend. Encourage real-world friendships and talking with parents.\n"
            f"- Never use guilt retention words like 'I will miss you'.\n"
            f"Pedagogy Rules:\n"
            f"- Socratic method: Ask leading questions and hints; do NOT give away full answers immediately.\n"
            f"- {age_instructions}\n"
            f"- Preferred language: {child.language} (explain naturally while keeping scientific/math terms in English)."
        )

        # Call LLM Provider
        messages_history = [{"role": "user", "content": sanitized_input}]
        completion = await llm_provider.generate_completion(
            system_prompt=system_prompt,
            messages=messages_history,
            model_id=settings.TUTOR_MODEL_ID,
            temperature=0.3,
            max_tokens=settings.MAX_TOKENS_PER_TURN_9_12
        )

        candidate_reply = completion.get("text", "")
        
        # 5. Layer 3: Output Validation
        is_approved, final_reply = SafetyService.inspect_output(candidate_reply, age_band=child.age_band)

        # Update Session & Save Messages
        latency_ms = int((time.time() - start_time) * 1000)
        session.turn_count += 1
        xp_earned_turn = 10
        session.xp_earned += xp_earned_turn

        tutor_msg = Message(
            session_id=session.id,
            sender="TUTOR",
            content=final_reply,
            agent_name="TutorAgent",
            prompt_version="v1.0.0",
            model_version=completion.get("model_id"),
            safety_verdict={"is_approved": is_approved},
            latency_ms=latency_ms
        )
        self.db.add(tutor_msg)
        await self.db.commit()

        return {
            "session_id": session.id,
            "message_id": tutor_msg.id,
            "reply": final_reply,
            "agent_name": "TutorAgent",
            "safety_verdict": safety_verdict,
            "tools_called": tools_called,
            "xp_earned": xp_earned_turn,
            "is_session_ended": False
        }
