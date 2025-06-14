import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { groupId: string } }
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

    // Get the study group with members
    const studyGroup = await prisma.studyGroup.findUnique({
      where: { id: params.groupId },
      include: {
        admin: {
          select: { id: true }
        },
        members: {
          select: { id: true }
        }
      }
    });

    if (!studyGroup) {
      return new NextResponse('Study group not found', { status: 404 });
    }

    // Check if user is a member
    const isMember = studyGroup.members.some(member => member.id === user.id);
    const isAdmin = studyGroup.admin.id === user.id;

    if (!isMember && !isAdmin) {
      return new NextResponse('You are not a member of this study group', { status: 403 });
    }

    // If user is admin, check if there are other members to transfer admin to
    if (isAdmin) {
      const { newAdminId } = await request.json();
      
      if (!newAdminId) {
        // If no new admin specified and there are other members, return error
        if (studyGroup.members.length > 0) {
          return new NextResponse('Please specify a new admin before leaving', { status: 400 });
        }
        
        // If no members, delete the group
        await prisma.studyGroup.delete({
          where: { id: studyGroup.id }
        });
        return new NextResponse('Study group deleted', { status: 200 });
      }

      // Verify the new admin is a member
      const isNewAdminMember = studyGroup.members.some(member => member.id === newAdminId);
      if (!isNewAdminMember) {
        return new NextResponse('New admin must be a member of the group', { status: 400 });
      }

      // Update group with new admin and remove old admin from members
      await prisma.studyGroup.update({
        where: { id: studyGroup.id },
        data: {
          adminId: newAdminId,
          members: {
            disconnect: { id: user.id }
          }
        }
      });
    } else {
      // Regular member leaving - just remove from members
      await prisma.studyGroup.update({
        where: { id: studyGroup.id },
        data: {
          members: {
            disconnect: { id: user.id }
          }
        }
      });
    }

    return new NextResponse('Successfully left the study group', { status: 200 });
  } catch (error) {
    console.error('Error leaving study group:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 