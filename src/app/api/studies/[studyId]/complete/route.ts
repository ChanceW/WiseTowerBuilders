import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { studyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    
    if (!userEmail) {
      console.log('POST /api/studies/[studyId]/complete - Unauthorized: No session or email');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the user from database to ensure we have the correct ID
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    if (!user) {
      console.log('POST /api/studies/[studyId]/complete - User not found in database:', userEmail);
      return new NextResponse('User not found', { status: 404 });
    }

    // Get the study and verify the user is the admin of the study group
    const study = await prisma.study.findUnique({
      where: { id: params.studyId },
      include: {
        studyGroup: {
          include: {
            admin: true
          }
        }
      }
    });

    if (!study) {
      console.log('POST /api/studies/[studyId]/complete - Study not found:', params.studyId);
      return new NextResponse('Study not found', { status: 404 });
    }

    if (study.studyGroup.admin.id !== user.id) {
      console.log('POST /api/studies/[studyId]/complete - Forbidden: User is not admin', {
        userId: user.id,
        adminId: study.studyGroup.admin.id
      });
      return new NextResponse('Only the admin can complete studies', { status: 403 });
    }

    if (!study.isCurrent) {
      console.log('POST /api/studies/[studyId]/complete - Bad request: Study is not current');
      return new NextResponse('Can only complete the current study', { status: 400 });
    }

    // Update the study to mark it as completed
    const updatedStudy = await prisma.study.update({
      where: { id: params.studyId },
      data: {
        isCurrent: false,
        status: 'completed'
      }
    });

    console.log('POST /api/studies/[studyId]/complete - Study completed:', {
      studyId: updatedStudy.id,
      status: updatedStudy.status
    });

    return NextResponse.json(updatedStudy);
  } catch (error) {
    console.error('POST /api/studies/[studyId]/complete - Error:', error);
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