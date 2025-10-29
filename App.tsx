import React, { useState, useCallback } from 'react';
import { MeditationForm } from './components/MeditationForm';
import { MeditationPlayer } from './components/MeditationPlayer';
import { ChatBot } from './components/ChatBot';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import type { MeditationSession, View } from './types';
import * as geminiService from './services/geminiService';
import { useTranslation } from './context/LanguageContext';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('generator');
  const [meditationSession, setMeditationSession] = useState<MeditationSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleGenerateMeditation = useCallback(async (topic: string, duration: string, style: string) => {
    setIsLoading(true);
    setError(null);
    setMeditationSession(null);

    try {
      setLoadingMessage("loading.script");
      const script = await geminiService.generateMeditationScript(topic, duration, style);
      if (!script) throw new Error("Failed to generate script.");

      setLoadingMessage("loading.visual");
      const imagePrompt = `A serene, tranquil, and beautiful digital art masterpiece representing ${style} meditation on the topic of ${topic}. Photorealistic, calming colors, peaceful atmosphere.`;
      const imageUrl = await geminiService.generateMeditationImage(imagePrompt);
      if (!imageUrl) throw new Error("Failed to generate image.");
      
      setCustomBackground(imageUrl); // Set the generated image as background

      setLoadingMessage("loading.voiceover");
      const audioData = await geminiService.generateMeditationAudio(script);
      if (!audioData) throw new Error("Failed to generate audio.");

      setMeditationSession({ script, imageUrl, audioData });
      setCurrentView('player');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("Meditation generation failed:", err);
      setError(errorMessage);
      setCustomBackground(null); // Reset background on error
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleBackToGenerator = () => {
    setMeditationSession(null);
    setCurrentView('generator');
    setCustomBackground(null); // Reset background
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="text-center p-8 bg-red-900/50 rounded-lg">
          <h2 className="text-2xl font-bold text-red-300 mb-4">{t('error.generationFailedTitle')}</h2>
          <p className="text-red-200">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-6 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            {t('error.tryAgainButton')}
          </button>
        </div>
      );
    }
    
    switch (currentView) {
      case 'player':
        return meditationSession ? (
          <MeditationPlayer session={meditationSession} onBack={handleBackToGenerator} />
        ) : (
          <MeditationForm onSubmit={handleGenerateMeditation} isLoading={isLoading} />
        );
      case 'chat':
        return <ChatBot />;
      case 'generator':
      default:
        return <MeditationForm onSubmit={handleGenerateMeditation} isLoading={isLoading} />;
    }
  };

  return (
    <div 
      className="min-h-screen font-sans antialiased transition-all duration-500"
      style={{
        backgroundImage: customBackground
          ? `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${customBackground}')`
          : `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://scontent-cdg4-1.xx.fbcdn.net/v/t39.30808-6/572950823_2236029110212638_6898678414235425349_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=127cfc&_nc_ohc=FQuL-lNLiDUQ7kNvwFzLPNU&_nc_oc=AdnxVtWPEdPOMy03y4WNUJxKEiL3cYkE_X87cXUWH5pw3WsETpKjC8f0UUB-WIq--5a8xhRnQObfizQkQwsCbsVW&_nc_zt=23&_nc_ht=scontent-cdg4-1.xx&_nc_gid=TdVxOU3HZkLkj3GX0QZ0wg&oh=00_Affrl5P440RkRi-0-kSFcXzr08vz78ZmlJzRpQC9QsWTsw&oe=690798CC')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {isLoading && <Loader message={loadingMessage} />}
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;