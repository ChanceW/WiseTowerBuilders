import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  console.log('GET /api/study-groups/invite/[code] - Request received:', {
    code: params.code,
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries())
  });

  try {
    const session = await getServerSession(authOptions);
    console.log('GET /api/study-groups/invite/[code] - Session details:', {
      exists: !!session,
      email: session?.user?.email,
      userId: session?.user?.id,
      name: session?.user?.name
    });
    
    // Find the group by invite code
    console.log('GET /api/study-groups/invite/[code] - Querying database for group with code:', params.code);
    const group = await prisma.studyGroup.findUnique({
      where: { inviteCode: params.code },
      select: {
        id: true,
        name: true,
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        // Only include members check if user is authenticated
        ...(session?.user?.email ? {
          members: {
            where: {
              email: session.user.email,
            },
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        } : {}),
      },
    });

    console.log('GET /api/study-groups/invite/[code] - Database query result:', {
      found: !!group,
      groupId: group?.id,
      groupName: group?.name,
      adminEmail: group?.admin?.email,
      adminId: group?.admin?.id,
      hasMembers: group ? 'members' in group : false,
      memberCount: group && 'members' in group ? group.members.length : 0,
      memberDetails: group && 'members' in group ? group.members : undefined
    });

    if (!group) {
      console.log('GET /api/study-groups/invite/[code] - Group not found for code:', params.code);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid invitation code' }), 
        { 
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    // If user is authenticated, check if they're already a member
    if (session?.user?.email && 'members' in group && group.members.length > 0) {
      console.log('GET /api/study-groups/invite/[code] - User already a member:', {
        email: session.user.email,
        userId: session.user.id,
        groupId: group.id,
        memberDetails: group.members
      });
      return new NextResponse(
        JSON.stringify({ error: 'Already a member of this group' }), 
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    // Return group details without member information
    const { members, ...groupDetails } = group;
    console.log('GET /api/study-groups/invite/[code] - Returning group details:', {
      id: groupDetails.id,
      name: groupDetails.name,
      adminEmail: groupDetails.admin.email,
      adminId: groupDetails.admin.id
    });
    
    return NextResponse.json(groupDetails, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('GET /api/study-groups/invite/[code] - Error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
} 