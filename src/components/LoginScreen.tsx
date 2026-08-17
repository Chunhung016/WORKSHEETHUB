import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface LoginScreenProps {
  onEnter: () => void;
  onOpenAdmin: () => void;
}

const DEFAULT_LOGO_URL = 'https://i.postimg.cc/DzrFcSt2/ezgif-frame-287.jpg';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onEnter, onOpenAdmin }) => {
  const [customLogo, setCustomLogo] = useState<string>(DEFAULT_LOGO_URL);

  useEffect(() => {
    const savedLogo = localStorage.getItem('little_bee_custom_logo');
    if (savedLogo) {
      setCustomLogo(savedLogo);
    }
  }, []);

  // Secret keyboard listener for 'G' key to open admin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'g' || e.key === 'G') {
        const activeTag = (document.activeElement as HTMLElement)?.tagName;
        if (['INPUT', 'TEXTAREA'].includes(activeTag)) return;
        onOpenAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenAdmin]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-100 via-yellow-50 to-amber-100 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Decorative Honeycomb Pattern Background */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="hexagons" width="56" height="96" patternUnits="userSpaceOnUse">
              <path
                d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 48 L56 64 L56 96 L28 112 L0 96 L0 64 Z"
                fill="none"
                stroke="#d97706"
                strokeWidth="2"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" />
        </svg>
      </div>

      {/* Decorative Wavy Honey Drips at the Top */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none flex justify-center opacity-80">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-16 md:h-24 object-cover text-amber-300 drop-shadow-md"
        >
          <path
            d="M0,0 L1440,0 L1440,40 C1380,80 1320,20 1260,60 C1200,95 1140,40 1080,75 C1020,110 960,30 900,70 C840,105 780,25 720,65 C660,100 600,35 540,80 C480,120 420,30 360,70 C300,105 240,40 180,85 C120,115 60,35 0,60 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Animated Floating Honey Bees */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -25, 10, 0],
          rotate: [0, 10, -8, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 6,
          ease: 'easeInOut',
        }}
        className="absolute top-16 left-[10%] md:left-[18%] text-5xl md:text-6xl drop-shadow-md pointer-events-none z-10"
      >
        🐝
      </motion.div>

      <motion.div
        animate={{
          x: [0, -35, 15, 0],
          y: [0, 20, -18, 0],
          rotate: [0, -12, 6, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 7,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute bottom-20 right-[10%] md:right-[18%] text-5xl md:text-6xl drop-shadow-md pointer-events-none z-10 scale-x-[-1]"
      >
        🐝
      </motion.div>

      {/* Gentle Floating Honey Pot & Sunflowers */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        className="absolute top-24 right-[12%] text-4xl md:text-5xl drop-shadow-md pointer-events-none hidden sm:block"
      >
        🍯
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0], rotate: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 0.5 }}
        className="absolute bottom-16 left-[12%] text-4xl md:text-5xl drop-shadow-md pointer-events-none hidden sm:block"
      >
        🌻
      </motion.div>

      {/* Central Content Box */}
      <div className="flex flex-col items-center max-w-md w-full text-center z-20">
        {/* Radiating Honey Glow Behind Logo */}
        <div className="relative mb-6">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.35, 0.6, 0.35],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: 'easeInOut',
            }}
            className="absolute -inset-6 bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 rounded-full blur-2xl opacity-50"
          />

          {/* Central Mascot Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
              className="w-44 h-44 md:w-48 md:h-48 rounded-[42px] bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 p-2.5 shadow-2xl shadow-amber-400/50 border-4 border-white flex items-center justify-center relative overflow-hidden"
            >
              {/* Glossy overlay reflection */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/30 rounded-t-[36px] pointer-events-none" />

              <div className="w-full h-full bg-amber-50 rounded-[32px] flex items-center justify-center shadow-inner border-2 border-amber-200/80 overflow-hidden p-3">
                {customLogo ? (
                  <img
                    src={customLogo}
                    alt="Little Bee Logo"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-[24px] filter drop-shadow-sm"
                  />
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="text-8xl md:text-9xl filter drop-shadow-md select-none transform hover:scale-110 transition-transform cursor-pointer">
                      🐝
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* System Name Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-amber-950 drop-shadow-sm">
            Little Bee Worksheet Hub
          </h1>
        </motion.div>

        {/* Ultra-Bubbly 3D ENTER Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="w-full px-4 max-w-xs"
        >
          <motion.button
            onClick={onEnter}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.94, y: 3 }}
            className="w-full relative group py-5 px-10 rounded-full bg-gradient-to-b from-amber-400 via-yellow-400 to-amber-500 text-amber-950 font-black text-2xl md:text-3xl tracking-wide shadow-[0_10px_25px_rgba(217,119,6,0.5)] border-4 border-white cursor-pointer active:shadow-[0_4px_12px_rgba(217,119,6,0.4)] transition-all overflow-hidden flex items-center justify-center space-x-3"
          >
            {/* Top Gloss Highlight */}
            <div className="absolute top-1 left-4 right-4 h-3.5 bg-white/50 rounded-full blur-[0.5px] pointer-events-none" />

            <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-sm">
              <span>ENTER</span>
              <Sparkles className="w-6 h-6 text-amber-900 animate-pulse fill-amber-300" />
            </span>

            {/* Bottom 3D Bevel Shadow inside button */}
            <div className="absolute bottom-0 inset-x-0 h-2 bg-amber-600/30 rounded-b-full pointer-events-none" />
          </motion.button>
        </motion.div>
      </div>

      {/* Gentle Floating Tiny Sparkles */}
      <div className="absolute top-1/3 left-1/4 text-yellow-500/50 text-xl pointer-events-none animate-ping duration-1000">
        ✨
      </div>
      <div className="absolute bottom-1/3 right-1/4 text-yellow-500/50 text-xl pointer-events-none animate-pulse duration-700">
        ✨
      </div>
    </div>
  );
};
