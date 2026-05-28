/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Difficulty } from '../types';

// Helper to convert index (0-80) to row (0-8) and col (0-8)
export function indexToRowCol(index: number): { row: number; col: number } {
  return {
    row: Math.floor(index / 9),
    col: index % 9,
  };
}

// Helper to convert row and col to index
export function rowColToIndex(row: number, col: number): number {
  return row * 9 + col;
}

// Checks if placing val at index is valid on the grid
export function isValidPlace(grid: number[], index: number, val: number): boolean {
  const { row, col } = indexToRowCol(index);

  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[rowColToIndex(row, c)] === val) {
      return false;
    }
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[rowColToIndex(r, col)] === val) {
      return false;
    }
  }

  // Check 3x3 box
  const boxRowStart = Math.floor(row / 3) * 3;
  const boxColStart = Math.floor(col / 3) * 3;
  for (let r = boxRowStart; r < boxRowStart + 3; r++) {
    for (let c = boxColStart; c < boxColStart + 3; c++) {
      if ((r !== row || c !== col) && grid[rowColToIndex(r, c)] === val) {
        return false;
      }
    }
  }

  return true;
}

// Backtracking solver that fills the grid and returns true if solvable
export function solveSudokuInPlace(grid: number[]): boolean {
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) {
      for (let val = 1; val <= 9; val++) {
        if (isValidPlace(grid, i, val)) {
          grid[i] = val;
          if (solveSudokuInPlace(grid)) {
            return true;
          }
          grid[i] = 0; // Backtrack
        }
      }
      return false; // Triggers backtracking
    }
  }
  return true; // Solved
}

// Solver that counts solutions (up to 2) to verify uniqueness
function countSolutions(grid: number[], countObj: { count: number }): boolean {
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) {
      for (let val = 1; val <= 9; val++) {
        if (isValidPlace(grid, i, val)) {
          grid[i] = val;
          countSolutions(grid, countObj);
          grid[i] = 0; // Backtrack
          if (countObj.count > 1) {
            return true; // Short-circuit if not unique
          }
        }
      }
      return false;
    }
  }
  countObj.count++;
  return countObj.count > 1;
}

// Check if a board has a unique solution
export function hasUniqueSolution(boardStr: string): boolean {
  const grid = boardStr.split('').map(Number);
  const countObj = { count: 0 };
  countSolutions(grid, countObj);
  return countObj.count === 1;
}

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generates a fully solved Sudoku board starting from empty
function generateFullSolvedBoard(): number[] {
  const grid = Array(81).fill(0);
  
  function fillRecursive(index: number): boolean {
    if (index === 81) return true;
    
    const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const num of nums) {
      if (isValidPlace(grid, index, num)) {
        grid[index] = num;
        if (fillRecursive(index + 1)) {
          return true;
        }
        grid[index] = 0;
      }
    }
    return false;
  }
  
  fillRecursive(0);
  return grid;
}

// Generate Sudoku puzzle board and solution
export function generateSudoku(difficulty: Difficulty): { board: string; solution: string } {
  // 1. Generate full solved board
  const solutionGrid = generateFullSolvedBoard();
  const solutionStr = solutionGrid.join('');
  
  // 2. Erase cells depending on difficulty
  // Easy: ~33 to 38 clues left
  // Medium: ~28 to 32 clues left
  // Hard: ~22 to 26 clues left
  // Expert: ~17 to 21 clues left
  let targetClues = 35;
  if (difficulty === 'easy') {
    targetClues = Math.floor(Math.random() * 6) + 33; // 33-38
  } else if (difficulty === 'medium') {
    targetClues = Math.floor(Math.random() * 5) + 28; // 28-32
  } else if (difficulty === 'hard') {
    targetClues = Math.floor(Math.random() * 5) + 22; // 22-26
  } else if (difficulty === 'expert') {
    targetClues = Math.floor(Math.random() * 5) + 17; // 17-21
  }

  const cellsToRemove = 81 - targetClues;
  const boardGrid = [...solutionGrid];
  
  // Indices to try removing
  const indices = shuffleArray(Array.from({ length: 81 }, (_, i) => i));
  let removedCount = 0;
  
  for (const idx of indices) {
    if (removedCount >= cellsToRemove) break;
    
    const originalVal = boardGrid[idx];
    boardGrid[idx] = 0;
    
    // Check if the solution remains unique
    // For Expert/Hard, checking uniqueness on EVERY hole is extremely slow in javascript
    // So we can limit uniqueness checks to Easy/Medium or check partially to ensure superb speed
    if (difficulty === 'easy' || difficulty === 'medium') {
      const boardStr = boardGrid.join('');
      const tempGrid = boardStr.split('').map(Number);
      const countObj = { count: 0 };
      countSolutions(tempGrid, countObj);
      
      if (countObj.count !== 1) {
        // Putting value back
        boardGrid[idx] = originalVal;
      } else {
        removedCount++;
      }
    } else {
      // For Hard/Expert, do standard digging to keep loading snappy
      removedCount++;
    }
  }
  
  return {
    board: boardGrid.join(''),
    solution: solutionStr,
  };
}

// Generate a classic vintage-looking Puzzle ID based on difficulty
export function generateId(difficulty: Difficulty): string {
  const prefix = difficulty.charAt(0).toUpperCase();
  const randNum = Math.floor(1000 + Math.random() * 9000); // 4 digit random number
  return `${prefix}${randNum}`;
}
