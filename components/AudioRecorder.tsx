'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioRecorderProps {
  questionId: string;
  questionText: string;
  relativeId: string;
  onRecordingComplete?: (blob: Blob, duration: number) => void;
}

export default function AudioRecorder({
  questionId,
  questionText,
  relativeId,
  onRecordingComplete,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        if (onRecordingComplete) {
          onRecordingComplete(blob, duration);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert(
        "Impossible d'accéder au microphone. Veuillez vérifier vos permissions."
      );
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setTranscript('');
    chunksRef.current = [];
  };

  const submitRecording = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('questionId', questionId);
      formData.append('relativeId', relativeId);
      formData.append('duration', duration.toString());

      const response = await fetch('/api/answers/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setTranscript(data.transcript || 'Traitement en cours...');

      alert('Enregistrement envoyé avec succès!');
      resetRecording();
    } catch (error) {
      console.error('Error submitting recording:', error);
      alert("Erreur lors de l'envoi de l'enregistrement");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg">
      {/* Question */}
      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-gray-800">
          Question de la semaine
        </h2>
        <p className="text-lg text-gray-700">{questionText}</p>
      </div>

      {/* Recording Controls */}
      <div className="space-y-6">
        {/* Timer and Status */}
        <div className="flex items-center justify-center">
          <div className="rounded-full bg-indigo-100 px-8 py-4">
            <div className="flex items-center space-x-3">
              {isRecording && (
                <div className="h-3 w-3 animate-pulse rounded-full bg-red-500"></div>
              )}
              <span className="font-mono text-3xl font-bold text-indigo-600">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {isRecording && (
          <div className="w-full">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-indigo-600 transition-all duration-1000"
                style={{
                  width: `${Math.min((duration / 600) * 100, 100)}%`,
                }}
              ></div>
            </div>
            <p className="mt-2 text-center text-sm text-gray-500">
              Maximum: 10 minutes
            </p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4">
          {!isRecording && !audioBlob && (
            <button
              onClick={startRecording}
              className="flex items-center space-x-2 rounded-full bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
              aria-label="Commencer l'enregistrement"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <span>Commencer</span>
            </button>
          )}

          {isRecording && !isPaused && (
            <>
              <button
                onClick={pauseRecording}
                className="flex items-center space-x-2 rounded-full bg-yellow-500 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-yellow-600 focus:outline-none focus:ring-4 focus:ring-yellow-300"
                aria-label="Pause"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                <span>Pause</span>
              </button>
              <button
                onClick={stopRecording}
                className="flex items-center space-x-2 rounded-full bg-red-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
                aria-label="Arrêter l'enregistrement"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect width="12" height="12" x="6" y="6" />
                </svg>
                <span>Arrêter</span>
              </button>
            </>
          )}

          {isRecording && isPaused && (
            <>
              <button
                onClick={resumeRecording}
                className="flex items-center space-x-2 rounded-full bg-green-500 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300"
                aria-label="Reprendre"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Reprendre</span>
              </button>
              <button
                onClick={stopRecording}
                className="flex items-center space-x-2 rounded-full bg-red-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
                aria-label="Arrêter l'enregistrement"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect width="12" height="12" x="6" y="6" />
                </svg>
                <span>Arrêter</span>
              </button>
            </>
          )}
        </div>

        {/* Audio Playback and Actions */}
        {audioBlob && !isRecording && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-6">
              <audio controls src={audioUrl || undefined} className="w-full">
                Votre navigateur ne supporte pas la lecture audio.
              </audio>
            </div>

            {transcript && (
              <div className="rounded-lg bg-blue-50 p-6">
                <h3 className="mb-2 font-semibold text-blue-900">
                  Aperçu de la transcription:
                </h3>
                <p className="text-gray-700">{transcript}</p>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={resetRecording}
                className="rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200"
                aria-label="Réenregistrer"
              >
                Réenregistrer
              </button>
              <button
                onClick={submitRecording}
                disabled={isProcessing}
                className="rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Envoyer l'enregistrement"
              >
                {isProcessing ? 'Envoi en cours...' : 'Envoyer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
