import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

export const EvidenceCard = ({ risk }) => {
  const level = risk?.risk_level || 'Medium Risk';

  let badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  let icon = <AlertTriangle className="w-5 h-5 text-amber-400" />;
  let borderHighlight = 'border-l-amber-500';

  if (level.includes('High')) {
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    icon = <ShieldAlert className="w-5 h-5 text-rose-400" />;
    borderHighlight = 'border-l-rose-500';
  } else if (level.includes('Low')) {
    badgeColor = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    icon = <Info className="w-5 h-5 text-sky-400" />;
    borderHighlight = 'border-l-sky-500';
  }

  return (
    <div className={`glass-card rounded-xl p-5 border-l-4 ${borderHighlight} space-y-3.5 transition-all duration-200 hover:border-slate-700`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5">{icon}</div>
          <h4 className="text-base font-semibold text-slate-100 leading-snug">{risk.risk_title}</h4>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border shrink-0 ${badgeColor}`}>
          {level}
        </span>
      </div>

      {/* Affected Requirement */}
      {risk.affected_requirement && (
        <div className="text-xs font-medium text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-md flex items-center gap-2 border border-slate-800">
          <span className="text-slate-500 uppercase font-semibold">Target Requirement:</span>
          <span className="text-slate-200">{risk.affected_requirement}</span>
        </div>
      )}

      {/* Evidence from Resume */}
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <span>🔍 Evidence from Resume</span>
        </div>
        <p className="text-sm text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 italic">
          "{risk.evidence}"
        </p>
      </div>

      {/* Suggested Improvement */}
      <div className="space-y-1 pt-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Recommended Action</span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">
          {risk.recommendation}
        </p>
      </div>
    </div>
  );
};
