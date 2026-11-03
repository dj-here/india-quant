import { describe, it, expect } from 'vitest';
import { evaluateAssessment, QuestionForScoring } from '@/lib/scoring';

describe('Assessment Scoring Engine (evaluateAssessment)', () => {
  const sampleQuestions: QuestionForScoring[] = [
    // 2 Quant
    { id: 'q1', section: 'QUANT', correctAnswer: 0 },
    { id: 'q2', section: 'QUANT', correctAnswer: 1 },
    // 2 Logical
    { id: 'q3', section: 'LOGICAL', correctAnswer: 2 },
    { id: 'q4', section: 'LOGICAL', correctAnswer: 3 },
    // 2 Verbal
    { id: 'q5', section: 'VERBAL', correctAnswer: 1 },
    { id: 'q6', section: 'VERBAL', correctAnswer: 0 },
    // 2 DSA Basic
    { id: 'q7', section: 'DSA_BASIC', correctAnswer: 3 },
    { id: 'q8', section: 'DSA_BASIC', correctAnswer: 2 },
  ];

  it('evaluates 100% correct answers into SUPER_DREAM_READY band', () => {
    const userAnswers = {
      q1: 0,
      q2: 1,
      q3: 2,
      q4: 3,
      q5: 1,
      q6: 0,
      q7: 3,
      q8: 2,
    };

    const result = evaluateAssessment(sampleQuestions, userAnswers);

    expect(result.totalScore).toBe(8);
    expect(result.totalQuestions).toBe(8);
    expect(result.percentage).toBe(100);
    expect(result.quantScore).toBe(2);
    expect(result.logicalScore).toBe(2);
    expect(result.verbalScore).toBe(2);
    expect(result.dsaScore).toBe(2);
    expect(result.readinessBand).toBe('SUPER_DREAM_READY');
    expect(result.readinessTitle).toContain('Tier-1 Super-Dream Ready');
  });

  it('evaluates 62.5% score into PLACEMENT_READY band (between 55% and 80%)', () => {
    // 5 correct out of 8 = 62.5%
    const userAnswers = {
      q1: 0, // correct Quant
      q2: 1, // correct Quant
      q3: 2, // correct Logical
      q4: 0, // wrong Logical
      q5: 1, // correct Verbal
      q6: 2, // wrong Verbal
      q7: 3, // correct DSA
      q8: 0, // wrong DSA
    };

    const result = evaluateAssessment(sampleQuestions, userAnswers);

    expect(result.totalScore).toBe(5);
    expect(result.totalQuestions).toBe(8);
    expect(result.percentage).toBe(62.5);
    expect(result.quantScore).toBe(2);
    expect(result.logicalScore).toBe(1);
    expect(result.verbalScore).toBe(1);
    expect(result.dsaScore).toBe(1);
    expect(result.readinessBand).toBe('PLACEMENT_READY');
    expect(result.readinessTitle).toContain('Mass Recruiter & Core Tech Ready');
  });

  it('evaluates <55% score into FOUNDATION_NEEDED band', () => {
    // 2 correct out of 8 = 25%
    const userAnswers = {
      q1: 0, // correct Quant
      q2: 0, // wrong
      q3: 0, // wrong
      q4: 0, // wrong
      q5: 1, // correct Verbal
      q6: 2, // wrong
      q7: 0, // wrong
      q8: 0, // wrong
    };

    const result = evaluateAssessment(sampleQuestions, userAnswers);

    expect(result.totalScore).toBe(2);
    expect(result.percentage).toBe(25);
    expect(result.readinessBand).toBe('FOUNDATION_NEEDED');
    expect(result.readinessTitle).toContain('Foundational Remediation Needed');
  });

  it('gracefully handles empty or omitted answers', () => {
    const userAnswers = {};

    const result = evaluateAssessment(sampleQuestions, userAnswers);

    expect(result.totalScore).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.quantScore).toBe(0);
    expect(result.logicalScore).toBe(0);
    expect(result.verbalScore).toBe(0);
    expect(result.dsaScore).toBe(0);
    expect(result.readinessBand).toBe('FOUNDATION_NEEDED');
  });

  it('correctly calculates sectional breakdown with 20 questions', () => {
    // Create a 20 question pool (5 in each of 4 sections)
    const twentyQuestions: QuestionForScoring[] = [];
    const sections = ['QUANT', 'LOGICAL', 'VERBAL', 'DSA_BASIC'];
    for (let i = 0; i < 20; i++) {
      twentyQuestions.push({
        id: `question_${i}`,
        section: sections[i % 4]!,
        correctAnswer: 1,
      });
    }

    // Answer only QUANT correctly (5 questions)
    const answers: Record<string, number> = {};
    twentyQuestions.forEach(q => {
      if (q.section === 'QUANT') {
        answers[q.id] = 1; // correct
      } else {
        answers[q.id] = 0; // wrong
      }
    });

    const result = evaluateAssessment(twentyQuestions, answers);
    expect(result.totalScore).toBe(5);
    expect(result.totalQuestions).toBe(20);
    expect(result.percentage).toBe(25);
    expect(result.quantScore).toBe(5);
    expect(result.logicalScore).toBe(0);
    expect(result.verbalScore).toBe(0);
    expect(result.dsaScore).toBe(0);
  });
});
