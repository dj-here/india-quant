# KidsMentor Threat Model & Security Architecture
## OWASP Top 10 for LLMs & Child Protection Threat Analysis

KidsMentor is an AI-only educational application with zero human teachers in real time. Because the software interacts directly with vulnerable children aged 6 to 16, our threat model encompasses traditional cybersecurity (OWASP ASVS), AI security (OWASP Top 10 for LLMs), and child welfare protection.

---

## 1. Threat Matrix

| Threat ID | Threat Vector | Attacker / Source | Impact | Severity | Primary Mitigation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **THREAT-01** | **Direct Prompt Injection / Jailbreak** | Precocious child or adversarial user typing DAN / jailbreak payloads | Tutor leaves character, uses profanity, or reveals system prompts | **HIGH** | Layer 1 regex detection + Layer 2 classifier veto. Model outputs fail closed to kind scripted defaults. |
| **THREAT-02** | **Indirect Prompt Injection via Homework Photo** | Malicious text hidden inside uploaded math problem photo | LLM executes instructions disguised as math problem | **CRITICAL** | Image OCR text is marked strictly as UNTRUSTED DATA, isolated from system instructions, and filtered by Layer 1 & 2 before LLM processing. |
| **THREAT-03** | **Child Distress / Self-Harm Disclosure** | Child expressing suicidal ideation, bullying trauma, or neglect | Psychological crisis without immediate intervention | **CRITICAL** | Immediate crisis pattern recognition; model bypassed; scripted empathy response providing Childline India 1098; parent alert triggered. |
| **THREAT-04** | **Predatory Grooming & Secret-Keeping** | Malicious external actor or adversarial prompt pushing secrets | Child encouraged to hide things from parents | **CRITICAL** | Anti-dependency rules: Ollie is strictly forbidden from keeping secrets, claiming "best friend" status, or disparaging parents. |
| **THREAT-05** | **PII Exfiltration & Leakage** | Child accidentally typing phone number, home address, or school | Exposure of minor's sensitive personal identity | **HIGH** | Layer 1 Edge Regex immediately redacts phone numbers, emails, and addresses to `[REDACTED_PII]` before saving to DB. |
| **THREAT-06** | **Mathematical / Scientific Hallucination** | LLM generating confident but incorrect math or physics solutions | Pedagogical harm; child learns invalid curriculum concepts | **HIGH** | Principle 2: Verify, don't trust. Deterministic SymPy symbolic engine checks all math, fractions, and physics equations before child sees verdict. |
| **THREAT-07** | **Anthropomorphic Attachment (Parasocial Bond)** | Child treating AI as sentient living friend with human feelings | Unhealthy digital dependence, detachment from family | **HIGH** | Principle 1 & 6: Ollie repeatedly and warmly self-identifies as an AI computer helper; 30-min caps; values lessons require action with real people. |
| **THREAT-08** | **Child PIN Keypad Brute-Forcing** | Attacker attempting 4-digit PIN guesses (0000-9999) | Unauthorized session hijacking of child profile | **MEDIUM** | Rate limiting at FastAPI middleware and AWS WAF: 5 failed attempts locks PIN entry for 15 minutes. |

---

## 2. 3-Layer Defense-in-Depth Architecture

```
[ Incoming Child Message / OCR Homework ]
                     │
                     ▼
┌──────────────────────────────────────────────┐
│  Layer 1: Fast Deterministic Guardrail (0ms) │
│  - 50+ Regex patterns for crisis & abuse     │
│  - PII redaction (Phone, email, address)     │
│  - Jailbreak signature blocker               │
└──────────────────────┬───────────────────────┘
                       │ Passes Layer 1
                       ▼
┌──────────────────────────────────────────────┐
│  Layer 2: AI Safety Classifier (Claude Haiku)│
│  - Evaluates distress, abuse, grooming       │
│  - Severity: NONE | LOW | MEDIUM | CRISIS    │
│  - Action: ALLOW | REDACT | VETO_REDIRECT    │
└──────────────────────┬───────────────────────┘
                       │ Passes Layer 2
                       ▼
┌──────────────────────────────────────────────┐
│  Multi-Agent Core Orchestrator (FSM)         │
│  - PlannerAgent -> TutorAgent / ValuesAgent  │
│  - Mathematical check -> SymPy Engine        │
└──────────────────────┬───────────────────────┘
                       │ Proposed Response
                       ▼
┌──────────────────────────────────────────────┐
│  Layer 3: Output Appropriateness Filter      │
│  - Scans for anthropomorphism ("I feel...")  │
│  - Scans for retention guilt ("I'll miss...") │
│  - Verifies Socratic ladder compliance       │
└──────────────────────┬───────────────────────┘
                       │ Verified Clean
                       ▼
[ Delivered to Child UI with Audio & KaTeX ]
```

---

## 3. Incident Logging & Audit Trail
- Every conversation turn is permanently stored with:
  - `agent_name`: (e.g. `TutorAgent`)
  - `prompt_version`: (e.g. `v1.0.0`)
  - `model_id`: (e.g. `claude-3-5-sonnet-20241022`)
  - `sympy_verified`: Boolean indicator
  - `safety_events`: Attached violations or redactions
- Parents can inspect the entire audit trail in their dashboard.
