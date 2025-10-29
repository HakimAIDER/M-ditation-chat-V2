
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage, GroundingSource } from '../types';
import type { Chat } from '@google/genai';
import * as geminiService from '../services/geminiService';
import { useTranslation } from '../context/LanguageContext';

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    const initializeChat = () => {
        chatRef.current = geminiService.createChat();
         setMessages([{
            id: 'init',
            role: 'model',
            text: t('chatbot.greeting')
        }]);
    };
    initializeChat();
  }, [t]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chatRef.current) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const modelMessageId = (Date.now() + 1).toString();
    // Initialize model message with empty sources
    setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '', sources: [] }]);

    let finalSources: GroundingSource[] = [];

    try {
      const stream = await chatRef.current.sendMessageStream({ message: input });
      for await (const chunk of stream) {
          const chunkText = chunk.text;

          // Collect grounding sources from chunks
          const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (groundingChunks) {
              const newSources: GroundingSource[] = groundingChunks
                .map(c => c.web)
                .filter((web): web is { uri: string; title: string } => !!(web?.uri && web.title))
                .map(web => ({ uri: web.uri, title: web.title }));

              newSources.forEach(ns => {
                if (!finalSources.some(fs => fs.uri === ns.uri)) {
                  finalSources.push(ns);
                }
              });
          }
          
          // Stream text to UI
          setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, text: msg.text + chunkText } : msg
          ));
      }

      // After stream is complete, update the message with the final list of sources
      setMessages(prev => prev.map(msg => 
          msg.id === modelMessageId ? { ...msg, sources: finalSources } : msg
      ));

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.map(msg => 
          msg.id === modelMessageId ? { ...msg, text: 'Sorry, I encountered an error. Please try again.' } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  return (
    <div className="bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700 flex flex-col h-[75vh]">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold text-center text-white">{t('chatbot.title')}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
              message.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-200 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap">{message.text || '...'}</p>
            </div>
             {message.sources && message.sources.length > 0 && (
                <div className="mt-2 max-w-xs md:max-w-md lg:max-w-lg">
                    <div className="flex flex-wrap gap-2">
                        {message.sources.map((source, index) => (
                            <a
                                key={index}
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={source.title}
                                className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full transition-colors duration-200 ${
                                    index === 0
                                    ? 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30'
                                    : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                {index === 0 && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 text-teal-400">
                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                                </svg>
                                )}
                                <span className="truncate" style={{maxWidth: '200px'}}>{source.title}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
          </div>
        ))}
         {isLoading && messages[messages.length-1].role === 'user' && (
            <div className="flex justify-start">
                <div className="max-w-xs px-4 py-2 rounded-2xl bg-slate-700 text-slate-200 rounded-bl-none">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-slate-700">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chatbot.placeholder')}
            className="flex-1 bg-slate-900 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:opacity-50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white font-bold p-3 rounded-lg transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    </div>
  );
};
