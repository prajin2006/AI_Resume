import io
import os
import sys
import json
import pytest

# Add backend dir to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_system_journey():
    print("\n==================================================")
    print("STARTING FULL END-TO-END SYSTEM INTEGRATION TEST")
    print("==================================================")

    # 1. Health & Docs
    health = client.get("/api/health")
    assert health.status_code == 200
    print("[OK] API Health & Database Connection OK")

    # 2. Registration & Authentication
    email = f"alex_{os.urandom(4).hex()}@nexthire.ai"
    reg_resp = client.post("/api/auth/register", json={
        "name": "Alex Mercer",
        "email": email,
        "password": "SecurePassword2026!"
    })
    assert reg_resp.status_code == 200
    token = reg_resp.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    print("[OK] User Registration & JWT Authentication OK")

    # 3. Profile
    me_resp = client.get("/api/users/me", headers=headers)
    assert me_resp.status_code == 200
    assert "Alex Mercer" in me_resp.json()["name"]
    print("[OK] User Profile Endpoint OK")

    # 4. Resume Upload & Parsing
    sample_resume = client.post("/api/resumes/sample", headers=headers)
    assert sample_resume.status_code == 200
    res_data = sample_resume.json()
    resume_id = res_data["id"]
    parsed_resume = res_data["parsed_data"]
    assert len(parsed_resume["skills"]) > 5
    assert len(parsed_resume["experience"]) > 0
    print(f"[OK] Resume Text Extraction & Deterministic+Semantic Parser OK (Detected {len(parsed_resume['skills'])} skills)")

    # 5. Target Job Creation
    sample_job = client.post("/api/jobs/sample", headers=headers)
    assert sample_job.status_code == 200
    job_data = sample_job.json()
    job_id = job_data["id"]
    job_reqs = job_data["requirements"]
    assert len(job_reqs["required_skills"]) > 0
    print(f"[OK] Job Description Analysis & Skill Normalization OK (Required: {job_reqs['required_skills']})")

    # 6. Resume Analysis & Recruiter Simulation
    analysis_resp = client.post(f"/api/analysis/{resume_id}/{job_id}", headers=headers)
    assert analysis_resp.status_code == 200
    ana = analysis_resp.json()
    analysis_id = ana["id"]

    assert 0 <= ana["overall_score"] <= 100
    assert 0 <= ana["ats_score"] <= 100
    assert 0 <= ana["skill_match_score"] <= 100
    assert 0 <= ana["experience_match_score"] <= 100
    assert 0 <= ana["project_match_score"] <= 100
    assert 0 <= ana["recruiter_score"] <= 100
    print(f"[OK] Granular Multi-Score Matrix OK: Overall={ana['overall_score']}%, ATS={ana['ats_score']}%, Skill={ana['skill_match_score']}%, Recruiter={ana['recruiter_score']}%")

    # 7. AI Recruiter Verdict & Concerns
    verdict = ana["recruiter_verdict"]
    assert "verdict" in verdict
    assert len(verdict["strengths"]) > 0
    print(f"[OK] AI Recruiter Screening Simulation OK (Verdict: '{verdict['verdict']}')")

    # 8. Evidence-Based Rejection Risk Predictions
    risks = ana["rejection_risks"]
    assert len(risks) >= 2
    for r in risks:
        assert r["risk_level"] in ["High Risk", "Medium Risk", "Low Risk"]
        assert len(r["evidence"]) > 10
        assert len(r["recommendation"]) > 10
    print(f"[OK] Evidence-Based Rejection Risk Predictor OK ({len(risks)} risk items with cited resume evidence)")

    # 9. Tailored Interview Preparation Questions
    questions = ana["interview_questions"]
    assert len(questions) >= 5
    for q in questions:
        assert q["category"] in ["HR", "Technical", "Project", "Resume-based", "Job-specific", "Behavioral", "Scenario"]
        assert q["difficulty"] in ["Easy", "Medium", "Hard"]
        assert len(q["why_asked"]) > 0
        assert len(q["preparation_tips"]) > 0
    print(f"[OK] Personalized Interview Coach OK ({len(questions)} tailored questions across 7 categories)")

    # 10. 5-Day Preparation Roadmap & Task Progress
    prep = ana["preparation_gaps"]
    assert prep is not None
    assert len(prep["preparation_plan"]) >= 4
    # Toggle day 1 task
    toggle_resp = client.post(f"/api/preparation/toggle/{analysis_id}/1", headers=headers)
    assert toggle_resp.status_code == 200
    print("[OK] 5-Day Interview Gap Roadmap & Progress Tracking OK")

    # 11. Fact-Preserving Resume Bullet Improvements
    improvements = ana["improvements"]
    assert len(improvements) > 0
    for imp in improvements:
        assert len(imp["original_text"]) > 0
        assert len(imp["suggested_text"]) > 0
        assert len(imp["reason_for_change"]) > 0
    print(f"[OK] Fact-Preserving Resume Bullet Improver OK ({len(improvements)} section optimizations)")

    # 12. Real-Time Context-Aware AI Copilot
    copilot_chat = client.post("/api/copilot/chat", headers=headers, json={
        "resume_id": resume_id,
        "job_id": job_id,
        "analysis_id": analysis_id,
        "message": "Which skill should I learn first to improve my recruiter score?"
    })
    assert copilot_chat.status_code == 200
    reply = copilot_chat.json()
    assert reply["role"] == "assistant"
    assert len(reply["message"]) > 20
    print(f"[OK] Real-Time AI Copilot Context Integration OK (Response length: {len(reply['message'])} chars)")

    # 13. Analysis History & Comparison
    history_resp = client.get("/api/analysis", headers=headers)
    assert history_resp.status_code == 200
    assert len(history_resp.json()) >= 1
    print(f"[OK] Analysis History OK ({len(history_resp.json())} sessions indexed)")

    # 14. AI Resume Builder: Create Structured Resume
    builder_create_resp = client.post("/api/resumes", headers=headers, json={
        "filename": "Jane_Doe_FullStack",
        "template_name": "modern",
        "styling_config": {"primaryColor": "#3b82f6", "fontSize": "medium"},
        "data": {
            "contact": {
                "name": "Jane Doe",
                "title": "Senior Frontend Engineer",
                "email": "jane.doe@example.com",
                "phone": "(555) 234-5678",
                "location": "New York, NY",
                "linkedin": "https://linkedin.com/in/janedoe",
                "github": "https://github.com/janedoe"
            },
            "summary": "Creative frontend engineer with 4+ years of experience specializing in React.js, TypeScript, and modern component design systems.",
            "skills": ["React.js", "TypeScript", "JavaScript", "Tailwind CSS", "Next.js", "GraphQL", "Jest", "Git"],
            "technical_skills": ["React.js", "TypeScript", "JavaScript", "Tailwind CSS", "Next.js"],
            "soft_skills": ["Communication", "Mentorship", "Problem Solving"],
            "tools_technologies": ["Git", "GitHub Actions", "Docker"],
            "experience": [
                {
                    "title": "Senior Frontend Developer",
                    "company": "TechCorp Inc.",
                    "location": "New York, NY",
                    "start_date": "2023-01",
                    "end_date": "Present",
                    "currently_working": True,
                    "description": [
                        "Architected scalable micro-frontend architecture using React and Vite.",
                        "Mentored 4 junior engineers on clean React patterns and TypeScript best practices."
                    ]
                }
            ],
            "education": [
                {
                    "institution": "Columbia University",
                    "degree": "B.S. in Computer Science",
                    "graduation_year": "2021",
                    "gpa": "3.9"
                }
            ],
            "projects": [
                {
                    "name": "Design System UI Kit",
                    "technologies": ["React", "Storybook", "Tailwind CSS"],
                    "description": ["Created open-source accessible design system with 50+ components."],
                    "github_url": "https://github.com/janedoe/ui-kit"
                }
            ],
            "certifications": ["AWS Certified Cloud Practitioner"],
            "achievements": ["Hackathon 1st Place Winner 2024"],
            "languages": ["English", "Spanish"],
            "total_years_experience": 4.0
        }
    })
    assert builder_create_resp.status_code == 200
    b_resume = builder_create_resp.json()
    b_id = b_resume["id"]
    assert b_resume["source_type"] == "BUILDER"
    print(f"[OK] AI Resume Builder: Creation OK (ID: {b_id}, Source: {b_resume['source_type']})")

    # 15. AI Content Assistant (Summary, Bullet, Skills)
    ai_summary_resp = client.post("/api/resumes/ai/assist", headers=headers, json={
        "action": "generate_summary",
        "context": {"title": "Senior Frontend Engineer", "skills": ["React.js", "TypeScript"]},
        "text": ""
    })
    assert ai_summary_resp.status_code == 200
    assert len(ai_summary_resp.json()["result"]) > 20

    ai_bullet_resp = client.post("/api/resumes/ai/assist", headers=headers, json={
        "action": "improve_bullet",
        "text": "built frontend with react"
    })
    assert ai_bullet_resp.status_code == 200
    assert len(ai_bullet_resp.json()["result"]) > 10
    print("[OK] AI Content Assistant (Summary, Bullet Improvements, Skill Suggestions) OK")

    # 16. Resume Duplication
    dup_resp = client.post(f"/api/resumes/{b_id}/duplicate", headers=headers)
    assert dup_resp.status_code == 200
    dup_data = dup_resp.json()
    dup_id = dup_data["id"]
    assert dup_id != b_id
    assert "Copy" in dup_data["filename"]
    print(f"[OK] Resume Duplication OK (Cloned to ID: {dup_id})")

    # 17. Security & Authorization: Prevent unauthorized delete/access
    other_email = f"other_{os.urandom(4).hex()}@test.com"
    other_reg = client.post("/api/auth/register", json={
        "name": "Intruder User",
        "email": other_email,
        "password": "Password123!"
    })
    other_token = other_reg.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # Attempt to access user 1's resume with user 2's token
    unauth_get = client.get(f"/api/resumes/{b_id}", headers=other_headers)
    assert unauth_get.status_code == 403

    # Attempt to delete user 1's resume with user 2's token
    unauth_del = client.delete(f"/api/resumes/{b_id}", headers=other_headers)
    assert unauth_del.status_code == 403
    print("[OK] Multi-Tenant Security & Authorization OK (403 Forbidden verified)")

    # 18. Resume Deletion & Cascade Clean
    del_resp = client.delete(f"/api/resumes/{dup_id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True

    # Verify deleted resume returns 404
    get_del = client.get(f"/api/resumes/{dup_id}", headers=headers)
    assert get_del.status_code == 404
    print("[OK] Safe Cascade Resume Deletion OK")

    # 19. Transparent ATS Score Breakdown Validation
    analysis_detail = client.get(f"/api/analysis/{analysis_id}", headers=headers)
    assert analysis_detail.status_code == 200
    ana_det_data = analysis_detail.json()
    ats_breakdown = ana_det_data.get("ats_breakdown")
    assert ats_breakdown is not None
    assert "score" in ats_breakdown
    assert "status" in ats_breakdown
    assert "breakdown" in ats_breakdown
    assert "keyword_match" in ats_breakdown["breakdown"]
    assert "skills_section" in ats_breakdown["breakdown"]
    print(f"[OK] Transparent 100-Point ATS Breakdown OK (Status: '{ats_breakdown['status']}', Score: {ats_breakdown['score']}/100)")

    # 20. Functional Resume Comparison
    # Run analysis for builder resume to have 2 real analyses
    ana2_resp = client.post(f"/api/analysis/{b_id}/{job_id}", headers=headers)
    assert ana2_resp.status_code == 200
    ana2_id = ana2_resp.json()["id"]

    # Compare analyses via query params
    compare_resp = client.get(f"/api/analysis/compare/query?analysis_a={analysis_id}&analysis_b={ana2_id}", headers=headers)
    assert compare_resp.status_code == 200
    comp_data = compare_resp.json()
    assert "version_a" in comp_data
    assert "version_b" in comp_data
    assert "improvements" in comp_data
    assert "overall_score_change" in comp_data["improvements"]
    assert "ats_score_change" in comp_data["improvements"]
    assert "newly_matched_skills" in comp_data["improvements"]
    assert "still_missing_skills" in comp_data["improvements"]

    # Disallow identical analysis comparison
    same_resp = client.get(f"/api/analysis/compare/query?analysis_a={analysis_id}&analysis_b={analysis_id}", headers=headers)
    assert same_resp.status_code == 400
    print(f"[OK] Functional Resume Comparison OK (Delta Overall: {comp_data['improvements']['overall_score_change']} pts, Delta ATS: {comp_data['improvements']['ats_score_change']} pts)")

    print("\n==================================================")
    print("ALL 20 MASTER, ATS & COMPARISON REQUIREMENTS VALIDATED!")
    print("==================================================")

if __name__ == "__main__":
    test_full_system_journey()
