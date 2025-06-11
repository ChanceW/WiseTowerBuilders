import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const studyGroup = await prisma.studyGroup.findUnique({
      where: { id: params.groupId },
      include: {
        admin: {
          select: { id: true },
        },
        studies: {
          where: { isCurrent: true },
          include: {
            questions: true,
          },
        },
      },
    });

    if (!studyGroup) {
      return new NextResponse('Study group not found', { status: 404 });
    }

    // Check if user is a member of the study group
    const isMember = await prisma.studyGroup.findFirst({
      where: {
        id: params.groupId,
        OR: [
          { adminId: session.user.id },
          { members: { some: { id: session.user.id } } },
        ],
      },
    });

    if (!isMember) {
      return new NextResponse('You are not a member of this study group', { status: 403 });
    }

    return NextResponse.json(studyGroup);
  } catch (error) {
    console.error('Error fetching study group:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 