/**
 * Active Focus Session Timer
 * Displays timer, progress, and controls for active focus session
 */

import { useEffect, useState } from 'react';

interface ActiveSessionTimerProps {
  session: {
    id: string;
    goal: string;
    subject?: string;
    startTime: number;
    plannedDuration: number;
    status: 'active' | 'paused';
  };
  elapsedSeconds: number;
  remainingSeconds: number;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
}

export default function ActiveSessionTimer({
  session,
  elapsedSeconds,
  remainingSeconds,
  onPause,
  onResume,
  onEnd,
}: ActiveSessionTimerProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalSeconds = session.plannedDuration * 60;
    const progressPercent = (elapsedSeconds / totalSeconds) * 100;
    setProgress(Math.min(progressPercent, 100));
  }, [elapsedSeconds, session.plannedDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isPaused = session.status === 'paused';

  return (
    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
      <div className="space-y-6">
        {/* Session Info */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">{session.goal}</h2>
            {session.subject && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                {session.subject}
              </span>
            )}
          </div>
          {isPaused && (
            <div className="flex items-center gap-2 text-yellow-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Session Paused</span>
            </div>
          )}
        </div>

        {/* Timer Display */}
        <div className="text-center">
          <div className="relative inline-block">
            {/* Progress Ring */}
            <svg className="w-48 h-48 transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-white/20"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                className="text-white transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>

            {/* Time Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-bold font-mono">
                {formatTime(remainingSeconds)}
              </div>
              <div className="text-sm opacity-75 mt-1">remaining</div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{formatTime(elapsedSeconds)}</div>
            <div className="text-sm opacity-75">Elapsed</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
            <div className="text-sm opacity-75">Complete</div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3">
          {isPaused ? (
            <button
              onClick={onResume}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Resume
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Pause
            </button>
          )}

          <button
            onClick={onEnd}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
            End Session
          </button>
        </div>
      </div>
    </div>
  );
}
