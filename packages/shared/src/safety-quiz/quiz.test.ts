import { describe, it, expect } from 'vitest';
import { SAFETY_QUIZ_QUESTIONS, evaluateSafetyQuiz } from './index.js';

describe('Safety Quiz Evaluation Engine', () => {
  it('has exactly 10 comprehensive safety questions', () => {
    expect(SAFETY_QUIZ_QUESTIONS).toHaveLength(10);
    const uniqueIds = new Set(SAFETY_QUIZ_QUESTIONS.map((q) => q.id));
    expect(uniqueIds.size).toBe(10);
  });

  it('correctly passes a perfect 10/10 submission', () => {
    const perfectAnswers = SAFETY_QUIZ_QUESTIONS.map((q) => ({
      questionId: q.id,
      selectedOptionIndex: q.correctOptionIndex,
    }));

    const result = evaluateSafetyQuiz(perfectAnswers);

    expect(result.score).toBe(10);
    expect(result.total).toBe(10);
    expect(result.percentage).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.mandatoryFailed).toBe(false);
    expect(result.missedQuestionIds).toHaveLength(0);
  });

  it('passes an 8/10 submission where the 2 missed questions are non-mandatory', () => {
    const nonMandatoryQuestions = SAFETY_QUIZ_QUESTIONS.filter((q) => !q.isMandatory);
    expect(nonMandatoryQuestions.length).toBeGreaterThanOrEqual(2);

    const answers = SAFETY_QUIZ_QUESTIONS.map((q) => {
      // Miss first 2 non-mandatory questions
      if (nonMandatoryQuestions.slice(0, 2).some((nm) => nm.id === q.id)) {
        return {
          questionId: q.id,
          selectedOptionIndex: (q.correctOptionIndex + 1) % q.options.length,
        };
      }
      return {
        questionId: q.id,
        selectedOptionIndex: q.correctOptionIndex,
      };
    });

    const result = evaluateSafetyQuiz(answers);

    expect(result.score).toBe(8);
    expect(result.percentage).toBe(80);
    expect(result.passed).toBe(true);
    expect(result.mandatoryFailed).toBe(false);
    expect(result.missedQuestionIds).toHaveLength(2);
  });

  it('fails an 8/10 submission if any missed question is mandatory', () => {
    const mandatoryQuestion = SAFETY_QUIZ_QUESTIONS.find((q) => q.isMandatory)!;
    const nonMandatoryQuestion = SAFETY_QUIZ_QUESTIONS.find((q) => !q.isMandatory)!;

    const answers = SAFETY_QUIZ_QUESTIONS.map((q) => {
      if (q.id === mandatoryQuestion.id || q.id === nonMandatoryQuestion.id) {
        return {
          questionId: q.id,
          selectedOptionIndex: (q.correctOptionIndex + 1) % q.options.length,
        };
      }
      return {
        questionId: q.id,
        selectedOptionIndex: q.correctOptionIndex,
      };
    });

    const result = evaluateSafetyQuiz(answers);

    expect(result.score).toBe(8);
    expect(result.percentage).toBe(80);
    expect(result.passed).toBe(false); // Fails because a mandatory question was missed
    expect(result.mandatoryFailed).toBe(true);
    expect(result.missedQuestionIds).toContain(mandatoryQuestion.id);
  });

  it('fails if score is below 80% even if all mandatory questions are answered correctly', () => {
    // There are 5 mandatory questions. Let's get only 5 right (50%).
    const answers = SAFETY_QUIZ_QUESTIONS.map((q) => {
      if (q.isMandatory) {
        return { questionId: q.id, selectedOptionIndex: q.correctOptionIndex };
      }
      return { questionId: q.id, selectedOptionIndex: (q.correctOptionIndex + 1) % q.options.length };
    });

    const result = evaluateSafetyQuiz(answers);

    expect(result.percentage).toBeLessThan(80);
    expect(result.mandatoryFailed).toBe(false);
    expect(result.passed).toBe(false);
  });

  it('returns appropriate feedback and explanations for every question', () => {
    const answers = [
      { questionId: 'sq_heatstroke', selectedOptionIndex: 1 }, // correct
      { questionId: 'sq_medication', selectedOptionIndex: 0 }, // wrong
    ];

    const result = evaluateSafetyQuiz(answers);
    const heatstrokeFb = result.feedback.find((f) => f.questionId === 'sq_heatstroke')!;
    const medFb = result.feedback.find((f) => f.questionId === 'sq_medication')!;

    expect(heatstrokeFb.correct).toBe(true);
    expect(heatstrokeFb.explanation).toBeTruthy();
    expect(medFb.correct).toBe(false);
    expect(medFb.explanation).toBeTruthy();
  });
});
