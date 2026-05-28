/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTranslation } from '../localization';
import { Newspaper, Languages } from 'lucide-react';

export default function NewspaperHeader() {
  const { lang, setLang, t } = useTranslation();

  const formattedDate = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).toUpperCase();

  return (
    <header className="w-full flex flex-col items-center select-none text-black border-b-4 border-double border-black pb-2 mb-6">
      {/* Top Utility Belt */}
      <div className="w-full flex justify-between items-center text-xs font-mono py-1 border-b border-black/20 mb-4 text-[#333]">
        <span>{t('issue')}</span>
        <div className="flex items-center gap-3">
          <Languages className="w-3.5 h-3.5" />
          <button 
            id="lang-en"
            onClick={() => setLang('en')}
            className={`cursor-pointer px-2 py-0.5 rounded text-[10px] font-sans font-bold transition-all ${lang === 'en' ? 'bg-black text-[#EAE7DC]' : 'hover:bg-black/10'}`}
          >
            EN
          </button>
          <span className="text-gray-400">|</span>
          <button 
            id="lang-vi"
            onClick={() => setLang('vi')}
            className={`cursor-pointer px-2 py-0.5 rounded text-[10px] font-sans font-bold transition-all ${lang === 'vi' ? 'bg-black text-[#EAE7DC]' : 'hover:bg-black/10'}`}
          >
            VI
          </button>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="text-center py-2 relative w-full">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black tracking-tighter uppercase font-extrabold text-black drop-shadow-sm select-all">
          {t('app_title')}
        </h1>
        <p className="text-sm italic font-serif text-[#333] mt-1 font-semibold">
          {t('app_subtitle')}
        </p>
      </div>

      {/* Under Title Info Block */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 text-center border-y-2 border-dashed border-black py-1.5 my-2 text-xs font-serif font-semibold uppercase tracking-wider text-[#333]">
        <div className="text-left hidden md:block">
          {t('tagline')}
        </div>
        <div className="text-center font-bold">
          {formattedDate}
        </div>
        <div className="text-right hidden md:block">
          $0.25 CENTS • VOL. XCIII
        </div>
      </div>
    </header>
  );
}
