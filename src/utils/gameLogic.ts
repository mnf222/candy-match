import { Candy } from '../types';
import { CANDY_COLORS, GRID_SIZE } from '../constants';

export const getRandomColor = (colorsCount: number) => {
  const maxColors = Math.min(colorsCount, CANDY_COLORS.length);
  return CANDY_COLORS[Math.floor(Math.random() * maxColors)];
};

export const getMatchGroups = (board: (Candy | null)[]) => {
  const horizontalGroups: number[][] = [];
  const verticalGroups: number[][] = [];
  
  for (let r = 0; r < GRID_SIZE; r++) {
    let matchLen = 1;
    for (let c = 0; c < GRID_SIZE; c++) {
      const i = r * GRID_SIZE + c;
      const color = board[i]?.color;
      const nextColor = (c < GRID_SIZE - 1) ? board[i + 1]?.color : null;
      if (color && color === nextColor) {
        matchLen++;
      } else {
        if (matchLen >= 3) {
          const group = [];
          for(let k = 0; k < matchLen; k++) group.push(i - k);
          horizontalGroups.push(group.reverse());
        }
        matchLen = 1;
      }
    }
  }
  
  for (let c = 0; c < GRID_SIZE; c++) {
    let matchLen = 1;
    for (let r = 0; r < GRID_SIZE; r++) {
      const i = r * GRID_SIZE + c;
      const color = board[i]?.color;
      const nextColor = (r < GRID_SIZE - 1) ? board[i + GRID_SIZE]?.color : null;
      if (color && color === nextColor) {
        matchLen++;
      } else {
        if (matchLen >= 3) {
          const group = [];
          for(let k = 0; k < matchLen; k++) group.push(i - k * GRID_SIZE);
          verticalGroups.push(group.reverse());
        }
        matchLen = 1;
      }
    }
  }
  return { horizontalGroups, verticalGroups };
};

export const resolveCrush = (board: (Candy | null)[], initialMatchIndices: Set<number>) => {
  const toCrush = new Set(initialMatchIndices);
  const queue = Array.from(toCrush);
  
  while (queue.length > 0) {
    const idx = queue.shift()!;
    const candy = board[idx];
    if (!candy) continue;
    
    if (candy.special === 'row') {
      const r = Math.floor(idx / GRID_SIZE);
      for (let c = 0; c < GRID_SIZE; c++) {
        const rowIdx = r * GRID_SIZE + c;
        if (!toCrush.has(rowIdx) && board[rowIdx]) {
          toCrush.add(rowIdx);
          queue.push(rowIdx);
        }
      }
    }
    
    if (candy.special === 'col') {
      const c = idx % GRID_SIZE;
      for (let r = 0; r < GRID_SIZE; r++) {
        const colIdx = r * GRID_SIZE + c;
        if (!toCrush.has(colIdx) && board[colIdx]) {
          toCrush.add(colIdx);
          queue.push(colIdx);
        }
      }
    }
  }
  
  return toCrush;
};

export const evaluateBoard = (board: (Candy | null)[], swapIndices?: number[]) => {
  const { horizontalGroups, verticalGroups } = getMatchGroups(board);
  
  const initialMatches = new Set<number>();
  const specialsToCreate: { index: number, color: string, special: 'row' | 'col' }[] = [];
  
  const allGroups = [
    ...horizontalGroups.map(g => ({ group: g, type: 'col' as const })), // horizontal match creates column cleaner
    ...verticalGroups.map(g => ({ group: g, type: 'row' as const }))    // vertical match creates row cleaner
  ];
  
  allGroups.forEach(({ group, type }) => {
    group.forEach(idx => initialMatches.add(idx));
    
    if (group.length >= 4) {
      let spawnIdx = group[1]; // default somewhere in middle
      if (swapIndices) {
        const intersect = group.find(idx => swapIndices.includes(idx));
        if (intersect !== undefined) {
          spawnIdx = intersect;
        }
      }
      specialsToCreate.push({
        index: spawnIdx,
        color: board[group[0]]!.color,
        special: type
      });
    }
  });
  
  const crushSet = resolveCrush(board, initialMatches);
  
  return { crushSet, specialsToCreate };
};

export const checkForMatches = (board: (Candy | null)[]): Set<number> => {
  const { horizontalGroups, verticalGroups } = getMatchGroups(board);
  const matches = new Set<number>();
  horizontalGroups.forEach(g => g.forEach(i => matches.add(i)));
  verticalGroups.forEach(g => g.forEach(i => matches.add(i)));
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
