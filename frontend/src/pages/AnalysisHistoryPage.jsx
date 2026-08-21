import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  History, Search, Trash2, ArrowRight, GitCompare, Sparkles, Filter, FileText
} from 'lucide-react';
import { api } from '../services/api';

export const AnalysisHistoryPage = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const list = await api.getAnalyses();
      setAnalyses(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this analysis session?')) return;
    try {
      await api.deleteAnalysis(id);
      setAnalyses(analyses.filter((a) => a.id !== id));
      setSelectedForCompare(selectedForCompare.filter((item) => item !== id));
    } catch (err) {
      alert('Failed to delete analysis');
    }
  };

  const toggleSelectCompare = (id, e) => {
    e.stopPropagation();
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((item) => item !== id));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare([selectedForCompare[1], id]);
      } else {
        setSelectedForCompare([...selectedForCompare, id]);
      }
    }
  };

  const handleLaunchCompare = () => {
    if (selectedForCompare.length === 2) {
      navigate(`/compare?id1=${selectedForCompare[0]}&id2=${selectedForCompare[1]}`);
    }
  };

  const filtered = analyses.filter((a) =>
    a.job_title.toLowerCase().includes(search.toLowerCase()) ||
    a.job_company.toLowerCase().includes(search.toLowerCase()) ||
    a.resume_filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <History className="w-6 h-6 text-brand-400" />
            <span>Analysis History</span>
          </h1>
          <p className="text-xs text-slate-400">Review, compare, and manage your past AI recruiter simulations.</p>
        </div>

        {selectedForCompare.length === 2 && (
          <button
            onClick={handleLaunchCompare}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2"
          >
            <GitCompare className="w-4 h-4" />
            <span>Compare Selected (2)</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by job title, company name, or resume filename..."
          className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading analysis history...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Analyses Found</h3>
          <p className="text-xs text-slate-400">Upload a resume and job description to run your first simulation.</p>
          <Link to="/upload" className="inline-block px-4 py-2 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs">
            Start New Analysis
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ana) => {
            const isSelected = selectedForCompare.includes(ana.id);
            return (
              <div
                key={ana.id}
                onClick={() => navigate(`/analysis/${ana.id}`)}
                className={`glass-card glass-card-hover p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected ? 'border-purple-500/80 bg-purple-950/20' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => toggleSelectCompare(ana.id, e)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                    title="Select to compare"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{ana.job_title}</h4>
                      <span className="text-xs text-slate-400 font-semibold">• {ana.job_company}</span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span>📄 {ana.resume_filename}</span>
                      <span>•</span>
                      <span>{new Date(ana.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-lg font-black text-brand-400">{Math.round(ana.overall_score)}%</div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">Overall Match</div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-sky-400">{Math.round(ana.ats_score)}%</div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">ATS Score</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(ana.id, e)}
                      className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                      title="Delete analysis"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
