import React, { forwardRef } from 'react';
import { 
  Mail, Phone, MapPin, Globe, Linkedin, Github, 
  CheckCircle2, Sparkles, Award, GraduationCap, Briefcase, Code, Star
} from 'lucide-react';

export const ResumePreview = forwardRef(({
  data = {},
  template = 'modern',
  styling = { primaryColor: '#2563eb', fontSize: 'medium', spacing: 'normal' },
  className = ''
}, ref) => {
  const contact = data.contact || {};
  const summary = data.summary || '';
  const skills = data.skills || [];
  const experience = data.experience || [];
  const education = data.education || [];
  const projects = data.projects || [];
  const certifications = data.certifications || [];
  const achievements = data.achievements || [];
  const languages = data.languages || [];

  const primaryColor = styling.primaryColor || '#2563eb';

  const fontSizes = {
    small: { base: 'text-xs', heading: 'text-sm', title: 'text-lg', name: 'text-xl' },
    medium: { base: 'text-sm', heading: 'text-base', title: 'text-xl', name: 'text-2xl' },
    large: { base: 'text-base', heading: 'text-lg', title: 'text-2xl', name: 'text-3xl' }
  };
  const currentFont = fontSizes[styling.fontSize] || fontSizes.medium;

  const spacings = {
    compact: 'space-y-3.5',
    normal: 'space-y-5',
    spacious: 'space-y-7'
  };
  const currentSpacing = spacings[styling.spacing] || spacings.normal;

  // Render ATS Template (Clean, machine readable single column)
  if (template === 'ats') {
    return (
      <div 
        ref={ref}
        id="resume-printable-area"
        className={`bg-white text-slate-900 font-sans p-8 md:p-10 shadow-2xl rounded-xl max-w-[820px] mx-auto border border-slate-200 transition-all ${className}`}
      >
        <div className="mb-4 pb-2 border-b-2 border-slate-800 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase">{contact.name || 'Your Full Name'}</h1>
          {contact.title && <p className="text-sm font-semibold text-slate-700 mt-0.5">{contact.title}</p>}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-2">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <span>• {contact.phone}</span>}
            {contact.location && <span>• {contact.location}</span>}
            {contact.linkedin && <span>• {contact.linkedin}</span>}
            {contact.github && <span>• {contact.github}</span>}
          </div>
        </div>

        <div className={currentSpacing}>
          {summary && (
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 mb-2">PROFESSIONAL SUMMARY</h2>
              <p className="text-xs text-slate-700 leading-relaxed">{summary}</p>
            </div>
          )}

          {skills.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 mb-2">TECHNICAL & CORE SKILLS</h2>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {skills.join(' • ')}
              </p>
            </div>
          )}

          {experience.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 mb-2.5">PROFESSIONAL EXPERIENCE</h2>
              <div className="space-y-3">
                {experience.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-900">{exp.title}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{exp.start_date} – {exp.currently_working ? 'Present' : (exp.end_date || 'Present')}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-xs text-slate-700 italic mb-1">
                      <span>{exp.company}</span>
                      {exp.location && <span>{exp.location}</span>}
                    </div>
                    {exp.description && exp.description.length > 0 && (
                      <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-slate-700">
                        {exp.description.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 mb-2.5">KEY PROJECTS</h2>
              <div className="space-y-2.5">
                {projects.map((proj, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-900">{proj.name}</span>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <span className="text-[11px] text-slate-600 font-mono">[{proj.technologies.join(', ')}]</span>
                      )}
                    </div>
                    {proj.description && proj.description.length > 0 && (
                      <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-slate-700 mt-1">
                        {proj.description.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 mb-2">EDUCATION</h2>
              <div className="space-y-2">
                {education.map((edu, idx) => (
                  <div key={idx} className="flex justify-between items-baseline text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</span>
                      <span className="text-slate-700">, {edu.institution}</span>
                      {edu.gpa && <span className="text-slate-600"> (GPA: {edu.gpa})</span>}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">{edu.graduation_year || edu.end_date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1 mb-1.5">CERTIFICATIONS</h2>
              <ul className="list-disc list-outside ml-4 text-xs text-slate-700 space-y-0.5">
                {certifications.map((cert, idx) => (
                  <li key={idx}>
                    {typeof cert === 'object' ? `${cert.name}${cert.organization ? ` – ${cert.organization}` : ''}` : cert}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Classic Template (Serif, Elegant academic)
  if (template === 'classic') {
    return (
      <div 
        ref={ref}
        id="resume-printable-area"
        className={`bg-white text-slate-900 font-serif p-8 md:p-10 shadow-2xl rounded-xl max-w-[820px] mx-auto border border-slate-200 transition-all ${className}`}
      >
        <div className="text-center pb-4 mb-4 border-b-2 border-slate-900">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">{contact.name || 'Your Full Name'}</h1>
          {contact.title && <p className="text-sm font-sans tracking-wide text-slate-600 uppercase mt-1">{contact.title}</p>}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-sans text-xs text-slate-600 mt-2">
            {contact.email && <span>{contact.email}</span>}
            {contact.phone && <span>{contact.phone}</span>}
            {contact.location && <span>{contact.location}</span>}
            {contact.linkedin && <span>{contact.linkedin}</span>}
          </div>
        </div>

        <div className={currentSpacing}>
          {summary && (
            <div>
              <h2 className="text-sm font-sans font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-2">Summary</h2>
              <p className="text-xs leading-relaxed text-slate-800 text-justify">{summary}</p>
            </div>
          )}

          {skills.length > 0 && (
            <div>
              <h2 className="text-sm font-sans font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-2">Areas of Expertise</h2>
              <p className="text-xs font-sans text-slate-800 leading-relaxed">
                {skills.join(' • ')}
              </p>
            </div>
          )}

          {experience.length > 0 && (
            <div>
              <h2 className="text-sm font-sans font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-3">Professional Experience</h2>
              <div className="space-y-3.5">
                {experience.map((exp, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-baseline font-sans">
                      <span className="font-bold text-xs text-slate-950">{exp.title}</span>
                      <span className="text-[11px] text-slate-600 italic">{exp.start_date} – {exp.currently_working ? 'Present' : (exp.end_date || 'Present')}</span>
                    </div>
                    <div className="text-xs font-serif text-slate-700 italic mb-1.5">{exp.company}{exp.location ? `, ${exp.location}` : ''}</div>
                    {exp.description && (
                      <ul className="list-disc list-outside ml-4 space-y-1 text-xs text-slate-800">
                        {exp.description.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div>
              <h2 className="text-sm font-sans font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-2.5">Key Projects</h2>
              <div className="space-y-2.5">
                {projects.map((proj, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between font-sans text-xs">
                      <span className="font-bold text-slate-900">{proj.name}</span>
                      {proj.technologies && <span className="text-slate-600 italic">({proj.technologies.join(', ')})</span>}
                    </div>
                    {proj.description && (
                      <ul className="list-disc list-outside ml-4 space-y-0.5 text-xs text-slate-800 mt-1">
                        {proj.description.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div>
              <h2 className="text-sm font-sans font-bold uppercase tracking-widest text-slate-900 border-b border-slate-400 pb-0.5 mb-2">Education</h2>
              <div className="space-y-1.5">
                {education.map((edu, idx) => (
                  <div key={idx} className="flex justify-between items-baseline font-sans text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{edu.degree}</span>
                      <span className="text-slate-700">, {edu.institution}</span>
                    </div>
                    <span className="text-[11px] text-slate-600">{edu.graduation_year || edu.end_date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Modern / Professional Template (Default, Clean, High Impact)
  return (
    <div 
      ref={ref}
      id="resume-printable-area"
      className={`bg-white text-slate-900 font-sans p-8 md:p-10 shadow-2xl rounded-xl max-w-[820px] mx-auto border border-slate-200 transition-all ${className}`}
    >
      {/* Modern Header Bar */}
      <div className="border-b pb-5 mb-5" style={{ borderColor: `${primaryColor}30` }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-950">
              {contact.name || 'Your Full Name'}
            </h1>
            <p className="text-sm font-bold tracking-wide mt-1" style={{ color: primaryColor }}>
              {contact.title || 'Professional Title'}
            </p>
          </div>
          <div className="flex flex-col text-xs text-slate-600 space-y-1 md:text-right">
            {contact.email && <div className="flex items-center md:justify-end gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {contact.email}</div>}
            {contact.phone && <div className="flex items-center md:justify-end gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {contact.phone}</div>}
            {contact.location && <div className="flex items-center md:justify-end gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {contact.location}</div>}
            {contact.linkedin && <div className="flex items-center md:justify-end gap-1.5"><Linkedin className="w-3.5 h-3.5 text-slate-400" /> {contact.linkedin.replace('https://', '')}</div>}
          </div>
        </div>
      </div>

      <div className={currentSpacing}>
        {/* Summary */}
        {summary && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 flex items-center gap-1.5" style={{ color: primaryColor, borderBottom: `2px solid ${primaryColor}25` }}>
              <Sparkles className="w-3.5 h-3.5" /> Professional Summary
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2.5 flex items-center gap-1.5" style={{ color: primaryColor, borderBottom: `2px solid ${primaryColor}25` }}>
              <Code className="w-3.5 h-3.5" /> Skills & Competencies
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, idx) => (
                <span 
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold border"
                  style={{ 
                    backgroundColor: `${primaryColor}08`, 
                    borderColor: `${primaryColor}25`,
                    color: '#1e293b'
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-3 flex items-center gap-1.5" style={{ color: primaryColor, borderBottom: `2px solid ${primaryColor}25` }}>
              <Briefcase className="w-3.5 h-3.5" /> Work Experience
            </h2>
            <div className="space-y-3.5">
              {experience.map((exp, idx) => (
                <div key={idx} className="relative pl-3.5 border-l-2" style={{ borderColor: `${primaryColor}40` }}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <h3 className="text-xs font-bold text-slate-900">{exp.title}</h3>
                    <span className="text-[11px] font-medium text-slate-500 font-mono">
                      {exp.start_date} – {exp.currently_working ? 'Present' : (exp.end_date || 'Present')}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 mb-1.5">
                    {exp.company} {exp.location ? `• ${exp.location}` : ''}
                  </div>
                  {exp.description && exp.description.length > 0 && (
                    <ul className="list-disc list-outside ml-3.5 space-y-1 text-xs text-slate-600">
                      {exp.description.map((b, bIdx) => (
                        <li key={bIdx} className="leading-normal">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-3 flex items-center gap-1.5" style={{ color: primaryColor, borderBottom: `2px solid ${primaryColor}25` }}>
              <Star className="w-3.5 h-3.5" /> Key Projects
            </h2>
            <div className="space-y-3">
              {projects.map((proj, idx) => (
                <div key={idx} className="bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-xs font-bold text-slate-900">{proj.name}</h3>
                    {proj.github_url && (
                      <span className="text-[10px] text-blue-600 hover:underline">{proj.github_url.replace('https://', '')}</span>
                    )}
                  </div>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="text-[11px] font-mono text-slate-500 mb-1.5">
                      Tech: {proj.technologies.join(', ')}
                    </div>
                  )}
                  {proj.description && proj.description.length > 0 && (
                    <ul className="list-disc list-outside ml-3.5 space-y-0.5 text-xs text-slate-600">
                      {proj.description.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2.5 flex items-center gap-1.5" style={{ color: primaryColor, borderBottom: `2px solid ${primaryColor}25` }}>
              <GraduationCap className="w-3.5 h-3.5" /> Education
            </h2>
            <div className="space-y-2">
              {education.map((edu, idx) => (
                <div key={idx} className="flex justify-between items-baseline text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</span>
                    <span className="text-slate-600"> — {edu.institution}</span>
                    {edu.gpa && <span className="text-slate-500 font-mono"> (GPA: {edu.gpa})</span>}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">{edu.graduation_year || edu.end_date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications & Achievements */}
        {(certifications.length > 0 || achievements.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certifications.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 flex items-center gap-1.5" style={{ color: primaryColor, borderBottom: `2px solid ${primaryColor}25` }}>
                  <Award className="w-3.5 h-3.5" /> Certifications
                </h2>
                <ul className="list-disc list-outside ml-3.5 text-xs text-slate-600 space-y-1">
                  {certifications.map((cert, idx) => (
                    <li key={idx}>
                      {typeof cert === 'object' ? `${cert.name}${cert.organization ? ` (${cert.organization})` : ''}` : cert}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {achievements.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 flex items-center gap-1.5" style={{ color: primaryColor, borderBottom: `2px solid ${primaryColor}25` }}>
                  <Award className="w-3.5 h-3.5" /> Achievements
                </h2>
                <ul className="list-disc list-outside ml-3.5 text-xs text-slate-600 space-y-1">
                  {achievements.map((ach, idx) => (
                    <li key={idx}>
                      {typeof ach === 'object' ? `${ach.title}${ach.description ? `: ${ach.description}` : ''}` : ach}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
