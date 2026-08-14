import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { WorksheetItem } from '../types';
import { SecurePdfViewer } from './SecurePdfViewer';
import { requestFullScreenMode } from '../utils/fullscreen';

interface PresenterPlayerProps {
  worksheet: WorksheetItem;
  onExit: () => void;
  onOpenScanner?: () => void;
}

export const PresenterPlayer: React.FC<PresenterPlayerProps> = ({
  worksheet,
  onExit,
}) => {
  useEffect(() => {
    requestFullScreenMode();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-b from-amber-100 via-yellow-50 to-amber-100 flex flex-col justify-between select-none overflow-hidden z-40">
      {/* Clean, Minimalist Header - Just Back Button & Worksheet Name */}
      <header className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 border-b-4 border-amber-300 px-3 md:px-6 py-2.5 flex items-center justify-between shadow-md z-30 flex-shrink-0 relative">
        {/* Top Gloss Highlight */}
        <div className="absolute top-0 inset-x-0 h-1 bg-white/40 pointer-events-none" />

        {/* Left: Back / Exit Button */}
        <button
          onClick={onExit}
          className="flex items-center space-x-1.5 text-amber-950 bg-amber-100/90 hover:bg-white active:scale-95 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-sm border-2 border-white flex-shrink-0"
          title="Back to home screen"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Center: Clean Worksheet Name + Class & Subject Pill */}
        <div className="flex items-center space-x-2 min-w-0 mx-2 text-center">
          {worksheet.gradeClass && (
            <span className="bg-amber-950 text-amber-300 px-2.5 py-1 rounded-xl text-xs font-black shadow-inner flex-shrink-0 border border-amber-900 hidden sm:inline-block">
              {worksheet.gradeClass}
            </span>
          )}
          {worksheet.subject && (
            <span className="bg-white/80 text-amber-950 px-2.5 py-1 rounded-xl text-xs font-black shadow-sm flex-shrink-0 border border-amber-300 hidden md:inline-block">
              {worksheet.subject}
            </span>
          )}
          <span className="text-sm sm:text-base md:text-lg font-black text-amber-950 truncate max-w-xs sm:max-w-md md:max-w-xl drop-shadow-sm">
            {worksheet.title}
          </span>
        </div>

        {/* Right: Balance Spacer */}
        <div className="w-16 sm:w-20"></div>
      </header>

      {/* Maximized PDF Display Canvas (Full Device Max Screen) */}
      <main className="flex-1 w-full h-[calc(100vh-56px)] relative overflow-hidden">
        <SecurePdfViewer
          pdfUrl={worksheet.pdfUrl}
          title={worksheet.title}
          qrCodeId={worksheet.qrCodeId}
        />
      </main>
    </div>
  );
};
