import json
from typing import Dict, Any, List
from app.ai.llm_service import llm_service, clean_json_response

def generate_heuristic_rejection_risks(
    parsed_resume: Dict[str, Any],
    parsed_job: Dict[str, Any],
    missing_skills: List[str],
    scores: Dict[str, float]
) -> List[Dict[str, Any]]:
    risks = []

    # 1. Missing Core Requirements (High Risk)
    req_missing = [s for s in missing_skills if s in parsed_job.get("required_skills", [])]
    if req_missing:
        top_missing = req_missing[:2]
        risks.append({
            "risk_title": f"Possible rejection reason: Missing required {', '.join(top_missing)} experience",
            "risk_level": "High Risk",
            "evidence": f"The job description lists {', '.join(top_missing)} as mandatory requirements, but neither keyword nor corresponding project implementation appears in the resume.",
            "affected_requirement": f"Required Skill: {', '.join(top_missing)}",
            "recommendation": f"If you have used {', '.join(top_missing)} in personal projects or coursework, highlight it explicitly with code repository links."
        })

    # 2. Experience Disparity (High / Medium Risk)
    res_years = parsed_resume.get("total_years_experience", 1.0)
    job_years = parsed_job.get("experience_years_required", 2.0)
    if job_years > 0 and res_years < job_years:
        gap = round(job_years - res_years, 1)
        risk_lvl = "High Risk" if gap >= 2.0 else "Medium Risk"
        risks.append({
            "risk_title": f"Estimated risk: Seniority / Experience gap of ~{gap} years",
            "risk_level": risk_lvl,
            "evidence": f"The target job requests {job_years}+ years of professional experience, whereas parsed resume history indicates ~{res_years} years.",
            "affected_requirement": f"{job_years}+ Years Professional Experience",
            "recommendation": "Emphasize high-complexity project depth, production deployments, and open-source contributions to offset formal years disparity."
        })

    # 3. Missing Cloud or Deployment Infrastructure (Medium Risk)
    cloud_keywords = ["AWS", "Docker", "Kubernetes", "GCP", "CI/CD", "Azure"]
    job_has_cloud = [c for c in cloud_keywords if c.lower() in str(parsed_job).lower()]
    resume_has_cloud = [c for c in cloud_keywords if c.lower() in str(parsed_resume).lower()]
    missing_cloud = [c for c in job_has_cloud if c not in resume_has_cloud]
    if missing_cloud:
        risks.append({
            "risk_title": f"Likely recruiter concern: Limited production deployment/cloud evidence ({', '.join(missing_cloud[:2])})",
            "risk_level": "Medium Risk",
            "evidence": f"The target role emphasizes modern cloud/DevOps workflows ({', '.join(missing_cloud[:2])}), while current resume focuses primarily on localized application code.",
            "affected_requirement": f"Cloud & Deployment Infrastructure: {', '.join(missing_cloud[:2])}",
            "recommendation": "Containerize your flagship full-stack project with Docker and deploy to a free/low-cost cloud tier (e.g. Render, AWS Free Tier, Railway) and link the live URL."
        })

    # 4. Metric / Measurable Outcome deficit (Low Risk)
    risks.append({
        "risk_title": "Likely recruiter concern: Project descriptions lack quantifiable business metrics",
        "risk_level": "Low Risk",
        "evidence": "Bullet points describe functional responsibilities rather than measurable business impact (e.g., % performance increase, query speedups, user counts).",
        "affected_requirement": "Impact-Oriented Engineering Delivery",
        "recommendation": "Structure bullet points with the XYZ framework: Accomplished [X] as measured by [Y] by doing [Z]."
    })

    return risks

async def generate_rejection_risks(
    parsed_resume: Dict[str, Any],
    parsed_job: Dict[str, Any],
    missing_skills: List[str],
    scores: Dict[str, float]
) -> List[Dict[str, Any]]:
    """Generate explainable rejection risks with evidence and recommendations."""
    baseline = generate_heuristic_rejection_risks(parsed_resume, parsed_job, missing_skills, scores)

    prompt = f"""
Candidate Resume:
Skills: {parsed_resume.get('skills', [])}
Experience Years: {parsed_resume.get('total_years_experience', 1.0)}

Job:
Required: {parsed_job.get('required_skills', [])}
Preferred: {parsed_job.get('preferred_skills', [])}
Required Years: {parsed_job.get('experience_years_required', 0)}

Missing Skills: {missing_skills}

Generate 3-5 possible rejection concerns with non-guaranteed probabilistic language ("Possible rejection reason", "Estimated risk", "Likely recruiter concern").
Provide evidence directly from resume vs job for each. Do NOT invent fake qualifications.
Output valid JSON array:
[
  {{
    "risk_title": "string",
    "risk_level": "High Risk",
    "evidence": "string",
    "affected_requirement": "string",
    "recommendation": "string"
  }}
]
"""
    try:
        res = await llm_service.generate_completion(
            system_prompt="You are an expert AI Recruiter analyzing potential candidate rejection vectors with evidence. Return JSON array only.",
            user_prompt=prompt,
            temperature=0.2
        )
        if res:
            ai_risks = json.loads(clean_json_response(res))
            if isinstance(ai_risks, list) and len(ai_risks) > 0:
                return ai_risks
    except Exception as e:
        print(f"[rejection_predictor] LLM fallback: {e}")

    return baseline
