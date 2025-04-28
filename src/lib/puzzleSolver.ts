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
          [newState[newRow][newCol], newState[blankRow][blankCol]]; // swap operation occuring 
        moves.push(newState);
      }
    }

    return moves;
  }

  private manhattanDistance(state: PuzzleState): number {
    let dist = 0;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const value = state[i][j];
        if(value == 0) continue;  // skip the blank tile. no need to calculate this one 
        const goalRow = Math.floor((value - 1) / this.size);
        const goalCol = (value - 1) % this.size;
        dist += Math.abs(i - goalRow) + Math.abs(j - goalCol);
      }
    }
    return dist;
  }

  private hammingDistance(state: PuzzleState): number {
    let dist = 0;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const value = state[i][j];
        if (value === 0) continue; // Skip blank tile
        const goalRow = Math.floor((value - 1) / this.size);
        const goalCol = (value - 1) % this.size;
        if (i !== goalRow || j !== goalCol) {
          dist++;
        }
      }
    }
    return dist;
  }

  private linearConflicts(state: PuzzleState): number {
    const dist = this.manhattanDistance(state);
    let linear_conflicts = 0;
    
    // Check row conflicts
    for (let i = 0; i < this.size; i++) {
      const rowTiles: number[] = [];
      for (let j = 0; j < this.size; j++) {
        const value = state[i][j];
        if (value === 0) continue;
        const goalRow = Math.floor((value - 1) / this.size);
        if (goalRow === i) {
          rowTiles.push(value);
        }
      }
      
      // Count conflicts in this row
      for (let j = 0; j < rowTiles.length - 1; j++) {
        for (let k = j + 1; k < rowTiles.length; k++) {
          if (rowTiles[j] > rowTiles[k]) {
            linear_conflicts++;
          }
        }
      }
    }
    
    // Check column conflicts
    for (let j = 0; j < this.size; j++) {
      const colTiles: number[] = [];
      for (let i = 0; i < this.size; i++) {
        const value = state[i][j];
        if (value === 0) continue;
        const goalCol = (value - 1) % this.size;
        if (goalCol === j) {
          colTiles.push(value);
        }
      }
      
      // Count conflicts in this column
      for (let i = 0; i < colTiles.length - 1; i++) {
        for (let k = i + 1; k < colTiles.length; k++) {
          if (colTiles[i] > colTiles[k]) {
            linear_conflicts++;
          }
        }
      }
    }
    
    return dist + 2 * linear_conflicts;
  }

  private euclideanDistance(state: PuzzleState): number {
    let dist = 0;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const value = state[i][j];
        if (value === 0) {
          dist += Math.sqrt(Math.pow(this.size-i-1,2) + Math.pow(this.size-j-1,2));
          continue; 
        }; // Skip blank tile
        const goalRow = Math.floor((value - 1) / this.size);
        const goalCol = (value - 1) % this.size;
        dist += Math.sqrt(Math.pow(i - goalRow, 2) + Math.pow(j - goalCol, 2));
      }
    }
    return dist;
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
    const h = this.getHeuristic(heuristic, state);
    return {
      state,
      action,
      parent,
      depth: parent ? parent.depth + 1 : 0,
      cost: h
    };
  }

  private reconstructPath(node: PuzzleNode): string[] {
    const path: string[] = [];
    let current = node;
    while (current.parent) {
      path.unshift(current.action);
      current = current.parent;
    }
    console.log('Path length:', path.length);
    console.log('Path:', path);
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
    let nodesExpanded = 1;
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
            nodesExpanded,
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
            nodesExpanded,
            timeTaken: performance.now() - startTime,
            maxDepth
          };
        }

        const stateStr = JSON.stringify(node.state);
        if (visited.has(stateStr)) continue;
        visited.add(stateStr);

        const moves = this.getPossibleMoves(node.state);
        nodesExpanded ++;
        for (const move of moves) {
          const moveStr = JSON.stringify(move);
          if (!visited.has(moveStr)) {
            const action = this.getAction(node.state, move);
            stack.push(this.createNode(move, node, action, heuristic));
          }
        }
      }
    } 
    else if (algorithm === 'astar') {
      const openSet: PuzzleNode[] = [initialNode];
      const closedSet = new Set<string>();
      const fScore = new Map<string, number>();
      const gScore = new Map<string, number>();
      fScore.set(JSON.stringify(initialState), this.getHeuristic(heuristic, initialState));
      gScore.set(JSON.stringify(initialState), 0);

      while (openSet.length > 0) {
        openSet.sort((a, b) => {
          const fScoreA = fScore.get(JSON.stringify(a.state)) || 0;
          const fScoreB = fScore.get(JSON.stringify(b.state)) || 0;
          if (fScoreA !== fScoreB) return fScoreA - fScoreB;
          // If fScores are equal, prefer the node with lower hScore (closer to goal)
          const hScoreA = this.getHeuristic(heuristic, a.state);
          const hScoreB = this.getHeuristic(heuristic, b.state);
          return hScoreA - hScoreB;
        });
        
        const node = openSet.shift()!; // this pops an element from the front of the openset
        maxDepth = Math.max(maxDepth, node.depth);

        if (this.isGoalState(node.state)) {
          return {
            path: this.reconstructPath(node),
            nodesExplored,
            nodesExpanded,
            timeTaken: performance.now() - startTime,
            maxDepth
          };
        }

        nodesExpanded++;


        const stateStr = JSON.stringify(node.state);
        const moves = this.getPossibleMoves(node.state);
        let check = false;
        for (const move of moves) {
          const moveStr = JSON.stringify(move);
          if (closedSet.has(moveStr)) continue;
          if(!check){
            closedSet.add(stateStr);
            // nodesExpanded++;
            check = true;
          }
          const action = this.getAction(node.state, move);
          const tentativeGScore = (gScore.get(stateStr) || 0) + 1;
          const hScore = this.getHeuristic(heuristic, move);
          const tentativeFScore = tentativeGScore + hScore;
          
          if (!fScore.has(moveStr) || tentativeFScore < (fScore.get(moveStr) || Infinity)) {
            const newNode = this.createNode(move, node, action, heuristic);
            gScore.set(moveStr, tentativeGScore);
            fScore.set(moveStr, tentativeFScore);
            
            // Check if the node is already in openSet
            const existingNodeIndex = openSet.findIndex(n => JSON.stringify(n.state) === moveStr);
            if (existingNodeIndex !== -1) {
              openSet[existingNodeIndex] = newNode;
            } else {
              openSet.push(newNode);
              nodesExplored++;
            }
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