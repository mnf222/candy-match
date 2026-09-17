import { LevelData } from './types';

export const GRID_SIZE = 8;
export const CANDY_COLORS = ['🔴', '🟡', '🟢', '🔵', '🟣', '🟠'];

export const LEVELS: LevelData[] = [
  { target: 1000, moves: 20, colors: 4 },
  { target: 1500, moves: 18, colors: 4 },
  { target: 2200, moves: 18, colors: 5 },
  { target: 3000, moves: 16, colors: 5 },
  { target: 4000, moves: 15, colors: 5 },
  { target: 5200, moves: 15, colors: 6 },
  { target: 6500, moves: 14, colors: 6 },
  { target: 8000, moves: 13, colors: 6 },
  { target: 9500, moves: 12, colors: 6 },
  { target: 12000, moves: 10, colors: 6 },
];
