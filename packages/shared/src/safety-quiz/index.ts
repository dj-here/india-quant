/**
 * Safety Quiz Questions & Pure Evaluation Engine
 * Mandatory for all prospective sitters prior to verification review.
 */

export interface SafetyQuizQuestion {
  id: string;
  category: 'FIRST_AID' | 'BEHAVIOR' | 'MEDICATION' | 'SAFETY' | 'PLATFORM_RULES' | 'EMERGENCY';
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  isMandatory: boolean; // Must be answered correctly to pass regardless of overall percentage
}

export const SAFETY_QUIZ_QUESTIONS: SafetyQuizQuestion[] = [
  {
    id: 'sq_heatstroke',
    category: 'FIRST_AID',
    question: 'A dog in your care exhibits excessive panting, bright red gums, thick drool, and unsteadiness on a hot summer day. What is the correct first action?',
    options: [
      'Give the dog ice-cold water and submerge them in an ice bath immediately.',
      'Move the dog to a cool, shaded area, offer cool (not icy) water, apply cool damp towels to paws and neck, and call the vet immediately.',
      'Encourage the dog to walk it off slowly in an air-conditioned room.',
      'Wait 30 minutes to see if the dog cools down naturally before taking action.',
    ],
    correctOptionIndex: 1,
    explanation:
      'Ice or ice-cold baths cause peripheral vasoconstriction which traps core heat and induces shivering. Cool water on paws/neck and immediate vet notification is the gold standard.',
    isMandatory: true,
  },
  {
    id: 'sq_food_guarding',
    category: 'BEHAVIOR',
    question: 'When feeding multiple dogs in your home (boarders and/or personal pets), what is the safest procedure?',
    options: [
      'Feed all dogs in the same room side-by-side to foster pack bonding.',
      'Feed each dog in a separate room behind closed doors or physical barriers, and pick up bowls before letting them back out.',
      'Place bowls 3 feet apart and stand in between them with treats ready.',
      'Free-feed all dogs from a large communal feeder bowl.',
    ],
    correctOptionIndex: 1,
    explanation:
      'Resource guarding is the #1 cause of dog fights during home boarding. Feeding behind closed doors completely eliminates food-related aggression.',
    isMandatory: true,
  },
  {
    id: 'sq_medication',
    category: 'MEDICATION',
    question: 'An owner leaves prescription medication for their pet with handwritten instructions that contradict the label printed on the prescription bottle. What should you do?',
    options: [
      'Follow the bottle label instructions because veterinarians print them.',
      'Guess the average between the two doses.',
      'Do not administer the dose yet; immediately message/call the owner to get explicit written confirmation before giving the medication.',
      'Skip the medication entirely for the duration of the booking without telling anyone.',
    ],
    correctOptionIndex: 2,
    explanation:
      'Medication errors can be fatal. Any discrepancy must be clarified directly with the pet parent before administering medication.',
    isMandatory: false,
  },
  {
    id: 'sq_yard_inspection',
    category: 'SAFETY',
    question: 'Before allowing a new guest dog off-leash in your fenced yard for the first time, which protocol must you follow?',
    options: [
      'Open the door and let them explore alone so they don’t feel pressured.',
      'Walk the entire fence perimeter first to inspect for loose boards, gaps, or dig spots, verify gate latches are padlocked/secured, and supervise at all times.',
      'Assuming the fence was secure yesterday, let them out as long as you can hear them through an open window.',
      'Put the dog on a 50-foot stake in the yard without checking the fence.',
    ],
    correctOptionIndex: 1,
    explanation:
      'Fences can be breached by weather, wildlife, or previous dig spots. Unsupervised yard time is prohibited for guest pets.',
    isMandatory: true,
  },
  {
    id: 'sq_off_platform_leakage',
    category: 'PLATFORM_RULES',
    question: 'A prospective client asks in pre-booking chat: "Can I just pay you cash or Venmo in person to skip the service fee?" How do you respond?',
    options: [
      'Agree to cash since you will save on platform fees and receive payment quicker.',
      'Politely inform the owner that PawStay requires on-platform payment, which protects them with platform guarantees, vet emergency authorization, and 24/7 support.',
      'Give them your personal phone number in secret code words so PawStay automated filters don’t detect it.',
      'Accept the cash, but charge them 10% extra for your inconvenience.',
    ],
    correctOptionIndex: 1,
    explanation:
      'Off-platform transactions forfeit all platform protection, vet authorizations, liability coverage, and lead to permanent account deactivation.',
    isMandatory: true,
  },
  {
    id: 'sq_emergency_bloat',
    category: 'EMERGENCY',
    question: 'A large deep-chested dog shows unproductive dry heaving, an enlarged distended abdomen, pacing, and severe distress after eating. What is the emergency protocol?',
    options: [
      'Give the dog pepto-bismol and wait two hours.',
      'Take the dog on a brisk run to help them pass gas.',
      'Recognize potential gastric dilatation-volvulus (bloat/GDV) as a medical emergency; immediately transport to the nearest 24/7 emergency vet and call them en route.',
      'Put the dog in their crate to sleep it off.',
    ],
    correctOptionIndex: 2,
    explanation:
      'GDV / bloat is a critical surgical emergency with high mortality if untreated within hours. Immediate veterinary intervention is mandatory.',
    isMandatory: true,
  },
  {
    id: 'sq_dog_introductions',
    category: 'BEHAVIOR',
    question: 'How should you introduce a guest dog to your own resident dog for the first time?',
    options: [
      'Let the new dog loose straight into your living room where your resident dog is sleeping.',
      'Introduce them outdoors on neutral ground (e.g. sidewalk or neutral park) on loose leashes with two handlers, walking parallel before polite sniffing.',
      'Hold both dogs tightly face-to-face so they can establish eye dominance immediately.',
      'Put both dogs in adjacent wire crates and let them bark at each other for an hour.',
    ],
    correctOptionIndex: 1,
    explanation:
      'Neutral territory and parallel walking disarms territorial defensiveness and allows both dogs to read body language in a relaxed posture.',
    isMandatory: false,
  },
  {
    id: 'sq_cat_containment',
    category: 'SAFETY',
    question: 'When providing house sitting or drop-in visits for an indoor cat, what is the most critical door safety practice?',
    options: [
      'Leave the exterior door propped open while carrying in groceries so you have a quick exit.',
      'Never open an exterior door without knowing where the cat is; use your body or a bag as a barrier ("airlock" technique) to prevent door-dashing.',
      'Assume cats are too timid to run outside so door vigilance is unnecessary.',
      'Allow the indoor cat outside on the porch for 10 minutes if they meow at the window.',
    ],
    correctOptionIndex: 1,
    explanation:
      'Door-dashing is one of the leading causes of lost pets during drop-in visits. Indoor-only cats must never be allowed outside without explicit written instructions.',
    isMandatory: false,
  },
  {
    id: 'sq_minor_injury',
    category: 'SAFETY',
    question: 'During an afternoon walk, a dog gets a small surface scratch on their paw pad from a thorny bush. What should you do?',
    options: [
      'Conceal the scratch from the owner so they do not give you a low review rating.',
      'Clean the scratch gently with pet-safe antiseptic/water, bandage if necessary, notify the owner promptly with a photo and explanation, and monitor closely.',
      'Rush the dog to the emergency room without telling the owner.',
      'Apply human triple antibiotic ointment with pain relief and ignore it.',
    ],
    correctOptionIndex: 1,
    explanation:
      'Transparency builds trust. Honest, prompt communication of even minor incidents prevents misunderstandings and ensures pet safety.',
    isMandatory: false,
  },
  {
    id: 'sq_leash_etiquette',
    category: 'SAFETY',
    question: 'While walking a client’s dog on a neighborhood sidewalk, another dog and owner approach on the same sidewalk. What is best practice?',
    options: [
      'Let the dogs greet on tight leashes head-on to see if they want to play.',
      'Give adequate buffer space by stepping aside or crossing the street, ask the other owner before any greeting, and never force a meet on leash.',
      'Drop your leash so the dogs can work out their hierarchy naturally.',
      'Yell at the other owner to turn around.',
    ],
    correctOptionIndex: 1,
    explanation:
      'On-leash greetings on sidewalks can cause leash reactivity and dog fights. Creating space and asking permission is essential for client pet safety.',
    isMandatory: false,
  },
];

export interface SafetyQuizEvaluation {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  mandatoryFailed: boolean;
  missedQuestionIds: string[];
  feedback: {
    questionId: string;
    correct: boolean;
    explanation: string;
  }[];
}

/**
 * Pure evaluation function for safety quiz submissions.
 * Passing criteria:
 * 1. Score >= 80% (at least 8 out of 10)
 * 2. ALL mandatory questions must be answered correctly.
 */
export function evaluateSafetyQuiz(
  answers: { questionId: string; selectedOptionIndex: number }[]
): SafetyQuizEvaluation {
  const answerMap = new Map<string, number>();
  for (const a of answers) {
    answerMap.set(a.questionId, a.selectedOptionIndex);
  }

  let score = 0;
  let mandatoryFailed = false;
  const missedQuestionIds: string[] = [];
  const feedback: SafetyQuizEvaluation['feedback'] = [];

  for (const q of SAFETY_QUIZ_QUESTIONS) {
    const selected = answerMap.get(q.id);
    const isCorrect = selected === q.correctOptionIndex;

    if (isCorrect) {
      score += 1;
    } else {
      missedQuestionIds.push(q.id);
      if (q.isMandatory) {
        mandatoryFailed = true;
      }
    }

    feedback.push({
      questionId: q.id,
      correct: isCorrect,
      explanation: q.explanation,
    });
  }

  const total = SAFETY_QUIZ_QUESTIONS.length;
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 80 && !mandatoryFailed;

  return {
    score,
    total,
    percentage,
    passed,
    mandatoryFailed,
    missedQuestionIds,
    feedback,
  };
}
