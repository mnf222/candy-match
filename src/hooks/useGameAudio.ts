import { useRef, useCallback } from 'react';

export function useGameAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTone = useCallback((freq: number, type: OscillatorType, duration: number, vol = 0.1) => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error("Audio error", e);
    }
  }, []);

  const playSwap = useCallback(() => {
    playTone(350, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(450, 'sine', 0.1, 0.1), 50);
  }, [playTone]);

  const playInvalid = useCallback(() => {
    playTone(150, 'sawtooth', 0.2, 0.1);
  }, [playTone]);

  const playCrush = useCallback((combo: number = 1) => {
    const baseFreq = 440 + (combo * 80); // Pitch goes up with combo
    playTone(baseFreq, 'sine', 0.15, 0.15);
    setTimeout(() => playTone(baseFreq * 1.25, 'sine', 0.15, 0.15), 100);
  }, [playTone]);

  const playLevelClear = useCallback(() => {
    [440, 554, 659, 880].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 'sine', 0.2, 0.15), i * 150);
    });
  }, [playTone]);

  const playGameOver = useCallback(() => {
    [300, 280, 250, 200].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 'sawtooth', 0.3, 0.1), i * 200);
    });
  }, [playTone]);

  return { playSwap, playInvalid, playCrush, playLevelClear, playGameOver };
}
