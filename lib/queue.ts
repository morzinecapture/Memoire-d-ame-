import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

export interface AudioProcessingJobData {
  answerId: string;
  audioUrl: string;
  questionId: string;
  relativeId: string;
}

export interface PDFGenerationJobData {
  bookId: string;
  userId: string;
  year: number;
}

// Audio processing queue
export const audioQueue = new Queue<AudioProcessingJobData>(
  'audio-processing',
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 86400, // Keep completed jobs for 24 hours
        count: 100,
      },
      removeOnFail: {
        age: 604800, // Keep failed jobs for 7 days
      },
    },
  }
);

// PDF generation queue
export const pdfQueue = new Queue<PDFGenerationJobData>('pdf-generation', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400,
      count: 50,
    },
    removeOnFail: {
      age: 604800,
    },
  },
});

// Queue events for monitoring
export const audioQueueEvents = new QueueEvents('audio-processing', {
  connection,
});
export const pdfQueueEvents = new QueueEvents('pdf-generation', {
  connection,
});

// Helper function to add audio processing job
export async function addAudioProcessingJob(data: AudioProcessingJobData) {
  return await audioQueue.add('process-audio', data, {
    jobId: `audio-${data.answerId}`,
  });
}

// Helper function to add PDF generation job
export async function addPDFGenerationJob(data: PDFGenerationJobData) {
  return await pdfQueue.add('generate-pdf', data, {
    jobId: `pdf-${data.bookId}`,
  });
}

// Graceful shutdown
export async function closeQueues() {
  await audioQueue.close();
  await pdfQueue.close();
  await audioQueueEvents.close();
  await pdfQueueEvents.close();
  await connection.quit();
}

export { connection };
