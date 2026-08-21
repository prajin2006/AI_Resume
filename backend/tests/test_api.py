import pytest
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

def test_auth_and_user_flow():
    email = f"test_{os.urandom(4).hex()}@example.com"
    # 1. Register
    reg_res = client.post("/api/auth/register", json={
        "name": "Sarah Connor",
        "email": email,
        "password": "SecurePassword123!"
    })
    assert reg_res.status_code == 200
    token = reg_res.json()["access_token"]
    assert token is not None

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Profile
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Sarah Connor"

    # 3. Create Sample Resume
    resume_res = client.post("/api/resumes/sample", headers=headers)
    assert resume_res.status_code == 200
    resume_id = resume_res.json()["id"]
    assert resume_id > 0
    parsed = resume_res.json()["parsed_data"]
    assert "skills" in parsed
    assert len(parsed["skills"]) > 0

    # 4. Create Sample Job
    job_res = client.post("/api/jobs/sample", headers=headers)
    assert job_res.status_code == 200
    job_id = job_res.json()["id"]
    assert job_id > 0
    job_reqs = job_res.json()["requirements"]
    assert "required_skills" in job_reqs

    # 5. Run Full Analysis
    analysis_res = client.post(f"/api/analysis/{resume_id}/{job_id}", headers=headers)
    assert analysis_res.status_code == 200
    analysis = analysis_res.json()
    assert analysis["overall_score"] > 0
    assert analysis["ats_score"] > 0
    assert len(analysis["matched_skills"]) > 0
    assert len(analysis["rejection_risks"]) > 0
    assert len(analysis["interview_questions"]) > 0
    assert analysis["preparation_gaps"] is not None
    assert len(analysis["improvements"]) > 0

    # Verify Rejection Risk has evidence and non-guaranteed wording
    risk1 = analysis["rejection_risks"][0]
    assert "evidence" in risk1
    assert risk1["risk_level"] in ["High Risk", "Medium Risk", "Low Risk"]

    # 6. Test Context-Aware AI Copilot
    chat_res = client.post("/api/copilot/chat", headers=headers, json={
        "resume_id": resume_id,
        "job_id": job_id,
        "analysis_id": analysis["id"],
        "message": "Why is my match score what it is?"
    })
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert chat_data["role"] == "assistant"
    assert len(chat_data["message"]) > 20

    print("\n[SUCCESS] All Core API & AI Logic End-to-End Tests Passed!")

if __name__ == "__main__":
    test_health()
    test_auth_and_user_flow()
