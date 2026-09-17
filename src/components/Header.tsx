import { Trophy, Move, Target, Star } from 'lucide-react';

interface HeaderProps {
  level: number;
  target: number;
  score: number;
  moves: number;
}

export function Header({ level, target, score, moves }: HeaderProps) {
  return (
    <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-6 shadow-xl border border-white/20">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Star className="text-yellow-400 w-6 h-6" />
          <span className="text-xl font-bold text-white tracking-wide">Level {level + 1}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-pink-500/30">
          <Target className="text-pink-400 w-4 h-4" />
          <span className="text-sm font-semibold text-pink-100">Target: {target}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/20 rounded-xl p-3 flex flex-col items-center border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-yellow-400/5 group-hover:bg-yellow-400/10 transition-colors" />
          <span className="text-xs text-white/60 font-medium uppercase tracking-wider mb-1 z-10">Score</span>
          <div className="flex items-center gap-2 text-2xl font-black text-white z-10">
            <Trophy className="text-yellow-400 w-5 h-5" />
            {score}
          </div>
        </div>
        <div className="bg-black/20 rounded-xl p-3 flex flex-col items-center border border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-400/5 group-hover:bg-blue-400/10 transition-colors" />
          <span className="text-xs text-white/60 font-medium uppercase tracking-wider mb-1 z-10">Moves</span>
          <div className={`flex items-center gap-2 text-2xl font-black z-10 ${moves <= 3 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            <Move className={`w-5 h-5 ${moves <= 3 ? 'text-red-400' : 'text-blue-400'}`} />
            {moves}
          </div>
        </div>
      </div>
    </div>
  );
}
