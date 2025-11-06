import { Worker, Job } from 'bullmq';
import { connection, PDFGenerationJobData } from '@/lib/queue';
import { generateBookPDF } from '@/pdf/generator';

/**
 * PDF generation worker
 */
export const pdfWorker = new Worker<PDFGenerationJobData>(
  'pdf-generation',
  async (job: Job<PDFGenerationJobData>) => {
    const { bookId, userId, year } = job.data;

    console.log(`📄 Generating PDF for book: ${bookId} (year: ${year})`);

    try {
      await job.updateProgress(10);

      // Generate the PDF
      const pdfUrl = await generateBookPDF({
        bookId,
        userId,
        year,
      });

      await job.updateProgress(100);
      console.log(`✅ Successfully generated PDF for book: ${bookId}`);
      console.log(`   PDF URL: ${pdfUrl}`);

      return { success: true, bookId, pdfUrl };
    } catch (error) {
      console.error(`❌ Error generating PDF for book: ${bookId}`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 1, // Generate one PDF at a time to avoid resource issues
  }
);

// Worker event handlers
pdfWorker.on('completed', (job) => {
  console.log(`✓ PDF generation job ${job.id} completed`);
});

pdfWorker.on('failed', (job, err) => {
  console.error(`✗ PDF generation job ${job?.id} failed:`, err.message);
});

pdfWorker.on('error', (err) => {
  console.error('PDF worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing PDF worker...');
  await pdfWorker.close();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing PDF worker...');
  await pdfWorker.close();
});

console.log('🚀 PDF generation worker started');
