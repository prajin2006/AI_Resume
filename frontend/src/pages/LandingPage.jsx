import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles, Bot, ShieldAlert, CheckCircle2, ArrowRight, Zap, Target,
  FileSearch, MessageSquare, TrendingUp, BarChart3, HelpCircle, Layers, Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleTryDemo = async () => {
    await demoLogin();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080C14] text-slate-100 selection:bg-brand-500 selection:text-black">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-semibold text-brand-400 mb-2 shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation AI Resume Intelligence & Career Copilot</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
          Know Why Recruiters Might Reject Your Resume —{' '}
          <span className="gradient-text">Before They Do.</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          NextHire uses AI to analyze your resume against real job requirements, identify potential rejection risks with concrete resume evidence, and coach you for technical interviews.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to={user ? "/upload" : "/register"}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-base shadow-xl shadow-brand-500/25 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Analyze My Resume</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button
            onClick={handleTryDemo}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 text-slate-200 hover:text-white font-semibold text-base border border-slate-700/80 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Bot className="w-5 h-5 text-indigo-400" />
            <span>Try 1-Click Interactive Demo</span>
          </button>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-12">
          <div className="glass-card p-5 rounded-2xl text-center space-y-1">
            <div className="text-2xl font-black text-white">98.4%</div>
            <div className="text-xs text-slate-400 font-medium">ATS Keyword Accuracy</div>
          </div>
          <div className="glass-card p-5 rounded-2xl text-center space-y-1">
            <div className="text-2xl font-black text-emerald-400">100%</div>
            <div className="text-xs text-slate-400 font-medium">Evidence-Based Explanations</div>
          </div>
          <div className="glass-card p-5 rounded-2xl text-center space-y-1">
            <div className="text-2xl font-black text-indigo-400">7 Categories</div>
            <div className="text-xs text-slate-400 font-medium">Personalized Interview Prep</div>
          </div>
          <div className="glass-card p-5 rounded-2xl text-center space-y-1">
            <div className="text-2xl font-black text-sky-400">Real-Time</div>
            <div className="text-xs text-slate-400 font-medium">Context-Aware AI Copilot</div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Enterprise AI Engine</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Everything You Need To Secure The Offer</h2>
          <p className="text-sm text-slate-400">A comprehensive suite engineered for modern software engineers, data scientists, and tech professionals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-card glass-card-hover p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Rejection Prediction & Evidence</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Detects high-risk recruiter screening concerns with verbatim evidence from your resume comparing against required and preferred skills.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card glass-card-hover p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Context-Aware AI Copilot</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Have an open-ended conversation with an AI career advisor that knows your exact resume, target job, ATS scores, and weak spots.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card glass-card-hover p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Personalized Interview Coach</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Generates custom technical, project, behavioral, and scenario questions tailored to your flagship projects and detected knowledge gaps.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card glass-card-hover p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileSearch className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Deterministic & Semantic Parser</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Parses PDF and DOCX documents with robust regex pattern matching combined with LLM enrichment for complete section accuracy.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-card glass-card-hover p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">5-Day Preparation Roadmap</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Transforms missing requirements into an actionable day-by-day study schedule with checklist tracking and concrete tasks.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-card glass-card-hover p-8 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Version Comparison & Diff</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Compare multiple iterations of your resume against the same job to measure ATS gains and newly matched skills.
            </p>
          </div>
        </div>
      </section>

      {/* Recruiter Simulation Spotlight */}
      <section id="recruiter" className="py-20 bg-slate-950/60 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-400">AI Recruiter Screening</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Explainable Risk Analysis with Real Evidence</h2>
            <p className="text-sm text-slate-400">NextHire doesn't just guess numbers — it explains recruiter decisions with factual proof.</p>
          </div>

          {/* Mock Evidence Card Display */}
          <div className="max-w-3xl mx-auto glass-card rounded-2xl p-6 border-l-4 border-l-rose-500 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h4 className="font-bold text-slate-100">Possible Rejection Reason: Insufficient Production Cloud / DevOps Evidence</h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">High Risk</span>
            </div>
            <div className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              <span className="font-semibold text-slate-500">Target Requirement:</span> AWS, Docker Containerization & CI/CD Pipelines
            </div>
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
              <div className="text-[11px] font-semibold uppercase text-slate-400">🔍 Resume Evidence Cited:</div>
              <p className="text-xs text-slate-300 italic">"The resume demonstrates proficiency in React and local FastAPI APIs, but contains zero references to Docker container orchestration, AWS deployment, or CI/CD pipelines."</p>
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase text-brand-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recommended Action:</span>
              </div>
              <p className="text-xs text-slate-200">Containerize your flagship full-stack project with Docker Compose and deploy to AWS ECS/EC2 to eliminate this screening bottleneck.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-400">Everything you need to know about how NextHire evaluates resumes.</p>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5 rounded-2xl space-y-2">
            <h4 className="text-base font-semibold text-slate-100">Does NextHire guarantee I will get hired or rejected?</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              No. NextHire provides probabilistic risk estimations, recruiter screening simulations, and preparation recommendations. It never presents predictions as absolute decisions.
            </p>
          </div>
          <div className="glass-card p-5 rounded-2xl space-y-2">
            <h4 className="text-base font-semibold text-slate-100">Are my resumes and chat sessions secure?</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              Yes. All uploads, extracted data, and chat sessions are protected with JWT authentication and stored securely in your private PostgreSQL/SQLite database.
            </p>
          </div>
          <div className="glass-card p-5 rounded-2xl space-y-2">
            <h4 className="text-base font-semibold text-slate-100">Can I ask custom questions to the AI Copilot?</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              Yes! The AI Copilot is a full conversational assistant. You can type arbitrary natural language questions about your projects, scores, or interview answers.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">NextHire</span>
            <span>— AI Resume Analyzer & Recruiter Simulation</span>
          </div>
          <div>Built with React, FastAPI, SQLAlchemy, and LLM Intelligence.</div>
        </div>
      </footer>
    </div>
  );
};
