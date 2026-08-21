import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, FileText, Briefcase, Bot, Plus, ArrowRight, ShieldAlert,
  CheckCircle2, TrendingUp, BarChart2, Layers, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCopilot } from '../context/CopilotContext';
import { api } from '../services/api';
import { ScoreRing } from '../components/ScoreRing';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { openCopilot } = useCopilot();
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resList, jobList, anaList] = await Promise.all([
          api.getResumes().catch(() => []),
          api.getJobs().catch(() => []),
          api.getAnalyses().catch(() => [])
        ]);
        setResumes(resList);
        setJobs(jobList);
        setAnalyses(anaList);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const latestAnalysis = analyses.length > 0 ? analyses[0] : null;

  const handleCreateSampleData = async () => {
    setLoading(true);
    try {
      const sampleResume = await api.createSampleResume();
      const sampleJob = await api.createSampleJob();
      const newAnalysis = await api.runAnalysis(sampleResume.id, sampleJob.id);
      setResumes([sampleResume]);
      setJobs([sampleJob]);
      setAnalyses([newAnalysis]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Career Cockpit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Welcome back, {user?.name || 'Engineer'} 👋
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Analyze your resume against active job descriptions, identify recruiter concerns with direct evidence, and practice technical interview questions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Link
            to="/resumes/create"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/30 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>+ Create Resume</span>
          </Link>
          <Link
            to="/upload"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-brand-400" />
            <span>Upload Resume</span>
          </Link>
          <button
            onClick={() => openCopilot()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <Bot className="w-4 h-4 text-brand-300" />
            <span>Ask AI Copilot</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Resume Score */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Latest Match</span>
            <Sparkles className="w-4 h-4 text-brand-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">
              {latestAnalysis ? Math.round(latestAnalysis.overall_score) : '--'}
            </span>
            <span className="text-xs font-semibold text-slate-500">/ 100</span>
          </div>
          <p className="text-xs text-slate-400 truncate">
            {latestAnalysis ? `${latestAnalysis.job_title} @ ${latestAnalysis.job_company}` : 'No analyses yet'}
          </p>
        </div>

        {/* Card 2: ATS Score */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">ATS Score</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-sky-400">
              {latestAnalysis ? Math.round(latestAnalysis.ats_score) : '--'}
            </span>
            <span className="text-xs font-semibold text-slate-500">/ 100</span>
          </div>
          <p className="text-xs text-slate-400">
            {latestAnalysis?.ats_score >= 80 ? 'Optimal ATS keyword density' : 'Needs keyword formatting'}
          </p>
        </div>

        {/* Card 3: Saved Resumes */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Resumes</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{resumes.length}</span>
            <span className="text-xs font-semibold text-slate-500">versions</span>
          </div>
          <Link to="/resumes" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
            <span>Manage documents</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Card 4: Target Jobs */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Saved Jobs</span>
            <Briefcase className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{jobs.length}</span>
            <span className="text-xs font-semibold text-slate-500">target roles</span>
          </div>
          <Link to="/jobs" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
            <span>View job requirements</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Analysis Showcase or Empty State */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-brand-400" />
              <span>Recent Resume Analyses</span>
            </h2>
            {analyses.length > 0 && (
              <Link to="/history" className="text-xs text-brand-400 hover:underline font-semibold flex items-center gap-1">
                <span>View all history</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {analyses.length === 0 ? (
            <div className="glass-card p-8 rounded-3xl text-center space-y-4 border border-dashed border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-400 flex items-center justify-center mx-auto border border-slate-800">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-200">No analyses generated yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Upload a PDF/DOCX resume and select a job description to initiate the AI Recruiter simulation.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/upload"
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Upload Your Resume
                </Link>
                <button
                  onClick={handleCreateSampleData}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                >
                  Load Sample Resume & Job
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map((ana) => (
                <div
                  key={ana.id}
                  onClick={() => navigate(`/analysis/${ana.id}`)}
                  className="glass-card glass-card-hover p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{ana.job_title}</h4>
                      <span className="text-xs text-slate-400 truncate">• {ana.job_company}</span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <span>📄 {ana.resume_filename}</span>
                      <span>•</span>
                      <span>{new Date(ana.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-base font-black text-brand-400">{Math.round(ana.overall_score)}%</div>
                      <div className="text-[10px] uppercase font-semibold text-slate-500">Overall Match</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-base font-black text-sky-400">{Math.round(ana.ats_score)}%</div>
                      <div className="text-[10px] uppercase font-semibold text-slate-500">ATS Score</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Copilot Prompt Assistant */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              <span>NextHire Copilot</span>
            </h2>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-indigo-500/20 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Ask your Career Assistant</h3>
              <p className="text-xs text-slate-400">The AI Copilot maintains real-time context of your resumes and score bottlenecks.</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  openCopilot();
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 text-xs text-slate-200 transition-all flex items-center justify-between group"
              >
                <span>"Why is my ATS score low?"</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => {
                  openCopilot();
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 text-xs text-slate-200 transition-all flex items-center justify-between group"
              >
                <span>"Which skill should I learn first?"</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => {
                  openCopilot();
                }}
                className="w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 text-xs text-slate-200 transition-all flex items-center justify-between group"
              >
                <span>"Ask me interview questions about my project"</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <button
              onClick={() => openCopilot()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4 text-brand-300" />
              <span>Launch Conversational Assistant</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
