/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface SudokuGridProps {
  board: string;       // 81-char string (e.g., "53007...")
  solution: string;    // 81-char solution
  isPrintOnly?: boolean;
  onCellChange?: (index: number, val: number) => void;
  userEntries?: Record<number, number>; // custom inputs
  gridsPerPage?: number;
}

export default function SudokuGrid({
  board,
  solution,
  isPrintOnly = false,
  onCellChange,
  userEntries = {},
  gridsPerPage = 1
}: SudokuGridProps) {
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  
  // Pencil marks / notes: index -> Set of numbers (1 to 9)
  const [pencilMarks, setPencilMarks] = useState<Record<number, Set<number>>>({});
  const [isNoteMode, setIsNoteMode] = useState(false);

  // Parse strings to arrays
  const originalGrid = board.split('').map(Number);
  const solutionGrid = solution.split('').map(Number);

  // Handle cell selection
  const handleCellClick = (index: number) => {
    if (isPrintOnly || originalGrid[index] !== 0) return;
    setSelectedCell(index);
  };

  // Process keyboard entries
  useEffect(() => {
    if (isPrintOnly || selectedCell === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();

      // Navigation keys
      if (e.key === 'ArrowUp') {
        setSelectedCell(prev => (prev !== null && prev >= 9 ? prev - 9 : prev));
        return;
      }
      if (e.key === 'ArrowDown') {
        setSelectedCell(prev => (prev !== null && prev <= 71 ? prev + 9 : prev));
        return;
      }
      if (e.key === 'ArrowLeft') {
        setSelectedCell(prev => (prev !== null && prev % 9 !== 0 ? prev - 1 : prev));
        return;
      }
      if (e.key === 'ArrowRight') {
        setSelectedCell(prev => (prev !== null && (prev + 1) % 9 !== 0 ? prev + 1 : prev));
        return;
      }

      // Deleting entries
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        if (onCellChange) onCellChange(selectedCell, 0);
        setPencilMarks(prev => {
          const updated = { ...prev };
          delete updated[selectedCell];
          return updated;
        });
        return;
      }

      // Number entries (1-9)
      const num = parseInt(e.key, 10);
      if (isNaN(num) || num < 1 || num > 9) return;

      // Check if Shift or NoteMode is active for pencil marks
      const shiftPressed = e.shiftKey;
      if (shiftPressed || isNoteMode) {
        setPencilMarks(prev => {
          const currentMarks = prev[selectedCell] ? new Set(prev[selectedCell]) : new Set<number>();
          if (currentMarks.has(num)) {
            currentMarks.delete(num);
          } else {
            currentMarks.add(num);
          }
          return { ...prev, [selectedCell]: currentMarks };
        });
        // Clear any existing value
        if (onCellChange) onCellChange(selectedCell, 0);
      } else {
        // Place value
        if (onCellChange) onCellChange(selectedCell, num);
        // Clear pencil marks
        setPencilMarks(prev => {
          const updated = { ...prev };
          delete updated[selectedCell];
          return updated;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCell, originalGrid, onCellChange, isPrintOnly, isNoteMode]);

  // Assist Note Selection from Control Bar
  const toggleNotesMode = () => setIsNoteMode(prev => !prev);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Grid container */}
      <div 
        className="grid grid-cols-9 w-full max-w-[450px] aspect-square border-4 border-black bg-black overflow-hidden shadow-md selection:bg-transparent"
        style={{ contentVisibility: 'auto' }}
      >
        {Array.from({ length: 81 }).map((_, index) => {
          const row = Math.floor(index / 9);
          const col = index % 9;
          const origVal = originalGrid[index];
          const userVal = userEntries[index] || 0;
          const isPrefilled = origVal !== 0;
          const currentVal = isPrefilled ? origVal : userVal;
          const isSelected = selectedCell === index;

          // Border thicknesses for 3x3 partition grids
          const borderBottom = (row === 2 || row === 5) ? 'border-b-4 border-black' : 'border-b border-black/20';
          const borderRight = (col === 2 || col === 5) ? 'border-r-4 border-black' : 'border-r border-black/20';

          // Color themes (High Density Newspaper Look without pre-filled backgrounds)
          let bgClass = 'bg-white';
          let textClass = 'text-black font-extrabold';

          // Determine cell font size based on layout gridsPerPage count
          let fontSizeClass = 'text-xl md:text-2xl';
          if (isPrintOnly) {
            if (gridsPerPage === 1) {
              fontSizeClass = 'text-xl md:text-2xl';
            } else if (gridsPerPage === 2) {
              fontSizeClass = 'text-lg md:text-xl';
            } else if (gridsPerPage === 4) {
              fontSizeClass = 'text-sm md:text-base';
            } else if (gridsPerPage === 6) {
              fontSizeClass = 'text-[11px] font-black leading-none';
            }
          }

          if (isPrefilled) {
            bgClass = 'bg-white'; // pure white background, no prefilled color/shading as requested
            textClass = 'text-black font-black';
          } else if (isSelected && !isPrintOnly) {
            bgClass = 'bg-[#E98074]/35 animate-pulse'; // elegant warm pink/coral focus state
            textClass = 'text-black font-bold';
          } else if (userVal !== 0) {
            if (!isPrintOnly) {
              // Correct vs incorrect numbers (if not printed)
              const isCorrect = userVal === solutionGrid[index];
              bgClass = isCorrect ? 'bg-green-100/80' : 'bg-red-100/80';
              textClass = isCorrect ? 'text-green-800 font-bold' : 'text-red-700 font-bold';
            } else {
              bgClass = 'bg-white';
              textClass = 'text-black font-extrabold';
            }
          }

          return (
            <div
              id={`cell-${index}`}
              key={index}
              onClick={() => handleCellClick(index)}
              className={`flex items-center justify-center relative aspect-square cursor-pointer transition-colors select-none ${bgClass} ${textClass} ${borderBottom} ${borderRight}`}
            >
              {currentVal !== 0 ? (
                <span className={`${fontSizeClass} font-serif leading-none`}>
                  {currentVal}
                </span>
              ) : (
                // Pencil marks rendering (3x3 grid inside cell)
                !isPrintOnly && pencilMarks[index] && pencilMarks[index].size > 0 && (
                  <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 text-[8px] leading-tight font-mono text-gray-500">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <span key={num} className="text-center">
                        {pencilMarks[index].has(num) ? num : ''}
                      </span>
                    ))}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Mini Helper Bar (Desktop solving controls) */}
      {!isPrintOnly && selectedCell !== null && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 select-none w-full max-w-[450px]">
          {/* Quick numbers bar */}
          <div className="bg-[#D8C3A5] border border-black p-1 flex rounded gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                id={`btn-num-${num}`}
                key={num}
                onClick={() => {
                  if (onCellChange) onCellChange(selectedCell, num);
                  setPencilMarks(prev => {
                    const updated = { ...prev };
                    delete updated[selectedCell];
                    return updated;
                  });
                }}
                className="w-8 h-8 rounded border border-black text-sm font-sans font-bold bg-white text-black hover:bg-[#E98074] hover:text-white flex items-center justify-center active:scale-95 transition-all"
              >
                {num}
              </button>
            ))}
            <button
              id="btn-num-clear"
              onClick={() => {
                if (onCellChange) onCellChange(selectedCell, 0);
                setPencilMarks(prev => {
                  const updated = { ...prev };
                  delete updated[selectedCell];
                  return updated;
                });
              }}
              className="px-2.5 h-8 rounded border border-black text-xs font-sans font-bold bg-white hover:bg-[#E98074] hover:text-white flex items-center justify-center text-red-700 active:scale-95 transition-all"
            >
              X
            </button>
          </div>

          {/* Notes Switcher */}
          <button
            id="btn-note-toggle"
            onClick={toggleNotesMode}
            className={`cursor-pointer px-3 py-1.5 rounded text-xs font-sans font-bold flex items-center gap-1.5 border border-black transition-all ${
              isNoteMode ? 'bg-black text-[#EAE7DC]' : 'bg-white text-black hover:bg-black/10'
            }`}
          >
            ✏️ Notes: {isNoteMode ? 'ON' : 'OFF'}
          </button>
        </div>
      )}
    </div>
  );
}
