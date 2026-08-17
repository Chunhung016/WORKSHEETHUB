import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, CheckCircle2, ArrowRight, RefreshCw, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { WorksheetItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface QRScannerModalProps {
  worksheets: WorksheetItem[];
  onSelectWorksheet: (ws: WorksheetItem) => void;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  worksheets,
  onSelectWorksheet,
  onClose,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [matchedWorksheet, setMatchedWorksheet] = useState<WorksheetItem | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stopScannerSafely = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        // silent catch
      }
    }
  };

  const handleMatchedCode = (decodedText: string) => {
    const cleanText = decodedText.trim();

    // 1. Match with worksheet qrCodeId (case-insensitive) or ID
    const match = worksheets.find(
      (w) => w.qrCodeId.toLowerCase() === cleanText.toLowerCase() || w.id === cleanText
    );

    if (match) {
      stopScannerSafely();
      setIsCameraActive(false);
      setMatchedWorksheet(match);
      return;
    }

    // 2. If it is a direct PDF link or Google Drive link
    if (cleanText.endsWith('.pdf') || cleanText.includes('drive.google.com') || cleanText.startsWith('http')) {
      const dynamicWs: WorksheetItem = {
        id: `scanned-${Date.now()}`,
        qrCodeId: 'SCANNED-QR',
        title: 'Worksheet Answer Document',
        gradeClass: 'STD 1',
        subject: 'General',
        pdfUrl: cleanText,
      };
      stopScannerSafely();
      setIsCameraActive(false);
      setMatchedWorksheet(dynamicWs);
      return;
    }

    // Fallback: Notify teacher
    alert(`QR Code "${cleanText}" was not found in the worksheet database.`);
  };

  const startScanner = async () => {
    try {
      const qrRegionId = 'qr-reader-container';
      const html5QrCode = new Html5Qrcode(qrRegionId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 12,
          qrbox: { width: 220, height: 220 },
        },
        (decodedText) => {
          handleMatchedCode(decodedText);
        },
        () => {}
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera scanner initialization:', err);
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      stopScannerSafely();
    };
  }, [worksheets]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleMatchedCode(manualCode.trim());
  };

  const handleScanAnother = () => {
    setMatchedWorksheet(null);
    setManualCode('');
    setTimeout(() => {
      startScanner();
    }, 200);
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-amber-300 relative text-center flex flex-col items-center overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            stopScannerSafely();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-amber-50 cursor-pointer z-30"
        >
          <X className="w-6 h-6" />
        </button>

        <AnimatePresence mode="wait">
          {matchedWorksheet ? (
            /* Information Overlay showing Worksheet Details, Class & Subject */
            <motion.div
              key="info-overlay"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex flex-col items-center py-2"
            >
              {/* Mascot & Success Icon */}
              <div className="relative mb-3">
                <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-4xl shadow-lg border-3 border-white">
                  🐝
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <span className="text-[11px] font-black uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-0.5 rounded-full mb-1">
                Worksheet Found
              </span>

              <h2 className="text-xl sm:text-2xl font-black text-amber-950 px-2 leading-snug mb-3">
                {matchedWorksheet.title}
              </h2>

              {/* Information Cards: Class, Subject, QR ID */}
              <div className="w-full bg-gradient-to-b from-amber-50 to-yellow-50/60 p-4 rounded-2xl border-2 border-amber-200 shadow-inner mb-5 space-y-2.5 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                    <GraduationCap className="w-4 h-4 text-amber-600" />
                    <span>Class / Grade:</span>
                  </div>
                  <span className="bg-amber-400 text-amber-950 px-3 py-0.5 rounded-xl font-black text-xs shadow-sm border border-amber-300">
                    {matchedWorksheet.gradeClass || 'STD 1'}
                  </span>
                </div>

                <div className="h-px bg-amber-200/80" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    <span>Subject:</span>
                  </div>
                  <span className="bg-white text-amber-950 px-3 py-0.5 rounded-xl font-black text-xs border border-amber-300 shadow-sm">
                    {matchedWorksheet.subject || 'General'}
                  </span>
                </div>

                <div className="h-px bg-amber-200/80" />

                <div className="flex items-center justify-between">
                  <span className="text-amber-900/80 font-bold text-[11px]">QR Code Reference:</span>
                  <span className="font-mono text-amber-950 font-black text-xs bg-amber-200/80 px-2.5 py-0.5 rounded-lg">
                    {matchedWorksheet.qrCodeId}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleScanAnother}
                  className="flex-1 py-3 px-4 rounded-2xl bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-950 font-black text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer border border-amber-300"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Scan Another</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectWorksheet(matchedWorksheet);
                  }}
                  className="flex-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 active:scale-95 text-amber-950 font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border-2 border-white shadow-lg"
                >
                  <span>Open Answer Sheet</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            /* Active Camera Scanner View */
            <motion.div
              key="scanner-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              <h2 className="text-2xl font-black text-amber-950 mb-1 flex items-center justify-center gap-2">
                <span>🐝</span>
                <span>Scan Worksheet QR</span>
              </h2>
              <p className="text-xs text-amber-900/70 mb-4 font-semibold">
                Point camera at worksheet QR code
              </p>

              {/* Camera Scanner Viewfinder */}
              <div className="relative w-full aspect-square max-w-[260px] bg-amber-950 rounded-2xl overflow-hidden border-4 border-amber-300 shadow-inner flex flex-col items-center justify-center mb-4">
                <div id="qr-reader-container" className="w-full h-full"></div>
              </div>

              {/* Manual Code Input Form */}
              <form onSubmit={handleManualSubmit} className="w-full flex gap-2 mt-1">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Or type QR code (e.g. BEE-ABC-01)..."
                  className="flex-1 rounded-xl border-2 border-amber-300 px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 text-amber-950 placeholder-amber-900/40 bg-amber-50/50 uppercase"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-950 font-black text-xs rounded-xl border-2 border-white shadow transition-all cursor-pointer active:scale-95"
                >
                  Find
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
