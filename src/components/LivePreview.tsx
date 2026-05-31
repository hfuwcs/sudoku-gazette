/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useTranslation } from '../localization';
import { LayoutConfig, PuzzleData } from '../types';
import SudokuGrid from './SudokuGrid';
import { QRCodeSVG } from 'qrcode.react';

interface LivePreviewProps {
  config: LayoutConfig;
  puzzles: PuzzleData[];
}

export default function LivePreview({ config, puzzles }: LivePreviewProps) {
  const { lang, t } = useTranslation();

  // Inject @page size rule so the browser print dialog defaults to the correct paper
  useEffect(() => {
    const id = 'dynamic-print-page-size';
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      document.head.appendChild(el);
    }
    const size = config.paperSize === 'A4' ? 'A4' : 'letter';
    el.textContent = `@page { size: ${size} portrait; margin: 0; }`;
  }, [config.paperSize]);

  // Paper aspect ratio — only apply on sm+ screens; on mobile let content set height
  const isA4 = config.paperSize === 'A4';
  const pageRatioStyle = isA4
    ? 'w-full max-w-[720px] sm:aspect-[1/1.414] aspect-auto'
    : 'w-full max-w-[720px] sm:aspect-[8.5/11] aspect-auto';

  // Absolute paper dimensions for print — bypasses the broken height:100% chain
  const paperStyle = isA4
    ? ({ '--paper-w': '210mm', '--paper-h': '297mm' } as React.CSSProperties)
    : ({ '--paper-w': '8.5in', '--paper-h': '11in' } as React.CSSProperties);

  // Chop puzzles into pages based on gridsPerPage
  const pages: PuzzleData[][] = [];
  const gridsPerPage = config.gridsPerPage;
  const pageCount = config.pageCount;

  for (let i = 0; i < pageCount; i++) {
    const startIdx = i * gridsPerPage;
    const pagePuzzles = puzzles.slice(startIdx, startIdx + gridsPerPage);
    if (pagePuzzles.length > 0) {
      pages.push(pagePuzzles);
    }
  }

  const getGridClass = (count: number) => {
    switch (count) {
      case 1:
        return 'grid-cols-1 grid-rows-1 gap-12 justify-center items-center sm:h-full p-8';
      case 2:
        return 'grid-cols-1 grid-rows-2 gap-8 justify-center sm:h-full p-6';
      case 4:
        return 'grid-cols-2 grid-rows-2 gap-x-6 gap-y-4 justify-center sm:h-full p-5';
      case 6:
        return 'grid-cols-2 grid-rows-3 gap-x-4 gap-y-1.5 justify-center sm:h-full p-2';
      default:
        return 'grid-cols-2 grid-rows-2 gap-6';
    }
  };

  const getSolveUrl = (puzzleId: string) => {
    // Dynamically fallback to current workspace URL
    const rootUrl = window.location.origin;
    return `${rootUrl}/?solveId=${puzzleId}`; // Using URL query search parameters is highly robust for standard SPA/fullstack lookup routers inside iframes or new tabs!
  };

  return (
    <div className="w-full flex flex-col items-center gap-10 mt-2">
      {/* Container header */}
      <div className="w-full text-center border-b pb-2 border-dashed border-black/40 mb-2 select-none LivePreview-header">
        <h3 className="font-sans font-extrabold text-sm text-black uppercase tracking-wider">
          PRESS SECTIONS PREVIEW
        </h3>
        <p className="text-[11px] text-gray-700 italic font-serif">
          {t('success_generated')}
        </p>
      </div>

      {/* Pages Container - target for Print Media Queries */}
      <div id="print-area" className="w-full flex flex-col items-center gap-8">
        {pages.map((pagePuzzles, pageIdx) => (
          <div
            key={pageIdx}
            className={`print-page bg-white border-2 border-black shadow-lg relative p-8 flex flex-col justify-between overflow-hidden text-black ${pageRatioStyle}`}
            style={paperStyle}
          >
            {/* Page Header (Gazette style) */}
            <div className="border-b-2 border-double border-black pb-1.5 mb-2 flex justify-between items-center text-[10px] font-sans uppercase tracking-widest font-black">
              <span>{t('app_title')} — SECTION {String.fromCharCode(65 + pageIdx)}</span>
              <span>{t('difficulty')}: {t(config.difficulty as any)}</span>
              <span>SHEET {pageIdx + 1} OF {pages.length}</span>
            </div>

            {/* Grids Layout */}
            <div className={`grid flex-1 ${getGridClass(gridsPerPage)}`}>
              {pagePuzzles.map((puzzle, puzzleIdx) => {
                const solveUrl = getSolveUrl(puzzle.puzzleId);
                const isSingle = gridsPerPage === 1;

                // Dynamically scale parameters to prevent any content overlaps or vertical page overflows
                let gridScale = 'max-w-[200px] md:max-w-[245px]';
                let qrSize = 46;
                let metaMaxWidth = 'max-w-[180px] md:max-w-[210px]';
                const itemPadding = gridsPerPage === 6 ? 'p-1.5 md:p-2' : 'p-3';

                if (gridsPerPage === 1) {
                  gridScale = 'max-w-[340px] md:max-w-[390px]';
                  qrSize = 54;
                  metaMaxWidth = 'max-w-[280px] md:max-w-[320px]';
                } else if (gridsPerPage === 2) {
                  gridScale = 'max-w-[250px] md:max-w-[280px]';
                  qrSize = 48;
                  metaMaxWidth = 'max-w-[220px] md:max-w-[250px]';
                } else if (gridsPerPage === 4) {
                  gridScale = 'max-w-[180px] md:max-w-[215px]';
                  qrSize = 42;
                  metaMaxWidth = 'max-w-[180px] md:max-w-[205px]';
                } else if (gridsPerPage === 6) {
                  gridScale = 'max-w-[138px] md:max-w-[155px]';
                  qrSize = 32;
                  metaMaxWidth = 'max-w-[138px] md:max-w-[155px]';
                }

                return (
                  <div
                    key={puzzle.puzzleId}
                    className={`flex flex-col items-center justify-center border border-black bg-white select-none ${itemPadding}`}
                  >
                    {/* Tiny puzzle title */}
                    <span className="font-sans text-[9px] uppercase tracking-widest font-bold text-gray-500 mb-1">
                      GRID {pageIdx * gridsPerPage + puzzleIdx + 1}
                    </span>

                    {/* True Vector Sudoku board */}
                    <div className={`w-full ${gridScale} selection:bg-transparent`}>
                      <SudokuGrid
                        board={puzzle.board}
                        solution={puzzle.solution}
                        isPrintOnly={true}
                        gridsPerPage={gridsPerPage}
                      />
                    </div>

                    {/* Metadata block (Puzzle ID, Instructions & QR Code) */}
                    <div className={`w-full ${metaMaxWidth} flex items-center justify-between gap-1.5 mt-1.5 pt-1.5 border-t border-dashed border-black/30`}>
                      {/* Left: ID & Scan labels */}
                      <div className="flex-1 flex flex-col text-left font-sans min-w-0 select-text">
                        <span className={`font-bold uppercase text-black leading-none ${gridsPerPage === 6 ? 'text-[9px]' : 'text-[11px] md:text-xs'}`}>
                          {t('puzzle_id')}: #{puzzle.puzzleId}
                        </span>
                        <p className={`leading-snug font-serif text-gray-700 mt-0.5 ${gridsPerPage === 6 ? 'text-[6px] max-w-[85px]' : 'text-[7.5px] max-w-[140px]'}`}>
                          {t('scan_or_lookup')}
                        </p>
                      </div>

                      {/* Right: Sharp SVG QR Code */}
                      <div className="flex flex-col items-center gap-0.5 select-none bg-white p-0.5 border border-neutral-300 flex-shrink-0">
                        <QRCodeSVG 
                          value={solveUrl} 
                          size={qrSize} 
                          level="M" 
                          includeMargin={false} 
                        />
                        <span className={`font-mono text-gray-500 uppercase tracking-tighter leading-none ${gridsPerPage === 6 ? 'text-[5px]' : 'text-[6px]'}`}>
                          {t('scan_instruction')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vintage footer */}
            <div className="border-t border-black pt-1.5 mt-2 flex justify-between items-center text-[8px] font-sans text-gray-500 uppercase tracking-widest">
              <span>{t('footer_text')}</span>
              <span>© {new Date().getFullYear()} SUDOKU PUBLISHING GROUP</span>
              <span>© Hfuwcs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
