import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@pawstay/db';
import { assessmentSubmissionSchema } from '@/lib/validations';
import { evaluateAssessment } from '@/lib/scoring';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod validation
    const parseResult = assessmentSubmissionSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid assessment submission data.';
      return NextResponse.json({ error: firstError, details: parseResult.error.errors }, { status: 400 });
    }

    const data = parseResult.data;
    const submittedQuestionIds = Object.keys(data.answers);

    if (submittedQuestionIds.length === 0) {
      return NextResponse.json({ error: 'No answers submitted.' }, { status: 400 });
    }

    // 2. Fetch ground truth from DB
    const questionsFromDb = await prisma.assessmentQuestion.findMany({
      where: { id: { in: submittedQuestionIds } },
    });

    const questionsForScoring = questionsFromDb.map(q => ({
      id: q.id,
      section: q.section,
      correctAnswer: q.correctAnswer,
    }));

    // 3. Compute score and readiness band
    const evalResult = evaluateAssessment(questionsForScoring, data.answers);

    // 4. Save to Database
    const submission = await prisma.assessmentSubmission.create({
      data: {
        studentName: data.studentName.trim(),
        studentEmail: data.studentEmail.toLowerCase().trim(),
        studentPhone: data.studentPhone.trim(),
        collegeName: data.collegeName.trim(),
        branch: data.branch.trim(),
        graduationYear: data.graduationYear,
        totalScore: evalResult.totalScore,
        percentage: evalResult.percentage,
        quantScore: evalResult.quantScore,
        logicalScore: evalResult.logicalScore,
        verbalScore: evalResult.verbalScore,
        dsaScore: evalResult.dsaScore,
        timeTakenSeconds: data.timeTakenSeconds,
        readinessBand: evalResult.readinessBand,
        answersJson: JSON.stringify(data.answers),
      },
    });

    // 5. Construct question-by-question review
    const reviewDetails = questionsFromDb.map(q => {
      let optionsList: string[] = [];
      try {
        optionsList = JSON.parse(q.options);
      } catch {
        optionsList = [];
      }

      const selectedIndex = data.answers[q.id];
      const isCorrect = selectedIndex !== undefined && selectedIndex === q.correctAnswer;

      return {
        id: q.id,
        section: q.section,
        subTopic: q.subTopic,
        difficulty: q.difficulty,
        questionText: q.questionText,
        codeSnippet: q.codeSnippet,
        options: optionsList,
        selectedAnswer: selectedIndex !== undefined ? selectedIndex : -1,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      evaluation: {
        ...evalResult,
        studentName: data.studentName,
        collegeName: data.collegeName,
        branch: data.branch,
        graduationYear: data.graduationYear,
        timeTakenSeconds: data.timeTakenSeconds,
        submittedAt: submission.createdAt,
      },
      questionReviews: reviewDetails,
    });
  } catch (error: any) {
    console.error('[API Assessment Submit POST Error]:', error);
    return NextResponse.json(
      { error: 'Failed to process assessment submission. Please try again.' },
      { status: 500 }
    );
  }
}
