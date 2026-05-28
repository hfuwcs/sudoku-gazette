/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type PaperSize = 'A4' | 'Letter';

export interface LayoutConfig {
  difficulty: Difficulty;
  paperSize: PaperSize;
  gridsPerPage: 1 | 2 | 4 | 6;
  pageCount: number;
}

export interface PuzzleData {
  puzzleId: string;
  difficulty: Difficulty;
  board: string;     // 81-character string, empty cells as '0'
  solution: string;  // 81-character solved string
  createdAt: string; 
}

export type Language = 'en' | 'vi';
