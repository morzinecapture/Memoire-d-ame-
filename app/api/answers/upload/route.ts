import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/storage';
import { addAudioProcessingJob } from '@/lib/queue';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const questionId = formData.get('questionId') as string;
    const relativeId = formData.get('relativeId') as string;
    const duration = parseInt(formData.get('duration') as string, 10);

    if (!audioFile || !questionId || !relativeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the relative belongs to the user
    const relative = await prisma.relative.findFirst({
      where: {
        id: relativeId,
        userId: session.user.id,
      },
    });

    if (!relative) {
      return NextResponse.json(
        { error: 'Relative not found or access denied' },
        { status: 404 }
      );
    }

    // Verify the question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to storage
    const audioUrl = await uploadFile(
      buffer,
      `${Date.now()}-${audioFile.name}`,
      audioFile.type || 'audio/webm',
      'audio'
    );

    // Create answer record
    const answer = await prisma.answer.create({
      data: {
        audioUrl,
        audioSize: buffer.length,
        audioDuration: duration || null,
        processingStatus: 'pending',
        tags: [],
        questionId,
        relativeId,
      },
    });

    // Queue audio processing job
    await addAudioProcessingJob({
      answerId: answer.id,
      audioUrl,
      questionId,
      relativeId,
    });

    return NextResponse.json(
      {
        message: 'Audio uploaded successfully',
        answerId: answer.id,
        status: 'processing',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading audio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
