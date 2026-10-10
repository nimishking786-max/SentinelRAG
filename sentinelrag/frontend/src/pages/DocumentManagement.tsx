import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Search, 
  Lock, 
  Unlock, 
  Layers, 
  CheckCircle2, 
  X, 
  Plus, 
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { ThemedSelect } from '../components/ui/ThemedSelect';

interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_type: string;
  department: string;
  sensitivity: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  allowed_roles?: string;
  is_accessible?: boolean;
  chunk_count?: number;
  created_at?: string;
}

interface UploadSelectProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const UploadSelect = ({ label, value, options, onChange, open, onToggle, onClose }: UploadSelectProps) => {
  const selectedOption = options.find((option) => option.value === value) || options[0];

  return (
    <div className="relative">
      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">{label}</label>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="technical-select flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-xs"
        onClick={onToggle}
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close dropdown" className="fixed inset-0 z-20 cursor-default" onClick={onClose} />
          <div className="technical-select-menu absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden p-1" role="listbox" aria-label={label}>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`technical-select-option ${option.value === value ? 'is-selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  onClose();
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const DocumentManagement = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [sensitivityFilter, setSensitivityFilter] = useState('ALL');
  
  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [inspectorDoc, setInspectorDoc] = useState<DocumentItem | null>(null);
  const [chunks, setChunks] = useState<any[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [inspectorError, setInspectorError] = useState<string | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDept, setUploadDept] = useState('GENERAL');
  const [uploadSensitivity, setUploadSensitivity] = useState<'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'>('INTERNAL');
  const [uploadAllowedRoles, setUploadAllowedRoles] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTextContent, setUploadTextContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [openUploadSelect, setOpenUploadSelect] = useState<'department' | 'sensitivity' | null>(null);

  const getApiErrorMessage = (error: any, fallback: string) => {
    const detail = error?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object') {
      return detail.message || JSON.stringify(detail);
    }
    return error?.message || fallback;
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents/all');
      setDocuments(res.data || []);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/auth/roles').then((res) => setAvailableRoles((res.data || []).map((role: any) => role.name))).catch(() => setAvailableRoles(['ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER', 'EMPLOYEE']));
  }, []);

  useEffect(() => {
    const modalOpen = uploadModalOpen || Boolean(inspectorDoc);
    if (!modalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [uploadModalOpen, inspectorDoc]);

  useEffect(() => {
    fetchDocuments();
  }, [currentUser]);

  const handleInspectChunks = async (doc: DocumentItem) => {
    setInspectorDoc(doc);
    setInspectorError(null);
    setChunksLoading(true);
    try {
      const res = await api.get(`/documents/${doc.id}/chunks`);
      setChunks(res.data?.chunks || []);
    } catch (err: any) {
      setInspectorError(err.response?.data?.detail || "You do not have clearance to inspect chunks for this document.");
      setChunks([]);
    } finally {
      setChunksLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    setUploading(true);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('title', uploadTitle);
    formData.append('department', uploadDept);
    formData.append('sensitivity', uploadSensitivity);
    formData.append('allowed_roles', uploadAllowedRoles.join(','));

    if (uploadFile) {
      formData.append('file', uploadFile);
    } else {
      // Create a dummy text file from text area
      const blob = new Blob([uploadTextContent || `Sample content for ${uploadTitle}`], { type: 'text/plain' });
      formData.append('file', blob, `${uploadTitle.replace(/\s+/g, '_')}.txt`);
    }

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSuccess(`Successfully ingested "${uploadTitle}" into vault with ${res.data.chunks_processed} vector chunks.`);
      setUploadTitle('');
      setUploadTextContent('');
      setUploadFile(null);
      setUploadAllowedRoles([]);
      fetchDocuments();
      setTimeout(() => {
        setUploadModalOpen(false);
        setUploadSuccess(null);
      }, 1500);
    } catch (err: any) {
      alert(getApiErrorMessage(err, "Upload failed. Verify your role permissions."));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Are you sure you want to purge this document and all associated vector chunks?")) return;
    try {
      await api.delete(`/documents/${docId}`);
      fetchDocuments();
    } catch (err: any) {
      alert(getApiErrorMessage(err, "Only ADMIN role can purge vault documents."));
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (doc.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || doc.department === deptFilter;
    const matchesSens = sensitivityFilter === 'ALL' || doc.sensitivity === sensitivityFilter;
    return matchesSearch && matchesDept && matchesSens;
  });

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 dark:bg-vault-card rounded-2xl text-indigo-600 dark:text-cyan-400">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                Knowledge Vault
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-Modal Ingestion & Dynamic Role Clearance Matrix
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="neubrutalist-btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Ingest Document
          </button>
        </div>
      </div>

      {/* Persona Clearance Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-vault-card border border-indigo-200/60 dark:border-vault-border flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-200">Active Viewing Clearance:</span>
          <span className="font-mono font-bold px-2.5 py-1 rounded-full bg-white dark:bg-vault-surface text-indigo-600 dark:text-cyan-400 border border-slate-200 dark:border-vault-border shadow-sm">
            {currentUser?.full_name} ({currentUser?.role})
          </span>
        </div>
        <div className="text-slate-500">
          Documents with <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Unlocked</span> badges are authorized for your semantic search queries.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2.5 bg-white dark:bg-vault-card px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-vault-border shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vault documents by title or keywords..."
            className="bg-transparent outline-none w-full text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ThemedSelect value={deptFilter} onChange={setDeptFilter} options={[
            { value: 'ALL', label: 'All Departments' },
            { value: 'FINANCE', label: 'Finance' },
            { value: 'HR', label: 'HR & People' },
            { value: 'GENERAL', label: 'General' },
            { value: 'ADMIN', label: 'Admin / M&A' },
          ]} aria-label="Filter by department" />
          <ThemedSelect value={sensitivityFilter} onChange={setSensitivityFilter} options={[
            { value: 'ALL', label: 'All Sensitivities' },
            { value: 'PUBLIC', label: 'PUBLIC' },
            { value: 'INTERNAL', label: 'INTERNAL' },
            { value: 'CONFIDENTIAL', label: 'CONFIDENTIAL' },
            { value: 'RESTRICTED', label: 'RESTRICTED' },
          ]} aria-label="Filter by sensitivity" />
        </div>
      </div>

      {/* Document Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          Loading documents from vault...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="clay-card p-12 text-center text-slate-400 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
          <p className="font-semibold text-base">No documents match the active filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => {
            const isAccessible = doc.is_accessible;

            return (
              <div 
                key={doc.id}
                className={`clay-card p-6 flex flex-col justify-between gap-5 relative group border transition-all ${
                  isAccessible 
                    ? 'border-slate-200/80 dark:border-vault-border hover:border-indigo-400 dark:hover:border-cyan-500' 
                    : 'border-red-200/60 dark:border-red-950/40 bg-slate-50/50 dark:bg-vault-card/40 opacity-90'
                }`}
              >
                {/* Delete button (Admin only) */}
                {currentUser?.role === 'ADMIN' && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Purge Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="space-y-4">
                  {/* Clearance Indicator Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border ${
                      isAccessible
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                        : 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400 border-red-300 dark:border-red-800'
                    }`}>
                      {isAccessible ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {isAccessible ? 'Clearance Granted' : 'Access Restricted'}
                    </span>

                    <span className="text-[11px] font-mono text-slate-400">
                      {doc.chunk_count || 2} Chunks
                    </span>
                  </div>

                  {/* Document Title & File Info */}
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-slate-100 dark:bg-vault-surface rounded-2xl shrink-0">
                      <FileText className={`w-6 h-6 ${isAccessible ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {doc.description || doc.file_name}
                      </p>
                    </div>
                  </div>

                  {/* Department & Sensitivity Badges */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-2.5 py-0.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                      DEPT: {doc.department}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-xl text-[10px] font-bold border ${
                      doc.sensitivity === 'RESTRICTED' ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800' :
                      doc.sensitivity === 'CONFIDENTIAL' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                      doc.sensitivity === 'INTERNAL' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
                      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {doc.sensitivity}
                    </span>
                  </div>
                </div>

                {/* Footer with Allowed Roles & Chunk Inspector trigger */}
                <div className="pt-4 border-t border-slate-100 dark:border-vault-border/60 space-y-3">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Authorized: </span>
                    {doc.allowed_roles}
                  </div>

                  <button
                    onClick={() => handleInspectChunks(doc)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-vault-card hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200/60 dark:border-vault-border"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-cyan-400" />
                    Inspect Vector Chunks
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ingest Document Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-sm p-4 z-50 animate-in fade-in">
          <div className="flex min-h-full items-center justify-center">
          <div className="clay-card flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border border-slate-200 dark:border-vault-border">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 pb-3 pt-6 dark:border-vault-border md:px-8 md:pt-8">
              <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
                <Upload className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
                Ingest New Knowledge Document
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadSuccess && (
              <div className="mx-6 mt-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                {uploadSuccess}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 pb-6 pt-5 text-xs md:px-8 md:pb-8">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., FY2026_Engineering_Roadmap.pdf"
                  className="clay-input technical-select text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <UploadSelect
                    label="Department"
                    value={uploadDept}
                    options={[
                      { value: 'GENERAL', label: 'GENERAL' },
                      { value: 'FINANCE', label: 'FINANCE' },
                      { value: 'HR', label: 'HR' },
                      { value: 'ADMIN', label: 'ADMIN' },
                      { value: 'SALES', label: 'SALES' },
                    ]}
                    open={openUploadSelect === 'department'}
                    onToggle={() => setOpenUploadSelect((current) => current === 'department' ? null : 'department')}
                    onClose={() => setOpenUploadSelect(null)}
                    onChange={setUploadDept}
                  />
                </div>

                <div>
                  <UploadSelect
                    label="Sensitivity Level"
                    value={uploadSensitivity}
                    options={[
                      { value: 'PUBLIC', label: 'PUBLIC (All Employees)' },
                      { value: 'INTERNAL', label: 'INTERNAL (Dept Only)' },
                      { value: 'CONFIDENTIAL', label: 'CONFIDENTIAL (Managers)' },
                      { value: 'RESTRICTED', label: 'RESTRICTED (Admin/Exec)' },
                    ]}
                    open={openUploadSelect === 'sensitivity'}
                    onToggle={() => setOpenUploadSelect((current) => current === 'sensitivity' ? null : 'sensitivity')}
                    onClose={() => setOpenUploadSelect(null)}
                    onChange={(value) => setUploadSensitivity(value as typeof uploadSensitivity)}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Upload PDF or Text File
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-vault-card dark:file:text-cyan-400 hover:file:bg-indigo-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Allowed Roles
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Select roles that can access this document. Leave all unchecked
                  to use the selected sensitivity and department policy.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {availableRoles.map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-vault-border px-3 py-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={uploadAllowedRoles.includes(role)}
                        onChange={(e) => {
                          setUploadAllowedRoles((current) =>
                            e.target.checked
                              ? [...current, role]
                              : current.filter((selectedRole) => selectedRole !== role)
                          );
                        }}
                        className="accent-indigo-600"
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Or Paste Document Text Directly
                </label>
                <textarea
                  rows={4}
                  value={uploadTextContent}
                  onChange={(e) => setUploadTextContent(e.target.value)}
                  placeholder="Paste raw documentation, policies, or report excerpts here..."
                  className="clay-input text-xs resize-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="neubrutalist-btn text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="neubrutalist-btn-primary text-xs flex items-center gap-2"
                >
                  {uploading ? "Chunking & Embedding..." : "Ingest into Vault"}
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>
      )}

      {/* Chunk Inspector Modal */}
      {inspectorDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="clay-card p-6 md:p-8 max-w-2xl w-full space-y-4 border border-slate-200 dark:border-vault-border max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-vault-border">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                  Vector Chunks: {inspectorDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectorDoc(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>Department: <b className="text-slate-700 dark:text-slate-300">{inspectorDoc.department}</b></span>
              <span>•</span>
              <span>Sensitivity: <b className="text-slate-700 dark:text-slate-300">{inspectorDoc.sensitivity}</b></span>
            </div>

            {inspectorError ? (
              <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-300 text-red-800 dark:text-red-300 text-xs space-y-2">
                <div className="font-bold flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                  <ShieldAlert className="w-4 h-4" /> Access Denied
                </div>
                <p>{inspectorError}</p>
                <div className="text-[11px] text-red-600/80">
                  Sentinel Zero-Trust prevents unauthorized personas from even previewing vector embeddings or chunk text.
                </div>
              </div>
            ) : chunksLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Scanning chunk indices...
              </div>
            ) : chunks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No chunks available for this document.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {chunks.map((c, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-vault-card border border-slate-200/70 dark:border-vault-border text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="font-bold text-indigo-600 dark:text-cyan-400">
                        CHUNK #{c.chunk_index + 1}
                      </span>
                      <span>Page {c.page_number || 1} • 1536-dim vector</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                      {c.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectorDoc(null)}
                className="neubrutalist-btn text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
