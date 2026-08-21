import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, Bot, ShieldAlert, CheckCircle2, AlertTriangle, HelpCircle,
  FileText, Briefcase, TrendingUp, Layers, Award, ArrowRight, Share2,
  RefreshCw, Check, ArrowLeft, Lightbulb, Code2, Clock, BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useCopilot } from '../context/CopilotContext';
import { ScoreRing } from '../components/ScoreRing';
import { EvidenceCard } from '../components/EvidenceCard';
import { SkillBadge } from '../components/SkillBadge';

export const ResumeAnalysisPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openCopilot } = useCopilot();

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('recruiter'); // recruiter, skills, rejection, interview, prep, improve

  // Filter for interview questions
  const [questionCategory, setQuestionCategory] = useState('ALL');

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const data = await api.getAnalysis(id);
        setAnalysis(data);

        // Fire celebration if high score
        if (data.overall_score >= 80) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load analysis record.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [id]);

  const handleTogglePrepDay = async (dayNum) => {
    try {
      const res = await api.togglePrepTask(id, dayNum);
      if (analysis && analysis.preparation_gaps) {
        setAnalysis({
          ...analysis,
          preparation_gaps: {
            ...analysis.preparation_gaps,
            preparation_plan: res.preparation_plan
          }
        });
      }
    } catch (err) {
      console.error('Failed to toggle day task:', err);
    }
  };

  const handleOpenCopilot = () => {
    if (analysis) {
      openCopilot({
        resumeId: analysis.resume_id,
        jobId: analysis.job_id,
        analysisId: analysis.id,
        jobTitle: analysis.job_title,
        resumeName: analysis.resume_filename
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">
        Loading AI analysis cockpit...
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">Analysis Not Found</h3>
        <p className="text-sm text-slate-400">{error || 'Could not retrieve this analysis session.'}</p>
        <Link to="/dashboard" className="inline-block px-5 py-2.5 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const rVerdict = analysis.recruiter_verdict || {};
  const prep = analysis.preparation_gaps || { strong_areas: [], weak_areas: [], preparation_plan: [] };

  const filteredQuestions = questionCategory === 'ALL'
    ? analysis.interview_questions
    : analysis.interview_questions.filter((q) => q.category.toUpperCase() === questionCategory.toUpperCase());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{analysis.job_title}</h1>
              <span className="text-xs text-slate-400">• {analysis.job_company}</span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>Resume: {analysis.resume_filename}</span>
              <span>•</span>
              <span>Analyzed {new Date(analysis.created_at).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCopilot}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
          >
            <Bot className="w-4 h-4 text-brand-300" />
            <span>Ask Copilot About This Match</span>
          </button>
        </div>
      </div>

      {/* Executive Score Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-center">
          {/* Main Ring */}
          <div className="col-span-2 flex justify-center border-b md:border-b-0 md:border-r border-slate-800/80 pb-4 md:pb-0 md:pr-4">
            <ScoreRing
              score={analysis.overall_score}
              size={130}
              strokeWidth={9}
              label="Overall Match"
              sublabel="Composite Score"
            />
          </div>

          {/* Sub Score Dials */}
          <div className="text-center space-y-1">
            <div className="text-2xl font-black text-sky-400">{Math.round(analysis.ats_score)}</div>
            <div className="text-[11px] uppercase font-bold text-slate-400">ATS Score</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-400 h-full rounded-full" style={{ width: `${analysis.ats_score}%` }}></div>
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="text-2xl font-black text-emerald-400">{Math.round(analysis.skill_match_score)}</div>
            <div className="text-[11px] uppercase font-bold text-slate-400">Skill Match</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${analysis.skill_match_score}%` }}></div>
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="text-2xl font-black text-indigo-400">{Math.round(analysis.experience_match_score)}</div>
            <div className="text-[11px] uppercase font-bold text-slate-400">Experience</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${analysis.experience_match_score}%` }}></div>
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="text-2xl font-black text-purple-400">{Math.round(analysis.project_match_score)}</div>
            <div className="text-[11px] uppercase font-bold text-slate-400">Projects</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-400 h-full rounded-full" style={{ width: `${analysis.project_match_score}%` }}></div>
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="text-2xl font-black text-amber-400">{Math.round(analysis.education_match_score)}</div>
            <div className="text-[11px] uppercase font-bold text-slate-400">Education</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${analysis.education_match_score}%` }}></div>
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="text-2xl font-black text-rose-400">{Math.round(analysis.recruiter_score)}</div>
            <div className="text-[11px] uppercase font-bold text-slate-400">Recruiter</div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-rose-400 h-full rounded-full" style={{ width: `${analysis.recruiter_score}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2 text-xs font-bold no-scrollbar">
        <button
          onClick={() => setActiveTab('recruiter')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'recruiter' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>AI Recruiter Review</span>
        </button>

        <button
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'skills' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Skills & ATS ({analysis.matched_skills.length} Matched / {analysis.missing_skills.length} Missing)</span>
        </button>

        <button
          onClick={() => setActiveTab('rejection')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'rejection' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Rejection Risk Predictor ({analysis.rejection_risks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('interview')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'interview' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Interview Prep ({analysis.interview_questions.length} Questions)</span>
        </button>

        <button
          onClick={() => setActiveTab('prep')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'prep' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>5-Day Roadmap</span>
        </button>

        <button
          onClick={() => setActiveTab('improve')}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'improve' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:text-white bg-slate-900/60'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Resume Bullet Improver</span>
        </button>
      </div>

      {/* Tab 1: AI Recruiter Review */}
      {activeTab === 'recruiter' && (
        <div className="space-y-6">
          {/* Verdict Box */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-indigo-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Recruiter Screening Simulation</span>
                  <h3 className="text-xl font-bold text-white">Verdict: {rVerdict.verdict || 'Potential Fit with Gaps'}</h3>
                </div>
              </div>
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase bg-brand-500/10 text-brand-400 border border-brand-500/20 w-fit">
                Probabilistic Evaluation
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
              {rVerdict.summary || 'The candidate matches core technologies but requires additional depth in specific backend infrastructure and cloud deployment.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Strengths */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Candidate Strengths Cited</span>
                </h4>
                <ul className="space-y-2">
                  {(rVerdict.strengths || analysis.strengths || []).map((str, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-emerald-500/5 p-2.5 rounded-xl border border-emerald-500/10">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Concerns */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Candidate Concerns & Bottlenecks</span>
                </h4>
                <ul className="space-y-2">
                  {(rVerdict.concerns || analysis.weaknesses || []).map((w, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-rose-500/5 p-2.5 rounded-xl border border-rose-500/10">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Recommended Improvements */}
          <div className="glass-card p-6 rounded-3xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Recommended Next Steps Before Applying</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {(rVerdict.recommended_improvements || analysis.recommendations || []).map((rec, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-brand-400">Step {i + 1}</div>
                  <p>{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Skills & ATS Match */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Skills */}
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Matched Skills ({analysis.matched_skills.length})</span>
                </h3>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Verified Match</span>
              </div>
              <p className="text-xs text-slate-400">Skills present in your resume that directly fulfill the job posting.</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {analysis.matched_skills.map((s, i) => (
                  <SkillBadge key={i} skill={s} type="matched" />
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Missing Requirements ({analysis.missing_skills.length})</span>
                </h3>
                <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">Action Required</span>
              </div>
              <p className="text-xs text-slate-400">Required technologies not detected in your resume text.</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {analysis.missing_skills.map((s, i) => (
                  <SkillBadge key={i} skill={s} type="missing" />
                ))}
              </div>
            </div>

            {/* Partial / Related Skills */}
            {analysis.partial_skills && analysis.partial_skills.length > 0 && (
              <div className="glass-card p-6 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>Partially Matched / Related Skills ({analysis.partial_skills.length})</span>
                </h3>
                <p className="text-xs text-slate-400">Adjacent technologies detected in your experience graph.</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {analysis.partial_skills.map((s, i) => (
                    <SkillBadge key={i} skill={s} type="partial" />
                  ))}
                </div>
              </div>
            )}

            {/* Extra Skills */}
            {analysis.extra_skills && analysis.extra_skills.length > 0 && (
              <div className="glass-card p-6 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Bonus / Extra Skills on Resume ({analysis.extra_skills.length})</span>
                </h3>
                <p className="text-xs text-slate-400">Additional competencies that differentiate your profile.</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {analysis.extra_skills.slice(0, 12).map((s, i) => (
                    <SkillBadge key={i} skill={s} type="extra" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Transparent ATS Score Breakdown Card */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-sky-500/30 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-black text-2xl">
                  {Math.round(analysis.ats_score)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">Your ATS Compatibility Score</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {analysis.ats_breakdown?.status || (analysis.ats_score >= 80 ? 'Good ATS Compatibility' : 'Moderate Compatibility')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {analysis.ats_breakdown?.explanation || 'Evaluated against automated parsing standards, keyword density, section headers, and machine readability.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 9-Point Weighted Breakdown Grid */}
            {analysis.ats_breakdown?.breakdown && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Transparent 100-Point ATS Scoring Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(analysis.ats_breakdown.breakdown).map(([key, val]) => {
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const pct = Math.min(100, Math.round((val.score / val.max) * 100));
                    return (
                      <div key={key} className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-300">{label}</span>
                          <span className="font-bold text-sky-400">{val.score} / {val.max}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-400' : pct >= 50 ? 'bg-sky-400' : 'bg-amber-400'}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.ats_breakdown?.recommendations && analysis.ats_breakdown.recommendations.length > 0 && (
              <div className="pt-2 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Actionable ATS Improvement Recommendations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {analysis.ats_breakdown.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Rejection Risk Predictor with Evidence */}
      {activeTab === 'rejection' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <span>Evidence-Based Rejection Risk Predictions</span>
            </h3>
            <p className="text-xs text-slate-400">
              Non-guaranteed probabilistic risk estimations backed by exact resume text citations vs target requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.rejection_risks.map((risk, idx) => (
              <EvidenceCard key={risk.id || idx} risk={risk} />
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Interview Questions */}
      {activeTab === 'interview' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-400" />
                <span>Personalized Interview Preparation Questions</span>
              </h3>
              <p className="text-xs text-slate-400">Tailored specifically to your projects, resume stack, and detected knowledge gaps.</p>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['ALL', 'TECHNICAL', 'PROJECT', 'RESUME-BASED', 'JOB-SPECIFIC', 'BEHAVIORAL', 'SCENARIO'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setQuestionCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                    questionCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => (
              <div key={q.id || idx} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/20 uppercase">
                      {q.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      q.difficulty === 'Hard' ? 'text-rose-400 bg-rose-500/10' : q.difficulty === 'Medium' ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'
                    }`}>
                      {q.difficulty}
                    </span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-slate-100">"{q.question}"</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <div className="font-semibold text-slate-400">Why Interviewers Ask This:</div>
                    <p className="text-slate-300">{q.why_asked}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <div className="font-semibold text-emerald-400">What The Interviewer Expects:</div>
                    <p className="text-slate-300">{q.what_expected}</p>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-indigo-950/20 p-3 rounded-xl border border-indigo-900/30 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-indigo-300">Preparation Tip: </span>
                    <span>{q.preparation_tips}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: 5-Day Preparation Roadmap */}
      {activeTab === 'prep' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-400" />
              <span>5-Day Interview Preparation Roadmap</span>
            </h3>
            <p className="text-xs text-slate-400">Master missing technical gaps and rehearse project narratives day-by-day.</p>
          </div>

          <div className="space-y-4">
            {(prep.preparation_plan || []).map((day) => (
              <div
                key={day.day}
                className={`glass-card p-6 rounded-3xl border transition-all ${
                  day.completed ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTogglePrepDay(day.day)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        day.completed ? 'bg-emerald-500 text-slate-950' : 'border border-slate-700 bg-slate-900 text-transparent hover:border-slate-500'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">Day {day.day}</span>
                      <h4 className="text-base font-bold text-white">{day.title}</h4>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    day.completed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {day.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs">
                  <div className="space-y-1.5">
                    <span className="font-semibold text-slate-400">Core Topics:</span>
                    <ul className="space-y-1">
                      {day.topics.map((t, ti) => (
                        <li key={ti} className="text-slate-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-semibold text-emerald-400">Action Tasks:</span>
                    <ul className="space-y-1">
                      {day.tasks.map((task, tk) => (
                        <li key={tk} className="text-slate-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Fact-Preserving Resume Improver */}
      {activeTab === 'improve' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <span>Fact-Preserving Resume Bullet Enhancements</span>
            </h3>
            <p className="text-xs text-slate-400">
              Elevate action verbs and clarity without fabricating fake qualifications, degrees, or metrics.
            </p>
          </div>

          <div className="space-y-4">
            {(analysis.improvements || []).map((item, idx) => (
              <div key={item.id || idx} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">{item.section_name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">STAR Enhanced</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Original */}
                  <div className="p-4 rounded-2xl bg-rose-950/10 border border-rose-500/20 space-y-1">
                    <div className="font-bold text-rose-400 uppercase text-[10px]">Original Version</div>
                    <p className="text-slate-300 leading-relaxed italic">"{item.original_text}"</p>
                  </div>

                  {/* Suggested */}
                  <div className="p-4 rounded-2xl bg-emerald-950/10 border border-emerald-500/20 space-y-1">
                    <div className="font-bold text-emerald-400 uppercase text-[10px]">AI Optimized (Truth-Preserving)</div>
                    <p className="text-slate-200 leading-relaxed font-medium">"{item.suggested_text}"</p>
                  </div>
                </div>

                <div className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="font-semibold text-slate-300">Rationale for Change: </span>
                  <span>{item.reason_for_change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
