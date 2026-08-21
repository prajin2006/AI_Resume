import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CopilotProvider } from './context/CopilotContext';
import { Navbar } from './components/Navbar';
import { CopilotDrawer } from './components/CopilotDrawer';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResumeUploadPage } from './pages/ResumeUploadPage';
import { ResumeDetailsPage } from './pages/ResumeDetailsPage';
import MyResumesPage from './pages/MyResumesPage';
import ResumeBuilderPage from './pages/ResumeBuilderPage';
import ResumePreviewPage from './pages/ResumePreviewPage';
import { JobDescriptionPage } from './pages/JobDescriptionPage';
import { ResumeAnalysisPage } from './pages/ResumeAnalysisPage';
import { ResumeComparisonPage } from './pages/ResumeComparisonPage';
import { AnalysisHistoryPage } from './pages/AnalysisHistoryPage';
import { AICopilotPage } from './pages/AICopilotPage';
import { ProfilePage } from './pages/ProfilePage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading NextHire...</div>;
  }
  return user ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <CopilotProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-[#080C14] text-slate-100 selection:bg-brand-500 selection:text-black">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/upload" element={<ProtectedRoute><ResumeUploadPage /></ProtectedRoute>} />
                <Route path="/resumes" element={<ProtectedRoute><MyResumesPage /></ProtectedRoute>} />
                <Route path="/resumes/create" element={<ProtectedRoute><ResumeBuilderPage /></ProtectedRoute>} />
                <Route path="/resumes/:id/edit" element={<ProtectedRoute><ResumeBuilderPage /></ProtectedRoute>} />
                <Route path="/resumes/:id/preview" element={<ProtectedRoute><ResumePreviewPage /></ProtectedRoute>} />
                <Route path="/resumes/:id" element={<ProtectedRoute><ResumeDetailsPage /></ProtectedRoute>} />
                <Route path="/jobs" element={<ProtectedRoute><JobDescriptionPage /></ProtectedRoute>} />
                <Route path="/analysis/:id" element={<ProtectedRoute><ResumeAnalysisPage /></ProtectedRoute>} />
                <Route path="/compare" element={<ProtectedRoute><ResumeComparisonPage /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><AnalysisHistoryPage /></ProtectedRoute>} />
                <Route path="/copilot" element={<ProtectedRoute><AICopilotPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <CopilotDrawer />
          </div>
        </Router>
      </CopilotProvider>
    </AuthProvider>
  );
}
