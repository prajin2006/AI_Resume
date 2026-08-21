# NextHire — AI Resume Analyzer & Recruiter Simulation

NextHire is a modern, production-grade, AI-powered resume analysis, recruiter simulation, rejection prediction, interview coaching, and real-time career copilot platform.

---

## 🌟 Key Features

1. **Deterministic & Semantic Resume Parsing**
   - Extracts structured contact information, skills taxonomy, work experience, projects, education, and certifications from PDF and DOCX files.
   - Dual-engine parsing: deterministic regex extraction paired with semantic LLM structuring.

2. **Job Description Extraction & Skill Normalization**
   - Automatically parses required vs. preferred competencies, experience level, responsibilities, and keywords.
   - Normalizes tech synonyms (e.g. `React.js` / `ReactJS` / `React` -> `React.js`, `PostgreSQL` / `Postgres` -> `PostgreSQL`).

3. **Multi-Dimensional Matching & Scoring Engine**
   - Computes granular scores (0-100): **Overall Composite Match**, **ATS Score**, **Recruiter Score**, **Skill Match**, **Experience Match**, **Project Match**, **Education Match**, and **Keyword Density**.

4. **AI Recruiter Screening Simulation**
   - Simulates a senior technical recruiter screening review: Verdict (*Strong Fit*, *Potential Fit with Gaps*, *High Risk*), Strengths, Concerns, and Next Steps.

5. **Explainable Rejection Prediction with Resume Evidence**
   - Discovers potential rejection vectors (*High Risk*, *Medium Risk*, *Low Risk*) and pairs every risk with verbatim quotes/evidence from the resume against target job requirements.
   - Uses probabilistic risk estimation language rather than deterministic guarantees.

6. **Tailored 7-Category Interview Coach**
   - Generates custom questions across 7 categories (*Technical, Project, Resume-based, Job-specific, Behavioral, Scenario, HR*) and 3 difficulty tiers (*Easy, Medium, Hard*) with interviewer intentions, expectations, and preparation tips.

7. **5-Day Interview Gap Roadmap**
   - Synthesizes detected knowledge gaps into a structured day-by-day learning schedule with interactive task completion tracking.

8. **Fact-Preserving Resume Bullet Improver**
   - Elevates weak project bullet points and summary text using the Google XYZ action framework without fabricating fictitious credentials or metrics.

9. **Real-Time Context-Aware AI Copilot**
   - Conversational assistant with live session state, dynamic context awareness (bound resume, job, and analysis metrics), prompt suggestion chips, and tool actions.

10. **Multi-Version Resume Comparison & History**
    - Benchmarks two resume versions side-by-side with score differentials and newly matched skills.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend**: Python FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn.
- **Database**: PostgreSQL (with automatic zero-config SQLite fallback for local development).
- **Authentication**: JWT (JSON Web Tokens), PBKDF2/SHA-256 salted password hashing.
- **AI / LLM Layer**: Provider abstraction supporting Google Gemini API, OpenAI API, Anthropic, and built-in offline NLP heuristics engine.

---

## 📁 Project Structure

```
AI_Resume/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── llm_service.py       # LLM provider abstraction & fallback
│   │   │   └── prompts.py           # Structured prompts
│   │   ├── core/
│   │   │   ├── config.py            # Settings & environment variables
│   │   │   └── security.py          # Password hashing & JWT tokens
│   │   ├── database/
│   │   │   ├── database.py          # SQLAlchemy engine & session factory
│   │   │   └── models.py            # DB schema & relational models
│   │   ├── routers/
│   │   │   ├── auth.py              # Register, Login, Me
│   │   │   ├── users.py             # Profile updates & settings
│   │   │   ├── resumes.py           # Resume upload & parsing
│   │   │   ├── jobs.py              # Job creation & templates
│   │   │   ├── analysis.py          # Full analysis & comparisons
│   │   │   ├── interviews.py        # Interview questions
│   │   │   ├── preparation.py       # 5-day roadmap
│   │   │   ├── copilot.py           # AI Copilot chat sessions
│   │   │   └── improvements.py      # Resume bullet optimizer
│   │   ├── schemas/                 # Pydantic models
│   │   ├── services/                # Domain logic & algorithms
│   │   ├── utils/                   # File validation & sanitization
│   │   └── main.py                  # FastAPI app & router registration
│   ├── tests/
│   │   ├── test_api.py              # Unit & smoke tests
│   │   └── test_full_journey.py     # 13-stage E2E integration test
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/              # ScoreRing, EvidenceCard, CopilotDrawer, Navbar...
│   │   ├── context/                 # AuthContext, CopilotContext
│   │   ├── pages/                   # Landing, Dashboard, Upload, Analysis, Copilot...
│   │   ├── services/api.js          # API client layer
│   │   ├── App.jsx                  # React Router & Protected Routes
│   │   ├── main.jsx
│   │   └── index.css                # Design tokens & glassmorphism
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── .env.example
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python run.py
```
*Backend runs on `http://127.0.0.1:8000` with Swagger docs available at `http://127.0.0.1:8000/docs`.*

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` (or `5174`).*

---

## 🔑 Environment Variables (`backend/.env`)

```env
PROJECT_NAME="NextHire — AI Resume Analyzer"
SECRET_KEY="your-secure-jwt-secret-key"
DATABASE_URL="sqlite:///./nexthire.db" # Or postgresql://user:pass@localhost:5432/nexthire
AI_PROVIDER="gemini" # gemini, openai, or heuristic
AI_API_KEY="your-google-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"
MAX_FILE_SIZE_MB=10
```

---

## 🧪 Testing

Run the integration test suite:

```bash
python backend/tests/test_full_journey.py
```
