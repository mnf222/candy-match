/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Frown, Sparkles, RefreshCcw } from 'lucide-react';
import { Candy } from './types';
import { LEVELS, GRID_SIZE } from './constants';
import { generateBoard, evaluateBoard, checkForMatches, applyGravity } from './utils/gameLogic';
import { Header } from './components/Header';
import { Modal } from './components/Modal';
import { useGameAudio } from './hooks/useGameAudio';
import { ParticleOverlay, ParticleOverlayRef } from './components/ParticleOverlay';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export default function App() {
  const [board, setBoard] = useState<(Candy | null)[]>([]);
  const [levelIndex, setLevelIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  
  const [showLevelClear, setShowLevelClear] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameBeaten, setGameBeaten] = useState(false);

  const audio = useGameAudio();
  const particlesRef = useRef<ParticleOverlayRef>(null);

  // Initialize Level
  const initLevel = (idx: number) => {
    if (idx >= LEVELS.length) {
      setGameBeaten(true);
      return;
    }
    const level = LEVELS[idx];
    setBoard(generateBoard(level.colors));
    setScore(0);
    setMoves(level.moves);
    setLevelIndex(idx);
    setShowLevelClear(false);
    setShowGameOver(false);
    setIsProcessing(false);
    setSelectedIdx(null);
  };

  useEffect(() => {
    initLevel(0);
  }, []);

  // Check Win/Loss conditions when processing finishes
  useEffect(() => {
    if (!isProcessing && board.length > 0) {
      const target = LEVELS[levelIndex].target;
      if (score >= target && !showLevelClear) {
        audio.playLevelClear();
        setShowLevelClear(true);
      } else if (moves <= 0 && !showLevelClear && !showGameOver) {
        audio.playGameOver();
        setShowGameOver(true);
      }
    }
  }, [isProcessing, score, moves, levelIndex, board.length, showLevelClear, showGameOver, audio]);

  const attemptSwap = async (idx1: number, idx2: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setSelectedIdx(null);
    audio.playSwap();

    // Optimistic Swap
    const newBoard = [...board];
    [newBoard[idx1], newBoard[idx2]] = [newBoard[idx2], newBoard[idx1]];
    setBoard([...newBoard]);
    
    // Wait for the swap animation
    await delay(300);

    const matches = checkForMatches(newBoard);
    
    if (matches.size === 0) {
      // Revert Swap if invalid
      audio.playInvalid();
      const revertBoard = [...newBoard];
      [revertBoard[idx1], revertBoard[idx2]] = [revertBoard[idx2], revertBoard[idx1]];
      setBoard(revertBoard);
      await delay(300);
      setIsProcessing(false);
    } else {
      // Valid move
      setMoves(m => Math.max(0, m - 1));
      await processCascades(newBoard, 1, [idx1, idx2]);
    }
  };

  const processCascades = async (currentBoard: (Candy | null)[], combo: number, swapIndices?: number[]) => {
    const { crushSet, specialsToCreate } = evaluateBoard(currentBoard, swapIndices);
    
    if (crushSet.size === 0) {
      setIsProcessing(false);
      return;
    }

    // Add Score
    const points = Array.from(crushSet).length * 10 * combo;
    setScore(s => s + points);

    audio.playCrush(combo);
    particlesRef.current?.burst(Array.from(crushSet));

    // Crush Matches
    const crushedBoard = [...currentBoard];
    crushSet.forEach(idx => crushedBoard[idx] = null);
    
    // Spawn Specials before gravity
    specialsToCreate.forEach(s => {
      crushedBoard[s.index] = {
        id: crypto.randomUUID(),
        color: s.color,
        special: s.special
      };
    });

    setBoard([...crushedBoard]);
    
    // Wait for crush animation
    await delay(250);

    // Apply Gravity & Fill New
    const nextBoard = applyGravity(crushedBoard, LEVELS[levelIndex].colors);
    setBoard(nextBoard);

    // Wait for fall animation
    await delay(350);

    // Recurse for chain reactions
    await processCascades(nextBoard, combo + 1);
  };

  const handleInteraction = (index: number) => {
    if (isProcessing || showGameOver || showLevelClear) return;
    
    if (selectedIdx === null) {
      setSelectedIdx(index);
    } else {
      if (selectedIdx === index) {
        setSelectedIdx(null); // Deselect
        return;
      }
      
      const r1 = Math.floor(selectedIdx / GRID_SIZE);
      const c1 = selectedIdx % GRID_SIZE;
      const r2 = Math.floor(index / GRID_SIZE);
      const c2 = index % GRID_SIZE;
      
      const isAdjacent = (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);
      
      if (isAdjacent) {
        attemptSwap(selectedIdx, index);
      } else {
        // Change selection if they clicked non-adjacent
        setSelectedIdx(index);
      }
    }
  };

  // Drag and Drop support
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isProcessing) {
      e.preventDefault();
      return;
    }
    setSelectedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (isProcessing || selectedIdx === null || selectedIdx === targetIdx) return;
    
    const r1 = Math.floor(selectedIdx / GRID_SIZE);
    const c1 = selectedIdx % GRID_SIZE;
    const r2 = Math.floor(targetIdx / GRID_SIZE);
    const c2 = targetIdx % GRID_SIZE;
    
    const isAdjacent = (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);
    
    if (isAdjacent) {
      attemptSwap(selectedIdx, targetIdx);
    } else {
      setSelectedIdx(null);
    }
  };

  if (board.length === 0) return null;
  const currentLevelData = LEVELS[levelIndex];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-4 font-sans select-none overflow-hidden touch-none">
      
      <Header
        level={levelIndex}
        target={currentLevelData?.target || 0}
        score={score}
        moves={moves}
      />

      {/* Game Board */}
      <div className="w-full max-w-md aspect-square bg-white/10 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-white/20 relative">
        <div className="w-full h-full relative">
          <ParticleOverlay ref={particlesRef} />
          <div className="grid grid-cols-8 grid-rows-8 gap-1 w-full h-full">
            {board.map((candy, index) => (
              <div
                key={`slot-${index}`}
                className="w-full h-full bg-black/15 rounded-lg relative overflow-visible"
                onClick={() => handleInteraction(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, index)}
              >
                {candy && (
                  <motion.div
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    draggable={!isProcessing}
                    onDragStart={(e: any) => handleDragStart(e, index)}
                    className={`absolute inset-0 flex items-center justify-center text-[7vw] sm:text-4xl cursor-pointer hover:bg-white/10 rounded-lg transition-colors z-10 
                      ${isProcessing ? 'pointer-events-none' : ''} 
                      ${selectedIdx === index ? 'ring-4 ring-white shadow-[0_0_15px_rgba(255,255,255,0.8)] z-20 scale-110' : ''}`}
                  >
                    <span className="drop-shadow-lg leading-none z-10">{candy.color}</span>
                    
                    {/* Special Visuals */}
                    {candy.special === 'row' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-1/4 bg-white/50 blur-sm rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                        <div className="absolute w-full h-[2px] bg-white opacity-80" />
                      </div>
                    )}
                    {candy.special === 'col' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="h-full w-1/4 bg-white/50 blur-sm rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                        <div className="absolute h-full w-[2px] bg-white opacity-80" />
                      </div>
                    )}
                    
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-8 text-white/50 text-sm font-medium">Swap adjacent candies to match 3 or more!</p>
      <p className="mt-2 text-pink-300/80 text-xs font-bold tracking-wide uppercase">Match 4 to create a line blast</p>

      {/* Modals */}
      <Modal
        isOpen={showLevelClear}
        title="Level Clear!"
        icon={<Sparkles className="text-yellow-300 w-16 h-16" />}
        buttonText="Next Level"
        onAction={() => initLevel(levelIndex + 1)}
      >
        <p>Target Reached: {currentLevelData?.target}</p>
        <p className="font-bold text-white mt-1">Final Score: {score}</p>
      </Modal>

      <Modal
        isOpen={showGameOver}
        title="Out of Moves!"
        icon={<Frown className="text-pink-300 w-16 h-16" />}
        buttonText="Try Again"
        onAction={() => initLevel(levelIndex)}
      >
        <p>You needed {currentLevelData?.target - score} more points.</p>
      </Modal>

      <Modal
        isOpen={gameBeaten}
        title="You Win!"
        icon={<Trophy className="text-yellow-400 w-16 h-16" />}
        buttonText="Play Again"
        onAction={() => initLevel(0)}
      >
        <p>Congratulations! You beat all {LEVELS.length} levels!</p>
      </Modal>
      
    </div>
  );
}
