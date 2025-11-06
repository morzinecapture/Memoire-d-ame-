import { Worker, Job } from 'bullmq';
import { connection, AudioProcessingJobData } from '@/lib/queue';
import { prisma } from '@/lib/prisma';

/**
 * Stub function for Speech-to-Text conversion
 * In production, this would call an STT service like OpenAI Whisper, Google Speech-to-Text, etc.
 */
async function transcribeAudio(audioUrl: string): Promise<string> {
  // TODO: Implement actual STT service integration
  console.log('🎤 Transcribing audio:', audioUrl);

  // Stub implementation
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return "Je me souviens de mon enfance à la campagne. C'était une époque simple mais heureuse. Ma mère préparait toujours de délicieux repas, et mon père travaillait dans les champs du matin au soir. Les dimanches, toute la famille se réunissait autour de la grande table pour partager un repas ensemble.";
}

/**
 * Clean and normalize the transcript
 */
function cleanTranscript(transcript: string): string {
  return transcript
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'");
}

/**
 * Stub function for the "biographer" AI model
 * In production, this would call an LLM like GPT-4, Claude, etc.
 */
async function generateNarrative(
  _transcript: string,
  _questionText: string
): Promise<{
  narrative: Record<string, unknown>;
  tags: string[];
  era: string;
  theme: string;
  emotion: string;
  familyLink: string;
}> {
  // TODO: Implement actual LLM integration for narrative generation
  console.log('📝 Generating narrative from transcript...');

  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Stub implementation with structured narrative
  const narrative = {
    title: "Souvenirs d'enfance à la campagne",
    summary:
      "Un récit touchant sur l'enfance à la campagne, marqué par la simplicité, les repas familiaux et le travail de la terre.",
    chapters: [
      {
        title: 'La vie à la campagne',
        content:
          "L'enfance à la campagne était marquée par la simplicité et l'authenticité. Les journées suivaient le rythme des saisons et du travail agricole.",
        timestamp: 0,
      },
      {
        title: 'Les repas familiaux',
        content:
          'Les repas préparés par la mère étaient un moment de rassemblement. Les dimanches étaient particulièrement spéciaux avec toute la famille réunie.',
        timestamp: 30,
      },
      {
        title: 'Le travail de mon père',
        content:
          'Mon père consacrait ses journées au travail dans les champs, incarnant les valeurs du travail et de la persévérance.',
        timestamp: 60,
      },
    ],
    keyMoments: [
      'Les repas en famille le dimanche',
      'Le travail agricole quotidien',
      'La simplicité de la vie rurale',
    ],
    people: ['Mère', 'Père', 'Famille élargie'],
    places: ['Campagne', 'Champs', 'Maison familiale'],
  };

  return {
    narrative,
    tags: [
      'enfance',
      'campagne',
      'famille',
      'repas',
      'agriculture',
      'tradition',
    ],
    era: '1940s-1950s',
    theme: 'enfance',
    emotion: 'nostalgie',
    familyLink: 'parents',
  };
}

/**
 * Main audio processing worker
 */
export const audioWorker = new Worker<AudioProcessingJobData>(
  'audio-processing',
  async (job: Job<AudioProcessingJobData>) => {
    const { answerId, audioUrl, questionId } = job.data;

    console.log(`🎵 Processing audio for answer: ${answerId}`);

    try {
      // Update status to processing
      await prisma.answer.update({
        where: { id: answerId },
        data: { processingStatus: 'processing' },
      });

      // Step 1: Transcribe audio using STT (stub)
      await job.updateProgress(20);
      const rawTranscript = await transcribeAudio(audioUrl);

      // Step 2: Clean and normalize transcript
      await job.updateProgress(40);
      const cleanedTranscript = cleanTranscript(rawTranscript);

      // Step 3: Get question text for context
      const question = await prisma.question.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        throw new Error(`Question ${questionId} not found`);
      }

      // Step 4: Generate narrative using biographer model (stub)
      await job.updateProgress(60);
      const { narrative, tags, era, theme, emotion, familyLink } =
        await generateNarrative(cleanedTranscript, question.text);

      // Step 5: Persist the results
      await job.updateProgress(80);
      await prisma.answer.update({
        where: { id: answerId },
        data: {
          transcript: cleanedTranscript,
          narrativeJson: narrative as never,
          tags,
          era,
          theme,
          emotion,
          familyLink,
          processingStatus: 'completed',
        },
      });

      await job.updateProgress(100);
      console.log(`✅ Successfully processed audio for answer: ${answerId}`);

      return { success: true, answerId };
    } catch (error) {
      console.error(`❌ Error processing audio for answer: ${answerId}`, error);

      // Update status to failed
      await prisma.answer.update({
        where: { id: answerId },
        data: { processingStatus: 'failed' },
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: 3,
  }
);

// Worker event handlers
audioWorker.on('completed', (job) => {
  console.log(`✓ Job ${job.id} completed`);
});

audioWorker.on('failed', (job, err) => {
  console.error(`✗ Job ${job?.id} failed:`, err.message);
});

audioWorker.on('error', (err) => {
  console.error('Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await audioWorker.close();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...');
  await audioWorker.close();
});

console.log('🚀 Audio processing worker started');
