import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const group = await prisma.studyGroup.findUnique({
      where: { inviteCode: params.code },
      select: {
        id: true,
        name: true,
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
        members: {
          where: {
            email: session.user.email,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!group) {
      return new NextResponse('Invalid invitation code', { status: 404 });
    }

    // Check if user is already a member
    if (group.members.length > 0) {
      return new NextResponse('Already a member of this group', { status: 400 });
    }

    return NextResponse.json({
      name: group.name,
      admin: group.admin,
    });
  } catch (error) {
    console.error('Error fetching invite details:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 