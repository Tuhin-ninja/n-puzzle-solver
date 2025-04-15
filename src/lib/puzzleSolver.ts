import { PuzzleState, Algorithm, PuzzleNode, Solution } from '../types/puzzle';

export class PuzzleSolver {
  private size: number;
  private goalState: PuzzleState;

  constructor(size: number) {
    this.size = size;
    this.goalState = this.generateGoalState();
  }

  private generateGoalState(): PuzzleState {
    const state: PuzzleState = [];
    for (let i = 0; i < this.size; i++) {
      state[i] = [];
      for (let j = 0; j < this.size; j++) {
        state[i][j] = i * this.size + j + 1;
      }
    }
    state[this.size - 1][this.size - 1] = 0;
    return state;
  }

  private isGoalState(state: PuzzleState): boolean {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (state[i][j] !== this.goalState[i][j]) {
          return false;
        }
      }
    }
    return true;
  }

  private getBlankPosition(state: PuzzleState): [number, number] {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (state[i][j] === 0) {
          return [i, j];
        }
      }
    }
    throw new Error('No blank tile found');
  }

  private getPossibleMoves(state: PuzzleState): PuzzleState[] {
    const [blankRow, blankCol] = this.getBlankPosition(state);
    const moves: PuzzleState[] = [];
    const directions = [
      [-1, 0], // Up
      [1, 0],  // Down
      [0, -1], // Left
      [0, 1]   // Right
    ];

    for (const [dr, dc] of directions) {
      const newRow = blankRow + dr;
      const newCol = blankCol + dc;

      if (newRow >= 0 && newRow < this.size && newCol >= 0 && newCol < this.size) {
        const newState = state.map(row => [...row]);
        [newState[blankRow][blankCol], newState[newRow][newCol]] = 
          [newState[newRow][newCol], newState[blankRow][blankCol]];
        moves.push(newState);
      }
    }

    return moves;
  }

  private manhattanDistance(state: PuzzleState): number {
    let distance = 0;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const value = state[i][j];
        if (value !== 0) {
          const goalRow = Math.floor((value - 1) / this.size);
          const goalCol = (value - 1) % this.size;
          distance += Math.abs(i - goalRow) + Math.abs(j - goalCol);
        }
      }
    }
    return distance;
  }

  private createNode(state: PuzzleState, parent: PuzzleNode | null, action: string): PuzzleNode {
    return {
      state,
      action,
      parent,
      depth: parent ? parent.depth + 1 : 0,
      cost: this.manhattanDistance(state)
    };
  }

  private reconstructPath(node: PuzzleNode): string[] {
    const path: string[] = [];
    while (node.parent) {
      path.unshift(node.action);
      node = node.parent;
    }
    return path;
  }

  private countInversions(state: PuzzleState): number {
    const flatState = state.flat();
    let inversions = 0;
    
    for (let i = 0; i < flatState.length - 1; i++) {
      for (let j = i + 1; j < flatState.length; j++) {
        if (flatState[i] !== 0 && flatState[j] !== 0 && flatState[i] > flatState[j]) {
          inversions++;
        }
      }
    }
    
    return inversions;
  }

  private getBlankRowFromBottom(state: PuzzleState): number {
    const blankPos = this.getBlankPosition(state);
    return this.size - blankPos[0];
  }

  isSolvable(state: PuzzleState): boolean {
    const inversions = this.countInversions(state);
    const blankRowFromBottom = this.getBlankRowFromBottom(state);

    if (this.size % 2 === 1) {
      // For odd-sized puzzles, the number of inversions must be even
      return inversions % 2 === 0;
    } else {
      // For even-sized puzzles:
      // If the blank is on an even row counting from the bottom, the number of inversions must be odd
      // If the blank is on an odd row counting from the bottom, the number of inversions must be even
      return (blankRowFromBottom % 2 === 0) === (inversions % 2 === 1);
    }
  }

  solve(initialState: PuzzleState, algorithm: Algorithm): Solution {
    const startTime = performance.now();
    let nodesExplored = 0;
    let maxDepth = 0;

    const initialNode = this.createNode(initialState, null, '');
    const visited = new Set<string>();

    if (algorithm === 'bfs') {
      const queue: PuzzleNode[] = [initialNode];
      
      while (queue.length > 0) {
        const node = queue.shift()!;
        nodesExplored++;
        maxDepth = Math.max(maxDepth, node.depth);

        if (this.isGoalState(node.state)) {
          return {
            path: this.reconstructPath(node),
            nodesExplored,
            timeTaken: performance.now() - startTime,
            maxDepth
          };
        }

        const stateStr = JSON.stringify(node.state);
        if (visited.has(stateStr)) continue;
        visited.add(stateStr);

        const moves = this.getPossibleMoves(node.state);
        for (const move of moves) {
          const moveStr = JSON.stringify(move);
          if (!visited.has(moveStr)) {
            const action = this.getAction(node.state, move);
            queue.push(this.createNode(move, node, action));
          }
        }
      }
    } else if (algorithm === 'dfs') {
      const stack: PuzzleNode[] = [initialNode];
      
      while (stack.length > 0) {
        const node = stack.pop()!;
        nodesExplored++;
        maxDepth = Math.max(maxDepth, node.depth);

        if (this.isGoalState(node.state)) {
          return {
            path: this.reconstructPath(node),
            nodesExplored,
            timeTaken: performance.now() - startTime,
            maxDepth
          };
        }

        const stateStr = JSON.stringify(node.state);
        if (visited.has(stateStr)) continue;
        visited.add(stateStr);

        const moves = this.getPossibleMoves(node.state);
        for (const move of moves) {
          const moveStr = JSON.stringify(move);
          if (!visited.has(moveStr)) {
            const action = this.getAction(node.state, move);
            stack.push(this.createNode(move, node, action));
          }
        }
      }
    } else if (algorithm === 'astar') {
      const openSet: PuzzleNode[] = [initialNode];
      const fScore = new Map<string, number>();
      fScore.set(JSON.stringify(initialState), this.manhattanDistance(initialState));

      while (openSet.length > 0) {
        openSet.sort((a, b) => (fScore.get(JSON.stringify(a.state)) || 0) - (fScore.get(JSON.stringify(b.state)) || 0));
        const node = openSet.shift()!;
        nodesExplored++;
        maxDepth = Math.max(maxDepth, node.depth);

        if (this.isGoalState(node.state)) {
          return {
            path: this.reconstructPath(node),
            nodesExplored,
            timeTaken: performance.now() - startTime,
            maxDepth
          };
        }

        const stateStr = JSON.stringify(node.state);
        if (visited.has(stateStr)) continue;
        visited.add(stateStr);

        const moves = this.getPossibleMoves(node.state);
        for (const move of moves) {
          const moveStr = JSON.stringify(move);
          if (!visited.has(moveStr)) {
            const action = this.getAction(node.state, move);
            const newNode = this.createNode(move, node, action);
            const newFScore = newNode.depth + this.manhattanDistance(move);
            fScore.set(moveStr, newFScore);
            openSet.push(newNode);
          }
        }
      }
    }

    throw new Error('No solution found');
  }

  private getAction(currentState: PuzzleState, nextState: PuzzleState): string {
    const [currentRow, currentCol] = this.getBlankPosition(currentState);
    const [nextRow, nextCol] = this.getBlankPosition(nextState);

    if (nextRow < currentRow) return 'Up';
    if (nextRow > currentRow) return 'Down';
    if (nextCol < currentCol) return 'Left';
    if (nextCol > currentCol) return 'Right';
    return '';
  }
} 