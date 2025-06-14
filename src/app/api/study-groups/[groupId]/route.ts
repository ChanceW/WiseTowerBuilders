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
    console.log('GET /api/study-groups/[groupId] - Session details:', {
      exists: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      name: session?.user?.name
    });

    if (!session?.user?.email) {
      console.log('GET /api/study-groups/[groupId] - Unauthorized: No session or email');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // First get the user from the database to ensure we have the correct ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    console.log('GET /api/study-groups/[groupId] - Database user:', {
      found: !!user,
      userId: user?.id,
      sessionUserId: session.user.id
    });

    if (!user) {
      console.log('GET /api/study-groups/[groupId] - User not found in database:', session.user.email);
      return new NextResponse('User not found', { status: 404 });
    }

    const studyGroup = await prisma.studyGroup.findUnique({
      where: { id: params.groupId },
      include: {
        admin: {
          select: { id: true },
        },
        members: {
          select: { id: true, email: true }
        },
        studies: {
          include: {
            questions: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
      },
    });

    console.log('GET /api/study-groups/[groupId] - Study group details:', {
      found: !!studyGroup,
      groupId: studyGroup?.id,
      adminId: studyGroup?.admin?.id,
      memberCount: studyGroup?.members?.length,
      memberIds: studyGroup?.members?.map(m => ({ id: m.id, email: m.email }))
    });

    if (!studyGroup) {
      console.log('GET /api/study-groups/[groupId] - Study group not found:', params.groupId);
      return new NextResponse('Study group not found', { status: 404 });
    }

    // Check if user is a member of the study group using the database user ID
    const isMember = studyGroup.admin.id === user.id || 
                    studyGroup.members.some(member => member.id === user.id);

    console.log('GET /api/study-groups/[groupId] - Membership check:', {
      isAdmin: studyGroup.admin.id === user.id,
      isMember: studyGroup.members.some(member => member.id === user.id),
      finalResult: isMember
    });

    if (!isMember) {
      console.log('GET /api/study-groups/[groupId] - Access denied: Not a member');
      return new NextResponse('You are not a member of this study group', { status: 403 });
    }

    // Remove member details from response
    const { members, ...groupDetails } = studyGroup;
    
    console.log('GET /api/study-groups/[groupId] - Access granted, returning group details');
    return NextResponse.json(groupDetails);
  } catch (error) {
    console.error('GET /api/study-groups/[groupId] - Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(
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

    // Get the study group
    const studyGroup = await prisma.studyGroup.findUnique({
      where: { id: params.groupId },
      include: {
        admin: {
          select: { id: true }
        }
      }
    });

    if (!studyGroup) {
      return new NextResponse('Study group not found', { status: 404 });
    }

    // Check if user is the admin
    if (studyGroup.admin.id !== user.id) {
      return new NextResponse('Only the admin can update the group name', { status: 403 });
    }

    const { name } = await request.json();
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new NextResponse('Group name is required', { status: 400 });
    }

    // Update the group name
    const updatedGroup = await prisma.studyGroup.update({
      where: { id: params.groupId },
      data: { name: name.trim() },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error updating study group:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 