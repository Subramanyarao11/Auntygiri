/**
 * Focus Mode Page Component
 * Complete focus session management with timer, history, and analytics
 */

import { useState, useEffect } from 'react';
import StartSessionModal, { type SessionConfig } from './StartSessionModal';
import ActiveSessionTimer from './ActiveSessionTimer';

// Window.electron is already defined in the preload script

interface LocalFocusSession {
  id: string;
  goal: string;
  subject?: string;
  startTime: number;
  plannedDuration: number;
  sessionType: string;
  status: 'active' | 'paused';
  pauseCount: number;
  totalPauseDuration: number;
  activityCount: number;
  appSwitchCount: number;
  distractionCount: number;
}

export default function FocusModePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<LocalFocusSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [todaySessions, setTodaySessions] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);

  // Check for active session on mount
  useEffect(() => {
    checkActiveSession();
    fetchTodayStats();
  }, []);

  // Listen for timer ticks from main process
  useEffect(() => {
    // Timer ticks will be handled by polling for now
    // TODO: Add event listener support to preload script
    const intervalId = setInterval(() => {
      if (activeSession) {
        const elapsed = Math.floor((Date.now() - activeSession.startTime) / 1000);
        const total = activeSession.plannedDuration * 60;
        setElapsedSeconds(elapsed);
        setRemainingSeconds(Math.max(0, total - elapsed));
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [activeSession]);

  const checkActiveSession = async () => {
    try {
      const result = await window.electron.focus.getActiveSession();
      if (result && result.success && result.session) {
        setActiveSession(result.session);
        // Calculate elapsed/remaining time
        const elapsed = Math.floor((Date.now() - result.session.startTime) / 1000);
        const total = result.session.plannedDuration * 60;
        setElapsedSeconds(elapsed);
        setRemainingSeconds(Math.max(0, total - elapsed));
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async (config: SessionConfig) => {
    try {
      const result = await window.electron.focus.startSession(config);
      if (result && result.success && result.session) {
        setActiveSession(result.session);
        setIsModalOpen(false);
      } else {
        alert(result?.error || 'Failed to start focus session');
      }
    } catch (error: any) {
      console.error('Error starting session:', error);
      alert(error.message || 'Failed to start focus session. Please try again.');
    }
  };

  const handlePause = async () => {
    try {
      await window.electron.focus.pauseSession();
      setActiveSession((prev) => prev ? { ...prev, status: 'paused' } : null);
    } catch (error: any) {
      console.error('Error pausing session:', error);
      alert(error.message || 'Failed to pause session');
    }
  };

  const handleResume = async () => {
    try {
      await window.electron.focus.resumeSession();
      setActiveSession((prev) => prev ? { ...prev, status: 'active' } : null);
    } catch (error: any) {
      console.error('Error resuming session:', error);
      alert(error.message || 'Failed to resume session');
    }
  };

  const fetchTodayStats = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      
      const result = await window.electron.focus.getSessionHistory({ 
        startDate: startOfDay, 
        endDate: endOfDay 
      });
      
      if (result && result.success && result.sessions) {
        setTodaySessions(result.sessions.length);
        
        // Calculate total focus time in hours
        const totalMinutes = result.sessions.reduce((sum: number, session: any) => {
          return sum + (session.actual_duration || 0);
        }, 0);
        setTotalFocusTime(Math.round(totalMinutes / 60 * 10) / 10); // Round to 1 decimal
      }
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  };

  const handleEnd = async () => {
    if (!confirm('Are you sure you want to end this focus session?')) {
      return;
    }

    try {
      const result = await window.electron.focus.endSession();
      setActiveSession(null);
      setElapsedSeconds(0);
      setRemainingSeconds(0);
      
      // Refresh stats
      fetchTodayStats();
      
      // Show summary
      if (result && result.success && result.summary) {
        alert(`Session completed!\n\nFocus Score: ${result.summary.focus_score || 'N/A'}\nDuration: ${result.summary.actual_duration || 0} minutes`);
      }
    } catch (error: any) {
      console.error('Error ending session:', error);
      alert(error.message || 'Failed to end session');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Focus Mode</h1>
        <p className="text-gray-600">Start a focus session to boost your productivity</p>
      </div>

      {activeSession ? (
        <ActiveSessionTimer
          session={activeSession}
          elapsedSeconds={elapsedSeconds}
          remainingSeconds={remainingSeconds}
          onPause={handlePause}
          onResume={handleResume}
          onEnd={handleEnd}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Session</h2>
              <p className="text-gray-600 mb-6">
                Start a focus session to track your productivity and stay focused on your goals.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Start Focus Session
            </button>
          </div>
        </div>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600">Today's Sessions</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{todaySessions}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600">Total Focus Time</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{totalFocusTime}h</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600">Avg Focus Score</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">--</div>
        </div>
      </div>

      <StartSessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStart={handleStartSession}
      />
    </div>
  );
}

