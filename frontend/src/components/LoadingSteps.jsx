import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

const ANALYSIS_STEPS = [
  "Uploading & verifying document integrity...",
  "Extracting raw text & segmenting resume sections...",
  "Parsing technical & soft skills taxonomy...",
  "Analyzing job requirements & normalizing skills...",
  "Comparing candidate experience against requirements...",
  "Simulating AI Recruiter screening evaluation...",
  "Predicting potential rejection risks & extracting evidence...",
  "Generating personalized interview questions & prep gaps...",
  "Finalizing analysis cockpit..."
];

export const LoadingSteps = ({ currentStep = 0, title = "Analyzing Resume Against Job Description" }) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 700);

    return () => clearInterval(interval);
  }, []);

  const progressPercent = Math.min(100, Math.round(((activeStep + 1) / ANALYSIS_STEPS.length) * 100));

  return (
    <div className="glass-card max-w-xl w-full mx-auto p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2 animate-bounce">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h3 className="text-xl font-bold text-slate-100">{title}</h3>
        <p className="text-sm text-slate-400">Executing deterministic extraction and AI recruiter models...</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-400">
          <span>Processing Pipeline</span>
          <span className="text-brand-400">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step items */}
      <div className="space-y-2.5 pt-2">
        {ANALYSIS_STEPS.map((step, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;
          const isPending = idx > activeStep;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 text-xs md:text-sm transition-all duration-300 ${
                isCurrent
                  ? 'text-slate-100 font-semibold bg-slate-850/80 px-3 py-2 rounded-lg border border-indigo-500/30'
                  : isDone
                  ? 'text-slate-400 px-3 py-1'
                  : 'text-slate-600 px-3 py-1 opacity-50'
              }`}
            >
              {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {isCurrent && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />}
              {isPending && <Circle className="w-4 h-4 text-slate-700 shrink-0" />}
              <span>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
