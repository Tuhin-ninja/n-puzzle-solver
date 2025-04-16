import { PuzzleState, Algorithm, PuzzleNode, Solution, Heuristic } from '../types/puzzle';

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
    console.log(state);
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
    console.log(`manhattan distance : ${distance}`);
    return distance;
  }

  private hammingDistance(state: PuzzleState): number {
    let distance = 0;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (state[i][j] !== this.goalState[i][j]) { 
          distance++;
        }
      }
    }
    console.log(`hamming distance : ${distance}`);
    return distance;
  }


  private linearConflicts(state: PuzzleState): number {
    let conflicts = 0;
    const goalState = this.generateGoalState();

    // Check rows for conflicts
    for (let i = 0; i < this.size; i++) {
      const row = state[i];
      const goalRow = goalState[i];
      const rowConflicts = this.countLinearConflicts(row, goalRow);
      conflicts += rowConflicts;
    }

    // Check columns for conflicts
    for (let j = 0; j < this.size; j++) {
      const col = state.map(row => row[j]);
      const goalCol = goalState.map(row => row[j]);
      const colConflicts = this.countLinearConflicts(col, goalCol);
      conflicts += colConflicts;
    }
    console.log(`linear conflicts : ${conflicts}`);
    return conflicts;
  }

  private countLinearConflicts(tiles: number[], goalTiles: number[]): number {
    let conflicts = 0;
    const size = tiles.length;
    
    for (let i = 0; i < size; i++) {
      const tile = tiles[i];
      const goalTile = goalTiles[i];
      
      if (tile !== 0 && goalTile !== 0) {
        const tileRow = Math.floor(tile / size);
        const goalTileRow = Math.floor(goalTile / size);
        
        if (tileRow === goalTileRow) {
          const tileRow = Math.floor(tile / size);
          const goalTileRow = Math.floor(goalTile / size);
          
          if (tileRow === goalTileRow) {
            const tileCol = tile % size;
            const goalTileCol = goalTile % size;
            
            if (tileCol < goalTileCol && goalTileCol < size - 1) {
              conflicts++;
            }
          }
        }
      }
    }
    return conflicts;
  }

  private euclideanDistance(state: PuzzleState): number {
    let distance = 0;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const value = state[i][j];
        if (value !== 0) {
          const goalRow = Math.floor((value - 1) / this.size);
          const goalCol = (value - 1) % this.size;
          distance += Math.sqrt(Math.pow(i - goalRow, 2) + Math.pow(j - goalCol, 2));
        }
      }
    }
    return distance;
  }


  private getHeuristic(heuristic: Heuristic, state : PuzzleState) : number {
    switch (heuristic) {
      case 'hamming':
        return this.hammingDistance(state);
      case 'linearConflicts':
        return this.linearConflicts(state);
      case 'euclidean':
        return this.euclideanDistance(state);
      case 'manhattan':
        return this.manhattanDistance(state);
      default:
        throw new Error(`Unknown heuristic: ${heuristic}`);
    }
  }



  private createNode(state: PuzzleState, parent: PuzzleNode | null, action: string, heuristic: Heuristic): PuzzleNode {
    return {
      state,
      action,
      parent,
      depth: parent ? parent.depth + 1 : 0,
      cost: this.getHeuristic(heuristic, state)
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

  solve(initialState: PuzzleState, algorithm: Algorithm, heuristic: Heuristic): Solution {
    const startTime = performance.now();
    let nodesExplored = 0;
    let maxDepth = 0;

    const initialNode = this.createNode(initialState, null, '', heuristic);
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
            queue.push(this.createNode(move, node, action, heuristic));
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
            stack.push(this.createNode(move, node, action, heuristic));
          }
        }
      }
    } else if (algorithm === 'astar') {
      const openSet: PuzzleNode[] = [initialNode];
      const fScore = new Map<string, number>();
      fScore.set(JSON.stringify(initialState), this.getHeuristic(heuristic, initialState));

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
            const newNode = this.createNode(move, node, action, heuristic);
            const newFScore = newNode.depth + this.getHeuristic(heuristic, move);
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