/**
 * Start Focus Session Modal
 * Modal for starting a new focus session with goal, subject, and duration
 */

import { useState } from 'react';

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: SessionConfig) => void;
}

export interface SessionConfig {
  goal: string;
  subject?: string;
  planned_duration: number;
  session_type: 'pomodoro' | 'deep_work' | 'custom';
}

const SESSION_PRESETS = [
  { label: 'Pomodoro (25 min)', duration: 25, type: 'pomodoro' as const },
  { label: 'Deep Work (50 min)', duration: 50, type: 'deep_work' as const },
  { label: 'Long Session (90 min)', duration: 90, type: 'custom' as const },
];

const SUBJECTS = [
  'Math',
  'Science',
  'English',
  'History',
  'Programming',
  'Art',
  'Music',
  'Other',
];

export default function StartSessionModal({ isOpen, onClose, onStart }: StartSessionModalProps) {
  const [goal, setGoal] = useState('');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState(25);
  const [sessionType, setSessionType] = useState<'pomodoro' | 'deep_work' | 'custom'>('pomodoro');
  const [customDuration, setCustomDuration] = useState(25);

  if (!isOpen) return null;

  const handlePresetClick = (preset: typeof SESSION_PRESETS[0]) => {
    setDuration(preset.duration);
    setSessionType(preset.type);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!goal.trim()) {
      alert('Please enter a goal for your session');
      return;
    }

    onStart({
      goal: goal.trim(),
      subject: subject || undefined,
      planned_duration: duration,
      session_type: sessionType,
    });

    // Reset form
    setGoal('');
    setSubject('');
    setDuration(25);
    setSessionType('pomodoro');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Start Focus Session</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Goal Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What are you working on? *
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Complete math homework, Study for exam..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Subject Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject (Optional)
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a subject...</option>
              {SUBJECTS.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Duration
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {SESSION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    duration === preset.duration
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Duration */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="180"
                value={customDuration}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setCustomDuration(val);
                  setDuration(val);
                  setSessionType('custom');
                }}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">minutes (custom)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
