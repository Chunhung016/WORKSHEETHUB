export type GradeClass = 'STD 1' | 'STD 2' | 'STD 3' | 'STD 4' | 'STD 5' | 'STD 6';

export interface WorksheetItem {
  id: string;
  qrCodeId: string;
  title: string;
  gradeClass: GradeClass | string;
  subject: string;
  pdfUrl: string; // Data URL (base64), Blob URL, Google Drive preview link, or web PDF URL
  fileName?: string;
}
