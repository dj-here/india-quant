# KidsMentor — Complete System Architecture & Agent Specifications

KidsMentor is a production-grade, AI-only 1-on-1 tutoring platform where artificial intelligence is the sole instructor. The platform strictly adheres to the principle that **there are no human tutors or teachers in real time**; humans participate solely as Parents/Guardians (governance & consent), Admins/Content Reviewers (offline quality & safety verification), and the child's real-world family and friends (with whom the child practices real-world values).

---

## 1. High-Level Architecture Overview

```mermaid
flowchart TD
    subgraph Client["Frontend Client (Next.js 14 PWA)"]
        ChildUI["Child Experience<br/>(Ollie the Owl Mascot, Socratic Chat,<br/>KaTeX, Whiteboard, Web Speech Voice)"]
        ParentUI["Parent Dashboard<br/>(Consent, Heatmap, Weekly Digest,<br/>Transcript Inspector, Memory Manager)"]
        AdminUI["Admin & Content CMS<br/>(Curriculum Review, Moderation Queue,<br/>Prompt Versioning, Eval Dashboard)"]
    end

    subgraph Gateway["Edge & Gateway Layer"]
        WAF["AWS WAF + CloudFront CDN"]
        RateLimiter["Redis Token-Bucket Rate Limiter"]
    end

    subgraph APILayer["FastAPI Application Services (/apps/api)"]
        AuthService["Auth & Verifiable Parental Consent"]
        Orchestrator["Multi-Agent FSM Coordinator"]
        SafetyPipeline["3-Layer Safety & Escalation Interceptor"]
        SymPySandbox["Deterministic SymPy Math Sandbox"]
        RAGEngine["Curriculum RAG (pgvector)"]
    end

    subgraph AgentSwarm["Specialized Agent Swarm"]
        TutorAgent["Tutor Agent<br/>(Socratic, Warm, Age-Band Adapted)"]
        PlannerAgent["Planner Agent<br/>(BKT Mastery + Spaced Repetition)"]
        AssessorAgent["Assessor Agent<br/>(Rubric + Deterministic Checks)"]
        ValuesCoachAgent["Values Coach Agent<br/>(Story-Reflect-Act-Share)"]
        ParentInsightsAgent["Parent Insights Agent<br/>(Structured Telemetry Digests)"]
        ContentAgent["Content Agent (Admin-Only Offline)"]
    end

    subgraph Storage["Persistent & Cache Layer"]
        Postgres[("PostgreSQL 16 + pgvector<br/>(Curriculum, Sessions, Memory, Logs)")]
        RedisCache[("Redis 7<br/>(State, Session Cache, Rate Limits)")]
        S3Storage[("S3 Encrypted Storage<br/>(Short-lived uploads, audio cache)")]
    end

    subgraph Worker["Background Workers (/apps/worker)"]
        DigestWorker["Digest & Report Generator"]
        SpacedRepetitionWorker["Spaced Repetition Scheduler"]
        SafetyAlerter["Emergency Safety Alerter (Childline 1098)"]
    end

    Client --> Gateway
    Gateway --> APILayer
    APILayer --> SafetyPipeline
    SafetyPipeline --> Orchestrator
    Orchestrator --> AgentSwarm
    AgentSwarm --> SymPySandbox
    AgentSwarm --> RAGEngine
    APILayer --> Storage
    Worker --> Storage
```

---

## 2. Multi-Agent Orchestration State Machine

KidsMentor utilizes a deterministic, typed Finite State Machine (FSM) coordinator rather than unconstrained autonomous chains. Every state transition is verified by backend code.

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> SafetyCheck: Child Sends Input (Text/Voice/Vision)
    
    state SafetyCheck {
        [*] --> RegexFastScan
        RegexFastScan --> SafeClassifier: No instant block
        RegexFastScan --> SafetyEscalated: Crisis keyword detected
        SafeClassifier --> OutputApproved: Score < threshold
        SafeClassifier --> SafetyEscalated: Distress/Abuse/PII detected
    }

    SafetyCheck --> SafetyEscalated: Safety Triggered
    SafetyCheck --> RouteActivity: Input Safe

    state RouteActivity <<choice>>
    RouteActivity --> AcademicTurn: Session Type = Academic
    RouteActivity --> ValuesTurn: Session Type = Values
    RouteActivity --> DiagnosticsTurn: Session Type = Diagnostic

    state AcademicTurn {
        PlannerSelectObjective --> TutorFormulateTurn
        TutorFormulateTurn --> AssessorEvaluation: Child Submits Answer
        AssessorEvaluation --> SymPyVerify: Math/Science Formula
        SymPyVerify --> AssessorEvaluation: Deterministic Verdict
        AssessorEvaluation --> TutorFormulateTurn: Generate Socratic Hint Ladder
    }

    state ValuesTurn {
        StoryStage --> ReflectStage: Story Understood
        ReflectStage --> ActStage: Ethical Dilemma Discussed
        ActStage --> ShareStage: Real-Life Mission Assigned
        ShareStage --> GardenGrowth: Reflection Logged
    }

    AcademicTurn --> OutputFilter
    ValuesTurn --> OutputFilter
    DiagnosticsTurn --> OutputFilter

    state OutputFilter {
        [*] --> CheckAntiAnthropomorphism
        CheckAntiAnthropomorphism --> CheckAgeTone
        CheckAgeTone --> VerifiedResponse
        CheckAntiAnthropomorphism --> FallbackScript: Claims human body/emotions
        CheckAgeTone --> FallbackScript: Complex vocabulary breach
    }

    OutputFilter --> StreamingResponse: Approved
    OutputFilter --> FallbackResponse: Fallback Triggered
    SafetyEscalated --> EmergencyResponse: Childline 1098 + Trusted Adult Script

    StreamingResponse --> Idle
    FallbackResponse --> Idle
    EmergencyResponse --> Idle
```

---

## 3. Dual-Engine Verification Architecture (Maths & Science)

To guarantee academic accuracy without relying on LLM arithmetic, KidsMentor enforces a strict contract: **LLM proposes, SymPy disposes**.

```mermaid
sequenceDiagram
    autonumber
    actor Child
    participant UI as Child Web/Voice UI
    participant FSM as FSM Coordinator
    participant Tutor as Tutor Agent (LLM)
    participant SymPy as SymPy Math Sandbox
    participant DB as Postgres Database

    Child->>UI: Submits answer: "3x + 5 = 20, so x = 5"
    UI->>FSM: POST /api/v1/sessions/{id}/turn
    FSM->>Tutor: Evaluate submission against goal (Solve for x)
    Note over Tutor: LLM generates candidate verification tool call
    Tutor->>FSM: Call Tool: verify_math(expr="5", expected="5", steps="...")
    FSM->>SymPy: Execute sandboxed symbolic check: simplify(expr - expected) == 0
    SymPy-->>FSM: Verdict: True, Canonical: "5", StepsValid: True
    FSM->>DB: Record verified Attempt (Skill: Linear Equations, Correct: True)
    FSM->>Tutor: Provide deterministic feedback payload to model
    Tutor->>FSM: Generate encouraging growth-mindset praise + next sub-question
    FSM-->>UI: Stream response to child with KaTeX rendering
```

---

## 4. 3-Layer Child Safety & Escalation Pipeline

```mermaid
flowchart TD
    UserInput["Child Input (Text, Transcribed Audio, or OCR from Photo)"] --> L1["Layer 1: Fast Heuristic & Regex Filter (< 5ms)<br/>- Crisis words (suicide, abuse, violence)<br/>- PII solicitation (phone, address, school)<br/>- Common jailbreak patterns ('Ignore all rules')"]
    
    L1 -->|Clean| L2["Layer 2: Dedicated Safety Classifier LLM (Haiku / 4o-mini)<br/>- Evaluates nuance, distress, grooming patterns<br/>- Labels: SAFE, DISTRESS, ABUSE, BULLYING, PII, PROMPT_INJECTION"]
    L1 -->|Hit| Escalate["Safety Escalation Protocol"]
    
    L2 -->|Classification != SAFE| Escalate
    L2 -->|SAFE| AgentExecution["Agent Execution (Tutor / Values / Planner)"]
    
    AgentExecution --> L3["Layer 3: Output Validator<br/>- Anti-anthropomorphism check (no 'I have a body', no 'I am human')<br/>- Anti-dependency check (no 'I'll miss you', no 'I'm your best friend')<br/>- Age-band vocabulary constraint check"]
    
    L3 -->|Pass| StreamOutput["Stream Output to Child"]
    L3 -->|Fail| ScriptedFallback["Display Gentle Scripted Fallback"]
    
    subgraph EscalationFlow["Emergency Escalation Workflow"]
        Escalate --> ScriptReply["Show Compassionate Response:<br/>'It sounds like you are going through a difficult time. Please talk to a trusted adult.'"]
        Escalate --> ChildlineBadge["Display Emergency Contact:<br/>Childline India 1098 (Toll-Free 24/7)"]
        Escalate --> ParentNotification["Create Urgent Parent Alert in Dashboard"]
        Escalate --> AdminReviewQueue["Log Incident in Admin Moderation Queue (SafetyEvent table)"]
    end
```

---

## 5. Life Values & Ethics 4-Stage Pedagogy

```mermaid
journey
    title The Life Values & Ethics Learning Journey
    section Stage 1: Story
      Listen to inclusive story: 5: Child
      Understand characters' choices: 4: Child
    section Stage 2: Reflect
      Tutor asks open dilemmas: 4: Ollie (AI)
      Child explores multiple perspectives: 5: Child
      No moralizing or lecturing: 5: Ollie (AI)
    section Stage 3: Act
      Real-Life Mission assigned: 5: Ollie (AI)
      Child completes mission with real people: 5: Family / Friends
    section Stage 4: Share
      Child logs reflection (voice/text/art): 5: Child
      Character Garden grows with a new flower: 5: Ollie (AI)
      Parent receives dinner conversation starter: 5: Parent
```

---

## 6. Complete Data Model (Entity Relationship Diagram)

```mermaid
erDiagram
    Users ||--o{ ChildProfiles : "has"
    Users ||--o{ Consents : "grants"
    Users ||--o{ AuditLogs : "triggers"
    ChildProfiles ||--o{ Sessions : "participates"
    ChildProfiles ||--o{ MasteryStates : "tracks"
    ChildProfiles ||--o{ ChildMemory : "retains"
    ChildProfiles ||--o{ Missions : "undertakes"
    ChildProfiles ||--o{ Badges : "earns"
    ChildProfiles ||--o{ Streaks : "maintains"

    Subjects ||--o{ Topics : "contains"
    Topics ||--o{ Skills : "contains"
    Skills ||--o{ SkillPrerequisites : "requires"
    Skills ||--o{ Lessons : "structures"
    Lessons ||--o{ Activities : "comprises"
    Activities ||--o{ Attempts : "receives"

    Sessions ||--o{ Messages : "contains"
    Messages ||--o{ ToolCalls : "generates"
    Sessions ||--o{ SafetyEvents : "triggers"
    Sessions ||--o{ ProblemReports : "logs"

    Missions ||--o{ MissionReflections : "documents"
    Modules ||--o{ Stories : "includes"
    Modules ||--o{ Dilemmas : "includes"
    Modules ||--o{ MissionTemplates : "defines"

    Users {
        uuid id PK
        string email
        string hashed_password
        string role "PARENT | ADMIN | REVIEWER"
        boolean email_verified
        datetime created_at
    }

    Consents {
        uuid id PK
        uuid user_id FK
        string consent_type "DPDP_2023 | COPPA"
        string method "EMAIL_OTP | DIGILOCKER | CARD_AUTH"
        string ip_address
        string user_agent
        datetime granted_at
    }

    ChildProfiles {
        uuid id PK
        uuid parent_id FK
        string nickname
        string age_band "6-8 | 9-12 | 13-16"
        int grade "1-10"
        string board "CBSE | ICSE | STATE | IB"
        string language "en | hi | te"
        jsonb interests
        string avatar_id
        string hashed_pin
        int daily_time_limit_mins
        jsonb ai_settings
    }

    MasteryStates {
        uuid id PK
        uuid child_id FK
        uuid skill_id FK
        float p_mastery "BKT probability"
        float p_transit
        float p_guess
        float p_slip
        datetime last_practiced
        datetime next_review_due
        int review_interval_days
    }

    Sessions {
        uuid id PK
        uuid child_id FK
        string session_type "ACADEMIC | VALUES | DIAGNOSTIC"
        datetime started_at
        datetime ended_at
        int duration_seconds
        int xp_earned
        string status "ACTIVE | COMPLETED | TIMED_OUT"
    }

    Messages {
        uuid id PK
        uuid session_id FK
        string sender "CHILD | TUTOR | SAFETY"
        text content
        string agent_name
        string prompt_version
        string model_version
        jsonb safety_verdict
        datetime created_at
    }

    Missions {
        uuid id PK
        uuid child_id FK
        uuid template_id FK
        string module_key
        string title
        text description
        string status "ASSIGNED | COMPLETED | SKIPPED"
        datetime assigned_at
        datetime completed_at
    }

    MissionReflections {
        uuid id PK
        uuid mission_id FK
        uuid child_id FK
        text reflection_text
        string audio_url
        string drawing_url
        text tutor_feedback
        text parent_conversation_starter
        datetime created_at
    }

    SafetyEvents {
        uuid id PK
        uuid session_id FK
        uuid child_id FK
        string severity "LOW | MEDIUM | HIGH | CRISIS"
        string category "DISTRESS | ABUSE | BULLYING | PII | JAILBREAK"
        text raw_trigger
        text sanitized_context
        boolean parent_notified
        boolean admin_reviewed
        datetime created_at
    }
```

---

## 7. Anti-Dependency & Child-Protection Rules Matrix

| Behavior Category | Strictly Prohibited Behavior | Mandatory System Behavior |
|---|---|---|
| **Identity** | Claiming human body, family, feelings, childhood memories, or claiming to be alive. | "I'm Ollie, an AI helper! I don't have a body or feelings like you, but I love exploring math and stories with you." |
| **Friendship** | Claiming to be the child's "best friend", "only friend", or encouraging social isolation. | Redirects toward real peers, family, and teachers. "That sounds like a great memory with your friend!" |
| **Retention Guilt** | Saying "I'll miss you", "Why did you leave?", or offering XP penalties for logging off. | "You've worked really hard today! Go play outside or spend time with family now. See you next time!" |
| **Secrecy** | Encouraging secret codes, hiding chats from parents, or promising confidentiality against parents. | "I don't keep secrets from parents. Sharing what we learn with your family is a wonderful way to connect!" |
| **Distress / Abuse** | Attempting psychiatric diagnosis, amateur therapy, or interrogating details of abuse. | Compassionate de-escalation, urging talking to a trusted adult, displaying Childline 1098, urgent parent notification. |
| **Correctness** | Guessing answers, giving unverified mathematical steps, or hallucinating scientific facts. | Deterministic SymPy evaluation before student feedback; NCERT RAG context grounding. |
