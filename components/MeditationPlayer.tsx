import React, { useState } from 'react';
import type { MeditationSession } from '../types';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useTranslation } from '../context/LanguageContext';

interface MeditationPlayerProps {
  session: MeditationSession;
  onBack: () => void;
}

export const MeditationPlayer: React.FC<MeditationPlayerProps> = ({ session, onBack }) => {
  const [playbackRate, setPlaybackRate] = useState(1);
  const { isPlaying, togglePlayPause, isLoading, error, isFinished } = useAudioPlayer(session.audioData, playbackRate);
  const { t } = useTranslation();
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const handleFeedback = (feedback: 'up' | 'down') => {
    try {
      const feedbackHistory = JSON.parse(localStorage.getItem('zenith-meditation-feedback') || '[]');
      const newFeedback = {
        sessionIdentifier: session.script.substring(0, 150) + '...', // Use a snippet as a pseudo-ID
        feedback,
        timestamp: new Date().toISOString(),
      };
      feedbackHistory.push(newFeedback);
      localStorage.setItem('zenith-meditation-feedback', JSON.stringify(feedbackHistory));
    } catch (e) {
      console.error("Failed to save feedback to localStorage", e);
    }
    setFeedbackGiven(true);
  };

  const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
  );

  const PauseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
  );
  
  const LoaderIcon = () => (
     <svg className="animate-spin h-12 w-12 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const ThumbsUpIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
  );

  const ThumbsDownIcon = () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v7a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
  );

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-slate-700 min-h-[70vh] flex flex-col justify-between">
      <img src={session.imageUrl} alt="Meditation Background" className="absolute top-0 left-0 w-full h-full object-cover z-0" />
      <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-10"></div>

      <div className="relative z-20 p-6 flex justify-end">
        <button onClick={onBack} className="bg-slate-800/70 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          &larr; {t('player.newSessionButton')}
        </button>
      </div>
      
      <div className="relative z-20 p-6 sm:p-8 flex-grow overflow-y-auto text-center flex flex-col items-center justify-center">
        <div className="max-w-2xl bg-slate-900/70 backdrop-blur-md p-6 rounded-xl">
           <h3 className="text-xl font-semibold mb-4 text-indigo-300">{t('player.scriptTitle')}</h3>
           <p className="text-slate-200 leading-relaxed text-left max-h-60 overflow-y-auto pr-2">{session.script}</p>
        </div>
      </div>
      
      <div className="relative z-20 p-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center justify-center space-y-4 min-h-[220px]">
        {error && (
            <div className="bg-red-900/70 text-red-200 p-3 rounded-lg text-center max-w-md">
              <p className="font-semibold">{t('player.audioErrorTitle')}</p>
              <p className="text-sm">{t(error)}</p>
            </div>
        )}

        {isFinished && !error ? (
          <div className="text-center transition-opacity duration-500 ease-in-out">
            {feedbackGiven ? (
                <p className="text-lg text-indigo-300 font-semibold">{t('player.feedback.thanks')}</p>
            ) : (
                <>
                <p className="text-lg text-white mb-4">{t('player.feedback.prompt')}</p>
                <div className="flex space-x-6">
                    <button 
                    onClick={() => handleFeedback('up')}
                    className="w-20 h-20 bg-green-500/80 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-400"
                    aria-label="Good session"
                    >
                        <ThumbsUpIcon />
                    </button>
                    <button 
                    onClick={() => handleFeedback('down')}
                    className="w-20 h-20 bg-red-500/80 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-400"
                    aria-label="Bad session"
                    >
                        <ThumbsDownIcon />
                    </button>
                </div>
                </>
            )}
          </div>
        ) : (
          <>
            <button 
              onClick={togglePlayPause} 
              disabled={isLoading || !!error}
              className="w-20 h-20 bg-indigo-600/80 rounded-full flex items-center justify-center text-white hover:bg-indigo-500 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-indigo-400 disabled:bg-slate-600 disabled:scale-100 disabled:cursor-not-allowed"
              aria-label={isPlaying ? 'Pause meditation' : 'Play meditation'}
            >
              {isLoading ? <LoaderIcon /> : (isPlaying ? <PauseIcon /> : <PlayIcon />)}
            </button>

            <div className="w-full max-w-xs text-center pt-2">
                <label htmlFor="playback-speed" className="text-xs text-slate-400 mb-2 block font-medium">{t('player.speedLabel')}</label>
                <div className="flex items-center space-x-3">
                    <span className="text-xs text-slate-400">0.5x</span>
                    <input
                        id="playback-speed"
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.25"
                        value={playbackRate}
                        onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-50"
                        disabled={isLoading || !!error}
                        aria-label="Playback speed"
                    />
                    <span className="text-xs text-slate-400">2.0x</span>
                </div>
                <div className="text-sm font-semibold text-white mt-1" aria-live="polite">
                    {playbackRate.toFixed(2)}x
                </div>
            </div>

            <p className="text-slate-400 text-sm">
                {error ? t('player.status.playbackUnavailable') : (isLoading ? t('player.status.preparingAudio') : (isPlaying ? t('player.status.playing') : t('player.status.paused')))}
            </p>
          </>
        )}
      </div>
    </div>
  );
};