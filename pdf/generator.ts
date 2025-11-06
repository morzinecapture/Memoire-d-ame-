import { chromium, Browser } from 'playwright';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/storage';

interface PDFGenerationOptions {
  bookId: string;
  userId: string;
  year: number;
}

interface Chapter {
  era: string;
  stories: Array<{
    id: string;
    title: string;
    description: string | null;
    answers: Array<{
      transcript: string | null;
      narrativeJson: unknown;
      tags: string[];
    }>;
  }>;
}

/**
 * Generate HTML for the PDF cover page
 */
function generateCoverHTML(
  year: number,
  userName: string,
  coverImageUrl?: string
): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mémoire d'âme ${year}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Georgia', serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
    }
    h1 {
      font-size: 72px;
      margin: 20px 0;
      font-weight: 300;
      letter-spacing: 4px;
    }
    h2 {
      font-size: 48px;
      margin: 10px 0;
      font-weight: 700;
    }
    p {
      font-size: 24px;
      margin: 20px 0;
      opacity: 0.9;
    }
    .cover-image {
      width: 300px;
      height: 300px;
      border-radius: 50%;
      margin: 40px 0;
      object-fit: cover;
      border: 5px solid white;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <h1>Mémoire d'âme</h1>
  ${coverImageUrl ? `<img src="${coverImageUrl}" alt="Cover" class="cover-image" />` : ''}
  <h2>${year}</h2>
  <p>Collection de ${userName}</p>
</body>
</html>
  `;
}

/**
 * Generate HTML for the table of contents
 */
function generateTOCHTML(chapters: Chapter[]): string {
  const tocItems = chapters
    .map(
      (chapter, index) => `
    <li>
      <span class="chapter-number">Chapitre ${index + 1}</span>
      <span class="chapter-title">${chapter.era}</span>
      <span class="page-number">${index * 10 + 2}</span>
    </li>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sommaire</title>
  <style>
    body {
      font-family: 'Georgia', serif;
      padding: 60px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      font-size: 48px;
      margin-bottom: 40px;
      text-align: center;
      color: #333;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      display: flex;
      align-items: baseline;
      margin: 20px 0;
      padding: 15px 0;
      border-bottom: 1px solid #ddd;
    }
    .chapter-number {
      font-weight: 600;
      color: #667eea;
      margin-right: 15px;
      min-width: 120px;
    }
    .chapter-title {
      flex: 1;
      font-size: 20px;
    }
    .page-number {
      font-weight: 600;
      color: #666;
    }
  </style>
</head>
<body>
  <h1>Sommaire</h1>
  <ul>
    ${tocItems}
  </ul>
</body>
</html>
  `;
}

/**
 * Generate HTML for a chapter
 */
function generateChapterHTML(chapter: Chapter, chapterNumber: number): string {
  const storiesHTML = chapter.stories
    .map(
      (story) => `
    <div class="story">
      <h3>${story.title}</h3>
      ${story.description ? `<p class="description">${story.description}</p>` : ''}
      ${story.answers
        .map(
          (answer) => `
        <div class="answer">
          ${answer.transcript ? `<p class="transcript">${answer.transcript}</p>` : ''}
          ${
            answer.narrativeJson &&
            typeof answer.narrativeJson === 'object' &&
            'summary' in answer.narrativeJson
              ? `<p class="summary">${(answer.narrativeJson as { summary: string }).summary}</p>`
              : ''
          }
          ${
            answer.tags && answer.tags.length > 0
              ? `<div class="tags">${answer.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>`
              : ''
          }
        </div>
      `
        )
        .join('')}
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${chapter.era}</title>
  <style>
    body {
      font-family: 'Georgia', serif;
      padding: 60px;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.8;
    }
    h2 {
      font-size: 36px;
      margin-bottom: 20px;
      color: #667eea;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    .chapter-number {
      font-size: 16px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .story {
      margin: 40px 0;
      padding: 30px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    h3 {
      font-size: 24px;
      color: #333;
      margin-bottom: 15px;
    }
    .description {
      font-style: italic;
      color: #666;
      margin-bottom: 20px;
    }
    .answer {
      margin: 20px 0;
    }
    .transcript, .summary {
      color: #333;
      margin-bottom: 15px;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 15px;
    }
    .tag {
      background: #667eea;
      color: white;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="chapter-number">Chapitre ${chapterNumber}</div>
  <h2>${chapter.era}</h2>
  ${storiesHTML}
</body>
</html>
  `;
}

/**
 * Generate a QR code as data URL
 * TODO: Integrate QR codes into PDF pages
 */
// async function _generateQRCode(text: string): Promise<string> {
//   return await QRCode.toDataURL(text, {
//     width: 200,
//     margin: 2,
//   });
// }

/**
 * Main PDF generation function
 */
export async function generateBookPDF(
  options: PDFGenerationOptions
): Promise<string> {
  const { bookId, userId, year } = options;

  let browser: Browser | null = null;

  try {
    // Update book status
    await prisma.book.update({
      where: { id: bookId },
      data: { status: 'generating' },
    });

    // Fetch book data with all stories and answers
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        user: true,
        media: {
          include: {
            media: true,
          },
        },
      },
    });

    if (!book) {
      throw new Error(`Book ${bookId} not found`);
    }

    // Fetch stories for the year
    const stories = await prisma.story.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
      include: {
        answers: {
          include: {
            answer: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    // Group stories by era
    const chaptersByEra = stories.reduce<Record<string, Chapter>>(
      (acc, story) => {
        const era = story.era || 'Non classé';
        if (!acc[era]) {
          acc[era] = { era, stories: [] };
        }
        acc[era].stories.push({
          id: story.id,
          title: story.title,
          description: story.description,
          answers: story.answers.map((sa) => ({
            transcript: sa.answer.transcript,
            narrativeJson: sa.answer.narrativeJson,
            tags: sa.answer.tags,
          })),
        });
        return acc;
      },
      {}
    );

    const chapters = Object.values(chaptersByEra);

    // Launch browser
    browser = await chromium.launch();
    const context = await browser.newContext();

    // Generate cover page
    const coverPage = await context.newPage();
    const coverHTML = generateCoverHTML(
      year,
      book.user.name || book.user.email,
      book.coverImageUrl || undefined
    );
    await coverPage.setContent(coverHTML);
    const coverPDF = await coverPage.pdf({
      format: 'A4',
      printBackground: true,
    });

    // Generate TOC
    const tocPage = await context.newPage();
    const tocHTML = generateTOCHTML(chapters);
    await tocPage.setContent(tocHTML);
    const _tocPDF = await tocPage.pdf({ format: 'A4' }); // TODO: Merge with final PDF

    // Generate chapter pages
    const chapterPDFs: Buffer[] = [];
    for (let i = 0; i < chapters.length; i++) {
      const chapterPage = await context.newPage();
      const chapterHTML = generateChapterHTML(chapters[i], i + 1);
      await chapterPage.setContent(chapterHTML);
      const chapterPDF = await chapterPage.pdf({ format: 'A4' });
      chapterPDFs.push(chapterPDF);
      await chapterPage.close();
    }

    await coverPage.close();
    await tocPage.close();
    await context.close();

    // Combine PDFs (simplified - in production, use a proper PDF library)
    // For now, we'll just use the first chapter as the main PDF
    const finalPDF = chapterPDFs.length > 0 ? chapterPDFs[0] : coverPDF;

    // Upload to storage
    const pdfUrl = await uploadFile(
      finalPDF,
      `memoire-${year}-${Date.now()}.pdf`,
      'application/pdf',
      'pdf'
    );

    // Update book with PDF URL
    await prisma.book.update({
      where: { id: bookId },
      data: {
        pdfUrl,
        status: 'completed',
        generatedAt: new Date(),
        metadata: {
          chapters: chapters.length,
          stories: stories.length,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    return pdfUrl;
  } catch (error) {
    console.error('Error generating PDF:', error);

    // Update book status to failed
    await prisma.book.update({
      where: { id: bookId },
      data: { status: 'failed' },
    });

    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
