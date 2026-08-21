from typing import Dict, Any, List
from app.ai.llm_service import llm_service, clean_json_response
import json

def generate_heuristic_recruiter_verdict(
    parsed_resume: Dict[str, Any],
    parsed_job: Dict[str, Any],
    scores: Dict[str, float],
    matched_skills: List[str],
    missing_skills: List[str]
) -> Dict[str, Any]:
    overall = scores.get("overall_score", 75.0)
    if overall >= 82:
        verdict = "Strong Fit"
        summary = "The candidate demonstrates solid alignment with core technical requirements and relevant project exposure."
    elif overall >= 65:
        verdict = "Potential Fit with Gaps"
        summary = "The candidate demonstrates good foundational competencies but exhibits notable gaps in specific required tools or production experience."
    else:
        verdict = "High Risk / Significant Gaps"
        summary = "The profile reveals substantial divergence between required technologies/seniority and current resume evidence."

    strengths = []
    if matched_skills:
        strengths.append(f"Strong overlap in core skills: {', '.join(matched_skills[:4])}.")
    if parsed_resume.get("projects"):
        strengths.append(f"Practical portfolio demonstrates hands-on implementation across {len(parsed_resume['projects'])} projects.")
    if scores.get("ats_score", 70) >= 80:
        strengths.append("Clear ATS-compliant structure and well-delineated contact/education sections.")

    concerns = []
    if missing_skills:
        concerns.append(f"Missing direct evidence for required stack: {', '.join(missing_skills[:3])}.")
    exp_diff = parsed_job.get("experience_years_required", 2.0) - parsed_resume.get("total_years_experience", 1.0)
    if exp_diff > 0.5:
        concerns.append(f"Estimated experience ({parsed_resume.get('total_years_experience')} yrs) falls below job requirement ({parsed_job.get('experience_years_required')} yrs).")

    missing_quals = missing_skills[:4]
    improvements = [
        f"Incorporate concrete projects demonstrating proficiency with {', '.join(missing_skills[:2])} if you possess actual hands-on experience.",
        "Quantify project achievements using metrics (e.g., latency reduction, user throughput, test coverage).",
        "Align technical summary directly to targeted role responsibilities."
    ]

    return {
        "verdict": verdict,
        "summary": summary,
        "strengths": strengths,
        "concerns": concerns,
        "missing_qualifications": missing_quals,
        "recommended_improvements": improvements
    }

async def generate_recruiter_review(
    parsed_resume: Dict[str, Any],
    parsed_job: Dict[str, Any],
    scores: Dict[str, float],
    matched_skills: List[str],
    missing_skills: List[str]
) -> Dict[str, Any]:
    """Simulate AI Recruiter screening review with deterministic baseline + LLM enrichment."""
    baseline = generate_heuristic_recruiter_verdict(parsed_resume, parsed_job, scores, matched_skills, missing_skills)

    prompt = f"""
Candidate Resume:
Skills: {parsed_resume.get('skills', [])}
Experience Years: {parsed_resume.get('total_years_experience', 1.0)}
Projects: {[p.get('name') for p in parsed_resume.get('projects', [])]}

Job Description:
Title: {parsed_job.get('title', '')}
Required Skills: {parsed_job.get('required_skills', [])}
Preferred Skills: {parsed_job.get('preferred_skills', [])}
Required Years: {parsed_job.get('experience_years_required', 0)}

Scores: {scores}
Matched: {matched_skills}
Missing: {missing_skills}

Generate recruiter screening verdict. Do not invent experience. Output valid JSON:
{{
  "verdict": "Potential Fit with Gaps",
  "summary": "...",
  "strengths": ["..."],
  "concerns": ["..."],
  "missing_qualifications": ["..."],
  "recommended_improvements": ["..."]
}}
"""
    try:
        res = await llm_service.generate_completion(
            system_prompt="You are an expert technical recruiter evaluating a candidate resume against a job. Be objective and factual. Return JSON only.",
            user_prompt=prompt,
            temperature=0.2
        )
        if res:
            ai_verdict = json.loads(clean_json_response(res))
            if ai_verdict.get("verdict"):
                baseline.update(ai_verdict)
    except Exception as e:
        print(f"[recruiter] LLM review fallback: {e}")

    return baseline
