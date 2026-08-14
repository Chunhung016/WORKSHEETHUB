import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Lock } from 'lucide-react';
import { motion } from 'motion/react';

// Set up PDF.js worker using standard CDN matching pdfjs-dist version
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker initialization error:', e);
}

interface SecurePdfViewerProps {
  pdfUrl: string;
  title: string;
  qrCodeId: string;
}

export const SecurePdfViewer: React.FC<SecurePdfViewerProps> = ({
  pdfUrl,
  title,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isIframeFallback, setIsIframeFallback] = useState<boolean>(false);
  const [showSecurityToast, setShowSecurityToast] = useState(false);

  // Trigger security toast
  const triggerSecurityWarning = useCallback(() => {
    setShowSecurityToast(true);
    const timer = setTimeout(() => setShowSecurityToast(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Anti-Theft Event Handlers: Disable right-click & key shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerSecurityWarning();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Print, Save, Inspect
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'p' || e.key === 's' || e.key === 'u' || e.key === 'c')
      ) {
        e.preventDefault();
        triggerSecurityWarning();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [triggerSecurityWarning]);

  // Load PDF Document
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setIsIframeFallback(false);

    const loadDocument = async () => {
      try {
        let loadingTask;

        // If it's base64 or blob URL
        if (pdfUrl.startsWith('data:application/pdf;base64,') || pdfUrl.startsWith('data:;base64,')) {
          const base64Data = pdfUrl.split(',')[1];
          const raw = window.atob(base64Data);
          const rawLength = raw.length;
          const array = new Uint8Array(new ArrayBuffer(rawLength));
          for (let i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
          }
          loadingTask = pdfjsLib.getDocument({ data: array });
        } else if (pdfUrl.startsWith('blob:') || pdfUrl.startsWith('http')) {
          // Attempt loading via direct URL
          loadingTask = pdfjsLib.getDocument({
            url: pdfUrl,
            withCredentials: false,
          });
        } else {
          // Plain base64 fallback
          loadingTask = pdfjsLib.getDocument(pdfUrl);
        }

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (err: any) {
        console.warn('PDF.js canvas rendering notice:', err);
        if (!isMounted) return;

        // Fallback for cross-origin URLs without CORS headers
        setIsIframeFallback(true);
        setLoading(false);
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  // Render individual page to canvas (Auto-fit to container for maximum clarity on laptop, pc, ipad, iphone)
  const renderPage = useCallback(
    async (pageNum: number, canvas: HTMLCanvasElement | null) => {
      if (!pdfDoc || !canvas || !containerRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const containerWidth = containerRef.current.clientWidth || window.innerWidth;
        const containerHeight = containerRef.current.clientHeight || window.innerHeight;

        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // Responsive auto-scaling for PC/Laptop/Tablet/Phone
        let targetWidth = containerWidth - 32;
        if (containerWidth > 1200) {
          // Desktop / PC: Balanced display width
          targetWidth = Math.min(containerWidth - 64, 1100);
        } else if (containerWidth > 768) {
          // iPad / Tablet: Generous width
          targetWidth = Math.min(containerWidth - 40, 900);
        } else {
          // Mobile / iPhone: Fill full width with slight padding
          targetWidth = Math.max(containerWidth - 16, 280);
        }

        const calculatedScale = targetWidth / unscaledViewport.width;
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: calculatedScale * dpr });

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error(`Error rendering page ${pageNum}:`, err);
      }
    },
    [pdfDoc]
  );

  // Render all pages in continuous view
  useEffect(() => {
    if (!pdfDoc) return;

    for (let i = 1; i <= numPages; i++) {
      const canvas = canvasRefs.current[i - 1];
      if (canvas) {
        renderPage(i, canvas);
      }
    }
  }, [pdfDoc, numPages, renderPage]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (pdfDoc) {
        for (let i = 1; i <= numPages; i++) {
          renderPage(i, canvasRefs.current[i - 1]);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfDoc, numPages, renderPage]);

  // Convert URLs for fallback viewer if needed
  let safeEmbedUrl = pdfUrl.trim();
  if (safeEmbedUrl.includes('drive.google.com')) {
    const match = safeEmbedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      safeEmbedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  } else if (!safeEmbedUrl.startsWith('data:') && !safeEmbedUrl.startsWith('blob:')) {
    safeEmbedUrl = `${safeEmbedUrl}#toolbar=0&navpanes=0&scrollbar=1`;
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-gradient-to-b from-amber-100 via-yellow-50/70 to-amber-100 select-none overflow-hidden relative"
      onContextMenu={(e) => {
        e.preventDefault();
        triggerSecurityWarning();
      }}
    >
      {/* Decorative Subtle Honeycomb Pattern Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="inner-hexagons-clean" width="56" height="96" patternUnits="userSpaceOnUse">
              <path
                d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 48 L56 64 L56 96 L28 112 L0 96 L0 64 Z"
                fill="none"
                stroke="#d97706"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#inner-hexagons-clean)" />
        </svg>
      </div>

      {/* Security Toast Notification */}
      {showSecurityToast && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 px-5 py-2.5 rounded-full shadow-2xl font-black text-xs flex items-center space-x-2 border-2 border-white animate-bounce">
          <Lock className="w-4 h-4" />
          <span>Protected answer document: Downloading and copying are restricted.</span>
        </div>
      )}

      {/* Main Canvas Presentation Stage - Maximized with Zero Unnecessary Toolbars */}
      <div className="flex-1 overflow-y-auto overflow-x-auto relative flex flex-col items-center p-2 sm:p-4 md:p-6">
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-24 text-amber-950">
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [0, 8, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="text-6xl filter drop-shadow-md"
            >
              🐝
            </motion.div>
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-black tracking-wide text-amber-900">
                Opening Answer Sheet...
              </p>
            </div>
          </div>
        )}

        {!loading && isIframeFallback && (
          /* Secure fallback sandbox styled in warm honey card */
          <div className="w-full h-full max-w-5xl flex flex-col relative rounded-2xl overflow-hidden bg-white shadow-2xl border-4 border-amber-300">
            <iframe
              src={safeEmbedUrl}
              title={title}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
            {/* Transparent protection shield */}
            <div
              className="absolute inset-0 pointer-events-none border-4 border-amber-400/20 rounded-2xl"
              style={{ userSelect: 'none' }}
            />
          </div>
        )}

        {!loading && !isIframeFallback && pdfDoc && (
          <div className="w-full flex flex-col items-center space-y-6 max-w-full pb-10">
            {Array.from({ length: numPages }, (_, index) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                key={`page-${index + 1}`}
                className="relative bg-white rounded-2xl shadow-xl shadow-amber-900/10 overflow-hidden border-2 border-amber-200/90 flex flex-col items-center"
              >
                <canvas
                  ref={(el) => (canvasRefs.current[index] = el)}
                  className="block pointer-events-none max-w-full"
                />
                {/* Honey Page Indicator Badge for multi-page documents */}
                {numPages > 1 && (
                  <span className="absolute bottom-2.5 right-3 bg-amber-200/90 backdrop-blur-md text-amber-950 font-black px-2.5 py-0.5 rounded-lg text-[10px] border border-amber-300 shadow-sm pointer-events-none">
                    Page {index + 1} of {numPages}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
