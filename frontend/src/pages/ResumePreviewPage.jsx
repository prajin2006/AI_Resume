import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Edit3, BarChart3, Loader2, Sparkles, Printer } from 'lucide-react';
import { api } from '../services/api';
import { ResumePreview } from '../components/ResumePreview';

export default function ResumePreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const previewRef = useRef(null);

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState('modern');
  const [styling, setStyling] = useState({ primaryColor: '#2563eb', fontSize: 'medium', spacing: 'normal' });

  useEffect(() => {
    if (id) {
      loadResume(id);
    }
  }, [id]);

  const loadResume = async (resumeId) => {
    setLoading(true);
    try {
      const data = await api.getResume(resumeId);
      setResume(data);
      setTemplate(data.template_name || 'modern');
      if (data.styling_config && Object.keys(data.styling_config).length > 0) {
        setStyling(prev => ({ ...prev, ...data.styling_config }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-white">Resume not found</h2>
        <Link to="/resumes" className="text-sm font-bold text-brand-400 hover:underline">
          Back to My Resumes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Action Bar (hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 print:hidden">
        <button
          onClick={() => navigate('/resumes')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Resumes
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(resume.source_type === 'BUILDER' ? `/resumes/${resume.id}/edit` : `/resumes/${resume.id}`)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 border border-slate-700"
          >
            <Edit3 className="w-3.5 h-3.5 text-brand-400" /> Edit Resume
          </button>

          <Link
            to={`/jobs?resumeId=${resume.id}`}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/30"
          >
            <BarChart3 className="w-3.5 h-3.5" /> Analyze with AI
          </Link>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-brand-600/30"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Template Selector Bar (hidden in print) */}
      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Template View:</span>
          {['modern', 'classic', 'minimal', 'ats', 'professional'].map(t => (
            <button
              key={t}
              onClick={() => setTemplate(t)}
              className={`px-3 py-1 rounded-lg capitalize font-bold transition ${
                template === t ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white bg-slate-800'
              }`}
            >
              {t === 'ats' ? 'ATS Friendly' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-4xl mx-auto py-4">
        <ResumePreview
          ref={previewRef}
          data={resume.parsed_data || {}}
          template={template}
          styling={styling}
        />
      </div>
    </div>
  );
}
