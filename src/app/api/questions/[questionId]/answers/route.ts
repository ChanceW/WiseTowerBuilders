import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/questions/[questionId]/answers
export async function GET(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    console.log('GET /api/questions/[questionId]/answers - Question ID:', params.questionId);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('GET /api/questions/[questionId]/answers - Unauthorized: No session or email');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the user from database to ensure we have the correct ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    console.log('GET /api/questions/[questionId]/answers - User details:', {
      sessionUserId: session.user.id,
      databaseUserId: user?.id,
      email: session.user.email
    });

    if (!user) {
      console.log('GET /api/questions/[questionId]/answers - User not found in database:', session.user.email);
      return new NextResponse('User not found', { status: 404 });
    }

    // Get the question and verify the user has access to it
    const question = await prisma.question.findUnique({
      where: { id: params.questionId },
      include: {
        study: {
          include: {
            studyGroup: {
              include: {
                members: true,
                admin: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      console.log('GET /api/questions/[questionId]/answers - Question not found:', params.questionId);
      return new NextResponse('Question not found', { status: 404 });
    }

    // Check if user is a member of the study group using database user ID
    const isMember = question.study.studyGroup.members.some(member => member.id === user.id) ||
                    question.study.studyGroup.admin.id === user.id;

    console.log('GET /api/questions/[questionId]/answers - Membership check:', {
      userId: user.id,
      groupId: question.study.studyGroup.id,
      isAdmin: question.study.studyGroup.admin.id === user.id,
      isMember: question.study.studyGroup.members.some(member => member.id === user.id)
    });

    if (!isMember) {
      console.log('GET /api/questions/[questionId]/answers - Forbidden: User not a member');
      return new NextResponse('You are not a member of this study group', { status: 403 });
    }

    // Get all answers for this question with user information
    const answers = await prisma.answer.findMany({
      where: { questionId: params.questionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('GET /api/questions/[questionId]/answers - Success:', {
      questionId: params.questionId,
      answerCount: answers.length
    });

    return NextResponse.json(answers);
  } catch (error) {
    console.error('GET /api/questions/[questionId]/answers - Error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// POST /api/questions/[questionId]/answers
export async function POST(
  request: Request,
  { params }: { params: { questionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the user from database to ensure we have the correct ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return new NextResponse('Content is required', { status: 400 });
    }

    // Get the question and verify the user has access to it
    const question = await prisma.question.findUnique({
      where: { id: params.questionId },
      include: {
        study: {
          include: {
            studyGroup: {
              include: {
                members: true,
                admin: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      return new NextResponse('Question not found', { status: 404 });
    }

    // Check if user is a member of the study group using database user ID
    const isMember = question.study.studyGroup.members.some(member => member.id === user.id) ||
                    question.study.studyGroup.admin.id === user.id;

    if (!isMember) {
      return new NextResponse('You are not a member of this study group', { status: 403 });
    }

    // Create or update the answer using database user ID
    const answer = await prisma.answer.upsert({
      where: {
        questionId_userId: {
          questionId: params.questionId,
          userId: user.id,
        },
      },
      update: {
        content,
        updatedAt: new Date(),
      },
      create: {
        content,
        questionId: params.questionId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(answer);
  } catch (error) {
    console.error('POST /api/questions/[questionId]/answers - Error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 