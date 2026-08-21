import React, { useState, useEffect, useRef } from 'react';
import {
  Bot, Send, Sparkles, Trash2, Plus, MessageSquare, Briefcase, FileText,
  CheckCircle2, CornerDownLeft, ShieldAlert, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ACTION_TEMPLATES = [
  "Why is my ATS match score low?",
  "Which skill should I learn first?",
  "Ask me interview questions about my flagship project",
  "Explain my top recruiter concerns with evidence",
  "Generate a 5-day interview preparation study plan",
  "How can I rewrite my summary to target this role?"
];

export const AICopilotPage = () => {
  const { user } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Context Selectors
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [analyses, setAnalyses] = useState([]);

  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadSessions();
    loadContexts();
  }, []);

  const loadSessions = async () => {
    try {
      const sess = await api.getCopilotSessions();
      setSessions(sess);
      if (sess.length > 0) {
        selectSession(sess[0].id);
      } else {
        handleNewSession();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadContexts = async () => {
    try {
      const [rList, jList, aList] = await Promise.all([
        api.getResumes(),
        api.getJobs(),
        api.getAnalyses()
      ]);
      setResumes(rList);
      setJobs(jList);
      setAnalyses(aList);
      if (rList.length > 0) setSelectedResumeId(rList[0].id.toString());
      if (jList.length > 0) setSelectedJobId(jList[0].id.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const selectSession = async (sessId) => {
    setActiveSessionId(sessId);
    setLoading(true);
    try {
      const history = await api.getCopilotHistory(sessId);
      setMessages(history.messages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = async () => {
    try {
      const newSess = await api.createCopilotSession({
        resume_id: selectedResumeId ? parseInt(selectedResumeId) : null,
        job_id: selectedJobId ? parseInt(selectedJobId) : null,
        title: 'New Career Copilot Chat'
      });
      setSessions([newSess, ...sessions]);
      setActiveSessionId(newSess.id);
      setMessages(newSess.messages || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSession = async (sessId, e) => {
    e.stopPropagation();
    try {
      await api.deleteCopilotSession(sessId);
      const remaining = sessions.filter((s) => s.id !== sessId);
      setSessions(remaining);
      if (remaining.length > 0) {
        selectSession(remaining[0].id);
      } else {
        handleNewSession();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      message: userText,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await api.sendCopilotMessage({
        session_id: activeSessionId,
        resume_id: selectedResumeId ? parseInt(selectedResumeId) : null,
        job_id: selectedJobId ? parseInt(selectedJobId) : null,
        message: userText
      });

      setMessages((prev) => [...prev, res]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          message: '⚠️ Connection issue. Please check your prompt and try again.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-5rem)] flex flex-col space-y-4">
      {/* Context Selector Bar */}
      <div className="glass-card p-3 sm:p-4 rounded-2xl border border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <span className="font-bold text-white">NextHire AI Copilot</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">REAL-TIME CONTEXT</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
          >
            <option value="">No Resume Context</option>
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>Resume: {r.filename}</option>
            ))}
          </select>

          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none"
          >
            <option value="">No Job Context</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>Job: {j.title} @ {j.company}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-hidden">
        {/* Sidebar: Chat Sessions */}
        <div className="hidden md:flex md:col-span-1 glass-card p-4 rounded-2xl border border-slate-800 flex-col justify-between overflow-hidden">
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversations</span>
              <button
                onClick={handleNewSession}
                className="p-1 text-indigo-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="New Session"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => selectSession(s.id)}
                  className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    activeSessionId === s.id
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                      : 'text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{s.title || 'Chat Session'}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(s.id, e)}
                    className="opacity-60 hover:opacity-100 text-slate-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Stream & Composer */}
        <div className="md:col-span-3 glass-card rounded-2xl border border-slate-800 flex flex-col overflow-hidden">
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id || idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 text-sm ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-br-none shadow-md'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                      {m.message}
                    </div>

                    <div className={`text-[10px] mt-2 ${isUser ? 'text-indigo-200 text-right' : 'text-slate-500 text-left'}`}>
                      {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                  <span className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  </span>
                  <span>NextHire Copilot is analyzing your resume & job...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Action Chips */}
          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              {ACTION_TEMPLATES.map((tmpl, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(tmpl);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 shrink-0 transition-colors text-[11px]"
                >
                  {tmpl}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your score, interview preparation, or rejection risks..."
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
