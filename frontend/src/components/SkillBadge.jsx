import React from 'react';
import { Check, X, HelpCircle, Plus } from 'lucide-react';

export const SkillBadge = ({ skill, type = 'matched' }) => {
  let style = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
  let icon = <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;

  if (type === 'missing') {
    style = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    icon = <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
  } else if (type === 'partial') {
    style = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    icon = <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  } else if (type === 'extra') {
    style = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
    icon = <Plus className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${style} transition-all hover:scale-[1.02]`}>
      {icon}
      <span>{skill}</span>
    </span>
  );
};
