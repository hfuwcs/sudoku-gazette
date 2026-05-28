/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Language, LayoutConfig, PuzzleData } from './types';
import { TranslationContext, translations } from './localization';
import NewspaperHeader from './components/NewspaperHeader';
import ControlPanel from './components/ControlPanel';
import LivePreview from './components/LivePreview';
import LookupPortal from './components/LookupPortal';
import { generateSudoku, generateId } from './utils/sudoku';
import { Printer, Library, FilePlus2, BookOpen } from 'lucide-react';

export default function App() {
  // Locale State
  const [lang, setLang] = useState<Language>('en');

  // Translation Helper
  const t = (key: keyof typeof translations.en): string => {
    return translations[lang][key] || translations['en'][key] || String(key);
  };

  // Layout Configuration State
  const [config, setConfig] = useState<LayoutConfig>({
    difficulty: 'medium',
    paperSize: 'Letter',
    gridsPerPage: 2,
    pageCount: 1,
  });

  // Compiled puzzles
  const [puzzles, setPuzzles] = useState<PuzzleData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Router navigation: 'compiler' | 'lookup'
  const [activeTab, setActiveTab] = useState<'compiler' | 'lookup'>('compiler');
  const [urlPuzzleId, setUrlPuzzleId] = useState<string | null>(null);

  // Read search query parameter (to handle QR Code scanning redirects)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const solveId = params.get('solveId');
    if (solveId) {
      setUrlPuzzleId(solveId);
      setActiveTab('lookup');
    }
  }, []);

  // Pre-compile a default worksheet on initial mount
  useEffect(() => {
    compileWorksheets();
  }, []);

  // Bulk sheet generation algorithm
  const compileWorksheets = async () => {
    setIsGenerating(true);
    try {
      const gridsNeeded = config.gridsPerPage * config.pageCount;
      const generatedList: PuzzleData[] = [];

      for (let i = 0; i < gridsNeeded; i++) {
        // Generate values
        const { board, solution } = generateSudoku(config.difficulty);
        const puzzleId = generateId(config.difficulty);

        generatedList.push({
          puzzleId,
          difficulty: config.difficulty,
          board,
          solution,
          createdAt: new Date().toISOString()
        });
      }

      setPuzzles(generatedList);
    } catch (err) {
      console.error('Failure generating sheets:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (puzzles.length > 0) {
      try {
        await fetch('/api/puzzles/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ puzzles })
        });
      } catch (err) {
        console.error('Failed to save puzzles before print:', err);
      }
    }
    window.print();
  };

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      <div className="min-h-screen bg-[#EAE7DC] text-black transition-colors md:px-4 py-6 selection:bg-[#dfdbcf]">
        {/* Main responsive grid layout container */}
        <div id="main-viewport" className="max-w-6xl mx-auto flex flex-col items-center bg-[#EAE7DC] border-4 border-[#8E8D8A] p-4 md:p-8 rounded-sm relative overflow-hidden">
          {/* Masthead Header */}
          <NewspaperHeader />

          {/* Tab Navigation header bar */}
          <nav id="tab-navigation-header" className="w-full flex items-center justify-center border-b-2 border-black pb-px mb-8 text-xs font-sans font-bold uppercase select-none tracking-wider gap-4">
            <button
              id="tab-btn-compiler"
              onClick={() => setActiveTab('compiler')}
              className={`cursor-pointer px-4 py-2 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'compiler'
                  ? 'border-black text-black font-black'
                  : 'border-transparent text-gray-600 hover:text-black hover:border-black/30'
              }`}
            >
              <FilePlus2 className="w-4 h-4 text-black" />
              {lang === 'en' ? 'Grid Compiler' : 'Bộ Chế Đề'}
            </button>
            
            <button
              id="tab-btn-lookup"
              onClick={() => setActiveTab('lookup')}
              className={`cursor-pointer px-4 py-2 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'lookup'
                  ? 'border-black text-black font-black'
                  : 'border-transparent text-gray-600 hover:text-black hover:border-black/30'
              }`}
            >
              <BookOpen className="w-4 h-4 text-black" />
              {lang === 'en' ? 'Solution lookup' : 'Tra cứu Đáp án'}
            </button>
          </nav>

          {/* Subview router */}
          {activeTab === 'compiler' ? (
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column Configuration Controls */}
              <div id="control-panel-aside" className="lg:col-span-4 w-full">
                <ControlPanel
                  config={config}
                  onChange={setConfig}
                  onGenerate={compileWorksheets}
                  onPrint={handlePrint}
                  isGenerating={isGenerating}
                />
              </div>

              {/* Right Column Layout sheet previews */}
              <div className="lg:col-span-8 w-full">
                {puzzles.length > 0 ? (
                  <LivePreview config={config} puzzles={puzzles} />
                ) : (
                  <div className="w-full py-16 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-black/30 bg-white">
                    <span className="text-sm font-sans font-bold text-gray-500">
                      GRID COMPILER IS READY
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full">
              {/* Lookup portal panel */}
              <LookupPortal 
                initialSearchId={urlPuzzleId} 
                onBackToGenerator={() => {
                  setUrlPuzzleId(null);
                  setActiveTab('compiler');
                }}
              />
            </div>
          )}

          {/* Vintage Editorial footer */}
          <footer className="w-full border-t border-black pt-4 mt-12 text-[10px] font-sans uppercase tracking-widest text-[#333] select-none pb-2">
            <span>{t('footer_text')} • © {new Date().getFullYear()} SUDOKU GAZETTE INC.</span>
          </footer>
        </div>
      </div>
    </TranslationContext.Provider>
  );
}
