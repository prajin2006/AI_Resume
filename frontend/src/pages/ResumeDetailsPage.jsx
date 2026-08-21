import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText, User, Mail, Phone, MapPin, Linkedin, Github, Globe,
  Briefcase, GraduationCap, Code2, Award, ArrowLeft, ArrowRight, Trash2, Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { useCopilot } from '../context/CopilotContext';

export const ResumeDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openCopilot } = useCopilot();

  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('structured'); // structured, raw

  useEffect(() => {
    const load = async () => {
      try {
        if (id) {
          const res = await api.getResume(id);
          setSelectedResume(res);
        } else {
          const list = await api.getResumes();
          setResumes(list);
          if (list.length > 0) {
            const first = await api.getResume(list[0].id);
            setSelectedResume(first);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async (resId) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.deleteResume(resId);
      navigate('/dashboard');
    } catch (e) {
      alert('Failed to delete resume');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">
        Loading resume details...
      </div>
    );
  }

  if (!selectedResume) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h3 className="text-xl font-bold text-white">No Resumes Found</h3>
        <p className="text-sm text-slate-400">Upload your first resume to start analyzing match scores.</p>
        <Link to="/upload" className="inline-block px-5 py-2.5 rounded-xl bg-brand-500 text-slate-950 font-bold text-xs">
          Upload Resume
        </Link>
      </div>
    );
  }

  const p = selectedResume.parsed_data || {};
  const contact = p.contact || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">{selectedResume.filename}</h1>
            <p className="text-xs text-slate-400">Uploaded {new Date(selectedResume.created_at).toLocaleDateString()} • {selectedResume.file_type.toUpperCase()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openCopilot({ resumeId: selectedResume.id, resumeName: selectedResume.filename })}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chat About Resume</span>
          </button>
          <Link
            to={`/jobs?resumeId=${selectedResume.id}`}
            className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
          >
            <span>Match with Job</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => handleDelete(selectedResume.id)}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-xl bg-slate-900 border border-slate-800"
            title="Delete resume"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('structured')}
          className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'structured' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Structured Extraction
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'raw' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Raw Text Document
        </button>
      </div>

      {activeTab === 'structured' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Contact & Skills */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400">
                <User className="w-4 h-4" />
                <span>Candidate Profile</span>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <p className="text-base font-bold text-white">{contact.name || 'Name not specified'}</p>
                {contact.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-500" /><span>{contact.email}</span></div>}
                {contact.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-500" /><span>{contact.phone}</span></div>}
                {contact.location && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-500" /><span>{contact.location}</span></div>}
                {contact.linkedin && <div className="flex items-center gap-2"><Linkedin className="w-3.5 h-3.5 text-slate-500" /><a href={contact.linkedin} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline truncate">{contact.linkedin}</a></div>}
                {contact.github && <div className="flex items-center gap-2"><Github className="w-3.5 h-3.5 text-slate-500" /><a href={contact.github} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline truncate">{contact.github}</a></div>}
              </div>
            </div>

            {/* Skills Taxonomy */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <Code2 className="w-4 h-4" />
                <span>Extracted Skills ({p.skills?.length || 0})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.skills && p.skills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 border border-slate-800 text-slate-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Summary, Experience, Projects, Education */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            {p.summary && (
              <div className="glass-card p-6 rounded-2xl space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Professional Summary</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{p.summary}</p>
              </div>
            )}

            {/* Experience */}
            {p.experience && p.experience.length > 0 && (
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <Briefcase className="w-4 h-4" />
                  <span>Work Experience</span>
                </div>
                <div className="space-y-4">
                  {p.experience.map((exp, idx) => (
                    <div key={idx} className="border-l-2 border-slate-800 pl-4 space-y-1">
                      <h4 className="text-sm font-bold text-white">{exp.title}</h4>
                      <p className="text-xs text-slate-400">{exp.company} {exp.start_date && `• ${exp.start_date} - ${exp.end_date || 'Present'}`}</p>
                      {exp.description && exp.description.map((desc, dIdx) => (
                        <p key={dIdx} className="text-xs text-slate-300">• {desc}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {p.projects && p.projects.length > 0 && (
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                  <Code2 className="w-4 h-4" />
                  <span>Key Projects</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {p.projects.map((proj, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {proj.technologies.map((t, ti) => (
                            <span key={ti} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">{t}</span>
                          ))}
                        </div>
                      )}
                      {proj.description && proj.description.map((d, di) => (
                        <p key={di} className="text-xs text-slate-400">{d}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {p.education && p.education.length > 0 && (
              <div className="glass-card p-6 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <GraduationCap className="w-4 h-4" />
                  <span>Education</span>
                </div>
                {p.education.map((edu, idx) => (
                  <div key={idx} className="text-xs space-y-0.5">
                    <div className="font-bold text-slate-200">{edu.degree} {edu.field && `in ${edu.field}`}</div>
                    <div className="text-slate-400">{edu.institution} {edu.graduation_year && `(${edu.graduation_year})`}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 rounded-2xl">
          <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
            {selectedResume.raw_text}
          </pre>
        </div>
      )}
    </div>
  );
};
