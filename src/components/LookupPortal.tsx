/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../localization';
import { Difficulty, PuzzleData } from '../types';
import SudokuGrid from './SudokuGrid';
import { Search, RotateCcw, Eye, ShieldAlert, CheckCircle, ArrowLeft } from 'lucide-react';

interface LookupPortalProps {
  initialSearchId?: string | null;
  onBackToGenerator?: () => void;
}

export default function LookupPortal({
  initialSearchId,
  onBackToGenerator
}: LookupPortalProps) {
  const { t } = useTranslation();
  const [searchId, setSearchId] = useState('');
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States for player gameplay
  const [userEntries, setUserEntries] = useState<Record<number, number>>({});
  const [isShowingSolution, setIsShowingSolution] = useState(false);

  // Auto-search if an initial ID is provided (e.g., scanning QR Code with query ?solveId=E1002)
  useEffect(() => {
    if (initialSearchId) {
      setSearchId(initialSearchId);
      fetchPuzzle(initialSearchId);
    }
  }, [initialSearchId]);

  const fetchPuzzle = async (idToSearch: string) => {
    const cleanId = idToSearch.toUpperCase().trim();
    if (!cleanId) return;

    setLoading(true);
    setErrorMsg(null);
    setPuzzle(null);
    setIsShowingSolution(false);
    setUserEntries({});

    try {
      const response = await fetch(`/api/puzzles/${cleanId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setErrorMsg(t('result_not_found'));
        } else {
          setErrorMsg(t('load_error'));
        }
        return;
      }

      const data: PuzzleData = await response.json();
      setPuzzle(data);
    } catch (err) {
      console.error('Fetch puzzle error:', err);
      setErrorMsg(t('load_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPuzzle(searchId);
  };

  const handleCellChange = (index: number, val: number) => {
    setUserEntries(prev => {
      const updated = { ...prev };
      if (val === 0) {
        delete updated[index];
      } else {
        updated[index] = val;
      }
      return updated;
    });
  };

  const clearWorkspace = () => {
    setUserEntries({});
    setIsShowingSolution(false);
  };

  const revealFullSolution = () => {
    if (!puzzle) return;
    
    // Fill user entries with solution values for empty cells
    const solutionArray = puzzle.solution.split('').map(Number);
    const originalArray = puzzle.board.split('').map(Number);
    const newEntries: Record<number, number> = {};

    originalArray.forEach((val, idx) => {
      if (val === 0) {
        newEntries[idx] = solutionArray[idx];
      }
    });

    setUserEntries(newEntries);
    setIsShowingSolution(true);
  };

  // Helper check to see if the user solved the entire grid correctly
  const checkCompletionStatus = (): boolean => {
    if (!puzzle) return false;
    const solutionArray = puzzle.solution.split('').map(Number);
    const originalArray = puzzle.board.split('').map(Number);

    for (let i = 0; i < 81; i++) {
      if (originalArray[i] === 0) {
        const userVal = userEntries[i];
        if (!userVal || userVal !== solutionArray[i]) {
          return false;
        }
      }
    }
    return true;
  };

  const isSolvedCorrectly = checkCompletionStatus();

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center bg-[#D8C3A5]/30 border-2 border-black p-6 relative select-none">
      {/* Newspaper double borders top */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-black" />

      {/* Back to Grid Compiler navigation */}
      {onBackToGenerator && (
        <button
          id="btn-back-to-generator"
          onClick={onBackToGenerator}
          className="cursor-pointer self-start flex items-center gap-1.5 text-xs font-sans font-extrabold uppercase text-gray-800 hover:text-black mb-4 select-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('back_to_generator')}
        </button>
      )}

      <div className="w-full text-center border-b pb-2 border-dashed border-black/40 mb-6">
        <h2 className="font-sans font-extrabold text-lg text-black uppercase tracking-wider">
          SOLUTION ARCHIVE LOOKUP
        </h2>
        <p className="text-[11px] text-gray-700 italic font-serif">
          {t('scan_or_lookup')}
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="w-full max-w-md flex items-center gap-2 mb-6 font-sans">
        <div className="relative flex-1">
          <input
            id="input-puzzle-search"
            type="text"
            required
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full px-3 py-2 pl-9 border-2 border-black bg-white text-xs font-bold uppercase placeholder-gray-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        </div>
        <button
          id="btn-search-lookup"
          type="submit"
          className="cursor-pointer px-4 py-2 border-2 border-black uppercase font-bold text-xs text-[#EAE7DC] bg-black hover:bg-[#E98074] hover:text-white transition-all"
        >
          {loading ? t('searching') : t('search_button')}
        </button>
      </form>

      {/* Loading & Errors Status displays */}
      {loading && (
        <div className="py-12 flex flex-col items-center gap-2 justify-center">
          <div className="w-8 h-8 border-3 border-t-transparent border-black rounded-full animate-spin" />
          <span className="text-xs font-mono font-bold text-gray-600 uppercase tracking-widest">
            {t('searching')}
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="w-full max-w-md p-4 bg-red-50 border border-red-200 rounded flex gap-2.5 items-center justify-center text-red-700 text-xs font-sans font-bold">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Lookup Success Board layout */}
      {puzzle && !loading && (
        <div className="w-full flex flex-col items-center gap-6 mt-2">
          {/* Headline display of the found puzzle */}
          <div className="text-center">
            <h3 className="font-serif font-black text-lg md:text-xl text-black uppercase tracking-tight">
              {t('solution_for')}: <span className="underline">#{puzzle.puzzleId}</span>
            </h3>
            <div className="flex items-center justify-center gap-2 mt-1.5 font-sans">
              <span className="text-[10px] font-bold bg-[#D8C3A5] px-2 py-0.5 border border-black rounded uppercase text-black">
                {t(puzzle.difficulty as any)}
              </span>
              <span className="text-gray-400 text-xs">•</span>
              <span className="text-xs font-serif text-gray-600 italic">
                Published on {new Date(puzzle.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
              </span>
            </div>
          </div>

          {/* Interactive solver and helper details */}
          <div className="w-full max-w-[450px] space-y-4">
            <p className="text-[11px] leading-relaxed text-gray-700 font-serif italic text-center text-balance">
              {isShowingSolution ? t('showing_solution') : t('interactive_editor')}
            </p>

            {/* Victory overlay banner */}
            {isSolvedCorrectly && (
              <div className="w-full p-3.5 bg-green-50 border border-green-200 rounded flex items-center justify-center gap-2 text-green-800 text-xs font-sans font-bold tracking-tight animate-bounce">
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600" />
                <span>EXCELLENT SOLVING! ALL VALUES VERIFIED CORRECT!</span>
              </div>
            )}

            {/* The actual board canvas */}
            <SudokuGrid
              board={puzzle.board}
              solution={puzzle.solution}
              isPrintOnly={false}
              userEntries={userEntries}
              onCellChange={handleCellChange}
            />

            {/* In-app action controls */}
            <div className="flex w-full gap-2.5 pt-2 font-sans">
              <button
                id="btn-reveal-solution"
                onClick={revealFullSolution}
                className="cursor-pointer flex-1 py-3 bg-black border border-black text-xs font-bold uppercase text-[#EAE7DC] flex items-center justify-center gap-1.5 hover:bg-[#E98074] hover:text-white transition-all"
              >
                <Eye className="w-4 h-4" />
                {t('reveal_solution')}
              </button>

              <button
                id="btn-clear-workspace"
                onClick={clearWorkspace}
                className="cursor-pointer flex-1 py-3 border border-black bg-white text-xs font-bold uppercase text-neutral-800 flex items-center justify-center gap-1.5 hover:bg-gray-100 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                {t('reset_board')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
