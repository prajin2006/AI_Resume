import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const CopilotContext = createContext(null);

export const CopilotProvider = ({ children }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Active contextual binding
  const [contextData, setContextData] = useState({
    resumeId: null,
    jobId: null,
    analysisId: null,
    jobTitle: null,
    resumeName: null
  });

  const setContext = useCallback((newContext) => {
    setContextData((prev) => ({ ...prev, ...newContext }));
  }, []);

  const openCopilot = useCallback((customContext = null) => {
    if (customContext) {
      setContext(customContext);
    }
    setIsOpen(true);
  }, [setContext]);

  const closeCopilot = () => setIsOpen(false);
  const toggleCopilot = () => setIsOpen((prev) => !prev);
  const toggleDock = () => setIsDocked((prev) => !prev);

  // Initialize or fetch default session messages
  useEffect(() => {
    if (user && isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'initial_msg',
          role: 'assistant',
          message: `👋 Hello ${user.name}! I am your **NextHire AI Copilot**.\n\nI have real-time visibility into your resume, job descriptions, ATS compatibility, and recruiter concerns.\n\nHow can I help you level up your candidacy today?`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [user, isOpen, messages.length]);

  const sendMessage = async (userText) => {
    if (!userText.trim() || loading) return;

    const tempUserMsg = {
      id: `temp_${Date.now()}`,
      role: 'user',
      message: userText.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const payload = {
        session_id: activeSessionId,
        resume_id: contextData.resumeId,
        job_id: contextData.jobId,
        analysis_id: contextData.analysisId,
        message: userText.trim()
      };

      const response = await api.sendCopilotMessage(payload);
      if (response.session_id && !activeSessionId) {
        setActiveSessionId(response.session_id);
      }

      setMessages((prev) => [...prev, response]);
    } catch (err) {
      console.error('Copilot message failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          message: '⚠️ Sorry, I encountered a temporary connection issue. Please check your prompt or try again.',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setActiveSessionId(null);
    setMessages([
      {
        id: `fresh_${Date.now()}`,
        role: 'assistant',
        message: 'New session started! What topic, interview question, or resume section would you like to explore?',
        timestamp: new Date().toISOString()
      }
    ]);
  };

  return (
    <CopilotContext.Provider
      value={{
        isOpen,
        isDocked,
        openCopilot,
        closeCopilot,
        toggleCopilot,
        toggleDock,
        contextData,
        setContext,
        messages,
        loading,
        sendMessage,
        clearMessages
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
};

export const useCopilot = () => useContext(CopilotContext);
