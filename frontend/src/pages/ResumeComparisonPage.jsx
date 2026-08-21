import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  GitCompare, ArrowRight, TrendingUp, TrendingDown, CheckCircle2, 
  AlertTriangle, Sparkles, Award, BarChart3, Layers, Plus, 
  ShieldCheck, ShieldAlert, Check, X, Minus, RefreshCw, FileText
} from 'lucide-react';
import { api } from '../services/api';
import { SkillBadge } from '../components/SkillBadge';

export const ResumeComparisonPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState([]);
  const [id1, setId1] = useState(searchParams.get('id1') || '');
  const [id2, setId2] = useState(searchParams.get('id2') || '');

  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
    setInitialLoading(true);
    try {
      const list = await api.getAnalyses();
      setAnalyses(list || []);
      if (!id1 && list && list.length >= 2) {
        setId1(list[1].id.toString());
        setId2(list[0].id.toString());
      } else if (!id1 && list && list.length === 1) {
        setId1(list[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (id1 && id2) {
      if (id1 === id2) {
        setError('Version A and Version B must be different analysis records to compare.');
        setComparisonResult(null);
      } else {
        handleCompare(id1, id2);
      }
    }
  }, [id1, id2]);

  const handleCompare = async (a1, a2) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.compareAnalyses(parseInt(a1), parseInt(a2));
      setComparisonResult(res);
    } catch (err) {
      setError(err.message || 'Failed to calculate comparison.');
      setComparisonResult(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDelta = (val) => {
    if (val > 0) return `+${val} pts`;
    if (val < 0) return `${val} pts`;
    return '0 pts';
  };

  const getDeltaBadge = (val) => {
    if (val > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          <TrendingUp className="w-3.5 h-3.5" /> +{val}
        </span>
      );
    }
    if (val < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
          <TrendingDown className="w-3.5 h-3.5" /> {val}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
        <Minus className="w-3.5 h-3.5" /> 0
      </span>
    );
  };

  if (initialLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-slate-400">Loading your completed resume analyses...</p>
      </div>
    );
  }

  // Empty state: Fewer than 2 analyses
  if (!analyses || analyses.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
          <GitCompare className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">Not Enough Analyses to Compare</h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            You need at least two completed resume analyses to benchmark score improvements and skill coverage deltas.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/jobs"
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" /> Run Analysis
          </Link>
          <Link
            to="/resumes"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-2"
          >
            <Layers className="w-4 h-4" /> Go to My Resumes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <GitCompare className="w-3.5 h-3.5" />
          <span>Multi-Version Resume Benchmarking</span>
        </div>
        <h1 className="text-3xl font-black text-white">Compare Resume Versions</h1>
        <p className="text-sm text-slate-400">
          Measure how edits to your resume improved ATS score, skill coverage, and recruiter ratings.
        </p>
      </div>

      {/* Selectors Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Version A Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Version A (Baseline)
            </label>
            <select
              value={id1}
              onChange={(e) => setId1(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-brand-500 transition"
            >
              <option value="">Select Analysis A</option>
              {analyses.map((a) => {
                const dateStr = new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <option key={a.id} value={a.id}>
                    {a.resume_filename} — {a.job_title || 'Target Job'} — ATS: {Math.round(a.ats_score)}% — {dateStr}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Version B Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-400"></span>
              Version B (Revised)
            </label>
            <select
              value={id2}
              onChange={(e) => setId2(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-brand-500 transition"
            >
              <option value="">Select Analysis B</option>
              {analyses.map((a) => {
                const dateStr = new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <option key={a.id} value={a.id}>
                    {a.resume_filename} — {a.job_title || 'Target Job'} — ATS: {Math.round(a.ats_score)}% — {dateStr}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-300 text-xs font-semibold flex items-center gap-2 border border-rose-500/20">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-16 space-y-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-400">Calculating granular deltas across both resume versions...</p>
        </div>
      )}

      {comparisonResult && !loading && (
        <div className="space-y-8 animate-fade-in">
          {/* Comparison Verdict Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Comparison Verdict
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                {comparisonResult.improvements.verdict}
              </h3>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Overall Delta</span>
                <span className={`text-lg font-black ${comparisonResult.improvements.overall_score_change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatDelta(comparisonResult.improvements.overall_score_change)}
                </span>
              </div>
            </div>
          </div>

          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ATS Score</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-white">{comparisonResult.version_b.ats_score}%</span>
                {getDeltaBadge(comparisonResult.improvements.ats_score_change)}
              </div>
              <span className="text-[11px] text-slate-500 font-mono block">Baseline: {comparisonResult.version_a.ats_score}%</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Job Match</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-white">{comparisonResult.version_b.job_match_score}%</span>
                {getDeltaBadge(comparisonResult.improvements.job_match_change)}
              </div>
              <span className="text-[11px] text-slate-500 font-mono block">Baseline: {comparisonResult.version_a.job_match_score}%</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Recruiter Score</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-white">{comparisonResult.version_b.recruiter_score}%</span>
                {getDeltaBadge(comparisonResult.improvements.recruiter_score_change)}
              </div>
              <span className="text-[11px] text-slate-500 font-mono block">Baseline: {comparisonResult.version_a.recruiter_score}%</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Overall Composite</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-brand-400">{comparisonResult.version_b.overall_score}%</span>
                {getDeltaBadge(comparisonResult.improvements.overall_score_change)}
              </div>
              <span className="text-[11px] text-slate-500 font-mono block">Baseline: {comparisonResult.version_a.overall_score}%</span>
            </div>
          </div>

          {/* Side-by-side Version Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Version A Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Version A (Baseline)</span>
                  <h4 className="text-lg font-bold text-white mt-0.5">{comparisonResult.version_a.resume_name}</h4>
                  <p className="text-xs text-slate-400">{comparisonResult.version_a.job_title} • {new Date(comparisonResult.version_a.analysis_date).toLocaleDateString()}</p>
                </div>
                <div className="text-2xl font-black text-slate-300">{comparisonResult.version_a.overall_score}%</div>
              </div>

              {/* Version A Skills */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block">Matched Job Skills ({comparisonResult.version_a.matched_skills.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {comparisonResult.version_a.matched_skills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Version A Strengths & Weaknesses */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-1.5">Strengths Identified</span>
                  <ul className="list-disc list-outside ml-4 text-xs text-slate-400 space-y-1">
                    {comparisonResult.version_a.strengths.slice(0, 3).map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Version B Card */}
            <div className="bg-slate-900/80 border border-brand-500/30 rounded-3xl p-6 space-y-5 shadow-lg shadow-brand-950/20">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-brand-400 tracking-wider">Version B (Revised)</span>
                  <h4 className="text-lg font-bold text-white mt-0.5">{comparisonResult.version_b.resume_name}</h4>
                  <p className="text-xs text-slate-400">{comparisonResult.version_b.job_title} • {new Date(comparisonResult.version_b.analysis_date).toLocaleDateString()}</p>
                </div>
                <div className="text-2xl font-black text-brand-400">{comparisonResult.version_b.overall_score}%</div>
              </div>

              {/* Version B Skills */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-400 block">Matched Job Skills ({comparisonResult.version_b.matched_skills.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {comparisonResult.version_b.matched_skills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Version B Strengths & Weaknesses */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-1.5">Strengths Identified</span>
                  <ul className="list-disc list-outside ml-4 text-xs text-slate-300 space-y-1">
                    {comparisonResult.version_b.strengths.slice(0, 3).map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Skill Delta Breakdown */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Skill & Requirement Delta</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Newly Matched Skills */}
              <div className="space-y-3 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Newly Matched Skills ({comparisonResult.improvements.newly_matched_skills.length})
                </span>
                {comparisonResult.improvements.newly_matched_skills.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No new job requirements were matched.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {comparisonResult.improvements.newly_matched_skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                        +{s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills Added to Resume */}
              <div className="space-y-3 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Skills Added ({comparisonResult.improvements.skills_added.length})
                </span>
                {comparisonResult.improvements.skills_added.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No new skills added in this revision.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {comparisonResult.improvements.skills_added.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Still Missing Skills */}
              <div className="space-y-3 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Still Missing ({comparisonResult.improvements.still_missing_skills.length})
                </span>
                {comparisonResult.improvements.still_missing_skills.length === 0 ? (
                  <p className="text-xs text-emerald-400 font-semibold">100% of required job skills matched!</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {comparisonResult.improvements.still_missing_skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-500/30">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
