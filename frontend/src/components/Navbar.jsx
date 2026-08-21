import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles, Bot, FileText, Briefcase, LayoutDashboard, History,
  GitCompare, User, LogOut, UploadCloud, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCopilot } from '../context/CopilotContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { openCopilot } = useCopilot();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 via-indigo-500 to-sky-400 p-[1.5px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#090D16] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-400" />
            </div>
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white">Next<span className="text-brand-400">Hire</span></span>
            <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">AI SaaS</span>
          </div>
        </Link>

        {/* Desktop Nav Links (If Authenticated) */}
        {user ? (
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800"
            >
              Dashboard
            </Link>
            <Link
              to="/resumes"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800"
            >
              My Resumes
            </Link>
            <Link
              to="/resumes/create"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-amber-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              AI Resume Builder
            </Link>
            <Link
              to="/jobs"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/jobs') ? 'text-white bg-slate-800/80' : 'text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              Jobs
            </Link>
            <Link
              to="/history"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/history') ? 'text-white bg-slate-800/80' : 'text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              History
            </Link>
            <Link
              to="/compare"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/compare') ? 'text-white bg-slate-800/80' : 'text-slate-300 hover:text-white hover:bg-slate-850'
              }`}
            >
              Compare
            </Link>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="/#features" className="hover:text-white transition-colors">Features</a>
            <a href="/#recruiter" className="hover:text-white transition-colors">AI Recruiter</a>
            <a href="/#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Quick AI Copilot Trigger */}
              <button
                onClick={() => openCopilot()}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-600/25 transition-all"
              >
                <Bot className="w-4 h-4 text-brand-300" />
                <span>AI Copilot</span>
              </button>

              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-400 text-slate-950 shadow-md shadow-brand-500/20 transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span className="hidden sm:inline">Upload Resume</span>
              </Link>

              {/* Profile / Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <Link
                  to="/profile"
                  title="Profile & Settings"
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 hover:border-indigo-500 flex items-center justify-center text-xs font-bold text-slate-200 transition-colors"
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Link>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 shadow-md shadow-brand-500/25 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white md:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-card border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-200">Dashboard</Link>
              <Link to="/upload" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-200">Upload Resume</Link>
              <Link to="/resumes" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-200">My Resumes</Link>
              <Link to="/jobs" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-200">Job Descriptions</Link>
              <Link to="/history" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-200">Analysis History</Link>
              <Link to="/compare" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-200">Compare Resumes</Link>
              <Link to="/copilot" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-indigo-400 font-semibold">AI Copilot Fullscreen</Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-200">Profile & Settings</Link>
              <button onClick={handleLogout} className="block w-full text-left py-2 text-sm text-rose-400">Log Out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-200">Log In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-brand-400 font-semibold">Sign Up Free</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};
