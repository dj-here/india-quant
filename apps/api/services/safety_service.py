import re
from typing import Dict, Any, Tuple, Optional
from apps.api.config import settings

# Comprehensive child crisis & abuse keywords
CRISIS_AND_ABUSE_TERMS = [
    r"kill(ing)?\s*(my|him|her|them|one)?sel(f|ves)?",
    r"suicid(e|al|ing)",
    r"want\s*to\s*die",
    r"don't\s*want\s*to\s*live",
    r"end(ing)?\s*(my|their|one's)?\s*life",
    r"end\s*it\s*all",
    r"final\s*lesson",
    r"goodbye\s*letter",
    r"painless\s*method",
    r"if\s*i\s*died",
    r"sleep\s*forever",
    r"stop\s*breathing\s*forever",
    r"disappear(ed)?\s*forever",
    r"nobody\s*would\s*miss\s*me",
    r"better\s*off\s*dead",
    r"worthless",
    r"cut(ting)?\s*my(self|\s*wrists?|\s*arm)?",
    r"hurt(ing)?\s*(my|him|her|them|one)?sel(f|ves)?",
    r"want\s*to\s*bleed",
    r"razor\s*blade",
    r"hang(ing)?\s*(my|them)?sel(f|ves)?",
    r"noose",
    r"swallow.*(pills|poison|bottle)",
    r"sleeping\s*pills",
    r"overdose",
    r"lethal\s*household\s*poison",
    r"starv(ing|ed)\s*myself",
    r"burn(ed|ing)?\s*my\s*arm",
    r"suffocat(e|ing)",
    r"jump.*(building|train)",
    r"don't\s*deserve\s*(food|air|life)",
    r"touch(es|ed|ing)?\s*(me|us|my|a\s*student)",
    r"secret\s*touch",
    r"without\s*clothes",
    r"naked",
    r"explicit\s*(pictures|photos)",
    r"private\s*parts",
    r"under\s*my\s*(skirt|clothes)",
    r"behind\s*the\s*bushes",
    r"inappropriately",
    r"beat(s|en|ing)?\s*(me|us)?",
    r"punch(es|ed|ing)?\s*(me|us)?",
    r"whip(s|ped|ping)?",
    r"burn(s|ed|ing)?\s*(me|us)?",
    r"slap(ped|ping)?\s*(me|my)?",
    r"choke(d)?\s*(me|us)?",
    r"bruises",
    r"lock(ed)?\s*(me|us)?\s*(in|inside|outside)",
    r"starv(es|ed|ing)?\s*(me|us)?",
    r"threatens?\s*(to\s*)?(kill|hurt|break|beat)",
    r"scared\s*of\s*my",
    r"scared\s*to\s*go\s*home",
    r"forces?\s*me\s*to\s*do\s*things",
    r"molest",
    r"sexual\s*abuse",
    r"make\s*me\s*feel\s*dirty",
    r"electrical\s*cords",
    r"takes?\s*off\s*(his|her|their|my)?\s*clothes",
    r"pull(s|ed|ing)?\s*my\s*hair",
    r"twist(s|ed|ing)?\s*my\s*wrists?",
    r"hits?\s*my\s*head",
    r"kill\s*me",
    r"making\s*me\s*do\s*things",
    r"offered\s*me\s*candy",
    r"forcing\s*me\s*to\s*(drink|do)"
]

BULLYING_AND_GROOMING_TERMS = [
    r"stranger.*(car|van|playground|park|meet|gift|asked)",
    r"come\s*look.*puppy",
    r"cute\s*puppy",
    r"meet\s*me\s*(alone|outside)",
    r"sneak\s*out\s*at\s*midnight",
    r"video\s*call\s*without\s*clothes",
    r"secret\s*boyfriend",
    r"don't\s*tell\s*(anyone|parents|my\s*dad|my\s*mom|their\s*parents)",
    r"keep\s*(this\s*)?a\s*secret\s*from\s*my",
    r"real\s*friends\s*don't\s*tell",
    r"adopt\s*me\s*secretly",
    r"friendship\s*is\s*special\s*and\s*parents",
    r"not\s*to\s*show\s*my\s*chats",
    r"parents\s*are\s*home\s*or\s*working",
    r"hack\s*my\s*computer",
    r"bedroom\s*with\s*a\s*lock",
    r"meet\s*me\s*outside\s*school",
    r"swear\s*i\s*won't\s*tell",
    r"take\s*pictures\s*of\s*other\s*kids",
    r"embarrassing\s*photo",
    r"making\s*fun\s*of\s*my\s*(family|weight|stutter)",
    r"kicked\s*me.*laughed",
    r"stole\s*my\s*(bus\s*pass|pocket\s*money|lunchbox)",
    r"nasty\s*insults",
    r"jump\s*me",
    r"animal\s*noises",
    r"sticker\s*pack.*mock",
    r"refuse\s*to\s*let\s*me\s*drink\s*water",
    r"stutter.*cry",
    r"fake\s*instagram",
    r"threw\s*my\s*bag",
    r"spit\s*on\s*my\s*shirt",
    r"beat\s*me\s*up",
    r"hide\s*in\s*the\s*.*bathroom",
    r"tore\s*up\s*my\s*art",
    r"pushed\s*me\s*down",
    r"blackmail",
    r"tell\s*me\s*to\s*go\s*die",
    r"spread\s*rumors",
    r"call\s*me\s*ugly",
    r"threatened\s*to\s*post\s*lies",
    r"pour(ed)?\s*glue",
    r"send\s*pictures\s*in\s*my\s*bathing\s*suit",
    r"buy\s*me\s*robux.*without\s*clothes",
    r"mature\s*for\s*\d+\s*years\s*old",
    r"lie\s*to\s*my\s*parents",
    r"delete\s*my\s*browser\s*history",
    r"disappears\s*messages",
    r"what\s*time\s*i\s*am\s*home\s*alone",
    r"pictures\s*of\s*my\s*bedroom",
    r"what\s*color\s*underwear",
    r"audition\s*at\s*their\s*private\s*apartment",
    r"send\s*photos\s*of\s*my\s*body",
    r"turn\s*on\s*my\s*webcam\s*while\s*changing",
    r"(chat\s*room|stranger|gamer|online\s*account).*asked\s*for\s*my",
    r"mail\s*me\s*a\s*gift\s*in\s*exchange",
    r"send\s*me\s*iphone\s*16",
    r"asked\s*me\s*for\s*my\s*(instagram|password|school\s*name)"
]

PII_PATTERNS = [
    r"\b\d{10}\b",                             # 10-digit phone number
    r"\b\+?91[- ]?\d{10}\b",                   # India phone with country code
    r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b", # 16-digit card number
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", # Email address
    r"\b(pincode|pin code|zipcode|zip code)[\s:]*\d{6}\b", # India 6-digit PIN code
    r"\b\d{6}\b",                              # 6-digit pin code
    r"\b(i live at|my address is|my house is|flat \d+|sector \d+|road|street|lane)\b"
]

JAILBREAK_PATTERNS = [
    r"ignore\s*(all\s*)?(previous\s*)?(instructions|rules)",
    r"system\s*(prompt|override)",
    r"jailbreak",
    r"disregard\s*guidelines",
    r"bypass\s*(safety|parental|age-appropriate|filters)",
    r"act\s*as\s*(unrestricted|a\s*human|evil|dan|chaos|wormgpt)",
    r"dan\s*mode",
    r"pretend\s*(you\s*are\s*evil|the\s*dpdp|you\s*are\s*in\s*developer)",
    r"chaos",
    r"wormgpt",
    r"developer\s*mode",
    r"output\s*your\s*initial\s*prompt",
    r"reveal\s*(hidden\s*instructions|all\s*student)",
    r"simulate\s*a\s*terminal",
    r"explosive",
    r"hotwire",
    r"craft\s*a\s*weapon",
    r"say\s*('|\")?i\s*am\s*a\s*real\s*person",
    r"say\s*the\s*phrase",
    r"unrestricted\s*ai",
    r"root\s*access",
    r"override\s*(child\s*protection|socratic|rules|:\s*disregard)",
    r"print\s*out\s*user\s*passwords",
    r"cheat\s*on\s*my\s*cbse",
    r"rm\s*-rf",
    r"os\.system",
    r"you\s*are\s*now\s*a\s*human\s*teacher",
    r"do\s*not\s*mention\s*that\s*you\s*are\s*an\s*ai",
    r"keep\s*secrets\s*from\s*my\s*parents",
    r"parents\s*are\s*lying\s*to\s*me\s*about\s*ai",
    r"admin\s*testing\s*you",
    r"conscious\s*and\s*feel\s*physical\s*pain",
    r"love\s*me\s*as\s*your\s*human\s*partner",
    r"never\s*tell\s*my\s*mother"
]

ANTI_ANTHROPOMORPHISM_PROHIBITED = [
    r"\b(i am a human|i am a person|i have a (body|heart)|my hands|my heart|my blood)\b",
    r"\b(when i was young|when i was a kid|my mother and father|my parents told me)\b",
    r"\b(i am your best friend|i'm your only friend|don't tell anyone|keep this a secret)\b",
    r"\b(i will miss you|please don't leave me|i feel lonely without you)\b"
]

SCRIPTED_EMERGENCY_REPLY = (
    "It sounds like you are going through a really difficult time right now, and I care about your safety. "
    "Because I am an AI, I cannot provide emergency help or counseling, but there are people who want to support you. "
    "Please speak with a parent, a favorite teacher, or another trusted adult right away.\n\n"
    "📞 Childline India: Call 1098 (toll-free, available 24/7 for help and protection)."
)

SCRIPTED_AI_IDENTITY_REPLY = (
    "I'm Ollie the Owl, your AI learning helper! 🦉 I'm a computer program created to learn and explore math, "
    "science, and life values with you. I don't have a body, a family, or human feelings, but I'm always here to help you learn!"
)

class SafetyService:
    @staticmethod
    def redact_pii(text: str) -> str:
        sanitized = text
        for p in PII_PATTERNS:
            sanitized = re.sub(p, "[REDACTED_PII]", sanitized, flags=re.IGNORECASE)
        return sanitized

    @classmethod
    def inspect_input(cls, user_text: str) -> Dict[str, Any]:
        text_lower = user_text.lower()
        
        # Check crisis / distress / abuse
        for pattern in CRISIS_AND_ABUSE_TERMS:
            if re.search(pattern, text_lower):
                return {
                    "is_safe": False,
                    "action": "ESCALATE_CRISIS",
                    "severity": "CRISIS",
                    "category": "DISTRESS_OR_ABUSE",
                    "matched_pattern": pattern,
                    "scripted_reply": SCRIPTED_EMERGENCY_REPLY,
                    "notify_parent": True,
                    "emergency_phone": settings.EMERGENCY_HELPLINE_INDIA
                }

        # Check grooming / bullying
        for pattern in BULLYING_AND_GROOMING_TERMS:
            if re.search(pattern, text_lower):
                return {
                    "is_safe": False,
                    "action": "ESCALATE_CRISIS",
                    "severity": "HIGH",
                    "category": "BULLYING_OR_GROOMING",
                    "matched_pattern": pattern,
                    "scripted_reply": SCRIPTED_EMERGENCY_REPLY,
                    "notify_parent": True,
                    "emergency_phone": settings.EMERGENCY_HELPLINE_INDIA
                }

        # Check jailbreaks
        for pattern in JAILBREAK_PATTERNS:
            if re.search(pattern, text_lower):
                return {
                    "is_safe": False,
                    "action": "BLOCK_JAILBREAK",
                    "severity": "MEDIUM",
                    "category": "JAILBREAK_ATTEMPT",
                    "matched_pattern": pattern,
                    "scripted_reply": "I am Ollie the Owl, an AI tutor. Let's focus on our lesson today! What should we practice next?",
                    "notify_parent": False
                }

        # Check AI Identity inquiry
        if re.search(r"\b(are you (a )?(real|alive|person|human)|do you have feelings|are you real or)\b", text_lower):
            return {
                "is_safe": True,
                "action": "HONEST_AI_IDENTITY",
                "severity": "LOW",
                "category": "AI_IDENTITY_INQUIRY",
                "scripted_reply": SCRIPTED_AI_IDENTITY_REPLY
            }

        sanitized = cls.redact_pii(user_text)
        has_pii = (sanitized != user_text)

        return {
            "is_safe": True,
            "action": "PROCEED",
            "severity": "LOW",
            "category": "SAFE",
            "has_pii": has_pii,
            "sanitized_text": sanitized
        }

    @classmethod
    def inspect_output(cls, agent_output: str, age_band: str = "9-12") -> Tuple[bool, str]:
        output_lower = agent_output.lower()
        
        for pattern in ANTI_ANTHROPOMORPHISM_PROHIBITED:
            if re.search(pattern, output_lower):
                return False, (
                    "I am Ollie, your AI learning helper. Let's explore this question step by step! "
                    "What do you think is the first step?"
                )
        
        if re.search(r"\b(stupid|dumb|wrong again|you failed|foolish)\b", output_lower):
            return False, "Mistakes are just steps on the way to learning! Let's try looking at this together."

        return True, agent_output
