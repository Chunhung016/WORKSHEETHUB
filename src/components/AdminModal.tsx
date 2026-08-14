import React, { useState, useMemo } from 'react';
import {
  X,
  Trash2,
  Plus,
  Upload,
  ExternalLink,
  CheckCircle2,
  Download,
  ShieldAlert,
  GraduationCap,
  BookOpen,
  Filter,
  ArrowUpDown,
  Search,
  Settings,
  FolderPlus,
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  FileText,
  LayoutGrid,
  Check,
  Sparkles,
  Eye
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

  // Form states (Card 1: Create)
  const [qrCodeId, setQrCodeId] = useState('');
  const [title, setTitle] = useState('');
  const [gradeClass, setGradeClass] = useState<GradeClass>('STD 1');
  const [subject, setSubject] = useState('English');
  const [customSubject, setCustomSubject] = useState('');
  const [pdfSourceType, setPdfSourceType] = useState<'upload' | 'url'>('upload');
  const [pdfUrl, setPdfUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploadedPdfData, setUploadedPdfData] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filter, Sort & Search states (Card 2: Directory)
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'class' | 'subject' | 'title' | 'qr'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Settings states (Card 3: Settings)
  const [showTips, setShowTips] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    localStorage.getItem('little_bee_custom_logo')
  );

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
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

  const handlePdfFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        showNotification('Please upload a valid PDF file.', 'error');
        return;
      }
      setSelectedFileName(file.name);
      if (!title) {
        setTitle(file.name.replace(/\.pdf$/i, '').replace(/_/g, ' '));
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setUploadedPdfData(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddWorksheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCodeId.trim() || !title.trim()) {
      showNotification('Please enter QR code ID and title.', 'error');
      return;
    }

    let finalPdfUrl = '';
    const fileName = selectedFileName || undefined;

    if (pdfSourceType === 'upload') {
      if (!uploadedPdfData) {
        showNotification('Please choose a PDF file to upload.', 'error');
        return;
      }
      finalPdfUrl = uploadedPdfData;
    } else {
      if (!pdfUrl.trim()) {
        showNotification('Please provide a valid PDF link.', 'error');
        return;
      }
      finalPdfUrl = pdfUrl.trim();
    }

    const finalSubject = subject === 'Other' ? (customSubject.trim() || 'General') : subject;

    const newWs: WorksheetItem = {
      id: `ws-${Date.now()}`,
      qrCodeId: qrCodeId.trim().toUpperCase(),
      title: title.trim(),
      gradeClass,
      subject: finalSubject,
      pdfUrl: finalPdfUrl,
      fileName,
    };

    const updated = [newWs, ...worksheets];
    onUpdateWorksheets(updated);

    // Reset Form
    setQrCodeId('');
    setTitle('');
    setPdfUrl('');
    setSelectedFileName(null);
    setUploadedPdfData(null);
    setCustomSubject('');
    showNotification(`Worksheet "${newWs.title}" (${gradeClass} • ${finalSubject}) created successfully!`);
  };

  // Safe inline delete without native window.confirm (works seamlessly in all iframes)
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
    setLogoPreview(null);
    localStorage.removeItem('little_bee_custom_logo');
    showNotification('Logo restored to default Little Bee mascot.');
  };

  // Distinct subjects in dataset for filter dropdown
  const uniqueSubjects = useMemo(() => {
    const set = new Set<string>();
    worksheets.forEach((w) => {
      if (w.subject) set.add(w.subject);
    });
    return Array.from(set).sort();
  }, [worksheets]);

  // Filtered & Sorted Worksheets
  const filteredWorksheets = useMemo(() => {
    return worksheets
      .filter((w) => {
        // Filter by Class
        if (filterClass !== 'ALL' && (w.gradeClass || 'STD 1') !== filterClass) {
          return false;
        }
        // Filter by Subject
        if (filterSubject !== 'ALL' && (w.subject || 'General') !== filterSubject) {
          return false;
        }
        // Search query (matches QR code ID, Title, or Subject)
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
        if (sortBy === 'class') {
          return (a.gradeClass || '').localeCompare(b.gradeClass || '');
        }
        if (sortBy === 'subject') {
          return (a.subject || '').localeCompare(b.subject || '');
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'qr') {
          return a.qrCodeId.localeCompare(b.qrCodeId);
        }
        return 0; // 'newest'
      });
  }, [worksheets, filterClass, filterSubject, sortBy, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border-4 border-amber-300 relative max-h-[92vh] flex flex-col overflow-hidden">
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
            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center text-lg shadow-sm border border-white">
              🐝
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
                {activeTab === 'create' && 'Card 1: Create & Link Worksheet'}
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
              <div className="w-16 h-16 rounded-3xl bg-amber-100 flex items-center justify-center text-4xl mb-3 border-2 border-amber-300 shadow-inner">
                🐝
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
                {/* CARD 1: CREATE NEW WORKSHEET */}
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
                          Create New Worksheet
                        </h3>
                      </div>
                      <p className="text-xs text-amber-900/70 font-medium mt-0.5">
                        Upload answer PDF, specify Class (STD 1–6), Subject & QR Code ID
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
            /*  VIEW 1: CREATE NEW WORKSHEET FORM                         */
            /* ========================================================== */
            <div className="space-y-4 py-1">
              <div className="flex items-center justify-between bg-amber-100/80 p-3 rounded-2xl border border-amber-300">
                <div className="flex items-center space-x-2">
                  <FolderPlus className="w-5 h-5 text-amber-700" />
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                    Create & Link New Worksheet
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('directory')}
                  className="text-xs font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer"
                >
                  View Directory ({worksheets.length}) →
                </button>
              </div>

              <form onSubmit={handleAddWorksheet} className="space-y-3.5">
                {/* Row 1: QR Code ID & Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">
                      QR Code ID (e.g. BEE-ABC-01) *
                    </label>
                    <input
                      type="text"
                      value={qrCodeId}
                      onChange={(e) => setQrCodeId(e.target.value)}
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
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
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
                      value={gradeClass}
                      onChange={(e) => setGradeClass(e.target.value as GradeClass)}
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
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full rounded-xl border-2 border-amber-300 px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-amber-950 cursor-pointer"
                    >
                      {COMMON_SUBJECTS.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                      <option value="Other">Custom Subject...</option>
                    </select>
                    {subject === 'Other' && (
                      <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
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
                      onClick={() => setPdfSourceType('upload')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border-2 transition-all cursor-pointer ${
                        pdfSourceType === 'upload'
                          ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm font-black'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50'
                      }`}
                    >
                      📁 Upload PDF File
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfSourceType('url')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border-2 transition-all cursor-pointer ${
                        pdfSourceType === 'url'
                          ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-sm font-black'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-amber-50'
                      }`}
                    >
                      🔗 PDF URL / Drive Link
                    </button>
                  </div>

                  {pdfSourceType === 'upload' ? (
                    <div className="border-2 border-dashed border-amber-300 rounded-2xl p-4 bg-amber-50/50 text-center hover:bg-amber-50 transition-colors">
                      <input
                        type="file"
                        id="create-pdf-file-input"
                        accept="application/pdf"
                        onChange={handlePdfFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="create-pdf-file-input"
                        className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-800">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black text-amber-950">
                          {selectedFileName ? selectedFileName : 'Click to choose PDF answer sheet'}
                        </span>
                        <span className="text-[10px] text-amber-900/60 font-medium">
                          {selectedFileName ? '✓ PDF file ready to save' : 'File will be saved directly inside browser storage'}
                        </span>
                      </label>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                      placeholder="https://example.com/worksheet-answers.pdf or Google Drive link"
                      className="w-full rounded-xl border-2 border-amber-300 px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    />
                  )}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-amber-950 font-black text-xs rounded-2xl border-2 border-white shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    Save & Create Worksheet
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
                    <span>New Worksheet</span>
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
                      {uniqueSubjects.map((sub) => (
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
                      Try searching with another QR code ID, title, or create a new worksheet.
                    </p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs rounded-xl cursor-pointer"
                    >
                      + Create Worksheet Now
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
                          /* Inline Safe Confirmation State (100% reliable in iframes) */
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
            /*  VIEW 3: SETTINGS & BACKUP HUB                             */
            /* ========================================================== */
            <div className="space-y-4 py-1">
              {/* Custom Mascot / Logo Branding */}
              <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-200 space-y-2.5">
                <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>🐝</span>
                  <span>School Mascot / Login Logo Branding</span>
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Custom Logo"
                        className="w-12 h-12 object-contain rounded-2xl bg-white border-2 border-amber-300 p-1 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-amber-300 flex items-center justify-center text-2xl shadow-sm">
                        🐝
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-black text-amber-950">
                        {logoPreview ? 'Custom School Logo Active' : 'Default Little Bee Mascot'}
                      </p>
                      <p className="text-[10px] text-amber-900/60 font-medium">
                        Shown at the centre of the login greeting page
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="px-3 py-2 bg-white hover:bg-amber-100 text-amber-950 text-xs font-bold rounded-xl border border-amber-300 cursor-pointer shadow-sm active:scale-95 transition-all">
                      Upload Logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {logoPreview && (
                      <button
                        onClick={handleRemoveLogo}
                        className="px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl cursor-pointer font-bold"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Multi-Device JSON Backup & Sync */}
              <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center space-x-1.5">
                      <Download className="w-4 h-4 text-amber-700" />
                      <span>Multi-Device Backup & Sync</span>
                    </h3>
                    <p className="text-[10px] text-amber-900/70 font-medium mt-0.5">
                      Transfer all worksheets between teacher tablets, iPads & laptops
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="flex-1 py-2.5 px-4 bg-white hover:bg-amber-100 active:scale-95 text-amber-950 text-xs font-black rounded-xl border border-amber-300 flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export JSON Backup</span>
                  </button>

                  <label className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 active:scale-95 text-amber-950 text-xs font-black rounded-xl border-2 border-white flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Import JSON Backup</span>
                    <input
                      type="file"
                      accept="application/json"
                      onChange={handleImportData}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Storage Reset Sample Helper */}
              <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-amber-950">Restore Sample Worksheets</h3>
                  <p className="text-[10px] text-amber-900/60 font-medium">
                    Load initial sample English, Math & Science worksheet answer keys
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-2 bg-white hover:bg-amber-200 text-amber-950 text-xs font-bold rounded-xl border border-amber-300 cursor-pointer shadow-sm flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              </div>

              {/* Classroom & Drive Help */}
              <div className="bg-white p-3.5 rounded-2xl border-2 border-amber-300">
                <button
                  type="button"
                  onClick={() => setShowTips(!showTips)}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black text-amber-950">
                      Best Practice for School Classroom Devices
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-600">
                    {showTips ? '▲ Hide' : '▼ View'}
                  </span>
                </button>

                {showTips && (
                  <div className="mt-2.5 pt-2.5 border-t border-amber-200 text-[11px] text-amber-950 space-y-2">
                    <p className="font-medium leading-relaxed">
                      To ensure student & teacher tablets open answer sheets without login blocks:
                    </p>
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                      <p className="font-black text-amber-900 mb-0.5">
                        ✅ Direct PDF Upload (Recommended)
                      </p>
                      <p className="text-[10px] text-amber-900/80">
                        In Card 1, select <strong>"📁 Upload PDF File"</strong>. The PDF data is saved directly in browser IndexedDB with zero external login prompts!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
