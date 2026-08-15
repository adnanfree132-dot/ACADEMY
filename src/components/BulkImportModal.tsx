import React, { useState } from 'react';
import { X, UploadCloud, Download, CheckCircle2, AlertCircle, FileText, Trash2 } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (students: any[]) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDownloadSampleCSV = () => {
    const csvContent = "FullName,ParentName,Phone,Email,GradeBatch,Gender\n" +
                       "Ahmed Hassan,Hassan Ali,+923001234567,ahmed@example.com,Grade 10,Male\n" +
                       "Sara Khan,Zubair Khan,+923019876543,sara@example.com,Grade 11,Female\n" +
                       "Bilal Malik,Malik Usman,+923025554433,bilal@example.com,Grade 9,Male";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Sample_Student_Roster.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        
        if (lines.length < 2) {
          setErrorMsg('CSV file must contain a header row and at least 1 student row.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 2) {
            const studentObj: any = {};
            headers.forEach((h, index) => {
              const val = cols[index] || '';
              if (h.includes('name') && !h.includes('parent')) studentObj.name = val;
              else if (h.includes('parent')) studentObj.parentName = val;
              else if (h.includes('phone')) studentObj.phone = val;
              else if (h.includes('email')) studentObj.email = val;
              else if (h.includes('grade') || h.includes('batch') || h.includes('class')) studentObj.gradeBatch = val;
              else if (h.includes('gender')) studentObj.gender = val;
            });

            if (!studentObj.name) studentObj.name = cols[0] || 'New Student';
            if (!studentObj.parentName) studentObj.parentName = cols[1] || 'Parent / Guardian';
            if (!studentObj.phone) studentObj.phone = cols[2] || '+9200000000';
            if (!studentObj.gradeBatch) studentObj.gradeBatch = cols[4] || 'Grade 10';

            rows.push(studentObj);
          }
        }

        setParsedRows(rows);
      } catch (err) {
        setErrorMsg('Failed to parse CSV file. Please ensure it is valid UTF-8 CSV.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    try {
      await onImport(parsedRows);
      setParsedRows([]);
      setFileName('');
      onClose();
    } catch (err) {
      setErrorMsg('Failed to import students. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose} 
      style={{ 
        zIndex: 1300, 
        background: 'rgba(15, 23, 42, 0.65)', 
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto'
      }}
    >
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: 640, 
          width: '92%', 
          background: 'transparent', 
          border: 'none', 
          boxShadow: 'none', 
          padding: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12 
        }}
      >
        {/* Island 1: Floating Dark Navy Header */}
        <div style={{ 
          background: '#0F172A', 
          color: '#FFFFFF', 
          padding: '16px 20px', 
          borderRadius: 16, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981'
            }}>
              <UploadCloud size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Bulk Student CSV Roster Import</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, marginTop: 2 }}>Upload a `.csv` file to register multiple students simultaneously</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              border: 'none', 
              color: '#FFFFFF', 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer' 
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Island 3: Floating White Content Card */}
        <div style={{ 
          padding: 22, 
          background: '#FFFFFF', 
          borderRadius: 16, 
          border: '1px solid #E2E8F0', 
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12)',
          display: 'flex', 
          flexDirection: 'column', 
          gap: 16, 
          maxHeight: '70vh', 
          overflowY: 'auto' 
        }}>
          
          {/* File Drop & Upload Zone */}
          <div style={{ border: '2px dashed #CBD5E1', borderRadius: 14, padding: 22, textAlign: 'center', background: '#F8FAFC', position: 'relative' }}>
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileUpload}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
            <div style={{ display: 'inline-flex', padding: 12, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', marginBottom: 8 }}>
              <UploadCloud size={26} />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              {fileName ? fileName : 'Click or Drag & Drop CSV File Here'}
            </h3>
            <p style={{ fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 10 }}>Supports standard `.csv` format</p>
            
            <button 
              type="button" 
              onClick={handleDownloadSampleCSV} 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 6, 
                zIndex: 10, 
                position: 'relative',
                padding: '6px 14px',
                borderRadius: 9999,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={13} /> Download Sample CSV Template
            </button>
          </div>

          {errorMsg && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECDD3', color: '#B91C1C', padding: 12, borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          {/* Parsed Rows Preview Table */}
          {parsedRows.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Parsed Roster Preview ({parsedRows.length} Students Ready)
                </h3>
                <button 
                  onClick={() => { setParsedRows([]); setFileName(''); }}
                  style={{ border: 'none', background: 'transparent', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Trash2 size={13} /> Clear
                </button>
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', maxHeight: 200, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textTransform: 'uppercase', color: '#64748B', fontSize: 11 }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Student Name</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Parent Name</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Phone</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Grade / Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((r, i) => (
                      <tr key={i} style={{ borderBottom: i < parsedRows.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <td style={{ padding: '8px 12px', color: '#94A3B8' }}>{i + 1}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F172A' }}>{r.name}</td>
                        <td style={{ padding: '8px 12px', color: '#334155' }}>{r.parentName}</td>
                        <td style={{ padding: '8px 12px', color: '#2563EB' }}>{r.phone}</td>
                        <td style={{ padding: '8px 12px', color: '#64748B' }}>{r.gradeBatch}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Island 4: Floating Right-Aligned Paired Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 2 }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 9999,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            disabled={parsedRows.length === 0 || isSubmitting}
            onClick={handleConfirmImport}
            style={{ 
              padding: '10px 24px',
              borderRadius: 9999,
              border: 'none',
              background: parsedRows.length === 0 ? '#94A3B8' : '#0F172A',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              cursor: parsedRows.length === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.4)'
            }}
          >
            <CheckCircle2 size={16} /> {isSubmitting ? 'Importing...' : `✓ Import ${parsedRows.length} Students Now`}
          </button>
        </div>
      </div>
    </div>
  );
};
