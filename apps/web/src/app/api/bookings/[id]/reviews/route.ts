import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@pawstay/db';
import { evaluateReviewBlindness, calculateUpdatedBayesianRating } from '@pawstay/shared';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (defaultUser) {
        userId = defaultUser.id;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        sitter: { include: { user: true } },
        owner: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isOwner = booking.ownerId === userId;
    const isSitter = booking.sitter.userId === userId;
    const isAdmin = session?.user?.roles?.includes('ADMIN');

    if (!isOwner && !isSitter && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const reviews = await prisma.review.findMany({
      where: { bookingId: params.id },
    });

    const myReview = reviews.find((r) => r.authorId === userId) || null;
    const counterpartyReview = reviews.find((r) => r.authorId !== userId) || null;

    return NextResponse.json({
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        completedAt: booking.completedAt,
        sitterName: booking.sitter.user.name,
        ownerName: booking.owner.name,
        isOwner,
        isSitter,
      },
      myReview,
      counterpartyReview: counterpartyReview
        ? counterpartyReview.isBlind
          ? {
              submitted: true,
              isBlind: true,
              message: 'Counterparty has submitted a review. It will unlock once you submit yours or 14 days pass.',
            }
          : counterpartyReview
        : null,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    if (!userId) {
      const defaultUser = await prisma.user.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (defaultUser) {
        userId = defaultUser.id;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        sitter: { include: { user: true } },
        owner: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isOwner = booking.ownerId === userId;
    const isSitter = booking.sitter.userId === userId;
    const isAdmin = session?.user?.roles?.includes('ADMIN');

    if (!isOwner && !isSitter && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify user hasn't already submitted review
    const existingMyReview = await prisma.review.findUnique({
      where: {
        bookingId_authorId: {
          bookingId: params.id,
          authorId: userId,
        },
      },
    });

    if (existingMyReview) {
      return NextResponse.json(
        { error: 'You have already submitted a review for this stay.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const rating = Number(body.rating);

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5 stars.' },
        { status: 400 }
      );
    }

    const content = (body.content || '').trim();
    if (!content) {
      return NextResponse.json(
        { error: 'Review feedback text is required.' },
        { status: 400 }
      );
    }

    const title = body.title ? String(body.title).trim() : null;
    const cleanlinessRating = body.cleanlinessRating ? Number(body.cleanlinessRating) : null;
    const communicationRating = body.communicationRating ? Number(body.communicationRating) : null;
    const timelinessRating = body.timelinessRating ? Number(body.timelinessRating) : null;
    const careQualityRating = body.careQualityRating ? Number(body.careQualityRating) : null;
    const isRecommended = body.isRecommended !== undefined ? Boolean(body.isRecommended) : true;

    // Check if counterparty has already submitted a review
    const targetUserId = isOwner ? booking.sitter.userId : booking.ownerId;
    const authorRole = isOwner ? 'OWNER' : 'SITTER';

    const counterpartyReview = await prisma.review.findFirst({
      where: {
        bookingId: params.id,
        authorId: targetUserId,
      },
    });

    const blindnessResult = evaluateReviewBlindness({
      hasCounterpartyReviewed: !!counterpartyReview,
      completedAt: booking.completedAt,
    });

    const isBlind = blindnessResult.isBlind;
    const now = new Date();

    // 1. Create the new review
    const newReview = await prisma.review.create({
      data: {
        bookingId: params.id,
        authorId: userId,
        targetId: targetUserId,
        authorRole,
        rating,
        title,
        content,
        cleanlinessRating,
        communicationRating,
        timelinessRating,
        careQualityRating,
        isRecommended,
        isBlind,
        revealedAt: isBlind ? null : now,
      },
    });

    // 2. If both have submitted, reveal counterparty's review too!
    if (!isBlind && counterpartyReview && counterpartyReview.isBlind) {
      await prisma.review.update({
        where: { id: counterpartyReview.id },
        data: {
          isBlind: false,
          revealedAt: now,
        },
      });

      // Recalculate sitter's rating if applicable
      const sitterUserId = booking.sitter.userId;
      const allPublicReviews = await prisma.review.findMany({
        where: { targetId: sitterUserId, isBlind: false },
        select: { rating: true },
      });

      const { ratingAverage, reviewCount } = calculateUpdatedBayesianRating(
        allPublicReviews.map((r) => r.rating)
      );

      await prisma.sitterProfile.update({
        where: { id: booking.sitter.id },
        data: { ratingBayesian: ratingAverage, reviewCount },
      });

      // Notify counterparty that both reviews are now live
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: '⭐ Reviews Revealed!',
          message: `Both reviews for Booking #${booking.bookingNumber} are now public. Read what was written!`,
          actionUrl: `/bookings/${booking.id}`,
          type: 'REVIEWS_REVEALED',
        },
      });
    } else if (isBlind) {
      // Notify counterparty that first review was submitted
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: '📝 Stay Review Received!',
          message: `${session?.user?.name || 'Your client/sitter'} left you a review! Submit yours to unlock both reviews.`,
          actionUrl: `/bookings/${booking.id}/review`,
          type: 'REVIEW_AWAITING',
        },
      });
    }

    // 3. Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'REVIEW_SUBMITTED',
        entityType: 'Booking',
        entityId: params.id,
        metadata: {
          reviewId: newReview.id,
          rating,
          isBlind,
          blindnessReason: blindnessResult.reason,
        },
      },
    });

    return NextResponse.json({
      review: newReview,
      isBlind,
      message: isBlind
        ? 'Your review is securely stored! It will remain blind until the other party submits theirs or 14 days pass.'
        : 'Both reviews are submitted and now public on the platform!',
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
