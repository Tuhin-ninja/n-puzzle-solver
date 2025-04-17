'use client';

import { useState, useEffect } from 'react';
import { PuzzleSolver } from '../lib/puzzleSolver';
import { PuzzleState, Algorithm, Solution, Heuristic } from '../types/puzzle';

export default function Home() {
  const [size, setSize] = useState<number>(3);
  const [initialState, setInitialState] = useState<PuzzleState>([]);
  const [currentState, setCurrentState] = useState<PuzzleState>([]);
  const [solution, setSolution] = useState<Solution | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('astar');
  const [selectedHeuristic, setSelectedHeuristic] = useState<Heuristic>('manhattan');
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showCustomSize, setShowCustomSize] = useState<boolean>(false); 
  const [stats, setStats] = useState<{
    nodesExplored: number;
    timeTaken: number;
    maxDepth: number;
  }>({
    nodesExplored: 0,
    timeTaken: 0,
    maxDepth: 0,
  });
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [gridInput, setGridInput] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSolvabilityInfo, setShowSolvabilityInfo] = useState<boolean>(false);

  useEffect(() => {
    initializePuzzle();
  }, [size]);

  useEffect(() => {
    if (showCustomInput) {
      const emptyGrid = Array(size).fill('').map(() => Array(size).fill(''));
      setGridInput(emptyGrid);
    }
  }, [showCustomInput, size]);

  const initializePuzzle = () => {
    // const solver = new PuzzleSolver(size);
    const state: PuzzleState = [];
    const numbers = Array.from({ length: size * size }, (_, i) => i);
    
    // Fisher-Yates shuffle
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    for (let i = 0; i < size; i++) {
      state[i] = [];
      for (let j = 0; j < size; j++) {
        state[i][j] = numbers[i * size + j];
      }
    }

    setInitialState(state);
    setCurrentState(state);
    setSolution(null);
    setStats({ nodesExplored: 0, timeTaken: 0, maxDepth: 0 });
  };

  const checkSolvability = (state: PuzzleState) => {
    const solver = new PuzzleSolver(size);
    const solvable = solver.isSolvable(state);
    // setIsSolvable(solvable);
    return solvable;
  };

  const handleSolve = () => {
    if (!checkSolvability(currentState)) {
      setShowSolvabilityInfo(true);
      return;
    }

    setIsSolving(true);
    const solver = new PuzzleSolver(size);
    try {
      const result = solver.solve(currentState, selectedAlgorithm, selectedHeuristic);
      setSolution(result);
      setStats({
        nodesExplored: result.nodesExplored,
        timeTaken: result.timeTaken,
        maxDepth: result.maxDepth,
      });
    } catch (error) {
      console.error('Error solving puzzle:', error);
      alert('No solution found for this configuration!');
    }
    setIsSolving(false);
  };

  const handleHeuristicChange = (heuristic: Heuristic) => {
    console.log(heuristic);
    setSelectedHeuristic(heuristic);
  };



  const handleTileClick = (row: number, col: number) => {
    if (isSolving) return;
    
    const blankPos = findBlankTile();
    if (!blankPos) return;

    const [blankRow, blankCol] = blankPos;
    const isAdjacent = 
      (Math.abs(row - blankRow) === 1 && col === blankCol) ||
      (Math.abs(col - blankCol) === 1 && row === blankRow);

    if (isAdjacent) {
      const newState = currentState.map(row => [...row]);
      [newState[row][col], newState[blankRow][blankCol]] = 
        [newState[blankRow][blankCol], newState[row][col]];
      setCurrentState(newState);
    }
  };

  const findBlankTile = (): [number, number] | null => {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (currentState[i][j] === 0) {
          return [i, j];
        }
      }
    }
    return null;
  };


  const handleSizeChange = (newSize: number) => {
    setSize(newSize);
  };

  const handleAlgorithmChange = (algorithm: Algorithm) => {
    setSelectedAlgorithm(algorithm);
  };

  const handleStepChange = (step: number) => {
    if (!solution) return;
    setCurrentStep(step);
    const solver = new PuzzleSolver(size);
    let state = [...initialState];
    for (let i = 0; i < step; i++) {
      const [blankRow, blankCol] = solver['getBlankPosition'](state);
      const [newRow, newCol] = getNewPosition(blankRow, blankCol, solution.path[i]);
      const newState = state.map(row => [...row]);
      [newState[blankRow][blankCol], newState[newRow][newCol]] = 
        [newState[newRow][newCol], newState[blankRow][blankCol]];
      state = newState;
    }
    setCurrentState(state);
  };

  const getNewPosition = (row: number, col: number, move: string): [number, number] => {
    switch (move) {
      case 'Up': return [row - 1, col];
      case 'Down': return [row + 1, col];
      case 'Left': return [row, col - 1];
      case 'Right': return [row, col + 1];
      default: return [row, col];
    }
  };

  const handlePlayPause = () => {
    if (!solution) return;
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && solution) {
      interval = setInterval(() => {
        if (currentStep < solution.path.length) {
          handleStepChange(currentStep + 1);
        } else {
          setIsPlaying(false);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, solution]);

  const handleGridInputChange = (row: number, col: number, value: string) => {
    const newGrid = [...gridInput];
    newGrid[row][col] = value;
    setGridInput(newGrid);
  };

  const handleCustomInput = () => {
    try {
      // Convert grid input to numbers
      const numbers: number[] = [];
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const value = gridInput[i][j];
          if (value === '') {
            throw new Error('Please fill all cells');
          }
          const num = parseInt(value);
          if (isNaN(num) || num < 0 || num >= size * size) {
            throw new Error(`Please enter numbers between 0 and ${size * size - 1}`);
          }
          numbers.push(num);
        }
      }

      // Validate the input
      const uniqueNumbers = new Set(numbers);
      if (uniqueNumbers.size !== size * size) {
        throw new Error('Please enter unique numbers');
      }

      // Convert to 2D array
      const newPuzzle: number[][] = [];
      for (let i = 0; i < size; i++) {
        newPuzzle.push(numbers.slice(i * size, (i + 1) * size));
      }

      setInitialState(newPuzzle);
      setCurrentState(newPuzzle);
      setSolution(null);
      setStats({ nodesExplored: 0, timeTaken: 0, maxDepth: 0 });
      setShowCustomInput(false);
      setGridInput([]);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Tuhins N-Puzzle Solver
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Controls</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Puzzle Size
                  </label>
                  <div className="flex space-x-3">
                    {[3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSizeChange(s)}
                        className={`flex-1 px-6 py-3 rounded-xl text-lg font-medium transition-all duration-1000 ${
                          size === s
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {s}x{s}
                      </button>
                    ))}
                    <button className='flex-1 px-6 py-3 rounded-xl text-lg font-medium transition-all duration-1000 bg-gray-100 text-gray-700 hover:bg-gray-200'
                    onClick={()=> setShowCustomSize(!showCustomSize)}
                    >
                      Custom
                      </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Algorithm
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['bfs', 'dfs', 'astar'] as Algorithm[]).map((algo) => (
                      <button
                        key={algo}
                        onClick={() => handleAlgorithmChange(algo)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-1000 ${
                          selectedAlgorithm === algo
                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/20'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {algo.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Heuristic
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['hamming', 'linearConflicts', 'euclidean', 'manhattan'] as Heuristic[]).map((heuristic) => (
                      <button
                        key={heuristic}
                        onClick={() => handleHeuristicChange(heuristic)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-1000 ${
                          selectedHeuristic === heuristic
                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/20'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {heuristic.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={initializePuzzle}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-1000"
                  >
                    New Puzzle
                  </button>
                  <button
                    onClick={() => setShowCustomInput(true)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-1000"
                  >
                    Custom Input
                  </button>
                  <button
                    onClick={handleSolve}
                    disabled={isSolving}
                    className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-1000 ${
                      isSolving
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/20 hover:from-green-700 hover:to-green-800'
                    }`}
                  >
                    {isSolving ? 'Solving...' : 'Solve'}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            {stats.nodesExplored > 0 && (
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
                <h2 className="text-2xl font-semibold mb-6 text-gray-800">Statistics</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600">Nodes Explored</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.nodesExplored}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600">Time Taken</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.timeTaken.toFixed(2)}ms</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-600">Minimum Moves</p>
                    <p className="text-2xl font-bold text-green-600">{stats.maxDepth}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Puzzle Board */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Puzzle Board</h2>
            <div className="grid gap-2 p-4 bg-gray-50 rounded-xl" style={{ 
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              aspectRatio: '1/1'
            }}>
              {currentState.map((row, i) =>
                row.map((value, j) => (
                  <button
                    key={`${i}-${j}`}
                    onClick={() => handleTileClick(i, j)}
                    className={`aspect-square flex items-center justify-center text-3xl font-bold rounded-xl transition-all duration-1000
                      ${value === 0 
                        ? 'bg-gray-200' 
                        : 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-800 hover:from-blue-200 hover:to-blue-100 shadow-sm'
                      }
                      ${isSolving ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
                    disabled={isSolving}
                  >
                    {value !== 0 && value}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Solution Path */}
        {solution && (
          <div className="mt-8 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Solution Path</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {solution.path.map((move, index) => (
                <span
                  key={index}
                  className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all duration-1000 ${
                    index === currentStep
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => handleStepChange(index)}
                >
                  {move}
                </span>
              ))}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleStepChange(0)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-1000"
              >
                Reset
              </button>
              <button
                onClick={() => handleStepChange(Math.max(0, currentStep - 1))}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-1000"
              >
                Previous
              </button>
              <button
                onClick={handlePlayPause}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:from-purple-700 hover:to-purple-800 transition-all duration-1000"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={() => handleStepChange(Math.min(solution.path.length, currentStep + 1))}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-1000"
              >
                Next
              </button>
              <span className="text-gray-600 font-medium">
                Step {currentStep + 1} of {solution.path.length}
              </span>
            </div>
          </div>
        )}

        {/* Custom Input Modal */}
        {showCustomInput && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 transform transition-all duration-1000 scale-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  Custom Puzzle Input
                </h2>
                <button
                  onClick={() => setShowCustomInput(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-1000"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Instructions</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      Fill in all cells with numbers from 0 to {size * size - 1}
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      Use 0 for the blank tile
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      Each number should be unique
                    </li>
                  </ul>
                </div>

                {error && (
                  <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                )}

                <div className="bg-white/50 p-4 rounded-xl border border-gray-200">
                  <div className="grid gap-2" style={{ 
                    gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
                    aspectRatio: '1/1'
                  }}>
                    {gridInput.map((row, i) =>
                      row.map((value, j) => (
                        <input
                          key={`${i}-${j}`}
                          type="number"
                          min="0"
                          max={size * size - 1}
                          value={value.toString()}
                          onChange={(e) => handleGridInputChange(i, j, e.target.value)}
                          className="aspect-square w-full text-center text-xl font-bold text-blue-500 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-1000 bg-white/80 backdrop-blur-sm"
                          placeholder="0"
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="flex space-x-4 pt-2">
                  <button
                    onClick={() => setShowCustomInput(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-1000 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                  <button
                    onClick={handleCustomInput}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-blue-800 transition-all duration-1000 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Solvability Info Modal */}
        {showSolvabilityInfo && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 transform transition-all duration-1000 scale-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600">
                  Configuration Not Solvable
                </h2>
                <button
                  onClick={() => setShowSolvabilityInfo(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-1000"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Why is this configuration not solvable?</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      For {size}x{size} puzzles, certain configurations cannot be solved
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      The solvability depends on the number of inversions and the position of the blank tile
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      Try generating a new puzzle or entering a different configuration
                    </li>
                  </ul>
                </div>

                <div className="flex space-x-4 pt-2">
                  <button
                    onClick={() => {
                      setShowSolvabilityInfo(false);
                      setShowCustomInput(false);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-1000 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowSolvabilityInfo(false);
                      initializePuzzle();
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-blue-800 transition-all duration-1000 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    New Puzzle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Size Modal */}
        {showCustomSize && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 transform transition-all duration-300 scale-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
                  Custom Puzzle Size
                </h2>
                <button
                  onClick={() => setShowCustomSize(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                  <h3 className="text-sm font-medium text-green-800 mb-2">Instructions</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      Enter a size between 3 and 8
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      Larger sizes may take longer to solve
                    </li>
                  </ul>
                </div>

                <div className="bg-white/50 p-4 rounded-xl border border-gray-200">
                  <input
                    type="number"
                    min="3"
                    max="8"
                    value={size}
                    onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                    className="w-full px-4 py-3 text-center text-xl font-bold text-green-600 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300"
                    placeholder="Enter size (3-8)"
                  />
                </div>

                <div className="flex space-x-4 pt-2">
                  <button
                    onClick={() => setShowCustomSize(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-300 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomSize(false);
                      initializePuzzle();
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium shadow-lg shadow-green-500/20 hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
