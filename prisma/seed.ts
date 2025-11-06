import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });
  console.log('✓ Created test user:', user.email);

  // Create a relative
  const relative = await prisma.relative.upsert({
    where: { id: 'seed-relative-1' },
    update: {},
    create: {
      id: 'seed-relative-1',
      firstName: 'Marie',
      lastName: 'Dupont',
      birthDate: new Date('1945-03-15'),
      relation: 'grand-mère',
      bio: 'Une femme remarquable qui a vécu la guerre et la reconstruction.',
      userId: user.id,
    },
  });
  console.log(
    '✓ Created relative:',
    `${relative.firstName} ${relative.lastName}`
  );

  // Create sample questions
  const questions = [
    {
      text: 'Parlez-moi de votre enfance. Où avez-vous grandi?',
      category: 'enfance',
      order: 1,
    },
    {
      text: 'Quel est votre plus beau souvenir de famille?',
      category: 'famille',
      order: 2,
    },
    {
      text: 'Quelle a été votre première profession?',
      category: 'carrière',
      order: 3,
    },
    {
      text: 'Comment avez-vous rencontré votre conjoint(e)?',
      category: 'amour',
      order: 4,
    },
    {
      text: 'Quelle époque de votre vie a été la plus heureuse?',
      category: 'réflexion',
      order: 5,
    },
  ];

  for (const q of questions) {
    await prisma.question.upsert({
      where: { id: `seed-question-${q.order}` },
      update: {},
      create: {
        id: `seed-question-${q.order}`,
        ...q,
      },
    });
  }
  console.log(`✓ Created ${questions.length} sample questions`);

  // Create a sample answer
  const answer = await prisma.answer.create({
    data: {
      audioUrl: 'https://example.com/audio/sample.mp3',
      audioSize: 1024000,
      audioDuration: 180,
      transcript: 'Je me souviens de mon enfance à la campagne...',
      tags: ['enfance', 'campagne', 'famille'],
      era: '1950s',
      theme: 'enfance',
      emotion: 'nostalgie',
      processingStatus: 'completed',
      questionId: 'seed-question-1',
      relativeId: relative.id,
    },
  });
  console.log('✓ Created sample answer');

  // Create a story
  const story = await prisma.story.create({
    data: {
      title: "Souvenirs d'enfance",
      description: 'Les premiers souvenirs de Marie à la campagne',
      era: '1945-1955',
      theme: 'Enfance et famille',
      order: 1,
      userId: user.id,
      relativeId: relative.id,
      answers: {
        create: {
          answerId: answer.id,
          order: 1,
        },
      },
    },
  });
  console.log('✓ Created sample story:', story.title);

  // Create a book for the current year
  const currentYear = new Date().getFullYear();
  const book = await prisma.book.upsert({
    where: {
      userId_year: {
        userId: user.id,
        year: currentYear,
      },
    },
    update: {},
    create: {
      year: currentYear,
      title: `Mémoires ${currentYear}`,
      status: 'draft',
      userId: user.id,
    },
  });
  console.log('✓ Created book:', book.title);

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
