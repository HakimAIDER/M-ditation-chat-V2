import { useState, useRef, useEffect, useCallback } from 'react';
import { decode, decodeAudioData } from '../utils/audioUtils';
import type { UseAudioPlayerReturn } from '../types';

const SAMPLE_RATE = 24000;
const NUM_CHANNELS = 1;

export const useAudioPlayer = (base64AudioData: string, playbackRate: number): UseAudioPlayerReturn => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: SAMPLE_RATE
          });
        }
        
        const decodedBytes = decode(base64AudioData);
        const buffer = await decodeAudioData(decodedBytes, audioContextRef.current, SAMPLE_RATE, NUM_CHANNELS);
        audioBufferRef.current = buffer;
      } catch (err) {
        console.error("Failed to initialize audio:", err);
        setError("player.audioErrorBody");
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAudio();

    return () => {
      // Cleanup on unmount or when audio data changes
      if (sourceNodeRef.current) {
        try {
            sourceNodeRef.current.stop();
        } catch (e) {
            // Ignore errors on stopping, as the node might have already finished.
        }
      }
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close().catch(console.error);
      }
      audioContextRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base64AudioData]);

  useEffect(() => {
    if (sourceNodeRef.current) {
        sourceNodeRef.current.playbackRate.value = playbackRate;
    }
  }, [playbackRate]);

  const play = useCallback(() => {
    if (!audioContextRef.current || !audioBufferRef.current || isPlaying || error) return;

    // Resume context if suspended
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = playbackRate;
    source.connect(audioContextRef.current.destination);
    source.start();
    source.onended = () => {
      setIsPlaying(false);
      sourceNodeRef.current = null;
    };

    sourceNodeRef.current = source;
    setIsPlaying(true);
  }, [isPlaying, error, playbackRate]);

  const pause = useCallback(() => {
    if (!sourceNodeRef.current || !isPlaying) return;
    try {
        sourceNodeRef.current.stop();
    } catch(e) {
        console.warn("Error stopping audio source:", e);
    }
    // onended will handle setting isPlaying to false
  }, [isPlaying]);

  const togglePlayPause = useCallback(() => {
    if (isLoading || error) return;
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isLoading, isPlaying, pause, play, error]);

  return { isPlaying, togglePlayPause, isLoading, error };
};