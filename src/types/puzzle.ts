export type PuzzleState = number[][];

export type Algorithm = 'bfs' | 'dfs' | 'astar';

export interface PuzzleNode {
  state: PuzzleState;
  action: string;
  parent: PuzzleNode | null;
  depth: number;
  cost: number;
}

export interface Solution {
  path: string[];
  nodesExplored: number;
  timeTaken: number;
  maxDepth: number;
} 