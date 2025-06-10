import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Find the group and check if user is already a member
    const group = await prisma.studyGroup.findUnique({
      where: { inviteCode: params.code },
      include: {
        members: {
          where: {
            email: session.user.email,
          },
        },
      },
    });

    if (!group) {
      return new NextResponse('Invalid invitation code', { status: 404 });
    }

    if (group.members.length > 0) {
      return new NextResponse('Already a member of this group', { status: 400 });
    }

    // Add user to the group
    await prisma.studyGroup.update({
      where: { id: group.id },
      data: {
        members: {
          connect: {
            email: session.user.email,
          },
        },
      },
    });

    return new NextResponse('Successfully joined the study group', { status: 200 });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 