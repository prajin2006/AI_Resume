import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, Plus, Upload, Trash2, Copy, Edit3, Eye, 
  Sparkles, Calendar, ArrowUpRight, Search, Filter, 
  CheckCircle2, Clock, BarChart3, Download, Layers, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';

export default function MyResumesPage() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('ALL'); // ALL, BUILDER, UPLOAD
  const [sortBy, setSortBy] = useState('updated'); // updated, created, score
  const [toast, setToast] = useState(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedResumeForDelete, setSelectedResumeForDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const data = await api.getResumes();
      setResumes(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load resumes. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (resume) => {
    setSelectedResumeForDelete(resume);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedResumeForDelete) return;
    setDeleting(true);
    try {
      await api.deleteResume(selectedResumeForDelete.id);
      setResumes(prev => prev.filter(r => r.id !== selectedResumeForDelete.id));
      showToast(`Resume "${selectedResumeForDelete.filename}" deleted successfully.`);
      setDeleteModalOpen(false);
      setSelectedResumeForDelete(null);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Unable to delete resume. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (resume) => {
    try {
      const duplicated = await api.duplicateResume(resume.id);
      showToast(`Duplicated as "${duplicated.filename}".`);
      fetchResumes();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to duplicate resume.', 'error');
    }
  };

  // Filter & Sort
  const filteredResumes = resumes.filter(r => {
    const matchesSearch = r.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.candidate_name && r.candidate_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.candidate_title && r.candidate_title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (filterSource === 'BUILDER') return r.source_type === 'BUILDER';
    if (filterSource === 'UPLOAD') return r.source_type === 'UPLOAD';
    return true;
  }).sort((a, b) => {
    if (sortBy === 'created') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'score') return (b.latest_overall_score || 0) - (a.latest_overall_score || 0);
    return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold transition-all animate-slide-up border ${
          toast.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-200' : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
        }`}>
          {toast.type === 'error' ? <Trash2 className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-semibold border border-brand-500/20 mb-2">
            <Layers className="w-3.5 h-3.5" /> Resume Portfolio
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">My Resumes</h1>
          <p className="text-sm text-slate-400 mt-1">Create, manage, analyze, and optimize all versions of your resumes in one place.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/upload"
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition flex items-center gap-2 hover:border-slate-600"
          >
            <Upload className="w-4 h-4 text-slate-400" /> Upload File
          </Link>
          <Link
            to="/resumes/create"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-brand-600/30 transition flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> + Create Resume
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by resume or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Source Filter Buttons */}
          <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 flex items-center gap-1 text-xs font-semibold text-slate-400">
            <button
              onClick={() => setFilterSource('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${filterSource === 'ALL' ? 'bg-brand-600 text-white font-bold' : 'hover:text-white'}`}
            >
              All ({resumes.length})
            </button>
            <button
              onClick={() => setFilterSource('BUILDER')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${filterSource === 'BUILDER' ? 'bg-brand-600 text-white font-bold' : 'hover:text-white'}`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" /> Builder
            </button>
            <button
              onClick={() => setFilterSource('UPLOAD')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${filterSource === 'UPLOAD' ? 'bg-brand-600 text-white font-bold' : 'hover:text-white'}`}
            >
              <Upload className="w-3 h-3 text-blue-400" /> Uploaded
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="score">Highest ATS Score</option>
          </select>
        </div>
      </div>

      {/* Resumes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse p-6 space-y-4">
              <div className="h-6 w-3/4 bg-slate-800 rounded-lg"></div>
              <div className="h-4 w-1/2 bg-slate-800/60 rounded-lg"></div>
              <div className="h-20 bg-slate-800/40 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : filteredResumes.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-6 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white">No resumes found</h3>
            <p className="text-sm text-slate-400">
              {searchQuery || filterSource !== 'ALL' 
                ? 'No resumes match your active search filter. Try clearing filters.'
                : 'Create your first professional resume from scratch with our AI Builder or upload an existing file.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/resumes/create"
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold shadow-lg shadow-brand-600/30 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Resume
            </Link>
            <Link
              to="/upload"
              className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-300 transition flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Upload Resume
            </Link>
          </div>
        </div>
      ) : (
        /* Resume Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResumes.map(resume => {
            const isBuilder = resume.source_type === 'BUILDER';
            const updatedTime = new Date(resume.updated_at || resume.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div
                key={resume.id}
                className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-brand-950/20 flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      isBuilder 
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' 
                        : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                    }`}>
                      {isBuilder ? <Sparkles className="w-3 h-3 text-amber-400" /> : <Upload className="w-3 h-3 text-blue-400" />}
                      {isBuilder ? 'Created with Builder' : 'Uploaded Resume'}
                    </span>

                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {updatedTime}
                    </span>
                  </div>

                  {/* Title & Candidate info */}
                  <div className="space-y-1 mb-4">
                    <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition line-clamp-1">
                      {resume.filename.replace('.pdf', '').replace('.docx', '')}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {resume.candidate_name || 'Resume Document'} 
                      {resume.candidate_title ? ` • ${resume.candidate_title}` : ''}
                    </p>
                  </div>

                  {/* Metrics Box */}
                  <div className="bg-slate-800/50 rounded-xl p-3.5 border border-slate-700/40 grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ATS Score</span>
                      <span className="text-base font-extrabold text-white flex items-center gap-1 mt-0.5">
                        {resume.latest_ats_score !== null ? (
                          <span className={`${resume.latest_ats_score >= 80 ? 'text-emerald-400' : resume.latest_ats_score >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {resume.latest_ats_score}%
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">Not Analyzed</span>
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Skills Indexed</span>
                      <span className="text-base font-extrabold text-slate-200 mt-0.5 block">
                        {resume.skills_count > 0 ? `${resume.skills_count} skills` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  {/* Primary row */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => navigate(isBuilder ? `/resumes/${resume.id}/edit` : `/resumes/${resume.id}`)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white transition flex items-center justify-center gap-1.5 border border-slate-700/80"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-brand-400" />
                      {isBuilder ? 'Edit Builder' : 'View Details'}
                    </button>

                    <Link
                      to={`/jobs?resumeId=${resume.id}`}
                      className="px-3 py-2 rounded-xl bg-brand-600/90 hover:bg-brand-500 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-md shadow-brand-900/20"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> Analyze
                    </Link>
                  </div>

                  {/* Secondary Icon Row */}
                  <div className="flex items-center justify-between gap-1 pt-1 text-slate-400">
                    <button
                      onClick={() => navigate(`/resumes/${resume.id}/preview`)}
                      title="Preview Resume"
                      className="p-2 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition text-xs font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>

                    <button
                      onClick={() => handleDuplicate(resume)}
                      title="Duplicate Resume"
                      className="p-2 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition text-xs font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5 text-indigo-400" /> Duplicate
                    </button>

                    <button
                      onClick={() => handleOpenDelete(resume)}
                      title="Delete Resume"
                      className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Resume?"
        itemName={selectedResumeForDelete?.filename}
        loading={deleting}
        message={`Are you sure you want to permanently delete "${selectedResumeForDelete?.filename}" and its associated match reports? This action cannot be undone.`}
      />
    </div>
  );
}
