import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addPDFGenerationJob } from '@/lib/queue';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year } = await params;
    const yearNum = parseInt(year, 10);

    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }

    // Check if book already exists
    let book = await prisma.book.findUnique({
      where: {
        userId_year: {
          userId: session.user.id,
          year: yearNum,
        },
      },
    });

    // Create book if it doesn't exist
    if (!book) {
      book = await prisma.book.create({
        data: {
          year: yearNum,
          title: `Mémoires ${yearNum}`,
          userId: session.user.id,
          status: 'draft',
        },
      });
    }

    // If book is already being generated, return its status
    if (book.status === 'generating') {
      return NextResponse.json(
        {
          message: 'Book is already being generated',
          bookId: book.id,
          status: book.status,
        },
        { status: 200 }
      );
    }

    // If book is already completed, return it
    if (book.status === 'completed' && book.pdfUrl) {
      return NextResponse.json(
        {
          message: 'Book already exists',
          bookId: book.id,
          pdfUrl: book.pdfUrl,
          status: book.status,
          generatedAt: book.generatedAt,
        },
        { status: 200 }
      );
    }

    // Queue the PDF generation job
    await addPDFGenerationJob({
      bookId: book.id,
      userId: session.user.id,
      year: yearNum,
    });

    return NextResponse.json(
      {
        message: 'PDF generation started',
        bookId: book.id,
        status: 'generating',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Error generating book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { year } = await params;
    const yearNum = parseInt(year, 10);

    if (isNaN(yearNum)) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }

    // Get book status
    const book = await prisma.book.findUnique({
      where: {
        userId_year: {
          userId: session.user.id,
          year: yearNum,
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({
      bookId: book.id,
      year: book.year,
      title: book.title,
      status: book.status,
      pdfUrl: book.pdfUrl,
      coverImageUrl: book.coverImageUrl,
      generatedAt: book.generatedAt,
      metadata: book.metadata,
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
