import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AudioRecorder from '@/components/AudioRecorder';

export default async function WeeklyQuestionsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Get the current week's questions
  const questions = await prisma.question.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      order: 'asc',
    },
    take: 5, // Get 5 questions for the week
  });

  // Get user's relatives
  const relatives = await prisma.relative.findMany({
    where: {
      userId: session.user.id,
    },
  });

  // If no relatives, prompt to create one
  if (relatives.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <h1 className="mb-4 text-3xl font-bold text-gray-800">
              Questions de la semaine
            </h1>
            <p className="mb-6 text-gray-600">
              Pour commencer, vous devez d&apos;abord ajouter un proche à
              interviewer.
            </p>
            <a
              href="/relatives/new"
              className="inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Ajouter un proche
            </a>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[0];
  const defaultRelative = relatives[0];

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <h1 className="mb-4 text-3xl font-bold text-gray-800">
              Questions de la semaine
            </h1>
            <p className="text-gray-600">
              Aucune question disponible pour le moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">
            Questions de la semaine
          </h1>
          <p className="text-lg text-gray-600">
            Capturez les histoires de {defaultRelative.firstName}{' '}
            {defaultRelative.lastName}
          </p>
        </div>

        {/* Audio Recorder */}
        <AudioRecorder
          questionId={currentQuestion.id}
          questionText={currentQuestion.text}
          relativeId={defaultRelative.id}
        />

        {/* All Questions Preview */}
        <div className="mt-12 rounded-lg bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">
            Toutes les questions de cette semaine
          </h2>
          <ul className="space-y-4">
            {questions.map((q: (typeof questions)[number], index: number) => (
              <li
                key={q.id}
                className="flex items-start space-x-4 rounded-lg border border-gray-200 p-4 transition hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-600">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700">{q.text}</p>
                  <span className="mt-1 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {q.category}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Tips Section */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="mb-3 text-lg font-semibold text-blue-900">
            Conseils pour un bon enregistrement
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>Trouvez un endroit calme sans bruit de fond</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>
                Parlez clairement et à une distance confortable du microphone
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>
                Prenez votre temps, il n&apos;y a pas de limite de durée
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">•</span>
              <span>N&apos;hésitez pas à faire une pause si nécessaire</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
