import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { studyGroupId, questions } = await request.json();

    // Verify the study group exists and user is admin
    const studyGroup = await prisma.studyGroup.findUnique({
      where: { id: studyGroupId },
      include: { admin: true },
    });

    if (!studyGroup) {
      return new NextResponse('Study group not found', { status: 404 });
    }

    if (studyGroup.adminId !== session.user.id) {
      return new NextResponse('Only the admin can create studies', { status: 403 });
    }

    // Create the study and questions in a transaction
    const study = await prisma.$transaction(async (tx) => {
      // Mark any existing current study as not current
      await tx.study.updateMany({
        where: {
          studyGroupId,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
        },
      });

      // Create the new study with questions
      return await tx.study.create({
        data: {
          studyGroupId,
          isCurrent: true,
          questions: {
            create: questions.map((q: { context: string; discussion: string }) => ({
              context: q.context,
              discussion: q.discussion,
            })),
          },
        },
        include: {
          questions: true,
        },
      });
    });

    return NextResponse.json(study);
  } catch (error) {
    console.error('Error creating study:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 