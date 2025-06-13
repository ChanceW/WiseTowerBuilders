import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateDiscussionQuestions(bibleBook: string, bibleChapter: number) {
  const passage = `${bibleBook} ${bibleChapter}`;
  const prompt = `Generate 5 discussion questions for the following Bible passage, based on hermeneutical principles. For each question, provide:
1. Context: Brief content which helps the reader answer the question
2. Question: A thoughtful discussion question
3. Principle: The specific hermeneutical principle used (historical-cultural, lexical-syntactical, theological, genre, or application)

Passage: ${passage}

Format the response as a JSON object with a "questions" array containing objects with the following structure:
{
  "questions": [
    {
      "context": "Brief contextual guide for the question",
      "question": "The discussion question",
      "principle": "One of: historical-cultural, lexical-syntactical, theological, genre, application"
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const response = JSON.parse(content);

    // Validate the response structure
    if (!response || !Array.isArray(response.questions)) {
      throw new Error('Invalid response structure from OpenAI');
    }

    // Validate each question
    const questions = response.questions.map((q: any) => {
      if (!q.context || !q.question || !q.principle) {
        throw new Error('Invalid question structure in OpenAI response');
      }
      return {
        context: q.context,
        question: q.question,
        principle: q.principle,
      } as GeneratedQuestion;
    });

    return questions;
  } catch (error) {
    console.error('Error generating discussion questions:', error);
    throw new Error('Failed to generate discussion questions');
  }
}

// Add type for generated questions
interface GeneratedQuestion {
  context: string;
  question: string;
  principle: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    
    if (!userEmail) {
      console.log('POST /api/studies - Unauthorized: No session or email');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the user from database to ensure we have the correct ID
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true }
    });

    console.log('POST /api/studies - User details:', {
      sessionUserId: session?.user?.id,
      databaseUserId: user?.id,
      email: userEmail
    });

    if (!user) {
      console.log('POST /api/studies - User not found in database:', userEmail);
      return new NextResponse('User not found', { status: 404 });
    }

    const { studyGroupId, bibleBook, bibleChapter } = await request.json();

    if (!bibleBook || !bibleChapter || typeof bibleBook !== 'string' || typeof bibleChapter !== 'number') {
      return new NextResponse('Bible book and chapter are required', { status: 400 });
    }

    // At this point, we know bibleBook is a string and bibleChapter is a number
    const validatedBibleBook: string = bibleBook;
    const validatedBibleChapter: number = bibleChapter;

    // Verify the study group exists and user is admin
    const studyGroup = await prisma.studyGroup.findUnique({
      where: { id: studyGroupId },
      include: { admin: true },
    });

    if (!studyGroup) {
      console.log('POST /api/studies - Study group not found:', studyGroupId);
      return new NextResponse('Study group not found', { status: 404 });
    }

    if (studyGroup.adminId !== user.id) {
      console.log('POST /api/studies - Forbidden: User is not admin', {
        userId: user.id,
        adminId: studyGroup.adminId
      });
      return new NextResponse('Only the admin can create studies', { status: 403 });
    }

    // Generate discussion questions using OpenAI
    const questions = await generateDiscussionQuestions(validatedBibleBook, validatedBibleChapter);

    // Create the study with questions
    const study = await prisma.study.create({
      data: {
        bibleBook: validatedBibleBook,
        bibleChapter: validatedBibleChapter,
        studyGroupId,
        isCurrent: true,
        questions: {
          create: questions.map((q: GeneratedQuestion) => ({
            context: q.context,
            discussion: q.question,
            principle: q.principle,
            passage: `${validatedBibleBook} ${validatedBibleChapter}`,  // Keep passage for backward compatibility
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    console.log('POST /api/studies - Study created:', {
      studyId: study.id,
      questionCount: study.questions.length
    });

    return NextResponse.json(study);
  } catch (error) {
    console.error('POST /api/studies - Error:', error);
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