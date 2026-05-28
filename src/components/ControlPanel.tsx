/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from '../localization';
import { Difficulty, PaperSize, LayoutConfig } from '../types';
import { Sliders, Printer, RefreshCw, FileText } from 'lucide-react';

interface ControlPanelProps {
  config: LayoutConfig;
  onChange: (config: LayoutConfig) => void;
  onGenerate: () => void;
  onPrint: () => void;
  isGenerating: boolean;
}

export default function ControlPanel({
  config,
  onChange,
  onGenerate,
  onPrint,
  isGenerating
}: ControlPanelProps) {
  const { t } = useTranslation();

  const setConfigVal = (key: keyof LayoutConfig, val: any) => {
    onChange({
      ...config,
      [key]: val
    });
  };

  const difficultyLevels: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
  const gridsOpts: (1 | 2 | 4 | 6)[] = [1, 2, 4, 6];
  const formatOpts: PaperSize[] = ['A4', 'Letter'];

  return (
    <aside className="w-full bg-[#D8C3A5] border-2 border-black p-5 relative select-none">
      {/* Decorative vintage double-line headers */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-black" />
      
      <div className="flex items-center gap-2 mb-4 border-b pb-2 border-black/20">
        <Sliders className="w-4 h-4 text-black" />
        <h2 className="font-sans font-extrabold text-sm text-black uppercase tracking-wider">
          LAYOUT CONFIGURATION
        </h2>
      </div>

      {/* Grid Settings Grid */}
      <div className="space-y-4 font-sans text-[#333]">
        {/* Difficulty Selection */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-black mb-1">
            {t('difficulty')}
          </label>
          <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
            {difficultyLevels.map((lvl) => (
              <button
                id={`btn-diff-${lvl}`}
                key={lvl}
                type="button"
                onClick={() => setConfigVal('difficulty', lvl)}
                className={`cursor-pointer px-2 py-1 text-[11px] font-bold text-center capitalize border transition-all ${
                  config.difficulty === lvl
                    ? 'bg-black border-black text-[#EAE7DC]'
                    : 'bg-white border-black text-[#333] hover:bg-black hover:text-white'
                }`}
              >
                {t(lvl as any)}
              </button>
            ))}
          </div>
        </div>

        {/* Paper Size & Grids per page */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-black mb-1">
              {t('paper_size')}
            </label>
            <div className="flex gap-1">
              {formatOpts.map((size) => (
                <button
                  id={`btn-paper-${size}`}
                  key={size}
                  type="button"
                  onClick={() => setConfigVal('paperSize', size)}
                  className={`cursor-pointer flex-1 py-1 text-[11px] font-bold border transition-all ${
                    config.paperSize === size
                      ? 'bg-black border-black text-[#EAE7DC]'
                      : 'bg-white border-black text-[#333] hover:bg-black hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-black mb-1">
              {t('grids_per_page')}
            </label>
            <div className="grid grid-cols-4 gap-1">
              {gridsOpts.map((opt) => (
                <button
                  id={`btn-grids-per-page-${opt}`}
                  key={opt}
                  type="button"
                  onClick={() => setConfigVal('gridsPerPage', opt)}
                  className={`cursor-pointer py-1 text-[11px] font-bold border transition-all ${
                    config.gridsPerPage === opt
                      ? 'bg-black border-black text-[#EAE7DC]'
                      : 'bg-white border-black text-[#333] hover:bg-black hover:text-white'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Page counts */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-black mb-1">
            {t('pages_to_generate')}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="input-page-count"
              type="number"
              min={1}
              max={12}
              value={config.pageCount}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 12) {
                  setConfigVal('pageCount', val);
                }
              }}
              className="w-16 px-2 py-1 border border-black bg-white text-center font-mono font-bold text-xs text-black focus:outline-none"
            />
            <span className="text-[10px] text-gray-700 italic lowercase select-none">
              (max 12 sheets)
            </span>
          </div>
        </div>

        {/* Compile Controls Button Group */}
        <div className="pt-2 border-t border-black/25 flex flex-col gap-2 mt-2">
          {/* Main sheets generator click action */}
          <button
            id="btn-trigger-generate"
            type="button"
            disabled={isGenerating}
            onClick={onGenerate}
            className={`cursor-pointer w-full py-3 bg-black text-white font-bold uppercase text-xs tracking-widest hover:bg-[#E98074] hover:text-white transition-colors duration-200 flex items-center justify-center gap-2 border border-black ${
              isGenerating ? 'opacity-60 cursor-not-allowed bg-neutral-900 border-neutral-900' : ''
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? t('generating') : t('generate_print')}
          </button>

          {/* Natural window print caller */}
          <button
            id="btn-trigger-print"
            type="button"
            onClick={onPrint}
            className="cursor-pointer w-full py-3 border-2 border-black bg-transparent text-black font-bold uppercase text-xs tracking-widest hover:bg-white transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Printer className="w-3.5 h-3.5" />
            {t('print_pdf')}
          </button>
        </div>
      </div>

      {/* Gazette Instructions Sub-section */}
      <div className="mt-5 pt-3 border-t border-black/30 text-xs leading-relaxed text-neutral-800 font-serif">
        <h3 className="font-bold text-black uppercase tracking-wider mb-1.5 font-sans flex items-center gap-1 select-none text-[11px]">
          <FileText className="w-3.5 h-3.5 text-black" />
          {t('instructions_title')}
        </h3>
        <ul className="space-y-1 text-[11px] text-neutral-700">
          <li>{t('newspaper_inst_1')}</li>
          <li>{t('newspaper_inst_2')}</li>
          <li>{t('newspaper_inst_3')}</li>
        </ul>
      </div>
    </aside>
  );
}
