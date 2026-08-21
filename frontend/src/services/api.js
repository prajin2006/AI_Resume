const API_BASE_URL = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('nexthire_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse(response) {
  if (response.status === 401) {
    localStorage.removeItem('nexthire_token');
    localStorage.removeItem('nexthire_user');
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
      window.location.href = '/login';
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.detail || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  // Auth
  async register(name, email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    return handleResponse(res);
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(res);
  },

  // Resumes
  async uploadResume(file) {
    const token = localStorage.getItem('nexthire_token');
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/resumes/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    return handleResponse(res);
  },

  async createResume(resumeData) {
    const res = await fetch(`${API_BASE_URL}/resumes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(resumeData)
    });
    return handleResponse(res);
  },

  async createSampleResume() {
    const res = await fetch(`${API_BASE_URL}/resumes/sample`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getResumes() {
    const res = await fetch(`${API_BASE_URL}/resumes`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getResume(id) {
    const res = await fetch(`${API_BASE_URL}/resumes/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async updateResume(id, resumeData) {
    const res = await fetch(`${API_BASE_URL}/resumes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(resumeData)
    });
    return handleResponse(res);
  },

  async duplicateResume(id) {
    const res = await fetch(`${API_BASE_URL}/resumes/${id}/duplicate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async deleteResume(id) {
    const res = await fetch(`${API_BASE_URL}/resumes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async aiAssist(action, text = '', context = {}) {
    const res = await fetch(`${API_BASE_URL}/resumes/ai/assist`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action, text, context })
    });
    return handleResponse(res);
  },

  // Jobs
  async createJob(jobData) {
    const res = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(jobData)
    });
    return handleResponse(res);
  },

  async createSampleJob() {
    const res = await fetch(`${API_BASE_URL}/jobs/sample`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getJobs() {
    const res = await fetch(`${API_BASE_URL}/jobs`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getJob(id) {
    const res = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async deleteJob(id) {
    const res = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Analysis
  async runAnalysis(resumeId, jobId) {
    const res = await fetch(`${API_BASE_URL}/analysis/${resumeId}/${jobId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getAnalyses() {
    const res = await fetch(`${API_BASE_URL}/analysis`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getAnalysis(id) {
    const res = await fetch(`${API_BASE_URL}/analysis/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async deleteAnalysis(id) {
    const res = await fetch(`${API_BASE_URL}/analysis/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async compareAnalyses(id1, id2) {
    const res = await fetch(`${API_BASE_URL}/analysis/compare/${id1}/${id2}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Interview Questions
  async getInterviewQuestions(analysisId) {
    const res = await fetch(`${API_BASE_URL}/interview/${analysisId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async regenerateInterviewQuestions(analysisId) {
    const res = await fetch(`${API_BASE_URL}/interview/generate/${analysisId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Preparation
  async getPreparationGaps(analysisId) {
    const res = await fetch(`${API_BASE_URL}/preparation/${analysisId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async togglePrepTask(analysisId, dayNum) {
    const res = await fetch(`${API_BASE_URL}/preparation/toggle/${analysisId}/${dayNum}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Resume Improvements
  async getImprovements(analysisId) {
    const res = await fetch(`${API_BASE_URL}/improvements/${analysisId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async regenerateImprovements(analysisId) {
    const res = await fetch(`${API_BASE_URL}/improvements/generate/${analysisId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // AI Copilot
  async sendCopilotMessage(payload) {
    const res = await fetch(`${API_BASE_URL}/copilot/chat`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async getCopilotSessions() {
    const res = await fetch(`${API_BASE_URL}/copilot/sessions`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getCopilotHistory(sessionId) {
    const res = await fetch(`${API_BASE_URL}/copilot/history/${sessionId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async createCopilotSession(sessionData) {
    const res = await fetch(`${API_BASE_URL}/copilot/session`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(sessionData)
    });
    return handleResponse(res);
  },

  async deleteCopilotSession(sessionId) {
    const res = await fetch(`${API_BASE_URL}/copilot/session/${sessionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  }
};
