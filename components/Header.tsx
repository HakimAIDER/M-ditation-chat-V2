
import React from 'react';
import type { View, Language } from '../types';
import { useTranslation } from '../context/LanguageContext';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        isActive
          ? 'bg-indigo-500 text-white'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
};

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useTranslation();
    const languages: { code: Language; label: string }[] = [
        { code: 'en', label: 'EN' },
        { code: 'fr', label: 'FR' },
        { code: 'es', label: 'ES' },
    ];

    return (
        <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg">
            {languages.map(({ code, label }) => (
                <button
                    key={code}
                    onClick={() => setLanguage(code)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors duration-200 ${
                        language === code
                            ? 'bg-indigo-500 text-white'
                            : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
};


export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
  const { t } = useTranslation();
  return (
    <header className="bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-800">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-8 0 4 4 0 0 1-8 0 10 10 0 0 0 10-10z"></path></svg>
          <h1 className="text-xl font-bold text-white tracking-tight">{t('appName')}</h1>
        </div>
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-lg">
               <NavButton 
                label={t('header.generator')}
                isActive={currentView === 'generator' || currentView === 'player'} 
                onClick={() => setCurrentView('generator')} 
              />
              <NavButton 
                label={t('header.chatAssistant')}
                isActive={currentView === 'chat'} 
                onClick={() => setCurrentView('chat')} 
              />
            </div>
            <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
};
