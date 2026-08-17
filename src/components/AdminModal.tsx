import React, { useState, useMemo } from 'react';
import {
  X,
  Trash2,
  Plus,
  Upload,
  ExternalLink,
  CheckCircle2,
  Download,
  GraduationCap,
  BookOpen,
  ArrowUpDown,
  Search,
  Settings,
  FolderPlus,
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  ClipboardList,
  Wand2,
  Copy
} from 'lucide-react';
import { WorksheetItem, GradeClass } from '../types';
import { INITIAL_WORKSHEETS } from '../data/worksheets';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksheets: WorksheetItem[];
  onUpdateWorksheets: (worksheets: WorksheetItem[]) => void;
}

type AdminTab = 'hub' | 'create' | 'directory' | 'settings';

interface BatchRowItem {
  id: string;
  qrCodeId: string;
  title: string;
  gradeClass: GradeClass;
  subject: string;
  pdfUrl: string;
  fileName?: string;
  fileData?: string;
}

const CLASS_OPTIONS: GradeClass[] = [
  'STD 1',
  'STD 2',
  'STD 3',
  'STD 4',
  'STD 5',
  'STD 6',
];

const COMMON_SUBJECTS = [
  'English',
  'Mathematics',
  'Science',
  'Bahasa Melayu',
  'Chinese (BC)',
  'Moral / Agama',
  'Sejarah (History)',
  'Art & Craft',
  'General',
];

const DEFAULT_LOGO_URL = 'https://i.postimg.cc/DzrFcSt2/ezgif-frame-287.jpg';

const MAX_BATCH_ITEMS = 10;

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  worksheets,
  onUpdateWorksheets,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('hub');

  // Creation Mode: 'batch' (up to 10 at once) or 'single'
  const [createMode, setCreateMode] = useState<'batch' | 'single'>('batch');

  // Single Form states
  const [singleQrCodeId, setSingleQrCodeId] = useState('');
  const [singleTitle, setSingleTitle] = useState('');
  const [singleGradeClass, setSingleGradeClass] = useState<GradeClass>('STD 1');
  const [singleSubject, setSingleSubject] = useState('English');
  const [singleCustomSubject, setSingleCustomSubject] = useState('');
  const [singlePdfSourceType, setSinglePdfSourceType] = useState<'upload' | 'url'>('url');
  const [singlePdfUrl, setSinglePdfUrl] = useState('');
  const [singleSelectedFileName, setSingleSelectedFileName] = useState<string | null>(null);
  const [singleUploadedPdfData, setSingleUploadedPdfData] = useState<string | null>(null);

  // Batch Form states (Up to 10 items)
  const [batchItems, setBatchItems] = useState<BatchRowItem[]>([
    {
      id: `row-1-${Date.now()}`,
      qrCodeId: '',
      title: '',
      gradeClass: 'STD 1',
      subject: 'English',
      pdfUrl: '',
    },
    {
      id: `row-2-${Date.now()}`,
      qrCodeId: '',
      title: '',
      gradeClass: 'STD 1',
      subject: 'English',
      pdfUrl: '',
    },
    {
      id: `row-3-${Date.now()}`,
      qrCodeId: '',
      title: '',
      gradeClass: 'STD 1',
      subject: 'English',
      pdfUrl: '',
    },
  ]);

  // Bulk Tools states
  const [bulkClass, setBulkClass] = useState<GradeClass>('STD 1');
  const [bulkSubject, setBulkSubject] = useState('English');
  const [bulkQrPrefix, setBulkQrPrefix] = useState('BEE-');
  const [isQuickPasteOpen, setIsQuickPasteOpen] = useState(false);
  const [pastedLinksText, setPastedLinksText] = useState('');

  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filter, Sort & Search states (Card 2: Directory)
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'class' | 'subject' | 'title' | 'qr'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Settings states (Card 3: Settings)
  const [logoPreview, setLogoPreview] = useState<string>(
    localStorage.getItem('little_bee_custom_logo') || DEFAULT_LOGO_URL
  );

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '212832') {
      setIsAuthenticated(true);
      setPasswordError(false);
      setPasswordInput('');
      setActiveTab('hub');
    } else {
      setPasswordError(true);
    }
  };

  // --- Single Creation Handler ---
  const handleAddSingleWorksheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleQrCodeId.trim() || !singleTitle.trim()) {
      showNotification('Please enter QR code ID and title.', 'error');
      return;
    }

    let finalPdfUrl = '';
    const fileName = singleSelectedFileName || undefined;

    if (singlePdfSourceType === 'upload') {
      if (!singleUploadedPdfData) {
        showNotification('Please choose a PDF file to upload.', 'error');
        return;
      }
      finalPdfUrl = singleUploadedPdfData;
    } else {
      if (!singlePdfUrl.trim()) {
        showNotification('Please provide a valid PDF or Google Drive link.', 'error');
        return;
      }
      finalPdfUrl = singlePdfUrl.trim();
    }

    const finalSubject = singleSubject === 'Other' ? (singleCustomSubject.trim() || 'General') : singleSubject;

    const newWs: WorksheetItem = {
      id: `ws-${Date.now()}`,
      qrCodeId: singleQrCodeId.trim().toUpperCase(),
      title: singleTitle.trim(),
      gradeClass: singleGradeClass,
      subject: finalSubject,
      pdfUrl: finalPdfUrl,
      fileName,
    };

    const updated = [newWs, ...worksheets];
    onUpdateWorksheets(updated);

    // Reset single form
    setSingleQrCodeId('');
    setSingleTitle('');
    setSinglePdfUrl('');
    setSingleSelectedFileName(null);
    setSingleUploadedPdfData(null);
    setSingleCustomSubject('');
    showNotification(`Worksheet "${newWs.title}" created successfully!`);
  };

  // --- Batch Creation Helpers & Handlers ---
  const handleAddBatchRow = () => {
    if (batchItems.length >= MAX_BATCH_ITEMS) {
      showNotification(`Maximum limit of ${MAX_BATCH_ITEMS} worksheets at a time reached.`, 'error');
      return;
    }
    const nextNum = batchItems.length + 1;
    const padded = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    setBatchItems([
      ...batchItems,
      {
        id: `row-${Date.now()}-${Math.random()}`,
        qrCodeId: bulkQrPrefix ? `${bulkQrPrefix.toUpperCase()}${padded}` : '',
        title: '',
        gradeClass: bulkClass,
        subject: bulkSubject,
        pdfUrl: '',
      },
    ]);
  };

  const handleRemoveBatchRow = (id: string) => {
    if (batchItems.length <= 1) {
      // Clear instead of removing last row
      setBatchItems([
        {
          id: `row-${Date.now()}`,
          qrCodeId: '',
          title: '',
          gradeClass: bulkClass,
          subject: bulkSubject,
          pdfUrl: '',
        },
      ]);
      return;
    }
    setBatchItems(batchItems.filter((item) => item.id !== id));
  };

  const handleUpdateBatchRow = (id: string, field: keyof BatchRowItem, value: any) => {
    setBatchItems(
      batchItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleApplyBulkClassSubject = () => {
    setBatchItems(
      batchItems.map((item) => ({
        ...item,
        gradeClass: bulkClass,
        subject: bulkSubject,
      }))
    );
    showNotification(`Applied ${bulkClass} & ${bulkSubject} to all ${batchItems.length} rows!`);
  };

  const handleAutoNumberQRs = () => {
    const prefix = (bulkQrPrefix.trim() || 'BEE-').toUpperCase();
    setBatchItems(
      batchItems.map((item, index) => {
        const num = index + 1;
        const padded = num < 10 ? `0${num}` : `${num}`;
        return {
          ...item,
          qrCodeId: `${prefix}${padded}`,
        };
      })
    );
    showNotification(`Auto-generated QR codes from ${prefix}01 to ${prefix}${batchItems.length < 10 ? '0' + batchItems.length : batchItems.length}`);
  };

  // Quick Paste: parse up to 10 URLs pasted by user
  const handleProcessPastedLinks = () => {
    if (!pastedLinksText.trim()) {
      showNotification('Please paste at least one PDF or Google Drive link.', 'error');
      return;
    }

    const lines = pastedLinksText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && (l.startsWith('http') || l.startsWith('data:') || l.includes('drive.google')));

    if (lines.length === 0) {
      showNotification('No valid web or Google Drive links found in pasted text.', 'error');
      return;
    }

    const limitedLines = lines.slice(0, MAX_BATCH_ITEMS);
    const prefix = (bulkQrPrefix.trim() || 'BEE-').toUpperCase();

    const newBatchRows: BatchRowItem[] = limitedLines.map((link, index) => {
      const num = index + 1;
      const padded = num < 10 ? `0${num}` : `${num}`;
      
      // Attempt to extract title from URL if possible
      let extractedTitle = `Worksheet Answer Key ${padded}`;
      try {
        if (link.endsWith('.pdf')) {
          const parts = link.split('/');
          const lastPart = parts[parts.length - 1].replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
          if (lastPart) extractedTitle = decodeURIComponent(lastPart);
        }
      } catch {}

      return {
        id: `row-paste-${Date.now()}-${index}`,
        qrCodeId: `${prefix}${padded}`,
        title: extractedTitle,
        gradeClass: bulkClass,
        subject: bulkSubject,
        pdfUrl: link,
      };
    });

    setBatchItems(newBatchRows);
    setIsQuickPasteOpen(false);
    setPastedLinksText('');
    showNotification(`Loaded ${newBatchRows.length} worksheet links into rows!`);
  };

  // Multi-PDF file upload (up to 10 files)
  const handleMultiFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = (Array.from(files) as File[]).slice(0, MAX_BATCH_ITEMS);
    const prefix = (bulkQrPrefix.trim() || 'BEE-').toUpperCase();

    const newRows: BatchRowItem[] = [];
    let loadedCount = 0;

    fileList.forEach((file: File, index: number) => {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        return;
      }

      const num = index + 1;
      const padded = num < 10 ? `0${num}` : `${num}`;
      const cleanTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

      const reader = new FileReader();
      reader.onload = () => {
        const fileData = reader.result as string;
        newRows.push({
          id: `file-${Date.now()}-${index}`,
          qrCodeId: `${prefix}${padded}`,
          title: cleanTitle,
          gradeClass: bulkClass,
          subject: bulkSubject,
          pdfUrl: fileData,
          fileName: file.name,
          fileData,
        });

        loadedCount++;
        if (loadedCount === fileList.length) {
          setBatchItems(newRows);
          showNotification(`Loaded ${newRows.length} PDF files ready to save!`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Batch Save all valid rows
  const handleSaveAllBatch = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out rows that have link/file and QR code and Title
    const validRows = batchItems.filter(
      (item) => item.qrCodeId.trim() && item.title.trim() && item.pdfUrl.trim()
    );

    if (validRows.length === 0) {
      showNotification('Please fill in QR Code ID, Title, and PDF Link/File for at least 1 row.', 'error');
      return;
    }

    const newWorksheets: WorksheetItem[] = validRows.map((row, idx) => ({
      id: `ws-${Date.now()}-${idx}`,
      qrCodeId: row.qrCodeId.trim().toUpperCase(),
      title: row.title.trim(),
      gradeClass: row.gradeClass,
      subject: row.subject,
      pdfUrl: row.pdfUrl.trim(),
      fileName: row.fileName,
    }));

    const updated = [...newWorksheets, ...worksheets];
    onUpdateWorksheets(updated);

    showNotification(`Successfully saved ${newWorksheets.length} new worksheets!`);

    // Reset batch rows
    setBatchItems([
      {
        id: `row-1-${Date.now()}`,
        qrCodeId: '',
        title: '',
        gradeClass: bulkClass,
        subject: bulkSubject,
        pdfUrl: '',
      },
    ]);
  };

  // Safe inline delete
  const confirmDelete = (id: string) => {
    const updated = worksheets.filter((w) => w.id !== id);
    onUpdateWorksheets(updated);
    setItemToDelete(null);
    showNotification('Worksheet PDF removed successfully.');
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(worksheets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `LittleBee_Worksheets_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Backup JSON exported successfully.');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            const formatted: WorksheetItem[] = parsed.map((item: any) => ({
              id: item.id || `ws-${Date.now()}-${Math.random()}`,
              qrCodeId: (item.qrCodeId || 'CODE').toUpperCase(),
              title: item.title || 'Untitled Worksheet',
              gradeClass: item.gradeClass || 'STD 1',
              subject: item.subject || 'General',
              pdfUrl: item.pdfUrl || '',
              fileName: item.fileName,
            }));
            onUpdateWorksheets(formatted);
            showNotification(`Imported ${formatted.length} worksheets successfully!`);
          } else {
            showNotification('Invalid backup JSON structure.', 'error');
          }
        } catch (err) {
          showNotification('Could not parse JSON file.', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetDefaults = () => {
    onUpdateWorksheets(INITIAL_WORKSHEETS);
    showNotification('Reset to initial sample worksheets.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        localStorage.setItem('little_bee_custom_logo', result);
        showNotification('Custom logo updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(DEFAULT_LOGO_URL);
    localStorage.removeItem('little_bee_custom_logo');
    showNotification('Logo restored to default Little Bee mascot.');
  };

  // Filtered & Sorted Worksheets
  const filteredWorksheets = useMemo(() => {
    return worksheets
      .filter((w) => {
        if (filterClass !== 'ALL' && (w.gradeClass || 'STD 1') !== filterClass) return false;
        if (filterSubject !== 'ALL' && (w.subject || 'General') !== filterSubject) return false;
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchTitle = w.title.toLowerCase().includes(query);
          const matchQr = w.qrCodeId.toLowerCase().includes(query);
          const matchSubject = (w.subject || '').toLowerCase().includes(query);
          if (!matchTitle && !matchQr && !matchSubject) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'class') return (a.gradeClass || '').localeCompare(b.gradeClass || '');
        if (sortBy === 'subject') return (a.subject || '').localeCompare(b.subject || '');
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'qr') return a.qrCodeId.localeCompare(b.qrCodeId);
        return 0;
      });
  }, [worksheets, filterClass, filterSubject, sortBy, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border-4 border-amber-300 relative max-h-[94vh] flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-amber-100 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            {isAuthenticated && activeTab !== 'hub' && (
              <button
                onClick={() => setActiveTab('hub')}
                className="p-1.5 rounded-xl hover:bg-amber-100 text-amber-950 transition-colors flex items-center space-x-1 text-xs font-black cursor-pointer mr-1"
                title="Back to Hub"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Hub</span>
              </button>
            )}
            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center text-lg shadow-sm border border-white overflow-hidden p-0.5">
              <img
                src={logoPreview || DEFAULT_LOGO_URL}
                alt="Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-950 flex items-center gap-1.5 leading-tight">
                <span>Admin Dashboard</span>
                {isAuthenticated && (
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    {worksheets.length} PDFs
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-amber-900/60 font-semibold">
                {activeTab === 'hub' && 'Management Hub & Quick Navigation'}
                {activeTab === 'create' && 'Card 1: Batch Create & Link Worksheets (Up to 10)'}
                {activeTab === 'directory' && 'Card 2: Worksheet Directory & Search'}
                {activeTab === 'settings' && 'Card 3: System Settings & Backup'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsAuthenticated(false);
              setPasswordError(false);
              onClose();
            }}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-amber-50 cursor-pointer"
            title="Close Admin"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Feedback Toast */}
        {feedbackMessage && (
          <div
            className={`mt-2 p-2.5 text-xs font-bold rounded-xl border flex items-center space-x-2 flex-shrink-0 animate-in fade-in ${
              feedbackMessage.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto pt-3 pr-1">
          {!isAuthenticated ? (
            /* Passcode Verification Screen */
            <div className="flex flex-col items-center text-center py-10">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 flex items-center justify-center mb-3 border-2 border-amber-300 shadow-inner overflow-hidden p-1">
                <img
                  src={logoPreview || DEFAULT_LOGO_URL}
                  alt="Little Bee Mascot"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-950 mb-1">
                Admin Passcode
              </h2>
              <p className="text-xs text-gray-500 mb-6 font-medium">
                Enter teacher passcode to access administration cards.
              </p>
              <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter passcode"
                  className="w-full text-center text-lg rounded-2xl border-2 border-amber-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 font-black tracking-widest text-amber-950 bg-amber-50/50"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-xs text-red-600 font-bold animate-shake">
                    Incorrect passcode (default: 212832).
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-950 font-black text-sm rounded-2xl border-2 border-white shadow-md cursor-pointer transition-all active:scale-95"
                >
                  Enter Portal
                </button>
              </form>
            </div>
          ) : activeTab === 'hub' ? (
            /* ========================================================== */
            /*  PRIMARY 3-CARD ADMIN HUB                                  */
            /* ========================================================== */
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-3.5">
                {/* CARD 1: CREATE NEW WORKSHEETS */}
                <div
                  onClick={() => setActiveTab('create')}
                  className="group bg-gradient-to-br from-amber-50 via-yellow-50/70 to-amber-100/50 hover:from-amber-100 hover:to-yellow-100 p-4 sm:p-5 rounded-2xl border-2 border-amber-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shadow-md border-2 border-white group-hover:scale-105 transition-transform flex-shrink-0">
                      <FolderPlus className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                          Card 1
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-amber-950">
                          Create & Link Worksheets (Up to 10 at once)
                        </h3>
                      </div>
                      <p className="text-xs text-amber-900/70 font-medium mt-0.5">
                        Add up to 10 Google Drive links or PDF files in one batch with auto QR numbering
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-950 bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-sm group-hover:bg-amber-400 transition-colors flex-shrink-0 ml-2">
                    Create +
                  </span>
                </div>

                {/* CARD 2: FIND A WORKSHEET BY CODE */}
                <div
                  onClick={() => setActiveTab('directory')}
                  className="group bg-gradient-to-br from-amber-50 via-yellow-50/70 to-amber-100/50 hover:from-amber-100 hover:to-yellow-100 p-4 sm:p-5 rounded-2xl border-2 border-amber-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shadow-md border-2 border-white group-hover:scale-105 transition-transform flex-shrink-0">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                          Card 2
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-amber-950">
                          Find a Worksheet by Code
                        </h3>
                        <span className="text-[10px] font-bold bg-white text-amber-950 px-2 py-0.5 rounded-full border border-amber-300">
                          {worksheets.length} stored
                        </span>
                      </div>
                      <p className="text-xs text-amber-900/70 font-medium mt-0.5">
                        Search by QR code or title, filter by Standard / Subject, sort, preview & delete
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-950 bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-sm group-hover:bg-amber-400 transition-colors flex-shrink-0 ml-2">
                    Search & Sort →
                  </span>
                </div>

                {/* CARD 3: SETTINGS */}
                <div
                  onClick={() => setActiveTab('settings')}
                  className="group bg-gradient-to-br from-amber-50 via-yellow-50/70 to-amber-100/50 hover:from-amber-100 hover:to-yellow-100 p-4 sm:p-5 rounded-2xl border-2 border-amber-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shadow-md border-2 border-white group-hover:scale-105 transition-transform flex-shrink-0">
                      <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                          Card 3
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-amber-950">
                          Settings & Backup
                        </h3>
                      </div>
                      <p className="text-xs text-amber-900/70 font-medium mt-0.5">
                        School mascot logo upload, JSON backup import/export & help guides
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-950 bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-sm group-hover:bg-amber-400 transition-colors flex-shrink-0 ml-2">
                    Settings →
                  </span>
                </div>
              </div>
            </div>
          ) : activeTab === 'create' ? (
            /* ========================================================== */
            /*  VIEW 1: CREATE WORKSHEETS (MULTI-ADD UP TO 10 / SINGLE)  */
            /* ========================================================== */
            <div className="space-y-4 py-1">
              {/* Header Navigation & Mode Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-100/80 p-3 rounded-2xl border border-amber-300">
                <div className="flex items-center space-x-2">
                  <FolderPlus className="w-5 h-5 text-amber-700" />
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                    Create & Link Worksheets
                  </span>
                  <span className="text-[10px] bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full font-black">
                    Max 10 per batch
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex bg-white rounded-xl p-0.5 border border-amber-300">
                    <button
                      type="button"
                      onClick={() => setCreateMode('batch')}
                      className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                        createMode === 'batch'
                          ? 'bg-amber-400 text-amber-950 shadow-sm'
                          : 'text-gray-600 hover:text-amber-950'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>Multi-Add (Up to 10)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateMode('single')}
                      className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                        createMode === 'single'
                          ? 'bg-amber-400 text-amber-950 shadow-sm'
                          : 'text-gray-600 hover:text-amber-950'
                      }`}
                    >
                      Single Entry
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('directory')}
                    className="text-xs font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer"
                  >
                    Directory ({worksheets.length}) →
                  </button>
                </div>
              </div>

              {createMode === 'batch' ? (
                /* ========================================================== */
                /*  BATCH BUILDER VIEW (UP TO 10 WORKSHEET LINKS / FILES)     */
                /* ========================================================== */
                <form onSubmit={handleSaveAllBatch} className="space-y-3.5">
                  {/* Bulk Helpers Bar (Apply to all rows) */}
                  <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs font-black text-amber-950">
                        <Wand2 className="w-4 h-4 text-amber-700" />
                        <span>Batch Fast-Fill Tools</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Quick Paste Button */}
                        <button
                          type="button"
                          onClick={() => setIsQuickPasteOpen(true)}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-[11px] font-black flex items-center space-x-1 cursor-pointer shadow-sm transition-colors"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-amber-700" />
                          <span>Paste Multiple Links</span>
                        </button>

                        {/* Multi-File Upload Button */}
                        <label
                          htmlFor="batch-multi-pdf-input"
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-[11px] font-black flex items-center space-x-1 cursor-pointer shadow-sm transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-amber-700" />
                          <span>Choose Multiple PDFs</span>
                        </label>
                        <input
                          id="batch-multi-pdf-input"
                          type="file"
                          multiple
                          accept="application/pdf"
                          onChange={handleMultiFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 border-t border-amber-200/60">
                      {/* Set Default Class */}
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                          Default Class:
                        </label>
                        <select
                          value={bulkClass}
                          onChange={(e) => setBulkClass(e.target.value as GradeClass)}
                          className="w-full bg-white border border-amber-300 rounded-xl px-2 py-1 text-xs font-black text-amber-950 focus:outline-none"
                        >
                          {CLASS_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Set Default Subject */}
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                          Default Subject:
                        </label>
                        <select
                          value={bulkSubject}
                          onChange={(e) => setBulkSubject(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-xl px-2 py-1 text-xs font-bold text-amber-950 focus:outline-none"
                        >
                          {COMMON_SUBJECTS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* QR Prefix for Auto-Numbering */}
                      <div>
                        <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                          QR Code Prefix:
                        </label>
                        <input
                          type="text"
                          value={bulkQrPrefix}
                          onChange={(e) => setBulkQrPrefix(e.target.value.toUpperCase())}
                          placeholder="e.g. BEE-MATH-"
                          className="w-full bg-white border border-amber-300 rounded-xl px-2 py-1 text-xs font-black text-amber-950 focus:outline-none uppercase"
                        />
                      </div>

                      {/* Apply Actions */}
                      <div className="flex items-end space-x-1.5">
                        <button
                          type="button"
                          onClick={handleApplyBulkClassSubject}
                          className="flex-1 py-1.5 px-2 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[10px] rounded-xl transition-colors cursor-pointer text-center"
                          title="Apply selected Class & Subject to all rows below"
                        >
                          Apply Class/Subject
                        </button>
                        <button
                          type="button"
                          onClick={handleAutoNumberQRs}
                          className="flex-1 py-1.5 px-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-[10px] rounded-xl transition-colors cursor-pointer text-center"
                          title="Fill sequential QR codes (01, 02, ...)"
                        >
                          Auto-Number QRs
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Batch Link Rows Table */}
                  <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                    <div className="flex items-center justify-between text-xs text-amber-900 font-bold px-1">
                      <span>
                        Worksheet Batch Rows ({batchItems.length}/{MAX_BATCH_ITEMS})
                      </span>
                      <span className="text-[11px] text-amber-900/70 font-semibold">
                        Enter QR Code ID, Title, Class, Subject & Google Drive / PDF Link
                      </span>
                    </div>

                    {batchItems.map((row, index) => (
                      <div
                        key={row.id}
                        className="bg-white p-2.5 sm:p-3 rounded-2xl border-2 border-amber-200 hover:border-amber-400 transition-all shadow-sm space-y-2 relative"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                            {index + 1}
                          </span>

                          {/* QR Code ID */}
                          <div className="w-28 sm:w-36 flex-shrink-0">
                            <input
                              type="text"
                              value={row.qrCodeId}
                              onChange={(e) =>
                                handleUpdateBatchRow(row.id, 'qrCodeId', e.target.value.toUpperCase())
                              }
                              placeholder="QR ID (e.g. BEE-01)"
                              className="w-full bg-amber-50/50 border border-amber-300 rounded-xl px-2 py-1 text-xs font-black text-amber-950 uppercase focus:outline-none focus:ring-1 focus:ring-amber-400"
                              required
                            />
                          </div>

                          {/* Worksheet Title */}
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={row.title}
                              onChange={(e) =>
                                handleUpdateBatchRow(row.id, 'title', e.target.value)
                              }
                              placeholder="Worksheet Title (e.g. Chapter 1 Answer Key)"
                              className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1 text-xs font-bold text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-400"
                              required
                            />
                          </div>

                          {/* Class Select */}
                          <div className="w-24 sm:w-28 flex-shrink-0">
                            <select
                              value={row.gradeClass}
                              onChange={(e) =>
                                handleUpdateBatchRow(row.id, 'gradeClass', e.target.value as GradeClass)
                              }
                              className="w-full bg-white border border-amber-300 rounded-xl px-1.5 py-1 text-[11px] font-black text-amber-950 focus:outline-none cursor-pointer"
                            >
                              {CLASS_OPTIONS.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Subject Select */}
                          <div className="w-28 sm:w-32 flex-shrink-0">
                            <select
                              value={row.subject}
                              onChange={(e) =>
                                handleUpdateBatchRow(row.id, 'subject', e.target.value)
                              }
                              className="w-full bg-white border border-amber-300 rounded-xl px-1.5 py-1 text-[11px] font-bold text-amber-950 focus:outline-none cursor-pointer"
                            >
                              {COMMON_SUBJECTS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Remove Row Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveBatchRow(row.id)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 cursor-pointer flex-shrink-0 transition-colors"
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* PDF Link input */}
                        <div>
                          <input
                            type="text"
                            value={row.pdfUrl}
                            onChange={(e) =>
                              handleUpdateBatchRow(row.id, 'pdfUrl', e.target.value)
                            }
                            placeholder="Google Drive link (https://drive.google.com/file/d/...) or Web PDF link"
                            className="w-full bg-white border border-amber-200 rounded-xl px-2.5 py-1 text-xs text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder-amber-900/30 font-medium"
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Row & Save Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-amber-200">
                    <button
                      type="button"
                      onClick={handleAddBatchRow}
                      disabled={batchItems.length >= MAX_BATCH_ITEMS}
                      className={`py-2 px-4 rounded-xl text-xs font-black flex items-center space-x-1.5 cursor-pointer border ${
                        batchItems.length >= MAX_BATCH_ITEMS
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300 active:scale-95'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Another Row ({batchItems.length}/{MAX_BATCH_ITEMS})</span>
                    </button>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() =>
                          setBatchItems([
                            {
                              id: `row-1-${Date.now()}`,
                              qrCodeId: '',
                              title: '',
                              gradeClass: bulkClass,
                              subject: bulkSubject,
                              pdfUrl: '',
                            },
                          ])
                        }
                        className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Clear Rows
                      </button>

                      <button
                        type="submit"
                        className="flex-1 sm:flex-initial py-2.5 px-6 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-amber-950 font-black text-xs rounded-xl border-2 border-white shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center space-x-1.5"
                      >
                        <Sparkles className="w-4 h-4 text-amber-950" />
                        <span>Save All ({batchItems.filter((i) => i.qrCodeId && i.title && i.pdfUrl).length}) Worksheets</span>
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* ========================================================== */
                /*  SINGLE ENTRY VIEW (CLASSIC 1-AT-A-TIME)                   */
                /* ========================================================== */
                <form onSubmit={handleAddSingleWorksheet} className="space-y-3.5">
                  {/* Row 1: QR Code ID & Title */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        QR Code ID (e.g. BEE-ABC-01) *
                      </label>
                      <input
                        type="text"
                        value={singleQrCodeId}
                        onChange={(e) => setSingleQrCodeId(e.target.value)}
                        placeholder="e.g. BEE-MATH-01"
                        className="w-full rounded-xl border-2 border-amber-300 px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-amber-950 placeholder-amber-900/30"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1">
                        Worksheet Title / Name *
                      </label>
                      <input
                        type="text"
                        value={singleTitle}
                        onChange={(e) => setSingleTitle(e.target.value)}
                        placeholder="e.g. Addition & Subtraction Answers"
                        className="w-full rounded-xl border-2 border-amber-300 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-amber-950 placeholder-amber-900/30"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 2: Class Dropdown & Subject */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1 flex items-center space-x-1">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                        <span>Class / Grade Level</span>
                      </label>
                      <select
                        value={singleGradeClass}
                        onChange={(e) => setSingleGradeClass(e.target.value as GradeClass)}
                        className="w-full rounded-xl border-2 border-amber-300 px-3 py-2 text-xs font-black focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-amber-950 cursor-pointer"
                      >
                        {CLASS_OPTIONS.map((cls) => (
                          <option key={cls} value={cls}>
                            {cls}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 mb-1 flex items-center space-x-1">
                        <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                        <span>Subject</span>
                      </label>
                      <select
                        value={singleSubject}
                        onChange={(e) => setSingleSubject(e.target.value)}
                        className="w-full rounded-xl border-2 border-amber-300 px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-amber-950 cursor-pointer"
                      >
                        {COMMON_SUBJECTS.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                        <option value="Other">Custom Subject...</option>
                      </select>
                      {singleSubject === 'Other' && (
                        <input
                          type="text"
                          value={singleCustomSubject}
                          onChange={(e) => setSingleCustomSubject(e.target.value)}
                          placeholder="Type custom subject name..."
                          className="mt-1.5 w-full rounded-xl border-2 border-amber-300 px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-amber-950"
                          required
                        />
                      )}
                    </div>
                  </div>

                  {/* PDF Source Choice Toggle */}
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1.5">
                      Answer PDF Document Source *
                    </label>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setSinglePdfSourceType('url')}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border-2 transition-all cursor-pointer ${
                          singlePdfSourceType === 'url'
                            ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm font-black'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50'
                        }`}
                      >
                        🔗 Google Drive / Web PDF Link
                      </button>
                      <button
                        type="button"
                        onClick={() => setSinglePdfSourceType('upload')}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border-2 transition-all cursor-pointer ${
                          singlePdfSourceType === 'upload'
                            ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm font-black'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50'
                        }`}
                      >
                        📁 Upload Single File
                      </button>
                    </div>

                    {singlePdfSourceType === 'upload' ? (
                      <div className="border-2 border-dashed border-amber-300 rounded-2xl p-4 bg-amber-50/50 text-center hover:bg-amber-50 transition-colors">
                        <input
                          type="file"
                          id="single-create-pdf-file-input"
                          accept="application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSingleSelectedFileName(file.name);
                              if (!singleTitle) setSingleTitle(file.name.replace(/\.pdf$/i, '').replace(/_/g, ' '));
                              const reader = new FileReader();
                              reader.onload = () => setSingleUploadedPdfData(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="single-create-pdf-file-input"
                          className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                        >
                          <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-800">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-black text-amber-950">
                            {singleSelectedFileName ? singleSelectedFileName : 'Click to choose PDF answer sheet'}
                          </span>
                        </label>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={singlePdfUrl}
                        onChange={(e) => setSinglePdfUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/... or web PDF link"
                        className="w-full rounded-xl border-2 border-amber-300 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      />
                    )}
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-amber-950 font-black text-xs rounded-2xl border-2 border-white shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      Save & Create Single Worksheet
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('hub')}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-2xl cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Quick Paste Modal / Drawer */}
              {isQuickPasteOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in">
                  <div className="bg-white rounded-3xl max-w-lg w-full p-5 border-4 border-amber-400 shadow-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ClipboardList className="w-5 h-5 text-amber-700" />
                        <h3 className="text-sm font-black text-amber-950">
                          Paste Multiple Links (Max {MAX_BATCH_ITEMS})
                        </h3>
                      </div>
                      <button
                        onClick={() => setIsQuickPasteOpen(false)}
                        className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-amber-900/70 font-medium">
                      Paste up to {MAX_BATCH_ITEMS} Google Drive or PDF links below (one link per line). The system will auto-populate rows with sequential QR IDs and titles.
                    </p>

                    <textarea
                      value={pastedLinksText}
                      onChange={(e) => setPastedLinksText(e.target.value)}
                      placeholder={`https://drive.google.com/file/d/1abc.../view\nhttps://drive.google.com/file/d/2xyz.../view\nhttps://example.com/math-ws3.pdf`}
                      rows={6}
                      className="w-full bg-amber-50/40 border-2 border-amber-300 rounded-2xl p-3 text-xs font-mono text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-900/30"
                      autoFocus
                    />

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsQuickPasteOpen(false)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleProcessPastedLinks}
                        className="px-5 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs rounded-xl border border-white shadow-sm cursor-pointer active:scale-95"
                      >
                        Load Into Rows
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'directory' ? (
            /* ========================================================== */
            /*  VIEW 2: FIND A WORKSHEET BY CODE, FILTER, SORT & DELETE   */
            /* ========================================================== */
            <div className="space-y-3.5 py-1">
              {/* Search & Sort Header */}
              <div className="bg-amber-100/70 p-3.5 rounded-2xl border border-amber-300 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-amber-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Find by QR Code ID (e.g. BEE-ABC-01) or title..."
                      className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border-2 border-amber-300 bg-white text-amber-950 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-amber-900/40"
                      autoFocus
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="px-3 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs rounded-xl border border-white flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer active:scale-95 flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Batch Add Worksheets</span>
                  </button>
                </div>

                {/* Filter & Sort Controls Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Filter by Class */}
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                      Class Level:
                    </label>
                    <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-950 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">All Classes (STD 1–6)</option>
                      {CLASS_OPTIONS.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Subject */}
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                      Subject:
                    </label>
                    <select
                      value={filterSubject}
                      onChange={(e) => setFilterSubject(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-950 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">All Subjects</option>
                      {COMMON_SUBJECTS.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-0.5 flex items-center space-x-1">
                      <ArrowUpDown className="w-3 h-3 text-amber-700" />
                      <span>Sort By:</span>
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-950 focus:outline-none cursor-pointer"
                    >
                      <option value="newest">Latest Added</option>
                      <option value="class">Class (STD 1 → 6)</option>
                      <option value="subject">Subject (A-Z)</option>
                      <option value="title">Title (A-Z)</option>
                      <option value="qr">QR Code ID</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status count indicator */}
              <div className="flex items-center justify-between text-xs text-amber-900/80 px-1 font-bold">
                <span>
                  Showing {filteredWorksheets.length} of {worksheets.length} worksheets
                </span>
                {(filterClass !== 'ALL' || filterSubject !== 'ALL' || searchQuery) && (
                  <button
                    onClick={() => {
                      setFilterClass('ALL');
                      setFilterSubject('ALL');
                      setSearchQuery('');
                    }}
                    className="text-amber-700 hover:text-amber-950 underline cursor-pointer text-[11px]"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Worksheet PDF List with Reliable Delete Handler */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {filteredWorksheets.length === 0 ? (
                  <div className="p-8 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-300 text-center text-amber-950 text-xs font-semibold">
                    <p className="font-bold text-sm mb-1">No worksheets found</p>
                    <p className="text-amber-900/60 mb-3">
                      Try searching with another QR code ID, title, or create new worksheets in batch.
                    </p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs rounded-xl cursor-pointer"
                    >
                      + Batch Add Worksheets
                    </button>
                  </div>
                ) : (
                  filteredWorksheets.map((ws) => (
                    <div
                      key={ws.id}
                      className="bg-white p-3 rounded-2xl border border-amber-200 flex items-center justify-between text-xs shadow-sm hover:border-amber-400 transition-all gap-2"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        {/* Class Badge */}
                        <span className="font-black text-amber-950 bg-amber-400 px-2 py-0.5 rounded-lg text-[11px] shadow-sm flex-shrink-0">
                          {ws.gradeClass || 'STD 1'}
                        </span>

                        {/* Subject Badge */}
                        <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg text-[10px] flex-shrink-0">
                          {ws.subject || 'General'}
                        </span>

                        {/* Details */}
                        <div className="truncate min-w-0 flex-1">
                          <p className="font-black text-amber-950 truncate leading-snug">
                            {ws.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-amber-900/60 font-mono truncate">
                            <span className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold text-amber-950">
                              QR: {ws.qrCodeId}
                            </span>
                            {ws.fileName && <span className="truncate">{ws.fileName}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons & Inline Safe Delete confirmation */}
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        {itemToDelete === ws.id ? (
                          <div className="flex items-center space-x-1 bg-red-50 p-1 rounded-xl border border-red-200 animate-in fade-in">
                            <span className="text-[10px] font-black text-red-700 px-1">Delete?</span>
                            <button
                              onClick={() => confirmDelete(ws.id)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] rounded-lg shadow-sm cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setItemToDelete(null)}
                              className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-[10px] rounded-lg cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <a
                              href={ws.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-amber-700 hover:bg-amber-100 hover:text-amber-950 rounded-xl transition-colors"
                              title="Preview PDF"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => setItemToDelete(ws.id)}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                              title="Delete Worksheet"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* ========================================================== */
            /*  VIEW 3: SETTINGS & BACKUP (MASCOT LOGO & DATA SYNC)       */
            /* ========================================================== */
            <div className="space-y-4 py-1">
              {/* Logo Customizer */}
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                      School / Brand Logo
                    </h4>
                    <p className="text-[11px] text-amber-900/60">
                      Customize the round badge shown on the front screen.
                    </p>
                  </div>
                  {logoPreview && (
                    <button
                      onClick={handleRemoveLogo}
                      className="text-[11px] text-red-600 hover:text-red-800 font-bold underline cursor-pointer"
                    >
                      Restore Default Little Bee
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-amber-300 p-1 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
                    <img
                      src={logoPreview || DEFAULT_LOGO_URL}
                      alt="Logo Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex items-center space-x-2 px-3 py-2 bg-white hover:bg-amber-100 text-amber-950 rounded-xl border border-amber-300 font-bold text-xs cursor-pointer shadow-sm transition-colors">
                      <Upload className="w-4 h-4 text-amber-700" />
                      <span>Upload School Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-amber-900/50 mt-1">
                      PNG, JPG or SVG formats supported.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Backup & Cloud Export */}
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300 space-y-3">
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                    Worksheets Database Backup
                  </h4>
                  <p className="text-[11px] text-amber-900/60">
                    Export or import full worksheet dataset to share across teachers or migrate.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="py-2.5 px-3 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-700" />
                    <span>Export Backup (JSON)</span>
                  </button>

                  <label className="py-2.5 px-3 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer text-center">
                    <Upload className="w-4 h-4 text-amber-700" />
                    <span>Import Backup (JSON)</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImportData}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Reset to Default */}
              <div className="p-3 bg-red-50/50 rounded-2xl border border-red-200 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-red-950">Reset Sample Data</h5>
                  <p className="text-[10px] text-red-900/60">
                    Replaces current database with default 3 sample worksheets.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Reset Defaults
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
