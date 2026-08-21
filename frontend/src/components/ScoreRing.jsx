import React from 'react';

export const ScoreRing = ({ score = 0, size = 120, strokeWidth = 8, label = '', sublabel = '', color = null }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeScore = Math.min(100, Math.max(0, Number(score) || 0));
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  let strokeColor = '#22C55E'; // Emerald
  let glowClass = 'glow-emerald';

  if (color) {
    strokeColor = color;
  } else if (safeScore >= 80) {
    strokeColor = '#22C55E'; // Emerald
    glowClass = 'glow-emerald';
  } else if (safeScore >= 65) {
    strokeColor = '#F59E0B'; // Amber
    glowClass = 'glow-amber';
  } else {
    strokeColor = '#F43F5E'; // Rose
    glowClass = 'glow-rose';
  }

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black tracking-tight text-white">{Math.round(safeScore)}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">/ 100</span>
        </div>
      </div>

      {label && <p className="mt-2 text-sm font-semibold text-slate-200">{label}</p>}
      {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
    </div>
  );
};
