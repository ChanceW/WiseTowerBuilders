import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateDiscussionQuestions(passage: string) {
  const prompt = `Generate 5 discussion questions for the following Bible passage, based on hermeneutical principles. For each question, provide:
1. Context: Brief contextual guide for the question
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
      model: "gpt-3.5-turbo", // Using gpt-3.5-turbo as it's more widely available
      messages: [
        {
          role: "system",
          content: "You are a biblical scholar and hermeneutics expert. Generate thoughtful discussion questions that help people understand Scripture better. Always return a valid JSON object with a 'questions' array."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content);
    
    // Validate the response structure
    if (!response || !Array.isArray(response.questions)) {
      console.error('Invalid response structure:', response);
      throw new Error('Invalid response structure from OpenAI');
    }

    // Ensure we have exactly 5 questions
    if (response.questions.length !== 5) {
      console.error('Expected 5 questions, got:', response.questions.length);
      throw new Error('Expected 5 questions from OpenAI');
    }

    return response.questions;
  } catch (error) {
    console.error('Error generating discussion questions:', error);
    throw new Error('Failed to generate discussion questions');
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
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
      return new NextResponse('Study group not found', { status: 404 });
    }

    if (studyGroup.adminId !== session.user.id) {
      return new NextResponse('Only the admin can create studies', { status: 403 });
    }

    const passage = `${validatedBibleBook} ${validatedBibleChapter}`;
    // Generate discussion questions using OpenAI
    const questions = await generateDiscussionQuestions(passage);

    // Create the study with generated questions
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

      // Create the new study with generated questions
      return await tx.study.create({
        data: {
          studyGroupId,
          bibleBook: validatedBibleBook,
          bibleChapter: validatedBibleChapter,
          isCurrent: true,
          questions: {
            create: questions.map((q: any) => ({
              passage,
              context: q.context,
              discussion: q.question,
              principle: q.principle,
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