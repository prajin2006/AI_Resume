import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Trash2, Maximize2, Minimize2, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useCopilot } from '../context/CopilotContext';
import { Link } from 'react-router-dom';

const QUICK_ACTIONS = [
  "Why is my match score low?",
  "Which skill should I learn first?",
  "Explain my top rejection risks",
  "Ask me interview questions about my project",
  "How can I improve my resume summary?"
];

export const CopilotDrawer = () => {
  const {
    isOpen,
    isDocked,
    closeCopilot,
    toggleDock,
    messages,
    loading,
    sendMessage,
    clearMessages,
    contextData
  } = useCopilot();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput('');
  };

  const handleChipClick = (chipText) => {
    sendMessage(chipText);
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-300 flex flex-col bg-[#0D1322] border border-indigo-500/30 shadow-2xl ${
        isDocked
          ? 'bottom-0 right-0 w-full sm:w-[480px] h-[85vh] rounded-t-2xl sm:rounded-tl-2xl'
          : 'bottom-6 right-6 w-[92vw] sm:w-[460px] h-[650px] max-h-[90vh] rounded-2xl'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 text-slate-950 font-bold shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">NextHire AI Copilot</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Context-Aware Career & Recruiter Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            title="Start new conversation"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={toggleDock}
            title={isDocked ? "Floating Window" : "Dock Window"}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors hidden sm:block"
          >
            {isDocked ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={closeCopilot}
            title="Close Assistant"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Context Badge Banner */}
      {(contextData.jobTitle || contextData.resumeName) && (
        <div className="px-4 py-1.5 bg-indigo-950/40 border-b border-indigo-900/30 flex items-center justify-between text-[11px] text-indigo-300">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-indigo-400">Context:</span>
            <span className="truncate">{contextData.jobTitle || 'Active Job'} • {contextData.resumeName || 'Active Resume'}</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">LIVE</span>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id || idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-br-none shadow-md shadow-indigo-500/10'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                  {m.message}
                </div>

                {/* Rich Action Payload Display */}
                {m.action_payload && m.action_payload.missing_skills && (
                  <div className="mt-3 pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
                    {m.action_payload.missing_skills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <div className={`text-[10px] mt-1.5 ${isUser ? 'text-indigo-200 text-right' : 'text-slate-500 text-left'}`}>
                  {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
              <span className="flex space-x-1">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
              </span>
              <span className="text-xs">NextHire AI is analyzing context...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {QUICK_ACTIONS.map((action, i) => (
            <button
              key={i}
              onClick={() => handleChipClick(action)}
              className="px-2.5 py-1 rounded-full bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 shrink-0 transition-all text-[11px]"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your resume, rejection risks, or interview prep..."
          className="flex-1 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
