import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Briefcase, Plus, Sparkles, CheckCircle2, ArrowRight, Layers, FileText, Trash2, Globe
} from 'lucide-react';
import { api } from '../services/api';
import { LoadingSteps } from '../components/LoadingSteps';

const JOB_TEMPLATES = [
  {
    title: "Senior Full-Stack Engineer",
    company: "StripeStream Technologies",
    description: `We are seeking a Senior Full-Stack Engineer to architect and build high-performance web applications and resilient microservices.
Key Responsibilities:
- Build modern, interactive user interfaces with React.js, Next.js, and TypeScript.
- Design high-performance asynchronous REST and WebSocket backend services using Python and FastAPI.
- Architect and optimize PostgreSQL databases, query indexes, and Redis caching layers.
- Deploy containerized applications to AWS using Docker and CI/CD pipelines.

Requirements:
- 3+ years of professional software engineering experience.
- Strong proficiency in Python, FastAPI or Django, and TypeScript/JavaScript.
- Deep hands-on experience with React.js, Next.js, and modern CSS (Tailwind).
- Solid understanding of relational databases (PostgreSQL) and database optimization.
- Experience with Docker, Git, CI/CD, and Cloud Deployment (AWS or GCP).`
  },
  {
    title: "AI / Machine Learning Engineer",
    company: "Nexus Intelligence",
    description: `Join our team to build state-of-the-art Generative AI and LLM agents for enterprise workflows.
Key Responsibilities:
- Build scalable inference pipelines using PyTorch, Hugging Face Transformers, and LangChain.
- Develop backend API services in Python (FastAPI) integrated with vector databases (Pinecone, Chroma).
- Optimize model latency, token throughput, and GPU compute utilization.

Requirements:
- 2+ years experience building ML systems or Python backend services.
- Expertise in Python, PyTorch, LangChain, and REST APIs.
- Experience with Docker, Linux, and Cloud AI deployment.
- Familiarity with Prompt Engineering, RAG architectures, and evaluation metrics.`
  },
  {
    title: "Frontend React Specialist",
    company: "Apex Design Systems",
    description: `We are looking for a skilled Frontend Engineer who cares deeply about UI/UX, responsive performance, and modern web architectures.
Requirements:
- 3+ years experience with React.js, TypeScript, Next.js, and Tailwind CSS.
- Strong knowledge of state management (Redux Toolkit, Zustand) and web accessibility.
- Experience writing automated unit tests with Jest and React Testing Library.
- Familiarity with REST APIs, GraphQL, and CI/CD workflows.`
  }
];

export const JobDescriptionPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const resumeIdParam = searchParams.get('resumeId');

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(resumeIdParam || '');
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resList, jobList] = await Promise.all([
          api.getResumes(),
          api.getJobs()
        ]);
        setResumes(resList);
        if (resumeIdParam) {
          setSelectedResumeId(resumeIdParam);
        } else if (resList.length > 0) {
          setSelectedResumeId(resList[0].id.toString());
        }

        setJobs(jobList);
        if (jobList.length > 0) {
          setSelectedJobId(jobList[0].id.toString());
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [resumeIdParam]);

  const handleApplyTemplate = (tmpl) => {
    setTitle(tmpl.title);
    setCompany(tmpl.company);
    setDescription(tmpl.description);
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please fill in Job Title and Description.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const newJob = await api.createJob({ title, company, url, description });
      setJobs([newJob, ...jobs]);
      setSelectedJobId(newJob.id.toString());
      setTitle('');
      setCompany('');
      setUrl('');
      setDescription('');
    } catch (err) {
      setError(err.message || 'Failed to save job description.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedResumeId) {
      setError('Please select or upload a resume.');
      return;
    }
    if (!selectedJobId) {
      setError('Please select or create a job description.');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const res = await api.runAnalysis(parseInt(selectedResumeId), parseInt(selectedJobId));
      navigate(`/analysis/${res.id}`);
    } catch (err) {
      setError(err.message || 'Failed to generate analysis.');
      setAnalyzing(false);
    }
  };

  if (analyzing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <LoadingSteps title="Simulating AI Recruiter & Rejection Risk Analysis" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Briefcase className="w-3.5 h-3.5" />
          <span>Job Requirement Extraction & Skill Normalization</span>
        </div>
        <h1 className="text-3xl font-black text-white">Target Job Description</h1>
        <p className="text-sm text-slate-400">
          Paste a target job posting or select from popular tech roles to benchmark your resume.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <span>{error}</span>
        </div>
      )}

      {/* Top Selector: Active Resume & Job Launcher */}
      <div className="glass-card p-6 rounded-3xl border border-brand-500/30 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              1. Select Resume
            </label>
            {resumes.length === 0 ? (
              <div className="text-xs text-amber-400">
                No resumes uploaded.{' '}
                <button onClick={() => navigate('/upload')} className="underline font-bold">
                  Upload one now
                </button>
              </div>
            ) : (
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.filename} ({r.candidate_name || 'Candidate'}) • {r.skills_count} skills
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              2. Select Saved Job
            </label>
            {jobs.length === 0 ? (
              <div className="text-xs text-slate-400">No saved jobs yet. Create one below!</div>
            ) : (
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} @ {j.company}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-end">
            <button
              onClick={handleRunAnalysis}
              disabled={!selectedResumeId || !selectedJobId || analyzing}
              className="w-full md:w-auto px-8 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 text-slate-950 font-black text-sm shadow-xl shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Full AI Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Add New Job & Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form: Paste new job */}
        <div className="lg:col-span-2 glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>Create / Paste New Job Posting</span>
            </h3>
          </div>

          <form onSubmit={handleSaveJob} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Job Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Company Name</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. StripeStream Inc"
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Job Posting URL (Optional)</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://company.com/careers/job-id"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Job Description / Requirements *</label>
              <textarea
                required
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste the full job description here (Responsibilities, Required Skills, Tech Stack)..."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Analyzing Requirements...' : 'Save & Parse Job Description'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right 1 Col: Role Templates */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Pre-Filled Tech Templates</span>
            </h3>
            <p className="text-xs text-slate-400">Click to instantly populate job requirements.</p>
          </div>

          <div className="space-y-3">
            {JOB_TEMPLATES.map((tmpl, idx) => (
              <div
                key={idx}
                onClick={() => handleApplyTemplate(tmpl)}
                className="glass-card glass-card-hover p-4 rounded-2xl border border-slate-800 cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-100">{tmpl.title}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">Template</span>
                </div>
                <p className="text-xs text-slate-400">{tmpl.company}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{tmpl.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
