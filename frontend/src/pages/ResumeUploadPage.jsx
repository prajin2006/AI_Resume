import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, ArrowRight, Loader2, Info
} from 'lucide-react';
import { api } from '../services/api';
import { LoadingSteps } from '../components/LoadingSteps';

export const ResumeUploadPage = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsedResult, setParsedResult] = useState(null);

  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    setError('');
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    const validExts = ['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp'];
    if (!validExts.includes(ext)) {
      setError('Unsupported file type. Please upload a PDF, DOCX, PNG, or JPG document.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File exceeds 10MB maximum limit.');
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.uploadResume(file);
      setParsedResult(res);
    } catch (err) {
      setError(err.message || 'Failed to upload and parse resume. Please ensure the document is not password-protected.');
    } finally {
      setLoading(false);
    }
  };

  const handleSampleResume = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.createSampleResume();
      setParsedResult(res);
    } catch (err) {
      setError(err.message || 'Failed to load sample resume.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <LoadingSteps title="Extracting & Structuring Resume Data" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Deterministic & Semantic Extraction Engine</span>
        </div>
        <h1 className="text-3xl font-black text-white">Upload Your Resume</h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          We extract contact details, skills taxonomy, work history, projects, and education in seconds.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!parsedResult ? (
        <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Drag & drop dropzone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
                dragActive
                  ? 'border-brand-500 bg-brand-500/5'
                  : file
                  ? 'border-indigo-500/80 bg-indigo-950/20'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
                onChange={handleFileInput}
                className="hidden"
              />

              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                  {file ? <FileText className="w-7 h-7 text-brand-400" /> : <UploadCloud className="w-7 h-7" />}
                </div>

                {file ? (
                  <div className="space-y-1">
                    <p className="text-base font-bold text-white">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready to process</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-base font-semibold text-slate-200">
                      Drag and drop your resume file here, or{' '}
                      <label htmlFor="file-upload" className="text-brand-400 hover:underline cursor-pointer">
                        browse files
                      </label>
                    </p>
                    <p className="text-xs text-slate-500">Supports PDF, DOCX, PNG, and JPG documents up to 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleSampleResume}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Use Sample Tech Resume</span>
              </button>

              <button
                type="submit"
                disabled={!file || loading}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 text-slate-950 font-bold text-sm shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Extract & Parse Resume</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Parsed Resume Confirmation Card */
        <div className="glass-card p-8 rounded-3xl border border-brand-500/30 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Resume Successfully Parsed!</h3>
                <p className="text-xs text-slate-400">{parsedResult.filename} • {parsedResult.file_type.toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Quick breakdown preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs uppercase font-semibold text-slate-500">Candidate</div>
              <div className="text-sm font-bold text-slate-200">
                {parsedResult.parsed_data?.contact?.name || 'Candidate'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs uppercase font-semibold text-slate-500">Skills Detected</div>
              <div className="text-sm font-bold text-brand-400">
                {parsedResult.parsed_data?.skills?.length || 0} skills
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs uppercase font-semibold text-slate-500">Experience</div>
              <div className="text-sm font-bold text-indigo-400">
                ~{parsedResult.parsed_data?.total_years_experience || 1.0} years
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => navigate(`/resumes/${parsedResult.id}`)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              View Full Structured Resume
            </button>
            <button
              onClick={() => navigate(`/jobs?resumeId=${parsedResult.id}`)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Job Matching</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
