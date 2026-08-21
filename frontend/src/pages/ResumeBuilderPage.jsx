import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, Save, Download, ArrowLeft, ArrowRight, Plus, 
  Trash2, CheckCircle2, AlertCircle, Eye, EyeOff, Layout, 
  Type, Palette, MoveUp, MoveDown, RotateCcw, BarChart3, 
  Loader2, Wand2, ShieldAlert, FileText, Check
} from 'lucide-react';
import { api } from '../services/api';
import { ResumePreview } from '../components/ResumePreview';

const TEMPLATES = [
  { id: 'modern', name: 'Modern', desc: 'Contemporary layout with accent border and tags' },
  { id: 'classic', name: 'Classic', desc: 'Traditional elegant serif typography' },
  { id: 'minimal', name: 'Minimal', desc: 'Ultra clean high-contrast black & white' },
  { id: 'ats', name: 'ATS Friendly', desc: 'Single-column machine readable layout', badge: 'Recommended for ATS' },
  { id: 'professional', name: 'Professional', desc: 'Executive navy layout with structured timeline' }
];

const ACCENT_COLORS = [
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Slate', hex: '#334155' }
];

const STEPS = [
  { id: 1, name: 'Personal' },
  { id: 2, name: 'Summary' },
  { id: 3, name: 'Skills' },
  { id: 4, name: 'Experience' },
  { id: 5, name: 'Projects' },
  { id: 6, name: 'Education' },
  { id: 7, name: 'Certifications' },
  { id: 8, name: 'Achievements' },
  { id: 9, name: 'Custom' }
];

export default function ResumeBuilderPage() {
  const { id } = useParams(); // If present, edit mode
  const navigate = useNavigate();
  const previewRef = useRef(null);

  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('Saved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Resume State
  const [filename, setFilename] = useState('My_Professional_Resume');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [styling, setStyling] = useState({
    primaryColor: '#2563eb',
    fontSize: 'medium',
    spacing: 'normal'
  });

  const [resumeData, setResumeData] = useState({
    contact: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: ''
    },
    summary: '',
    skills: [],
    technical_skills: [],
    soft_skills: [],
    tools_technologies: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    achievements: [],
    languages: ['English'],
    additional_sections: []
  });

  // Skill input temp state
  const [newSkill, setNewSkill] = useState('');

  // Load existing resume if editing
  useEffect(() => {
    if (id) {
      loadExistingResume(id);
    }
  }, [id]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadExistingResume = async (resumeId) => {
    setLoading(true);
    try {
      const data = await api.getResume(resumeId);
      setFilename(data.filename ? data.filename.replace('.pdf', '').replace('.docx', '') : 'My_Resume');
      setSelectedTemplate(data.template_name || 'modern');
      if (data.styling_config && Object.keys(data.styling_config).length > 0) {
        setStyling(prev => ({ ...prev, ...data.styling_config }));
      }
      if (data.parsed_data) {
        setResumeData(prev => ({
          ...prev,
          ...data.parsed_data,
          contact: { ...prev.contact, ...(data.parsed_data.contact || {}) },
          experience: data.parsed_data.experience || [],
          education: data.parsed_data.education || [],
          projects: data.parsed_data.projects || [],
          skills: data.parsed_data.skills || []
        }));
      }
      setAutoSaveStatus('Saved');
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to load resume for editing.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Warn on browser tab close with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Debounced auto-save tracker
  useEffect(() => {
    if (!id) return; // Only auto-save existing resumes
    setAutoSaveStatus('Saving...');
    const timer = setTimeout(async () => {
      try {
        await api.updateResume(id, {
          filename,
          template_name: selectedTemplate,
          styling_config: styling,
          data: resumeData
        });
        setAutoSaveStatus('Saved');
        setHasUnsavedChanges(false);
      } catch (err) {
        setAutoSaveStatus('Unsaved');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [resumeData, selectedTemplate, styling, filename, id]);

  const updateContact = (field, val) => {
    setResumeData(prev => ({
      ...prev,
      contact: { ...prev.contact, [field]: val }
    }));
    setHasUnsavedChanges(true);
  };

  // Skill Handlers
  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (!trimmed || resumeData.skills.includes(trimmed)) return;
    setResumeData(prev => ({
      ...prev,
      skills: [...prev.skills, trimmed],
      technical_skills: [...prev.technical_skills, trimmed]
    }));
    setNewSkill('');
    setHasUnsavedChanges(true);
  };

  const removeSkill = (skillToRemove) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove),
      technical_skills: prev.technical_skills.filter(s => s !== skillToRemove)
    }));
    setHasUnsavedChanges(true);
  };

  // Experience Handlers
  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: '',
          company: '',
          location: '',
          start_date: '',
          end_date: '',
          currently_working: false,
          description: ['']
        }
      ]
    }));
    setHasUnsavedChanges(true);
  };

  const updateExperience = (index, field, val) => {
    setResumeData(prev => {
      const copy = [...prev.experience];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, experience: copy };
    });
    setHasUnsavedChanges(true);
  };

  const updateExpBullet = (expIndex, bulletIndex, val) => {
    setResumeData(prev => {
      const copy = [...prev.experience];
      const desc = [...copy[expIndex].description];
      desc[bulletIndex] = val;
      copy[expIndex] = { ...copy[expIndex], description: desc };
      return { ...prev, experience: copy };
    });
    setHasUnsavedChanges(true);
  };

  const addExpBullet = (expIndex) => {
    setResumeData(prev => {
      const copy = [...prev.experience];
      copy[expIndex] = { ...copy[expIndex], description: [...copy[expIndex].description, ''] };
      return { ...prev, experience: copy };
    });
    setHasUnsavedChanges(true);
  };

  const removeExpBullet = (expIndex, bulletIndex) => {
    setResumeData(prev => {
      const copy = [...prev.experience];
      const desc = copy[expIndex].description.filter((_, i) => i !== bulletIndex);
      copy[expIndex] = { ...copy[expIndex], description: desc };
      return { ...prev, experience: copy };
    });
    setHasUnsavedChanges(true);
  };

  const removeExperience = (index) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
    setHasUnsavedChanges(true);
  };

  // Project Handlers
  const addProject = () => {
    setResumeData(prev => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          name: '',
          technologies: [],
          description: [''],
          github_url: '',
          live_url: ''
        }
      ]
    }));
    setHasUnsavedChanges(true);
  };

  const updateProject = (index, field, val) => {
    setResumeData(prev => {
      const copy = [...prev.projects];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, projects: copy };
    });
    setHasUnsavedChanges(true);
  };

  const updateProjBullet = (projIndex, bulletIndex, val) => {
    setResumeData(prev => {
      const copy = [...prev.projects];
      const desc = [...copy[projIndex].description];
      desc[bulletIndex] = val;
      copy[projIndex] = { ...copy[projIndex], description: desc };
      return { ...prev, projects: copy };
    });
    setHasUnsavedChanges(true);
  };

  const addProjBullet = (projIndex) => {
    setResumeData(prev => {
      const copy = [...prev.projects];
      copy[projIndex] = { ...copy[projIndex], description: [...copy[projIndex].description, ''] };
      return { ...prev, projects: copy };
    });
    setHasUnsavedChanges(true);
  };

  const removeProjBullet = (projIndex, bulletIndex) => {
    setResumeData(prev => {
      const copy = [...prev.projects];
      const desc = copy[projIndex].description.filter((_, i) => i !== bulletIndex);
      copy[projIndex] = { ...copy[projIndex], description: desc };
      return { ...prev, projects: copy };
    });
    setHasUnsavedChanges(true);
  };

  const removeProject = (index) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
    setHasUnsavedChanges(true);
  };

  // Education Handlers
  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degree: '',
          institution: '',
          field: '',
          graduation_year: '',
          gpa: ''
        }
      ]
    }));
    setHasUnsavedChanges(true);
  };

  const updateEducation = (index, field, val) => {
    setResumeData(prev => {
      const copy = [...prev.education];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, education: copy };
    });
    setHasUnsavedChanges(true);
  };

  const removeEducation = (index) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
    setHasUnsavedChanges(true);
  };

  // Certifications Handlers
  const addCertification = () => {
    setResumeData(prev => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        { name: '', organization: '', issue_date: '' }
      ]
    }));
    setHasUnsavedChanges(true);
  };

  const updateCertification = (index, field, val) => {
    setResumeData(prev => {
      const copy = [...prev.certifications];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, certifications: copy };
    });
    setHasUnsavedChanges(true);
  };

  const removeCertification = (index) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
    setHasUnsavedChanges(true);
  };

  // AI Assist Calls
  const handleAIAssistSummary = async (actionType) => {
    setAiLoading(true);
    try {
      const res = await api.aiAssist(actionType, resumeData.summary, {
        title: resumeData.contact.title,
        skills: resumeData.skills,
        experience: resumeData.experience
      });
      if (res && res.result) {
        setResumeData(prev => ({ ...prev, summary: res.result }));
        setHasUnsavedChanges(true);
        showToast('Summary updated with AI.');
      }
    } catch (err) {
      showToast(err.message || 'AI generation failed.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIAssistBullet = async (expIndex, bulletIndex) => {
    const rawText = resumeData.experience[expIndex]?.description[bulletIndex];
    if (!rawText || !rawText.trim()) {
      showToast('Please type a draft bullet point first.', 'error');
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.aiAssist('improve_bullet', rawText);
      if (res && res.result) {
        updateExpBullet(expIndex, bulletIndex, res.result);
        showToast('Bullet improved with action metrics.');
      }
    } catch (err) {
      showToast(err.message || 'AI bullet improvement failed.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIAssistProjBullet = async (projIndex, bulletIndex) => {
    const rawText = resumeData.projects[projIndex]?.description[bulletIndex];
    if (!rawText || !rawText.trim()) {
      showToast('Please type a draft project description first.', 'error');
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.aiAssist('improve_bullet', rawText);
      if (res && res.result) {
        updateProjBullet(projIndex, bulletIndex, res.result);
        showToast('Project bullet improved.');
      }
    } catch (err) {
      showToast(err.message || 'AI improvement failed.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAISuggestSkills = async () => {
    setAiLoading(true);
    try {
      const res = await api.aiAssist('suggest_skills', '', {
        title: resumeData.contact.title || 'Software Engineer'
      });
      if (res && res.suggestions) {
        const unique = [...new Set([...resumeData.skills, ...res.suggestions])];
        setResumeData(prev => ({ ...prev, skills: unique, technical_skills: unique }));
        setHasUnsavedChanges(true);
        showToast(`Added ${res.suggestions.length} relevant skill suggestions.`);
      }
    } catch (err) {
      showToast('Could not fetch skill suggestions.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Save Resume Action
  const handleSaveResume = async () => {
    if (!resumeData.contact.name.trim()) {
      showToast('Please enter your full name in Personal Info.', 'error');
      setActiveStep(1);
      return;
    }

    setSaving(true);
    try {
      if (id) {
        // Update existing
        await api.updateResume(id, {
          filename,
          template_name: selectedTemplate,
          styling_config: styling,
          data: resumeData
        });
        showToast('Resume saved successfully.');
      } else {
        // Create new
        const created = await api.createResume({
          filename,
          template_name: selectedTemplate,
          styling_config: styling,
          data: resumeData
        });
        showToast('Resume created successfully!');
        navigate(`/resumes/${created.id}/edit`, { replace: true });
      }
      setHasUnsavedChanges(false);
      setAutoSaveStatus('Saved');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to save resume.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Print / PDF Download Action
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold transition-all animate-slide-up border ${
          toast.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-200' : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toast.message}
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (hasUnsavedChanges) {
                if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                  navigate('/resumes');
                }
              } else {
                navigate('/resumes');
              }
            }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={filename}
                onChange={(e) => {
                  setFilename(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="text-xl font-extrabold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-brand-500 focus:outline-none px-1 py-0.5 transition"
                placeholder="Resume Document Title"
              />
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {id ? 'Editing' : 'Draft'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${autoSaveStatus === 'Saved' ? 'bg-emerald-500' : autoSaveStatus === 'Saving...' ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`}></span>
              Status: {autoSaveStatus}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mobile Preview Toggle */}
          <button
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="lg:hidden px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2"
          >
            {showMobilePreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showMobilePreview ? 'Edit Form' : 'Live Preview'}
          </button>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white border border-slate-700 flex items-center gap-2 transition"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" /> Download PDF
          </button>

          {/* Analyze Resume Button */}
          {id && (
            <Link
              to={`/jobs?resumeId=${id}`}
              className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 transition"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analyze with AI
            </Link>
          )}

          {/* Save Resume */}
          <button
            onClick={handleSaveResume}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving...' : 'Save Resume'}
          </button>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Editor (7 Cols) */}
        <div className={`lg:col-span-6 xl:col-span-5 space-y-6 ${showMobilePreview ? 'hidden lg:block' : 'block'}`}>
          {/* Step Progress Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl flex items-center gap-1 overflow-x-auto scrollbar-none">
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeStep === s.id
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${activeStep === s.id ? 'bg-white/20' : 'bg-slate-800 text-slate-500'}`}>
                  {s.id}
                </span>
                {s.name}
              </button>
            ))}
          </div>

          {/* Form Step Container */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            {/* Step 1: Personal Information */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-base font-bold text-white">Step 1 — Personal Information</h2>
                  <p className="text-xs text-slate-400">Add your contact and professional links for recruiters.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={resumeData.contact.name}
                      onChange={(e) => updateContact('name', e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Professional Title</label>
                    <input
                      type="text"
                      value={resumeData.contact.title}
                      onChange={(e) => updateContact('title', e.target.value)}
                      placeholder="e.g. Senior Full-Stack Engineer"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={resumeData.contact.email}
                      onChange={(e) => updateContact('email', e.target.value)}
                      placeholder="alex.mercer@example.com"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Phone</label>
                    <input
                      type="text"
                      value={resumeData.contact.phone}
                      onChange={(e) => updateContact('phone', e.target.value)}
                      placeholder="(555) 342-8921"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Location</label>
                    <input
                      type="text"
                      value={resumeData.contact.location}
                      onChange={(e) => updateContact('location', e.target.value)}
                      placeholder="San Francisco, CA"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">LinkedIn URL</label>
                    <input
                      type="text"
                      value={resumeData.contact.linkedin}
                      onChange={(e) => updateContact('linkedin', e.target.value)}
                      placeholder="linkedin.com/in/alexmercer"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">GitHub / Portfolio Website</label>
                    <input
                      type="text"
                      value={resumeData.contact.github}
                      onChange={(e) => updateContact('github', e.target.value)}
                      placeholder="github.com/alexmercer"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Professional Summary */}
            {activeStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Step 2 — Professional Summary</h2>
                    <p className="text-xs text-slate-400">A concise 2-3 sentence overview of your career and value.</p>
                  </div>

                  <button
                    onClick={() => handleAIAssistSummary('generate_summary')}
                    disabled={aiLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                    ✨ Generate with AI
                  </button>
                </div>

                <textarea
                  rows={6}
                  value={resumeData.summary}
                  onChange={(e) => {
                    setResumeData(prev => ({ ...prev, summary: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Results-driven Software Engineer with 3+ years of experience designing scalable web services..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-sm text-white leading-relaxed focus:outline-none focus:border-brand-500"
                />

                {/* AI Polish Toolbars */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">AI Actions:</span>
                  <button
                    onClick={() => handleAIAssistSummary('make_ats_friendly')}
                    disabled={aiLoading || !resumeData.summary}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                  >
                    Make ATS Friendly
                  </button>
                  <button
                    onClick={() => handleAIAssistSummary('make_concise')}
                    disabled={aiLoading || !resumeData.summary}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                  >
                    Make Concise
                  </button>
                  <button
                    onClick={() => handleAIAssistSummary('improve_summary')}
                    disabled={aiLoading || !resumeData.summary}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                  >
                    Rewrite Professionally
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Skills */}
            {activeStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Step 3 — Core Skills & Competencies</h2>
                    <p className="text-xs text-slate-400">Add programming languages, frameworks, databases, and soft skills.</p>
                  </div>

                  <button
                    onClick={handleAISuggestSkills}
                    disabled={aiLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-indigo-400" />}
                    ✨ Suggest Relevant Skills
                  </button>
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(newSkill);
                      }
                    }}
                    placeholder="Type skill name and press Enter (e.g. React.js, Python, Docker)..."
                    className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => addSkill(newSkill)}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs"
                  >
                    Add
                  </button>
                </div>

                {/* Skill Badges */}
                <div className="flex flex-wrap gap-2 p-4 bg-slate-800/40 rounded-xl border border-slate-800 min-h-24">
                  {resumeData.skills.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No skills added yet. Type above or click "Suggest Relevant Skills".</p>
                  ) : (
                    resumeData.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 group"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="text-slate-500 hover:text-red-400 font-bold ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Work Experience */}
            {activeStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Step 4 — Work Experience</h2>
                    <p className="text-xs text-slate-400">List previous jobs, responsibilities, and achievements.</p>
                  </div>
                  <button
                    onClick={addExperience}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Job
                  </button>
                </div>

                {resumeData.experience.length === 0 ? (
                  <div className="text-center py-8 bg-slate-800/30 rounded-xl border border-dashed border-slate-800 space-y-2">
                    <p className="text-xs text-slate-400">No work experience added yet.</p>
                    <button
                      onClick={addExperience}
                      className="text-xs font-bold text-brand-400 hover:underline"
                    >
                      + Add your first position
                    </button>
                  </div>
                ) : (
                  resumeData.experience.map((exp, expIdx) => (
                    <div key={expIdx} className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3.5 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-brand-400">Role #{expIdx + 1}</span>
                        <button
                          onClick={() => removeExperience(expIdx)}
                          className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Job Title</label>
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => updateExperience(expIdx, 'title', e.target.value)}
                            placeholder="e.g. Software Engineer"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateExperience(expIdx, 'company', e.target.value)}
                            placeholder="e.g. Apex Solutions"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Start Date</label>
                          <input
                            type="text"
                            value={exp.start_date}
                            onChange={(e) => updateExperience(expIdx, 'start_date', e.target.value)}
                            placeholder="e.g. 2022-01"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">End Date / Status</label>
                          <input
                            type="text"
                            value={exp.end_date}
                            onChange={(e) => updateExperience(expIdx, 'end_date', e.target.value)}
                            placeholder="e.g. Present"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Bullet points */}
                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        <label className="block text-[11px] font-bold text-slate-300">Bullet Points (Action & Impact)</label>
                        {exp.description.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={bullet}
                              onChange={(e) => updateExpBullet(expIdx, bIdx, e.target.value)}
                              placeholder="e.g. Architected REST APIs with FastAPI, reducing latency by 45%..."
                              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleAIAssistBullet(expIdx, bIdx)}
                              disabled={aiLoading}
                              title="Improve with AI (Google XYZ framework)"
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeExpBullet(expIdx, bIdx)}
                              className="p-1.5 text-slate-500 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => addExpBullet(expIdx)}
                          className="text-xs font-semibold text-brand-400 hover:underline pt-1 flex items-center gap-1"
                        >
                          + Add Bullet Point
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Step 5: Projects */}
            {activeStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Step 5 — Key Projects</h2>
                    <p className="text-xs text-slate-400">Highlight your best technical accomplishments.</p>
                  </div>
                  <button
                    onClick={addProject}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </div>

                {resumeData.projects.length === 0 ? (
                  <div className="text-center py-8 bg-slate-800/30 rounded-xl border border-dashed border-slate-800">
                    <p className="text-xs text-slate-400">No projects added yet.</p>
                    <button onClick={addProject} className="text-xs font-bold text-brand-400 hover:underline mt-1">
                      + Add a project
                    </button>
                  </div>
                ) : (
                  resumeData.projects.map((proj, pIdx) => (
                    <div key={pIdx} className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-brand-400">Project #{pIdx + 1}</span>
                        <button onClick={() => removeProject(pIdx)} className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Project Name</label>
                          <input
                            type="text"
                            value={proj.name}
                            onChange={(e) => updateProject(pIdx, 'name', e.target.value)}
                            placeholder="e.g. AI Resume Analyzer"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Technologies Used</label>
                          <input
                            type="text"
                            value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : ''}
                            onChange={(e) => updateProject(pIdx, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            placeholder="e.g. React, FastAPI, PostgreSQL"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Bullets */}
                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        <label className="block text-[11px] font-bold text-slate-300">Description</label>
                        {proj.description.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={bullet}
                              onChange={(e) => updateProjBullet(pIdx, bIdx, e.target.value)}
                              placeholder="e.g. Built automated evaluation pipeline handling 1,000+ analyses/day..."
                              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleAIAssistProjBullet(pIdx, bIdx)}
                              disabled={aiLoading}
                              title="Improve with AI"
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeProjBullet(pIdx, bIdx)}
                              className="p-1.5 text-slate-500 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addProjBullet(pIdx)}
                          className="text-xs font-semibold text-brand-400 hover:underline pt-1"
                        >
                          + Add Project Bullet
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Step 6: Education */}
            {activeStep === 6 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Step 6 — Education</h2>
                    <p className="text-xs text-slate-400">Degrees, colleges, and certifications.</p>
                  </div>
                  <button
                    onClick={addEducation}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Degree
                  </button>
                </div>

                {resumeData.education.length === 0 ? (
                  <div className="text-center py-8 bg-slate-800/30 rounded-xl border border-dashed border-slate-800">
                    <p className="text-xs text-slate-400">No education entries added yet.</p>
                    <button onClick={addEducation} className="text-xs font-bold text-brand-400 hover:underline mt-1">
                      + Add degree or diploma
                    </button>
                  </div>
                ) : (
                  resumeData.education.map((edu, eduIdx) => (
                    <div key={eduIdx} className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-brand-400">Education #{eduIdx + 1}</span>
                        <button onClick={() => removeEducation(eduIdx)} className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Degree / Certificate</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(eduIdx, 'degree', e.target.value)}
                            placeholder="e.g. B.S. in Computer Science"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Institution / University</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => updateEducation(eduIdx, 'institution', e.target.value)}
                            placeholder="e.g. UC Berkeley"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Graduation Year</label>
                          <input
                            type="text"
                            value={edu.graduation_year}
                            onChange={(e) => updateEducation(eduIdx, 'graduation_year', e.target.value)}
                            placeholder="e.g. 2022"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">GPA (Optional)</label>
                          <input
                            type="text"
                            value={edu.gpa}
                            onChange={(e) => updateEducation(eduIdx, 'gpa', e.target.value)}
                            placeholder="e.g. 3.85 / 4.0"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Step 7: Certifications */}
            {activeStep === 7 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Step 7 — Certifications</h2>
                    <p className="text-xs text-slate-400">AWS, GCP, Scrum, or professional credentials.</p>
                  </div>
                  <button
                    onClick={addCertification}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Certification
                  </button>
                </div>

                {resumeData.certifications.length === 0 ? (
                  <div className="text-center py-8 bg-slate-800/30 rounded-xl border border-dashed border-slate-800">
                    <p className="text-xs text-slate-400">No certifications added yet.</p>
                    <button onClick={addCertification} className="text-xs font-bold text-brand-400 hover:underline mt-1">
                      + Add a certificate
                    </button>
                  </div>
                ) : (
                  resumeData.certifications.map((cert, cIdx) => (
                    <div key={cIdx} className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-brand-400">Certification #{cIdx + 1}</span>
                        <button onClick={() => removeCertification(cIdx)} className="text-slate-500 hover:text-red-400 text-xs flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Certification Name</label>
                          <input
                            type="text"
                            value={typeof cert === 'object' ? cert.name : cert}
                            onChange={(e) => updateCertification(cIdx, 'name', e.target.value)}
                            placeholder="e.g. AWS Solutions Architect"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Issuing Organization</label>
                          <input
                            type="text"
                            value={typeof cert === 'object' ? cert.organization : ''}
                            onChange={(e) => updateCertification(cIdx, 'organization', e.target.value)}
                            placeholder="e.g. Amazon Web Services"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Step 8 & 9: Achievements & Additional */}
            {(activeStep === 8 || activeStep === 9) && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="text-base font-bold text-white">
                    {activeStep === 8 ? 'Step 8 — Achievements & Honors' : 'Step 9 — Additional Sections'}
                  </h2>
                  <p className="text-xs text-slate-400">Awards, hackathons, publications, and languages.</p>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-300">Spoken Languages</label>
                  <input
                    type="text"
                    value={resumeData.languages.join(', ')}
                    onChange={(e) => {
                      setResumeData(prev => ({
                        ...prev,
                        languages: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="e.g. English (Native), Spanish (Fluent)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                disabled={activeStep === 1}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeStep === 1 ? 'opacity-30 cursor-not-allowed text-slate-500' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <button
                type="button"
                onClick={() => setActiveStep(prev => Math.min(STEPS.length, prev + 1))}
                disabled={activeStep === STEPS.length}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeStep === STEPS.length ? 'opacity-30 cursor-not-allowed text-slate-500' : 'bg-brand-600 hover:bg-brand-500 text-white'
                }`}
              >
                Next Step <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Resume Preview + Template & Styling Controls (5-7 Cols) */}
        <div className={`lg:col-span-6 xl:col-span-7 space-y-4 ${showMobilePreview ? 'block' : 'hidden lg:block'}`}>
          {/* Customization & Template Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-4">
            {/* Templates Selector */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Choose Template
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplate(t.id);
                      setHasUnsavedChanges(true);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition relative ${
                      selectedTemplate === t.id
                        ? 'bg-brand-600/10 border-brand-500 ring-1 ring-brand-500'
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    {t.badge && (
                      <span className="absolute -top-2 right-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-emerald-500 text-slate-950 uppercase tracking-tight shadow">
                        ATS Rec
                      </span>
                    )}
                    <span className="text-xs font-bold text-white block">{t.name}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Styling Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800 text-xs">
              {/* Color Accents */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Accent:</span>
                <div className="flex items-center gap-1.5">
                  {ACCENT_COLORS.map(c => (
                    <button
                      key={c.hex}
                      title={c.name}
                      onClick={() => {
                        setStyling(prev => ({ ...prev, primaryColor: c.hex }));
                        setHasUnsavedChanges(true);
                      }}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        styling.primaryColor === c.hex ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Font:</span>
                <div className="bg-slate-800 rounded-lg p-0.5 flex border border-slate-700">
                  {['small', 'medium', 'large'].map(f => (
                    <button
                      key={f}
                      onClick={() => {
                        setStyling(prev => ({ ...prev, fontSize: f }));
                        setHasUnsavedChanges(true);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] capitalize font-medium ${
                        styling.fontSize === f ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacing */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold">Spacing:</span>
                <div className="bg-slate-800 rounded-lg p-0.5 flex border border-slate-700">
                  {['compact', 'normal', 'spacious'].map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        setStyling(prev => ({ ...prev, spacing: s }));
                        setHasUnsavedChanges(true);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] capitalize font-medium ${
                        styling.spacing === s ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Paper */}
          <div className="overflow-y-auto max-h-[850px] rounded-2xl border border-slate-800/80 bg-slate-950 p-2 shadow-2xl scrollbar-thin">
            <ResumePreview
              ref={previewRef}
              data={resumeData}
              template={selectedTemplate}
              styling={styling}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
