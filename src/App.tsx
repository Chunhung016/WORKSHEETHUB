import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { QRScannerModal } from './components/QRScannerModal';
import { PresenterPlayer } from './components/PresenterPlayer';
import { AdminModal } from './components/AdminModal';
import { WorksheetItem } from './types';
import { getWorksheetsFromStorage, saveWorksheetsToStorage, subscribeToWorksheets, INITIAL_WORKSHEETS } from './data/worksheets';

export default function App() {
  const [worksheets, setWorksheets] = useState<WorksheetItem[]>(INITIAL_WORKSHEETS);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeWorksheet, setActiveWorksheet] = useState<WorksheetItem | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    // Initial fetch from local IndexedDB + cloud synchronization
    getWorksheetsFromStorage().then((loaded) => {
      if (Array.isArray(loaded)) {
        setWorksheets(loaded);
      }
    });

    // Real-time listener: any device updating/adding/deleting a worksheet updates this device
    const unsubscribeCloud = subscribeToWorksheets((cloudWorksheets) => {
      if (Array.isArray(cloudWorksheets)) {
        setWorksheets(cloudWorksheets);
      }
    });

    return () => {
      unsubscribeCloud();
    };
  }, []);

  const handleUpdateWorksheets = (updated: WorksheetItem[]) => {
    setWorksheets(updated);
    saveWorksheetsToStorage(updated);
  };

  const handleEnterClick = () => {
    setIsScannerOpen(true);
  };

  const handleSelectWorksheet = (ws: WorksheetItem) => {
    setActiveWorksheet(ws);
    setIsScannerOpen(false);
  };

  const handleExitPresenter = () => {
    setActiveWorksheet(null);
    setIsScannerOpen(true);
  };

  return (
    <div className="min-h-screen font-sans antialiased text-gray-900 bg-amber-50">
      {/* Main View: Login Screen or Presenter Screen */}
      {!activeWorksheet ? (
        <LoginScreen
          onEnter={handleEnterClick}
          onOpenAdmin={() => setIsAdminOpen(true)}
        />
      ) : (
        <PresenterPlayer
          worksheet={activeWorksheet}
          onExit={handleExitPresenter}
          onOpenScanner={() => setIsScannerOpen(true)}
        />
      )}

      {/* QR Scanner Pop-out Screen */}
      {isScannerOpen && (
        <QRScannerModal
          worksheets={worksheets}
          onSelectWorksheet={handleSelectWorksheet}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {/* Silenced Admin Modal (Pressed 'G' on keyboard, password: 212832) */}
      {isAdminOpen && (
        <AdminModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          worksheets={worksheets}
          onUpdateWorksheets={handleUpdateWorksheets}
        />
      )}
    </div>
  );
}
