export interface Candy {
  id: string;
  color: string;
  special?: 'row' | 'col';
}

export interface LevelData {
  target: number;
  moves: number;
  colors: number;
}
