import { Candy } from '../types';
import { CANDY_COLORS, GRID_SIZE } from '../constants';

export const getRandomColor = (colorsCount: number) => {
  const maxColors = Math.min(colorsCount, CANDY_COLORS.length);
  return CANDY_COLORS[Math.floor(Math.random() * maxColors)];
};

export const checkForMatches = (board: (Candy | null)[]): Set<number> => {
  const matches = new Set<number>();
  
  // Check horizontal matches
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE - 2; c++) {
      const i = r * GRID_SIZE + c;
      const color = board[i]?.color;
      if (!color) continue;
      
      if (board[i + 1]?.color === color && board[i + 2]?.color === color) {
        matches.add(i);
        matches.add(i + 1);
        matches.add(i + 2);
        let next = 3;
        while (c + next < GRID_SIZE && board[i + next]?.color === color) {
          matches.add(i + next);
          next++;
        }
      }
    }
  }
  
  // Check vertical matches
  for (let c = 0; c < GRID_SIZE; c++) {
    for (let r = 0; r < GRID_SIZE - 2; r++) {
      const i = r * GRID_SIZE + c;
      const color = board[i]?.color;
      if (!color) continue;
      
      if (board[i + GRID_SIZE]?.color === color && board[i + GRID_SIZE * 2]?.color === color) {
        matches.add(i);
        matches.add(i + GRID_SIZE);
        matches.add(i + GRID_SIZE * 2);
        let next = 3;
        while (r + next < GRID_SIZE && board[i + next * GRID_SIZE]?.color === color) {
          matches.add(i + next * GRID_SIZE);
          next++;
        }
      }
    }
  }
  return matches;
};

export const generateBoard = (colorsCount: number): Candy[] => {
  let board: Candy[] = [];
  let hasMatches = true;
  
  // Generate a board that has no initial matches
  while (hasMatches) {
    board = Array(GRID_SIZE * GRID_SIZE).fill(null).map(() => ({
      id: crypto.randomUUID(),
      color: getRandomColor(colorsCount)
    }));
    hasMatches = checkForMatches(board).size > 0;
  }
  
  return board;
};

export const applyGravity = (board: (Candy | null)[], colorsCount: number): Candy[] => {
  const newBoard = [...board];
  
  for (let c = 0; c < GRID_SIZE; c++) {
    const colCandies: Candy[] = [];
    
    // Collect non-null candies from bottom to top
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      const candy = newBoard[r * GRID_SIZE + c];
      if (candy !== null) {
        colCandies.unshift(candy);
      }
    }
    
    // Fill missing top slots with new candies
    const missing = GRID_SIZE - colCandies.length;
    const newCol = Array.from({ length: missing }).map(() => ({
      id: crypto.randomUUID(),
      color: getRandomColor(colorsCount)
    }));
    
    const fullCol = [...newCol, ...colCandies];
    
    // Assign back to the board
    for (let r = 0; r < GRID_SIZE; r++) {
      newBoard[r * GRID_SIZE + c] = fullCol[r];
    }
  }
  return newBoard as Candy[];
};
