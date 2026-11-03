import { NextResponse } from 'next/server';
import { prisma } from '@pawstay/db';

export const dynamic = 'force-dynamic';

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temp;
  }
  return arr;
}

export async function GET() {
  try {
    // 1. Fetch active questions from DB
    const allQuestions = await prisma.assessmentQuestion.findMany({
      where: { isActive: true },
    });

    if (allQuestions.length === 0) {
      return NextResponse.json({ error: 'No assessment questions available in database.' }, { status: 500 });
    }

    // 2. Select balanced 20-question mix: 5 Quant, 5 Logical, 5 Verbal, 5 DSA
    const quantQuestions = shuffleArray(allQuestions.filter(q => q.section === 'QUANT')).slice(0, 5);
    const logicalQuestions = shuffleArray(allQuestions.filter(q => q.section === 'LOGICAL')).slice(0, 5);
    const verbalQuestions = shuffleArray(allQuestions.filter(q => q.section === 'VERBAL')).slice(0, 5);
    const dsaQuestions = shuffleArray(allQuestions.filter(q => q.section === 'DSA_BASIC')).slice(0, 5);

    // If any section had fewer than 5, backfill from remaining pool
    const selected = [...quantQuestions, ...logicalQuestions, ...verbalQuestions, ...dsaQuestions];
    if (selected.length < 20) {
      const remaining = allQuestions.filter(q => !selected.some(s => s.id === q.id));
      const backfill = shuffleArray(remaining).slice(0, 20 - selected.length);
      selected.push(...backfill);
    }

    // Shuffle the final selected 20 questions
    const finalSelection = shuffleArray(selected).map((q, index) => {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = JSON.parse(q.options);
      } catch {
        parsedOptions = ['Option A', 'Option B', 'Option C', 'Option D'];
      }

      return {
        id: q.id,
        index: index + 1,
        section: q.section,
        subTopic: q.subTopic,
        difficulty: q.difficulty,
        questionText: q.questionText,
        codeSnippet: q.codeSnippet,
        options: parsedOptions,
        // Crucial: Omit correctAnswer & explanation for anti-cheat
      };
    });

    return NextResponse.json({
      success: true,
      totalQuestions: finalSelection.length,
      timeLimitMinutes: 20,
      questions: finalSelection,
    });
  } catch (error: any) {
    console.error('[API Assessment Questions GET Error]:', error);
    return NextResponse.json({ error: 'Failed to generate assessment questions.' }, { status: 500 });
  }
}
