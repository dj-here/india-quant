export interface QuestionForScoring {
  id: string;
  section: string; // 'QUANT' | 'LOGICAL' | 'VERBAL' | 'DSA_BASIC'
  correctAnswer: number;
}

export interface ScoringResult {
  totalScore: number;
  totalQuestions: number;
  percentage: number;
  quantScore: number;
  logicalScore: number;
  verbalScore: number;
  dsaScore: number;
  readinessBand: 'SUPER_DREAM_READY' | 'PLACEMENT_READY' | 'FOUNDATION_NEEDED';
  readinessTitle: string;
  readinessDescription: string;
  recommendedAction: string;
}

export function evaluateAssessment(
  questions: QuestionForScoring[],
  userAnswers: Record<string, number>
): ScoringResult {
  let totalScore = 0;
  let quantScore = 0;
  let logicalScore = 0;
  let verbalScore = 0;
  let dsaScore = 0;

  for (const q of questions) {
    const selected = userAnswers[q.id];
    if (selected !== undefined && selected === q.correctAnswer) {
      totalScore++;
      if (q.section === 'QUANT') quantScore++;
      else if (q.section === 'LOGICAL') logicalScore++;
      else if (q.section === 'VERBAL') verbalScore++;
      else if (q.section === 'DSA_BASIC') dsaScore++;
    }
  }

  const totalQuestions = questions.length || 20;
  const percentage = Math.round((totalScore / totalQuestions) * 100 * 10) / 10;

  let readinessBand: 'SUPER_DREAM_READY' | 'PLACEMENT_READY' | 'FOUNDATION_NEEDED';
  let readinessTitle: string;
  let readinessDescription: string;
  let recommendedAction: string;

  if (percentage >= 80) {
    readinessBand = 'SUPER_DREAM_READY';
    readinessTitle = 'Tier-1 Super-Dream Ready (7+ to 25+ LPA)';
    readinessDescription =
      'Outstanding algorithmic intuition and quantitative speed. You are competitive for high-compensation product roles (Amazon, Cisco, Flipkart, PhonePe, tier-1 fintech).';
    recommendedAction =
      'Focus on advanced System Design (LLD/HLD), Graph algorithms, Dynamic Programming space optimizations, and mock whiteboard rounds.';
  } else if (percentage >= 55) {
    readinessBand = 'PLACEMENT_READY';
    readinessTitle = 'Mass Recruiter & Core Tech Ready (4 to 7 LPA)';
    readinessDescription =
      'Solid foundational competencies. You comfortably qualify for top mass recruiter categories (TCS Digital, Cognizant GenC Next, Accenture Advanced, Capgemini).';
    recommendedAction =
      'Strengthen your speed in two-pointer/sliding window coding problems and master high-speed quantitative shortcut techniques to cross the 80% cutoff.';
  } else {
    readinessBand = 'FOUNDATION_NEEDED';
    readinessTitle = 'Foundational Remediation Needed (<4 LPA)';
    readinessDescription =
      'Core gaps identified in syntax execution, algorithmic time complexity, or quantitative speed math. High risk of elimination in Day-1 online screening tests.';
    recommendedAction =
      'Urgent structured intervention recommended: 120-hour CampusEdge Foundation track covering linear data structures, debugging, and quantitative speed drills.';
  }

  return {
    totalScore,
    totalQuestions,
    percentage,
    quantScore,
    logicalScore,
    verbalScore,
    dsaScore,
    readinessBand,
    readinessTitle,
    readinessDescription,
    recommendedAction,
  };
}
